const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'qa'), { recursive: true });
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || /(?:private-backups|\.git|qa)[\/]/.test(file.slice(root.length))) throw new Error('denied');
    const body = fs.readFileSync(file);
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp' };
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
(async () => {
  let browser;
  const errors = [];
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.DEMO_URL || 'http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.EEDemo?.snapshot().ready);
    await page.mouse.move(0,0);
    const initial = await page.evaluate(() => EEDemo.snapshot());
    assert.equal(initial.teams.length, 50);
    assert.equal(initial.tracks.length, 5);
    assert(initial.tracks.every(t => t.teamCount === 10));
    assert.equal(new Set(initial.teams.map(t => t.id)).size, 50);
    assert.equal(initial.totalTokens, initial.teams.reduce((sum, t) => sum + t.tokens, 0));
    assert.equal(initial.positions.length, 50);
    assert(initial.positions.every(p => p.x > 80 && p.x < 1840 && p.y > 350 && p.y < 980));
    assert(initial.teams.every(t => t.status === (t.activeRequests > 0 ? 'active' : 'idle')));
    assert(initial.teams.every(t => t.tokens === 0 && t.activeRequests === 0 && t.status === 'idle'));
    assert.equal(initial.totalTokens, 0);
    // Every combined label + desk stays separate from all other workstations.
    for(let i=0;i<50;i++) for(let j=i+1;j<50;j++) {
      const a=initial.positions[i],b=initial.positions[j];
      assert(Math.abs(a.x-b.x)>=106 || Math.abs(a.y-b.y)>=151, 'overlap '+i+','+j);
    }
    assert.equal(await page.locator('#total-requests,#detail-requests,#detail-input,#detail-output').count(),0);
    assert(!/累计调用|账户余额|累计消费|金额/.test(await page.locator('body').innerText()));
    await page.screenshot({ path: path.join(root, 'qa', 'tracks50-desktop.png') });
    await page.screenshot({ path: path.join(root, 'qa', 'tracks50-detail.png'), clip: { x: 56, y: 270, width: 608, height: 375 } });
    await page.waitForTimeout(1800);
    assert.deepEqual((await page.evaluate(() => EEDemo.snapshot())).teams, initial.teams);
    // Click all labels to ensure group/usage ownership matches every rendered seat.
    for(let i=0;i<50;i++) {
      const p=initial.positions[i];
      await page.mouse.click(p.x,p.y-73);
      assert.equal(await page.locator('#detail-name').textContent(),initial.teams[i].name);
      assert.equal(await page.locator('#detail-tokens').textContent(),initial.teams[i].tokens.toLocaleString('en-US'));
      await page.keyboard.press('Escape');
    }
    await page.locator('#team-select').selectOption('49');
    assert.match(await page.locator('#detail-track').textContent(), /创意整活与数字文娱/);
    assert.match(await page.locator('#detail-state').textContent(), /休息/);
    await page.keyboard.press('Escape');
    await page.setViewportSize({width:1366,height:768});
    await page.waitForFunction(() => document.querySelector('#screen').getBoundingClientRect().width < 1367);
    const box = await page.locator('#screen').boundingBox();
    assert(box.x >= -1 && box.y >= -1 && box.width <= 1367 && box.height <= 769);
    await page.screenshot({path:path.join(root,'qa','tracks50-projector.png')});
    for(let i=0;i<4;i++) {
      await page.waitForTimeout(500);
      const live=await page.evaluate(() => EEDemo.snapshot());
      assert(live.teams.every(t => t.tokens===0 && t.activeRequests===0 && t.status==='idle'));
      assert.equal(live.totalTokens,0,'usage remains zero until real data is connected');
    }
    await page.locator('#fullscreen').click();
    assert(await page.evaluate(() => Boolean(document.fullscreenElement)));
    await page.evaluate(() => document.exitFullscreen());
    if(!process.env.DEMO_URL){
      await page.goto(require('node:url').pathToFileURL(path.join(root,'index.html')).href);
      await page.waitForFunction(()=>window.EEDemo?.snapshot().ready);
      assert.equal((await page.evaluate(()=>EEDemo.snapshot())).teams.length,50);
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({pass:true,teams:50,zeroUsageUntilIntegration:true,tracks:initial.tracks.map(t=>({name:t.name,count:t.teamCount})),tokensOnly:true,allSeatsClickable:true,viewport:box,errors}));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

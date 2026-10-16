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
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.EEDemo?.snapshot().ready);
    await page.locator('#pause').click();
    const initial = await page.evaluate(() => EEDemo.snapshot());
    assert.equal(initial.teams.length, 48);
    assert.equal(initial.totalTokens, initial.teams.reduce((sum, t) => sum + t.input + t.output, 0));
    assert.equal(initial.totalRequests, initial.teams.reduce((sum, t) => sum + t.requests, 0));
    assert.equal(initial.positions.length, 48);
    assert(initial.positions.every(p => p.x > 90 && p.x < 1830 && p.y > 360 && p.y < 900));
    await page.screenshot({ path: path.join(root, 'qa', 'desktop-gold.png') });
    await page.screenshot({ path: path.join(root, 'qa', 'characters-gold.png'), clip: { x: 77, y: 304, width: 566, height: 327 } });
    await page.waitForTimeout(1800);
    assert.deepEqual((await page.evaluate(() => EEDemo.snapshot())).teams, initial.teams);
    await page.locator('#team-select').selectOption('47');
    assert.match(await page.locator('#detail-name').textContent(), /48/);
    assert.equal(await page.locator('#detail-tokens').textContent(), (initial.teams[47].input + initial.teams[47].output).toLocaleString('en-US'));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#detail').isVisible(), false);
    await page.mouse.click(initial.positions[0].x, initial.positions[0].y - 60);
    assert.match(await page.locator('#detail-name').textContent(), /01/);
    await page.screenshot({ path: path.join(root, 'qa', 'detail-gold.png') });
    await page.keyboard.press('Escape');
    await page.locator('[data-layout=islands]').click();
    assert.equal((await page.evaluate(() => EEDemo.snapshot())).layout, 'islands');
    await page.screenshot({ path: path.join(root, 'qa', 'islands-gold.png') });
    await page.locator('[data-layout=auditorium]').click();
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForFunction(() => document.querySelector('#screen').getBoundingClientRect().width < 1367);
    const box = await page.locator('#screen').boundingBox();
    assert(box.x >= -1 && box.y >= -1 && box.width <= 1367 && box.height <= 769);
    await page.screenshot({ path: path.join(root, 'qa', 'projector-1366.png') });
    await page.locator('#pause').click();
    await page.waitForTimeout(1900);
    assert((await page.evaluate(() => EEDemo.snapshot())).totalTokens > initial.totalTokens);
    await page.locator('#fullscreen').click();
    assert(await page.evaluate(() => Boolean(document.fullscreenElement)));
    await page.evaluate(() => document.exitFullscreen());
    await page.goto(require('node:url').pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => window.EEDemo?.snapshot().ready);
    assert.equal((await page.evaluate(() => EEDemo.snapshot())).teams.length, 48);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ pass: true, teams: initial.teams.length, tokens: initial.totalTokens, requests: initial.totalRequests, viewport: box, errors }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

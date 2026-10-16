const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-18T12:59:58+08:00') });
    await page.goto(process.env.DEMO_URL || pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => EEDemo.snapshot().ready);
    await page.clock.pauseAt(new Date('2026-10-18T12:59:59+08:00'));
    assert.equal(await page.locator('#countdown-time').textContent(), '00:00:01');
    await page.clock.runFor(1000);
    assert.equal(await page.locator('#countdown-label').textContent(), '距离结束');
    assert.equal(await page.locator('#countdown-time').textContent(), '04:00:00');
    assert.equal(await page.evaluate(() => document.querySelector('#scene').width), 3840);
    assert.equal(await page.evaluate(() => document.querySelector('#scene').getContext('2d').imageSmoothingEnabled), false);
    await page.screenshot({ path: path.resolve(__dirname, '../qa/countdown-hidpi.png') });
    await page.clock.fastForward(4 * 3600000);
    assert.equal(await page.locator('#countdown-label').textContent(), '活动已结束');
    assert.equal(await page.locator('#countdown-time').textContent(), '00:00:00');
    await page.reload();
    await page.waitForFunction(() => EEDemo.snapshot().ready);
    assert.equal(await page.locator('#countdown-label').textContent(), '活动已结束');
    assert.deepEqual(errors, []);
    console.log('Display: 2x pixel density, countdown independent of animation, start/end transitions and reload passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

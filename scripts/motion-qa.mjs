import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const evidence = '../网站示意图/.omo/evidence/';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const results = [];
try {
  for (const rate of [1, 8]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...(rate === 1 ? { recordVideo: { dir: evidence + 'recording', size: { width: 390, height: 844 } } } : {}) });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await page.goto('http://127.0.0.1:4176');
    await page.getByRole('button', { name: '点亮星光', exact: true }).click();
    await expect(page.locator('[data-graphics="webgl"]')).toBeVisible();
    const fps = await page.evaluate(() => new Promise(resolve => {
      const deltas = [];
      let last = performance.now();
      const start = last;
      function frame(now) {
        deltas.push(now-last); last = now;
        if (now-start < 20000) requestAnimationFrame(frame);
        else resolve({ seconds: (now-start)/1000, frames: deltas.length, averageFps: deltas.length / ((now-start)/1000), p95FrameMs: [...deltas].sort((a,b)=>a-b)[Math.floor(deltas.length*.95)] });
      }
      requestAnimationFrame(frame);
    }));
    await expect(page.getByRole('button', { name: '许个愿', exact: true })).toBeEnabled();
    results.push({ cpuThrottle: rate, ...fps, graphics: await page.locator('.stage-art').getAttribute('data-graphics'), canvasCount: await page.locator('canvas').count() });
    await page.screenshot({ path: evidence + `motion-${rate}x.png` });
    const video = page.video();
    await context.close();
    if (video) await video.saveAs(evidence + 'task-2-cake.webm');
    console.log('motion sample', rate, fps);
  }
  await fs.writeFile(evidence + 'motion-performance.json', JSON.stringify({ browser: await browser.version(), note: 'Desktop Chrome emulation, not real phone; rAF cadence is not GPU render FPS. Normal recording may add overhead.', results }, null, 2));
} finally { await browser.close(); }

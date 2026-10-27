import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const dir = '../网站示意图/.omo/evidence/orbit-refinement/';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const results = [];
try {
  for (const rate of [1, 8]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...(rate === 1 ? { recordVideo: { dir: dir + 'recording', size: { width: 390, height: 844 } } } : {}) });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await page.goto('http://127.0.0.1:4176');
    await page.getByRole('button', { name: '点亮星光', exact: true }).click();
    await page.getByRole('button', { name: '直接吹灭', exact: true }).click();
    await expect(page.getByRole('button', { name: '看看我们的宇宙', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '看看我们的宇宙', exact: true }).click();
    await expect(page.locator('[data-planet]')).toHaveCount(4);
    const cadence = await page.evaluate(() => new Promise(resolve => {
      const start = performance.now(); let previous = start; const frames = [];
      const sample = now => { frames.push(now - previous); previous = now; if (now - start < 20000) requestAnimationFrame(sample); else resolve({ duration: (now-start)/1000, frames: frames.length, averageFps: frames.length/((now-start)/1000), p95FrameMs: [...frames].sort((a,b)=>a-b)[Math.floor(frames.length*.95)] }); };
      requestAnimationFrame(sample);
    }));
    results.push({ cpuRate: rate, ...cadence, errors, canvas: await page.locator('canvas').count() });
    if (rate === 1) {
      const map = page.getByTestId('orbit-map'); const box = await map.boundingBox();
      await page.mouse.move(box.x + box.width/2, box.y + box.height/2); await page.mouse.down(); await page.mouse.move(box.x + box.width/2 - 95, box.y + box.height/2, { steps: 16 }); await page.mouse.up();
      const planet = page.getByRole('button', { name: '打开回忆：一起看海' }); await planet.hover({ force: true }); await planet.click();
      await page.screenshot({ path: dir + 'memory-detail.png', fullPage: true }); await page.keyboard.press('Escape');
      for (const width of [375, 390, 430, 1440]) { await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 }); await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); await page.screenshot({ path: dir + `universe-${width}.png`, fullPage: true }); }
    }
    const video = page.video(); await context.close(); if (video) await video.saveAs(dir + 'orbit-motion.webm');
    console.log('orbit cadence', rate, cadence);
  }
  await fs.writeFile(dir + 'motion-cadence.json', JSON.stringify({ browser: await browser.version(), environment: 'Windows headless Chrome, production4176, viewport390x844,DPR1,normal and8xCPU,20second rAFcadence (notGPUfps orrealdevice)', results }, null, 2));
} finally { await browser.close(); }

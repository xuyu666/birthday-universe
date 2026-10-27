import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const evidence = '../网站示意图/.omo/evidence/';
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const runs = [];
try {
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.clearBrowserCache');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8 });
    await page.addInitScript(() => {
      window.giftMetrics = { lcp: 0, cls: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.giftMetrics.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.giftMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('http://127.0.0.1:4176', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '点亮星光', exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    runs.push(await page.evaluate(() => ({ ...window.giftMetrics, entries: performance.getEntriesByType('resource').map(entry => ({ url: entry.name, size: entry.transferSize })) })));
    await context.close();
  }
  const median = values => [...values].sort((a,b) => a-b)[1];
  const results = { browser: await browser.version(), environment: 'Windows desktop headless Chrome, 390x844, DPR1, 4x CPU, 1.6Mbps down/750Kbps up/RTT150ms, production Vite preview, cache disabled', runs, medianLcp: median(runs.map(run => run.lcp)), medianCls: median(runs.map(run => run.cls)) };
  await fs.writeFile(evidence + 'performance.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }

import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await page.getByRole('button', { name: '直接吹灭', exact: true }).click();
  await page.getByRole('button', { name: '跳过动画', exact: true }).click();
  await page.getByRole('button', { name: '看看我们的宇宙', exact: true }).click();
  await expect(page.locator('[data-planet]')).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '../网站示意图/.omo/evidence/orbit-refinement/mobile-draft.png', fullPage: true });
  console.log('errors', errors, 'motion', await page.getByTestId('orbit-map').getAttribute('data-motion'));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: '../网站示意图/.omo/evidence/orbit-refinement/desktop-draft.png', fullPage: true });
} finally { await browser.close(); }

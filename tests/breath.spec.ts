import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { universe } from './helpers';
async function begin(page: Page): Promise<Locator> {
  await page.goto('/'); await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await expect(page.locator('.stage-art')).toHaveAttribute('data-graphics', /webgl|fallback/);
  return page.getByRole('button', { name: '按住蓄气，松开吹蜡烛', exact: true });
}
async function hold(page: Page, button: Locator, ms: number): Promise<void> {
  const box = await button.boundingBox(); if (!box) throw new TypeError('Breath button missing');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await expect(button).toHaveAttribute('aria-pressed', 'true'); await page.waitForTimeout(ms);
}
test('gentle breath extinguishes one candle, then a full breath finishes the ritual', async ({ page }) => {
  const button = await begin(page); await button.click();
  await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '2');
  await expect(page.getByRole('status').filter({ hasText: '还剩 2 支' })).toBeVisible();
  await hold(page, button, 250);
  const scale = await page.locator('.breath-meter').evaluate(e => new DOMMatrixReadOnly(getComputedStyle(e).transform).a);
  expect(scale).toBeGreaterThan(0); expect(scale).toBeLessThan(1);
  await page.waitForTimeout(1050);
  await expect.poll(() => page.locator('.breath-meter').evaluate(e => new DOMMatrixReadOnly(getComputedStyle(e).transform).a)).toBe(1);
  await page.mouse.up(); await expect(page.locator('.gift-app')).toHaveAttribute('data-scene', 'extinguishing');
  await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '0');
});
test('medium breath, keyboard release and replay preserve the candle lifecycle', async ({ page }) => {
  const button = await begin(page); await button.focus(); await page.keyboard.down('Space');
  await page.waitForTimeout(700); await page.keyboard.up('Space');
  await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '1');
  await button.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.gift-app')).toHaveAttribute('data-scene', 'extinguishing');
  const skip = page.getByRole('button', { name: '跳过动画', exact: true }); if (await skip.isVisible()) await skip.click();
  await page.getByRole('button', { name: '看看我们的宇宙' }).click(); await page.getByRole('button', { name: '重新点亮' }).click();
  await page.getByRole('button', { name: '点亮星光', exact: true }).click(); await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '3');
});
test('releasing outside, Escape and losing focus cancel without blowing', async ({ page }) => {
  const button = await begin(page); await hold(page, button, 650); await page.mouse.move(5, 5); await page.mouse.up();
  await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '3');
  await button.focus(); await page.keyboard.down('Space'); await page.keyboard.press('Escape'); await page.keyboard.up('Space');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.down('Space'); await page.keyboard.press('Tab'); await page.keyboard.up('Space');
  await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '3');
});
test('native touch holds and releases without a duplicate blow', async ({ page, context }) => {
  const button = await begin(page); const box = await button.boundingBox(); if (!box) throw new TypeError('Missing button');
  const cdp = await context.newCDPSession(page); const x = box.x + box.width / 2; const y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await page.waitForTimeout(700);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '1');
  await page.waitForTimeout(100); await expect(page.locator('.gift-app')).toHaveAttribute('data-scene', 'cake');
});
test('backgrounding cancels charge and reduced motion keeps deliberate controls usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); const button = await begin(page); await hold(page, button, 100);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(button).toHaveAttribute('aria-pressed', 'false'); await page.mouse.up();
  await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '3');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await hold(page, button, 1250); await page.mouse.up();
  await expect(page.locator('.gift-app')).toHaveAttribute('data-scene', 'extinguishing');
});
test('rotation arrows work repeatedly and reset even with reduced motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await universe(page);
  const first = page.locator('[data-planet=first]'); const initial = await first.getAttribute('style');
  const right = page.getByRole('button', { name: '向右旋转星球' }); await right.click(); await expect.poll(() => first.getAttribute('style')).not.toBe(initial); const turned = await first.getAttribute('style');
  await right.click(); await expect.poll(() => first.getAttribute('style')).not.toBe(turned);
  await page.getByRole('button', { name: '重置视角' }).click(); await expect(first).toHaveAttribute('style', initial ?? '');
});

test('only the initiating key can release a charged breath', async ({ page }) => {
  const button = await begin(page); await button.focus(); await page.keyboard.down('Space'); await page.keyboard.down('Enter'); await page.keyboard.up('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'true'); await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '3');
  await page.keyboard.up('Space'); await expect(page.locator('.stage-art')).toHaveAttribute('data-candles', '2');
});

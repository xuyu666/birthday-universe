import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { universe } from './helpers';

async function frames(page: Page, count = 24): Promise<void> {
  await page.evaluate((n) => new Promise<void>(resolve => { let remaining = n; const next = () => { if (--remaining <= 0) resolve(); else requestAnimationFrame(next); }; requestAnimationFrame(next); }), count);
}
async function pose(page: Page): Promise<string | null> { return page.locator('[data-planet=first]').getAttribute('style'); }

test('removes every visible rose and lets individual planets drift', async ({ page }) => {
  await page.goto('/'); await universe(page);
  await expect(page.locator('[data-planet]')).toHaveCount(4);
  await expect(page.locator('body')).not.toContainText(/玫瑰|rose/i);
  await expect(page.locator('img[src*=rose],img[alt*=玫瑰]')).toHaveCount(0);
  await frames(page, 3); const before = await pose(page); await frames(page);
  expect(await pose(page)).not.toBe(before);
  expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1);
});

test('hover holds the planet steady and releases without a phase jump', async ({ page }) => {
  await page.goto('/'); await universe(page);
  const planet = page.getByRole('button', { name: '打开回忆：一起看海' });
  await planet.hover({ force: true });
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-motion', 'paused');
  await frames(page, 3); const held = await pose(page); await frames(page);
  expect(await pose(page)).toBe(held);
  await planet.click(); await frames(page, 3);
  const open = await pose(page); await frames(page);
  expect(await pose(page)).toBe(open);
  await page.keyboard.press('Escape');
  await expect(planet).toBeFocused();
  await frames(page, 3); const returned = await pose(page); await frames(page);
  expect(await pose(page)).toBe(returned);
});

test('reduced motion disables orbit and surface drift while preserving access', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await universe(page);
  await frames(page, 3); const before = await pose(page); await frames(page);
  expect(await pose(page)).toBe(before);
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-motion', 'paused');
  expect(await page.locator('.planet-surface img').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await page.getByRole('button', { name: '打开回忆：心动瞬间' }).click();
  await expect(page.getByRole('dialog')).toContainText('心动瞬间');
});

test('a drag coasts gently, suppresses click, and a later tap still opens', async ({ page }) => {
  await page.goto('/'); await universe(page);
  const map = page.getByTestId('orbit-map'); const box = await map.boundingBox();
  if (!box) throw new TypeError('Orbit missing');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 - 100, box.y + box.height / 2 + 2, { steps: 10 }); await page.mouse.up();
  await expect(map).toHaveAttribute('data-dragging', 'false');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const released = await pose(page); await frames(page, 12); expect(await pose(page)).not.toBe(released);
  const planet = page.getByRole('button', { name: '打开回忆：第一次见面' });
  await planet.hover({ force: true }); await planet.click();
  await expect(page.getByRole('dialog')).toContainText('第一次见面');
});

test('vertical touch gestures scroll naturally through the star map', async ({ page, context }) => {
  await page.goto('/'); await universe(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 610 }] });
  for (const y of [570, 520, 470, 420, 370]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-dragging', 'false');
});

test('page hiding freezes the scene and discards time away', async ({ page }) => {
  await page.goto('/'); await universe(page);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-motion', 'paused');
  await frames(page, 3); const hidden = await pose(page); await frames(page);
  expect(await pose(page)).toBe(hidden);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await frames(page); expect(await pose(page)).not.toBe(hidden);
});

test('native touch capture transfer keeps horizontal dragging active until release', async ({ page, context }) => {
  await page.goto('/'); await universe(page);
  const box = await page.locator('.planet-body').first().boundingBox();
  if (!box) throw new TypeError('Planet missing');
  const x = box.x + box.width / 2; const y = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (const distance of [15, 35, 55]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + distance, y }] });
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-dragging', 'true');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-dragging', 'false');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('changing the system motion preference pauses existing orbits immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/'); await universe(page);
  await page.mouse.move(10, 10);
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-motion', 'drifting');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-motion', 'paused');
  await frames(page, 3); const reduced = await pose(page); await frames(page);
  expect(await pose(page)).toBe(reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-motion', 'drifting');
});

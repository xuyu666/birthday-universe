import { test, expect } from '@playwright/test';
import { universe } from './helpers';

test('completes with WebGL disabled and audio rejected', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Denied', 'NotAllowedError'));
  });
  await page.goto('/');
  await page.getByRole('button', { name: '开启音乐', exact: true }).click();
  await expect(page.getByRole('button', { name: '重试音乐' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await expect(page.locator('.fallback-cake')).toBeVisible();
  await page.getByRole('button', { name: '许个愿', exact: true }).click();
  await page.getByRole('button', { name: '这次不写' }).click();
  await page.getByRole('button', { name: '直接吹灭' }).click();
  await page.getByRole('button', { name: '跳过动画' }).click();
  await page.getByRole('button', { name: '看看我们的宇宙' }).click();
  await expect(page.getByRole('button', { name: '打开回忆：一起看海' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('uses fallback if the dynamic graphics chunk is blocked', async ({ page }) => {
  await page.route('**/visual/SceneCanvas*', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await expect(page.locator('[data-graphics="fallback"]')).toBeVisible();
  await expect(page.locator('.fallback-cake')).toBeVisible();
  await expect(page.getByRole('button', { name: '许个愿', exact: true })).toBeEnabled();
});

test('dragging a planet by 50px never opens memory and preserves tilt', async ({ page }) => {
  await page.goto('/'); await universe(page);
  const planet = page.getByRole('button', { name: '打开回忆：第一次见面' });
  const box = await planet.boundingBox();
  if (!box) throw new TypeError('Planet was not laid out');
  await page.mouse.move(box.x + box.width / 2, box.y + 25);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 50, box.y + 25, { steps: 5 }); await page.mouse.up();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await planet.hover({ force: true });
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-motion', 'paused');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const before = await planet.boundingBox();
  await planet.click();
  await page.getByRole('button', { name: '关闭弹窗' }).click();
  const after = await planet.boundingBox();
  if (!before || !after) throw new TypeError('Planet not laid out');
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(1);
});

test('image 404 keeps story readable and reduced motion keeps all entries usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/memory-orbit.webp', route => route.fulfill({ status: 404, body: 'not found' }));
  await page.goto('/'); await universe(page);
  await page.getByText('以文字浏览全部回忆', { exact: false }).click();
  for (const name of ['第一次见面', '一起看海', '心动瞬间', '下一个明天']) {
    await page.locator('.memory-list').getByRole('button', { name: new RegExp(name) }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name })).toBeVisible();
    if (name === '心动瞬间') await expect(page.getByText('照片暂时没能抵达')).toBeVisible();
    await page.getByRole('button', { name: '关闭弹窗' }).click();
  }
});

test('context loss preserves the wish and the ritual', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await expect(page.locator('[data-graphics="webgl"]')).toBeVisible();
  await page.getByRole('button', { name: '许个愿', exact: true }).click();
  await page.getByLabel('你的生日愿望').fill('愿我们年年相见');
  await page.getByRole('button', { name: '关闭弹窗' }).click();
  await page.locator('canvas').dispatchEvent('webglcontextlost');
  await expect(page.locator('[data-graphics="fallback"]')).toBeVisible();
  await page.getByRole('button', { name: '许个愿', exact: true }).click();
  await expect(page.getByLabel('你的生日愿望')).toHaveValue('愿我们年年相见');
});

test('reduced motion still rejects a drag ending inside the same planet', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await universe(page);
  const box = await page.getByRole('button', { name: '打开回忆：第一次见面' }).boundingBox();
  if (!box) throw new TypeError('Planet missing');
  await page.mouse.move(box.x + box.width / 2 - 20, box.y + 25);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 10, box.y + 25, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('releasing outside the orbit ends dragging before pointer reentry', async ({ page }) => {
  await page.goto('/'); await universe(page);
  const box = await page.getByTestId('orbit-map').boundingBox();
  if (!box) throw new TypeError('Orbit missing');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 30, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-dragging', 'false');
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 5 });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await expect(page.getByTestId('orbit-map')).toHaveAttribute('data-dragging', 'false');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

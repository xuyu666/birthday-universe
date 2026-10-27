import { test, expect } from '@playwright/test';
const evidence = '../网站示意图/.omo/evidence/';
const wish = '愿我们年年相见';
for (const [width, height] of [[375, 667], [390, 844], [430, 932], [844, 390], [1440, 900]] as const) {
  test(`fits layout and controls at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.route('**/*.woff2', route => route.abort());
    await page.goto('/');
    await expect(page.getByRole('button', { name: '点亮星光', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: evidence + `layout-${width}.png` });
    await page.getByRole('button', { name: '点亮星光', exact: true }).click();
    await expect(page.getByRole('button', { name: '许个愿', exact: true })).toBeVisible();
    if (height > 500) await expect(page.getByRole('button', { name: '许个愿', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('keeps wishes in memory, guards repeat actions, and returns memory focus', async ({ page, context }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url() + (request.postData() ?? '')));
  await page.goto('/');
  await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await page.getByRole('button', { name: '许个愿', exact: true }).click();
  await page.getByLabel('你的生日愿望').fill(wish);
  await page.getByRole('button', { name: '关闭弹窗' }).click();
  await page.getByRole('button', { name: '许个愿', exact: true }).click();
  await expect(page.getByLabel('你的生日愿望')).toHaveValue(wish);
  await page.getByRole('button', { name: '写好了', exact: true }).click();
  await page.getByRole('button', { name: '吹灭蜡烛', exact: true }).evaluate(element => { if (element instanceof HTMLElement) { element.click(); element.click(); } });
  const skip = page.getByRole('button', { name: '跳过动画', exact: true });
  if (await skip.isVisible()) await skip.click();
  await page.getByRole('button', { name: '看看我们的宇宙' }).click();
  const sea = page.getByRole('button', { name: '打开回忆：一起看海' });
  await sea.hover({ force: true });
  await sea.click();
  await expect(page.getByRole('dialog')).toContainText('一个夏天');
  await page.screenshot({ path: evidence + 'task-4-memory.png' });
  await page.getByRole('button', { name: '关闭弹窗' }).click();
  await expect(sea).toBeFocused();
  await page.getByRole('button', { name: '重新点亮', exact: true }).click();
  await page.getByRole('button', { name: '留在这里', exact: true }).click();
  await page.getByRole('button', { name: '重新点亮', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('清空');
  await page.getByRole('button', { name: '清空并重播' }).click();
  await expect(page.getByRole('button', { name: '点亮星光', exact: true })).toBeVisible();
  expect(requests.some(value => value.includes(wish) || value.includes(encodeURIComponent(wish)))).toBe(false);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  expect((await context.cookies()).length).toBe(0);
  expect(errors).toEqual([]);
});

test('handles IME composition, code points and an empty wish', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await page.getByRole('button', { name: '许个愿', exact: true }).click();
  const input = page.getByLabel('你的生日愿望');
  await input.dispatchEvent('compositionstart');
  await input.fill('🌹'.repeat(201));
  await expect(input).toHaveValue('🌹'.repeat(201));
  await input.dispatchEvent('compositionend');
  await expect(input).toHaveValue('🌹'.repeat(200));
  await input.fill('   ');
  await page.getByRole('button', { name: '写好了', exact: true }).click();
  await expect(page.getByRole('button', { name: '直接吹灭', exact: true })).toBeVisible();
});

test('starts fresh after refresh and renders hostile input as plain text', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await page.getByRole('button', { name: '许个愿', exact: true }).click();
  await page.getByLabel('你的生日愿望').fill('<img src=x onerror="alert(1)">');
  await expect(page.locator('dialog img')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await page.getByRole('button', { name: '许个愿', exact: true }).click();
  await expect(page.getByLabel('你的生日愿望')).toHaveValue('');
});

test('supports keyboard dialog escape and focus return', async ({ page }) => {
  await page.goto('/');
  const light = page.getByRole('button', { name: '点亮星光', exact: true });
  await light.focus(); await page.keyboard.press('Enter');
  const button = page.getByRole('button', { name: '许个愿', exact: true });
  await button.focus(); await page.keyboard.press('Enter');
  await expect(page.getByLabel('你的生日愿望')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
});

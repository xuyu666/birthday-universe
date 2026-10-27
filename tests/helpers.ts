import type { Page } from '@playwright/test';
export async function universe(page: Page): Promise<void> {
  await page.getByRole('button', { name: '点亮星光', exact: true }).click();
  await page.getByRole('button', { name: '直接吹灭', exact: true }).click();
  const skip = page.getByRole('button', { name: '跳过动画', exact: true });
  if (await skip.isVisible()) await skip.click();
  await page.getByRole('button', { name: '看看我们的宇宙' }).click();
}

import { test, expect } from '@playwright/test';
import { universe } from './helpers';

test('local preview clearly defers public sharing', async ({ page }) => {
  await page.goto('/'); await universe(page);
  await page.getByRole('button', { name: '分享这片星光' }).click();
  await expect(page.getByRole('dialog')).toContainText('正式分享待部署后开启');
  await expect(page.getByRole('button', { name: '分享生日宇宙', exact: true })).toHaveCount(0);
});

test('system share success sends a clean static link and a fresh session starts at intro', async ({ page, browser }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: async (data: ShareData) => { Object.defineProperty(window, 'sharedGift', { value: data }); } });
  });
  await page.goto('http://127.0.0.1:4175'); await universe(page);
  await page.getByRole('button', { name: '分享这片星光' }).click();
  await page.getByRole('button', { name: '分享生日宇宙', exact: true }).click();
  await expect(page.getByText('星光已经送出。')).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(Reflect.get(window, 'sharedGift')))).toBe(JSON.stringify({ title: '一颗星光，一份生日心意', text: '为你点亮的生日宇宙。', url: 'https://birthday.example/gift/' }));
  const fresh = await browser.newContext();
  // The canonical host is a test fixture. Verify fresh-session behavior against the same application origin.
  const freshPage = await fresh.newPage(); await freshPage.goto('http://127.0.0.1:4175');
  await expect(freshPage.getByRole('button', { name: '点亮星光', exact: true })).toBeVisible();
  await fresh.close();
});

test('native cancellation leaves the current universe intact', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: async () => { throw new DOMException('cancelled', 'AbortError'); } }); });
  await page.goto('http://127.0.0.1:4175'); await universe(page);
  await page.getByRole('button', { name: '分享这片星光' }).click();
  await page.getByRole('button', { name: '分享生日宇宙', exact: true }).click();
  await expect(page.getByText('已取消分享，星光还在这里。')).toBeVisible();
  await expect(page.getByRole('button', { name: '复制链接', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '关闭弹窗' }).click();
  await expect(page.getByRole('button', { name: '打开回忆：一起看海' })).toBeVisible();
});

for (const native of ['absent', 'rejected'] as const) {
  test(`manual copy works when native share is ${native} and clipboard is denied`, async ({ page }) => {
    await page.addInitScript((kind) => {
      Object.defineProperty(navigator, 'share', { value: kind === 'absent' ? undefined : async () => { throw new DOMException('Denied', 'NotAllowedError'); } });
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); } } });
    }, native);
    await page.goto('http://127.0.0.1:4175'); await universe(page);
    await page.getByRole('button', { name: '分享这片星光' }).click();
    await page.getByRole('button', { name: '分享生日宇宙', exact: true }).click();
    await page.getByRole('button', { name: '复制链接', exact: true }).click();
    await expect(page.getByText('长按或全选下面的链接，即可手动复制。')).toBeVisible();
    await expect(page.getByLabel('生日礼物链接')).toHaveValue('https://birthday.example/gift/');
  });
}

test('clipboard success confirms copying without sharing wish data', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (value: string) => { Object.defineProperty(window, 'copiedGift', { value }); } } });
  });
  await page.goto('http://127.0.0.1:4175'); await universe(page);
  await page.getByRole('button', { name: '分享这片星光' }).click();
  await page.getByRole('button', { name: '分享生日宇宙', exact: true }).click();
  await page.getByRole('button', { name: '复制链接', exact: true }).click();
  await expect(page.getByText('链接已复制。')).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, 'copiedGift'))).toBe('https://birthday.example/gift/');
});

test('audio follows successful playback and visibility without cancelling mute', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { Object.defineProperty(window, 'giftPlayer', { value: this, configurable: true }); return original.call(this); };
  });
  await page.goto('/');
  await page.getByRole('button', { name: '开启音乐', exact: true }).click();
  await expect(page.getByRole('button', { name: '关闭音乐', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => { const audio = Reflect.get(window, 'giftPlayer'); return audio instanceof HTMLMediaElement && !audio.paused; })).toBe(true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByRole('button', { name: '音乐已暂停' })).toBeVisible();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByRole('button', { name: '关闭音乐', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭音乐', exact: true }).click();
  await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByRole('button', { name: '开启音乐', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => { const audio = Reflect.get(window, 'giftPlayer'); return audio instanceof HTMLMediaElement && audio.paused; })).toBe(true);
});

test('stale audio completion cannot pause the newer playback request', async ({ page }) => {
  await page.addInitScript(() => {
    const pending: (() => void)[] = [];
    const player = { paused: true, loop: false, preload: '', volume: 0,
      play() { this.paused = false; return new Promise<void>(resolve => { pending.push(resolve); }); },
      pause() { this.paused = true; }, removeAttribute() {}, load() {},
    };
    Object.defineProperty(window, 'Audio', { value: function () { return player; } });
    Object.defineProperty(window, 'audioRace', { value: { pending, player } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '开启音乐', exact: true }).click();
  await page.getByRole('button', { name: '正在开启', exact: true }).click();
  await page.getByRole('button', { name: '开启音乐', exact: true }).click();
  await page.evaluate(async () => {
    const race = Reflect.get(window, 'audioRace');
    race.pending[0](); await Promise.resolve(); await Promise.resolve();
    race.pending[1](); await Promise.resolve(); await Promise.resolve();
  });
  await expect(page.getByRole('button', { name: '关闭音乐', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => Reflect.get(window, 'audioRace').player.paused)).toBe(false);
});

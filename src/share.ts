export type ShareResult = 'shared' | 'cancelled' | 'copy';
export type SharePort = { readonly share?: (data: ShareData) => Promise<void> };
export function canonicalUrl(value: string): string | null {
  const result = z.url().safeParse(value);
  if (!result.success) return null;
  const url = new URL(result.data);
  if (url.protocol !== 'https:' || /^(localhost|127\.|0\.|\[::1\])/.test(url.hostname) || url.hostname.endsWith('.local')) return null;
  url.search = ''; url.hash = ''; url.username = ''; url.password = '';
  return url.href;
}
export async function tryShare(port: SharePort, url: string): Promise<ShareResult> {
  if (!port.share) return 'copy';
  try {
    await port.share({ title: '一颗星光，一份生日心意', text: '为你点亮的生日宇宙。', url });
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    return 'copy';
  }
}
import { z } from 'zod';

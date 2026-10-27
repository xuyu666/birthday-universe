import { describe, it, expect } from 'vitest';
import { canonicalUrl, tryShare } from './share';

describe('private link sharing', () => {
  it('strips all state and wish query parameters from a canonical URL', () => {
    expect(canonicalUrl('https://gift.example/birthday/?wish=secret#memory')).toBe('https://gift.example/birthday/');
  });
  it.each(['http://gift.example/', 'https://localhost/', 'https://127.0.0.1/', 'javascript:alert(1)', ''])('disables non-public links: %s', (url) => {
    expect(canonicalUrl(url)).toBeNull();
  });
  it('shares only static metadata and the clean URL', async () => {
    const calls: ShareData[] = [];
    expect(await tryShare({ share: async (data) => { calls.push(data); } }, 'https://gift.example/')).toBe('shared');
    expect(calls).toEqual([{ title: '一颗星光，一份生日心意', text: '为你点亮的生日宇宙。', url: 'https://gift.example/' }]);
  });
  it('returns quietly when native sharing is cancelled', async () => {
    expect(await tryShare({ share: async () => { throw new DOMException('Cancelled', 'AbortError'); } }, 'https://gift.example/')).toBe('cancelled');
  });
  it('offers copy when native sharing fails', async () => {
    expect(await tryShare({ share: async () => { throw new DOMException('Denied', 'NotAllowedError'); } }, 'https://gift.example/')).toBe('copy');
  });
  it('offers copy when native sharing is absent', async () => {
    expect(await tryShare({}, 'https://gift.example/')).toBe('copy');
  });
});

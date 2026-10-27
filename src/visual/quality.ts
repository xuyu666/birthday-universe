export type Quality = { readonly tier: 'full' | 'low' | 'static'; readonly slowWindows: number };
export function sampleQuality(quality: Quality, fps: number): Quality {
  if (quality.tier === 'static') return quality;
  const slowWindows = fps < 25 ? quality.slowWindows + 1 : 0;
  if (slowWindows < 2) return { ...quality, slowWindows };
  return { tier: quality.tier === 'full' ? 'low' : 'static', slowWindows: 0 };
}

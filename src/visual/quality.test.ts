import { it, expect } from 'vitest';
import { sampleQuality } from './quality';
it('reduces particles after two consecutive slow windows', () => {
  const once = sampleQuality({ tier: 'full', slowWindows: 0 }, 20);
  expect(sampleQuality(once, 21).tier).toBe('low');
});
it('switches low tier to static after two more slow windows', () => {
  const once = sampleQuality({ tier: 'low', slowWindows: 0 }, 20);
  expect(sampleQuality(once, 20).tier).toBe('static');
});
it('never upgrades quality during a session', () => {
  expect(sampleQuality({ tier: 'static', slowWindows: 0 }, 60).tier).toBe('static');
});
it('resets consecutive slow window count after a healthy window', () => {
  expect(sampleQuality({ tier: 'full', slowWindows: 1 }, 30).slowWindows).toBe(0);
});

import { expect, it } from 'vitest';
import { breathStrength } from './breath';
import { initialState, reducer } from './model';
it('makes a quick breath gentle and a full breath extinguish all candles', () => {
  expect(breathStrength(0)).toBe(1); expect(breathStrength(590)).toBe(1);
  expect(breathStrength(600)).toBe(2); expect(breathStrength(1200)).toBe(3);
});
it('remembers individual candles until the last breath and resets on replay', () => {
  const cake = reducer(initialState, { type: 'light' });
  const first = reducer(cake, { type: 'blow', strength: 1 });
  expect(first.candles).toBe(2); expect(first.scene).toBe('cake'); expect(first.blows).toBe(1);
  const last = reducer(first, { type: 'blow', strength: 3 });
  expect(last.candles).toBe(0); expect(last.scene).toBe('extinguishing');
  expect(reducer(last, { type: 'blow', strength: 1 })).toBe(last);
  expect(reducer(last, { type: 'replay' }).candles).toBe(3);
});
it('keeps the direct blow available and ignores breaths while a dialog is open', () => {
  const cake = reducer(initialState, { type: 'light' });
  const open = reducer(cake, { type: 'open', overlay: { kind: 'wish' } });
  expect(reducer(open, { type: 'blow', strength: 2 })).toBe(open);
  expect(reducer(cake, { type: 'extinguish' }).candles).toBe(0);
});

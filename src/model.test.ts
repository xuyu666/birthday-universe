import { describe, it, expect } from 'vitest';
import { initialState, reducer, limitWish } from './model';

describe('birthday ritual', () => {
  it('enters cake when the light is pressed', () => {
    expect(reducer(initialState, { type: 'light' }).scene).toBe('cake');
  });
  it('does not reenter extinction when rapidly pressed twice', () => {
    const cake = reducer(initialState, { type: 'light' });
    const blowing = reducer(cake, { type: 'extinguish' });
    expect(blowing.scene).toBe('extinguishing');
    expect(reducer(blowing, { type: 'extinguish' })).toBe(blowing);
  });
  it('keeps the wish when closing and reopening the dialog', () => {
    const cake = reducer(initialState, { type: 'light' });
    const draft = reducer(cake, { type: 'wish', value: '愿我们年年相见' });
    const closed = reducer(draft, { type: 'close' });
    expect(reducer(closed, { type: 'open', overlay: { kind: 'wish' } }).wish).toBe('愿我们年年相见');
  });
  it('preserves a wish after cancelling replay', () => {
    const state = { ...initialState, scene: 'universe' as const, wish: '愿我们年年相见' };
    const confirmation = reducer(state, { type: 'request-replay' });
    expect(confirmation.overlay.kind).toBe('replay');
    expect(reducer(confirmation, { type: 'close' }).wish).toBe(state.wish);
  });
  it('clears the wish only after confirming replay', () => {
    const state = { ...initialState, wish: 'a wish' };
    expect(reducer(state, { type: 'replay' })).toEqual(initialState);
  });
  it('counts Unicode code points rather than UTF16 units', () => {
    expect(Array.from(limitWish('🌹'.repeat(201))).length).toBe(200);
  });
  it('never opens memory while intro is visible', () => {
    expect(reducer(initialState, { type: 'open', overlay: { kind: 'memory', id: 'sea' } })).toEqual(initialState);
  });
  it('allows empty wishes to continue the ritual', () => {
    const cake = reducer(initialState, { type: 'light' });
    expect(reducer(cake, { type: 'extinguish' }).scene).toBe('extinguishing');
  });
});

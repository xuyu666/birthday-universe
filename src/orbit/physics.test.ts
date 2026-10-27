import { describe, expect, it } from 'vitest';
import { coastTarget, dragTarget, initialOrbit, orbitPose, stepOrbit } from './physics';

describe('orbital motion', () => {
  it('advances idle time without depending on refresh rate', () => {
    let slow = initialOrbit; let fast = initialOrbit;
    for (let i = 0; i < 60; i++) slow = stepOrbit(slow, 1 / 60, true);
    for (let i = 0; i < 120; i++) fast = stepOrbit(fast, 1 / 120, true);
    expect(slow.time).toBeCloseTo(1); expect(fast.time).toBeCloseTo(slow.time);
  });
  it('retains orbital time when the user is dragging', () => {
    expect(stepOrbit({ ...initialOrbit, time: 4 }, .016, false).time).toBe(4);
  });
  it('eases toward the drag target and settles without overshoot', () => {
    let state = { ...initialOrbit, target: .5 };
    const first = stepOrbit(state, .016, false);
    expect(first.angle).toBeGreaterThan(0); expect(first.angle).toBeLessThan(.5);
    for (let i = 0; i < 180; i++) state = stepOrbit(state, 1 / 60, false);
    expect(state.angle).toBeCloseTo(.5, 4); expect(state.velocity).toBeCloseTo(0, 4);
  });
  it('supports continuous turns with consistent sensitivity at every angle', () => {
    expect(dragTarget(0, 342, 342)).toBeCloseTo(Math.PI * 1.5);
    expect(dragTarget(12, 342, 342)).toBeCloseTo(12 + Math.PI * 1.5);
    expect(dragTarget(12, 0, 342)).toBe(12);
  });
  it('caps flick travel without limiting the accumulated angle', () => {
    expect(coastTarget(12, 100) - 12).toBeLessThanOrEqual(1.2);
    expect(coastTarget(12, .5)).toBeGreaterThan(12);
    expect(coastTarget(-12, -100)).toBeLessThan(-12);
  });
  it('does not jump after a tab has been hidden for a long time', () => {
    expect(stepOrbit({ ...initialOrbit, target: .5 }, 20, true).time).toBeLessThan(.1);
  });
  it('projects depth into subtle scale and different orbital speeds', () => {
    const spec = { phase: 0, speed: .02, plane: -.24, radius: 1 };
    const first = orbitPose(spec, 0, 0, 390, 430);
    const later = orbitPose(spec, 10, 0, 390, 430);
    expect(first.x).not.toBe(later.x);
    expect(later.scale).not.toBe(first.scale);
    expect(Math.abs(later.x)).toBeLessThan(190);
  });
  it('keeps every point inside the phone canvas', () => {
    for (let phase = 0; phase < Math.PI * 2; phase += .1) {
      const pose = orbitPose({ phase, speed: .02, plane: .25, radius: 1 }, 0, .6, 342, 430);
      expect(Math.abs(pose.x)).toBeLessThan(155); expect(Math.abs(pose.y)).toBeLessThan(190);
    }
  });
  it('does not reapply resistance to the starting pose on repeated drags', () => {
    expect(dragTarget(.5, 0, 342)).toBeCloseTo(.5);
    expect(dragTarget(.5, 10, 342)).toBeGreaterThan(.5);
    expect(dragTarget(-.5, -10, 342)).toBeLessThan(-.5);
  });
});

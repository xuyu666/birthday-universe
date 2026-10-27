import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMotionValue } from 'motion/react';
import type { PointerEvent } from 'react';
import { coastTarget, dragTarget, initialOrbit, stepOrbit } from './physics';

type Gesture = { readonly id: number; readonly x: number; readonly y: number; readonly start: number; lastX: number; lastAt: number; speed: number; distance: number; horizontal: boolean };
type Props = { readonly paused: boolean; readonly reduce: boolean };
export function useOrbitMotion({ paused, reduce }: Props) {
  const map = useRef<HTMLDivElement>(null);
  const state = useRef(initialOrbit);
  const gesture = useRef<Gesture | null>(null);
  const distance = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const time = useMotionValue(0);
  const angle = useMotionValue(0);
  const width = useMotionValue(342);
  const height = useMotionValue(430);
  const suspended = paused || (!dragging && (reduce || hovered || focused));
  useLayoutEffect(() => {
    const element = map.current;
    if (!element) return;
    const resize = () => { width.set(element.clientWidth); height.set(element.clientHeight); };
    resize(); const observer = new ResizeObserver(resize); observer.observe(element);
    return () => observer.disconnect();
  }, [width, height]);
  useEffect(() => {
    if (suspended) { state.current = { ...state.current, target: state.current.angle, velocity: 0 }; return; }
    let previous = performance.now(); let frame = 0;
    const update = (now: number) => {
      state.current = stepOrbit(state.current, (now - previous) / 1000, gesture.current === null && !reduce);
      previous = now; angle.set(state.current.angle); time.set(state.current.time);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [suspended, angle, time, reduce]);
  function start(event: PointerEvent<HTMLDivElement>): void {
    if (!event.isPrimary || event.button !== 0 || gesture.current || paused) return;
    distance.current = 0; state.current = { ...state.current, target: state.current.angle, velocity: 0 };
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: state.current.angle, lastX: event.clientX, lastAt: event.timeStamp, speed: 0, distance: 0, horizontal: false };
    setDragging(true); setFocused(false);
  }
  function move(event: PointerEvent<HTMLDivElement>): void {
    const pointer = gesture.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x; const dy = event.clientY - pointer.y;
    pointer.distance = Math.max(pointer.distance, Math.hypot(dx, dy)); distance.current = pointer.distance;
    if (!pointer.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.15) { pointer.horizontal = true; event.currentTarget.setPointerCapture(event.pointerId); }
    if (!pointer.horizontal) return;
    const elapsed = Math.max(8, event.timeStamp - pointer.lastAt);
    pointer.speed = pointer.speed * .45 + ((event.clientX - pointer.lastX) / elapsed) * .55;
    pointer.lastX = event.clientX; pointer.lastAt = event.timeStamp;
    const next = dragTarget(pointer.start, dx, width.get());
    state.current = { ...state.current, angle: next, target: next, velocity: 0 }; angle.set(next);
  }
  function end(event: PointerEvent<HTMLDivElement>, cancelled = false): void {
    const pointer = gesture.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    gesture.current = null;
    if (cancelled) distance.current = 100;
    const freshVelocity = event.timeStamp - pointer.lastAt < 90 ? pointer.speed : 0;
    if (pointer.horizontal && !cancelled && !reduce) state.current = { ...state.current, target: coastTarget(state.current.target, freshVelocity * 1000 / Math.max(260, width.get()) * Math.PI * 1.5) };
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false); setHovered(false);
  }
  useEffect(() => {
    if (!paused && !reduce) return;
    const pointer = gesture.current;
    gesture.current = null;
    if (pointer) {
      distance.current = 100;
      if (map.current?.hasPointerCapture(pointer.id)) map.current.releasePointerCapture(pointer.id);
    }
    setDragging(false);
  }, [paused, reduce]);
  function turn(direction: number): void {
    if (paused || gesture.current) return;
    const target = direction === 0 ? 0 : state.current.target + direction * Math.PI / 3;
    state.current = { ...state.current, target, ...(reduce ? { angle: target, velocity: 0 } : {}) };
    setHovered(false); setFocused(false);
    if (reduce) angle.set(target);
  }
  return { turn, map, time, angle, width, height, distance, dragging, suspended, setHovered, setFocused, start, move, end,
    leave: (event: PointerEvent<HTMLDivElement>) => { if (gesture.current && !event.currentTarget.hasPointerCapture(event.pointerId)) end(event, true); },
  };
}

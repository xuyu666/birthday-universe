import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { MotionValue } from 'motion/react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { breathStrength } from './breath';

type Props = { readonly charge: MotionValue<number>; readonly paused: boolean; readonly candles: number; readonly onBlow: (strength: 1 | 2 | 3) => void };
type Hold = { readonly source: number | ' ' | 'Enter'; readonly started: number; readonly element: HTMLButtonElement };
export function BreathControl({ charge, paused, candles, onBlow }: Props) {
  const hold = useRef<Hold | null>(null);
  const frame = useRef(0);
  const [holding, setHolding] = useState(false);
  const [full, setFull] = useState(false);
  function clear(): Hold | null {
    const previous = hold.current; hold.current = null;
    cancelAnimationFrame(frame.current); charge.set(0); setHolding(false); setFull(false);
    if (previous && typeof previous.source === 'number' && previous.element.hasPointerCapture(previous.source)) previous.element.releasePointerCapture(previous.source);
    return previous;
  }
  function start(source: number | ' ' | 'Enter', element: HTMLButtonElement, stamp: number): void {
    if (paused || hold.current) return;
    hold.current = { source, element, started: stamp }; setHolding(true);
    const update = () => {
      if (!hold.current) return;
      const value = Math.min(1, (performance.now() - hold.current.started) / 1200);
      charge.set(value);
      if (value < 1) frame.current = requestAnimationFrame(update); else setFull(true);
    };
    frame.current = requestAnimationFrame(update);
  }
  function finish(source: number | ' ' | 'Enter', stamp: number, valid = true): void {
    if (hold.current?.source !== source) return;
    const previous = clear();
    if (previous && valid && !paused) onBlow(breathStrength(stamp - previous.started));
  }
  function pointerDown(event: PointerEvent<HTMLButtonElement>): void {
    if (!event.isPrimary || event.button !== 0 || paused || hold.current) return;
    event.preventDefault(); event.currentTarget.focus({ preventScroll: true });
    start(event.pointerId, event.currentTarget, event.timeStamp); event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerUp(event: PointerEvent<HTMLButtonElement>): void {
    const box = event.currentTarget.getBoundingClientRect();
    finish(event.pointerId, event.timeStamp, event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom);
  }
  function keyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === 'Escape') { clear(); return; }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault(); if (!event.repeat) start(event.key, event.currentTarget, event.timeStamp);
  }
  useEffect(() => { if (paused) clear(); }, [paused]);
  useEffect(() => () => { cancelAnimationFrame(frame.current); charge.set(0); hold.current = null; }, [charge]);
  return <div className="breath-control">
    <button className="primary breath-button" aria-label="按住蓄气，松开吹蜡烛" aria-describedby="breath-help" aria-pressed={holding} disabled={paused}
      onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={(event) => finish(event.pointerId, event.timeStamp, false)} onLostPointerCapture={(event) => { if (hold.current?.source === event.pointerId) clear(); }} onBlur={() => clear()}
      onKeyDown={keyDown} onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); finish(event.key, event.timeStamp); } }} onClick={(event) => { if (event.detail === 0 && !hold.current && !paused) onBlow(1); }} onContextMenu={(event) => event.preventDefault()}>
      <span>{full ? '蓄满了，松开吹出' : holding ? '松开，吹向烛光' : '按住，蓄一口气'}</span><span className="breath-symbol" aria-hidden="true">≋</span>
      <motion.i className="breath-meter" style={{ scaleX: charge }} aria-hidden="true" />
    </button>
    <p id="breath-help" className="breath-help" role="status">{full ? '把这一口气，送向星空' : candles < 3 ? '烛光轻轻摇了摇，还剩 ' + candles + ' 支' : '短按轻轻吹，蓄满一口气一起吹灭'}</p>
  </div>;
}

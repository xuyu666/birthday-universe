import { Component, useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { MotionValue } from 'motion/react';
import type { Scene } from '../model';
import { CakeFallback } from './CakeFallback';

export type CanvasProps = { readonly breath: MotionValue<number>; readonly candles: number; readonly blows: number; readonly scene: Scene; readonly paused: boolean; readonly reduce: boolean; readonly onReady: () => void; readonly onFailure: () => void };
class GraphicsBoundary extends Component<{ readonly children: ReactNode; readonly onFailure: () => void }, { readonly failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onFailure(); }
  override render() { return this.state.failed ? null : this.props.children; }
}

export function VisualStage({ scene, paused, reduce, breath, candles, blows }: Omit<CanvasProps, 'onReady' | 'onFailure'>) {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = (value: number) => stage.current?.style.setProperty('--breath', String(reduce ? 0 : value));
    update(breath.get()); return breath.on('change', update);
  }, [breath, reduce]);
  const [Renderer, setRenderer] = useState<ComponentType<CanvasProps> | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const initiated = scene !== 'intro';
  useEffect(() => {
    if (!initiated || failed || Renderer) return;
    let active = true;
    const timer = setTimeout(() => { if (active) setFailed(true); }, 8000);
    import('./SceneCanvas').then(module => { if (active) { setRenderer(() => module.SceneCanvas); clearTimeout(timer); } }).catch((error: unknown) => { if (error instanceof Error && active) setFailed(true); });
    return () => { active = false; clearTimeout(timer); };
  }, [initiated, failed, Renderer]);
  const showCake = scene === 'cake' || scene === 'extinguishing';
  return <div ref={stage} data-candles={candles} className={`stage-art ${scene === 'intro' ? 'stage-hidden' : ''}`} aria-hidden="true" data-graphics={failed ? 'fallback' : ready ? 'webgl' : 'loading'}>
    {showCake && (!ready || failed) && <CakeFallback candles={candles} />}
    {Renderer && !failed && <GraphicsBoundary onFailure={() => setFailed(true)}><Renderer breath={breath} candles={candles} blows={blows} scene={scene} paused={paused || scene === 'intro'} reduce={reduce} onReady={() => setReady(true)} onFailure={() => setFailed(true)} /></GraphicsBoundary>}
    {showCake && blows > 0 && !reduce && <div className="breath-gust" key={blows}>{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ top: (30 + i * 8) + '%', animationDelay: i * 30 + 'ms' }} />)}</div>}
    {scene === 'extinguishing' && !reduce && <div className="wish-burst">{Array.from({ length: 20 }, (_, i) => <i key={i} style={{ transform: `rotate(${i * 18}deg) translateY(-${72 + (i % 4) * 14}px)` }} />)}</div>}
  </div>;
}

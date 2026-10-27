import { memories } from './content';
import { useOrbitMotion } from './orbit/useOrbitMotion';
import { OrbitPlanet } from './orbit/OrbitPlanet';
import { orbitSpecs } from './orbit/physics';

type Props = { readonly paused: boolean; readonly reduce: boolean; readonly onMemory: (id: string) => void };
export function MemoryUniverse({ paused, reduce, onMemory }: Props) {
  const orbit = useOrbitMotion({ paused, reduce });
  return <div className="memory-universe">
    <div className="orbit-map" ref={orbit.map} data-testid="orbit-map" data-dragging={orbit.dragging} data-motion={orbit.suspended ? 'paused' : 'drifting'}
      onPointerDown={orbit.start} onPointerMove={orbit.move} onPointerUp={(event) => orbit.end(event)} onPointerCancel={(event) => orbit.end(event, true)} onLostPointerCapture={(event) => { if (event.target === event.currentTarget) orbit.end(event, true); }} onPointerLeave={orbit.leave}
      onFocusCapture={(event) => orbit.setFocused(event.target.matches(':focus-visible'))} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) orbit.setFocused(false); }}>
      <div className="orbit-system">
        <div className="orbit-track track-one" /><div className="orbit-track track-two" /><div className="orbit-track track-distant" />
        <div className="orbit-heart" aria-hidden="true"><span /><i /><i /></div>
        {memories.map((memory, index) => { const spec = orbitSpecs[index]; return spec && <OrbitPlanet key={memory.id} memory={memory} index={index} spec={spec} time={orbit.time} angle={orbit.angle} width={orbit.width} height={orbit.height}
          onAim={orbit.setHovered} onOpen={(keyboard) => { if (keyboard || orbit.distance.current <= 8) onMemory(memory.id); }} />; })}
      </div>
    </div>
    <div className="orbit-controls" role="group" aria-label="星球旋转控制"><button aria-label="向左旋转星球" onClick={() => orbit.turn(-1)}>←</button><button className="orbit-reset" onClick={() => orbit.turn(0)}>重置视角</button><button aria-label="向右旋转星球" onClick={() => orbit.turn(1)}>→</button></div>
    <p className="orbit-hint">{reduce ? '拖动或点击箭头转向 · 轻点星球看回忆' : '左右拖动，自由转向 · 轻点星球看回忆'}</p>
    <details className="memory-list"><summary>以文字浏览全部回忆 <span aria-hidden="true">＋</span></summary><ul>{memories.map((memory, i) => <li key={memory.id}><button onClick={() => onMemory(memory.id)}><span className="list-index">0{i + 1}</span><span>{memory.title}</span><span aria-hidden="true">↗</span></button></li>)}</ul></details>
  </div>;
}

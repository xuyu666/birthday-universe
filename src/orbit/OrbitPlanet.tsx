import { motion, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import type { CSSProperties } from 'react';
import type { Memory } from '../content';
import { orbitPose } from './physics';
import type { OrbitSpec } from './physics';

type Props = {
  readonly memory: Memory; readonly index: number; readonly spec: OrbitSpec;
  readonly time: MotionValue<number>; readonly angle: MotionValue<number>; readonly width: MotionValue<number>; readonly height: MotionValue<number>;
  readonly onAim: (aiming: boolean) => void; readonly onOpen: (keyboard: boolean) => void;
};
type SurfaceStyle = CSSProperties & { readonly '--planet-size': string; readonly '--planet-color': string };
export function OrbitPlanet({ memory, index, spec, time, angle, width, height, onAim, onOpen }: Props) {
  const pose = useTransform(() => orbitPose(spec, time.get(), angle.get(), width.get(), height.get()));
  const position = useTransform(() => { const point = pose.get(); return `translate3d(${point.x}px, ${point.y}px, 0)`; });
  const scale = useTransform(() => `scale(${pose.get().scale})`);
  const opacity = useTransform(() => .8 + pose.get().depth * .2);
  const zIndex = useTransform(() => Math.round(2 + pose.get().depth * 8));
  const style: SurfaceStyle = { '--planet-size': `${memory.size}px`, '--planet-color': memory.color };
  return <motion.div className="orbiting-planet" style={{ transform: position, opacity, zIndex }} data-planet={memory.id}>
    <button className={`planet planet-kind-${memory.appearance}`} style={style} aria-label={`打开回忆：${memory.title}`} onPointerEnter={(event) => { if (event.pointerType === 'mouse') onAim(true); }} onPointerLeave={() => onAim(false)} onClick={(event) => onOpen(event.detail === 0)}>
      <motion.span className="planet-art" style={{ transform: scale }} aria-hidden="true">
        {memory.appearance === 'rings' && <span className="planet-rings rings-back" />}
        <span className="planet-body"><span className="planet-surface"><img src={`./planet-${memory.appearance}.webp`} alt="" draggable={false} width={1024} height={512} onError={(event) => { event.currentTarget.hidden = true; }} /></span><span className="planet-light" /><span className="planet-atmosphere" /></span>
        {memory.appearance === 'rings' && <span className="planet-rings rings-front" />}
      </motion.span>
      <span className="planet-label"><span className="planet-number">0{index + 1}</span>{memory.title}<span className="planet-arrow" aria-hidden="true">↗</span></span>
    </button>
  </motion.div>;
}

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Group } from 'three';
import type { CanvasProps } from './VisualStage';
import { sampleQuality } from './quality';
import type { Quality } from './quality';

const layers = [{ r: 1.35, y: -0.9, h: .55 }, { r: 1.02, y: -.35, h: .5 }, { r: .67, y: .15, h: .5 }] as const;
const cameraOptions = { position: [0, 1.8, 5.8] satisfies [number, number, number], fov: 37 };
function circle(radius: number, y: number): [number, number, number][] {
  return Array.from({ length: 97 }, (_, index) => [Math.cos(index / 96 * Math.PI * 2) * radius, y, Math.sin(index / 96 * Math.PI * 2) * radius]);
}

function ParticleCake({ candles, breath, reduce, count, moving }: Pick<CanvasProps, 'candles' | 'breath' | 'reduce'> & { readonly count: number; readonly moving: boolean }) {
  const group = useRef<Group>(null);
  const flame = useRef<Group>(null);
  const elapsed = useRef(0);
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      const layer = layers[i % 3];
      if (!layer) continue;
      const angle = i * 2.399963;
      const ring = i % 5 < 3;
      const y = ring ? (i % 2) * layer.h : (Math.sin(i * 7.13) + 1) / 2 * layer.h;
      positions.push(Math.cos(angle) * layer.r, layer.y + y, Math.sin(angle) * layer.r);
    }
    return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(positions, 3));
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    const pressure = reduce ? 0 : breath.get();
    if (flame.current) for (const candle of flame.current.children) {
      candle.rotation.z = -.48 * pressure;
      candle.scale.set(1 + pressure * .12, (1 - pressure * .3) * (1 + Math.sin(elapsed.current * 6) * .07), 1);
    }
    if (!moving) return;
    elapsed.current += Math.min(delta, .05);
    if (group.current) group.current.rotation.y = Math.sin(elapsed.current * .22) * .1;

  });
  return <group ref={group} rotation={[0, -.12, 0]}>
    {layers.map(layer => <group key={layer.r}>
      <Line points={circle(layer.r, layer.y)} color="#a66a83" transparent opacity={.52} lineWidth={.65} />
      <Line points={circle(layer.r, layer.y + layer.h)} color="#d6aabd" transparent opacity={.85} lineWidth={.75} />
      {Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return <Line key={i} points={[[Math.cos(a) * layer.r, layer.y, Math.sin(a) * layer.r], [Math.cos(a) * layer.r, layer.y + layer.h, Math.sin(a) * layer.r]]} color="#b37891" transparent opacity={.16} lineWidth={.5} />; })}
    </group>)}
    <points geometry={geometry}><pointsMaterial color="#f9d4e4" size={.023} sizeAttenuation transparent opacity={.9} depthWrite={false} /></points>
    {[-.34, 0, .34].map((x, i) => <group key={x} position={[x, .89 + (i === 1 ? .08 : 0), 0]}><mesh><cylinderGeometry args={[.012, .012, .45, 8]} /><meshBasicMaterial color="#eccbd5" /></mesh></group>)}
    {candles > 0 && <group ref={flame}>{[-.34, 0, .34].slice(0, candles).map((x, i) => <group key={x} position={[x, 1.2 + (i === 1 ? .08 : 0), 0]}><mesh scale={[.055, .14, .055]}><sphereGeometry args={[1, 12, 12]} /><meshBasicMaterial color="#fff0c8" /></mesh><mesh scale={[.11, .2, .11]}><sphereGeometry args={[1, 12, 12]} /><meshBasicMaterial color="#eeb277" transparent opacity={.12} depthWrite={false} /></mesh></group>)}</group>}
  </group>;
}

function FrameMonitor({ active, onSample }: { readonly active: boolean; readonly onSample: (fps: number) => void }) {
  const frames = useRef(0);
  const seconds = useRef(0);
  useEffect(() => { frames.current = 0; seconds.current = 0; }, [active]);
  useFrame((_, delta) => {
    if (!active) return;
    frames.current++;
    seconds.current += delta;
    if (seconds.current >= 5) { onSample(frames.current / seconds.current); frames.current = 0; seconds.current = 0; }
  });
  return null;
}

function CanvasLifecycle({ onReady, onFailure }: Pick<CanvasProps, 'onReady' | 'onFailure'>) {
  const gl = useThree(state => state.gl);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    onReady();
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onReady, onFailure]);
  return null;
}

export function SceneCanvas(props: CanvasProps) {
  const [quality, setQuality] = useState<Quality>({ tier: 'full', slowWindows: 0 });
  const moving = !props.paused && !props.reduce && props.scene !== 'universe';
  useEffect(() => { if (quality.tier === 'static') props.onFailure(); }, [quality.tier, props.onFailure]);
  return <Canvas camera={cameraOptions} dpr={[1, quality.tier === 'full' ? 1.5 : 1]} gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }} frameloop={moving ? 'always' : 'demand'} fallback={<span />} onCreated={({ camera }) => camera.lookAt(0, .1, 0)}>
    <CanvasLifecycle onReady={props.onReady} onFailure={props.onFailure} />
    <FrameMonitor active={moving} onSample={(fps) => setQuality(value => sampleQuality(value, fps))} />
    {(props.scene === 'cake' || props.scene === 'extinguishing') && <ParticleCake candles={props.candles} breath={props.breath} reduce={props.reduce} count={quality.tier === 'full' ? 800 : 300} moving={moving} />}
  </Canvas>;
}

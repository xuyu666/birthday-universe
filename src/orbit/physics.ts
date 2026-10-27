export type OrbitState = { readonly angle: number; readonly velocity: number; readonly target: number; readonly time: number };
export type OrbitSpec = { readonly phase: number; readonly speed: number; readonly plane: number; readonly radius: number };
export const initialOrbit: OrbitState = { angle: 0, velocity: 0, target: 0, time: 0 };
export const orbitSpecs: readonly OrbitSpec[] = [
  { phase: -2.22, speed: .018, plane: -.24, radius: .96 },
  { phase: -.66, speed: .014, plane: .25, radius: .88 },
  { phase: 2.16, speed: .012, plane: -.24, radius: .96 },
  { phase: .7, speed: .021, plane: .25, radius: .88 },
];
export function dragTarget(start: number, pixels: number, width: number): number {
  return start + pixels / Math.max(260, width) * Math.PI * 1.5;
}
export function coastTarget(angle: number, velocity: number): number {
  return angle + Math.max(-1.2, Math.min(1.2, velocity * .18));
}
export function stepOrbit(state: OrbitState, seconds: number, autoplay: boolean): OrbitState {
  const dt = Math.max(0, Math.min(seconds, .04));
  const frequency = 14;
  const offset = state.angle - state.target;
  const impulse = state.velocity + offset * frequency;
  const decay = Math.exp(-frequency * dt);
  return { ...state, angle: state.target + (offset + impulse * dt) * decay, velocity: (state.velocity - impulse * frequency * dt) * decay, time: state.time + (autoplay ? dt : 0) };
}
export function orbitPose(spec: OrbitSpec, time: number, angle: number, width: number, height: number) {
  const phase = spec.phase + time * spec.speed + angle;
  const x = Math.cos(phase) * width * .33 * spec.radius;
  const y = Math.sin(phase) * height * .3 * spec.radius;
  const depth = (Math.sin(phase) + 1) / 2;
  return { x: x * Math.cos(spec.plane) - y * Math.sin(spec.plane), y: x * Math.sin(spec.plane) + y * Math.cos(spec.plane), scale: .83 + depth * .23, depth };
}

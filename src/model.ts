export type Scene = 'intro' | 'cake' | 'extinguishing' | 'universe';
export type Overlay = { readonly kind: 'none' | 'wish' | 'share' | 'replay' } | { readonly kind: 'memory'; readonly id: string };
export type State = { readonly scene: Scene; readonly overlay: Overlay; readonly wish: string; readonly saved: boolean; readonly celebrated: boolean; readonly candles: number; readonly blows: number };
export type Action = { readonly type: 'light' | 'extinguish' | 'finish' | 'universe' | 'close' | 'save' | 'request-replay' | 'replay' } | { readonly type: 'blow'; readonly strength: 1 | 2 | 3 } | { readonly type: 'wish'; readonly value: string } | { readonly type: 'open'; readonly overlay: Overlay };
export const initialState: State = { scene: 'intro', overlay: { kind: 'none' }, wish: '', saved: false, celebrated: false, candles: 3, blows: 0 };
function unreachable(value: never): never { throw new TypeError(`Unknown action: ${String(value)}`); }
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'light': return state.scene === 'intro' ? { ...state, scene: 'cake' } : state;
    case 'wish': return state.scene === 'cake' ? { ...state, wish: limitWish(action.value), saved: false } : state;
    case 'save': return { ...state, saved: state.wish.trim().length > 0, overlay: { kind: 'none' } };
    case 'close': return { ...state, overlay: { kind: 'none' } };
    case 'open': {
      if (action.overlay.kind === 'memory' && state.scene !== 'universe') return state;
      if (action.overlay.kind === 'wish' && state.scene !== 'cake') return state;
      return { ...state, overlay: action.overlay };
    }
    case 'blow': {
      if (state.scene !== 'cake' || state.overlay.kind !== 'none') return state;
      const candles = Math.max(0, state.candles - action.strength);
      return { ...state, candles, blows: state.blows + 1, scene: candles === 0 ? 'extinguishing' : 'cake' };
    }
    case 'extinguish': return state.scene === 'cake' ? { ...state, candles: 0, scene: 'extinguishing', overlay: { kind: 'none' } } : state;
    case 'finish': return state.scene === 'extinguishing' ? { ...state, celebrated: true } : state;
    case 'universe': return state.celebrated ? { ...state, scene: 'universe' } : state;
    case 'request-replay': return state.wish.length > 0 ? { ...state, overlay: { kind: 'replay' } } : initialState;
    case 'replay': return initialState;
    default: return unreachable(action);
  }
}
export function limitWish(value: string): string { return Array.from(value).slice(0, 200).join(''); }

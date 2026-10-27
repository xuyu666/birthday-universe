import { useEffect, useReducer, useRef } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { gift } from './content';
import { initialState, reducer } from './model';
import { useMusic, usePageVisible, useMotionPreference } from './hooks';
import { VisualStage } from './visual/VisualStage';
import { MemoryUniverse } from './MemoryUniverse';
import { GiftDialog } from './GiftDialog';
import { BreathControl } from './BreathControl';
import type { MotionValue } from 'motion/react';
import type { State, Action } from './model';
import type { Dispatch } from 'react';

function SceneHeading({ state }: { readonly state: State }) {
  switch (state.scene) {
    case 'intro': return <><p className="eyebrow">EVERYTHING BEGAN WITH YOU</p><h1 className="scene-title chinese" tabIndex={-1}>{gift.opening[0]}<br />{gift.opening[1]}</h1><p className="serif-note">every little light leads to you.</p></>;
    case 'cake': return <><p className="eyebrow">A LITTLE STARDUST, A WISH FOR YOU</p><h1 className="scene-title birthday" tabIndex={-1}>Happy<br className="mobile-break" /> Birthday</h1><p className="subtitle">{gift.recipient}，生日快乐。</p></>;
    case 'extinguishing': return <><p className="eyebrow">MAY ALL YOUR WISHES FIND THEIR WAY</p><h1 className="scene-title chinese" tabIndex={-1}>{state.celebrated ? '愿美好，如约而至。' : '让愿望，飞向星空。'}</h1><p className="subtitle">{state.celebrated ? '新的一岁，也要闪闪发光。' : '把这一刻的温柔，留给你。'}</p></>;
    case 'universe': return <><p className="eyebrow">A LITTLE UNIVERSE OF US</p><h1 className="scene-title chinese" tabIndex={-1}>我们的故事，<br />都在这里。</h1><p className="subtitle">每一颗星球，都收藏着一段回忆。</p></>;
  }
}

function SceneActions({ state, dispatch, breath, paused }: { readonly state: State; readonly dispatch: Dispatch<Action>; readonly breath: MotionValue<number>; readonly paused: boolean }) {
  switch (state.scene) {
    case 'intro': return <div className="scene-actions"><p>有一份心意，想亲手交给你。</p><button className="primary" onClick={() => dispatch({ type: 'light' })}>点亮星光 <span aria-hidden="true">↗</span></button><p className="serif-note">a small light. a whole universe.</p></div>;
    case 'cake': return <div className="scene-actions"><p role="status">{state.saved ? '愿望已收好，只属于此刻的你。' : '闭上眼，想一件让你微笑的事。'}</p><BreathControl charge={breath} paused={paused} candles={state.candles} onBlow={(strength) => dispatch({ type: 'blow', strength })} /><div className="cake-shortcuts"><button className="text-button" onClick={() => dispatch({ type: 'open', overlay: { kind: 'wish' } })}>{state.saved ? '再看看愿望' : '许个愿'}</button><span aria-hidden="true">·</span><button className="text-button" onClick={() => dispatch({ type: 'extinguish' })}>{state.saved ? '吹灭蜡烛' : '直接吹灭'}</button></div></div>;
    case 'extinguishing': return <div className="scene-actions"><p className="blessing">{state.celebrated ? gift.blessing : '星光正在替你捎去祝福。'}</p><button className="primary" onClick={() => dispatch({ type: state.celebrated ? 'universe' : 'finish' })}>{state.celebrated ? '看看我们的宇宙' : '跳过动画'} <span aria-hidden="true">↗</span></button></div>;
    case 'universe': return null;
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const breath = useMotionValue(0);
  const visible = usePageVisible();
  const music = useMusic(visible);
  const reduce = useMotionPreference();
  const previousScene = useRef(state.scene);
  const paused = !visible || state.overlay.kind !== 'none';
  useEffect(() => {
    if (state.scene !== 'extinguishing' || state.celebrated || !visible) return;
    const timer = setTimeout(() => dispatch({ type: 'finish' }), reduce ? 0 : 1600);
    return () => clearTimeout(timer);
  }, [state.scene, state.celebrated, reduce, visible]);
  useEffect(() => {
    if (previousScene.current !== state.scene) {
      document.querySelector<HTMLElement>('.scene-title')?.focus({ preventScroll: true });
      previousScene.current = state.scene;
    }
  }, [state.scene]);
  return <div className="gift-app" data-scene={state.scene} data-paused={paused}>
    <div className="starfield" aria-hidden="true" />
    <header className="site-header">
      <a className="wordmark" href="./" aria-label="生日宇宙首页"><span aria-hidden="true">✧</span> a little universe.</a>
      <button className="music-button" aria-pressed={music.status === 'on'} onClick={music.toggle}><span className="sound-bars" data-playing={music.status === 'on'} aria-hidden="true"><i /><i /><i /><i /></span>{music.label}</button>
    </header>
    <main className={`ritual ${state.scene === 'universe' ? 'universe-page' : ''}`}>
      <motion.div className="scene-heading" key={state.scene + String(state.celebrated)} initial={false} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.22 }}><SceneHeading state={state} /></motion.div>
      <div className="visual-slot">
        {state.scene === 'intro' && <button className="intro-light" aria-label="点亮中央星光" onClick={() => dispatch({ type: 'light' })}><span className="light-orbit" /><span className="star-cross" /><span className="tiny-star one" /><span className="tiny-star two" /></button>}
        <VisualStage scene={state.scene} paused={paused} reduce={reduce} breath={breath} candles={state.candles} blows={state.blows} />
        {state.scene === 'universe' && <MemoryUniverse paused={paused} reduce={reduce} onMemory={(id) => dispatch({ type: 'open', overlay: { kind: 'memory', id } })} />}
      </div>
      <SceneActions state={state} dispatch={dispatch} breath={breath} paused={paused} />
      {state.scene === 'universe' && <div className="universe-actions"><button className="primary" onClick={() => dispatch({ type: 'open', overlay: { kind: 'share' } })}>分享这片星光 <span aria-hidden="true">↗</span></button><button className="text-button" onClick={() => dispatch({ type: 'request-replay' })}>重新点亮</button></div>}
    </main>
    <footer className="site-footer"><span>EVERY MOMENT. IN ORBIT.</span><span>{gift.isDemo ? '示例礼物 · 内容待替换' : 'ONLY FOR YOU'} <span aria-hidden="true">✦</span></span></footer>
    {music.status === 'error' && <p className="audio-notice" role="status">音乐暂时无法播放，可以继续这段旅程。</p>}
    {state.overlay.kind !== 'none' && <GiftDialog state={state} dispatch={dispatch} />}
  </div>;
}

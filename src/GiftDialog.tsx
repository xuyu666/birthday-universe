import { useEffect, useRef, useState } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { gift, memories } from './content';
import type { Memory } from './content';
import { limitWish } from './model';
import type { Action, State } from './model';
import { canonicalUrl, tryShare } from './share';

function WishForm({ state, dispatch }: { readonly state: State; readonly dispatch: Dispatch<Action> }) {
  const composing = useRef(false);
  const [draft, setDraft] = useState(state.wish);
  function update(value: string): void {
    setDraft(value);
    if (!composing.current) dispatch({ type: 'wish', value });
  }
  return <form onSubmit={(event) => { event.preventDefault(); dispatch({ type: 'wish', value: draft }); dispatch({ type: 'save' }); }}>
    <p className="eyebrow">A WISH, WRITTEN IN THE STARS</p><h2 id="dialog-title">把愿望写下来</h2><p className="dialog-description" id="wish-privacy">仅本次打开可见，不会发送。<br />愿望重载后清空，也不会随链接分享。</p>
    <label htmlFor="wish">你的生日愿望</label>
    <textarea id="wish" autoFocus rows={4} value={draft} aria-describedby="wish-privacy wish-count" placeholder="此刻，你最期待的事是什么？" onChange={(event) => update(composing.current ? event.target.value : limitWish(event.target.value))} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={(event) => { composing.current = false; update(limitWish(event.currentTarget.value)); }} />
    <p className="character-count" id="wish-count" aria-live="polite">{Array.from(draft).length} / 200</p>
    <div className="dialog-actions"><button className="primary" type="submit">写好了</button><button className="secondary" type="button" onClick={() => dispatch({ type: 'close' })}>这次不写</button></div>
  </form>;
}

function MemoryDetail({ memory }: { readonly memory: Memory }) {
  const [failed, setFailed] = useState(false);
  return <><p className="eyebrow">A MOMENT IN OUR ORBIT</p><p className="memory-date">{memory.date}</p><h2 id="dialog-title">{memory.title}</h2>
    {memory.image && !failed ? <figure className="memory-photo"><img src={memory.image} alt={memory.imageAlt ?? memory.title} onError={() => setFailed(true)} />{gift.isDemo && <figcaption>示例插画，替换为你的照片</figcaption>}</figure> : <div className="photo-placeholder"><span aria-hidden="true">✧</span><p>{failed ? '照片暂时没能抵达' : '为这一刻，留一个位置'}</p><span>故事依然在这里</span></div>}
    <p className="memory-story">{memory.text}</p></>;
}

function SharePanel() {
  const url = canonicalUrl(gift.canonicalUrl);
  const [status, setStatus] = useState<'ready' | 'loading' | 'copy' | 'manual' | 'shared' | 'copied'>('ready');
  const [cancelled, setCancelled] = useState(false);
  async function share(): Promise<void> {
    if (!url || status === 'loading') return;
    setStatus('loading');
    const result = await tryShare(navigator.share ? { share: (data) => navigator.share(data) } : {}, url);
    switch (result) {
      case 'shared': setStatus('shared'); break;
      case 'cancelled': setStatus('ready'); setCancelled(true); break;
      case 'copy': setStatus('copy'); break;
    }
  }
  async function copy(): Promise<void> {
    if (!url) return;
    try {
      if (!navigator.clipboard) { setStatus('manual'); return; }
      await navigator.clipboard.writeText(url); setStatus('copied');
    } catch (error) {
      if (error instanceof Error || error instanceof DOMException) setStatus('manual');
      else throw error;
    }
  }
  return <><p className="eyebrow">SEND A LITTLE STARLIGHT</p><h2 id="dialog-title">把星光，送到身边。</h2><p className="dialog-description">分享这份生日礼物。<br />链接里只会有星光，不会有你的愿望。</p>
    {!url ? <p className="share-local" role="status">当前为本地示例预览，正式分享待部署后开启。</p> : <>
      {(status === 'ready' || status === 'loading') && <button className="primary full" disabled={status === 'loading'} onClick={() => void share()}>{status === 'loading' ? '正在打开分享' : '分享生日宇宙'}</button>}
      {cancelled && status === 'ready' && <p role="status">已取消分享，星光还在这里。</p>}
      {status === 'copy' && <><p role="status">可以复制链接，送给想分享的人。</p><button className="primary full" onClick={() => void copy()}>复制链接</button></>}
      {status === 'manual' && <p role="status">长按或全选下面的链接，即可手动复制。</p>}
      {(status === 'copy' || status === 'manual' || status === 'copied') && <><label htmlFor="share-url">生日礼物链接</label><input id="share-url" value={url} readOnly onFocus={(event) => event.target.select()} /></>}
      {status === 'shared' && <p role="status">星光已经送出。</p>}{status === 'copied' && <p role="status">链接已复制。</p>}
    </>}
  </>;
}

export function GiftDialog({ state, dispatch }: { readonly state: State; readonly dispatch: Dispatch<Action> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const origin = document.activeElement;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    element?.querySelector<HTMLTextAreaElement>('textarea')?.focus({ preventScroll: true });
    return () => { element?.close(); document.body.style.overflow = overflow; if (origin instanceof HTMLElement && origin.isConnected) origin.focus({ preventScroll: true }); };
  }, []);
  let content: ReactNode;
  switch (state.overlay.kind) {
    case 'wish': content = <WishForm state={state} dispatch={dispatch} />; break;
    case 'memory': { const memory = memories.find(item => item.id === (state.overlay.kind === 'memory' ? state.overlay.id : '')); content = memory ? <MemoryDetail memory={memory} /> : <h2 id="dialog-title">这颗星球还没有故事。</h2>; break; }
    case 'share': content = <SharePanel />; break;
    case 'replay': content = <><p className="eyebrow">ONCE MORE, WITH LOVE</p><h2 id="dialog-title">重新点亮这片星光？</h2><p className="dialog-description">重播会清空这次写下的愿望。</p><div className="dialog-actions"><button className="secondary" onClick={() => dispatch({ type: 'close' })}>留在这里</button><button className="primary" onClick={() => dispatch({ type: 'replay' })}>清空并重播</button></div></>; break;
    case 'none': return null;
  }
  return <dialog className={`gift-dialog ${state.overlay.kind === 'memory' ? 'memory-dialog' : ''}`} ref={dialog} aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); dispatch({ type: 'close' }); }}><button className="close-button" aria-label="关闭弹窗" onClick={() => dispatch({ type: 'close' })}>×</button>{content}</dialog>;
}

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { gift } from './content';

function subscribeMotionPreference(update: () => void): () => void {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
}
export function useMotionPreference(): boolean {
  return useSyncExternalStore(subscribeMotionPreference, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
}

export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}

type AudioStatus = 'off' | 'loading' | 'on' | 'paused' | 'error';
export function useMusic(visible: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const wanted = useRef(false);
  const sequence = useRef(0);
  const [status, setStatus] = useState<AudioStatus>('off');
  useEffect(() => {
    const player = new Audio(gift.music);
    player.loop = true; player.preload = 'none'; player.volume = 0.35;
    audio.current = player;
    return () => { sequence.current++; player.pause(); player.removeAttribute('src'); player.load(); audio.current = null; };
  }, []);
  async function play(): Promise<void> {
    const player = audio.current;
    if (!player) return;
    const ticket = ++sequence.current;
    setStatus('loading');
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([player.play(), new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new DOMException('Audio timeout', 'TimeoutError')), 8000); })]);
      if (ticket !== sequence.current) return;
      if (!wanted.current || document.hidden) { player.pause(); return; }
      setStatus('on');
    } catch (error) {
      if (ticket !== sequence.current) return;
      if (error instanceof Error || error instanceof DOMException) { wanted.current = false; player.pause(); setStatus('error'); }
      else throw error;
    } finally { clearTimeout(timeout); }
  }
  useEffect(() => {
    if (!visible) { sequence.current++; audio.current?.pause(); if (wanted.current) setStatus('paused'); }
    else if (wanted.current) void play();
  }, [visible]);
  function toggle(): void {
    if (wanted.current) { wanted.current = false; sequence.current++; audio.current?.pause(); setStatus('off'); }
    else { wanted.current = true; void play(); }
  }
  const labels: Record<AudioStatus, string> = { off: '开启音乐', loading: '正在开启', on: '关闭音乐', paused: '音乐已暂停', error: '重试音乐' };
  return { status, label: labels[status], toggle };
}

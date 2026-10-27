import fs from 'node:fs/promises';



const rate = 22050;
const seconds = 16;
const samples = rate * seconds;
const wav = Buffer.alloc(44 + samples * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
for (let i = 0; i < samples; i++) {
  const time = i / rate;
  let value = 0;
  for (let note = 0; note < notes.length; note++) {
    const age = time - note * 1.8;
    if (age >= 0 && age < 3) {
      const envelope = Math.min(age * 30, 1) * Math.exp(-age * 1.8);
      value += Math.sin(2 * Math.PI * notes[note] * age) * envelope * 0.13;
      value += Math.sin(2 * Math.PI * notes[note] * 2 * age) * envelope * 0.025;
    }
  }
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), 44 + i * 2);
}
await fs.writeFile('public/starlight.wav', wav);
const text = [...new Set(Array.from('遇见你的那一刻星光有了归处点亮生日快乐为你而来的宇宙把愿望写下来愿我们年年相见生日这天送一整个宇宙看看我们的故事收藏在每一颗星球里一起看海第一次见面心动瞬间下一个明天重新愿望已收好吹灭蜡烛'))].join('');
try {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&text=' + encodeURIComponent(text), { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0' } }).then(r => r.text());
  const url = /url\((https:\/\/[^)]+)\)/.exec(css)?.[1];
  if (url) {
    const font = await fetch(url, { signal: AbortSignal.timeout(15000) }).then(r => r.arrayBuffer());
    await fs.writeFile('public/story-serif.woff2', Buffer.from(font));
    console.log('Self-hosted Noto Serif SC subset:', font.byteLength);
  } else { console.log('Font unavailable: system serif fallback will be used'); }
} catch (error) {
  if (!(error instanceof Error)) throw error;
  console.log('Font download unavailable:', error.message);
}
console.log('Original bell audio and self-hosted font prepared.');
await import('./prepare-planets.mjs');

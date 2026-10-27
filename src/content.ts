export type Memory = {
  readonly id: string; readonly title: string; readonly date: string;
  readonly text: string; readonly image?: string; readonly imageAlt?: string;
  readonly color: string; readonly size: number; readonly appearance: 'stone' | 'cloud' | 'rings' | 'moon';
};

export const gift = {
  isDemo: true,
  recipient: '亲爱的你',
  opening: ['遇见你的那一刻，', '星光有了归处。'],
  blessing: '愿你每一次抬头，都有星光回应。愿往后的日子，有热爱，也有温柔相伴。',
  canonicalUrl: import.meta.env['VITE_CANONICAL_URL'] ?? '',
  music: './starlight.wav',
} as const;

export const memories: readonly Memory[] = [
  { id: 'first', title: '第一次见面', date: '示例 · 某个初秋', text: '那天只是很普通的一天。后来才知道，有些相遇，会让往后每一天都变得不同。这里可以换成你们第一次见面的故事。', color: '#BBB6AC', size: 58, appearance: 'stone' },
  { id: 'sea', title: '一起看海', date: '示例 · 一个夏天', text: '海风很轻，我们沿着沙滩慢慢走。好多话还没说，天就亮了。这里留给那一次只属于你们的旅行。', color: '#8C9CA6', size: 76, appearance: 'cloud' },
  { id: 'moment', title: '心动瞬间', date: '示例 · 值得记住的今天', text: '那些让人心动的瞬间，像星光一样留在记忆里。不止生日这一天，每个平凡的日子，你都值得被认真对待。', image: './memory-orbit.webp', imageAlt: '星球轨道示例插画', color: '#C6AE98', size: 86, appearance: 'rings' },
  { id: 'future', title: '下一个明天', date: '示例 · 故事还在继续', text: '还有好多日落没有一起看，好多城市没有一起去。未来的轨道很长，愿我们继续并肩，把新的回忆一颗颗点亮。', color: '#B6AFBA', size: 45, appearance: 'moon' },
];

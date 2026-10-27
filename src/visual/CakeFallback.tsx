export function CakeFallback({ candles }: { readonly candles: number }) {
  const tiers = [{ rx: 114, y: 222, h: 45 }, { rx: 86, y: 177, h: 45 }, { rx: 56, y: 132, h: 45 }] as const;
  return <svg className="fallback-cake" viewBox="0 0 320 320" role="img" aria-label={'星光蛋糕，' + candles + ' 支蜡烛亮着'}>
    <defs><radialGradient id="flame-glow"><stop stopColor="#ffdfb0" stopOpacity=".65" /><stop offset="1" stopColor="#ffcf98" stopOpacity="0" /></radialGradient></defs>
    <g fill="none" stroke="#ddafc1" strokeWidth=".8">
      {tiers.map(tier => <g key={tier.rx}><ellipse cx="160" cy={tier.y} rx={tier.rx} ry={tier.rx * .24} /><ellipse cx="160" cy={tier.y + tier.h} rx={tier.rx} ry={tier.rx * .24} /><path d={`M ${160 - tier.rx} ${tier.y} v ${tier.h} M ${160 + tier.rx} ${tier.y} v ${tier.h}`} />
        {Array.from({ length: 32 }, (_, n) => { const a = n * Math.PI / 16; return <g key={n} fill="#f8dcea" stroke="none"><circle cx={160 + Math.cos(a) * tier.rx} cy={tier.y + Math.sin(a) * tier.rx * .24} r="1.1" /><circle cx={160 + Math.cos(a) * tier.rx} cy={tier.y + tier.h + Math.sin(a) * tier.rx * .24} r="1.1" /></g>; })}
      </g>)}
    </g>
    {[136, 160, 184].map((x, i) => <g key={x}><path d={`M${x} ${128 - (i === 1 ? 8 : 0)} v-40`} stroke="#eccbd6" strokeWidth="1.6" />{i < candles && <g className="breath-flame" style={{ transformOrigin: x + 'px ' + (88 - (i === 1 ? 8 : 0)) + 'px' }}><g className="flame"><circle cx={x} cy={76 - (i === 1 ? 8 : 0)} r="22" fill="url(#flame-glow)" /><path d={`M${x} ${64 - (i === 1 ? 8 : 0)} q-9 12 0 18 q9-6 0-18`} fill="#ffe8bc" /></g></g>}</g>)}
  </svg>;
}

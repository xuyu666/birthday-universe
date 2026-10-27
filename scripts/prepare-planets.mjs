import sharp from 'sharp';
const width = 512;
const height = 256;
const palettes = {
  stone: [[72, 69, 68], [140, 133, 120], [213, 204, 185]],
  cloud: [[46, 62, 79], [116, 144, 161], [208, 213, 207]],
  rings: [[103, 80, 66], [179, 155, 125], [225, 210, 180]],
  moon: [[64, 61, 72], [142, 135, 146], [203, 193, 200]],
};
function noise(u, v, seed) {
  return Math.sin(u * Math.PI * 6 + Math.sin(v * 9 + seed) * 2) * .4
    + Math.sin(u * Math.PI * 14 + Math.cos(v * 23) * 2 + seed) * .22
    + Math.cos(u * Math.PI * 30 + Math.sin(v * 41) + seed) * .13
    + Math.sin(u * Math.PI * 62 + v * 111) * .07;
}
const craters = Array.from({ length: 45 }, (_, i) => ({ u: (Math.sin(i * 37.1) + 1) / 2, v: (Math.cos(i * 19.7) + 1) / 2, r: .012 + (Math.sin(i * 8.3) + 1) * .023 }));
for (const [kind, palette] of Object.entries(palettes)) {
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width; const v = y / height;
      const rough = noise(u, v, 1.7);
      let value;
      if (kind === 'cloud' || kind === 'rings') {
        const frequency = kind === 'cloud' ? 75 : 115;
        const wind = rough * (kind === 'cloud' ? 3 : .9) + Math.sin(v * 22) * .7;
        value = .53 + Math.sin(v * frequency + wind) * .16 + Math.sin(v * 21 + rough) * .16 + rough * .09;
      } else {
        value = .54 + rough * .34 + noise(u, v * 2, 4.1) * .12;
        for (const crater of craters) {
          const du = Math.min(Math.abs(u - crater.u), 1 - Math.abs(u - crater.u));
          const d = Math.hypot(du * 2, v - crater.v) / crater.r;
          if (d < 1.3) value += Math.exp(-Math.pow((d - .92) * 8, 2)) * .13 - Math.exp(-d * d * 3) * .2;
        }
      }
      value = Math.max(0, Math.min(.999, value));
      const band = value < .5 ? 0 : 1; const blend = value < .5 ? value * 2 : (value - .5) * 2;
      for (let c = 0; c < 3; c++) pixels[(y * width + x) * 3 + c] = Math.round(palette[band][c] * (1 - blend) + palette[band + 1][c] * blend);
    }
  }
  await sharp(pixels, { raw: { width, height, channels: 3 } }).webp({ quality: 90 }).toFile(`public/planet-${kind}.webp`);
}
const size = 300;
const shade = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="light" cx="25%" cy="25%" r="80%"><stop stop-color="#ffedde" stop-opacity=".12"/><stop offset=".42" stop-color="#1c111e" stop-opacity="0"/><stop offset="1" stop-color="#06070e" stop-opacity=".95"/></radialGradient></defs><circle cx="150" cy="150" r="150" fill="url(#light)"/></svg>`);
const mask = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="150" cy="150" r="150" fill="white"/></svg>`);
const sphere = await sharp('public/planet-rings.webp').resize(size, size).ensureAlpha().composite([{ input: shade }, { input: mask, blend: 'dest-in' }]).png().toBuffer();
function background(w, h, title = false) {
  const stars = Array.from({ length: 60 }, (_, i) => `<circle cx="${(Math.sin(i * 13.1) + 1) * w / 2}" cy="${(Math.cos(i * 7.3) + 1) * h / 2}" r="${i % 8 === 0 ? 1.1 : .5}" fill="#d9c3ce" opacity="${.15 + (i % 4) * .13}"/>`).join('');
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="haze"><stop stop-color="#382632"/><stop offset="1" stop-color="#100b10"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#haze)"/>${stars}<ellipse cx="${title ? 920 : 420}" cy="${h / 2}" rx="${title ? 230 : 270}" ry="70" transform="rotate(-22 ${title ? 920 : 420} ${h / 2})" fill="none" stroke="#bca0af" opacity=".3"/>${title ? '<text x="90" y="205" fill="#bba4b0" font-size="15" font-family="sans-serif" letter-spacing="5">A LITTLE UNIVERSE</text><text x="90" y="315" fill="#f4e9e7" font-size="66" font-family="Georgia,serif">Every moment.</text><text x="90" y="395" fill="#f4e9e7" font-size="66" font-family="Georgia,serif">In orbit.</text><text x="90" y="500" fill="#d8c2c8" font-size="22" font-family="Georgia,serif">A little stardust. A birthday wish.</text>' : ''}</svg>`);
}
await sharp(background(840, 500)).composite([{ input: sphere, left: 270, top: 100 }]).webp({ quality: 88 }).toFile('public/memory-orbit.webp');
await sharp(background(1200, 630, true)).composite([{ input: sphere, left: 770, top: 165 }]).jpeg({ quality: 88 }).toFile('public/share-cover.jpg');
console.log('Prepared four procedural planetary textures, memory art, and flower-free share cover.');

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { canonicalUrl } from './src/share.ts';

export default defineConfig(({ mode }) => {
  const url = canonicalUrl(loadEnv(mode, process.cwd(), 'VITE_')['VITE_CANONICAL_URL'] ?? process.env['VITE_CANONICAL_URL'] ?? '');
  return {
  plugins: [react(), tailwindcss(), {
    name: 'gift-share-metadata',
    transformIndexHtml(html) {
      if (!url) return html;
      const escapedUrl = url.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
      return html.replace('content="./share-cover.jpg"', `content="${new URL('share-cover.jpg', url).href}"`).replace('</head>', `<link rel="canonical" href="${escapedUrl}" /><meta property="og:url" content="${escapedUrl}" /></head>`);
    },
  }],
  base: './',
  build: { target: 'es2022' },
}; });

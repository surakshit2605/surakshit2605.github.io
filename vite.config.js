import { defineConfig } from 'vite';
import sitePlugin, { securityHeaders } from './scripts/vite-site-plugin.js';
import { site } from './src/data/site.js';
import { profile, contact } from './src/data/content.js';

const sameAs = contact.links.map((l) => l.href).filter((h) => /^https:\/\//.test(h));

export default defineConfig({
  // Use './' so the built site works on GitHub Pages sub-paths and any static host.
  base: './',
  plugins: [sitePlugin(site, profile, sameAs)],
  // `npm run preview` serves the production build with the same security headers,
  // so a CSP problem shows up on your machine, not after you publish.
  preview: { headers: securityHeaders(site) },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'], gsap: ['gsap'] },
      },
    },
  },
});

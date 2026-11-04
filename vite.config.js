import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { buildInputs } from './scripts/content.mjs';
import { atlasArrival } from './scripts/vite/atlas-arrival.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const works = JSON.parse(readFileSync(new URL('./content/works.json', import.meta.url), 'utf8'));

export default defineConfig({
  base: './',
  plugins: [atlasArrival(works)],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    target: 'es2022',
    manifest: true,
    rolldownOptions: {
      input: buildInputs(works, root),
      output: { manualChunks: id => id.includes('/node_modules/three/') ? 'three' : undefined },
    },
  },
});

import { WebGLRenderer, SRGBColorSpace, AgXToneMapping, ACESFilmicToneMapping, NoToneMapping } from 'three';
import { configureLoaders } from './loaders.js';
export function createRenderer(canvas, { toneMapping = 'agx', exposure = 1, maxPixelRatio = 2, alpha = false } = {}) {
  const mappings = { agx: AgXToneMapping, aces: ACESFilmicToneMapping, none: NoToneMapping };
  if (!(toneMapping in mappings)) throw new Error(`未知 toneMapping：${toneMapping}`);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = mappings[toneMapping]; renderer.toneMappingExposure = exposure;
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, maxPixelRatio));
  configureLoaders(renderer);
  return renderer;
}

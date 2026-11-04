import { Vector2 } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export function createComposer(renderer, scene, camera, { bloom = false } = {}) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (bloom) {
    const { strength = 1, radius = 0.4, threshold = 0.85 } = bloom === true ? {} : bloom;
    composer.addPass(new UnrealBloomPass(renderer.getSize(new Vector2()), strength, radius, threshold));
  }
  composer.addPass(new OutputPass());
  return composer;
}

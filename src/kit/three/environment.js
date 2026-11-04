import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
const hdr = new HDRLoader();
export const loadHDR = url => hdr.loadAsync(url);
export function roomEnvironment(renderer, scene) {
  let target;
  const generate = () => {
    const source = new RoomEnvironment(); const pmrem = new PMREMGenerator(renderer);
    const next = pmrem.fromScene(source); source.dispose(); pmrem.dispose();
    target?.dispose(); target = next; scene.environment = target.texture;
  };
  generate();
  // Render-target contents do not survive context loss; rebuild the procedural environment.
  renderer.domElement.addEventListener('webglcontextrestored', generate);
  return { get texture() { return target.texture; }, dispose() {
    renderer.domElement.removeEventListener('webglcontextrestored', generate);
    if (scene.environment === target.texture) scene.environment = null;
    target.dispose();
  } };
}

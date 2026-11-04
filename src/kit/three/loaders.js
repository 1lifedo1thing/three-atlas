import { TextureLoader, SRGBColorSpace } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
const textureLoader = new TextureLoader();
let gltf, draco, ktx;
/** Standard work routes are experiences/<id>/; override for another embedding route. */
export function configureLoaders(renderer, { decoderRoot = new URL('../../vendor/', document.baseURI).href } = {}) {
  if (!gltf) {
    draco = new DRACOLoader().setDecoderPath(`${decoderRoot}draco/`);
    ktx = new KTX2Loader().setTranscoderPath(`${decoderRoot}basis/`);
    gltf = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx).setMeshoptDecoder(MeshoptDecoder);
  }
  ktx.detectSupport(renderer);
}
export function loadGLTF(url) {
  if (!gltf) throw new Error('先调用 createRenderer 或 configureLoaders，再加载 glTF。');
  return gltf.loadAsync(url);
}
export async function loadTexture(url) {
  const texture = await textureLoader.loadAsync(url); texture.colorSpace = SRGBColorSpace; return texture;
}
export function disposeLoaders() { draco?.dispose(); ktx?.dispose(); gltf = draco = ktx = undefined; }

import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
export async function copyDecoders(root = process.cwd()) {
  const source = resolve(import.meta.dirname, '../node_modules/three/examples/jsm/libs');
  const output = resolve(root, 'public/vendor'); await mkdir(output, { recursive: true });
  await cp(resolve(source, 'draco/gltf'), resolve(output, 'draco'), { recursive: true });
  await cp(resolve(source, 'draco/README.md'), resolve(output, 'draco/README.md'));
  await cp(resolve(import.meta.dirname, '../third-party/kit/draco-LICENSE.txt'), resolve(output, 'draco/LICENSE.txt'));
  await cp(resolve(import.meta.dirname, '../third-party/kit/basis-LICENSE.txt'), resolve(output, 'basis-LICENSE.txt'));
  await cp(resolve(source, 'basis'), resolve(output, 'basis'), { recursive: true });
  await cp(resolve(import.meta.dirname, '../node_modules/three/LICENSE'), resolve(output, 'three-LICENSE.txt'));
}

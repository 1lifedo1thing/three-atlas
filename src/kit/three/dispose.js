/** Dispose each shared GPU resource once; includes material uniforms and userData targets. */
export function disposeObject(root) {
  const seen = new Set(), scanned = new Set();
  const dispose = value => { if (value && !seen.has(value)) { seen.add(value); value.dispose(); } };
  const scan = value => {
    if (!value || typeof value !== 'object' || scanned.has(value)) return;
    scanned.add(value);
    if (value.isTexture || value.isRenderTarget) { dispose(value); return; }
    if (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype) Object.values(value).forEach(scan);
  };
  root.traverse(object => {
    if (object.geometry) dispose(object.geometry);
    for (const material of [object.material].flat().filter(Boolean)) {
      Object.values(material).forEach(scan); dispose(material);
    }
    scan(object.userData); scan(object.renderTarget); scan(object.shadow?.map);
  });
  scan(root.background); scan(root.environment);
}

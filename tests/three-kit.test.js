import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Mesh, BoxGeometry, MeshBasicMaterial, Texture, WebGLRenderTarget } from 'three';
const kit = await import('../src/kit/three/index.js').catch(()=>null);
test('持续慢帧才降像素比，单次卡顿不降且不低于下限',()=>{
  assert.ok(kit?.adaptivePixelRatio,'缺少 three kit');
  let ratio=2;const renderer={getPixelRatio:()=>ratio,setPixelRatio:n=>{ratio=n}};
  const quality=kit.adaptivePixelRatio(renderer,{});
  quality.update(100);assert.equal(ratio,2);
  quality.update(10);for(let i=0;i<30;i++)quality.update(30);
  assert.equal(ratio,1.75);for(let i=0;i<300;i++)quality.update(30);assert.equal(ratio,1);
});
test('释放共享几何、纹理、材质与渲染目标各一次',()=>{
  assert.ok(kit?.disposeObject,'缺少资源回收');
  const scene=new Scene(),geometry=new BoxGeometry(),texture=new Texture(),material=new MeshBasicMaterial({map:texture}),target=new WebGLRenderTarget();
  scene.add(new Mesh(geometry,material),new Mesh(geometry,material));scene.userData.target=target;
  const counts=new Map;for(const value of [geometry,texture,material,target])value.addEventListener('dispose',()=>counts.set(value,(counts.get(value)??0)+1));
  kit.disposeObject(scene);for(const value of [geometry,texture,material,target])assert.equal(counts.get(value),1);
});
test('循环可暂停、隐藏时停止，手动暂停不会被显示页面覆盖',()=>{
  assert.ok(kit?.createLoop,'缺少渲染循环');
  const previous=globalThis.document;const doc=new EventTarget();doc.hidden=false;globalThis.document=doc;
  try {
    let callback=null,ticks=0;const renderer={setAnimationLoop:fn=>{callback=fn}};
    const loop=kit.createLoop(renderer,()=>ticks++);loop.start();assert.equal(typeof callback,'function');callback(performance.now());assert.equal(ticks,1);
    doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(callback,null);
    loop.setPaused(true);doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(callback,null);
    loop.setPaused(false);assert.equal(typeof callback,'function');loop.stop();assert.equal(callback,null);loop.start();assert.equal(typeof callback,'function');loop.dispose();assert.equal(callback,null);
  } finally {globalThis.document=previous;}
});

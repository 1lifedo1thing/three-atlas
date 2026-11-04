# Three.js 复用套件

`src/kit/three/index.js` 基于已安装的 three 0.186.1 官方源码与 addons。原 WHERE STARS REST 不使用此套件，源码未重构。

- `createRenderer(canvas, options)`：AgX（可选 aces/none）、sRGB 输出、限制 DPR，并初始化共享 Draco/KTX2/Meshopt glTF 加载器。普通图片默认作 sRGB 色彩图；法线等数据纹理由调用者设置 `NoColorSpace`。
- `createLoop(renderer, (delta, elapsed, timestamp) => {})`：Timer 和 setAnimationLoop；start/stop、手动暂停与页面隐藏独立；结束调用 dispose。
- `observeSize(renderer, camera, {onResize})`：观察 canvas 父容器（无父容器时观察 canvas），返回取消函数。回调收到 width/height/pixelRatio，可同步 composer；正交相机的取景范围由调用者确定。
- `createOrbit(camera, dom, options)`：阻尼、键盘、缩放范围与减少动态下禁用自动旋转。canvas 要可聚焦；结束调用 controls.dispose。
- `roomEnvironment(renderer, scene)`：返回 `{texture, dispose}`，临时 RoomEnvironment 与 PMREMGenerator 生成后释放；上下文恢复会重新生成环境渲染目标，避免照明内容丢失。HDRLoader 使用 `loadHDR(url)`，贴图归调用者释放。
- `loadGLTF(url)`、`loadTexture(url)`：共享加载器。标准作品路由的解码器在 `../../vendor/`；其他路由在首次初始化时显式调用 `configureLoaders(renderer,{decoderRoot})`。`disposeLoaders()` 结束全部加载器使用。
- `createComposer(renderer, scene, camera, {bloom})`：RenderPass → 可选 UnrealBloomPass → OutputPass；bloom 可传 strength/radius/threshold。结束逐个 pass.dispose，再 composer.dispose。
- `disposeObject(root)`：共享资源去重，释放 geometry/material、材质纹理与 uniforms 中的纹理、userData 中的渲染目标、阴影目标和场景环境。
- `adaptivePixelRatio(renderer, options)`：update(frameMs)，连续 30 帧超预算后降低 0.25，默认范围 1–2、预算 20ms；reset 清空慢帧计数。可传 onChange 同步后处理像素比。
- `guardContext(canvas, callbacks)`：丢失时 preventDefault；回调暂停/恢复循环，返回清理函数。

构建前 `scripts/vendor.mjs` 从当前锁定依赖的 `three/examples/jsm/libs` 复制解码器、上游说明和许可证，不依赖 CDN。构建产物包含解码器，生成的 public/vendor 不提交。

验证覆盖真实 GPU glTF 加载、RoomEnvironment、Bloom/OutputPass、键盘 Orbit、ResizeObserver、WebGL 上下文丢失/恢复，以及资源释放、暂停与持续慢帧降级。未宣称已测所有压缩格式的真实资源文件；DRACO/KTX2/Meshopt 接线与官方解码器路径已配置。

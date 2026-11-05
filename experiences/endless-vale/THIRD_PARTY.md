# 来源与许可

- [Three.js](https://github.com/mrdoob/three.js)，Three.js authors，版本 0.186.1，[MIT](./third-party/three-LICENSE.txt)。使用 WebGLRenderer、实例化网格、阴影、BufferGeometryUtils、FullScreenQuad 与 UnrealBloomPass；河面反射参考了官方 Reflector 的斜裁剪平面做法，在本作品中重写为固定水平面。引擎由仓库依赖统一提供，未修改上游源码。
- [Vite](https://github.com/vitejs/vite)，Vite contributors，版本 8.3.5，[许可证](./third-party/vite-LICENSE.txt)。用于本地开发、Worker 打包与构建。

simplex 噪声按 Stefan Gustavson 公开描述的二维算法自行实现，伪随机数使用公开的 mulberry32 与整数哈希思路，均为本项目代码。

地形、模型、材质、天空、粒子与动画全部由程序生成，没有使用外部模型、贴图、照片、字体文件或音频。封面来自作品初始视角的真实浏览器渲染。

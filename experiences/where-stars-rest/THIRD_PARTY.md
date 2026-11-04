# 第三方依赖

场景几何、纹理算法、页面与音效代码为本项目编写，没有使用外部模型、图片、字体或音频。

| 依赖 | 作者 / 维护者 | 来源 | 许可证 | 用途 |
| --- | --- | --- | --- | --- |
| Three.js 0.186.1 | three.js authors，发起者 mrdoob / Ricardo Cabello | https://github.com/mrdoob/three.js | MIT，见 `third-party/three-LICENSE.txt` | 3D 引擎、OrbitControls、几何合并、官方后处理插件 |
| Vite 8.3.5 | Vite contributors，发起者 Evan You | https://github.com/vitejs/vite | MIT，见 `third-party/vite-LICENSE.txt` | 本地开发与生产构建 |

使用的 Three.js 官方插件通过 npm 包直接引用，未修改上游源文件。项目自行扩展材质的 `onBeforeCompile` 以实现石材纹理、风和树叶自发光。

实现参考：

- [GTAOPass 官方文档](https://threejs.org/docs/pages/GTAOPass.html)
- [UnrealBloomPass 官方文档](https://threejs.org/docs/pages/UnrealBloomPass.html)
- [Vite 官方设置说明](https://vite.dev/guide/)

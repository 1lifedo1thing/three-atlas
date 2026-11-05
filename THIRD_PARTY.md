# 第三方来源与许可证

首页与作品集合代码为本项目编写。WHERE STARS REST 由观默维护，从作者已有场景导入独立源码副本；不从相邻目录动态加载资源。

| 依赖 | 作者 / 维护者 | 来源 | 许可证 | 用途 |
| --- | --- | --- | --- | --- |
| Three.js 0.186.1 | three.js authors；发起者 mrdoob / Ricardo Cabello | https://github.com/mrdoob/three.js | MIT，见 `experiences/where-stars-rest/third-party/three-LICENSE.txt` | 3D 引擎及官方控制器、后处理插件 |
| Fredoka 700 | The Fredoka Project Authors | https://github.com/hafontia/Fredoka-One | SIL Open Font License 1.1，版权与许可全文内嵌于 `experiences/atoll-jelly/index.html` | Atoll Jelly 页面内嵌字体，未修改 |
| Geist 字体（@fontsource-variable/geist 5.3.0） | Vercel；Basement Studio 设计 | https://github.com/vercel/geist-font | SIL Open Font License 1.1 | 首页拉丁文字体，随站点自托管，未修改 |
| Geist Mono 字体（@fontsource-variable/geist-mono 5.3.0） | Vercel；Basement Studio 设计 | https://github.com/vercel/geist-font | SIL Open Font License 1.1 | 首页等宽标签，自托管，未修改 |
| GSAP 3.15.1（含 ScrollTrigger、SplitText） | GreenSock / Webflow | https://gsap.com | GSAP Standard "No Charge" License（https://gsap.com/standard-license），可免费商用 | 首页滚动动效与文字动画 |
| Lenis 1.3.27 | darkroom.engineering | https://github.com/darkroomengineering/lenis | MIT | 首页平滑滚动 |
| Vite 8.3.5 | Vite contributors；发起者 Evan You | https://github.com/vitejs/vite | MIT，见 `experiences/where-stars-rest/third-party/vite-LICENSE.txt` | 开发服务与多页面静态构建 |
| Playwright Test 1.58.0 | Microsoft / Playwright contributors | https://github.com/microsoft/playwright | Apache-2.0（https://github.com/microsoft/playwright/blob/main/LICENSE） | 仅开发验证：独立浏览器截图、录屏与回归测试 |

| Sharp 0.35.5 | Lovell Fuller / Sharp contributors | https://github.com/lovell/sharp | Apache-2.0 | 仅构建：真实封面平均色与响应式图片 |

| Lighthouse CI 0.16.0 | GoogleChrome contributors | https://github.com/GoogleChrome/lighthouse-ci | Apache-2.0 | 仅开发：本地移动性能与质量预算，无报告上传 |

| axe-core Playwright 4.14.0 | Deque Systems | https://github.com/dequelabs/axe-core-npm | MPL-2.0 | 仅开发：自动无障碍复核，未修改依赖源码 |

| Draco 解码器（随 three 0.186.1 分发） | Google Draco contributors | https://github.com/google/draco | Apache-2.0，见 third-party/kit/draco-LICENSE.txt（含上游附带的许可通知） | prebuild 原样复制官方 glTF 解码器到 public/vendor/draco |
| Basis Universal 转码器（随 three 0.186.1 分发） | Binomial LLC contributors | https://github.com/BinomialLLC/basis_universal | Apache-2.0，见 third-party/kit/basis-LICENSE.txt | prebuild 原样复制官方转码器到 public/vendor/basis |
| Meshoptimizer（随 three 0.186.1 分发） | Arseny Kapoulkine / zeux | https://github.com/zeux/meshoptimizer | MIT，保留官方模块内版权说明 | glTF Meshopt 解码 |

保留首作的完整说明：[WHERE STARS REST 第三方依赖](./experiences/where-stars-rest/THIRD_PARTY.md)。没有修改上游依赖源码。

`public/media/where-stars-rest.jpg` 是本仓库作品的真实浏览器截图。采集时临时隐藏界面，随后恢复；未改动场景几何、材质或灯光。

浏览方式参考：

- [Awesome AI Motion](https://github.com/guanmo-ai/awesome-ai-motion)：封面卡片汇总内容的浏览方式。没有复制其脚本、字体、媒体或样式。
- [Tripo Studio](https://studio.tripo3d.ai/)：作品画廊参考。没有使用其代码、品牌或模型资产。

依赖许可证不代表本项目的整体许可证，后者尚未选择。

开发依赖安全维护：Lighthouse CI 仍为 0.16.0，使用 npm overrides 将其依赖链的 basic-ftp 固定至 6.2.6（Patrick Juchli，MIT，https://github.com/patrickjuchli/basic-ftp），将 glob 9+ 固定至 14.0.3（Isaac Z. Schlueter，BlueOak-1.0.0，https://github.com/isaacs/node-glob），后者带入 minimatch 11.0.4。旧工具使用的 glob 7 保持原兼容版本。这些包只供开发工具使用，不进入网站运行时包；未修改上游源码。

`public/media/atoll-jelly.jpg` 来自 Atoll Jelly 自身的 WebGPU 画布，采集时临时将画布渲染尺寸设为 2880 × 1800，未修改场景几何、材质或光照。

`public/media/endless-vale.jpg` 来自 ENDLESS VALE 初始视角的真实浏览器渲染（2880 × 1800），采集时仅临时隐藏界面，未修改场景。该作品的来源说明见 [ENDLESS VALE 第三方依赖](./experiences/endless-vale/THIRD_PARTY.md)。

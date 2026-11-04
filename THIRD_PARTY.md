# 第三方来源与许可证

首页与作品集合代码为本项目编写。WHERE STARS REST 由观默维护，从作者已有场景导入独立源码副本；不从相邻目录动态加载资源。

| 依赖 | 作者 / 维护者 | 来源 | 许可证 | 用途 |
| --- | --- | --- | --- | --- |
| Three.js 0.186.1 | three.js authors；发起者 mrdoob / Ricardo Cabello | https://github.com/mrdoob/three.js | MIT，见 `experiences/where-stars-rest/third-party/three-LICENSE.txt` | 3D 引擎及官方控制器、后处理插件 |
| Geist 字体（@fontsource-variable/geist 5.3.0） | Vercel；Basement Studio 设计 | https://github.com/vercel/geist-font | SIL Open Font License 1.1 | 首页拉丁文字体，随站点自托管，未修改 |
| Geist Mono 字体（@fontsource-variable/geist-mono 5.3.0） | Vercel；Basement Studio 设计 | https://github.com/vercel/geist-font | SIL Open Font License 1.1 | 首页等宽标签，自托管，未修改 |
| GSAP 3.15.1（含 ScrollTrigger、SplitText） | GreenSock / Webflow | https://gsap.com | GSAP Standard "No Charge" License（https://gsap.com/standard-license），可免费商用 | 首页滚动动效与文字动画 |
| Lenis 1.3.27 | darkroom.engineering | https://github.com/darkroomengineering/lenis | MIT | 首页平滑滚动 |
| Vite 8.3.5 | Vite contributors；发起者 Evan You | https://github.com/vitejs/vite | MIT，见 `experiences/where-stars-rest/third-party/vite-LICENSE.txt` | 开发服务与多页面静态构建 |
| Playwright Test 1.58.0 | Microsoft / Playwright contributors | https://github.com/microsoft/playwright | Apache-2.0（https://github.com/microsoft/playwright/blob/main/LICENSE） | 仅开发验证：独立浏览器截图、录屏与回归测试 |

| Sharp 0.35.5 | Lovell Fuller / Sharp contributors | https://github.com/lovell/sharp | Apache-2.0 | 仅构建：真实封面平均色与响应式图片 |

保留首作的完整说明：[WHERE STARS REST 第三方依赖](./experiences/where-stars-rest/THIRD_PARTY.md)。没有修改上游依赖源码。

`public/media/where-stars-rest.jpg` 是本仓库作品的真实浏览器截图。采集时临时隐藏界面，随后恢复；未改动场景几何、材质或灯光。

浏览方式参考：

- [Awesome AI Motion](https://github.com/guanmo-ai/awesome-ai-motion)：封面卡片汇总内容的浏览方式。没有复制其脚本、字体、媒体或样式。
- [Tripo Studio](https://studio.tripo3d.ai/)：作品画廊参考。没有使用其代码、品牌或模型资产。

依赖许可证不代表本项目的整体许可证，后者尚未选择。

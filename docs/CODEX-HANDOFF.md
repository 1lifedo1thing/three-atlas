# 交接清单（给 Codex）

Claude 负责设计（版式、视觉、动效、文案、组件 API）；下面是工程事项。开工前读 `AGENTS.md`、`docs/design-system.md`、`docs/OPUS-HANDOFF.md`。

规则：
- 改动不得改变现有页面的观感，涉及视觉的必须附改动前后的截图（桌面 1440×900、手机 390×844，中英文各一套）。
- 做完一项就删掉一项，并在 `docs/verification.md` 记录验证方法和结果。
- 一项一个提交，提交信息使用 Conventional Commits。

## 1. three.js 复用套件 `src/kit/three/`（最高优先级）

给以后的作品页使用，全部基于 three.js 0.186.1 官方 `three/addons`，不引入第三方渲染框架。写法参考官方 examples 和 manual：`webgl_loader_gltf`、`webgl_postprocessing_unreal_bloom`、`misc_controls_orbit`，以及 manual 里的 Responsive Design、Disposing Objects、Rendering on Demand 三章。

| 模块 | 导出 | 要求 |
| --- | --- | --- |
| `renderer.js` | `createRenderer(canvas, { toneMapping = 'agx', exposure = 1, maxPixelRatio = 2, alpha = false })` | 设置 `outputColorSpace = SRGBColorSpace`；像素比取 `min(devicePixelRatio, maxPixelRatio)`；`toneMapping` 可选 `agx`、`aces`、`neutral`、`none` |
| `loop.js` | `createLoop(renderer, tick)` → `{ start, stop, setPaused }` | 基于 `renderer.setAnimationLoop` 和 `Timer`；页面隐藏时暂停；`tick(delta, elapsed)` |
| `resize.js` | `observeSize(renderer, camera, { onResize })` | 使用 `ResizeObserver`，同步更新 `camera.aspect`、`updateProjectionMatrix` 和 composer 尺寸 |
| `controls.js` | `createOrbit(camera, dom, { target, autoRotate, minDistance, maxDistance, reducedMotion })` → `{ controls, reset, setAutoRotate }` | 开启阻尼和键盘（`listenToKeyEvents`）；减少动态效果时关闭自动旋转 |
| `environment.js` | `roomEnvironment(renderer, scene)`、`loadHDR(url)` | 使用 `RoomEnvironment` 加 `PMREMGenerator`；`HDRLoader` 用于 `.hdr` 文件 |
| `loaders.js` | `loadGLTF(url)`、`loadTexture(url)` | 共享单例 `GLTFLoader`，挂 `DRACOLoader`、`KTX2Loader`、`MeshoptDecoder`；解码器从 `three/examples/jsm/libs/` 复制到 `public/vendor/`（用 `predev`/`prebuild` 脚本复制） |
| `post.js` | `createComposer(renderer, scene, camera, { bloom })` | `EffectComposer` → `RenderPass` →（可选）`UnrealBloomPass` → `OutputPass` |
| `dispose.js` | `disposeObject(root)` | 遍历并释放 geometry、material、纹理和渲染目标 |
| `quality.js` | `adaptivePixelRatio(renderer, { min = 1, max = 2, budgetMs = 20 })` | 2 秒内平均帧时间超过预算时逐级降低像素比 |
| `lifecycle.js` | `guardContext(canvas, { onLost, onRestored })` | 处理 `webglcontextlost` 和 `webglcontextrestored` |

- 每个模块配 Node 测试（不依赖 WebGL 的部分），或在 `experiences/_template` 里做浏览器验证。
- **不重构 WHERE STARS REST**。它保持原样，除非用户明确要求迁移。

## 2. 作品模板与脚手架

- `experiences/_template/`：最小可用的作品页。用第 1 项的套件搭一个带环境光的 GLTF 场景，界面使用 Atlas UI 令牌（返回 Three Atlas、作品名、拖动提示、暂停和复位）。场景就绪时给 `body` 加 `ready`。构建入口要忽略 `_template`。
- `npm run new:work -- <id> "<TITLE>" "<中文副标题>"`：复制模板，在 `content/works.json` 追加条目（`featured` 默认不设），并提示补封面。
- 验收：新作品出现在首页目录；直接访问可刷新；从首页进入时封面无缝过渡到场景。

## 3. 组件陈列页 `pages/ui/`

- 一个不对外链接的页面（加 `noindex`），展示 `src/ui` 全部组件和状态：按钮三种变体、徽标、卡片的悬停与缺图状态、目录的空结果、亮点图集、中英文各一份。
- 用途：组件回归测试。Playwright 截图后与基线对比（`npm run test:visual`），差异超过 0.5% 时失败。

## 4. 高清封面与响应式图片

- 从作品初始视角重新截取 2880×1800 封面（流程同首作：临时隐藏 UI，截图后恢复，不改场景）。
- 构建时生成 AVIF 和 WebP，宽度 720、1440、2880 各一份；组件输出 `srcset`/`sizes`：卡片约 50vw，开窗和亮点图为 100vw。
- `.ui-ambient` 环境光层改用 160px 宽的小图。
- 验收：Lighthouse 的 LCP 不变差；2x 屏下封面清晰。

## 5. 卡片视频预览（等有 2–3 个作品后再做）

- works.json 增加可选字段 `preview`：`media/<id>.webm` 和 `.mp4`，6 秒，静音循环，最长边 1280。
- 行为：桌面端在悬停或聚焦卡片时播放，手机端在卡片位于视口中央时播放。同一时间最多播放 1 个，离开视口立即暂停。开启「减少动态效果」或 `Save-Data` 时只显示封面。视频加载完成后用 400ms 淡入，加载失败时保留封面。

## 6. 分享卡片和 meta

- 首页和每个作品页加上 `og:*` 与 `twitter:card`。og:image 用封面，绝对 URL 在构建时通过环境变量 `SITE_URL` 注入。

## 7. 部署（需要用户授权后再做）

- 用户希望使用免费的 `guanmo-ai.github.io/three-atlas`。前提是用户把仓库改为公开，并在 Settings → Pages 中选 GitHub Actions。
- 新增 `.github/workflows/deploy.yml`：在 `main` 上执行 `npm ci`、`npm run check`、`npm test`、`npm run build`，然后部署 `dist/`。

## 8. 真机验收

- 在 Chrome 和 Edge（桌面与安卓）、Safari 18.2+（macOS 与 iOS）上检查四项：
  - 开窗滚动流畅；
  - 宣言逐词点亮；
  - 亮点图集可以拖动和翻页；
  - 首页与作品之间的跨页过渡无缝。
- 在 Firefox 上，跨页过渡应为普通跳转，没有报错。
- 在本地无 GPU 的软件渲染环境里，跨页过渡偶尔会被浏览器跳过，需要用真机确认。

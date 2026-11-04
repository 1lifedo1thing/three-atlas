# 交接清单（给 Codex）

分工：**Claude 负责设计**（版式、视觉、动效、文案、典故、组件 API）；**Codex 负责下面所有工程事项**。开工前读 `AGENTS.md`、`docs/design-system.md`、`docs/OPUS-HANDOFF.md`。

规则：
- **不改观感，不改文案。** 遇到需要设计判断的地方，在 PR 描述里写明问题，留给 Claude，不要自己决定。涉及界面的改动附改动前后截图（桌面 1440×900、手机 390×844，中英文各一套）。
- 做完一项就从本文删掉，并在 `docs/verification.md` 记下验证方法和结果。
- 一项一个提交，使用 Conventional Commits。每次提交前跑 `npm run check`、`npm test`、`npm run build`。
- 推送、公开仓库、配置部署都需要用户授权（见 `AGENTS.md`）。

---

## P0 · 先做

### 1. 中文衬线字体子集化

**现状**：`src/ui/tokens.css` 临时引入了完整的 `@fontsource/noto-serif-sc/500.css`，有 101 个分片。虽然浏览器只下载用到的分片，`dist/` 却因此涨到 8.7 MB。

**要求**：
- 新增 `npm run fonts`：收集所有用衬线渲染的中文字符，从 Noto Serif SC Medium 子集化出 `src/ui/fonts/atlas-serif-sc.woff2`，`font-family` 命名为 `Atlas Serif SC`（`--f-serif` 里已预留，排在 Noto Serif SC 之前）。
  - 字符来源：`src/gallery/copy.js` 的引文、典故和单字，`MODES` 的 glyph，`craft[].glyph`/`title`；`content/works.json` 中 `highlights[].title`、`text` 的中文。可以直接收集这两个文件里的全部中文字符，更稳妥。
- 只提交生成的子集 woff2（目标 ≤ 120 KB）和生成脚本，原始大字体不进仓库。在 `@font-face` 里写 `font-display: swap`。
- `npm run check` 增加校验：如果 copy 或 works.json 中有子集里没有的字，就失败，并提示运行 `npm run fonts`。
- 移除 `@fontsource/noto-serif-sc` 依赖，同步更新 `THIRD_PARTY.md`（来源改为子集字体，许可证仍是 OFL 1.1）。
- **验收**：`dist/` 回落到 2 MB 以内（不含作品页的 three.js 包）；首页中英文与改动前逐屏截图对比无差异；删掉子集里的一个字后，`npm run check` 会报错。

### 2. `highlights` 校验与测试

- `scripts/content.mjs`：
  - `mode` 必须是 `walk`、`gaze`、`wander`、`dwell` 之一，同一作品内不重复；
  - `tech` 必须有中英文；
  - `featured` 作品如果写了 `highlights`，必须四种 `mode` 都有，因为首页四条屏固定为四幅。
- 在 `tests/catalog.test.js` 中补充对应的测试用例。

### 3. 文风检查 `scripts/check-copy.mjs`（加入 `npm run check`）

依据 `docs/design-system.md` 第 8 节，扫描 `src/gallery/copy.js` 和 `content/works.json`：
- 不允许出现感叹号（！和 !）；
- 不允许出现禁用词：极致、颠覆、震撼、史诗级、炸裂、黑科技；
- `copy.js` 中每一句古典引文（目前是 `woyouQuote`）都必须出现在 design-system 的「已用典故登记」表里。

出错时列出文件、字段和原因。

---

## P1 · 复用能力

### 4. three.js 复用套件 `src/kit/three/`

给以后的作品页使用，全部基于 three.js 0.186.1 官方 `three/addons`。写法参考官方 examples（`webgl_loader_gltf`、`webgl_postprocessing_unreal_bloom`、`misc_controls_orbit`）和 manual（Responsive Design、Disposing Objects、Rendering on Demand）。

| 模块 | 导出 | 要求 |
| --- | --- | --- |
| `renderer.js` | `createRenderer(canvas, { toneMapping = 'agx', exposure = 1, maxPixelRatio = 2, alpha = false })` | `outputColorSpace = SRGBColorSpace`；像素比取 `min(devicePixelRatio, maxPixelRatio)` |
| `loop.js` | `createLoop(renderer, tick)` → `{ start, stop, setPaused }` | 基于 `setAnimationLoop` 和 `Timer`；页面隐藏时暂停 |
| `resize.js` | `observeSize(renderer, camera, { onResize })` | 使用 `ResizeObserver`，同步相机与 composer |
| `controls.js` | `createOrbit(camera, dom, { target, autoRotate, minDistance, maxDistance, reducedMotion })` | 开启阻尼和 `listenToKeyEvents`；减少动态效果时不自动旋转 |
| `environment.js` | `roomEnvironment(renderer, scene)`、`loadHDR(url)` | `RoomEnvironment` 加 `PMREMGenerator`，`.hdr` 文件用 `HDRLoader` |
| `loaders.js` | `loadGLTF(url)`、`loadTexture(url)` | 共享单例，挂 `DRACOLoader`、`KTX2Loader`、`MeshoptDecoder`；解码器在 prebuild 时从 `three/examples/jsm/libs/` 复制到 `public/vendor/` |
| `post.js` | `createComposer(renderer, scene, camera, { bloom })` | `RenderPass` →（可选）`UnrealBloomPass` → `OutputPass` |
| `dispose.js` | `disposeObject(root)` | 释放 geometry、material、纹理和渲染目标 |
| `quality.js` | `adaptivePixelRatio(renderer, { min = 1, max = 2, budgetMs = 20 })` | 帧时间持续超出预算时逐级降低像素比 |
| `lifecycle.js` | `guardContext(canvas, { onLost, onRestored })` | 处理 WebGL 上下文的丢失与恢复 |

**不重构 WHERE STARS REST**，除非用户明确要求。

### 5. 作品模板与脚手架

- 新增 `experiences/_template/`：用第 4 项的套件搭一个最小作品，界面使用 Atlas UI 令牌，场景就绪时给 `body` 加 `ready`。构建入口要忽略这个目录。
- `npm run new:work -- <id> "<TITLE>" "<中文副标题>"`：复制模板、在 works.json 追加条目、提示补封面。
- 验收：新作品出现在目录里；直接访问并刷新正常；从首页进入时过渡无缝。

### 6. 组件陈列页与视觉回归

- `pages/ui/`（加 `noindex`，首页不链接）：展示 `src/ui` 全部组件和状态，包括 Quote、Panels（中文竖排和英文横排）、Principles、按钮三种变体、卡片的悬停与缺图、目录的空结果、Highlights，中英文各一份。
- `npm run test:visual`：用 Playwright 截图并与基线比对，差异超过 0.5% 时失败。

### 7. 高清封面与响应式图片

- 四条屏会把封面放大到 2–2.3 倍，所以必须换成 2880×1800 的封面。从作品初始视角截取，临时隐藏 UI，截完恢复，不改场景。
- 构建时生成 AVIF 和 WebP，宽度 720、1440、2880 各一份，并输出 `srcset`/`sizes`。`.ui-ambient` 改用 160px 的小图。

---

## P2 · 之后

### 8. 卡片视频预览（等有 2–3 个作品后再做）

- 新增可选字段 `preview`（webm 和 mp4，6 秒，静音循环）。
- 同一时间只播放一个；离开视口即暂停；开启「减少动态效果」或 Save-Data 时不播放。

### 9. 分享卡片和 meta

- 首页和作品页加上 `og:*` 与 `twitter:card`。绝对 URL 通过环境变量 `SITE_URL` 注入。

### 10. 部署（需用户授权）

- 目标是免费的 `guanmo-ai.github.io/three-atlas`。前提是用户先把仓库改为公开，并在 Settings → Pages 中选 GitHub Actions。
- 新增 `.github/workflows/deploy.yml`：依次执行 `npm ci`、`check`、`test`、`build`，然后部署 `dist/`。

### 11. 真机验收

在 Chrome 和 Edge（桌面与安卓）、Safari 18.2+（macOS 与 iOS）、Firefox 上逐项检查：
- 开窗滚动是否流畅；
- 卧游今释是否逐词点亮；
- 四条屏的竖排题跋：Safari 的 `writing-mode`、标点是否居中、Windows 上衬线字体的回退；
- 跨页过渡是否无缝。Firefox 应为普通跳转，没有报错。

本地无 GPU 的软件渲染里，跨页过渡偶尔会被跳过，需要以真机结果为准。

# 交接清单（给 Codex）

分工：**Claude 负责设计**（版式、视觉、动效、文案、组件 API）；**Codex 负责下面所有工程事项**。开工前读 `AGENTS.md`、`docs/design-system.md`、`docs/design-polish.md`、`docs/OPUS-HANDOFF.md`。

规则：
- **不改现有观感和文案。** 遇到需要设计判断的地方，在 PR 描述里写明问题，留给 Claude，不要自己决定。
- **可以写新内容**（新作品的条目、亮点、说明），但必须遵守 `docs/design-system.md` 第 8 节的文风，技术说法要能在源码里核实，并在 PR 里标注「内容待用户审阅」。涉及界面的改动附改动前后截图（桌面 1440×900、手机 390×844，中英文各一套）。
- 做完一项就从本文删掉，并在 `docs/verification.md` 记下验证方法和结果。
- 一项一个提交，使用 Conventional Commits。每次提交前跑 `npm run check`、`npm test`、`npm run build`。
- 推送、公开仓库、配置部署都需要用户授权（见 `AGENTS.md`）。

---

## P0 · 先做

### 1. `highlights` 校验与测试

- `scripts/content.mjs`：`highlights` 为 3–4 项；每项的 `title`、`text`、`tech` 都要有中英文；`focus`、`zoom` 沿用现有校验。
- 在 `tests/catalog.test.js` 中补充对应的测试用例。

### 2. 文风检查 `scripts/check-copy.mjs`（加入 `npm run check`）

依据 `docs/design-system.md` 第 8 节，扫描 `src/gallery/copy.js` 和 `content/works.json`：
- 不允许出现感叹号（！和 !）；
- 不允许出现禁用词：极致、颠覆、震撼、史诗级、炸裂、黑科技。

出错时列出文件、字段和原因。

### 3. 首页的「关于」与「接下来」做成可复用组件

- 「接下来」区块目前由 `src/gallery/main.js` 直接拼装（`SectionHead` 居中，外加一个 `ui-section`）。请把它抽成 `src/ui/components/` 里的 `Roadmap` 组件（eyebrow、标题、说明，可选一个「规划中」徽标）。
- 观感保持不变，同时在 `docs/design-system.md` 的组件表里补一行。改动前后截图对比。

## P1 · 交互与质感（按 `docs/design-polish.md` 的参数实现）

这一组决定网站能不能达到顶尖水准，优先级高于复用能力。每项完成后附截图和录屏，由 Claude 做审美验收。

- **P1-A** 开窗动态画面：录制、编码、按需播放、跨页过渡（design-polish 二·A）。**最先做。**
- **P1-B** 卡片与亮点卡的指针光（二·B）
- **P1-C** 开窗的指针视差（二·C）
- **P1-D** 图片渐显，以及构建时自动生成 `tone`（二·D）
- **P1-E** 导航当前位置（二·E）
- **P1-F** 按压反馈（二·F）
- **P1-G** 入场只在第一次（二·G）
- **P1-H** 页脚字标逐字升起（二·H）
- **P1-I** 性能预算与 `npm run perf`（二·I）
- **P1-J** 无障碍复核（二·J）

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

- `pages/ui/`（加 `noindex`，首页不链接）：展示 `src/ui` 全部组件和状态，包括 Statement、Panels、Principles、Highlights、按钮三种变体、卡片的悬停与缺图、目录的空结果，中英文各一份。
- `npm run test:visual`：用 Playwright 截图并与基线比对，差异超过 0.5% 时失败。

### 7. 高清封面与响应式图片

- 亮点卡会把封面放大到 2–2.3 倍，所以必须换成 2880×1800 的封面。从作品初始视角截取，临时隐藏 UI，截完恢复，不改场景。
- 构建时生成 AVIF 和 WebP，宽度 720、1440、2880 各一份，并输出 `srcset`/`sizes`。`.ui-ambient` 改用 160px 的小图。

---

## P2 · 之后

### 8. 卡片视频预览（等有 2–3 个作品后再做；开窗视频见 P1-A，素材与字段可以共用）

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
- 「方寸屏幕」那句是否逐词点亮；
- 亮点卡在手机上能否横向滑动；
- 跨页过渡是否无缝。Firefox 应为普通跳转，没有报错。

本地无 GPU 的软件渲染里，跨页过渡偶尔会被跳过，需要以真机结果为准。

### 12. 多个世界同处一个空间（暂不开工）

首页「接下来」写的是规划方向：把多件作品放进同一个空间，在一张星图里漫游、点进任意一个世界。等 Claude 给出交互与视觉设计稿后再开工，在那之前不要自行实现。

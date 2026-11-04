# 交接清单（给 Codex）

分工：Claude 负责设计（视觉、版式、动效、文案、作品接口）；下面这些工程事项交给 Codex。开工前读 [`AGENTS.md`](../AGENTS.md)。
做完一项就从「待办」里删掉，并在「执行记录」写一行：日期、做了什么、怎么验证的。

## 执行记录

- 2026-11-04（Claude）：v0.1 骨架上线。包括目录、星图、作品三种视图，共享引擎（`src/engine`），示例图版 001「地层 Strata」，Pages 部署工作流，以及每个路由的静态 HTML 和分享 meta。

## 上线前（需要主人在 GitHub 上操作，Codex 不用做）

1. 把仓库改成 Public（免费账号的私有仓库开不了 Pages）。
2. Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
3. 把 `claude/charming-ramanujan-ezgr14` 合并到 `main`，工作流会自动部署。

---

## 待办

按顺序做。每项一个 PR，PR 描述里附截图或命令输出作为验收证据。

### T1 · 质量门：作品校验和 PR 检查

- 新增 `scripts/validate-works.mjs`（Node，无额外依赖），校验所有 `works/*/work.json`：
  - 必填字段齐全，`title`、`summary`、`medium[]` 都有 `en` 和 `zh`；
  - `slug` 符合 `^[a-z0-9-]+$`，且全站唯一；`plate` 是正整数，且全站唯一；
  - 目录名必须是 `String(plate).padStart(3,'0') + '-' + slug`；
  - 同目录下存在 `index.ts`；
  - 出错时列出所有问题并以非零码退出。
- 把 `package.json` 的 `build` 改成先跑校验：`node scripts/validate-works.mjs && tsc --noEmit && vite build`。
- 新增 `.github/workflows/ci.yml`：对 PR 跑 `npm ci && npm run build`。
- **验收**：故意改错一个 work.json（重复 plate、缺 zh），校验能报出全部错误；PR 上 CI 绿。

### T2 · 封面与分享图自动生成（`npm run capture`）

- 站点加一个截图模式：URL 带 `?capture` 时，`<body>` 加 `is-capture` class，CSS 隐藏 `.bar .hud .cursor .grain .curtain .labels .atlas-hint .compass`。只在 `styles.css` 末尾追加这一段规则，不要动其他样式。
- 新增 `scripts/capture.mjs`（Playwright，环境里已装好 chromium；用 `--use-angle=swiftshader --enable-unsafe-swiftshader` 启动参数，保证无 GPU 时也能渲染）：
  1. 起 `vite preview`；
  2. 对每件作品打开 `/three-atlas/works/<slug>/?capture`，等 4 秒，截 1200×630 → `works/<dir>/poster.jpg`（质量 85）；
  3. 打开首页 `/three-atlas/?capture`，截 1200×630 → `public/og.png`。
- `vite.config.ts` 的 route-pages 插件已经会把 `poster.jpg` 复制到 `dist/works/<slug>/poster.jpg` 并写进 `og:image`，不用再改。
- 无 WebGL 回退：`ui.ts` 给有封面的卡片加 `style="--poster:url(...)"`（用 `new URL` 或 glob 拿到封面 URL）。`html.no-webgl` 下 CSS 已经会显示它。
- **验收**：`npm run capture` 生成两张图；在 opengraph.xyz 之类的工具里预览作品页，分享卡正确；用 `--disable-webgl` 打开首页能看到封面。

### T3 · 新建作品脚手架（`npm run new:work`）

- 新增 `works/_template/`（`work.json` + `index.ts`）：一个最小但完整的作品，例如一个用 `MeshStandardMaterial` 加环境光的几何体，用 `createOrbit`，实现 dispose。`registry.ts` 要忽略以 `_` 开头的目录。
- 新增 `scripts/new-work.mjs`：`npm run new:work -- <slug> "<English Title>" "<中文名>"`。
  - 编号取现有最大 plate + 1；复制模板到 `works/NNN-slug/`，替换字段；`year` 取当前年份；`draft: true`。
- **验收**：运行一次生成新作品，`npm run dev` 能在目录和星图里看到它；`npm run build` 时它不出现（draft）。

### T4 · 资源管线与共享加载器

- `src/engine/loaders.ts`：导出 `loadGLTF(url)`、`loadTexture(url)`、`loadHDR(url)`。全站共享单例 `GLTFLoader`（挂 `MeshoptDecoder` + `KTX2Loader`），`KTX2Loader.detectSupport(ctx.renderer)` 只做一次。basis transcoder 从 `three/examples/jsm/libs/basis/` 复制到 `public/vendor/basis/`（写一个 `postinstall` 或 `predev`/`prebuild` 脚本完成复制）。
- `scripts/assets.mjs`（`npm run assets`）：用 `@gltf-transform/cli` 处理 `works/*/assets/src/*.glb`，输出到 `works/*/assets/*.glb`：meshopt 压缩，纹理转 KTX2（UASTC 用于法线，ETC1S 用于颜色），最长边 2048。`assets/src/` 加进 `.gitignore`，原始大文件不进仓库。
- 预算：单个作品打包后资源超过 8 MB 时，构建打印警告；超过 25 MB 时构建失败。
- 在 `AGENTS.md` 第 5 节补一句加载器用法。
- **验收**：拿 three.js 官方示例里的 `DamagedHelmet.glb` 放进一个 draft 作品，跑通加载、压缩、显示和 dispose 的全过程；附上压缩前后的体积。

### T5 · 运行时性能：实例回收和自适应画质

只改 `src/site/stage.ts` 里的调度逻辑，不改视觉。

- 实例回收（LRU）：最多保留 6 个作品实例。超过 30 秒不可见、且不是当前作品的图版，执行 `instance.dispose()` 和 `rt.dispose()`，并把 `reveal` 归零。重新可见时自动重建（`instantiate` 已有懒加载逻辑）。
- 预览限帧：同时可见的实时图版超过 3 个时，非悬停的图版每 2 帧更新一次。
- 自适应画质：作品全屏时，如果 2 秒内平均帧时间超过 22 ms，把全屏渲染目标的像素比按 2 → 1.5 → 1 逐级降低（只影响 `restSize` 的全屏分支）；退出全屏后恢复。
- **验收**：用 10 个 draft 复制品（`new:work` 生成）在星图里来回转 2 分钟，Chrome 任务管理器里的 GPU 内存不持续增长；附一张 Performance 面板截图。

### T6 · 迁移主人的已有作品（持续）

主人会陆续给出作品所在的仓库或文件。每件作品按 `AGENTS.md` 第 6 节迁移，一件一个 PR，PR 里附三态截图（目录卡片、星图、全屏）。遇到契约覆盖不了的需求（多场景切换、音频、XR 等），先在 PR 里描述清楚，交给 Claude 扩展契约，不要自行绕过。

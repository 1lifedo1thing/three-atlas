# 交接清单（给 Codex）

分工：**Claude 负责设计**（版式、视觉、动效、文案、组件 API）；**Codex 负责下面所有工程事项**。开工前读 `AGENTS.md`、`docs/design-system.md`、`docs/design-polish.md`、`docs/OPUS-HANDOFF.md`。

规则：
- **不改现有观感和文案。** 遇到需要设计判断的地方，在 PR 描述里写明问题，留给 Claude，不要自己决定。
- **可以写新内容**（新作品的条目、亮点、说明），但必须遵守 `docs/design-system.md` 第 8 节的文风，技术说法要能在源码里核实，并在 PR 里标注「内容待用户审阅」。涉及界面的改动附改动前后截图（桌面 1440×900、手机 390×844，中英文各一套）。
- 做完一项就从本文删掉，并在 `docs/verification.md` 记下验证方法和结果。
- 一项一个提交，使用 Conventional Commits。每次提交前跑 `npm run check`、`npm test`、`npm run build`。
- 推送、公开仓库、配置部署都需要用户授权（见 `AGENTS.md`）。

---

## P0 · 先做（首页改为画廊之后）

2026-11-05：按用户意见，首页改为**画廊优先**：一进来就是作品卡片，去掉开窗、宣言、亮点、关于、接下来等长段落。设计见 `docs/design.md` 第六版和 `docs/design-system.md` 第 10 节。

### 1. 修复 `package-lock.json` 与 `package.json` 不同步

`npm ci` 目前直接失败（缺 `proxy-agent` 等依赖），以后的 CI 和部署都会因此出错。重新生成 lock 文件，并确认 `npm ci && npm run check && npm test && npm run build` 能在干净环境里跑通。

### 2. 浏览器测试与视觉基线跟着新首页更新

- `tests/browser/` 里依赖首页开窗、宣言、亮点卡的用例（parallax、preview、showcase、accessibility、responsive 等），改为在组件陈列页 `pages/ui/` 上验证这些组件；首页用例改测新结构：标题区、工具条、主推卡、卡片网格、关于条、页脚。
- 更新视觉回归基线（桌面 1440×900、1280×800，手机 390×844，中英文）。
- 首页改动只在 `src/gallery/` 与 `src/ui/components/{work-card,work-index,hero,principles}`，以及 `src/ui/preview.js`（观察对象改为 `[data-preview-trigger]`）。
- 排查：本地 Playwright 从首页点进作品时，控制台出现 `Transition was aborted because of invalid state. ViewTransition opt-in disabled`。确认是测试环境（无 GPU、自动化）造成的，还是真实问题；真实问题就修复，并在真机上确认首页与作品之间的过渡无缝。

### 3. 普通卡片的悬停预览（`docs/design-polish.md` 二·A2）

主推卡进入视口时已经会自动播放预览（复用 `observePreview`）。普通卡片按 A2 的参数做成悬停播放；没有 `preview` 字段的作品保持静帧。

### 4. 逐词点亮的对比度

设计决定：`lightUp` 的起始透明度从 0.16 改为 **0.4**（已改，见 `src/ui/motion.js`），用于 ≥24px 的大字时满足 AA 3:1。请去掉 accessibility 用例里对应的 fixme，并更新 `docs/accessibility.md`。


## P1 · 交互与质感（按 `docs/design-polish.md` 的参数实现）

这一组决定网站能不能达到顶尖水准，优先级高于复用能力。每项完成后附截图和录屏，由 Claude 做审美验收。

- **P1-J** 无障碍复核（二·J）：键盘流程与名称已修；逐词点亮的设计参数已确定为 0.4，见 P0-4。

## P1 · 复用能力

## P2 · 之后

### 8. 卡片视频预览：已并入 P0-3。

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

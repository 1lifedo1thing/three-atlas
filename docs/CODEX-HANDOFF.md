# 交接清单（给 Codex）

分工：**Claude 负责设计**（版式、视觉、动效、文案、组件 API）；**Codex 负责下面所有工程事项**。开工前读 `AGENTS.md`、`docs/design-system.md`、`docs/design-polish.md`、`docs/OPUS-HANDOFF.md`。

规则：
- **不改现有观感和文案。** 遇到需要设计判断的地方，在 PR 描述里写明问题，留给 Claude，不要自己决定。
- **可以写新内容**（新作品的条目、亮点、说明），但必须遵守 `docs/design-system.md` 第 8 节的文风，技术说法要能在源码里核实，并在 PR 里标注「内容待用户审阅」。涉及界面的改动附改动前后截图（桌面 1440×900、手机 390×844，中英文各一套）。
- 做完一项就从本文删掉，并在 `docs/verification.md` 记下验证方法和结果。
- 一项一个提交，使用 Conventional Commits。每次提交前跑 `npm run check`、`npm test`、`npm run build`。
- 推送、公开仓库、配置部署都需要用户授权（见 `AGENTS.md`）。

---

## P1 · 交互与质感（按 `docs/design-polish.md` 的参数实现）

这一组决定网站能不能达到顶尖水准，优先级高于复用能力。每项完成后附截图和录屏，由 Claude 做审美验收。


## P1 · 复用能力

## P2 · 之后

### 10. 部署（需用户授权）

- 目标是免费的 `guanmo-ai.github.io/three-atlas`。前提是用户先把仓库改为公开，并在 Settings → Pages 中选 GitHub Actions。
- 新增 `.github/workflows/deploy.yml`：依次执行 `npm ci`、`check`、`test`、`build`，然后部署 `dist/`。

本地工作流、`SITE_URL` 分享配置与构建检查已准备，见 `docs/deployment.md`。尚未提交、推送或修改远程设置；公开仓库及实际部署等待用户明确授权。

### 11. 真机验收

在 Chrome 和 Edge（桌面与安卓）、Safari 18.2+（macOS 与 iOS）、Firefox 上逐项检查：
- 开窗滚动是否流畅；
- 「方寸屏幕」那句是否逐词点亮；
- 亮点卡在手机上能否横向滑动；
- 跨页过渡是否无缝。Firefox 应为普通跳转，没有报错。

首页 CSS 与 pagereveal 注册时序已修复，开发及生产构建均有过渡回归测试（`npm run test:transitions`）。软件渲染在本轮仍出现浏览器跳过过渡，不能用它替代 GPU 或真机视觉验收；详见 `docs/verification.md`。

### 12. 多个世界同处一个空间（暂不开工）

首页「接下来」写的是规划方向：把多件作品放进同一个空间，在一张星图里漫游、点进任意一个世界。等 Claude 给出交互与视觉设计稿后再开工，在那之前不要自行实现。

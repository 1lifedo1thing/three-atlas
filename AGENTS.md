# Three Atlas

独立的 3D 网页作品图鉴，唯一远程目标为 `guanmo-ai/three-atlas`。对外品牌固定 **Three Atlas**，中文名为「三维图鉴」。

- 先读 `docs/brief.md`、`docs/OPUS-HANDOFF.md` 与当前工作树状态。保留用户和其他 Agent 的改动。
- 首页视觉由 Opus 5.5 设计，仍待用户验收。所有页面必须遵守 `docs/design-system.md`，只用 `src/ui/`（Atlas UI）的令牌和组件，不在页面里写死颜色、字号或缓动曲线。工程待办见 `docs/CODEX-HANDOFF.md`，交互参数见 `docs/design-polish.md`，不得改变现有观感。
- `content/works.json` 为作品目录与构建入口来源。每个作品使用独立的 `experiences/<id>/index.html`，支持直接打开与刷新。
- `src/ui/` 是共享组件库，`src/gallery/` 是首页（只做组合），`experiences/<id>/src/` 管理作品。首页可以用 GSAP 和 Lenis，但不得加载 Three.js。画廊不导入场景代码，不为每张卡片创建 WebGL 画布。
- 作品 CSS 只在作品页面载入；不将场景全局样式引入画廊。不预先建立复杂统一渲染框架；出现实际复用时再抽取。
- WHERE STARS REST 是首作，已有画面、呼吸光、云层与交互保留。首页改版不得顺带重做该作品。
- 使用同仓库源码与资源，不从相邻项目动态引用。导入记录位于被忽略的 `.local/`，不得上传本机路径或内部聊天内容。
- UI 简约，作品优先；默认避免绿色。保留中英文、键盘、触屏和减少动态效果。
- 固定 Three.js 0.186.1、Vite 8.3.5；第三方许可证保留在作品 `third-party/`。新增外部素材记录作者、来源、许可证与修改说明。
- 修改后执行受影响测试、`npm run check`、`npm run build`。作品改动执行原有场景测试；视觉改动必须实际查看浏览器。
- `output/` 与 `.local/` 不提交。对外署名为「观默 / @guanmo_ai」。
- 提交、推送、公开仓库、配置部署和选择整体许可证均需用户授权。

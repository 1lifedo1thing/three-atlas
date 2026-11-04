# Three Atlas 首个作品接入实施计划

> **For agentic workers:** 按任务逐项执行；用户已授权当前会话准备内容与独立作品结构。本次由当前 Agent 执行，不派发子 Agent；不自动提交、推送或发布。

**Goal:** 在独立仓库中建立可替换视觉的画廊基础，并完整接入 WHERE STARS REST。

**Architecture:** 原生 JavaScript 画廊与 Vite 多页面作品分离。`content/works.json` 同时驱动画廊与构建入口，各作品拥有独立 HTML、CSS 和源模块，首页不引用场景模块。

**Tech Stack:** Node.js 22、JavaScript ESM、Three.js 0.186.1、Vite 8.3.5、Node test runner。

**Spec:** `docs/brief.md`

## Global Constraints

- 固定品牌 Three Atlas，首作名 WHERE STARS REST，避免绿色装饰。
- 使用源码副本，不修改原作品，不依赖相邻项目的运行文件。
- 保留首作实际视觉与依赖许可证；首页样式是初稿。
- 不自动提交、推送、部署或选择项目许可证。

## Review Focus

- 项目子路径下的卡片入口、封面和返回链接必须仍然正确。
- 独立页面刷新应直接显示作品，不依赖先访问首页。
- 首页不得启动或下载场景引擎。
- 搜索没有结果、中文查询和语言切换后都能恢复浏览。
- 新增第二个作品不得需要修改首页控制器或手动追加构建入口。

### Task 1：独立作品与构建

**Files:** `package.json`、`package-lock.json`、`vite.config.js`、`experiences/where-stars-rest/`、`content/works.json`、`scripts/check-content.mjs`。

**Interfaces:** 目录项包含稳定的 `id`、`entry`、`cover`、中英简介和作者字段；构建从目录项读取各作品 HTML 入口。

- [x] 复制原作品源码、原有测试和许可证，记录导入文件校验值。
- [x] 使用同版本依赖建立根级构建；内容检查拒绝重复 ID、越界路径与缺失入口或封面。
- [x] 为缺失入口、重复 ID、越界路径和动态构建入口添加有实际错误覆盖的测试。
- [x] 保留场景内容，只补入返回图鉴的链接。

### Task 2：可替换的首页

**Files:** `index.html`、`src/gallery/{main,card,model,copy}.js`、`src/gallery/{tokens,gallery}.css`、`public/media/where-stars-rest.jpg`。

**Interfaces:** `selectWorks(works, query)` 只负责筛选；`createWorkCard(work, lang, index)` 只负责渲染一张卡片；首页控制器不导入任何体验模块。

- [x] 建立一张真实作品卡片、轻量搜索、中英文切换和空结果反馈。
- [x] 将视觉变量与布局样式单独放置，不绑定场景尺寸。
- [x] 覆盖多作品、中文标题、标签搜索和空结果的筛选测试。
- [x] 使用当前作品重新截取真实封面，避免沿用旧名称的画面。

### Task 3：验证与交接

**Files:** `scripts/check-build.mjs`、`README.md`、`AGENTS.md`、`docs/OPUS-HANDOFF.md`、`docs/verification.md`。

- [x] 执行内容检查、Node 测试与 Vite 生产构建。
- [x] 检查构建入口、资源和根首页依赖，验证独立作品可直接访问。
- [x] 使用独立浏览器检查桌面与手机首页、卡片导航、作品交互及子路径刷新。
- [x] 记录实际结果、边界、设计待决项和后续接入步骤。

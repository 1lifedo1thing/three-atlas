# 首作接入验收记录

日期：2026-11-04。阶段：本地内容与结构准备，首页为可替换的视觉初稿。

## 自动检查

- `npm run check`：25 个 JavaScript 文件语法检查与 1 个作品目录检查通过。
- `npm test`：13 项全部通过，其中 9 项保留自原作品，4 项覆盖中英文搜索、多作品入口生成、缺失文件、重复 ID 和非法路径。
- `npm run build`：Vite 8.3.5 生产构建与构建检查通过，生成首页和独立作品 HTML。
- 构建依赖链检查：首页没有引用 Three.js；画廊脚本约 4.50 kB，场景引擎包约 640.77 kB，仅由作品页面加载。引擎包仍触发默认 500 kB 体积提示，构建退出码为 0；本次没有为消除提示而重构既有场景。
- 原创文件的暂存差异检查通过。导入的 Vite LICENSE 包含上游原有尾部空白，为保留原文，空白检查排除此文件；其文件校验值保持一致。
- 校验原项目导入文件的 SHA-256：原项目文件未改动。本仓库场景源模块、原有测试和依赖许可证与导入基线一致，仅作品 HTML 增加共享返回样式和返回链接。
- 候选公开文本扫描没有本机绝对路径；导入路径、聊天定位与基线记录只在被忽略的 `.local/`。

## 独立浏览器检查

使用内置独立浏览器，未连接个人 Chrome。

| 场景 | 实际结果 |
| --- | --- |
| 桌面视口 1440 × 900，中文 / 英文首页 | 一张真实作品卡片，封面完整载入，切换后名称、摘要、操作和搜索文案更新 |
| 搜索无结果，再查看全部 | 显示空结果反馈，清除搜索后恢复首作 |
| 首页点击作品 | 进入独立 WHERE STARS REST 页面，画布状态为 `ready` |
| 光芒控制 | 0% 与 100% 均更新可访问数值，检查后恢复 55% |
| 暂停 / 复位 / 键盘 | 暂停按钮状态更新，复位显示反馈，方向键与缩放操作后正常渲染 |
| 手机视口 390 × 844 | 中文 / 英文首页无横向溢出；作品返回链接和原控制按钮没有重叠 |
| 手机尺寸内指针拖动 | 作品可环绕观察；不是实体触屏测试 |
| `/three-atlas/` 项目子路径 | 从独立作品深链接直接载入，刷新后仍为 `ready`，返回链接正确落到子路径首页 |
| 减少动态效果 | 模拟系统偏好后，作品默认处于暂停自动旋转状态 |
| 本地页面控制台 | 本次没有记录到来自本地页面的错误或警告；参考站点自己的日志没有计入 |
| 首页图形实例 | 画布数量为 0；首页没有运行场景渲染器 |

封面是作品实际渲染的 1440 × 900 截图。采集时临时隐藏界面，随后立即恢复，未改变场景源码或美术。

## 本地证据

`output/review/` 保存在本机并被 Git 忽略：

- `home-zh-desktop.jpg`、`home-en-desktop.jpg`：桌面首页。
- `home-zh-mobile.jpg`、`home-en-mobile.jpg`：手机尺寸首页。
- `experience-mobile.jpg`：手机尺寸的独立作品。
- `browser-checks.json`：浏览器检查摘要。

正式封面保存在 `public/media/where-stars-rest.jpg`，属于作品内容。

## 边界与当前状态

- 浏览器尺寸模拟不等于实体手机，没有验证 Safari、Firefox 或低端 GPU 性能。
- 本次没有完整试听音效，也没有扩大到 WebGL 上下文丢失的故障验收。
- 实际只接入了首作；多作品的搜索与入口生成由测试覆盖，没有虚构第二张体验卡片。
- 首页视觉仍待后续 Opus 5.5 设计与用户接受，本轮不宣称完成最终艺术验收。
- 内容准备阶段未提交或推送；随后按用户要求将通过检查的版本同步到私有仓库。本次不部署，也不改变远程仓库可见性。

## 2026-11-04 · P0-1

新增边界测试先复现空列表和缺失技术说明的错误，再补齐 3–4 项数量与双语 tech 校验；保留原 focus、zoom 规则。验证辅助加入隔离 Playwright 截图和录屏工具。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P0-1/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P0-2

文风检查已接入 npm run check，递归检查中英文静态字段及当前动态标题、数量文案，按文件、字段和原因报告感叹号与禁用词；对应正反用例已通过。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P0-2/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P0-3

Roadmap 复用现有 SectionHead 和 Badge，首页仅组合组件，保留现有文案与排版；浏览器验证传入文案和标题关联，四套前后截图及区块录屏已采集。关于区块已有 Principles 组件，沿用现状。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P0-3/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P1-A

已用 Metal 硬件从首作初始视角录制真实动画，保留场景源码；编码约 10 秒、0.6 秒首尾叠化的 H.264/VP9 两种尺寸，1920 MP4 2.30 MB、960 MP4 0.80 MB，均符合预算。进入视口才播放，后台或离屏暂停，600ms 淡入，减少动态效果、Save-Data 与 2G/3G 不加载；播放时跨页过渡选择视频。四项浏览器测试验证静音、按需播放、重绘清理与三种降级条件。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-A/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P1-B

按规范使用 360px 光层、0.09 亮度和 0.28 边缘光，300ms 进入、500ms 离开，只有细指针且非减少动态时启用；pointerenter 缓存一次布局、pointermove 只排队一帧更新，委托事件覆盖搜索重建卡片。桌面单活动卡片与粗指针降级浏览器用例通过。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-B/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P1-C

开窗媒体在细指针、非减少动态条件下以每帧 lerp 0.08 追随，最大位移 ±1.2%，离开回中并在收敛后停止帧循环。图片与视频共用媒体容器；遮边缩放仅由当前位移推导，居中保持原构图。单元与真实指针浏览器测试通过，减少动态状态立即归零。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-C/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

P1-C 浏览器补充：坐标输入曾发生在开窗入场稳定前；用例改为等待元素可见稳定后的真实悬停，保留位移与回中期望，现已通过。产品动效参数不变。

## 2026-11-04 · P1-D

所有组件图片通过 decode 后以 600ms 渐显，下载失败保留占位并处理异常；构建脚本从真实像素自动计算 tone，保持封面裁切和原有缩放动效。平均色单元测试与延迟下载、缺图浏览器测试通过。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-D/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P1-E

导航使用 ScrollTrigger 以视口中线定位，当前项 aria-current 与前景色同步，单个 4px 圆点以 400ms 滑动；字体加载后刷新测量，滚动 pin 建立后再注册导航。普通动效、减少动态及语言切换测试通过。修正 Playwright 减少动态配置至 contextOptions，静态截图原已使用正确的独立上下文选项。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-E/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P1-F

按钮、筛选和图集翻页控件按下时缩至 0.97、时长 120ms，释放以 240ms expo 曲线回弹，禁用态不响应。真实按下测试核对三类控件的变换和时长，录屏包含按下与释放。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-F/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P1-G

首页入场用 sessionStorage 记录，刷新、切换语言、作品返回都直接显示；存储受限时同一文档仍不重复。浏览器验证首访与三个返回路径。录屏含刷新后的直接呈现；此前正常动效用例的 contextOptions 同步修正，并重新验证预览、指针光和视差。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-G/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P1-H

页脚字标使用 SplitText chars，从 yPercent 60 升至 0，1.2 秒 expo.out、错开 0.03 秒，首次进入字标视口时触发；减少动态时直接呈现。保留原渐变字色，组件清理会回收分字与滚动触发器；浏览器验证只播一次及降级。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-H/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P1-I

新增 npm run perf：三次移动 Fast 4G/4 倍 CPU 的 Lighthouse CI，四项均 ≥95、LCP ≤2 秒、CLS ≤0.02、TBT ≤100ms，以及首页 JS ≤70KB gzip，任一失败均退出非零，无报告上传。首轮 SEO 失败后补 robots.txt；实验室语言交互超时后消除重复刷新并先绘制忙碌反馈，最终最长 Event Timing 40ms。实际现场 INP 与实体中端手机仍需上线后确认，未作通过声明。完整报告位于本项 lighthouse/ 与 performance/。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-I/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · P1-J

已验证键盘跳到搜索、搜索后 Tab 进入卡片、进入作品及返回原卡片的焦点恢复；修复语言按钮名称、卡片名称与减少动态的无限徽标。中英文静态首页 AA 自动检查通过，规格允许的纯装饰大编号单独排除。普通动效的逐词点亮仍有对比度冲突，对应用例明确 fixme；P1-J 尚未完成，等待设计参数选择，详见 docs/accessibility.md。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/P1-J/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · KIT

新增 ten-module three.js 0.186.1 官方套件，涵盖 renderer、Timer 循环、尺寸、Orbit、环境、共享加载器、后处理、资源释放、持续慢帧降级和上下文恢复；prebuild 从锁定依赖复制解码器与许可证。原首作未重构。三个单元测试与真实 Metal GPU 的 glTF、Bloom、尺寸、键盘和上下文恢复验证通过；KIT/after/kit-smoke.mp4 为套件专项录屏，首页四套对比保持原布局。压缩格式真实文件尚未逐项覆盖，已写明验证边界。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/KIT/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

KIT 补充：像素断言复现上下文恢复后只有背景的缺陷，RoomEnvironment 现会在恢复时重建 PMREM 环境；恢复前后实际像素均有可见三角形。录屏改用 video.saveAs 等待写入，ffprobe 确认 6.32 秒、239714 字节；专项截图已人工查看，黑帧与空文件旧结果被替换。

## 2026-11-04 · TEMPLATE

新增独立作品模板、ExperienceShell 与 npm run new:work，安全追加作品目录并拒绝越界或覆盖，提示补真实封面和审阅中英文草稿。模板不进入目录和构建。临时副本的实际 GPU 作品已验证目录卡片、进入、刷新、返回链接与构建入口，测试后清理，正式目录仍只有首作；TEMPLATE/after/template-smoke.webm 为专项录屏。生成内容待用户审阅。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/TEMPLATE/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · SHOWCASE

新增 pages/ui 的中英文内部陈列页，覆盖所有组件、按钮三种变体、悬停/缺图卡片与空目录，noindex 且首页不链接。Playwright 四套整页基线与复测通过，超过 0.5% 像素差异失败；临时探针制造约 5% 差异时命令确实失败，探针已删除。基线属工程记录，仍待 Claude 与用户审美验收，录屏包含图集翻页。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/SHOWCASE/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · HD

原生采集初始视角 2880×1800 封面，实际画布 DPR1、约95FPS，采集后恢复界面，场景目录相对设计基线无改动。自动生成 AVIF/WebP 720、1440、2880 与 160px 环境光图，统一输出 picture/srcset/sizes，并拒绝低清放大。手机、桌面选图、无额外完整 JPEG、缺图降级和模板集成验证通过。高清源更新后的四套视觉基线复测通过；最终浏览器 23通过/1项设计待定，Lighthouse 三次预算通过，首页 JS 66042字节 gzip，实验室最长交互40ms，现场INP未测。

验证：`npm run check`、`npm test`、`npm run build` 均通过。截图与录屏：`output/engineering-review/HD/`（桌面 1440×900、手机 390×844，中英文，before / after；after/interaction.mp4 为真实浏览器录屏）。页面证据属于工程验收，审美仍待 Claude 与用户接受。

## 2026-11-04 · 独立审查修复

四项 Important 已分别复现失败后修复：模板 arrival 布局与淡出、透明 caption 的 Tab 焦点、导航/页脚语言切换的可见焦点、缺失衍生图的自动重建。桌面与手机语言按钮均测试；初始仅恢复焦点仍可能落在视口外，新增边界断言复现后补最近滚动。P1-J 对比度设计项继续未完成。审查记录见 docs/engineering-review.md，红绿日志与最终检查在 output/engineering-review/final/。

收尾验证：check、Node32测试、build通过；完整浏览器28通过、1项明确设计fixme；视觉4通过；性能三轮严格预算通过，首页JS66218字节gzip，受限实验室最长交互48ms（不等同现场INP）。136张截图与17段5–10秒录屏库存检查通过，另有KIT和模板专项录屏。


## 2026-11-04 · 画廊首页 P0

基于最新设计分支 `32cdd1f`，本地分支为 `codex/gallery-p0`。本轮没有提交、推送或部署；首作场景源码、资源与正式作品目录未改动。

- **锁文件**：原锁文件在 npm 12 可安装，但 npm 10 的 `npm ci` 明确报缺少 proxy-agent 8 等 14 项依赖。使用 npm 10 补齐传递依赖，同时保留原有版本及 libc 平台元数据。临时干净副本执行 npm 10 `ci → check → test → build`，以及 npm 12 `ci` 全部成功；未使用 legacy-peer-deps 或跳过依赖校验。
- **测试迁移与基线**：首页改测简短标题、工具条、主推卡、作品网格、关于条、页脚、搜索空结果与布局；开窗、视差、亮点卡、逐词点亮改在 `/pages/ui/` 测试。陈列页保留自己的完整中英文文案，避免紧凑首页删除字段后出现空标题。视觉基线覆盖首页和陈列页、1440×900 / 1280×800 / 390×844、中英文，共 12 张；旧的 4 张无引用基线已移除。
- **过渡根因与修复**：复现了开发模式返回首页时没有 ViewTransition，以及生产构建返回时虽然 ready 但没有任何 `atlas-world` 元素的失败。开发模式的首页 CSS 原本由 JS 异步引入；生产构建还丢掉了源码入口 script 的 blocking 属性，使首页 DOM 与 pagereveal 监听可能晚于首次快照。现将过渡样式表置于 head，并在 Vite HTML 后处理阶段保留首页模块的 `blocking="render"`。这属于真实加载时序缺陷，不能仅归因于自动化或缺少 GPU。[Chrome 官方说明](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document)要求 pagereveal 监听在首次渲染前注册，异步模块需显式阻塞渲染。
- **过渡验证边界**：Metal GPU 的开发与生产用例均确认进入／返回的 ready 成功且唯一封面参与，清理临时名称，返回卡片焦点正确；减少动态时普通跳转无异常。生产构建两项用例各连续执行三次，共 6 次通过。原始 `ViewTransition opt-in disabled` 文字未稳定重现；本轮修复的是上述已复现的时序问题。额外 SwiftShader 软件渲染探针仍出现过渡被跳过（present=false），该探针不记通过。另排查 Vite 对追踪 HTML 的更新通知：客户端按路径过滤，专项探针确认首页没有刷新，已排除此猜测，未修改 watcher 配置。物理手机、Safari / Firefox 与最终动效视觉接受仍待 P2。
- **普通卡预览**：120ms 停留后才加载，离开即暂停、300ms 后归零；400ms 使用共享令牌淡入。同一时间一个视频，普通卡优先，结束后可见主推恢复。主推至少一半可见才自动播放。验证扫过、键盘焦点、后台、离屏、重绘回收、缺 preview 静帧、减少动态、Save-Data、slow-2g / 2g / 3g 和粗指针降级。额外卡片仅存在于浏览器测试临时 DOM，正式目录仍为 1 个作品。
- **对比度**：主句 0.4；按用户补充选择，辅句单独从 0.72 起步并继续逐词点亮。整句中英文初始状态的 axe 检查通过，无 fixme，详见 `docs/accessibility.md`。

收尾结果：干净安装、`npm run check`、原有场景在内的 Node 32 项、`npm run build`、浏览器 47 项、视觉回归 12 项及生产过渡 6 次均通过。构建仍有原有 Three.js 场景 chunk 体积提示。另跑现有性能预算：三轮 Lighthouse 全部达标，首页 JS 65462 字节 gzip，实验室最长交互 72ms（不等同现场 INP）。测试为工程验证，不能代替用户或 Claude 的审美接受。

证据：`output/gallery-p0/` 保存红绿日志、干净副本检查、软件渲染未通过记录、辅句截图与普通卡真实预览录屏；`output/engineering-review/gallery-p0/` 保存桌面与手机中英文的 before / after 截图及首页交互录屏。所有 output 均不提交。


## 2026-11-04：幽珊卡片接入

- 目录新增 `lumen-corallum`，独立入口为 `experiences/lumen-corallum/index.html`；首作目录项与导入前完全一致。作品使用仓库内源码和 Three.js 0.186.1，不依赖相邻项目。
- 实际初始视角以原生 2880 × 1800 渲染捕获，捕获时临时隐藏界面并恢复。生成三档 AVIF/WebP 和环境光缩略图；首页仍无 WebGL canvas，生产依赖检查确认首页不加载 Three.js。
- 作品保留四个视角、圆润半透明触腕、体内外光点、同步呼吸、暂停和唤光。语言与图鉴共用 `three-atlas.language`；加入返回导航、就绪信号及初始化失败时的返回入口。许可证随构建内联，来源面板链接有效。
- 已执行 `npm run check`、`npm test`（41/41）和 `npm run build`。原场景测试一并通过；新增作品的几何、圆形截面、呼吸、粒子和翻译覆盖测试通过。浏览器测试里依赖单卡片的定位已改为明确选择首作；本轮未执行 Playwright CLI 自动化或更新既有视觉基线。
- 独立浏览器实际检查：1440 × 900 和 390 × 844、中英文图鉴与作品、搜索、类别过滤、卡片进入、切换语言保留暂停与视角、刷新保留语言、返回恢复对应卡片焦点。手机尺寸无横向溢出；该检查是桌面浏览器窄视口，并非实体手机性能验收。
- 生产构建在根路径及 `/three-atlas/` 子路径均完成进入、刷新和返回；减少动态效果时默认暂停。浏览器检查期间没有 error/warn 日志。
- 本轮证据在被忽略的 `output/lumen-corallum-integration/`：`before/`、`after/`、`verification.json` 与真实封面底图。导入溯源与清单备份在被忽略的 `.local/lumen-corallum-import/`。

## 2026-11-04 · 上线前问题修复

用户要求将检查发现的问题全部修复。本次完成：初始化失败时退出进入封面，显示重试与返回；缺少 Navigation API 时使用安全检测和同源来源回退；首作沿用图鉴语言，覆盖操作、无障碍、动态及错误提示；静态注入首页与所有登记作品的分享信息和 canonical；修复开发依赖链审计项。保留并行接入的幽珊，不改首作几何、材质、灯光、云层、呼吸或音效合成。

开发依赖采用 basic-ftp 6.2.6、glob 14.0.3 和其依赖 minimatch 11.0.4，Lighthouse CI 版本及预算不变。保留 npm 10 所需锁文件项，并将项目 registry 和锁文件 tarball 地址统一到 npm 官方源，解决 npm 12 的 EALLOWREMOTE 干净安装失败；没有放宽远程包或安装脚本限制。

最终检查：`npm run check`（110 个 JS 文件、2 件作品）、`npm test`（41/41）、`npm run build`、完整 npm 审计（0 项）通过。Chromium 浏览器 54/54、生产转场和双语 7/7、Playwright WebKit 26.0 与 Firefox 146.0.1 桌面/手机视口 4/4 通过；生产静态根路径及 `/three-atlas/` 专项 9/9 通过。干净副本 npm 10 的 ci/check/test/build 和 npm 12 的 ci 均通过，另用不同 SITE_URL 验证实际构建注入。

视觉回归最终 12/12。新增幽珊使原六张首页基线产生内容差异，逐张查看后只更新这六张；组件基线及阈值不变，旧基线和初次失败证据保留。首页与首作桌面 1440×900 / 手机 390×844、中英文 before/after 已采集，另有错误页截图及交互录屏。这不代替用户或 Claude 的审美接受。

性能复测三轮四项均为 100，LCP 516–599ms、CLS 0、TBT 5–11ms，首页 JS 66158 字节 gzip，实验室最长 Event Timing 72ms；不等同现场 INP。Three.js 场景 chunk 仍有原有体积提示，首页未加载它。

部署工作流与 SITE_URL 示例已在本地准备，步骤见 `docs/deployment.md`。尚未提交、推送、公开或配置远程 Pages，目标线上地址仍待部署；实际 Safari / Edge、物理手机和线上分享抓取没有宣称完成。

证据入口：`output/prelaunch-fixes-2026-11-04/report.md`。原检查、红绿失败、安装失败与修复后的记录均保留；output 不提交。

## 2026-11-05 · 公开发布与线上检查

用户明确授权将 `guanmo-ai/three-atlas` 公开、提交推送并部署 GitHub Pages。已将当前双作品版本提交为 `baedf25` 并快进推送到 main，开启 workflow 类型 Pages 和 HTTPS；首发工作流成功，正式地址为 `https://guanmo-ai.github.io/three-atlas/`。发布前限定扫描覆盖当前文本及 Git 历史，未命中本机绝对路径、常见密钥格式或内部聊天标识；`.local/`、`output/` 和环境文件没有提交。

正式网址已完成 12 组检查：三个页面及资源响应、分享信息和封面、预览视频、Chromium / WebKit / Firefox 的桌面与手机视口、中英文、搜索与类别、两件作品的操作、刷新、返回焦点、普通动效，以及两件作品 WebGL 初始化失败时可返回。正常路径没有未处理脚本异常、HTTP 错误或 console.error。首页及来源对话框的 axe AA 标签检查通过。Twitterbot 请求三个页面及分享封面均返回 200。实际查看了首页、首作、幽珊与失败页的线上截图。

首发线上 Lighthouse 三轮的性能、无障碍、最佳实践、SEO 均为 100；LCP 461–603ms、CLS 0、TBT 0。额外的 4 倍 CPU / Fast 4G 搜索交互测试出现 256ms、208ms 超预算样本，定位到目录输入时会销毁并重建所有卡片和视频。目录现按作品 ID 保留仍匹配的卡片及已解码预览，只增删变化项；不改版式、媒体策略或动效参数。保留匹配视频的回归测试先失败再通过，移除卡片仍验证释放旧源。受影响的预览与画廊 16 项通过；当前构建连续三次实验室 Event Timing 最长均为 48ms。另复现并修复了“选类别后搜索为空，再点查看全部作品”仍保留旧类别选中标识的问题，恢复内容时同步恢复全部类别的视觉及 aria-pressed 状态。

最终部署和线上复测的机器结果、截图、性能数据及初始失败日志保存在被忽略的 `output/launch-2026-11-05/`。这些是浏览器引擎及模拟视口的实验室证据，不等同物理手机、实际 Edge / Safari 或现场 INP，也不代替用户对美术与听感的接受。

## 2026-11-05 · 作品卡片统一尺寸

按用户要求将目录卡片统一为 16:10 封面，桌面三列、中等宽度两列、手机一列；筛选后保留相同列宽和尺寸，主推视频保留原有自动播放规则。当前工作区包含三件作品，第三件作品及其资源是已有未提交改动，本次保留。

`npm run check`、`npm test`（41 项）、`npm run build` 通过；画廊和视频预览浏览器测试 16 项通过，视觉回归 12 项通过。更新了六张因新卡片布局及第三个作品而改变的首页基线，截图见 `output/equal-cards/`；实际查看了桌面中文和手机英文画面。三个卡片点击后文档请求均返回 200，未借此宣称第三件作品的 WebGPU 运行体验已经验收。本次调整尚未提交或部署。

### 同日 · 补齐线上同步

用户反馈线上仍只有两张不同大小的卡片。核对远程 main 与最后成功的 Pages 工作流，均停留在 `843a061`，目录仅含 WHERE STARS REST 和 Lumen Corallum；本地的第三件作品、媒体与统一尺寸改动尚未提交。内置独立浏览器复现线上封面分别约 761 × 486 和 370 × 232，确认发布版本缺少本地改动。

本轮重新执行 `npm run check`、`npm test`（41 项）、`npm run build`、画廊与预览浏览器测试（16 项）及视觉回归（12 项），均通过。本地生产预览三张完整卡片均约 370 × 292，封面均约 370 × 232；差异小于 0.01 CSS px，来自网格像素分配。内置浏览器实际进入 Atoll Jelly，看到 WebGPU 场景并完成投喂，检查时控制台无错误或警告。这是桌面冒烟验证，不代表全部交互或真机验收。

本次按用户对正式站点的修正要求，将三件作品与等尺寸卡片一并同步到既有 GitHub Pages；发布结果以 Actions 成功状态及部署后正式地址复核为准。

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

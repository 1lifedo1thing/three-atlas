# Atlas UI · 设计系统与规则

Three Atlas 所有页面共用的设计语言与组件库。代码在 `src/ui/`。**新页面只能组合这里的组件；需要新样式时，先扩展组件库，再在页面里使用。**

对齐标准：Apple 产品页、Linear 这类头部产品官网，以及 threejs.org 的作品墙。共同点是作品画面占主导、标题字号大而克制、一屏只讲一件事、滚动动效有叙事意义、零装饰。设计调研见 `docs/design.md`。

## 1. 五条原则

1. **作品是主角**：平台只用中性的黑白灰，所有色彩都来自作品封面。
2. **一屏一件事**：每个区块只有一个标题、一个主要动作。
3. **动效有意义**：只用于引导视线和串联叙事，比如开窗、点亮文字、进入作品。禁止纯装饰的动画。
4. **只写真实内容**：不虚构作品、数据、评价，不放占位卡片。
5. **人人可用**：所有功能都能用键盘操作，触屏可用，有中英文，开启「减少动态效果」时一律降级为静态。

## 2. 设计令牌（`src/ui/tokens.css`）

| 类别 | 令牌 | 用途 |
| --- | --- | --- |
| 底色 | `--c-bg` `--c-bg-2` | 页面底色 |
| 表面 | `--c-surface` `--c-surface-2` | 卡片底、按钮底、图片加载前的占位色 |
| 文字 | `--c-fg` `--c-fg-2` `--c-fg-3` `--c-fg-4` | 主文字、正文、次要说明、点亮前的暗字 |
| 线 | `--c-line` `--c-line-2` | 分隔线、描边 |
| 字号 | `--t-display` `--t-h1` `--t-h2` `--t-h3` `--t-lead` `--t-body` `--t-small` `--t-caption` | 见第 3 节 |
| 间距 | `--s-1`…`--s-10`、`--gutter`、`--section-y`、`--container` | 4 的倍数阶梯；区块上下留白统一用 `--section-y` |
| 圆角 | `--r-sm` `--r-md` `--r-lg` `--r-pill` | 大图统一用 `--r-lg`，按钮用 `--r-pill` |
| 动效 | `--e-out` `--e-inout` `--e-std`、`--d-1`…`--d-4` | 与 `motion.js` 的 `EASE` / `DUR` 对应 |

禁止在组件或页面里写死颜色、字号、圆角和缓动曲线，一律引用令牌。

## 3. 字体与排版

- 拉丁文用 **Geist**，等宽用 **Geist Mono**，均自托管。中文用系统黑体（PingFang / HarmonyOS / Noto Sans SC / 雅黑）。不使用 Google Fonts，保证中国大陆可以访问。
- 排版角色：`.ui-display`（每页最多一个）、`.ui-h1`、`.ui-h2`、`.ui-h3`、`.ui-lead`、`.ui-small`、`.ui-eyebrow`（等宽字体、全大写，用作小标签）。
- 中文标题自动放宽行高、收小字距，并开启 `word-break: keep-all`，所以只在标点处断行。
- 一行正文不超过 36 个汉字或 72 个英文字符。

## 4. 版式

- 内容宽度 `--container`（1440px），两侧留白 `--gutter`。全屏媒体可以突破容器。
- 区块之间统一留白 `--section-y`。区块顺序遵循 **叙述 → 证据 → 目录 → 收尾**。
- 断点：720px（手机）、900px（双栏）。手机上不允许横向溢出（`overflow-x: clip`）。

## 5. 组件目录（`src/ui/index.js`）

| 组件 | 用途 | 规则 |
| --- | --- | --- |
| `GlobalNav` | 顶部固定导航：品牌、页内链接、CTA 槽、语言 | 链接最多 4 个。CTA 只在讲解某个作品的区块里出现（`showCta`）。 |
| `Hero` | 页面开场：小标签、大标题、一句说明 | 每页一个。标题不超过 12 个字或 6 个英文单词。 |
| `FeatureWindow` | 圆角窗口滚动展开为满屏，再给出作品名和入口 | 每页最多一个，只用于主推作品。动效由 `animateFeatureWindow` 驱动。 |
| `Statement` | 大段宣言，随阅读逐词点亮 | 一句主句加一句弱化的补充（`muted`），总长不超过 60 字。 |
| `SectionHead` | 区块标题：小标签、标题、说明、动作 | 标题统一以句号收尾，形成 Apple 式的陈述语气。 |
| `Highlights` | 横向大图集（近看这个世界） | 3–6 张。图片必须来自作品真实画面，说明文字必须描述作品真实具备的能力。 |
| `WorkCard` | 作品卡片：封面、实时徽标、编号、名称、简介 | 封面比例 16:10。悬停时环境光亮起，出现「进入」按钮。 |
| `WorkIndex` | 作品目录：搜索、类别筛选、网格、空结果 | 类别有 2 个及以上才显示筛选。只有 1 个作品时改为横向目录条目。 |
| `Footer` | 收尾句、链接分栏、版权行、大字标 | 每页一个。 |
| `Button` / `Badge` | 按钮（primary / secondary / ghost，尺寸 sm / md / lg）、状态徽标 | 一个区块最多一个 primary 按钮。 |

组件约定：

- 组件是返回 DOM 元素的纯函数。**文案、数据都由页面传入，组件内部不写任何文案。**
- 每个组件对应一个 `.js` 和一个 `.css`，class 使用 `ui-组件名__部件` 的 BEM 命名，状态用 `is-*`。
- 带滚动动效的组件另外导出 `animateX(el)`。页面要在 `scope()` 内调用它，这样切换语言或重新渲染时能一次性回收所有动画。
- 新增组件的步骤：在 `src/ui/components/` 写好 js 和 css，在 `index.js` 和 `index.css` 里登记，在本表加一行，然后在首页或示例页面里截图验收。

## 6. 动效（`src/ui/motion.js`）

- 技术栈：GSAP 3（ScrollTrigger、SplitText）加 Lenis 平滑滚动，都是免费的开源方案。不再手写滚动监听。
- 词汇表：入场用 `expo.out`，时长 1.1–1.4 秒，位移 16–48px；同组元素错开 0.08 秒。滚动相关的动效一律 `scrub`，不做自动播放。
- 现成的辅助函数：`reveal(root)` 处理所有 `[data-reveal]`（值为 `group` 时子元素依次入场）；`riseLines(el)` 让标题逐行从遮罩中升起；`lightUp(el)` 让段落逐词点亮（中文用 `Intl.Segmenter` 分词，不会把「环绕」拆开）。
- 跨页面：首页与作品页之间用原生 View Transitions，封面和场景共用一个过渡名 `atlas-world`（`transitions.js`，以及作品页由构建插件自动注入的部分）。
- 开启「减少动态效果」时：关闭 Lenis、不固定画面、不拆分文字、不做跨页过渡，内容全部直接显示。

## 7. 图片与媒体

- 封面：作品初始视角的真实截图，16:10，暂定 1440×900，以后升级到 2880×1800。进入过渡依赖封面和初始画面对齐。
- 环境光：先模糊一张小图（`.ui-ambient`，blur 18px），再放大约 4 倍，开销远低于大面积模糊。
- 亮点图（`highlights`）：用 `focus`（例如 `"50% 40%"`）和 `zoom`（1–4）从封面上裁出细节，不另外制作图片。
- 视频预览（规划中）：一次只播放 1 个，离开视口立即暂停，开启「减少动态效果」或省流量模式时不播放。

## 8. 文案

- 中文优先，所有可见文字都有中英文两版，放在页面的 `copy.js` 里。
- 语气：陈述句，简短，用句号收尾。不用感叹号，不写营销腔（「颠覆」「极致」之类）。
- 作品名保持作者给定的写法（例如 `WHERE STARS REST`），不翻译、不改写。

## 9. 内容模型（`content/works.json`）

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id`、`title`、`subtitle`、`summary`、`category`、`tags`、`entry`、`cover`、`coverAlt`、`author` | 是 | 见 `scripts/content.mjs` 的校验规则 |
| `featured` | 否 | `true` 表示首页主推，全站最多一个。都没有设置时取第一项。 |
| `highlights` | 否 | `[{ title, text, focus, zoom }]`，供「近看这个世界」使用。`title` 和 `text` 都要有中英文。 |

## 10. 页面配方

- **首页**（`src/gallery/main.js`）：`GlobalNav` → `Hero` → `FeatureWindow`（主推作品）→ `Statement` → `Highlights`（主推作品）→ `WorkIndex` → `Footer`。
- **新增页面类型**（关于、合集、文章等）：新建 `pages/<name>/index.html` 和对应的 `src/pages/<name>/main.js`，引入 `src/ui/index.css`，只用组件库组合。需要新组件时，先按第 5 节加进组件库。
- **作品页**：作品自带界面与渲染，必须引用 `src/shared/experience-nav.css`，并在场景就绪时给 `body` 加 `ready`。进入过渡由 `scripts/vite/atlas-arrival.mjs` 自动注入，作品源码不需要改。可复用的 three.js 能力见 `docs/CODEX-HANDOFF.md` 第 1 项。

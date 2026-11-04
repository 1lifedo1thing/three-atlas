# Three Atlas

> A world of worlds. Explore in 3D.

**三维图鉴**：在浏览器里探索可以旋转、靠近、停留的三维世界。

An atlas of interactive 3D worlds, models, simulations, and creative experiments for the web.

## 当前内容

首作 **WHERE STARS REST / 星光的归处**：程序化悬浮岛屿、紫色发光树、同步呼吸的粒子、萤火与岛底云层。支持环绕、缩放、光芒调节、暂停、复位和可选的合成氛围音。

首页以轻量卡片汇总作品，每个作品拥有独立页面。首页视觉目前是结构初稿，后续由 Opus 5.5 完整设计；现有作品画面与交互沿用原版本。

## 本地运行

需要 Node.js **20.19+ 或 22.12+** 和 npm，推荐 Node.js 22。

```sh
npm ci
npm run dev
```

打开 `http://127.0.0.1:5194/`。首作可直接访问 `/experiences/where-stars-rest/index.html`。

生产构建与预览：

```sh
npm run check
npm test
npm run build
npm run preview
```

生产预览在 `http://127.0.0.1:4194/`。`dist/` 可静态部署，根路径与项目子路径均使用相对资源地址；本次没有配置线上部署。

## 内容与代码边界

```text
content/works.json                 作品目录：名称、封面、简介、作者与入口
src/gallery/                      首页控制器、卡片组件、文案与样式
src/gallery/tokens.css             可替换的视觉变量
src/shared/experience-nav.css      轻量返回导航样式
experiences/where-stars-rest/      首作的独立 HTML、源码、测试与许可证
public/media/                     真实作品封面
scripts/                          目录与多页面构建检查
docs/OPUS-HANDOFF.md               后续设计交接
```

## 加入下一个作品

1. 新建 `experiences/<id>/index.html`，源代码与样式放自己的目录，加入返回 `../../` 的链接。
2. 将真实封面放入 `public/media/`。封面要用作品的初始视角截取，因为进入动画会从封面无缝过渡到实时画面。
3. 在 `content/works.json` 登记条目，`entry` 为 `experiences/<id>/index.html`。排在第一位的作品会作为首页开场的主推作品。
4. 从 `experiences/where-stars-rest/index.html` 复制两处：`<head>` 里的 Three Atlas arrival 内联脚本，以及 `<body>` 开头的 `<img class="atlas-arrival" data-src="media/<封面>">`。前提是页面已经引用 `src/shared/experience-nav.css`，场景就绪时给 `body` 加上 `ready` class。
5. 运行 `npm run check`、`npm test`、`npm run build`。目录项自动成为构建入口，无需更改首页控制器或 Vite 入口清单。

使用同一个 Three.js 版本时可复用构建出的引擎包，各作品不共享运行中的渲染器、CSS 或全局状态。出现真实共同需求后，再提取共享能力。

## 作者与依赖

由 [观默 / @guanmo_ai](https://x.com/guanmo_ai) 创作与维护。

首作无外部 3D 模型、图片贴图、字体或音频；首页封面是作品的真实浏览器截图。依赖来源与许可证见 [THIRD_PARTY.md](./THIRD_PARTY.md)。本项目尚未选择整体许可证。

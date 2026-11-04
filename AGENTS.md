# AGENTS.md — Three Atlas 工程规范

> 给 Codex 和其他编码代理。动手前先读完本文件和 `docs/HANDOFF.md`（交接清单）。

## 1. 这是什么

Three Atlas 是一个网站，收录 观默（Guanmo）本人创作的交互式 3D 作品。每件作品叫一幅 **图版（plate）**，有编号（PL. 001…），整个网站叫 **图鉴（atlas）**。
线上地址：`https://guanmo-ai.github.io/three-atlas/`，由 GitHub Pages 部署（`.github/workflows/deploy.yml`，推送到 `main` 后自动发布）。

网站有三种视图，**共用同一个 WebGL 渲染器和同一块画布**：

| 视图 | 路由 | 说明 |
| --- | --- | --- |
| 目录 Index | `/three-atlas/` | 首页：标题区（浑天仪）+ 图版卡片网格。卡片里是实时渲染的作品。 |
| 星图 Atlas | `/three-atlas/atlas/` | 所有图版悬浮在一张天球星图里，拖动环顾，点击进入。 |
| 作品 Work | `/three-atlas/works/<slug>/` | 卡片无缝放大成全屏，作品变为可交互。 |

## 2. 分工与设计护栏

- **Claude 负责设计**：视觉语言、版式、动效、文案、作品接口的设计。
- **Codex 负责工程**：脚手架、构建、部署、资源管线、测试、性能、作品迁移。

**不要改变观感**，除非任务单明确要求。下列内容属于设计资产，改动前必须在任务单里有设计说明，或先征求意见：

- `src/site/styles.css` 中的 tokens（颜色、字体、间距、缓动曲线）和版式；
- `src/site/plate.ts` 的着色器视觉（圆角、显影、悬停、颗粒、暗角、色调映射）；
- `src/site/sky.ts`、`src/site/armillary.ts` 的外观；
- `src/site/i18n.ts` 里的文案；
- 转场的时长和缓动（`src/site/stage.ts` 里的 `ease`、`duration`、`delay`）。

纯结构、性能、可维护性方面的重构可以做，但要保证像素级观感不变：交付时附上改动前后的截图（目录、星图、作品三态）。

## 3. 目录结构

```
index.html              应用外壳（构建时会为每个路由复制一份并改写 meta）
vite.config.ts          base=/three-atlas/；route-pages 插件生成 atlas/、works/<slug>/、404.html
src/
  main.ts               启动：UI、路由、Stage、光标、HUD、语言
  engine/               ★ 作品可复用的共享运行时（作品只能从这里 import 站点能力）
    types.ts            作品契约：WorkMeta / WorkContext / WorkInstance / defineWork
    orbit.ts            createOrbit：预览时自动漂移、全屏时交给用户操作的轨道相机
    glsl.ts             共享 GLSL 片段（simplex3、hash）
  site/                 门户本身（作品不得 import 这里的任何东西）
    stage.ts            唯一渲染器；三种视图的位姿插值与转场；渲染目标调度
    plate.ts            图版网格 + 合成着色器 + 渲染目标
    sky.ts              天球星图（经纬网、黄道、星点）
    armillary.ts        首页浑天仪
    registry.ts         扫描 works/*/work.json 和 index.ts；图版在星图上的坐标
    router.ts / i18n.ts / ui.ts / styles.css
works/
  001-strata/           图版 001 示例作品，也是作品写法的参考实现
    work.json           目录条目（元数据）
    index.ts            export default defineWork(ctx => instance)
docs/HANDOFF.md         交接清单（给 Codex）
```

## 4. 命令

```bash
npm install
npm run dev        # http://localhost:5173/three-atlas/
npm run build      # tsc --noEmit + vite build → dist/
npm run preview    # 预览 dist
```

## 5. 作品契约（最重要）

每件作品是 `works/NNN-slug/` 目录，包含 `work.json` 和 `index.ts`。

```ts
import { defineWork, createOrbit } from '@engine'
export default defineWork((ctx) => {
  // ctx.renderer / ctx.dom / ctx.quality ('low'|'high') / ctx.reducedMotion
  return {
    scene, camera,
    resize(w, h) {},                 // 渲染目标的像素尺寸（已乘像素比）
    update(time, delta, active) {},  // active=true 表示全屏且可交互
    activate() {}, deactivate() {},  // 全屏时挂/卸控制器和监听，只挂在 ctx.dom 上
    render(renderer, target) {},     // 可选：多 pass / 自带后期，必须画进 target
    dispose() {},
  }
})
```

硬性规则：

1. **作品不创建渲染器、画布和 rAF 循环**。Stage 会把作品画进它自己的渲染目标（HalfFloat + MSAA），再由图版着色器合成到屏幕上。这样同一件作品才能同时出现在卡片、星图和全屏里。
2. **输出线性颜色**。色调映射和曝光写在 `work.json` 的 `toneMapping`（`neutral` | `aces` | `none`）和 `exposure` 里，由图版着色器统一处理。不要设置 `renderer.toneMapping`，也不要改 `outputColorSpace`。
3. **不改渲染器的全局状态**：`setPixelRatio`、`setSize`、`setClearColor`、`autoClear`、`shadowMap` 等。确实需要时（比如阴影），要在 `render()` 里设置并在结束前还原。
4. **预览要便宜**：`active=false` 时作品可能同时有多件在渲染。`ctx.quality === 'low'` 时降低细分和粒子数。
5. **输入只在 activate 之后监听**，只监听 `ctx.dom`；`deactivate` 时全部移除。
6. **尊重 `ctx.reducedMotion`**：关闭自动漂移和大幅动画。
7. **资源**放在作品目录内，用 `new URL('./assets/x.glb', import.meta.url).href` 引用，让 Vite 打包并加哈希。不要用绝对路径。
8. `dispose()` 必须释放所有 geometry、material、texture 和 render target。
9. 作品之间可以复用的代码一律放进 `src/engine/`，作品之间不得互相 import。

### work.json

```jsonc
{
  "slug": "strata",            // 路由名，全站唯一，小写短横线
  "plate": 1,                  // 图版号，全站唯一；目录名前缀必须等于它（001-）
  "title":   { "en": "Strata", "zh": "地层" },
  "summary": { "en": "…", "zh": "…" },
  "medium":  [{ "en": "Procedural terrain", "zh": "程序化地形" }],
  "year": 2026,
  "toneMapping": "neutral",    // 可选
  "exposure": 1.0,             // 可选
  "accent": "#ff5b37",         // 可选，作品页 HUD 的强调色
  "controls": { "en": "Drag to orbit", "zh": "拖动环绕" },  // 可选
  "draft": false               // 可选，true 时只在 dev 出现
}
```

图版号决定它在星图上的固定坐标（`registry.ts → chartPosition`），**发布后不要改图版号**。

## 6. 把一个已有的 three.js 项目迁成图版

1. 在 `works/NNN-slug/` 新建 `work.json`，编号取当前最大号 + 1。
2. 把原项目的场景搭建代码搬进 `defineWork`：去掉 `new WebGLRenderer`、`document.body.appendChild`、`requestAnimationFrame` 和 `resize` 监听。
3. 原来 `renderer.render(scene, camera)` 的逻辑交给 Stage；原有 EffectComposer 改成在 `render(renderer, target)` 里渲染到 `target`。
4. OrbitControls 换成 `createOrbit(ctx, camera, opts)`，或者在 activate/deactivate 里自己管理。
5. 原来的 `renderer.toneMapping` 和 `toneMappingExposure` 改写进 work.json。
6. 资源移到作品目录下的 `assets/`，体积大的先过资源管线（见 HANDOFF）。
7. 验证：目录卡片、星图、全屏三态都正常；来回进出 5 次，控制台无报错，显存不涨。

## 7. 完成的定义

- `npm run build` 通过，零 TypeScript 错误；
- 动到的视图都截图核对过（桌面 1440×900、手机 390×844）；
- 控制台没有报错和警告；
- 更新 `docs/HANDOFF.md`：做完的条目删掉，并在顶部写一行执行记录（日期、做了什么、怎么验证的）；
- 提交信息沿用 Conventional Commits（`feat:`、`fix:`、`docs:`、`chore:`），一件事一个提交。

# Three Atlas

> A world of worlds. Explore in 3D.

**三维图鉴**：一部收录交互式 3D 世界、模型、仿真与实验的图鉴。每件作品是一幅图版，可以单独全屏探索，也可以和所有作品一起悬浮在同一张星图里。

An atlas of interactive 3D worlds, models, simulations and experiments. Each work is a plate: step inside it full screen, or see every plate suspended together in one celestial chart.

**在线浏览 / Live** → https://guanmo-ai.github.io/three-atlas/

## 三种视图 / Three views

- **目录 Index**：标题区之后是图版卡片网格，每张卡片里都是实时渲染的作品。点击卡片，它会无缝放大成全屏。
- **星图 Atlas**：所有图版按编号固定在天球上的坐标。拖动环顾四周，点击任意一幅进入。
- **作品 Work**：每件作品有独立网址 `/works/<slug>/`，可以直接分享。

整个网站只用一个 WebGL 渲染器。作品本身不创建画布，只提供场景，所以同一件作品能同时出现在卡片、星图和全屏中，作品之间也可以共享代码（`src/engine`）。

## 图版 / Plates

| 编号 | 作品 | 技法 |
| --- | --- | --- |
| PL. 001 | 地层 Strata | 程序化地形 · GLSL 等高线 |

## 开发 / Development

```bash
npm install
npm run dev      # http://localhost:5173/three-atlas/
npm run build
```

新增或迁移作品的方法、作品接口、工程规范见 [AGENTS.md](AGENTS.md)；待办的工程任务见 [docs/HANDOFF.md](docs/HANDOFF.md)。

推送到 `main` 后，GitHub Actions 会自动部署到 GitHub Pages。

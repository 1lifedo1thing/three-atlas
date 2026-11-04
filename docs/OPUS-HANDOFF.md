# Three Atlas：给后续 Opus 5.5 的设计交接

## 产品与当前阶段

固定品牌 **Three Atlas**，仓库 `three-atlas`，中文名「三维图鉴」。用户要简单、简约、大气的 3D 网页作品集合：在首页浏览卡片，点击进入每个作品自己的可交互网页。作品质感优先，操作要少。「全球顶尖」是设计追求，目前未完成首页视觉验收。

本轮优先准备内容与结构。不要把现有黑色页面、字号、Logo、文案和卡片尺寸当成已经确认的最终设计，可以完整重做首页视觉。

## 第一个真实作品

**WHERE STARS REST / 星光的归处**：紫色发光树、深蓝星空、悬浮岩岛、程序化云层与同步呼吸的萤火。作者为观默 / `@guanmo_ai`。

- 目录项：`content/works.json`。
- 入口：`experiences/where-stars-rest/index.html`。
- 场景源码：`experiences/where-stars-rest/src/`。
- 真实封面：`public/media/where-stars-rest.jpg`，1440 × 900；从实际场景截取，临时隐藏 UI 后恢复，没有用 AI 改写画面。
- 独立作品正式名称由用户确定，首页设计不能顺带改名或重做场景美术。

## 参考与审美

- 用户的 [Awesome AI Motion](https://github.com/guanmo-ai/awesome-ai-motion)：参考卡片浏览与聚合能力。
- [Tripo Studio](https://studio.tripo3d.ai/)：仅为 3D 内容画廊参考。用户希望更简单，不需要生成工作台、上传器、登录或复杂侧栏。
- 让封面、尺度、留白、字体与克制的交互建立质感，不依靠满屏粒子、重玻璃面板或装饰动效。
- 用户不喜欢绿色。首作紫色不代表平台强制主色；平台需要容纳未来不同风格的内容。
- 目前只有一个作品，不虚构作品、作者、评价、统计或假装可体验的占位卡片。
- 最终浅色 / 深色、字体、标识、卡片比例和首页文案均未确定，现有版本仅用于验证结构。

## 稳定的代码约定

```text
content/works.json                    内容清单：卡片、构建入口、featured 主推、highlights 亮点
src/ui/                              Atlas UI 组件库：tokens、base、motion、transitions、components/*
src/gallery/main.js                  首页：组合组件
src/gallery/model.js                 selectWorks(works, query)、pickFeatured(works)
src/gallery/copy.js                  首页中英文文案
src/shared/experience-nav.css        作品页的返回导航与进入过渡样式
scripts/vite/atlas-arrival.mjs       构建时向作品页注入进入过渡
experiences/<id>/index.html          独立作品入口
experiences/<id>/src/                作品专用源码
public/media/                       可公开的真实封面
```

可以替换首页 HTML、组件和样式组织，保留内容字段语义与独立入口即可。中英文已齐备，当前默认中文，切换后记住语言偏好。

必须保持：

1. 作品能直接链接进入和刷新，不只存在于首页弹层，也不依赖首页先初始化。
2. 首页不加载所有作品的引擎与 WebGL 场景，图片为默认预览；以后增加视频预览时限制并发与离屏播放。
3. 作品 CSS、输入和 WebGL 生命周期属于自己的页面，不把作品塞进同一个全局渲染循环。
4. 根路径与 GitHub Pages 项目子路径都可运行，入口和返回链接使用相对地址。
5. 第二张卡片只需新增作品目录、封面和清单项，构建入口自动生成。
6. 导航、搜索和卡片支持键盘，手机没有横向溢出，减少动态效果有效。
7. 内部实现说明、验收和模型信息不要进入访客正常浏览流程。

## 复用边界

可复用卡片、平台文案、视觉变量、返回导航与构建依赖。首作相机、材质、几何和后处理仍在作品目录。

第二个作品确实需要同一能力时，再提取实际共享的工具；不要预先要求所有作品实现统一场景接口。多页面结构允许未来不同渲染方案。

## 验证与授权

开发 `npm run dev` 默认端口 5194，生产预览 `npm run preview` 默认端口 4194。

```sh
npm run check
npm test
npm run build
```

`scripts/check-build.mjs` 检查登记页面、封面、返回链接和首页依赖链。原有场景测试位于作品自己的 `tests/`。

实际验证与边界见 `docs/verification.md`。远程仓库保持私有；内容准备完成后，用户要求同步到 `guanmo-ai/three-atlas`。本次同步仅包含代码、内容与文档，不配置线上部署；后续操作沿用用户明确授权范围。

# 交接清单（给 Codex）

Claude 负责设计（版式、视觉、动效、文案）；下面是工程事项。开工前读 `AGENTS.md`、`docs/OPUS-HANDOFF.md`、`docs/design.md`。改动不得改变首页观感，涉及视觉的必须附改动前后截图。做完一项就删掉一项，在 `docs/verification.md` 记录怎么验证的。

## 1. 高清封面与响应式图片

- 全屏开窗在 2x 屏上需要更清晰的封面。从作品的**初始视角**重新截取 2880×1800 封面（流程同首作：临时隐藏 UI，截图后恢复，不改场景）。
- 构建时生成 AVIF 和 WebP，宽度 720、1440、2880 各一份；`card.js` 输出 `srcset`/`sizes`：卡片约 50vw，开窗为 100vw。
- 环境光层（`.ambient`）改用 160px 宽的小图，减少解码开销。
- 验收：Lighthouse LCP 不变差；1440 和 2880 视口下封面清晰；`npm run build` 通过。

## 2. 构建检查加入「进入过渡」约定

- `scripts/check-build.mjs` 对每个作品页增加断言：包含 `class="atlas-arrival"`，且 `data-src` 等于 works.json 中的 `cover`；包含 arrival 内联脚本（检查 `pagereveal` 和 `atlas-world` 两个关键字）。
- 验收：删掉其中任何一处，构建失败，且报错信息说明缺什么。

## 3. 卡片视频预览（等第二、三个作品到位后再做）

- works.json 新增可选字段 `preview`：`media/<id>.webm` 和 `.mp4`，6 秒，静音循环，最长边 1280。
- 行为：桌面端在悬停或聚焦卡片时播放；手机端在卡片进入视口中央时播放。同一时间最多播放 1 个，离开视口立即暂停。开启「减少动态效果」或 `Save-Data` 时只显示封面。
- 视频盖在封面上方，加载完成后用 400ms 淡入，加载失败时保持封面。
- 验收：Performance 面板中首页没有加载 Three.js；同一时刻只有一个视频在解码。

## 4. 分享卡片和 meta

- 首页和每个作品页加上 `og:title`、`og:description`、`og:image`、`twitter:card`。og:image 用封面，需要绝对 URL：站点地址确定后，通过环境变量 `SITE_URL` 在构建时注入。

## 5. 部署（需要用户授权后再做）

- 用户已表示希望使用免费的 `guanmo-ai.github.io/three-atlas`。前提是用户把仓库改为公开，并在 Settings → Pages 中选 GitHub Actions。
- 新增 `.github/workflows/deploy.yml`：在 `main` 上执行 `npm ci`、`npm run check`、`npm test`、`npm run build`，然后上传 `dist/` 并部署。

## 6. 真机验收

- Chrome 和 Edge（桌面与安卓）、Safari 18.2+（macOS 与 iOS）：点击开窗和卡片时，封面应放大并无缝转为实时画面；从作品返回时，画面应收回到封面。Firefox 应为普通跳转，没有报错。
- 在本地无 GPU 的软件渲染环境里，跨文档过渡偶尔会被浏览器跳过，需要用真机确认。

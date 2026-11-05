# Three Atlas 部署与维护

正式地址为 `https://guanmo-ai.github.io/three-atlas/`。用户于 2026-11-05 明确授权公开仓库、提交推送及部署；仓库现为公开，Pages 发布来源为 GitHub Actions，HTTPS 已启用。首次发布的运行记录：[GitHub Actions](https://github.com/guanmo-ai/three-atlas/actions/runs/41992624987)。

`.github/workflows/deploy.yml` 在 main 收到推送或手动触发后，依次执行干净安装、静态检查、单元和场景测试、完整依赖审计及生产构建，上传 `dist/`，再部署到 GitHub Pages。构建任务只有仓库读取权限；部署任务使用 Pages 与 OIDC 所需权限。

工作流使用已核对的 GitHub 官方 Actions 版本：checkout 7.0.1、setup-node 7.1.0、configure-pages 6.0.0、upload-pages-artifact 5.0.0、deploy-pages 5.0.1。项目运行 Node.js 22，保留 Three.js 0.186.1 和 Vite 8.3.5。

项目 `.npmrc` 与锁文件统一使用 npm 官方 registry，避免 npm 12 将混用的镜像 tarball 判断为远程包而拒绝安装。锁文件保留 npm 10 所需的传递依赖；没有开启 `allow-remote` 或放宽安装脚本权限。

首页及目录中每个作品的分享信息由 `scripts/vite/atlas-meta.mjs` 注入静态 HTML，含 canonical、Open Graph、Twitter 大图卡片与真实作品封面。分享平台不需要执行网站 JavaScript。

`SITE_URL` 可在环境中设置，也可由 `.env` / `.env.local` 提供，示例见 `.env.example`；默认沿用上述目标地址。它支持根域或项目子路径，拒绝非 HTTP(S)、凭据、查询串与锚点。更换正式站点后须重新构建。

```sh
npm ci
npm run check
npm test
npm run audit
SITE_URL=https://guanmo-ai.github.io/three-atlas/ npm run build
npm run preview
```

本次已按用户授权完成：

1. 将 `guanmo-ai/three-atlas` 改为公开，采用项目既定的免费 GitHub Pages 方案。
2. 提交并推送双作品版本到 main，首发提交为 `baedf251bda1ecb808b794fe686c67db041ac840`。
3. 将 Pages 发布来源设为 GitHub Actions，完成构建、上传与部署。

后续经授权更新 main 即会运行相同发布流程，也可在 Actions 中手动运行。遇到部署失败，先查看失败步骤；保留上一次成功版本，不强制推送或绕过检查。回滚时选择已验证的历史版本创建回退提交，再走同一工作流。

发布后再验证正式地址及作品深链接的 HTTPS、刷新、返回、媒体响应和分享抓取。物理 Android / iPhone、实际 Safari / Edge 仍需验收；Playwright WebKit / Firefox 结果不代表这些设备已通过。

来源：[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[Vite 环境变量](https://vite.dev/guide/env-and-mode)。

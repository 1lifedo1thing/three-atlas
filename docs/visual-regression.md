# 组件陈列与视觉回归

内部页面 `/pages/ui/?lang=zh` 与 `/pages/ui/?lang=en` 展示 Atlas UI 全部组件，包括 Statement、Panels、Principles、Highlights、三种按钮及尺寸、忙碌/禁用状态、悬停和缺图卡片、带筛选的目录、空结果、Roadmap 与 ExperienceShell 错误状态。页面有 noindex/nofollow，首页没有链接。

`npm run test:visual` 在 1440×900 和 390×844 下比对中英文四套整页 PNG。减少动态、等待字体和图片解码，`maxDiffPixelRatio: 0.005`，差异超过 0.5% 失败。基线存于 tests/visual/baselines，首次来自本次工程实现，**尚待 Claude 与用户审美验收**。

合法的视觉变更经审阅后可用 `npm run test:visual -- --update-snapshots` 更新。不要通过改阈值或无条件更新来消除失败。已用临时浏览器样式探针验证：约 5% 像素差异确实使命令失败，临时用例随后删除，正确基线保留；证据在本项 visual-probe.log。

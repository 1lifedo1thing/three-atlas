# 高清封面与响应式图片

WHERE STARS REST 的封面从初始视角真实采集，实际 canvas 缓冲区 2880×1800、DPR 1。采集脚本为 `node scripts/capture-cover.mjs`，需要已启动的 5214 开发服务和可用硬件 GPU。临时拦截场景模块，仅将采集上下文的像素预算从 1,850,000 提高到 5,184,000；不修改磁盘场景源码、相机配置、几何、材质或灯光。隐藏的界面在截图后已恢复。原生 PNG 和采集元数据保留在本地 output/engineering-review/HD/native。

`predev` / `prebuild` 生成 AVIF、WebP 的 720/1440/2880 三档，以及 160px WebP 环境光图；tone、尺寸、路径和源文件摘要自动写入 works.json，未变更的源图复用现有文件。生产构建要求原图宽度至少 2880px，拒绝把低清图放大冒充高清。开发模式允许新作品暂缺封面，显示缺图占位并提示，生产检查仍失败。

共享 createImage 输出 picture、AVIF/WebP source、srcset 和 sizes，保留 JPEG 回退。环境光始终使用 160px 小图；视频 poster 使用匹配视口的 WebP 封面。所有媒体仍先 decode，再执行 600ms 渐显。手机 DPR1 实测选择 720 AVIF，桌面 DPR2 选择 2880 AVIF；没有额外请求完整 JPEG，路径兼容首页和内部子页面。

高清源替换会改变画面细节与实时光照阶段，属于本项预期变更；四套组件基线随之更新并复测，审美仍待 Claude 与用户验收。场景目录与最初设计提交保持一致。

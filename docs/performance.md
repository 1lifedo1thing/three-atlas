# 本地性能预算

运行 `npm run perf`。脚本先构建，再用 Playwright 安装的独立 Chromium 执行 Lighthouse CI；不使用个人 Chrome、不上传报告。首次需执行 `npx playwright install chromium`。报告在 `.lighthouseci/` 和 `output/performance/`。

移动配置：Lighthouse 默认移动屏幕，Fast 4G 为 RTT 40ms、10Mbps，CPU slowdown 4。连续测量三次，每次均须满足四项评分 ≥95、LCP ≤2000ms、CLS ≤0.02、TBT ≤100ms。首页完整依赖图（包括动态依赖）实际 gzip 总量 ≤70000 字节。所有门槛失败时命令退出非零。

另用移动触摸上下文、相同 4 倍 CPU 与 Fast 4G 的实际 CDP 限速，执行搜索、输入和语言切换；采集 Event Timing，最长样本 ≤100ms。该数据属于实验室交互响应，**不等同于现场 INP**。真实中端手机的 INP 必须在上线后由现场数据确认，当前未宣称达到。

语言切换先绘制忙碌状态，再重建语言内容；去掉重复同步 ScrollTrigger 刷新，使用字体就绪后的安全刷新。保留失败与复测日志，避免用放宽阈值掩盖失败。

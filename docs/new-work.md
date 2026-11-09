# 新建独立作品

动手之前先读 [作品制作经验](lessons.md)：立意、画面、着色器排错、无 GPU 截图验证和接入规范都有现成结论。

运行 `npm run new:work -- <id> "<TITLE>" "<中文副标题>"`。ID 使用小写字母、数字和连字符。脚本拒绝越界与覆盖，只追加条目，不提交或发布。

脚本复制 `experiences/_template/`，将标题安全写入 HTML 与 JSON 数据，入口为 `experiences/<id>/index.html`。场景用 three kit，界面用 ExperienceShell 与 Atlas UI 令牌；首帧完成后添加 body.ready；页面隐藏、BFCache 返回和 WebGL 恢复分别处理。

随后补 `public/media/<id>.jpg` 的真实封面（宽度至少 2880px），按源码核对中英文说明、英文副标题、封面描述和署名，再跑 check/test/build。缺封面时开发服务仍可启动并使用占位，便于先制作场景与采集封面；生产内容检查会明确失败，不会用别的作品画面冒充。默认生成的说明属于草稿，**内容待用户审阅**。

模板目录不登记到 works.json，也不进入构建。只有生成并登记的新作品作为独立入口。浏览器集成测试在临时副本中生成 engineering-smoke，采集它自己渲染的封面，验证首页卡片、独立刷新和跨页进入，随后删除临时副本；正式目录仍只有真实首作。

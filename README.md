# EE黑客松 · 像素开发现场

用于现场投影的黑金主题静态 Demo。固定 1920 × 1080 画布，按屏幕整体等比缩放，没有手机端重排。

## 当前效果

- 前方大屏、讲台、音箱；48 组各一桌、一名像素角色。
- 六套角色原画，错开的动作帧和不同朝向；敲码、思考、休息三种模拟状态。
- 阶梯会场 / 围坐街区两种布局。
- 头顶显示累计 Token（K = 千，M = 百万，T = Token）。点击工位或下拉选择小组，可查看输入、输出及请求数。
- 暂停/继续、全屏；Esc 关闭详情。
- 所有用量、调用数和角色状态都是模拟数据。页面始终明确标注 Demo。

## 打开与部署

直接打开 `index.html`，或用任意静态服务器托管本目录。无构建步骤、无框架、无 CDN 或在线字体依赖，资源均使用相对路径；可部署到 GitHub Pages 仓库子路径。

GitHub Pages 选择 Deploy from a branch → main → / (root)。`.nojekyll` 已包含。

## 后续接真实数据

目前未连接真实 API，也不包含任何 API Key、账户、个人信息或管理接口凭据。接入时由受控后端保管 API Key 与组号映射，查询已有用量接口，再输出只含 `teamId / displayName / inputTokens / outputTokens / requests / lastActivityAt / updatedAt` 的脱敏数据供页面读取。不要把管理员 Token、各组 API Key 或逐条请求内容放进静态页面、JSON 或公开仓库。

真实角色动作只表达近期 API 活跃状态，不能据此断言某组正在敲代码。需明确累计/本小时统计口径；展示更新失败时保留上次数据并标记过期，不把缺失用量当成 0。

## 美术来源

- 角色：使用 [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) 仓库中的 6 张 PNG 精灵图。固定来源提交及路径见 `assets/characters/SOURCE.txt`；MIT 许可证保留于 `licenses/pixel-agents-MIT.txt`。该项目注明角色基于 [JIK-A-4 的 Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack)。
- 本页使用精灵图的侧向打字/阅读动作；16 × 32 原始帧以整数倍绘制，关闭 Canvas 图像平滑。会场、桌椅、舞台和交互为本 Demo 的实现，并未移植 Pixel Agents 的完整应用。
- 金色星球：复用本活动已有黑金主题素材，转换为本地 WebP。

## 验证

`node --check app.js` 检查语法。浏览器烟测脚本为 `tests/smoke.cjs`，需要本机安装 Chrome 和可供 Node 载入的 `playwright-core`；可通过 `CHROME_PATH`、`PLAYWRIGHT_MODULE` 指定已有安装。运行 `node tests/smoke.cjs`。截图生成在忽略提交的 `qa/` 目录。

已验证：48 个工位、总用量算术、两种布局、点击/下拉选择详情、Esc 关闭、暂停保持数据、恢复更新、1920 × 1080 与 1366 × 768 整体缩放、无浏览器脚本错误。

需要交给其他设计或开发工具时，使用 `DESIGN-PROMPT.md`。

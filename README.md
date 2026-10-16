# EE黑客松 · 像素开发现场

用于现场投影的黑金主题静态 Demo。固定 1920 × 1080 画布，按屏幕整体等比缩放，没有手机端重排。

## 当前效果

- 舞台中央显示正式倒计时：北京时间 2026-10-18 13:00 开场，17:00 结束。开场前倒数至开场，活动中倒数至结束，结束后固定为 00:00:00 并显示活动已结束。时间配置位于 `countdown.js`，含明确 +08:00 时区。
- 时钟按设备当前时间计算，刷新、切换标签页和暂停模拟均不重置倒计时。最后十分钟用更醒目的颜色提示。
- 场景按显示尺寸及设备像素密度渲染；像素角色关闭图像平滑，采用独立整数倍绘制。已移除标题旁发生遮挡的植物和机柜，讲台移至倒计时侧面。

- 前方大屏、讲台、音箱；50 组各一桌、一名像素角色。
- 六套角色原画，错开的动作帧和不同朝向；仅当前请求进行中显示敲码，否则显示休息。
- 五个开放赛道区：科研科创、校园学习生活、社会公益、游戏类、创意整活与数字文娱。名称来自活动项目 track-data.mjs；Demo 每赛道 10 组，归属为演示分配。无会场大外框及行分隔框。
- 组号与累计 Token 放在同一个头顶标签内（K = 千，M = 百万，T = Token）。点击工位或下拉选择小组，可查看精确累计 Token。仅展示 Token，不展示余额、费用、请求次数或其他用量统计。横排行距为 170px，标签和角色有连接线，避免数字归属含糊。
- 暂停/继续、全屏；Esc 关闭详情。
- 所有用量、赛道分组和角色状态都是模拟数据。页面始终明确标注 Demo。

## 打开与部署

直接打开 `index.html`，或用任意静态服务器托管本目录。无构建步骤、无框架、无 CDN 或在线字体依赖，资源均使用相对路径；可部署到 GitHub Pages 仓库子路径。

GitHub Pages 选择 Deploy from a branch → main → / (root)。`.nojekyll` 已包含。

## 后续接真实数据

目前未连接真实 API，也不包含任何 API Key、账户、个人信息或管理接口凭据。接入时由受控后端保管 API Key 与组号映射，查询已有用量接口，再输出只含 `teamId / displayName / trackId / totalTokens / activeRequests / updatedAt` 的脱敏数据供页面读取。不要把管理员 Token、各组 API Key 或逐条请求内容放进静态页面、JSON 或公开仓库。

角色状态必须根据 API 当前正在进行的请求数判断：activeRequests > 0 为敲码，activeRequests = 0 或从未请求为休息。累计 Token、上次请求时间或最近有消耗不能代替当前并发信号。目前 Demo 会模拟请求开始和结束，并在结束时累计 Token、立即恢复休息。正式接入时需核实已有接口是否提供进行中请求数；若不提供，需要服务端增加计数，不能通过历史用量伪造并发。

累计 Token 口径应在后端统一；展示更新失败时保留上次数据并标记过期，不把缺失用量或未知并发当成 0。

## 美术来源

- 角色：使用 [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) 仓库中的 6 张 PNG 精灵图。固定来源提交及路径见 `assets/characters/SOURCE.txt`；MIT 许可证保留于 `licenses/pixel-agents-MIT.txt`。该项目注明角色基于 [JIK-A-4 的 Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack)。
- 本页使用精灵图的侧向打字/阅读动作；16 × 32 原始帧以整数倍绘制，关闭 Canvas 图像平滑。会场、桌椅、舞台和交互为本 Demo 的实现，并未移植 Pixel Agents 的完整应用。
- 金色星球：复用本活动已有黑金主题素材，转换为本地 WebP。

## 验证

`node --check app.js` 检查语法。浏览器烟测脚本为 `tests/smoke.cjs`，需要本机安装 Chrome 和可供 Node 载入的 `playwright-core`；可通过 `CHROME_PATH`、`PLAYWRIGHT_MODULE` 指定已有安装。运行 `node tests/smoke.cjs`。截图生成在忽略提交的 `qa/` 目录。

已验证：50 个工位、五赛道各 10 组、Token 合计、全部 50 个标签的点击归属、无工位碰撞、下拉选择详情、Esc 关闭、暂停保持数据、恢复更新、1920 × 1080 与 1366 × 768 整体缩放、请求结束转休息、全屏、直接打开 HTML、无浏览器脚本错误。

需要交给其他设计或开发工具时，使用 `DESIGN-PROMPT.md`。

倒计时边界测试：`node tests/countdown.cjs`。浏览器时间切换和 2x 高分屏检查：`node tests/display.cjs`，依赖配置与烟测一致。日期显示使用北京时间，设备系统时钟应保持准确；Token 与分组仍为模拟数据，活动时间为正式配置。

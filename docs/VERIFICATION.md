# 验证记录

验证日期：2026-10-25 · 宿主：DeepSeek Harness `0.2.1-rc.3`（macOS arm64）

## 结论

- **39 / 39 hard assertions 通过**，8 / 9 soft checks 通过（1 项为 harness 元检查的预期 WARN）。
- **0 个浏览器 console error，0 个未捕获 page error。**
- 首次加载自动启用、白纸/黑板切换、设置行、390px 移动端、切回出厂外观均验证通过。
- 额外回归：重载后主题恢复、点内置「深色」后不再被抢回、在通用设置里改字号触发 Host adopt 后主题仍保持（见下文「回归」）。

## 环境与隔离

| 项 | 值 |
| --- | --- |
| DSH_HOME | `/tmp/dsh-theme-qa/home`（独立，未触碰桌面端 `~/.dsh`） |
| profile | `web` |
| 服务 | 独立端口 `dsh --profile web --port 0 --no-open` |
| 浏览器 | 系统 Chrome，headless，Playwright `playwright-core` |
| 插件安装方式 | `dsh plugin --profile web add <本地目录>`（`link:` 依赖） |

## 覆盖的断言

1. `?token=` 鉴权后 app shell 正常加载。
2. Settings → 通用 中找到插件主题行；三个卡片按文案正确分类（出厂 / 白纸 / 黑板）。
3. 点「出厂外观」：`body[data-dsh-neo-brutalist]` 被移除，背景/token 恢复基线。
4. 点「白纸 BRUTAL」：
   - `body[data-dsh-neo-brutalist="paper"]`；
   - `[data-composer-card]` 计算样式 `border-radius: 0px`、`box-shadow: rgb(0,0,0) 8px 8px 0px 0px`、背景 `rgb(255,255,255)`；
   - 页面背景 `rgb(255,255,255)`；
   - 卡片 `aria-pressed=true`；截图与基线像素差异 49.5%。
5. 点「黑板 BRUTAL」：
   - `body[data-dsh-neo-brutalist="ink"]` + `data-ds-dark-theme`；
   - 输入区硬阴影变为 `rgb(204,255,0) 8px 8px 0px 0px`；
   - 页面背景 `rgb(0,0,0)`；截图与亮色版差异 98.5%。
6. 390×844 移动端渲染正常、截图非空。
7. 切回出厂：标记移除、背景恢复、与基线像素差异 0.148%（≤1%），界面完全回退。
8. 全流程无 console error / pageerror。

## 截图

- [首次安装自动启用](screenshots/01-first-load.png)
- [白纸版外壳](screenshots/02-light-shell.png) / [黑板版外壳](screenshots/03-dark-shell.png)
- [白纸版设置行](screenshots/04-light-settings.png) / [黑板版设置行](screenshots/05-dark-settings.png)
- [390px 移动端](screenshots/06-dark-mobile.png)

## 回归（修复 Host adopt 丢主题后）

背景：DSH 的第三方主题 `setTheme(id)` 只写内存，而 Host 每次写设置区间（例如改字号）都会 `adopt()` durable 的内置 appearance，导致插件主题被静默回退。`client.js` 现在在 `theme/change` 回落且 localStorage 仍记录插件选择时，用一个 generation/silent 守卫静默重放 `setTheme`；用户点内置外观则先把选择写成 `default`，不会被抢回。

浏览器实测（同一套隔离环境，系统 Chrome + Playwright）：

| 场景 | 结果 |
| --- | --- |
| `/tmp/nb-adopt-final.mjs`：选中白纸 → 设置里点「增大字号」(15px→16px，触发 Host adopt) → 等 1.2s | 6/6 通过：marker 仍为 `paper`、localStorage 仍为 `neo-brutalist-paper`、无报错 |
| `/tmp/nb-adopt-test2.mjs`：重载恢复 + 点内置深色退出 + 再重载 | 12/13 通过（唯一失败是脚本找不到字号控件的选择器，非插件问题）；重载保持 paper、点深色后 marker 移除、重载后保持内置深色 |
| `npm test` | 11/11 通过，新增 `test/runtime.test.mjs` 覆盖首次自动套用、重载恢复、Host adopt 静默恢复、内置外观退出、卸载清理、reduced-motion |

原始断言明细：[verification-summary.json](verification-summary.json)

## 静态校验

```sh
npm test
```

覆盖：两套主题 id/明暗、80+ token 的完整性与成对覆盖、颜色可解析、正文/链接/按钮 WCAG 对比度、CSS 按 body 标记门控、无哈希类名/外链资源、注入契约。

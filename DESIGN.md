# Neo-Brutalist 设计系统

参考 [StyleKit — Neo-Brutalist](https://www.stylekit.top/styles/neo-brutalist/showcase)。核心原则：**结构可见、功能优先、对比最大化、拒绝装饰**。本主题把它翻译成 DSH 的设计 token 与稳定 DOM hook，不改对话正文的排版。

## 方向

> Loud edge, calm center. 外壳大声，阅读区安静。

- **外壳**（侧栏、输入区、弹层、工具卡、Goal 条、待办面板、代码块）承担全部表现力：4px 硬边、8px 无模糊偏移阴影、零圆角、荧光信号色。
- **阅读区**（Markdown 正文、字号、行宽、代码字号、滚动几何）保持 DSH 原样：只换颜色，不换排版。
- 不做渐变、不做柔和投影、不做淡入淡出、不加载外部字体/图片/音频。

## 配色

| 角色 | 值 | 用途 |
| --- | --- | --- |
| Ink | `#000000` | 结构描边、正文、硬阴影（白纸版） |
| Paper | `#ffffff` | 画布、卡片、弹层（白纸版） |
| Acid Green | `#ccff00` | 主色：主按钮、选中态、hover 硬切、警示斜纹 |
| Hot Pink | `#ff006e` | 事件色：焦点环、聚焦阴影、错误/删除、滚动条 hover |
| Electric Blue | `#00d9ff` | 信息色：链接高亮、运行中状态、附件 |
| Vivid Orange | `#ff9500` | 警示色：warn 状态、提示 |
| Link (light) | `#006b85` | 电蓝压暗后的可读链接色（白底对比度 ≥ 4.5:1） |
| Link (dark) | `#66e6ff` | 黑底上的电蓝链接 |

黑板版把结构色反转：画布 `#000000`、描边 `#ffffff`、硬阴影 `#ccff00`，信号色保持不变。功能灰阶只用于 `layer-2/3` 的层级区分，不进入品牌表达。

所有颜色只通过 DSH 真实存在的 `--dsw-alias-*` / `--dsw-specific-*` / `--dsw-focus-ring-*` token 覆盖，经 `ctx.theme.register()` 注册，由官方 presenter 写到 `body` 上。

## 字体与排版

- 不替换 DSH 的字体栈（避免中文回退和阅读习惯变化）。
- 标题加重：会话内 `h1–h4` 统一 `font-weight: 900`、`letter-spacing: -0.01em`，让结构标题承担「粗野」记忆点。
- 警示斜纹与等宽大写标签只出现在插件自己的设置行/装饰层，不进入正文。

## 结构

| 尺寸 | 值 |
| --- | --- |
| 结构描边 | 4px（弹层、输入区、侧栏）；2px（代码块、工具卡、按钮） |
| 硬阴影 | 8px（输入区）、12px（弹层）、5px（Goal/待办）、4px（工具卡）、3px（发送键/设置卡片） |
| 圆角 | 0（按钮、输入、弹层、卡片） |
| 过渡 | `150ms ease-out`；`prefers-reduced-motion` 下 0.001ms |

### 稳定选择器

只使用 DSH 的语义 hook：

- `[data-composer-card]`、`[data-composer-input]`
- `[data-conversation-region="chat"|"composer"]`、`[data-slot="conversation.chat.flow"]`
- `[data-slot="sidebar"] > div`（`data-slot` 是 `display:contents` 槽位，真正的侧栏盒子是子元素）
- `[data-tool][data-state]`、`[data-goal-bar]`、`[data-queue-dock]`、`[data-testid="todo-panel"]`、`[data-code-wrap]`
- `[role="dialog"|"menu"|"listbox"]`
- `button[aria-label="发送消息"]`

刻意不使用的：`PIRFFq_*`、`kB3qhq_*` 等 CSS-module 哈希类名。

## 签名元素

1. **警示斜纹带**：侧栏顶部与输入区顶部的 45° 酸绿/黑斜纹（黑板版为酸绿/白），只做 6px 高，不抢内容。
2. **物理压碎**：发送键 hover 时阴影抬起，`:active` 时向右下位移 3px 并压平阴影；输入区聚焦时 8px 阴影从黑切到荧光粉。
3. **零圆角硬卡片**：设置行里的主题卡与弹层一样，靠黑边 + 偏移阴影建立层级。

## 动效

- 只做交互反馈，不做入场动画/粒子/流光。
- `150ms ease-out` 完成颜色、阴影、位移的切换；符合「brutal snap」而不是弹簧回弹。
- 遵循 `prefers-reduced-motion: reduce`：只把本主题的 transition 压到瞬时，不覆盖 animation，避免把加载/输入中的无限动画一起冻住。

## 可访问性

- 正文/次要文字/链接/主按钮的 WCAG 对比度在 `test/theme.test.mjs` 中自动校验。
- 键盘焦点统一 3px 荧光粉描边，偏移 3px。
- 不改变点击区域尺寸；`box-shadow` 不参与布局，不会造成内容位移。

## 边界

- 不覆盖聊天气泡、Markdown 根节点、工具卡内部等哈希类名结构。
- 不强制把头像/状态点改成方形（保留身份与状态的可识别性）。
- 不写死颜色到组件内联样式（设置行预览除外，预览需要在不启用的状态下也能显示两种配色）。

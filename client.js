// dsh-theme-neo-brutalist — browser half.
//
// 两套可切换的新粗野主义主题（白纸 / 黑板），全部效果通过 DSH 官方主题服务注册：
//   - 颜色：ctx.theme.register({ id, colorScheme, tokens })，只覆盖真实存在的
//     --dsw-alias-* 语义 token，由 ui-layout 的 presenter 写到 body 上。
//   - 结构：插件自己持有一张以 body[data-dsh-neo-brutalist] 门控的样式表，
//     只改外壳（侧栏 / 输入区 / 弹层 / 工具卡 / Goal 条），对话正文保持安静。
//   - 设置：向 settings.general.item 槽注册一行三选一卡片。
//   - 生命周期：卸载 / 热禁用时移除样式、标记、监听和主题注册，界面恢复原样。
//
// 无外部字体、图片、网络请求；不依赖 CSS-module 哈希类名。
window.__ModuleLoader__.load({
  id: 'dsh-theme-neo-brutalist',
  factory: (require) => {
    const module = { exports: {} }
    const React = require('react')
    const runtime = require('@deepseek-ai/dsh-client-store')

    const PACKAGE = 'dsh-theme-neo-brutalist'
    const SETTINGS_NS = 'settings.neo-brutalist'
    const STORAGE_KEY = 'dsh-theme-neo-brutalist.preference'
    const STYLE_ID = 'dsh-theme-neo-brutalist/styles'
    const BODY_ATTR = 'data-dsh-neo-brutalist'
    const DEFAULT_CHOICE = 'default'

    const PAPER_ID = 'neo-brutalist-paper'
    const INK_ID = 'neo-brutalist-ink'

    // ---------------------------------------------------------------------
    // 设计 token。参考 StyleKit 的 neo-brutalist 规范：
    // 纯黑/纯白做结构，酸绿 #ccff00、荧光粉 #ff006e、电蓝 #00d9ff、橙 #ff9500
    // 做信号色；结构靠 4px 黑边和 8px 无模糊偏移阴影，不靠渐变和模糊。
    // 链接色在电蓝基础上压暗到 #006b85，保证白底上的 WCAG 对比度。
    // ---------------------------------------------------------------------
    const PAPER = {
      '--dsw-alias-bg-base': '#ffffff',
      '--dsw-alias-bg-layer-1': '#ffffff',
      '--dsw-alias-bg-layer-2': '#f2f2f2',
      '--dsw-alias-bg-layer-3': '#e3e3e3',
      '--dsw-alias-bg-overlay': '#ffffff',
      '--dsw-alias-bg-module-platform': '#f2f2f2',
      '--dsw-alias-bg-multi-select': '#ccff00',
      '--dsw-alias-bg-skeleton': 'rgba(0,0,0,.08)',
      '--dsw-alias-bg-document-preview': '#f2f2f2',
      '--dsw-alias-label-document-preview': '#3a3a3a',
      '--dsw-alias-border-l1': '#000000',
      '--dsw-alias-border-l2-darkmode-thin': '#000000',
      '--dsw-alias-border-l2': '#000000',
      '--dsw-alias-border-l3': '#000000',
      '--dsw-alias-border-l4': '#000000',
      '--dsw-alias-border-inverted': '#000000',
      '--dsw-alias-border-inverted2': '#000000',
      '--dsw-alias-brand-primary': '#ccff00',
      '--dsw-alias-brand-primary-invert': '#000000',
      '--dsw-alias-brand-text': '#000000',
      '--dsw-alias-button-primary-fill': '#ccff00',
      '--dsw-alias-button-primary-hover': '#b3e600',
      '--dsw-alias-button-primary-dimmed': '#e6ff99',
      '--dsw-alias-button-info-fill': '#00d9ff',
      '--dsw-alias-button-info-hover': '#66e7ff',
      '--dsw-alias-button-elevated-fill': '#ffffff',
      '--dsw-alias-button-floating-fill': '#ffffff',
      '--dsw-alias-button-floating-hover': '#f2f2f2',
      '--dsw-alias-button-ghost-active-border': '#000000',
      '--dsw-alias-button-ghost-active-fill': '#ccff00',
      '--dsw-alias-button-ghost-active-hover': '#b3e600',
      '--dsw-alias-button-contrast-fill': '#000000',
      '--dsw-alias-interactive-bg-active': '#ccff00',
      '--dsw-alias-interactive-bg-hover-accent': '#d9f8ff',
      '--dsw-alias-interactive-bg-hover-danger': '#ffe0ea',
      '--dsw-alias-interactive-bg-hover-solid': '#000000',
      '--dsw-alias-interactive-bg-hover': '#f2f2f2',
      '--dsw-alias-label-primary': '#000000',
      '--dsw-alias-label-primary-bluish': '#000000',
      '--dsw-alias-label-primary-dimmed': '#1a1a1a',
      '--dsw-alias-label-primary-foreground': '#000000',
      '--dsw-alias-label-primary-inverted': '#ffffff',
      '--dsw-alias-label-secondary': '#3a3a3a',
      '--dsw-alias-label-tertiary': '#5c5c5c',
      '--dsw-alias-label-caption': '#5c5c5c',
      '--dsw-alias-label-dimmed': '#8a8a8a',
      '--dsw-alias-label-shimmer': 'rgba(0,0,0,.3)',
      '--dsw-alias-link': '#006b85',
      '--dsw-alias-menu-icon': '#000000',
      '--dsw-alias-markdown-code-block': '#f5f5f5',
      '--dsw-alias-markdown-code-block-banner': '#e3e3e3',
      '--dsw-alias-markdown-inline-code': '#ccff00',
      '--dsw-alias-markdown-placeholder': '#f2f2f2',
      '--dsw-alias-markdown-tag': '#ff006e',
      '--dsw-alias-markdown-citation': '#f2f2f2',
      '--dsw-alias-scrollbar-bg-l1': '#b3b3b3',
      '--dsw-alias-scrollbar-bg-l2': '#000000',
      '--dsw-alias-scrollbar-hover-l1': '#ff006e',
      '--dsw-alias-scrollbar-hover-l2': '#ccff00',
      '--dsw-alias-state-business-primary': '#006b85',
      '--dsw-alias-state-business-tertiary': '#d9f8ff',
      '--dsw-alias-state-idle-primary': '#b3b3b3',
      '--dsw-alias-state-success-primary': '#0a7d3c',
      '--dsw-alias-state-success-secondary': '#0f9e4e',
      '--dsw-alias-state-success-tertiary': '#d9f7e5',
      '--dsw-alias-state-warn-label': '#8a4a00',
      '--dsw-alias-state-warn-primary': '#ff9500',
      '--dsw-alias-state-warn-secondary': '#ffb340',
      '--dsw-alias-state-warn-tertiary': '#fff0d9',
      '--dsw-alias-state-error-primary': '#d1003f',
      '--dsw-alias-state-error-secondary': '#ff006e',
      '--dsw-alias-code-diff-added': '#0a7d3c1a',
      '--dsw-alias-code-diff-deleted': '#d1003f1a',
      '--dsw-alias-toast-bg': '#000000',
      '--dsw-alias-toast-label': '#ffffff',
      '--dsw-alias-tooltip-bg': '#000000',
      '--dsw-alias-tooltip-key-bg': '#333333',
      '--dsw-alias-switch-thumb': '#ffffff',
      '--dsw-alias-turn-trigger-bg': '#fff9cc',
      '--dsw-alias-turn-trigger-bg-hover': '#ccff00',
      '--dsw-focus-ring-color': '#ff006e',
      '--dsw-focus-ring-width': '3px',
      '--dsw-specific-bubble': '#ffffff',
      '--dsw-specific-bubble-highlight': '#f2f2f2',
      '--dsw-specific-input-major': '#ffffff',
      '--dsw-specific-login-input': '#ffffff',
      '--dsw-specific-menu': '#ffffff',
      '--dsw-specific-selector': '#ffffff',
      '--dsw-specific-sidebar-fill': '#f7f7f7',
      '--dsw-specific-sidebar-nav-item-active-accent': '#ccff00',
      '--dsw-specific-sidebar-nav-item-active': '#ccff00',
      '--dsw-specific-sidebar-nav-item-hover': '#e3e3e3',
      '--dsw-specific-tip': '#fff3cc',
      '--dsw-elevation-stroke-color': '#000000'
    }

    const INK = {
      '--dsw-alias-bg-base': '#000000',
      '--dsw-alias-bg-layer-1': '#0a0a0a',
      '--dsw-alias-bg-layer-2': '#141414',
      '--dsw-alias-bg-layer-3': '#1f1f1f',
      '--dsw-alias-bg-overlay': '#0a0a0a',
      '--dsw-alias-bg-module-platform': '#050505',
      '--dsw-alias-bg-multi-select': '#ccff00',
      '--dsw-alias-bg-skeleton': 'rgba(255,255,255,.1)',
      '--dsw-alias-bg-document-preview': '#141414',
      '--dsw-alias-label-document-preview': '#e0e0e0',
      '--dsw-alias-border-l1': 'rgba(255,255,255,.35)',
      '--dsw-alias-border-l2-darkmode-thin': 'rgba(255,255,255,.5)',
      '--dsw-alias-border-l2': '#ffffff',
      '--dsw-alias-border-l3': '#ffffff',
      '--dsw-alias-border-l4': '#ffffff',
      '--dsw-alias-border-inverted': '#000000',
      '--dsw-alias-border-inverted2': '#000000',
      '--dsw-alias-brand-primary': '#ccff00',
      '--dsw-alias-brand-primary-invert': '#000000',
      '--dsw-alias-brand-text': '#ccff00',
      '--dsw-alias-button-primary-fill': '#ccff00',
      '--dsw-alias-button-primary-hover': '#e5ff66',
      '--dsw-alias-button-primary-dimmed': '#3d4d00',
      '--dsw-alias-button-info-fill': '#00d9ff',
      '--dsw-alias-button-info-hover': '#66e7ff',
      '--dsw-alias-button-elevated-fill': '#141414',
      '--dsw-alias-button-floating-fill': '#141414',
      '--dsw-alias-button-floating-hover': '#1f1f1f',
      '--dsw-alias-button-ghost-active-border': '#ffffff',
      '--dsw-alias-button-ghost-active-fill': '#1f1f1f',
      '--dsw-alias-button-ghost-active-hover': '#2b2b2b',
      '--dsw-alias-button-contrast-fill': '#ffffff',
      '--dsw-alias-interactive-bg-active': '#ccff00',
      '--dsw-alias-interactive-bg-hover-accent': '#003d4d',
      '--dsw-alias-interactive-bg-hover-danger': '#4d001f',
      '--dsw-alias-interactive-bg-hover-solid': '#1f1f1f',
      '--dsw-alias-interactive-bg-hover': '#1f1f1f',
      '--dsw-alias-label-primary': '#ffffff',
      '--dsw-alias-label-primary-bluish': '#ffffff',
      '--dsw-alias-label-primary-dimmed': '#f2f2f2',
      '--dsw-alias-label-primary-foreground': '#000000',
      '--dsw-alias-label-primary-inverted': '#000000',
      '--dsw-alias-label-secondary': '#e0e0e0',
      '--dsw-alias-label-tertiary': '#b3b3b3',
      '--dsw-alias-label-caption': '#b3b3b3',
      '--dsw-alias-label-dimmed': '#808080',
      '--dsw-alias-label-shimmer': 'rgba(255,255,255,.45)',
      '--dsw-alias-link': '#66e6ff',
      '--dsw-alias-menu-icon': '#ffffff',
      '--dsw-alias-markdown-code-block': '#0a0a0a',
      '--dsw-alias-markdown-code-block-banner': '#141414',
      '--dsw-alias-markdown-inline-code': '#ccff00',
      '--dsw-alias-markdown-placeholder': '#141414',
      '--dsw-alias-markdown-tag': '#ff006e',
      '--dsw-alias-markdown-citation': '#141414',
      '--dsw-alias-scrollbar-bg-l1': '#3a3a3a',
      '--dsw-alias-scrollbar-bg-l2': '#ffffff',
      '--dsw-alias-scrollbar-hover-l1': '#ff4d8d',
      '--dsw-alias-scrollbar-hover-l2': '#ccff00',
      '--dsw-alias-state-business-primary': '#00d9ff',
      '--dsw-alias-state-business-tertiary': '#003d4d',
      '--dsw-alias-state-idle-primary': '#4d4d4d',
      '--dsw-alias-state-success-primary': '#3ddc84',
      '--dsw-alias-state-success-secondary': '#6be3a0',
      '--dsw-alias-state-success-tertiary': '#0b3d24',
      '--dsw-alias-state-warn-label': '#ffb340',
      '--dsw-alias-state-warn-primary': '#ff9500',
      '--dsw-alias-state-warn-secondary': '#ffb340',
      '--dsw-alias-state-warn-tertiary': '#4d2b00',
      '--dsw-alias-state-error-primary': '#ff4d8d',
      '--dsw-alias-state-error-secondary': '#ff80ad',
      '--dsw-alias-code-diff-added': '#3ddc841a',
      '--dsw-alias-code-diff-deleted': '#ff4d8d1a',
      '--dsw-alias-toast-bg': '#ccff00',
      '--dsw-alias-toast-label': '#000000',
      '--dsw-alias-tooltip-bg': '#1f1f1f',
      '--dsw-alias-tooltip-key-bg': '#3a3a3a',
      '--dsw-alias-switch-thumb': '#ccff00',
      '--dsw-alias-turn-trigger-bg': '#1f1f1f',
      '--dsw-alias-turn-trigger-bg-hover': '#2b2b2b',
      '--dsw-focus-ring-color': '#ff4d8d',
      '--dsw-focus-ring-width': '3px',
      '--dsw-specific-bubble': '#0a0a0a',
      '--dsw-specific-bubble-highlight': '#1f1f1f',
      '--dsw-specific-input-major': '#000000',
      '--dsw-specific-login-input': '#0a0a0a',
      '--dsw-specific-menu': '#0a0a0a',
      '--dsw-specific-selector': '#0a0a0a',
      '--dsw-specific-sidebar-fill': '#050505',
      '--dsw-specific-sidebar-nav-item-active-accent': '#ccff00',
      '--dsw-specific-sidebar-nav-item-active': '#ccff00',
      '--dsw-specific-sidebar-nav-item-hover': '#1f1f1f',
      '--dsw-specific-tip': '#141414',
      '--dsw-elevation-stroke-color': '#ffffff'
    }

    const THEMES = [
      { id: PAPER_ID, colorScheme: 'light', tokens: PAPER },
      { id: INK_ID, colorScheme: 'dark', tokens: INK }
    ]
    const THEME_IDS = new Set(THEMES.map((theme) => theme.id))
    const SCHEME_OF = new Map(THEMES.map((theme) => [theme.id, theme.colorScheme]))

    // ---------------------------------------------------------------------
    // 文案
    // ---------------------------------------------------------------------
    const zh = {
      title: 'Neo-Brutalist 主题',
      caption: '硬边、硬阴影、零圆角：酸绿 / 荧光粉 / 电蓝信号色，阅读区保持安静。',
      default: '出厂外观',
      'default-hint': '恢复 DSH 内置主题',
      'neo-brutalist-paper': '白纸 BRUTAL',
      'neo-brutalist-paper-hint': '纯白底 · 黑框 · 酸绿主色',
      'neo-brutalist-ink': '黑板 BRUTAL',
      'neo-brutalist-ink-hint': '纯黑底 · 白框 · 荧光信号',
      auto: '选择即时生效；可随时切回出厂外观。'
    }
    const en = {
      title: 'Neo-Brutalist theme',
      caption: 'Hard edges, hard shadows, zero rounding: acid green / hot pink / electric blue signals over a calm reading plane.',
      default: 'Factory appearance',
      'default-hint': 'Restore the built-in DSH theme',
      'neo-brutalist-paper': 'Paper BRUTAL',
      'neo-brutalist-paper-hint': 'White canvas · black rules · acid primary',
      'neo-brutalist-ink': 'Blackboard BRUTAL',
      'neo-brutalist-ink-hint': 'Black canvas · white rules · neon signals',
      auto: 'Changes apply instantly. Switch back to the factory appearance any time.'
    }

    // ---------------------------------------------------------------------
    // 偏好存储。第三方主题 id 不进 DSH 内置设置 schema，所以额外记一份
    // localStorage：重载后 Host 会先回落内置偏好，这里再把它恢复回来。
    // 'default' 表示用户明确选择过出厂外观，下次加载不再自动套用主题。
    // ---------------------------------------------------------------------
    const readChoice = () => {
      try {
        const value = window.localStorage.getItem(STORAGE_KEY)
        return value === null ? null : value
      } catch (_) {
        return null
      }
    }
    const writeChoice = (value) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, value)
      } catch (_) {}
    }
    const clearChoice = () => {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch (_) {}
    }

    // 用户点内置「浅色 / 深色 / 跟随系统」时，放弃本主题的恢复记录，
    // 避免刷新后插件又把用户手动选的内置外观抢回去。
    const isBuiltinAppearanceChoice = (target) => {
      const button = target && target.closest ? target.closest('button') : null
      if (!button) return false
      if (button.hasAttribute('data-nb-choice')) return false
      const label = (button.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()
      return ['浅色', '深色', '跟随系统', 'light', 'dark', 'system', 'follow system'].includes(label)
    }

    // ---------------------------------------------------------------------
    // 结构样式。只改外壳，不改对话正文的排版/字号/行宽；所有规则都以
    // body[data-dsh-neo-brutalist] 门控，未启用主题时这段 CSS 不产生任何效果。
    // 选择器只使用 DSH 稳定的语义 hook（data-* / role），不使用 CSS-module 哈希。
    // ---------------------------------------------------------------------
    const CSS = [
      'body[data-dsh-neo-brutalist] {',
      '  --nb-line: #000000;',
      '  --nb-shadow: #000000;',
      '  --nb-paper: #ffffff;',
      '  --nb-acid: #ccff00;',
      '  --nb-pink: #ff006e;',
      '  --nb-blue: #00d9ff;',
      '  --nb-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;',
      '  background-color: var(--dsw-alias-bg-base);',
      '}',
      'body[data-dsh-neo-brutalist="ink"] {',
      '  --nb-line: #ffffff;',
      '  --nb-shadow: #ccff00;',
      '  --nb-paper: #000000;',
      '}',
      '',
      '/* 签名元素 1：侧栏右侧 4px 硬边 + 顶部 45° 酸绿/黑警示斜纹。',
      '   [data-slot="sidebar"] 是 display:contents 的槽位，真正的侧栏盒子是它的子元素。 */',
      'body[data-dsh-neo-brutalist] [data-slot="sidebar"] > div {',
      '  border-inline-end: 4px solid var(--nb-line);',
      '  background-color: var(--dsw-specific-sidebar-fill);',
      '  background-image: repeating-linear-gradient(45deg, var(--nb-acid) 0 8px, var(--nb-line) 8px 16px);',
      '  background-size: 100% 6px;',
      '  background-repeat: no-repeat;',
      '  background-position: top;',
      '}',
      '',
      '/* 签名元素 2：输入区 4px 黑边 + 8px 硬阴影 + 顶部警示斜纹；聚焦时阴影变荧光粉 */',
      'body[data-dsh-neo-brutalist] [data-composer-card] {',
      '  border: 4px solid var(--nb-line) !important;',
      '  border-radius: 0 !important;',
      '  box-shadow: 8px 8px 0 0 var(--nb-shadow) !important;',
      '  background-image: repeating-linear-gradient(45deg, var(--nb-acid) 0 8px, var(--nb-line) 8px 16px);',
      '  background-size: 100% 6px;',
      '  background-repeat: no-repeat;',
      '  background-position: top;',
      '  transition: box-shadow 150ms ease-out, border-color 150ms ease-out, transform 150ms ease-out;',
      '}',
      'body[data-dsh-neo-brutalist] [data-composer-card]:focus-within {',
      '  border-color: var(--nb-pink) !important;',
      '  box-shadow: 8px 8px 0 0 var(--nb-pink) !important;',
      '}',
      '@media (hover: hover) {',
      '  body[data-dsh-neo-brutalist] [data-composer-card]:hover { box-shadow: 12px 12px 0 0 var(--nb-shadow) !important; }',
      '  body[data-dsh-neo-brutalist] [data-composer-card]:focus-within:hover { box-shadow: 12px 12px 0 0 var(--nb-pink) !important; }',
      '}',
      '',
      '/* 零圆角：按钮 / 输入 / 弹层这类交互表面 */',
      'body[data-dsh-neo-brutalist] button,',
      'body[data-dsh-neo-brutalist] [role="button"],',
      'body[data-dsh-neo-brutalist] input,',
      'body[data-dsh-neo-brutalist] textarea,',
      'body[data-dsh-neo-brutalist] select,',
      'body[data-dsh-neo-brutalist] [role="dialog"],',
      'body[data-dsh-neo-brutalist] [role="menu"],',
      'body[data-dsh-neo-brutalist] [role="listbox"] { border-radius: 0 !important; }',
      '',
      '/* 弹层：硬边 + 大偏移阴影 */',
      'body[data-dsh-neo-brutalist] [role="dialog"] {',
      '  border: 4px solid var(--nb-line) !important;',
      '  box-shadow: 12px 12px 0 0 var(--nb-shadow) !important;',
      '}',
      'body[data-dsh-neo-brutalist] [role="menu"],',
      'body[data-dsh-neo-brutalist] [role="listbox"] {',
      '  border: 3px solid var(--nb-line) !important;',
      '  box-shadow: 8px 8px 0 0 var(--nb-shadow) !important;',
      '}',
      '',
      '/* 工具卡 / 排队条 / Goal 条：语义左边栏 + 硬阴影 */',
      'body[data-dsh-neo-brutalist] [data-tool],',
      'body[data-dsh-neo-brutalist] [data-variant="think"] {',
      '  border: 2px solid var(--nb-line) !important;',
      '  border-inline-start-width: 8px !important;',
      '  border-inline-start-color: var(--nb-acid) !important;',
      '  border-radius: 0 !important;',
      '  box-shadow: 4px 4px 0 0 var(--nb-shadow) !important;',
      '}',
      'body[data-dsh-neo-brutalist] [data-tool][data-state="ok"] { border-inline-start-color: var(--dsw-alias-state-success-primary) !important; }',
      'body[data-dsh-neo-brutalist] [data-tool][data-state="error"] { border-inline-start-color: var(--nb-pink) !important; }',
      'body[data-dsh-neo-brutalist] [data-tool][data-state="running"],',
      'body[data-dsh-neo-brutalist] [data-tool][data-state="ongoing"] { border-inline-start-color: var(--nb-blue) !important; }',
      'body[data-dsh-neo-brutalist] [data-queue-dock] > * {',
      '  border: 3px solid var(--nb-line) !important;',
      '  border-radius: 0 !important;',
      '  box-shadow: 4px 4px 0 0 var(--nb-shadow) !important;',
      '}',
      'body[data-dsh-neo-brutalist] [data-goal-bar] > * {',
      '  border: 3px solid var(--nb-line) !important;',
      '  border-radius: 0 !important;',
      '  box-shadow: 5px 5px 0 0 var(--nb-shadow) !important;',
      '  background: var(--nb-acid) !important;',
      '  color: #000000 !important;',
      '}',
      'body[data-dsh-neo-brutalist] [data-goal-bar] > * * { color: #000000 !important; }',
      '',
      '/* 会话正文：保持安静，只给代码块和表格加硬边；',
      '   [data-code-wrap] 就是 .md-code-block 本体，内层 pre 不再叠第二道边框 */',
      'body[data-dsh-neo-brutalist] [data-code-wrap] {',
      '  border: 2px solid var(--nb-line) !important;',
      '  border-radius: 0 !important;',
      '  box-shadow: none !important;',
      '}',
      'body[data-dsh-neo-brutalist] [data-code-wrap] pre {',
      '  border: 0 !important;',
      '  border-radius: 0 !important;',
      '  box-shadow: none !important;',
      '}',
      'body[data-dsh-neo-brutalist] [data-conversation-region="chat"] h1,',
      'body[data-dsh-neo-brutalist] [data-conversation-region="chat"] h2,',
      'body[data-dsh-neo-brutalist] [data-conversation-region="chat"] h3,',
      'body[data-dsh-neo-brutalist] [data-conversation-region="chat"] h4 { font-weight: 900 !important; letter-spacing: -0.01em; }',
      'body[data-dsh-neo-brutalist] [data-testid="todo-panel"] {',
      '  border: 3px solid var(--nb-line) !important;',
      '  border-radius: 0 !important;',
      '  box-shadow: 5px 5px 0 0 var(--nb-shadow) !important;',
      '}',
      '',
      '/* 签名元素 3：发送键的物理压碎（hover 抬起，按下位移并压平阴影） */',
      'body[data-dsh-neo-brutalist] button[aria-label="发送消息"],',
      'body[data-dsh-neo-brutalist] button[aria-label="Send message"] {',
      '  border: 2px solid var(--nb-line) !important;',
      '  border-radius: 0 !important;',
      '  box-shadow: 3px 3px 0 0 var(--nb-shadow) !important;',
      '  transition: transform 150ms ease-out, box-shadow 150ms ease-out;',
      '}',
      'body[data-dsh-neo-brutalist] button[aria-label="发送消息"]:active:not(:disabled),',
      'body[data-dsh-neo-brutalist] button[aria-label="Send message"]:active:not(:disabled) {',
      '  transform: translate(3px, 3px) !important;',
      '  box-shadow: none !important;',
      '}',
      '',
      '/* 侧栏导航：hover 硬切酸绿内描边 */',
      '@media (hover: hover) {',
      '  body[data-dsh-neo-brutalist] [data-slot="sidebar"] nav button:hover:not(:disabled) {',
      '    background-color: var(--nb-acid) !important;',
      '    color: #000000 !important;',
      '    box-shadow: inset 0 0 0 2px var(--nb-line);',
      '  }',
      '}',
      '',
      '/* 键盘焦点：3px 荧光粉硬边 */',
      'body[data-dsh-neo-brutalist] :focus-visible {',
      '  outline: 3px solid var(--nb-pink) !important;',
      '  outline-offset: 3px !important;',
      '}',
      '',
      '/* 侧栏导航项：hover 硬切酸绿 + 内描边，不做淡入 */',
      '@media (hover: hover) {',
      '  body[data-dsh-neo-brutalist] [data-slot="sidebar"] [aria-current="page"]:hover,',
      '  body[data-dsh-neo-brutalist] [data-slot="sidebar"] [data-active="true"]:hover { background-color: var(--nb-acid) !important; color: #000000 !important; box-shadow: inset 0 0 0 2px var(--nb-line); }',
      '}',
      '',
      '/* reduced motion：只压缩本主题的过渡，不覆盖 animation，',
      '   否则会把加载/输入中的无限动画一起冻住。 */',
      '@media (prefers-reduced-motion: reduce) {',
      '  body[data-dsh-neo-brutalist] *,',
      '  body[data-dsh-neo-brutalist] *::before,',
      '  body[data-dsh-neo-brutalist] *::after { transition-duration: 0.001ms !important; scroll-behavior: auto !important; }',
      '}',
      '',
      '/* 小屏：收窄硬阴影与描边，避免弹层阴影被视口裁切 */',
      '@media (max-width: 760px) {',
      '  body[data-dsh-neo-brutalist] [role="dialog"] { border-width: 3px !important; box-shadow: 6px 6px 0 0 var(--nb-shadow) !important; }',
      '  body[data-dsh-neo-brutalist] [data-composer-card] { box-shadow: 6px 6px 0 0 var(--nb-shadow) !important; }',
      '}'
    ].join('\n')

    // ---------------------------------------------------------------------
    // 设置行
    // ---------------------------------------------------------------------
    const createStore = () => runtime.defineStore({
      init: () => ({ choice: DEFAULT_CHOICE, revision: -1 }),
      actions: {
        sync: (draft, choice, revision) => {
          if (revision > draft.revision) {
            draft.choice = choice
            draft.revision = revision
          }
        }
      }
    })

    const rowStyle = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '16px 0',
        borderBottom: '2px solid var(--dsw-alias-border-l2)'
      },
      title: { color: 'var(--dsw-alias-label-primary)', fontSize: 14, fontWeight: 800 },
      caption: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' },
      choices: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 2 },
      button: {
        width: 156,
        padding: 8,
        border: '2px solid var(--dsw-alias-border-l2)',
        borderRadius: 0,
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
        boxShadow: '3px 3px 0 var(--dsw-alias-border-l2)'
      },
      selected: {
        borderColor: 'var(--dsw-alias-brand-primary)',
        transform: 'translate(-2px,-2px)',
        boxShadow: '5px 5px 0 var(--dsw-alias-border-l2)'
      },
      swatch: { height: 26, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', overflow: 'hidden', marginBottom: 6, border: '1px solid var(--dsw-alias-border-l2)' },
      label: { fontSize: 12, fontWeight: 800, display: 'block' },
      hint: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', display: 'block', marginTop: 2, lineHeight: '15px' },
      auto: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', marginTop: 2 }
    }

    function Choice({ id, active, label, hint, colors, onPick }) {
      return React.createElement('button', {
        type: 'button',
        'data-nb-choice': id,
        'aria-pressed': active,
        onClick: () => onPick(id),
        style: active ? { ...rowStyle.button, ...rowStyle.selected } : rowStyle.button
      },
        React.createElement('span', { style: rowStyle.swatch },
          ...colors.map((color, index) => React.createElement('i', { key: index, style: { background: color } }))),
        React.createElement('span', { style: rowStyle.label }, label),
        React.createElement('span', { style: rowStyle.hint }, hint))
    }

    function ThemeRow({ t, onPick, useStore }) {
      const choice = useStore((state) => state.choice)
      const current = choice === DEFAULT_CHOICE || THEME_IDS.has(choice) ? choice : DEFAULT_CHOICE
      return React.createElement('div', { style: rowStyle.root },
        React.createElement('div', { style: rowStyle.title }, t('title')),
        React.createElement('div', { style: rowStyle.caption }, t('caption')),
        React.createElement('div', { style: rowStyle.choices },
          React.createElement(Choice, {
            id: DEFAULT_CHOICE,
            active: current === DEFAULT_CHOICE,
            label: t('default'),
            hint: t('default-hint'),
            colors: ['#ffffff', '#e3e3e3', '#000000'],
            onPick
          }),
          React.createElement(Choice, {
            id: PAPER_ID,
            active: current === PAPER_ID,
            label: t('neo-brutalist-paper'),
            hint: t('neo-brutalist-paper-hint'),
            colors: ['#ffffff', '#ccff00', '#ff006e'],
            onPick
          }),
          React.createElement(Choice, {
            id: INK_ID,
            active: current === INK_ID,
            label: t('neo-brutalist-ink'),
            hint: t('neo-brutalist-ink-hint'),
            colors: ['#000000', '#ccff00', '#00d9ff'],
            onPick
          })),
        React.createElement('div', { style: rowStyle.auto }, t('auto')))
    }

    const inject = ['slots', 'locale', 'theme']

    function apply(ctx) {
      // 1. 注册两套主题；立刻挂 disposer，后续任何步骤抛错也不会泄漏。
      const themeDisposers = THEMES.map((definition) => ctx.theme.register(definition))
      ctx.effect(() => () => {
        for (const dispose of themeDisposers) {
          try { dispose() } catch (_) {}
        }
      }, 'neo-brutalist: theme registrations')

      // 2. 插件自有样式表，卸载即移除。
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.dataset.plugin = PACKAGE
      style.textContent = CSS
      document.head.append(style)
      ctx.effect(() => () => {
        if (style.isConnected) style.remove()
      }, 'neo-brutalist: stylesheet')

      // 3. 把当前主题映射到 body 标记；只有标记存在时结构样式才生效。
      //    第三方主题 id 不进 Host 的 durable schema（setTheme 只改内存），所以
      //    Host 每次 adopt 设置区间都会回落内置 appearance；这里做一次静默恢复。
      let lastPreference = ctx.theme.getTheme().preference
      let silentPreference = null
      let recoveryGeneration = 0
      const sync = (snapshot) => {
        const preference = snapshot.preference
        if (THEME_IDS.has(preference)) {
          lastPreference = preference
          document.body.setAttribute(BODY_ATTR, preference === INK_ID ? 'ink' : 'paper')
          if (preference === silentPreference) silentPreference = null
          return
        }
        document.body.removeAttribute(BODY_ATTR)
        const previous = lastPreference
        lastPreference = preference
        const saved = readChoice()
        // 只恢复「用户自己选的插件主题」：点内置外观会先把 choice 写成 default，
        // 因此不会在这里抢回控制权。
        if (THEME_IDS.has(previous) && saved === previous) {
          const ticket = ++recoveryGeneration
          Promise.resolve().then(() => {
            if (ticket !== recoveryGeneration) return
            if (readChoice() !== previous) return
            if (THEME_IDS.has(ctx.theme.getTheme().preference)) return
            silentPreference = previous
            ctx.theme.setTheme(previous)
          })
        }
      }
      ctx.effect(() => () => {
        recoveryGeneration += 1
        silentPreference = null
        document.body.removeAttribute(BODY_ATTR)
      }, 'neo-brutalist: body marker')

      // 4. 用户点内置外观时清掉恢复记录。
      const onDocumentClick = (event) => {
        if (isBuiltinAppearanceChoice(event.target)) {
          writeChoice(DEFAULT_CHOICE)
        }
      }
      document.addEventListener('click', onDocumentClick, true)

      ctx.effect(() => () => {
        document.removeEventListener('click', onDocumentClick, true)
      }, 'neo-brutalist: built-in appearance intent')

      // 5. 跟随主题变化维护 body 标记与恢复。
      ctx.effect(() => ctx.on('theme/change', sync), 'neo-brutalist: body marker')

      // 6. 重载 / 首次安装后的恢复。
      //    老用户的选择已经在 localStorage 里，先同步应用一次，避免每次刷新
      //    都先看到 400ms 的出厂配色；Host 设置异步落地后由第 5 步兜底。
      const savedAtBoot = readChoice()
      if (savedAtBoot !== null && savedAtBoot !== DEFAULT_CHOICE && THEME_IDS.has(savedAtBoot)
        && ctx.theme.getTheme().preference !== savedAtBoot) {
        ctx.theme.setTheme(savedAtBoot)
      }
      const restore = () => {
        const snapshot = ctx.theme.getTheme()
        const choice = readChoice() // 重新读：等待期间用户可能已经点过
        if (choice === null) {
          // 首次安装自动套用：跟随用户当前系统/内置外观的明暗选版本。
          if (THEME_IDS.has(snapshot.preference)) return
          const target = snapshot.active && snapshot.active.colorScheme === 'dark' ? INK_ID : PAPER_ID
          writeChoice(target)
          ctx.theme.setTheme(target)
          return
        }
        if (choice !== DEFAULT_CHOICE && THEME_IDS.has(choice) && snapshot.preference !== choice) {
          ctx.theme.setTheme(choice)
        }
      }
      const restoreTimer = window.setTimeout(restore, 400)
      ctx.effect(() => () => {
        window.clearTimeout(restoreTimer)
      }, 'neo-brutalist: preference restore timer')

      // 7. 设置行：每次打开 Settings 都能看到当前选择。
      const store = createStore()
      let bound
      ctx.effect(() => ctx.on('theme/change', (snapshot) => {
        if (bound) bound.sync(snapshot.preference, snapshot.revision)
      }), 'neo-brutalist: settings store sync')

      const pick = (id) => {
        if (id === DEFAULT_CHOICE) {
          writeChoice(DEFAULT_CHOICE)
          ctx.theme.setTheme('system')
          return
        }
        if (!THEME_IDS.has(id)) return
        writeChoice(id)
        ctx.theme.setTheme(id)
      }

      sync(ctx.theme.getTheme())
      ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'neo-brutalist: locale')
      ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'dsh-theme-neo-brutalist',
        order: 20,
        store,
        locale: SETTINGS_NS,
        inject: (actions) => {
          bound = actions
          const snapshot = ctx.theme.getTheme()
          actions.sync(snapshot.preference, snapshot.revision)
          return { onPick: pick }
        }
      }, ThemeRow))
    }

    module.exports = {
      PAPER_ID,
      INK_ID,
      THEMES,
      PAPER,
      INK,
      CSS,
      inject,
      apply
    }
    return module.exports
  }
})

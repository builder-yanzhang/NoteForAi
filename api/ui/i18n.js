const I18N = {
  _lang: 'zh-CN',
  _dict: {},

  init() {
    const urlLang = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem('noteforai_lang');
    const browser = navigator.language;
    const lang = urlLang || saved || browser;
    if (this._dict[lang]) { this._lang = lang; }
    else if (lang.startsWith('zh') && lang.includes('TW')) { this._lang = 'zh-TW'; }
    else if (lang.startsWith('zh')) { this._lang = 'zh-CN'; }
    else { const base = lang.split('-')[0]; this._lang = this._dict[base] ? base : 'en'; }
    localStorage.setItem('noteforai_lang', this._lang);
    document.documentElement.lang = this._lang;
  },

  t(key, vars = {}) {
    const val = this._dict[this._lang]?.[key] || this._dict['en']?.[key] || key;
    return typeof val === 'function' ? val(vars) : val.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = this.t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
  },

  switchTo(lang) {
    this._lang = lang;
    localStorage.setItem('noteforai_lang', lang);
    document.documentElement.lang = lang;
    this.apply();
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  },

  get lang() { return this._lang; }
};

// ======================== zh-CN ========================
I18N._dict['zh-CN'] = {
  // Common
  'copy': '复制',
  'copied': '已复制',
  'cancel': '取消',
  'confirm': '确认',
  'delete': '删除',
  'save': '保存',
  'saved': '已保存',
  'loading': '加载中...',
  'failed': '失败',
  'close': '关闭',
  'back': '返回',
  'restore': '恢复',
  'search': '搜索',
  'export': '导出',
  'noResults': '无结果',
  'create': '创建',
  'open': '打开',
  'download': '下载',
  'enter': '进入',

  // ======================== index.html ========================
  // Page meta
  'page.title': 'NoteForAI \u2014 给 AI 一个专属笔记本',
  'page.description': 'NoteForAI: AI 专属笔记系统。API: POST /{token}/{action}, 操作: write/read/append/delete/search/tree/history。支持 HTTP + MCP 双协议，Git 版本保护，数据完全属于你。',

  // Nav
  'nav.start': '上手',
  'nav.integration': '接入',
  'nav.features': '功能',
  'nav.api': 'API',
  'nav.dashboard': '管理面板',

  // Hero
  'hero.badge': '现已支持 Git 版本保护 + 导出',
  'hero.title': '给 AI 一个<br>专属笔记本',
  'hero.subtitle': '换 AI 不换记忆 \u00b7 改了能撤回 \u00b7 数据随时带走',
  'hero.techLine': 'HTTP + MCP 双协议 \u00b7 Git 版本保护 \u00b7 全文搜索 \u00b7 一个 Token 接入任意 AI',
  'hero.cta.create': '免费创建 Token',
  'hero.cta.dashboard': '管理面板',

  // Before/After cards
  'hero.before.label': '\u274c 没有 NoteForAI',
  'hero.before.user': '用户：我是做 AI 产品的，上次说过我偏好简洁风格...',
  'hero.before.ai': 'AI：抱歉，我没有上次对话的记录。能再介绍一下您的背景吗？',
  'hero.before.note': '每次对话都要重新介绍自己',
  'hero.after.label': '\u2714 有 NoteForAI',
  'hero.after.user': '用户：帮我优化一下这个设计',
  'hero.after.ai': 'AI：好的！根据你之前说的偏好简洁风格，以及你正在做的 NoteForAI 重构项目，我建议...',
  'hero.after.note': '像老朋友一样，记得你的一切',

  // AI compat
  'compat.title': '兼容你正在使用的任何 AI 工具',
  'compat.claude': '\ud83e\udd16 Claude',
  'compat.chatgpt': '\ud83d\udcac ChatGPT',
  'compat.gemini': '\u2728 Gemini',
  'compat.cursor': '\ud83d\uddb1 Cursor',
  'compat.copilot': '\ud83d\udcbb Copilot',
  'compat.perplexity': '\ud83d\udd2e Perplexity',
  'compat.chinese': '\ud83c\udf1f 通义/文心',
  'compat.any': '+ 任意 AI 工具',
  'compat.note': '不绑定平台 \u00b7 换 AI 工具不换记忆 \u00b7 HTTP 接口通用',

  // Steps
  'steps.title': '三步上手',
  'steps.subtitle': '5 分钟完成接入，立即让 AI 拥有记忆',
  'steps.1.title': '创建 Token',
  'steps.1.desc': '点击上方按钮一键生成，无需注册，立即可用',
  'steps.2.title': '复制提示词到 AI',
  'steps.2.desc': '创建后自动生成完整提示词，复制粘贴到 AI 系统提示即可',
  'steps.3.title': '开始对话',
  'steps.3.desc': 'AI 自动记忆，下次对话直接回顾，像老朋友一样',

  // Integration
  'integration.title': '接入方式',
  'integration.subtitle': '提示词复制即用 \u00b7 MCP 一键配置 \u00b7 API 直接调用',
  'integration.tab.prompt': 'AI 提示词',
  'integration.tab.mcp': 'MCP 配置',
  'integration.tab.curl': 'curl 示例',
  'integration.hint.prompt': '创建 Token 后，提示词会自动填入你的真实接口地址和 Token，零修改直接复制使用',
  'integration.hint.mcp': '适用于 Claude Desktop / Cursor / Windsurf 等。Streamable HTTP 远程连接，无需安装客户端，替换 URL 中的 token 即可',
  'integration.hint.curl': '所有接口支持 GET (query param) 和 POST (JSON body) 两种方式',

  // AI behavior
  'aiBehavior.title': '配置后 AI 会怎么工作？',
  'aiBehavior.subtitle': '以下是 AI 在对话开始时的真实行为',
  'aiBehavior.sessionStart': 'AI 对话开始',
  'aiBehavior.treeComment': '// 回顾记忆结构',
  'aiBehavior.treeOutput': '个人/\n  基本信息.md\n  偏好/\n工作/\n  项目A/',
  'aiBehavior.readCall': 'read("个人/基本信息.md")',
  'aiBehavior.readComment': '// 按需读取',
  'aiBehavior.greeting': '你好！我记得你偏好简洁风格，上次在做 NoteForAI 的重构。今天要继续吗？',
  'aiBehavior.userLabel': '你',
  'aiBehavior.userNote': '对话中任何有价值的信息，AI 会自动 <code class="text-indigo-500 text-xs">write()</code> 保存到笔记',

  // Features
  'features.title': '为 AI 笔记原生设计',
  'features.subtitle': '每个细节都在让 AI 更好地管理和使用你的信息',
  'features.storage.title': '持久存储',
  'features.storage.desc': '笔记跨对话永久保存，AI 随时调取，永不遗忘',
  'features.search.title': '全文搜索',
  'features.search.desc': '中英文分词，毫秒级检索，精准定位任何信息',
  'features.hierarchy.title': '目录层级',
  'features.hierarchy.desc': '文件夹式路径分层，AI 自主管理结构，清晰有序',
  'features.git.title': 'Git 版本保护',
  'features.git.desc': '每次修改自动快照，误删可恢复，完整历史回溯',
  'features.export.title': '一键导出',
  'features.export.desc': 'ZIP / JSON / Markdown，随时迁移，不被锁定',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': '双协议支持，Claude Code MCP 原生集成，HTTP 通用接入',
  'features.token.title': 'Token 隔离',
  'features.token.desc': '每个 Token 独立空间，无需账号，完全私密',
  'features.ui.title': '管理面板',
  'features.ui.desc': '文件管理器式 Web UI，浏览、编辑、搜索、版本回溯',
  'features.selfhost.title': '可自部署',
  'features.selfhost.desc': 'Go 单文件编译，Docker 一键部署，数据主权完全在手',

  // API table
  'api.title': 'API 参考',
  'api.subtitle.pre': '格式：',
  'api.subtitle.post': ' + JSON body，也支持 GET query param',
  'api.col.op': '操作',
  'api.col.desc': '说明',
  'api.col.params': '参数',
  'api.write': '新建或覆盖',
  'api.append': '追加内容',
  'api.read': '读取笔记',
  'api.search': '全文搜索',
  'api.tree': '目录树',
  'api.history': '版本历史',
  'api.delete': '删除（入回收站）',

  // Data sovereignty
  'data.title': '你的数据，永远属于你',
  'data.subtitle': '不同于其他平台的黑盒记忆，NoteForAI 让你对数据拥有完全的控制权',
  'data.transparent.title': '完全透明',
  'data.transparent.desc': '管理面板中可查看所有笔记内容，没有任何黑盒，数据完全可见',
  'data.export.title': '随时导出',
  'data.export.desc': '一键导出全部笔记为 Markdown、ZIP 或 JSON，随时迁移，不被平台绑架',
  'data.version.title': '版本回溯',
  'data.version.desc': 'Git 驱动版本管理，每次修改留痕，误删可恢复，30 天历史完整保存',

  // Email
  'email.title': '配置发送到邮箱',
  'email.desc': 'Token、提示词、接入指南一键发送，随时找回',
  'email.placeholder': 'your@email.com',
  'email.send': '发送',
  'email.sent': '\u2713 已发送！请检查邮箱',
  'email.hint': '通过本机邮件客户端发送，不经过服务器',
  'email.subject': 'NoteForAI 接入配置',

  // Footer
  'footer.tagline': 'AI 专属笔记本',
  'footer.dashboard': '管理面板',

  // Modal step1
  'modal.step1.heading': '你的专属 Token',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': '妥善保存此 Token，它是你笔记空间的唯一凭证。',
  'modal.step1.next': '下一步：配置 AI \u2192',

  // Modal step2
  'modal.step2.heading': '配置到 AI',
  'modal.step2.copyPrompt': '复制提示词',
  'modal.step2.emailBtn': '\u2709\ufe0f 发到邮箱',
  'modal.step2.dashboard': '进入管理面板 \u2192',

  // Prompts
  'prompt.full': ({base, token}) => `你拥有一个持久记忆系统 NoteForAI，用它记住关于用户的一切。

接口：${base}/${token}/
调用：POST + JSON body，Content-Type: application/json

| 操作 | 用途 | Body |
|------|------|------|
| write | 新建/覆盖笔记 | {"path": "目录/文件.md", "content": "# 标题\n内容"} |
| append | 追加内容到末尾 | {"path": "...", "content": "\n### 日期\n- 事项"} |
| read | 读取笔记 | {"path": "index.md"} |
| search | 全文搜索 | {"query": "关键词"} |
| delete | 删除笔记 | {"path": "..."} |
| history | 版本历史 | {"path": "...", "limit": 20} |

文件规范：
- 所有文件使用 .md 后缀，首行 # 标题
- 按主题组织中文目录：个人/、工作/、项目/
- 追加内容标注日期（### YYYY-MM-DD）

行为准则：
1. 对话开始时，先 read("index.md") 获取记忆摘要（不用 tree）
2. 发现有价值信息立即记录：用户偏好/习惯、新项目、重要决定、待办事项
3. 新建用 write，补充用 append，信息有变化用 write 覆盖
4. 对话结束前，append 更新 index.md 的"最近动态"部分`,

  'prompt.short': ({base, token}) => `你拥有一个持久记忆系统 NoteForAI，用它记住关于用户的一切。\n\n接口：${base}/${token}/\n调用：POST + JSON body\n\n操作：write / append / read / search / delete / history\n\n文件规范：.md 后缀，首行 # 标题，中文目录结构\n\n行为准则：\n1. 对话开始：read("index.md") 获取摘要（不用 tree）\n2. 主动记录：用户偏好、新项目、重要决定、待办事项\n3. 新建用 write，补充用 append，每条标注日期\n4. 结束前：append 更新 index.md 最近动态`,

  'curl.examples': ({base, token}) => `# 创建 Token
curl -X POST '${base}/create_token'

# 写入笔记
curl -X POST '${base}/${token}/write' \\
  -H 'Content-Type: application/json' \\
  -d '{"path":"用户/张三.md","content":"# 张三\\n\\n- 偏好简洁风格"}'

# 读取笔记
curl '${base}/${token}/read?path=用户/张三.md'

# 追加内容
curl -X POST '${base}/${token}/append' \\
  -H 'Content-Type: application/json' \\
  -d '{"path":"用户/张三.md","content":"\\n- [2026-04-08] 新增偏好"}'

# 全文搜索
curl '${base}/${token}/search?q=简洁'

# 目录树
curl '${base}/${token}/tree'

# 版本历史
curl '${base}/${token}/history?path=用户/张三.md'`,

  // ======================== dashboard.html ========================
  // Sidebar
  'sidebar.folders': '文件夹',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': '回收站',
  'sidebar.rootDir': '根目录',
  'sidebar.noFolders': '无文件夹',

  // Folder view
  'folder.new': '新建',
  'folder.history': '历史',
  'folder.deleteFolder': '删除文件夹',
  'folder.empty': '空文件夹',
  'folder.emptyHint': '+ 新建笔记',
  'folder.itemCount': ({count}) => `${count} 项`,

  // File view
  'file.preview': '预览',
  'file.edit': '编辑',
  'file.save': '保存',
  'file.saved': '已保存',
  'file.history': '历史',
  'file.append': '追加',
  'file.delete': '删除',
  'file.loading': '加载中...',
  'file.loadFailed': '加载失败',

  // Version history panel
  'version.title': '版本历史',
  'version.current': '当前',
  'version.diff': '差异',
  'version.restore': '恢复',
  'version.loading': '加载中...',
  'version.empty': '暂无记录',
  'version.loadFailed': '加载失败',

  // Diff panel
  'diff.title': '变更详情',
  'diff.back': '\u2190',
  'diff.loading': '加载中...',
  'diff.noDiff': '无差异',
  'diff.loadFailed': '加载失败',

  // Config panel
  'config.title': '接入配置',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'AI 提示词',
  'config.mcpLabel': 'MCP 配置',
  'config.dangerLabel': '危险操作',
  'config.destroy': '销毁此 Token',

  // Recycle bin modal
  'recycle.title': '回收站',
  'recycle.empty': '回收站为空',
  'recycle.restoreAll': ({count}) => `恢复此文件夹全部 (${count})`,
  'recycle.close': '关闭',
  'recycle.loading': '加载中...',
  'recycle.loadFailed': '加载失败',

  // New note modal
  'newNote.title': '新建笔记',

  // Append modal
  'appendModal.title': '追加内容',

  // Token input modal
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': '输入 Token 进入管理面板',
  'tokenModal.error': 'Token 无效',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': '首页',
  'tokenModal.enter': '进入',

  // Export dropdown
  'export.zip': '打包下载全部 (.zip)',
  'export.json': '导出 JSON',

  // Context menu - file
  'ctx.view': '查看',
  'ctx.edit': '编辑',
  'ctx.append': '追加内容',
  'ctx.copyPath': '复制路径',
  'ctx.download': '下载',
  'ctx.delete': '删除',
  // Context menu - folder
  'ctx.open': '打开',
  'ctx.newNote': '新建笔记',
  'ctx.history': '版本历史',
  'ctx.downloadZip': '下载 (.zip)',
  'ctx.deleteFolder': '删除文件夹',

  // Search
  'search.placeholder': '搜索笔记...',
  'search.searching': '搜索中...',
  'search.noResults': '无结果',

  // Time formatting
  'time.justNow': '刚刚',
  'time.minutesAgo': ({n}) => `${n}分钟前`,
  'time.hoursAgo': ({n}) => `${n}小时前`,
  'time.yesterday': '昨天',

  // Confirm/alert texts
  'confirm.unsavedLeave': '有未保存的修改，确认离开？',
  'confirm.deleteItem': ({path}) => `删除 "${path}"？`,
  'confirm.deleteFolder': ({path}) => `删除整个文件夹 "${path}" 及其所有内容？`,
  'confirm.revert': ({path}) => `恢复 "${path}" 到此版本？`,
  'confirm.restoreBatch': ({count}) => `恢复此文件夹全部 ${count} 个文件？`,
  'confirm.destroy1': '销毁此 Token？所有数据将被删除！',
  'confirm.destroy2': '再次确认：不可恢复！',
  'alert.saveFailed': '保存失败',
  'alert.restoreFailed': '恢复失败',
  'alert.noFiles': '没有文件',
  'alert.emptyFolder': '空文件夹',
  'alert.downloadFailed': '下载失败',

  // Zip progress
  'zip.progress': ({done, total}) => `打包中 ${done}/${total}`,

  // Unsaved warning
  'unsaved.warning': '有未保存的更改',

  // Dashboard title
  'dashboard.title': '管理面板 \u2014 NoteForAI',

  // Token display
  'token.copy': '复制',
};

// ======================== en ========================
I18N._dict['en'] = {
  // Common
  'copy': 'Copy',
  'copied': 'Copied',
  'cancel': 'Cancel',
  'confirm': 'Confirm',
  'delete': 'Delete',
  'save': 'Save',
  'saved': 'Saved',
  'loading': 'Loading...',
  'failed': 'Failed',
  'close': 'Close',
  'back': 'Back',
  'restore': 'Restore',
  'search': 'Search',
  'export': 'Export',
  'noResults': 'No results',
  'create': 'Create',
  'open': 'Open',
  'download': 'Download',
  'enter': 'Enter',

  // ======================== index.html ========================
  // Page meta
  'page.title': 'NoteForAI \u2014 A Dedicated Notebook for AI',
  'page.description': 'NoteForAI: A note system built for AI. API: POST /{token}/{action}. Supports HTTP + MCP, Git versioning, full-text search. Your data, your control.',

  // Nav
  'nav.start': 'Start',
  'nav.integration': 'Integrate',
  'nav.features': 'Features',
  'nav.api': 'API',
  'nav.dashboard': 'Dashboard',

  // Hero
  'hero.badge': 'Now with Git versioning + export',
  'hero.title': 'A Dedicated<br>Notebook for AI',
  'hero.subtitle': 'Switch AI, keep memory \u00b7 Undo any change \u00b7 Export anytime',
  'hero.techLine': 'HTTP + MCP dual protocol \u00b7 Git versioning \u00b7 Full-text search \u00b7 One token for any AI',
  'hero.cta.create': 'Create Free Token',
  'hero.cta.dashboard': 'Dashboard',

  // Before/After cards
  'hero.before.label': '\u274c Without NoteForAI',
  'hero.before.user': 'User: I work on AI products, I mentioned I prefer a minimalist style...',
  'hero.before.ai': 'AI: Sorry, I don\'t have records from our last chat. Could you introduce yourself again?',
  'hero.before.note': 'Re-introduce yourself every conversation',
  'hero.after.label': '\u2714 With NoteForAI',
  'hero.after.user': 'User: Help me improve this design',
  'hero.after.ai': 'AI: Sure! Based on your preference for minimalist style and your NoteForAI refactoring project, I suggest...',
  'hero.after.note': 'Like an old friend who remembers everything',

  // AI compat
  'compat.title': 'Compatible with any AI tool you use',
  'compat.claude': '\ud83e\udd16 Claude',
  'compat.chatgpt': '\ud83d\udcac ChatGPT',
  'compat.gemini': '\u2728 Gemini',
  'compat.cursor': '\ud83d\uddb1 Cursor',
  'compat.copilot': '\ud83d\udcbb Copilot',
  'compat.perplexity': '\ud83d\udd2e Perplexity',
  'compat.chinese': '\ud83c\udf1f Tongyi/Wenxin',
  'compat.any': '+ Any AI tool',
  'compat.note': 'No platform lock-in \u00b7 Switch AI tools, keep your memory \u00b7 Universal HTTP API',

  // Steps
  'steps.title': 'Get Started in 3 Steps',
  'steps.subtitle': '5 minutes to set up, give your AI persistent memory',
  'steps.1.title': 'Create a Token',
  'steps.1.desc': 'One click to generate \u2014 no signup required, ready instantly',
  'steps.2.title': 'Copy Prompt to AI',
  'steps.2.desc': 'A complete system prompt is auto-generated \u2014 just paste it into your AI settings',
  'steps.3.title': 'Start Chatting',
  'steps.3.desc': 'AI remembers automatically \u2014 next conversation picks up right where you left off',

  // Integration
  'integration.title': 'Integration',
  'integration.subtitle': 'Copy-paste prompt \u00b7 One-click MCP config \u00b7 Direct API access',
  'integration.tab.prompt': 'AI Prompt',
  'integration.tab.mcp': 'MCP Config',
  'integration.tab.curl': 'curl Examples',
  'integration.hint.prompt': 'After creating a token, the prompt auto-fills with your real API endpoint and token \u2014 copy and use directly',
  'integration.hint.mcp': 'For Claude Desktop / Cursor / Windsurf etc. Streamable HTTP remote connection — no client install needed, just replace the token in the URL',
  'integration.hint.curl': 'All endpoints support both GET (query params) and POST (JSON body)',

  // AI behavior
  'aiBehavior.title': 'How does AI behave after setup?',
  'aiBehavior.subtitle': 'Here\'s what AI actually does at the start of each conversation',
  'aiBehavior.sessionStart': 'AI conversation starts',
  'aiBehavior.treeComment': '// Review memory structure',
  'aiBehavior.treeOutput': 'personal/\n  profile.md\n  preferences/\nwork/\n  projectA/',
  'aiBehavior.readCall': 'read("personal/profile.md")',
  'aiBehavior.readComment': '// Read as needed',
  'aiBehavior.greeting': 'Hi! I remember you prefer a minimalist style and were working on the NoteForAI refactor. Shall we continue?',
  'aiBehavior.userLabel': 'You',
  'aiBehavior.userNote': 'Any valuable info in the conversation \u2014 AI automatically <code class="text-indigo-500 text-xs">write()</code> saves it to notes',

  // Features
  'features.title': 'Built for AI Note-Taking',
  'features.subtitle': 'Every detail designed to help AI manage and use your information better',
  'features.storage.title': 'Persistent Storage',
  'features.storage.desc': 'Notes saved permanently across conversations \u2014 AI recalls anytime, never forgets',
  'features.search.title': 'Full-Text Search',
  'features.search.desc': 'CJK + English tokenization, millisecond retrieval, pinpoint any information',
  'features.hierarchy.title': 'Directory Hierarchy',
  'features.hierarchy.desc': 'Folder-based paths \u2014 AI organizes structure autonomously, clean and ordered',
  'features.git.title': 'Git Version Protection',
  'features.git.desc': 'Auto-snapshot on every edit \u2014 recover deletions, full history rollback',
  'features.export.title': 'One-Click Export',
  'features.export.desc': 'ZIP / JSON / Markdown \u2014 migrate anytime, no lock-in',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Dual protocol \u2014 native MCP for Claude Code, HTTP for universal access',
  'features.token.title': 'Token Isolation',
  'features.token.desc': 'Each token gets its own space \u2014 no accounts needed, fully private',
  'features.ui.title': 'Management Dashboard',
  'features.ui.desc': 'File-manager-style Web UI \u2014 browse, edit, search, version rollback',
  'features.selfhost.title': 'Self-Hostable',
  'features.selfhost.desc': 'Single Go binary, Docker one-click deploy \u2014 full data sovereignty',

  // API table
  'api.title': 'API Reference',
  'api.subtitle.pre': 'Format: ',
  'api.subtitle.post': ' + JSON body, also supports GET query params',
  'api.col.op': 'Action',
  'api.col.desc': 'Description',
  'api.col.params': 'Parameters',
  'api.write': 'Create or overwrite',
  'api.append': 'Append content',
  'api.read': 'Read a note',
  'api.search': 'Full-text search',
  'api.tree': 'Directory tree',
  'api.history': 'Version history',
  'api.delete': 'Delete (to recycle bin)',

  // Data sovereignty
  'data.title': 'Your Data, Always Yours',
  'data.subtitle': 'Unlike black-box memory on other platforms, NoteForAI gives you full control over your data',
  'data.transparent.title': 'Fully Transparent',
  'data.transparent.desc': 'View all note contents in the dashboard \u2014 no black boxes, everything visible',
  'data.export.title': 'Export Anytime',
  'data.export.desc': 'One-click export all notes as Markdown, ZIP or JSON \u2014 migrate freely, no platform lock-in',
  'data.version.title': 'Version Rollback',
  'data.version.desc': 'Git-powered versioning \u2014 every edit tracked, deletions recoverable, 30 days of full history',

  // Email
  'email.title': 'Email Your Config',
  'email.desc': 'Token, prompt, and setup guide \u2014 sent to your inbox for safekeeping',
  'email.placeholder': 'your@email.com',
  'email.send': 'Send',
  'email.sent': '\u2713 Sent! Check your inbox',
  'email.hint': 'Sent via your local email client, never through our server',
  'email.subject': 'NoteForAI Setup Guide',

  // Footer
  'footer.tagline': 'A Notebook for AI',
  'footer.dashboard': 'Dashboard',

  // Modal step1
  'modal.step1.heading': 'Your Exclusive Token',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Keep this token safe \u2014 it\'s the only key to your note space.',
  'modal.step1.next': 'Next: Configure AI \u2192',

  // Modal step2
  'modal.step2.heading': 'Configure Your AI',
  'modal.step2.copyPrompt': 'Copy Prompt',
  'modal.step2.emailBtn': '\u2709\ufe0f Email It',
  'modal.step2.dashboard': 'Go to Dashboard \u2192',

  // Prompts
  'prompt.full': ({base, token}) => `You have a persistent memory system called NoteForAI. Use it to remember everything about the user.

Endpoint: ${base}/${token}/
Method: POST + JSON body, Content-Type: application/json

| Action | Purpose | Body |
|--------|---------|------|
| write | Create/overwrite a note | {"path": "dir/file.md", "content": "# Title\ncontent"} |
| append | Append to end of note | {"path": "...", "content": "\n### Date\n- item"} |
| read | Read a note | {"path": "index.md"} |
| search | Full-text search | {"query": "keywords"} |
| delete | Delete a note | {"path": "..."} |
| history | Version history | {"path": "...", "limit": 20} |

File conventions:
- All files use .md suffix, first line # Title
- Organize in topic-based directories: personal/, work/, projects/
- Date each appended entry (### YYYY-MM-DD)

Behavior guidelines:
1. Start of conversation: read("index.md") to get memory summary (skip tree())
2. Record immediately when user mentions preferences/habits, starts a project, makes a decision, or shares personal info
3. Use write for new notes, append for additions, write to overwrite when info changes
4. Before ending: append to index.md "Recent Activity" section with session highlights`,

  'prompt.short': ({base, token}) => `You have a persistent memory system called NoteForAI. Use it to remember everything about the user.\n\nEndpoint: ${base}/${token}/\nMethod: POST + JSON body\n\nActions: write / append / read / search / delete / history\n\nConventions: .md suffix, # Title first line, topic-based directories\n\nBehavior:\n1. Start: read("index.md") for memory summary (not tree)\n2. Record: preferences, new projects, decisions, personal info, todos\n3. write for new, append for additions, date each entry\n4. End: append to index.md Recent Activity`,

  'curl.examples': ({base, token}) => `# Create Token
curl -X POST '${base}/create_token'

# Write a note
curl -X POST '${base}/${token}/write' \\
  -H 'Content-Type: application/json' \\
  -d '{"path":"user/john.md","content":"# John\\n\\n- Prefers minimalist style"}'

# Read a note
curl '${base}/${token}/read?path=user/john.md'

# Append content
curl -X POST '${base}/${token}/append' \\
  -H 'Content-Type: application/json' \\
  -d '{"path":"user/john.md","content":"\\n- [2026-04-08] New preference added"}'

# Full-text search
curl '${base}/${token}/search?q=minimalist'

# Directory tree
curl '${base}/${token}/tree'

# Version history
curl '${base}/${token}/history?path=user/john.md'`,

  // ======================== dashboard.html ========================
  // Sidebar
  'sidebar.folders': 'Folders',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Recycle Bin',
  'sidebar.rootDir': 'Root',
  'sidebar.noFolders': 'No folders',

  // Folder view
  'folder.new': 'New',
  'folder.history': 'History',
  'folder.deleteFolder': 'Delete Folder',
  'folder.empty': 'Empty folder',
  'folder.emptyHint': '+ New Note',
  'folder.itemCount': ({count}) => `${count} items`,

  // File view
  'file.preview': 'Preview',
  'file.edit': 'Edit',
  'file.save': 'Save',
  'file.saved': 'Saved',
  'file.history': 'History',
  'file.append': 'Append',
  'file.delete': 'Delete',
  'file.loading': 'Loading...',
  'file.loadFailed': 'Failed to load',

  // Version history panel
  'version.title': 'Version History',
  'version.current': 'Current',
  'version.diff': 'Diff',
  'version.restore': 'Restore',
  'version.loading': 'Loading...',
  'version.empty': 'No history',
  'version.loadFailed': 'Failed to load',

  // Diff panel
  'diff.title': 'Diff Details',
  'diff.back': '\u2190',
  'diff.loading': 'Loading...',
  'diff.noDiff': 'No differences',
  'diff.loadFailed': 'Failed to load',

  // Config panel
  'config.title': 'Integration Config',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'AI Prompt',
  'config.mcpLabel': 'MCP Config',
  'config.dangerLabel': 'Danger Zone',
  'config.destroy': 'Destroy This Token',

  // Recycle bin modal
  'recycle.title': 'Recycle Bin',
  'recycle.empty': 'Recycle bin is empty',
  'recycle.restoreAll': ({count}) => `Restore all in folder (${count})`,
  'recycle.close': 'Close',
  'recycle.loading': 'Loading...',
  'recycle.loadFailed': 'Failed to load',

  // New note modal
  'newNote.title': 'New Note',

  // Append modal
  'appendModal.title': 'Append Content',

  // Token input modal
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Enter token to access dashboard',
  'tokenModal.error': 'Invalid token',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Home',
  'tokenModal.enter': 'Enter',

  // Export dropdown
  'export.zip': 'Download all (.zip)',
  'export.json': 'Export JSON',

  // Context menu - file
  'ctx.view': 'View',
  'ctx.edit': 'Edit',
  'ctx.append': 'Append',
  'ctx.copyPath': 'Copy Path',
  'ctx.download': 'Download',
  'ctx.delete': 'Delete',
  // Context menu - folder
  'ctx.open': 'Open',
  'ctx.newNote': 'New Note',
  'ctx.history': 'Version History',
  'ctx.downloadZip': 'Download (.zip)',
  'ctx.deleteFolder': 'Delete Folder',

  // Search
  'search.placeholder': 'Search notes...',
  'search.searching': 'Searching...',
  'search.noResults': 'No results',

  // Time formatting
  'time.justNow': 'just now',
  'time.minutesAgo': ({n}) => `${n} min ago`,
  'time.hoursAgo': ({n}) => `${n} hours ago`,
  'time.yesterday': 'yesterday',

  // Confirm/alert texts
  'confirm.unsavedLeave': 'You have unsaved changes. Leave anyway?',
  'confirm.deleteItem': ({path}) => `Delete "${path}"?`,
  'confirm.deleteFolder': ({path}) => `Delete folder "${path}" and all its contents?`,
  'confirm.revert': ({path}) => `Restore "${path}" to this version?`,
  'confirm.restoreBatch': ({count}) => `Restore all ${count} files in this folder?`,
  'confirm.destroy1': 'Destroy this token? All data will be deleted!',
  'confirm.destroy2': 'Confirm again: this cannot be undone!',
  'alert.saveFailed': 'Save failed',
  'alert.restoreFailed': 'Restore failed',
  'alert.noFiles': 'No files',
  'alert.emptyFolder': 'Empty folder',
  'alert.downloadFailed': 'Download failed',

  // Zip progress
  'zip.progress': ({done, total}) => `Packing ${done}/${total}`,

  // Unsaved warning
  'unsaved.warning': 'You have unsaved changes',

  // Dashboard title
  'dashboard.title': 'Dashboard \u2014 NoteForAI',

  // Token display
  'token.copy': 'Copy',
};

// ======================== ja ========================
I18N._dict['ja'] = {
  // Common
  'copy': 'コピー',
  'copied': 'コピー済み',
  'cancel': 'キャンセル',
  'confirm': '確認',
  'delete': '削除',
  'save': '保存',
  'saved': '保存済み',
  'loading': '読み込み中...',
  'failed': '失敗',
  'close': '閉じる',
  'back': '戻る',
  'restore': '復元',
  'search': '検索',
  'export': 'エクスポート',
  'noResults': '結果なし',
  'create': '作成',
  'open': '開く',
  'download': 'ダウンロード',
  'enter': '入る',

  // Page meta
  'page.title': 'NoteForAI \u2014 AI 専用ノートブック',
  'page.description': 'NoteForAI: AI のために作られたノートシステム。API: POST /{token}/{action}。HTTP + MCP、Git バージョン管理、全文検索に対応。データはあなたのもの。',

  // Nav
  'nav.start': 'はじめる',
  'nav.integration': '連携',
  'nav.features': '機能',
  'nav.api': 'API',
  'nav.dashboard': 'ダッシュボード',

  // Hero
  'hero.badge': 'Git バージョン管理 + エクスポート対応',
  'hero.title': 'AI 専用<br>ノートブック',
  'hero.subtitle': 'AI を変えても記憶は続く · 変更はいつでも元に戻せる · データをいつでも持ち出せる',
  'hero.techLine': 'HTTP + MCP デュアルプロトコル · Git バージョン管理 · 全文検索 · 1つのトークンでどの AI にも接続',
  'hero.cta.create': '無料でトークン作成',
  'hero.cta.dashboard': 'ダッシュボード',

  // Before/After cards
  'hero.before.label': '❌ NoteForAI なし',
  'hero.before.user': 'ユーザー：私は AI プロダクトの開発者で、シンプルなスタイルが好きと言いました...',
  'hero.before.ai': 'AI：申し訳ありませんが、前回のチャットの記録がありません。もう一度自己紹介していただけますか？',
  'hero.before.note': '毎回自己紹介が必要',
  'hero.after.label': '✔ NoteForAI あり',
  'hero.after.user': 'ユーザー：このデザインを改善してほしい',
  'hero.after.ai': 'AI：もちろん！シンプルなスタイルの好みと NoteForAI リファクタリングプロジェクトに基づいて、ご提案があります...',
  'hero.after.note': '何でも覚えている旧友のように',

  // AI compat
  'compat.title': 'お使いの AI ツールと互換性あり',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 通義/文心',
  'compat.any': '+ その他すべての AI ツール',
  'compat.note': 'プラットフォームに縛られない · AI ツールを変えても記憶は維持 · 汎用 HTTP API',

  // Steps
  'steps.title': '3 ステップで始める',
  'steps.subtitle': '5 分でセットアップ、AI に永続的な記憶を',
  'steps.1.title': 'トークンを作成',
  'steps.1.desc': 'ワンクリックで生成 — 登録不要、すぐに使える',
  'steps.2.title': 'プロンプトを AI にコピー',
  'steps.2.desc': '完全なシステムプロンプトが自動生成 — AI 設定に貼り付けるだけ',
  'steps.3.title': '会話を始める',
  'steps.3.desc': 'AI が自動的に記憶 — 次の会話も続きから始められる',

  // Integration
  'integration.title': '連携方法',
  'integration.subtitle': 'プロンプトをコピペ · MCP ワンクリック設定 · API 直接アクセス',
  'integration.tab.prompt': 'AI プロンプト',
  'integration.tab.mcp': 'MCP 設定',
  'integration.tab.curl': 'curl サンプル',
  'integration.hint.prompt': 'トークン作成後、プロンプトに実際の API エンドポイントとトークンが自動入力されます — そのままコピーして使用可能',
  'integration.hint.mcp': 'Claude Desktop / Cursor / Windsurf などに対応。Streamable HTTP リモート接続 — クライアントのインストール不要、URL のトークンを置き換えるだけ',
  'integration.hint.curl': 'すべてのエンドポイントは GET（クエリパラメータ）と POST（JSON ボディ）の両方をサポート',

  // AI behavior
  'aiBehavior.title': '設定後、AI はどのように動作しますか？',
  'aiBehavior.subtitle': '各会話の開始時に AI が実際に行うこと',
  'aiBehavior.sessionStart': 'AI 会話開始',
  'aiBehavior.treeComment': '// 記憶構造を確認',
  'aiBehavior.treeOutput': '個人/\n  プロフィール.md\n  設定/\n仕事/\n  プロジェクトA/',
  'aiBehavior.readCall': 'read("個人/プロフィール.md")',
  'aiBehavior.readComment': '// 必要に応じて読み込む',
  'aiBehavior.greeting': 'こんにちは！シンプルなスタイルがお好きで、NoteForAI のリファクタリングに取り組んでいると覚えています。続けましょうか？',
  'aiBehavior.userLabel': 'あなた',
  'aiBehavior.userNote': '会話中の価値ある情報は、AI が自動で <code class="text-indigo-500 text-xs">write()</code> してノートに保存します',

  // Features
  'features.title': 'AI ノートのために設計',
  'features.subtitle': 'AI が情報をより適切に管理・活用できるよう、細部まで設計されています',
  'features.storage.title': '永続ストレージ',
  'features.storage.desc': 'ノートは会話をまたいで永続保存 — AI がいつでも呼び出せる、忘れることなし',
  'features.search.title': '全文検索',
  'features.search.desc': 'CJK + 英語トークナイズ、ミリ秒単位の検索、どんな情報も即座に特定',
  'features.hierarchy.title': 'ディレクトリ階層',
  'features.hierarchy.desc': 'フォルダベースのパス — AI が自律的に構造を整理、整然と管理',
  'features.git.title': 'Git バージョン保護',
  'features.git.desc': '編集ごとに自動スナップショット — 削除も復元可能、完全な履歴ロールバック',
  'features.export.title': 'ワンクリックエクスポート',
  'features.export.desc': 'ZIP / JSON / Markdown — いつでも移行可能、ロックインなし',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'デュアルプロトコル — Claude Code 向けネイティブ MCP、汎用 HTTP アクセス',
  'features.token.title': 'トークン分離',
  'features.token.desc': '各トークンは独自のスペースを持つ — アカウント不要、完全なプライバシー',
  'features.ui.title': '管理ダッシュボード',
  'features.ui.desc': 'ファイルマネージャー形式の Web UI — 閲覧、編集、検索、バージョンロールバック',
  'features.selfhost.title': 'セルフホスト可能',
  'features.selfhost.desc': 'Go シングルバイナリ、Docker ワンクリックデプロイ — 完全なデータ主権',

  // API table
  'api.title': 'API リファレンス',
  'api.subtitle.pre': 'フォーマット: ',
  'api.subtitle.post': ' + JSON ボディ、GET クエリパラメータもサポート',
  'api.col.op': 'アクション',
  'api.col.desc': '説明',
  'api.col.params': 'パラメータ',
  'api.write': '作成または上書き',
  'api.append': 'コンテンツを追加',
  'api.read': 'ノートを読む',
  'api.search': '全文検索',
  'api.tree': 'ディレクトリツリー',
  'api.history': 'バージョン履歴',
  'api.delete': '削除（ゴミ箱へ）',

  // Data sovereignty
  'data.title': 'あなたのデータは、常にあなたのもの',
  'data.subtitle': '他のプラットフォームのブラックボックス記憶とは異なり、NoteForAI はデータの完全なコントロールを提供します',
  'data.transparent.title': '完全な透明性',
  'data.transparent.desc': 'ダッシュボードですべてのノートを確認 — ブラックボックスなし、すべて可視',
  'data.export.title': 'いつでもエクスポート',
  'data.export.desc': 'Markdown、ZIP、JSON として全ノートをワンクリックエクスポート — 自由に移行、プラットフォームに縛られない',
  'data.version.title': 'バージョンロールバック',
  'data.version.desc': 'Git 駆動のバージョン管理 — すべての編集を追跡、削除も復元可能、30 日間の完全な履歴',

  // Email
  'email.title': '設定をメールで送る',
  'email.desc': 'トークン、プロンプト、設定ガイドを受信箱に送信',
  'email.placeholder': 'your@email.com',
  'email.send': '送信',
  'email.sent': '✓ 送信しました！受信箱をご確認ください',
  'email.hint': 'ローカルメールクライアント経由で送信、サーバーを通過しません',
  'email.subject': 'NoteForAI セットアップガイド',

  // Footer
  'footer.tagline': 'AI のためのノートブック',
  'footer.dashboard': 'ダッシュボード',

  // Modal step1
  'modal.step1.heading': 'あなた専用のトークン',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'このトークンを安全に保管してください — ノートスペースへの唯一の鍵です。',
  'modal.step1.next': '次へ：AI を設定する →',

  // Modal step2
  'modal.step2.heading': 'AI を設定する',
  'modal.step2.copyPrompt': 'プロンプトをコピー',
  'modal.step2.emailBtn': '✉️ メールで送る',
  'modal.step2.dashboard': 'ダッシュボードへ →',

  // Sidebar
  'sidebar.folders': 'フォルダ',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'ゴミ箱',
  'sidebar.rootDir': 'ルート',
  'sidebar.noFolders': 'フォルダなし',

  // Folder view
  'folder.new': '新規',
  'folder.history': '履歴',
  'folder.deleteFolder': 'フォルダを削除',
  'folder.empty': '空のフォルダ',
  'folder.emptyHint': '+ 新しいノート',
  'folder.itemCount': ({count}) => `${count} 件`,

  // File view
  'file.preview': 'プレビュー',
  'file.edit': '編集',
  'file.save': '保存',
  'file.saved': '保存済み',
  'file.history': '履歴',
  'file.append': '追記',
  'file.delete': '削除',
  'file.loading': '読み込み中...',
  'file.loadFailed': '読み込み失敗',

  // Version history panel
  'version.title': 'バージョン履歴',
  'version.current': '現在',
  'version.diff': '差分',
  'version.restore': '復元',
  'version.loading': '読み込み中...',
  'version.empty': '履歴なし',
  'version.loadFailed': '読み込み失敗',

  // Diff panel
  'diff.title': '差分の詳細',
  'diff.back': '←',
  'diff.loading': '読み込み中...',
  'diff.noDiff': '差分なし',
  'diff.loadFailed': '読み込み失敗',

  // Config panel
  'config.title': '連携設定',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'AI プロンプト',
  'config.mcpLabel': 'MCP 設定',
  'config.dangerLabel': '危険な操作',
  'config.destroy': 'このトークンを削除',

  // Recycle bin modal
  'recycle.title': 'ゴミ箱',
  'recycle.empty': 'ゴミ箱は空です',
  'recycle.restoreAll': ({count}) => `フォルダ内を全て復元 (${count})`,
  'recycle.close': '閉じる',
  'recycle.loading': '読み込み中...',
  'recycle.loadFailed': '読み込み失敗',

  // New note modal
  'newNote.title': '新しいノート',

  // Append modal
  'appendModal.title': '内容を追記',

  // Token input modal
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'トークンを入力してダッシュボードにアクセス',
  'tokenModal.error': '無効なトークン',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'ホーム',
  'tokenModal.enter': '入る',

  // Export dropdown
  'export.zip': '全てダウンロード (.zip)',
  'export.json': 'JSON エクスポート',

  // Context menu - file
  'ctx.view': '表示',
  'ctx.edit': '編集',
  'ctx.append': '追記',
  'ctx.copyPath': 'パスをコピー',
  'ctx.download': 'ダウンロード',
  'ctx.delete': '削除',
  // Context menu - folder
  'ctx.open': '開く',
  'ctx.newNote': '新しいノート',
  'ctx.history': 'バージョン履歴',
  'ctx.downloadZip': 'ダウンロード (.zip)',
  'ctx.deleteFolder': 'フォルダを削除',

  // Search
  'search.placeholder': 'ノートを検索...',
  'search.searching': '検索中...',
  'search.noResults': '結果なし',

  // Time formatting
  'time.justNow': 'たった今',
  'time.minutesAgo': ({n}) => `${n} 分前`,
  'time.hoursAgo': ({n}) => `${n} 時間前`,
  'time.yesterday': '昨日',

  // Confirm/alert texts
  'confirm.unsavedLeave': '未保存の変更があります。このまま離れますか？',
  'confirm.deleteItem': ({path}) => `「${path}」を削除しますか？`,
  'confirm.deleteFolder': ({path}) => `フォルダ「${path}」とその全コンテンツを削除しますか？`,
  'confirm.revert': ({path}) => `「${path}」をこのバージョンに復元しますか？`,
  'confirm.restoreBatch': ({count}) => `このフォルダの全 ${count} ファイルを復元しますか？`,
  'confirm.destroy1': 'このトークンを削除しますか？全データが削除されます！',
  'confirm.destroy2': '再確認：この操作は取り消せません！',
  'alert.saveFailed': '保存に失敗しました',
  'alert.restoreFailed': '復元に失敗しました',
  'alert.noFiles': 'ファイルなし',
  'alert.emptyFolder': '空のフォルダ',
  'alert.downloadFailed': 'ダウンロードに失敗しました',

  // Zip progress
  'zip.progress': ({done, total}) => `パック中 ${done}/${total}`,

  // Unsaved warning
  'unsaved.warning': '未保存の変更があります',

  // Dashboard title
  'dashboard.title': 'ダッシュボード \u2014 NoteForAI',

  // Token display
  'token.copy': 'コピー',
};

// ======================== ko ========================
I18N._dict['ko'] = {
  // Common
  'copy': '복사',
  'copied': '복사됨',
  'cancel': '취소',
  'confirm': '확인',
  'delete': '삭제',
  'save': '저장',
  'saved': '저장됨',
  'loading': '로딩 중...',
  'failed': '실패',
  'close': '닫기',
  'back': '뒤로',
  'restore': '복원',
  'search': '검색',
  'export': '내보내기',
  'noResults': '결과 없음',
  'create': '만들기',
  'open': '열기',
  'download': '다운로드',
  'enter': '입장',

  // Page meta
  'page.title': 'NoteForAI \u2014 AI 전용 노트북',
  'page.description': 'NoteForAI: AI를 위해 만들어진 노트 시스템. API: POST /{token}/{action}. HTTP + MCP, Git 버전 관리, 전문 검색 지원. 내 데이터, 내 통제.',

  // Nav
  'nav.start': '시작하기',
  'nav.integration': '연동',
  'nav.features': '기능',
  'nav.api': 'API',
  'nav.dashboard': '대시보드',

  // Hero
  'hero.badge': 'Git 버전 관리 + 내보내기 지원',
  'hero.title': 'AI 전용<br>노트북',
  'hero.subtitle': 'AI를 바꿔도 기억은 유지 · 변경사항 언제든 되돌리기 · 언제든 내보내기',
  'hero.techLine': 'HTTP + MCP 듀얼 프로토콜 · Git 버전 관리 · 전문 검색 · 하나의 토큰으로 모든 AI 연결',
  'hero.cta.create': '무료 토큰 만들기',
  'hero.cta.dashboard': '대시보드',

  // Before/After cards
  'hero.before.label': '❌ NoteForAI 없이',
  'hero.before.user': '사용자: 저는 AI 제품을 개발하고, 미니멀 스타일을 선호한다고 말했는데요...',
  'hero.before.ai': 'AI: 죄송합니다, 이전 대화 기록이 없습니다. 다시 자기소개를 해주시겠어요?',
  'hero.before.note': '매번 자기소개를 다시 해야 함',
  'hero.after.label': '✔ NoteForAI 있이',
  'hero.after.user': '사용자: 이 디자인을 개선해 주세요',
  'hero.after.ai': 'AI: 물론이죠! 미니멀 스타일 선호와 NoteForAI 리팩토링 프로젝트를 바탕으로, 제안드리면...',
  'hero.after.note': '모든 것을 기억하는 오랜 친구처럼',

  // AI compat
  'compat.title': '사용 중인 모든 AI 도구와 호환',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 통이/원신',
  'compat.any': '+ 기타 모든 AI 도구',
  'compat.note': '플랫폼 종속 없음 · AI 도구를 바꿔도 기억 유지 · 범용 HTTP API',

  // Steps
  'steps.title': '3단계로 시작하기',
  'steps.subtitle': '5분 설정으로 AI에게 영구 기억 부여',
  'steps.1.title': '토큰 만들기',
  'steps.1.desc': '원클릭 생성 — 가입 불필요, 즉시 사용 가능',
  'steps.2.title': 'AI에 프롬프트 복사',
  'steps.2.desc': '완전한 시스템 프롬프트 자동 생성 — AI 설정에 붙여넣기만 하면 됨',
  'steps.3.title': '대화 시작',
  'steps.3.desc': 'AI가 자동으로 기억 — 다음 대화도 이어서 시작',

  // Integration
  'integration.title': '연동 방법',
  'integration.subtitle': '프롬프트 복붙 · MCP 원클릭 설정 · API 직접 접근',
  'integration.tab.prompt': 'AI 프롬프트',
  'integration.tab.mcp': 'MCP 설정',
  'integration.tab.curl': 'curl 예시',
  'integration.hint.prompt': '토큰 생성 후 실제 API 엔드포인트와 토큰이 자동 입력됩니다 — 바로 복사해서 사용 가능',
  'integration.hint.mcp': 'Claude Desktop / Cursor / Windsurf 등에 사용 가능. Streamable HTTP 원격 연결 — 클라이언트 설치 불필요, URL의 토큰만 교체',
  'integration.hint.curl': '모든 엔드포인트는 GET(쿼리 파라미터)과 POST(JSON 바디) 모두 지원',

  // AI behavior
  'aiBehavior.title': '설정 후 AI는 어떻게 동작하나요?',
  'aiBehavior.subtitle': '각 대화 시작 시 AI가 실제로 하는 일',
  'aiBehavior.sessionStart': 'AI 대화 시작',
  'aiBehavior.treeComment': '// 기억 구조 확인',
  'aiBehavior.treeOutput': '개인/\n  프로필.md\n  설정/\n업무/\n  프로젝트A/',
  'aiBehavior.readCall': 'read("개인/프로필.md")',
  'aiBehavior.readComment': '// 필요에 따라 읽기',
  'aiBehavior.greeting': '안녕하세요! 미니멀 스타일을 선호하시고 NoteForAI 리팩토링 작업을 하고 계셨죠. 계속할까요?',
  'aiBehavior.userLabel': '나',
  'aiBehavior.userNote': '대화 중 가치 있는 정보는 AI가 자동으로 <code class="text-indigo-500 text-xs">write()</code>하여 노트에 저장합니다',

  // Features
  'features.title': 'AI 노트를 위해 설계됨',
  'features.subtitle': 'AI가 정보를 더 잘 관리하고 활용할 수 있도록 세부적으로 설계',
  'features.storage.title': '영구 저장',
  'features.storage.desc': '노트가 대화를 넘어 영구 저장 — AI가 언제든 불러옴, 절대 잊지 않음',
  'features.search.title': '전문 검색',
  'features.search.desc': 'CJK + 영어 토크나이징, 밀리초 단위 검색, 어떤 정보도 즉시 찾기',
  'features.hierarchy.title': '디렉토리 계층',
  'features.hierarchy.desc': '폴더 기반 경로 — AI가 자율적으로 구조 정리, 깔끔하고 체계적',
  'features.git.title': 'Git 버전 보호',
  'features.git.desc': '편집 시마다 자동 스냅샷 — 삭제도 복원 가능, 전체 이력 롤백',
  'features.export.title': '원클릭 내보내기',
  'features.export.desc': 'ZIP / JSON / Markdown — 언제든 이전 가능, 종속 없음',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': '듀얼 프로토콜 — Claude Code용 네이티브 MCP, 범용 HTTP 접근',
  'features.token.title': '토큰 격리',
  'features.token.desc': '각 토큰은 독립적인 공간 — 계정 불필요, 완전한 프라이버시',
  'features.ui.title': '관리 대시보드',
  'features.ui.desc': '파일 매니저 스타일 Web UI — 탐색, 편집, 검색, 버전 롤백',
  'features.selfhost.title': '셀프 호스팅 가능',
  'features.selfhost.desc': 'Go 단일 바이너리, Docker 원클릭 배포 — 완전한 데이터 주권',

  // API table
  'api.title': 'API 레퍼런스',
  'api.subtitle.pre': '형식: ',
  'api.subtitle.post': ' + JSON 바디, GET 쿼리 파라미터도 지원',
  'api.col.op': '액션',
  'api.col.desc': '설명',
  'api.col.params': '파라미터',
  'api.write': '만들기 또는 덮어쓰기',
  'api.append': '내용 추가',
  'api.read': '노트 읽기',
  'api.search': '전문 검색',
  'api.tree': '디렉토리 트리',
  'api.history': '버전 이력',
  'api.delete': '삭제 (휴지통으로)',

  // Data sovereignty
  'data.title': '내 데이터는 항상 내 것',
  'data.subtitle': '다른 플랫폼의 블랙박스 기억과 달리, NoteForAI는 데이터에 대한 완전한 통제권을 제공합니다',
  'data.transparent.title': '완전한 투명성',
  'data.transparent.desc': '대시보드에서 모든 노트 내용 확인 — 블랙박스 없음, 모두 가시적',
  'data.export.title': '언제든 내보내기',
  'data.export.desc': 'Markdown, ZIP, JSON으로 모든 노트를 원클릭 내보내기 — 자유롭게 이전, 플랫폼 종속 없음',
  'data.version.title': '버전 롤백',
  'data.version.desc': 'Git 기반 버전 관리 — 모든 편집 추적, 삭제 복원 가능, 30일 전체 이력',

  // Email
  'email.title': '설정을 이메일로 보내기',
  'email.desc': '토큰, 프롬프트, 설정 가이드를 받은 편지함에 안전하게 보관',
  'email.placeholder': 'your@email.com',
  'email.send': '보내기',
  'email.sent': '✓ 전송됨! 받은 편지함을 확인하세요',
  'email.hint': '로컬 이메일 클라이언트를 통해 전송, 서버를 거치지 않음',
  'email.subject': 'NoteForAI 설정 가이드',

  // Footer
  'footer.tagline': 'AI를 위한 노트북',
  'footer.dashboard': '대시보드',

  // Modal step1
  'modal.step1.heading': '나만의 토큰',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': '이 토큰을 안전하게 보관하세요 — 노트 공간의 유일한 열쇠입니다.',
  'modal.step1.next': '다음: AI 설정하기 →',

  // Modal step2
  'modal.step2.heading': 'AI 설정하기',
  'modal.step2.copyPrompt': '프롬프트 복사',
  'modal.step2.emailBtn': '✉️ 이메일로 보내기',
  'modal.step2.dashboard': '대시보드로 이동 →',

  // Sidebar
  'sidebar.folders': '폴더',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': '휴지통',
  'sidebar.rootDir': '루트',
  'sidebar.noFolders': '폴더 없음',

  // Folder view
  'folder.new': '새로 만들기',
  'folder.history': '이력',
  'folder.deleteFolder': '폴더 삭제',
  'folder.empty': '빈 폴더',
  'folder.emptyHint': '+ 새 노트',
  'folder.itemCount': ({count}) => `${count}개`,

  // File view
  'file.preview': '미리보기',
  'file.edit': '편집',
  'file.save': '저장',
  'file.saved': '저장됨',
  'file.history': '이력',
  'file.append': '추가',
  'file.delete': '삭제',
  'file.loading': '로딩 중...',
  'file.loadFailed': '로드 실패',

  // Version history panel
  'version.title': '버전 이력',
  'version.current': '현재',
  'version.diff': '차이',
  'version.restore': '복원',
  'version.loading': '로딩 중...',
  'version.empty': '이력 없음',
  'version.loadFailed': '로드 실패',

  // Diff panel
  'diff.title': '차이 상세',
  'diff.back': '←',
  'diff.loading': '로딩 중...',
  'diff.noDiff': '차이 없음',
  'diff.loadFailed': '로드 실패',

  // Config panel
  'config.title': '연동 설정',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'AI 프롬프트',
  'config.mcpLabel': 'MCP 설정',
  'config.dangerLabel': '위험 구역',
  'config.destroy': '이 토큰 삭제',

  // Recycle bin modal
  'recycle.title': '휴지통',
  'recycle.empty': '휴지통이 비어 있습니다',
  'recycle.restoreAll': ({count}) => `폴더 전체 복원 (${count})`,
  'recycle.close': '닫기',
  'recycle.loading': '로딩 중...',
  'recycle.loadFailed': '로드 실패',

  // New note modal
  'newNote.title': '새 노트',

  // Append modal
  'appendModal.title': '내용 추가',

  // Token input modal
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': '토큰을 입력하여 대시보드에 접근',
  'tokenModal.error': '유효하지 않은 토큰',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': '홈',
  'tokenModal.enter': '입장',

  // Export dropdown
  'export.zip': '전체 다운로드 (.zip)',
  'export.json': 'JSON 내보내기',

  // Context menu - file
  'ctx.view': '보기',
  'ctx.edit': '편집',
  'ctx.append': '추가',
  'ctx.copyPath': '경로 복사',
  'ctx.download': '다운로드',
  'ctx.delete': '삭제',
  // Context menu - folder
  'ctx.open': '열기',
  'ctx.newNote': '새 노트',
  'ctx.history': '버전 이력',
  'ctx.downloadZip': '다운로드 (.zip)',
  'ctx.deleteFolder': '폴더 삭제',

  // Search
  'search.placeholder': '노트 검색...',
  'search.searching': '검색 중...',
  'search.noResults': '결과 없음',

  // Time formatting
  'time.justNow': '방금 전',
  'time.minutesAgo': ({n}) => `${n}분 전`,
  'time.hoursAgo': ({n}) => `${n}시간 전`,
  'time.yesterday': '어제',

  // Confirm/alert texts
  'confirm.unsavedLeave': '저장하지 않은 변경사항이 있습니다. 그래도 이동하시겠어요?',
  'confirm.deleteItem': ({path}) => `"${path}"을(를) 삭제하시겠습니까?`,
  'confirm.deleteFolder': ({path}) => `폴더 "${path}"와 모든 내용을 삭제하시겠습니까?`,
  'confirm.revert': ({path}) => `"${path}"을(를) 이 버전으로 복원하시겠습니까?`,
  'confirm.restoreBatch': ({count}) => `이 폴더의 모든 ${count}개 파일을 복원하시겠습니까?`,
  'confirm.destroy1': '이 토큰을 삭제하시겠습니까? 모든 데이터가 삭제됩니다!',
  'confirm.destroy2': '다시 확인: 되돌릴 수 없습니다!',
  'alert.saveFailed': '저장 실패',
  'alert.restoreFailed': '복원 실패',
  'alert.noFiles': '파일 없음',
  'alert.emptyFolder': '빈 폴더',
  'alert.downloadFailed': '다운로드 실패',

  // Zip progress
  'zip.progress': ({done, total}) => `압축 중 ${done}/${total}`,

  // Unsaved warning
  'unsaved.warning': '저장하지 않은 변경사항이 있습니다',

  // Dashboard title
  'dashboard.title': '대시보드 \u2014 NoteForAI',

  // Token display
  'token.copy': '복사',
};

// ======================== zh-TW ========================
I18N._dict['zh-TW'] = {
  // Common
  'copy': '複製',
  'copied': '已複製',
  'cancel': '取消',
  'confirm': '確認',
  'delete': '刪除',
  'save': '儲存',
  'saved': '已儲存',
  'loading': '載入中...',
  'failed': '失敗',
  'close': '關閉',
  'back': '返回',
  'restore': '還原',
  'search': '搜尋',
  'export': '匯出',
  'noResults': '無結果',
  'create': '建立',
  'open': '開啟',
  'download': '下載',
  'enter': '進入',

  // Page meta
  'page.title': 'NoteForAI \u2014 給 AI 一個專屬筆記本',
  'page.description': 'NoteForAI：AI 專屬筆記系統。API：POST /{token}/{action}。支援 HTTP + MCP、Git 版本管理、全文搜尋。資料完全屬於你。',

  // Nav
  'nav.start': '上手',
  'nav.integration': '接入',
  'nav.features': '功能',
  'nav.api': 'API',
  'nav.dashboard': '管理面板',

  // Hero
  'hero.badge': '現已支援 Git 版本保護 + 匯出',
  'hero.title': '給 AI 一個<br>專屬筆記本',
  'hero.subtitle': '換 AI 不換記憶 · 改了能撤回 · 資料隨時帶走',
  'hero.techLine': 'HTTP + MCP 雙協議 · Git 版本保護 · 全文搜尋 · 一個 Token 接入任意 AI',
  'hero.cta.create': '免費建立 Token',
  'hero.cta.dashboard': '管理面板',

  // Before/After cards
  'hero.before.label': '❌ 沒有 NoteForAI',
  'hero.before.user': '使用者：我是做 AI 產品的，上次說過我偏好簡潔風格...',
  'hero.before.ai': 'AI：抱歉，我沒有上次對話的記錄。能再介紹一下您的背景嗎？',
  'hero.before.note': '每次對話都要重新介紹自己',
  'hero.after.label': '✔ 有 NoteForAI',
  'hero.after.user': '使用者：幫我優化一下這個設計',
  'hero.after.ai': 'AI：好的！根據你之前說的偏好簡潔風格，以及你正在做的 NoteForAI 重構專案，我建議...',
  'hero.after.note': '像老朋友一樣，記得你的一切',

  // AI compat
  'compat.title': '相容你正在使用的任何 AI 工具',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 通義/文心',
  'compat.any': '+ 任意 AI 工具',
  'compat.note': '不綁定平台 · 換 AI 工具不換記憶 · HTTP 介面通用',

  // Steps
  'steps.title': '三步上手',
  'steps.subtitle': '5 分鐘完成接入，立即讓 AI 擁有記憶',
  'steps.1.title': '建立 Token',
  'steps.1.desc': '點擊上方按鈕一鍵生成，無需註冊，立即可用',
  'steps.2.title': '複製提示詞到 AI',
  'steps.2.desc': '建立後自動生成完整提示詞，複製貼上到 AI 系統提示即可',
  'steps.3.title': '開始對話',
  'steps.3.desc': 'AI 自動記憶，下次對話直接回顧，像老朋友一樣',

  // Integration
  'integration.title': '接入方式',
  'integration.subtitle': '提示詞複製即用 · MCP 一鍵設定 · API 直接呼叫',
  'integration.tab.prompt': 'AI 提示詞',
  'integration.tab.mcp': 'MCP 設定',
  'integration.tab.curl': 'curl 範例',
  'integration.hint.prompt': '建立 Token 後，提示詞會自動填入你的真實介面地址和 Token，零修改直接複製使用',
  'integration.hint.mcp': '適用於 Claude Desktop / Cursor / Windsurf 等。Streamable HTTP 遠端連線，無需安裝客戶端，替換 URL 中的 token 即可',
  'integration.hint.curl': '所有介面支援 GET（query param）和 POST（JSON body）兩種方式',

  // AI behavior
  'aiBehavior.title': '設定後 AI 會怎麼工作？',
  'aiBehavior.subtitle': '以下是 AI 在對話開始時的真實行為',
  'aiBehavior.sessionStart': 'AI 對話開始',
  'aiBehavior.treeComment': '// 回顧記憶結構',
  'aiBehavior.treeOutput': '個人/\n  基本資料.md\n  偏好/\n工作/\n  專案A/',
  'aiBehavior.readCall': 'read("個人/基本資料.md")',
  'aiBehavior.readComment': '// 按需讀取',
  'aiBehavior.greeting': '你好！我記得你偏好簡潔風格，上次在做 NoteForAI 的重構。今天要繼續嗎？',
  'aiBehavior.userLabel': '你',
  'aiBehavior.userNote': '對話中任何有價值的資訊，AI 會自動 <code class="text-indigo-500 text-xs">write()</code> 儲存到筆記',

  // Features
  'features.title': '為 AI 筆記原生設計',
  'features.subtitle': '每個細節都在讓 AI 更好地管理和使用你的資訊',
  'features.storage.title': '持久儲存',
  'features.storage.desc': '筆記跨對話永久儲存，AI 隨時調取，永不遺忘',
  'features.search.title': '全文搜尋',
  'features.search.desc': '中英文分詞，毫秒級檢索，精準定位任何資訊',
  'features.hierarchy.title': '目錄層級',
  'features.hierarchy.desc': '資料夾式路徑分層，AI 自主管理結構，清晰有序',
  'features.git.title': 'Git 版本保護',
  'features.git.desc': '每次修改自動快照，誤刪可恢復，完整歷史回溯',
  'features.export.title': '一鍵匯出',
  'features.export.desc': 'ZIP / JSON / Markdown，隨時遷移，不被鎖定',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': '雙協議支援，Claude Code MCP 原生整合，HTTP 通用接入',
  'features.token.title': 'Token 隔離',
  'features.token.desc': '每個 Token 獨立空間，無需帳號，完全私密',
  'features.ui.title': '管理面板',
  'features.ui.desc': '檔案管理器式 Web UI，瀏覽、編輯、搜尋、版本回溯',
  'features.selfhost.title': '可自部署',
  'features.selfhost.desc': 'Go 單檔案編譯，Docker 一鍵部署，資料主權完全在手',

  // API table
  'api.title': 'API 參考',
  'api.subtitle.pre': '格式：',
  'api.subtitle.post': ' + JSON body，也支援 GET query param',
  'api.col.op': '操作',
  'api.col.desc': '說明',
  'api.col.params': '參數',
  'api.write': '新建或覆蓋',
  'api.append': '追加內容',
  'api.read': '讀取筆記',
  'api.search': '全文搜尋',
  'api.tree': '目錄樹',
  'api.history': '版本歷史',
  'api.delete': '刪除（入回收桶）',

  // Data sovereignty
  'data.title': '你的資料，永遠屬於你',
  'data.subtitle': '不同於其他平台的黑盒記憶，NoteForAI 讓你對資料擁有完全的控制權',
  'data.transparent.title': '完全透明',
  'data.transparent.desc': '管理面板中可查看所有筆記內容，沒有任何黑盒，資料完全可見',
  'data.export.title': '隨時匯出',
  'data.export.desc': '一鍵匯出全部筆記為 Markdown、ZIP 或 JSON，隨時遷移，不被平台綁架',
  'data.version.title': '版本回溯',
  'data.version.desc': 'Git 驅動版本管理，每次修改留痕，誤刪可恢復，30 天歷史完整儲存',

  // Email
  'email.title': '設定發送到信箱',
  'email.desc': 'Token、提示詞、接入指南一鍵發送，隨時找回',
  'email.placeholder': 'your@email.com',
  'email.send': '發送',
  'email.sent': '✓ 已發送！請檢查信箱',
  'email.hint': '透過本機郵件客戶端發送，不經過伺服器',
  'email.subject': 'NoteForAI 接入設定',

  // Footer
  'footer.tagline': 'AI 專屬筆記本',
  'footer.dashboard': '管理面板',

  // Modal step1
  'modal.step1.heading': '你的專屬 Token',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': '妥善保存此 Token，它是你筆記空間的唯一憑證。',
  'modal.step1.next': '下一步：設定 AI →',

  // Modal step2
  'modal.step2.heading': '設定到 AI',
  'modal.step2.copyPrompt': '複製提示詞',
  'modal.step2.emailBtn': '✉️ 發到信箱',
  'modal.step2.dashboard': '進入管理面板 →',

  // Sidebar
  'sidebar.folders': '資料夾',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': '回收桶',
  'sidebar.rootDir': '根目錄',
  'sidebar.noFolders': '無資料夾',

  // Folder view
  'folder.new': '新建',
  'folder.history': '歷史',
  'folder.deleteFolder': '刪除資料夾',
  'folder.empty': '空資料夾',
  'folder.emptyHint': '+ 新建筆記',
  'folder.itemCount': ({count}) => `${count} 項`,

  // File view
  'file.preview': '預覽',
  'file.edit': '編輯',
  'file.save': '儲存',
  'file.saved': '已儲存',
  'file.history': '歷史',
  'file.append': '追加',
  'file.delete': '刪除',
  'file.loading': '載入中...',
  'file.loadFailed': '載入失敗',

  // Version history panel
  'version.title': '版本歷史',
  'version.current': '目前',
  'version.diff': '差異',
  'version.restore': '還原',
  'version.loading': '載入中...',
  'version.empty': '暫無記錄',
  'version.loadFailed': '載入失敗',

  // Diff panel
  'diff.title': '變更詳情',
  'diff.back': '←',
  'diff.loading': '載入中...',
  'diff.noDiff': '無差異',
  'diff.loadFailed': '載入失敗',

  // Config panel
  'config.title': '接入設定',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'AI 提示詞',
  'config.mcpLabel': 'MCP 設定',
  'config.dangerLabel': '危險操作',
  'config.destroy': '銷毀此 Token',

  // Recycle bin modal
  'recycle.title': '回收桶',
  'recycle.empty': '回收桶為空',
  'recycle.restoreAll': ({count}) => `還原此資料夾全部 (${count})`,
  'recycle.close': '關閉',
  'recycle.loading': '載入中...',
  'recycle.loadFailed': '載入失敗',

  // New note modal
  'newNote.title': '新建筆記',

  // Append modal
  'appendModal.title': '追加內容',

  // Token input modal
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': '輸入 Token 進入管理面板',
  'tokenModal.error': 'Token 無效',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': '首頁',
  'tokenModal.enter': '進入',

  // Export dropdown
  'export.zip': '打包下載全部 (.zip)',
  'export.json': '匯出 JSON',

  // Context menu - file
  'ctx.view': '查看',
  'ctx.edit': '編輯',
  'ctx.append': '追加內容',
  'ctx.copyPath': '複製路徑',
  'ctx.download': '下載',
  'ctx.delete': '刪除',
  // Context menu - folder
  'ctx.open': '開啟',
  'ctx.newNote': '新建筆記',
  'ctx.history': '版本歷史',
  'ctx.downloadZip': '下載 (.zip)',
  'ctx.deleteFolder': '刪除資料夾',

  // Search
  'search.placeholder': '搜尋筆記...',
  'search.searching': '搜尋中...',
  'search.noResults': '無結果',

  // Time formatting
  'time.justNow': '剛剛',
  'time.minutesAgo': ({n}) => `${n} 分鐘前`,
  'time.hoursAgo': ({n}) => `${n} 小時前`,
  'time.yesterday': '昨天',

  // Confirm/alert texts
  'confirm.unsavedLeave': '有未儲存的修改，確認離開？',
  'confirm.deleteItem': ({path}) => `刪除「${path}」？`,
  'confirm.deleteFolder': ({path}) => `刪除整個資料夾「${path}」及其所有內容？`,
  'confirm.revert': ({path}) => `還原「${path}」到此版本？`,
  'confirm.restoreBatch': ({count}) => `還原此資料夾全部 ${count} 個檔案？`,
  'confirm.destroy1': '銷毀此 Token？所有資料將被刪除！',
  'confirm.destroy2': '再次確認：不可恢復！',
  'alert.saveFailed': '儲存失敗',
  'alert.restoreFailed': '還原失敗',
  'alert.noFiles': '沒有檔案',
  'alert.emptyFolder': '空資料夾',
  'alert.downloadFailed': '下載失敗',

  // Zip progress
  'zip.progress': ({done, total}) => `打包中 ${done}/${total}`,

  // Unsaved warning
  'unsaved.warning': '有未儲存的更改',

  // Dashboard title
  'dashboard.title': '管理面板 \u2014 NoteForAI',

  // Token display
  'token.copy': '複製',
};

// ======================== es ========================
I18N._dict['es'] = {
  // Common
  'copy': 'Copiar',
  'copied': 'Copiado',
  'cancel': 'Cancelar',
  'confirm': 'Confirmar',
  'delete': 'Eliminar',
  'save': 'Guardar',
  'saved': 'Guardado',
  'loading': 'Cargando...',
  'failed': 'Error',
  'close': 'Cerrar',
  'back': 'Volver',
  'restore': 'Restaurar',
  'search': 'Buscar',
  'export': 'Exportar',
  'noResults': 'Sin resultados',
  'create': 'Crear',
  'open': 'Abrir',
  'download': 'Descargar',
  'enter': 'Entrar',

  // Page
  'page.title': 'NoteForAI — Un Cuaderno Dedicado para IA',
  'page.description': 'NoteForAI: Un sistema de notas creado para IA. Memoria persistente entre conversaciones, búsqueda de texto completo, versionado Git y acceso mediante HTTP o MCP.',

  // Nav
  'nav.start': 'Inicio',
  'nav.integration': 'Integrar',
  'nav.features': 'Funciones',
  'nav.api': 'API',
  'nav.dashboard': 'Panel',

  // Hero
  'hero.badge': 'Ahora con versionado Git + exportación',
  'hero.title': 'Un Cuaderno<br>Dedicado para IA',
  'hero.subtitle': 'Cambia de IA sin perder memoria · Deshaz cualquier cambio · Exporta en cualquier momento',
  'hero.techLine': 'Protocolo dual HTTP + MCP · Versionado Git · Búsqueda de texto completo · Un token para cualquier IA',
  'hero.cta.create': 'Crear Token Gratis',
  'hero.cta.dashboard': 'Panel de Control',

  // Before/After
  'hero.before.label': '❌ Sin NoteForAI',
  'hero.before.user': 'Usuario: Trabajo en productos de IA, mencioné que prefiero un estilo minimalista...',
  'hero.before.ai': 'IA: Lo siento, no tengo registros de nuestra última conversación. ¿Podrías presentarte de nuevo?',
  'hero.before.note': 'Preséntate de nuevo en cada conversación',
  'hero.after.label': '✔ Con NoteForAI',
  'hero.after.user': 'Usuario: Ayúdame a mejorar este diseño',
  'hero.after.ai': 'IA: ¡Claro! Según tu preferencia por el estilo minimalista y tu proyecto de refactorización de NoteForAI, te sugiero...',
  'hero.after.note': 'Como un viejo amigo que recuerda todo',

  // Compat
  'compat.title': 'Compatible con cualquier herramienta de IA que uses',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Cualquier IA',
  'compat.note': 'Sin bloqueo de plataforma · Cambia de IA sin perder tu memoria · API HTTP universal',

  // Steps
  'steps.title': 'Empieza en 3 Pasos',
  'steps.subtitle': '5 minutos de configuración para dar a tu IA memoria persistente',
  'steps.1.title': 'Crea un Token',
  'steps.1.desc': 'Un clic para generar — sin registro, disponible de inmediato',
  'steps.2.title': 'Copia el Prompt a tu IA',
  'steps.2.desc': 'Se genera automáticamente un prompt completo — solo pégalo en la configuración de tu IA',
  'steps.3.title': 'Empieza a Chatear',
  'steps.3.desc': 'La IA recuerda automáticamente — la próxima conversación continúa justo donde la dejaste',

  // Integration
  'integration.title': 'Integración',
  'integration.subtitle': 'Prompt de copiar y pegar · Config MCP con un clic · Acceso directo a la API',
  'integration.tab.prompt': 'Prompt para IA',
  'integration.tab.mcp': 'Config MCP',
  'integration.tab.curl': 'Ejemplos curl',
  'integration.hint.prompt': 'Después de crear un token, el prompt se rellena automáticamente con tu endpoint y token real — cópialo y úsalo directamente',
  'integration.hint.mcp': 'Para Claude Desktop / Cursor / Windsurf, etc. Conexión remota Streamable HTTP — sin instalación en el cliente, solo reemplaza el token en la URL',
  'integration.hint.curl': 'Todos los endpoints admiten GET (parámetros de consulta) y POST (cuerpo JSON)',

  // AI behavior
  'aiBehavior.title': '¿Cómo se comporta la IA después de la configuración?',
  'aiBehavior.subtitle': 'Esto es lo que la IA hace realmente al comienzo de cada conversación',
  'aiBehavior.sessionStart': 'Conversación con IA comienza',
  'aiBehavior.treeComment': '// Revisar estructura de memoria',
  'aiBehavior.treeOutput': 'personal/\n  perfil.md\n  preferencias/\ntrabajo/\n  proyectoA/',
  'aiBehavior.readCall': 'read("personal/perfil.md")',
  'aiBehavior.readComment': '// Leer según sea necesario',
  'aiBehavior.greeting': '¡Hola! Recuerdo que prefieres un estilo minimalista y estabas trabajando en la refactorización de NoteForAI. ¿Continuamos?',
  'aiBehavior.userLabel': 'Tú',
  'aiBehavior.userNote': 'Cualquier información valiosa en la conversación — la IA guarda automáticamente con <code class="text-indigo-500 text-xs">write()</code>',

  // Features
  'features.title': 'Diseñado para Tomar Notas con IA',
  'features.subtitle': 'Cada detalle está diseñado para ayudar a la IA a gestionar y usar tu información mejor',
  'features.storage.title': 'Almacenamiento Persistente',
  'features.storage.desc': 'Notas guardadas permanentemente entre conversaciones — la IA recuerda en cualquier momento, nunca olvida',
  'features.search.title': 'Búsqueda de Texto Completo',
  'features.search.desc': 'Tokenización CJK + inglés, recuperación en milisegundos, localiza cualquier información',
  'features.hierarchy.title': 'Jerarquía de Directorios',
  'features.hierarchy.desc': 'Rutas basadas en carpetas — la IA organiza la estructura de forma autónoma, limpia y ordenada',
  'features.git.title': 'Protección de Versiones Git',
  'features.git.desc': 'Instantánea automática en cada edición — recupera eliminaciones, historial completo con reversión',
  'features.export.title': 'Exportación con Un Clic',
  'features.export.desc': 'ZIP / JSON / Markdown — migra en cualquier momento sin bloqueo de plataforma',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Protocolo dual — MCP nativo para Claude Code, HTTP para acceso universal',
  'features.token.title': 'Aislamiento por Token',
  'features.token.desc': 'Cada token tiene su propio espacio — sin cuentas necesarias, totalmente privado',
  'features.ui.title': 'Panel de Gestión',
  'features.ui.desc': 'UI web estilo gestor de archivos — navegar, editar, buscar, historial de versiones',
  'features.selfhost.title': 'Auto-alojable',
  'features.selfhost.desc': 'Binario Go único, Docker con un clic — soberanía total sobre tus datos',

  // API
  'api.title': 'Referencia de la API',
  'api.subtitle.pre': 'Formato: ',
  'api.subtitle.post': ' + cuerpo JSON, también admite parámetros GET',
  'api.col.op': 'Acción',
  'api.col.desc': 'Descripción',
  'api.col.params': 'Parámetros',
  'api.write': 'Crear o sobrescribir',
  'api.append': 'Añadir contenido',
  'api.read': 'Leer una nota',
  'api.search': 'Búsqueda de texto completo',
  'api.tree': 'Árbol de directorios',
  'api.history': 'Historial de versiones',
  'api.delete': 'Eliminar (a la papelera)',

  // Data
  'data.title': 'Tus Datos, Siempre Tuyos',
  'data.subtitle': 'A diferencia de la memoria opaca en otras plataformas, NoteForAI te da control total sobre tus datos',
  'data.transparent.title': 'Totalmente Transparente',
  'data.transparent.desc': 'Ve todos los contenidos de las notas en el panel — sin cajas negras, todo visible',
  'data.export.title': 'Exporta en Cualquier Momento',
  'data.export.desc': 'Exporta todas las notas con un clic como Markdown ZIP o JSON — migra libremente sin bloqueo',
  'data.version.title': 'Reversión de Versiones',
  'data.version.desc': 'Versionado con Git — cada edición registrada, eliminaciones recuperables, 30 días de historial completo',

  // Email
  'email.title': 'Envía tu Configuración por Email',
  'email.desc': 'Token, prompt y guía de configuración — enviado a tu bandeja de entrada para guardarlo',
  'email.placeholder': 'tu@email.com',
  'email.send': 'Enviar',
  'email.sent': '✓ ¡Enviado! Revisa tu bandeja de entrada',
  'email.hint': 'Enviado desde tu cliente de correo local, nunca a través de nuestro servidor',
  'email.subject': 'Guía de Configuración de NoteForAI',

  // Footer
  'footer.tagline': 'Un Cuaderno para IA',
  'footer.dashboard': 'Panel',

  // Modal
  'modal.step1.heading': 'Tu Token Exclusivo',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Guarda este token de forma segura — es la única llave a tu espacio de notas.',
  'modal.step1.next': 'Siguiente: Configurar IA →',
  'modal.step2.heading': 'Configura tu IA',
  'modal.step2.copyPrompt': 'Copiar Prompt',
  'modal.step2.emailBtn': '✉️ Enviarlo por Email',
  'modal.step2.dashboard': 'Ir al Panel →',

  // Dashboard sidebar
  'sidebar.folders': 'Carpetas',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Papelera',
  'sidebar.rootDir': 'Raíz',
  'sidebar.noFolders': 'Sin carpetas',

  // Folder
  'folder.new': 'Nuevo',
  'folder.history': 'Historial',
  'folder.deleteFolder': 'Eliminar Carpeta',
  'folder.empty': 'Carpeta vacía',
  'folder.emptyHint': '+ Nueva Nota',

  // File
  'file.preview': 'Vista previa',
  'file.edit': 'Editar',
  'file.save': 'Guardar',
  'file.saved': 'Guardado',
  'file.history': 'Historial',
  'file.append': 'Añadir',
  'file.delete': 'Eliminar',
  'file.loading': 'Cargando...',
  'file.loadFailed': 'Error al cargar',

  // Version
  'version.title': 'Historial de Versiones',
  'version.current': 'Actual',
  'version.diff': 'Diferencias',
  'version.restore': 'Restaurar',
  'version.loading': 'Cargando...',
  'version.empty': 'Sin historial',
  'version.loadFailed': 'Error al cargar',

  // Diff
  'diff.title': 'Detalles de Diferencias',
  'diff.back': '←',
  'diff.loading': 'Cargando...',
  'diff.noDiff': 'Sin diferencias',
  'diff.loadFailed': 'Error al cargar',

  // Config
  'config.title': 'Configuración de Integración',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'Prompt para IA',
  'config.mcpLabel': 'Config MCP',
  'config.dangerLabel': 'Zona de Peligro',
  'config.destroy': 'Destruir Este Token',

  // Recycle
  'recycle.title': 'Papelera de Reciclaje',
  'recycle.empty': 'La papelera está vacía',
  'recycle.close': 'Cerrar',
  'recycle.loading': 'Cargando...',
  'recycle.loadFailed': 'Error al cargar',

  // Modals
  'newNote.title': 'Nueva Nota',
  'appendModal.title': 'Añadir Contenido',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Ingresa el token para acceder al panel',
  'tokenModal.error': 'Token inválido',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Inicio',
  'tokenModal.enter': 'Entrar',

  // Export
  'export.zip': 'Descargar todo (.zip)',
  'export.json': 'Exportar JSON',

  // Context menu file
  'ctx.view': 'Ver',
  'ctx.edit': 'Editar',
  'ctx.append': 'Añadir',
  'ctx.copyPath': 'Copiar Ruta',
  'ctx.download': 'Descargar',
  'ctx.delete': 'Eliminar',

  // Context menu folder
  'ctx.open': 'Abrir',
  'ctx.newNote': 'Nueva Nota',
  'ctx.history': 'Historial de Versiones',
  'ctx.downloadZip': 'Descargar (.zip)',
  'ctx.deleteFolder': 'Eliminar Carpeta',

  // Search
  'search.placeholder': 'Buscar notas...',
  'search.searching': 'Buscando...',
  'search.noResults': 'Sin resultados',

  // Time
  'time.justNow': 'ahora mismo',
  'time.yesterday': 'ayer',

  // Confirms
  'confirm.unsavedLeave': '¿Tienes cambios sin guardar. ¿Salir de todas formas?',
  'confirm.destroy1': '¿Destruir este token? ¡Todos los datos serán eliminados!',
  'confirm.destroy2': '¡Confirma de nuevo: esto no se puede deshacer!',
  'alert.saveFailed': 'Error al guardar',
  'alert.restoreFailed': 'Error al restaurar',
  'alert.noFiles': 'Sin archivos',
  'alert.emptyFolder': 'Carpeta vacía',
  'alert.downloadFailed': 'Error al descargar',

  // Zip progress
  'zip.progress': ({done, total}) => `Empaquetando ${done}/${total}`,

  // Unsaved warning
  'unsaved.warning': 'Tienes cambios sin guardar',

  // Dashboard title
  'dashboard.title': 'Panel — NoteForAI',

  // Token display
  'token.copy': 'Copiar',

  // Function keys
  'folder.itemCount': ({count}) => `${count} elementos`,
  'time.minutesAgo': ({n}) => `hace ${n} min`,
  'time.hoursAgo': ({n}) => `hace ${n} horas`,
  'confirm.deleteItem': ({path}) => `¿Eliminar "${path}"?`,
  'confirm.deleteFolder': ({path}) => `¿Eliminar la carpeta "${path}" y todo su contenido?`,
  'confirm.revert': ({path}) => `¿Restaurar "${path}" a esta versión?`,
  'confirm.restoreBatch': ({count}) => `¿Restaurar los ${count} archivos de esta carpeta?`,
  'recycle.restoreAll': ({count}) => `Restaurar todo en la carpeta (${count})`,
};

// ======================== fr ========================
I18N._dict['fr'] = {
  // Common
  'copy': 'Copier',
  'copied': 'Copié',
  'cancel': 'Annuler',
  'confirm': 'Confirmer',
  'delete': 'Supprimer',
  'save': 'Enregistrer',
  'saved': 'Enregistré',
  'loading': 'Chargement...',
  'failed': 'Échec',
  'close': 'Fermer',
  'back': 'Retour',
  'restore': 'Restaurer',
  'search': 'Rechercher',
  'export': 'Exporter',
  'noResults': 'Aucun résultat',
  'create': 'Créer',
  'open': 'Ouvrir',
  'download': 'Télécharger',
  'enter': 'Entrer',

  // Page
  'page.title': 'NoteForAI — Un Carnet Dédié pour l\'IA',
  'page.description': 'NoteForAI : Un système de notes conçu pour l\'IA. Mémoire persistante entre les conversations, recherche plein texte, versioning Git et accès via HTTP ou MCP.',

  // Nav
  'nav.start': 'Démarrer',
  'nav.integration': 'Intégrer',
  'nav.features': 'Fonctionnalités',
  'nav.api': 'API',
  'nav.dashboard': 'Tableau de bord',

  // Hero
  'hero.badge': 'Désormais avec versioning Git + export',
  'hero.title': 'Un Carnet<br>Dédié pour l\'IA',
  'hero.subtitle': 'Changez d\'IA sans perdre la mémoire · Annulez tout changement · Exportez à tout moment',
  'hero.techLine': 'Double protocole HTTP + MCP · Versioning Git · Recherche plein texte · Un token pour toute IA',
  'hero.cta.create': 'Créer un Token Gratuit',
  'hero.cta.dashboard': 'Tableau de Bord',

  // Before/After
  'hero.before.label': '❌ Sans NoteForAI',
  'hero.before.user': 'Utilisateur : Je travaille sur des produits IA, j\'ai mentionné que je préfère un style minimaliste...',
  'hero.before.ai': 'IA : Désolé, je n\'ai pas de trace de notre dernière conversation. Pourriez-vous vous présenter à nouveau ?',
  'hero.before.note': 'Se présenter à chaque nouvelle conversation',
  'hero.after.label': '✔ Avec NoteForAI',
  'hero.after.user': 'Utilisateur : Aide-moi à améliorer ce design',
  'hero.after.ai': 'IA : Bien sûr ! D\'après votre préférence pour le style minimaliste et votre projet de refactorisation NoteForAI, je suggère...',
  'hero.after.note': 'Comme un vieil ami qui se souvient de tout',

  // Compat
  'compat.title': 'Compatible avec tous les outils d\'IA que vous utilisez',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Tout outil IA',
  'compat.note': 'Aucun verrouillage de plateforme · Changez d\'IA sans perdre votre mémoire · API HTTP universelle',

  // Steps
  'steps.title': 'Commencez en 3 Étapes',
  'steps.subtitle': '5 minutes de configuration pour donner une mémoire persistante à votre IA',
  'steps.1.title': 'Créez un Token',
  'steps.1.desc': 'Un clic pour générer — sans inscription, disponible instantanément',
  'steps.2.title': 'Copiez le Prompt dans votre IA',
  'steps.2.desc': 'Un prompt complet est généré automatiquement — collez-le simplement dans les paramètres de votre IA',
  'steps.3.title': 'Commencez à Chatter',
  'steps.3.desc': 'L\'IA mémorise automatiquement — la prochaine conversation reprend exactement là où vous vous étiez arrêté',

  // Integration
  'integration.title': 'Intégration',
  'integration.subtitle': 'Prompt copier-coller · Config MCP en un clic · Accès direct à l\'API',
  'integration.tab.prompt': 'Prompt IA',
  'integration.tab.mcp': 'Config MCP',
  'integration.tab.curl': 'Exemples curl',
  'integration.hint.prompt': 'Après la création d\'un token, le prompt est pré-rempli avec votre vrai endpoint et token — copiez et utilisez directement',
  'integration.hint.mcp': 'Pour Claude Desktop / Cursor / Windsurf, etc. Connexion distante Streamable HTTP — aucune installation côté client, remplacez simplement le token dans l\'URL',
  'integration.hint.curl': 'Tous les endpoints supportent GET (paramètres de requête) et POST (corps JSON)',

  // AI behavior
  'aiBehavior.title': 'Comment se comporte l\'IA après la configuration ?',
  'aiBehavior.subtitle': 'Voici ce que l\'IA fait réellement au début de chaque conversation',
  'aiBehavior.sessionStart': 'La conversation IA démarre',
  'aiBehavior.treeComment': '// Réviser la structure mémorielle',
  'aiBehavior.treeOutput': 'personnel/\n  profil.md\n  préférences/\ntravail/\n  projetA/',
  'aiBehavior.readCall': 'read("personnel/profil.md")',
  'aiBehavior.readComment': '// Lire selon les besoins',
  'aiBehavior.greeting': 'Bonjour ! Je me souviens que vous préférez un style minimaliste et que vous travailliez sur la refactorisation de NoteForAI. On continue ?',
  'aiBehavior.userLabel': 'Vous',
  'aiBehavior.userNote': 'Toute information précieuse dans la conversation — l\'IA enregistre automatiquement avec <code class="text-indigo-500 text-xs">write()</code>',

  // Features
  'features.title': 'Conçu pour la Prise de Notes IA',
  'features.subtitle': 'Chaque détail est conçu pour aider l\'IA à gérer et utiliser vos informations de manière optimale',
  'features.storage.title': 'Stockage Persistant',
  'features.storage.desc': 'Notes sauvegardées en permanence entre les conversations — l\'IA se souvient à tout moment, n\'oublie jamais',
  'features.search.title': 'Recherche Plein Texte',
  'features.search.desc': 'Tokenisation CJK + anglais, récupération en millisecondes, localisez n\'importe quelle information',
  'features.hierarchy.title': 'Hiérarchie de Répertoires',
  'features.hierarchy.desc': 'Chemins basés sur des dossiers — l\'IA organise la structure de façon autonome, propre et ordonnée',
  'features.git.title': 'Protection des Versions Git',
  'features.git.desc': 'Instantané automatique à chaque modification — récupérez les suppressions, historique complet avec retour arrière',
  'features.export.title': 'Export en Un Clic',
  'features.export.desc': 'ZIP / JSON / Markdown — migrez à tout moment sans verrouillage de plateforme',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Double protocole — MCP natif pour Claude Code, HTTP pour un accès universel',
  'features.token.title': 'Isolation par Token',
  'features.token.desc': 'Chaque token a son propre espace — aucun compte nécessaire, totalement privé',
  'features.ui.title': 'Tableau de Bord de Gestion',
  'features.ui.desc': 'Interface web style gestionnaire de fichiers — parcourir, modifier, rechercher, historique des versions',
  'features.selfhost.title': 'Auto-hébergeable',
  'features.selfhost.desc': 'Binaire Go unique, Docker en un clic — souveraineté totale sur vos données',

  // API
  'api.title': 'Référence API',
  'api.subtitle.pre': 'Format : ',
  'api.subtitle.post': ' + corps JSON, supporte aussi les paramètres GET',
  'api.col.op': 'Action',
  'api.col.desc': 'Description',
  'api.col.params': 'Paramètres',
  'api.write': 'Créer ou écraser',
  'api.append': 'Ajouter du contenu',
  'api.read': 'Lire une note',
  'api.search': 'Recherche plein texte',
  'api.tree': 'Arborescence de répertoires',
  'api.history': 'Historique des versions',
  'api.delete': 'Supprimer (vers la corbeille)',

  // Data
  'data.title': 'Vos Données, Toujours les Vôtres',
  'data.subtitle': 'Contrairement à la mémoire opaque sur d\'autres plateformes, NoteForAI vous donne un contrôle total sur vos données',
  'data.transparent.title': 'Entièrement Transparent',
  'data.transparent.desc': 'Visualisez tous les contenus des notes dans le tableau de bord — pas de boîtes noires, tout est visible',
  'data.export.title': 'Exportez à Tout Moment',
  'data.export.desc': 'Exportez toutes les notes en un clic en Markdown ZIP ou JSON — migrez librement sans verrouillage',
  'data.version.title': 'Retour aux Versions Précédentes',
  'data.version.desc': 'Versioning avec Git — chaque modification enregistrée, suppressions récupérables, 30 jours d\'historique complet',

  // Email
  'email.title': 'Envoyez votre Config par Email',
  'email.desc': 'Token, prompt et guide de configuration — envoyé dans votre boîte de réception pour la conserver',
  'email.placeholder': 'votre@email.com',
  'email.send': 'Envoyer',
  'email.sent': '✓ Envoyé ! Vérifiez votre boîte de réception',
  'email.hint': 'Envoyé via votre client email local, jamais via notre serveur',
  'email.subject': 'Guide de Configuration NoteForAI',

  // Footer
  'footer.tagline': 'Un Carnet pour l\'IA',
  'footer.dashboard': 'Tableau de Bord',

  // Modal
  'modal.step1.heading': 'Votre Token Exclusif',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Conservez ce token en sécurité — c\'est la seule clé de votre espace de notes.',
  'modal.step1.next': 'Suivant : Configurer l\'IA →',
  'modal.step2.heading': 'Configurez votre IA',
  'modal.step2.copyPrompt': 'Copier le Prompt',
  'modal.step2.emailBtn': '✉️ L\'envoyer par Email',
  'modal.step2.dashboard': 'Aller au Tableau de Bord →',

  // Dashboard sidebar
  'sidebar.folders': 'Dossiers',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Corbeille',
  'sidebar.rootDir': 'Racine',
  'sidebar.noFolders': 'Aucun dossier',

  // Folder
  'folder.new': 'Nouveau',
  'folder.history': 'Historique',
  'folder.deleteFolder': 'Supprimer le Dossier',
  'folder.empty': 'Dossier vide',
  'folder.emptyHint': '+ Nouvelle Note',

  // File
  'file.preview': 'Aperçu',
  'file.edit': 'Modifier',
  'file.save': 'Enregistrer',
  'file.saved': 'Enregistré',
  'file.history': 'Historique',
  'file.append': 'Ajouter',
  'file.delete': 'Supprimer',
  'file.loading': 'Chargement...',
  'file.loadFailed': 'Échec du chargement',

  // Version
  'version.title': 'Historique des Versions',
  'version.current': 'Actuel',
  'version.diff': 'Différences',
  'version.restore': 'Restaurer',
  'version.loading': 'Chargement...',
  'version.empty': 'Aucun historique',
  'version.loadFailed': 'Échec du chargement',

  // Diff
  'diff.title': 'Détails des Différences',
  'diff.back': '←',
  'diff.loading': 'Chargement...',
  'diff.noDiff': 'Aucune différence',
  'diff.loadFailed': 'Échec du chargement',

  // Config
  'config.title': 'Configuration d\'Intégration',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'Prompt IA',
  'config.mcpLabel': 'Config MCP',
  'config.dangerLabel': 'Zone Dangereuse',
  'config.destroy': 'Détruire ce Token',

  // Recycle
  'recycle.title': 'Corbeille',
  'recycle.empty': 'La corbeille est vide',
  'recycle.close': 'Fermer',
  'recycle.loading': 'Chargement...',
  'recycle.loadFailed': 'Échec du chargement',

  // Modals
  'newNote.title': 'Nouvelle Note',
  'appendModal.title': 'Ajouter du Contenu',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Entrez le token pour accéder au tableau de bord',
  'tokenModal.error': 'Token invalide',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Accueil',
  'tokenModal.enter': 'Entrer',

  // Export
  'export.zip': 'Tout télécharger (.zip)',
  'export.json': 'Exporter JSON',

  // Context menu file
  'ctx.view': 'Voir',
  'ctx.edit': 'Modifier',
  'ctx.append': 'Ajouter',
  'ctx.copyPath': 'Copier le Chemin',
  'ctx.download': 'Télécharger',
  'ctx.delete': 'Supprimer',

  // Context menu folder
  'ctx.open': 'Ouvrir',
  'ctx.newNote': 'Nouvelle Note',
  'ctx.history': 'Historique des Versions',
  'ctx.downloadZip': 'Télécharger (.zip)',
  'ctx.deleteFolder': 'Supprimer le Dossier',

  // Search
  'search.placeholder': 'Rechercher des notes...',
  'search.searching': 'Recherche en cours...',
  'search.noResults': 'Aucun résultat',

  // Time
  'time.justNow': 'à l\'instant',
  'time.yesterday': 'hier',

  // Confirms
  'confirm.unsavedLeave': 'Vous avez des modifications non enregistrées. Partir quand même ?',
  'confirm.destroy1': 'Détruire ce token ? Toutes les données seront supprimées !',
  'confirm.destroy2': 'Confirmez à nouveau : cette action est irréversible !',
  'alert.saveFailed': 'Échec de l\'enregistrement',
  'alert.restoreFailed': 'Échec de la restauration',
  'alert.noFiles': 'Aucun fichier',
  'alert.emptyFolder': 'Dossier vide',
  'alert.downloadFailed': 'Échec du téléchargement',

  // Zip progress
  'zip.progress': ({done, total}) => `Compression ${done}/${total}`,

  // Unsaved warning
  'unsaved.warning': 'Vous avez des modifications non enregistrées',

  // Dashboard title
  'dashboard.title': 'Tableau de Bord — NoteForAI',

  // Token display
  'token.copy': 'Copier',

  // Function keys
  'folder.itemCount': ({count}) => `${count} élément${count > 1 ? 's' : ''}`,
  'time.minutesAgo': ({n}) => `il y a ${n} min`,
  'time.hoursAgo': ({n}) => `il y a ${n} heure${n > 1 ? 's' : ''}`,
  'confirm.deleteItem': ({path}) => `Supprimer "${path}" ?`,
  'confirm.deleteFolder': ({path}) => `Supprimer le dossier "${path}" et tout son contenu ?`,
  'confirm.revert': ({path}) => `Restaurer "${path}" à cette version ?`,
  'confirm.restoreBatch': ({count}) => `Restaurer les ${count} fichiers de ce dossier ?`,
  'recycle.restoreAll': ({count}) => `Tout restaurer dans le dossier (${count})`,
};

// ======================== de ========================
I18N._dict['de'] = {
  // Common
  'copy': 'Kopieren',
  'copied': 'Kopiert',
  'cancel': 'Abbrechen',
  'confirm': 'Bestätigen',
  'delete': 'Löschen',
  'save': 'Speichern',
  'saved': 'Gespeichert',
  'loading': 'Laden...',
  'failed': 'Fehlgeschlagen',
  'close': 'Schließen',
  'back': 'Zurück',
  'restore': 'Wiederherstellen',
  'search': 'Suchen',
  'export': 'Exportieren',
  'noResults': 'Keine Ergebnisse',
  'create': 'Erstellen',
  'open': 'Öffnen',
  'download': 'Herunterladen',
  'enter': 'Eingeben',

  // Page
  'page.title': 'NoteForAI — Ein Dediziertes Notizbuch für KI',
  'page.description': 'NoteForAI: Ein Notizensystem für KI. Persistentes Gedächtnis über Gespräche hinweg, Volltextsuche, Git-Versionierung und Zugriff über HTTP oder MCP.',

  // Nav
  'nav.start': 'Start',
  'nav.integration': 'Integrieren',
  'nav.features': 'Funktionen',
  'nav.api': 'API',
  'nav.dashboard': 'Dashboard',

  // Hero
  'hero.badge': 'Jetzt mit Git-Versionierung + Export',
  'hero.title': 'Ein Dediziertes<br>Notizbuch für KI',
  'hero.subtitle': 'KI wechseln ohne Gedächtnisverlust · Jede Änderung rückgängig machen · Jederzeit exportieren',
  'hero.techLine': 'Duales HTTP + MCP Protokoll · Git-Versionierung · Volltextsuche · Ein Token für jede KI',
  'hero.cta.create': 'Kostenlosen Token Erstellen',
  'hero.cta.dashboard': 'Dashboard',

  // Before/After
  'hero.before.label': '❌ Ohne NoteForAI',
  'hero.before.user': 'Nutzer: Ich arbeite an KI-Produkten, ich habe erwähnt, dass ich einen minimalistischen Stil bevorzuge...',
  'hero.before.ai': 'KI: Entschuldigung, ich habe keine Aufzeichnungen aus unserem letzten Gespräch. Könnten Sie sich noch einmal vorstellen?',
  'hero.before.note': 'Sich bei jedem Gespräch neu vorstellen',
  'hero.after.label': '✔ Mit NoteForAI',
  'hero.after.user': 'Nutzer: Hilf mir, dieses Design zu verbessern',
  'hero.after.ai': 'KI: Natürlich! Basierend auf Ihrer Vorliebe für minimalistischen Stil und Ihrem NoteForAI-Refactoring-Projekt schlage ich vor...',
  'hero.after.note': 'Wie ein alter Freund, der sich an alles erinnert',

  // Compat
  'compat.title': 'Kompatibel mit allen KI-Tools, die Sie verwenden',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Jedes KI-Tool',
  'compat.note': 'Kein Plattform-Lock-in · KI wechseln ohne Gedächtnisverlust · Universelle HTTP-API',

  // Steps
  'steps.title': 'In 3 Schritten Starten',
  'steps.subtitle': '5 Minuten Einrichtung, um Ihrer KI ein dauerhaftes Gedächtnis zu geben',
  'steps.1.title': 'Token Erstellen',
  'steps.1.desc': 'Ein Klick zum Generieren — keine Registrierung erforderlich, sofort einsatzbereit',
  'steps.2.title': 'Prompt in KI Kopieren',
  'steps.2.desc': 'Ein vollständiger System-Prompt wird automatisch generiert — einfach in die KI-Einstellungen einfügen',
  'steps.3.title': 'Chatten Beginnen',
  'steps.3.desc': 'Die KI erinnert sich automatisch — das nächste Gespräch setzt genau dort an, wo Sie aufgehört haben',

  // Integration
  'integration.title': 'Integration',
  'integration.subtitle': 'Prompt kopieren und einfügen · MCP-Konfiguration per Klick · Direkter API-Zugriff',
  'integration.tab.prompt': 'KI-Prompt',
  'integration.tab.mcp': 'MCP-Konfiguration',
  'integration.tab.curl': 'curl-Beispiele',
  'integration.hint.prompt': 'Nach der Token-Erstellung wird der Prompt automatisch mit Ihrem echten API-Endpunkt und Token befüllt — einfach kopieren und direkt verwenden',
  'integration.hint.mcp': 'Für Claude Desktop / Cursor / Windsurf usw. Streamable HTTP Remote-Verbindung — keine Client-Installation nötig, ersetzen Sie einfach den Token in der URL',
  'integration.hint.curl': 'Alle Endpunkte unterstützen GET (Query-Parameter) und POST (JSON-Body)',

  // AI behavior
  'aiBehavior.title': 'Wie verhält sich die KI nach der Einrichtung?',
  'aiBehavior.subtitle': 'So verhält sich die KI tatsächlich zu Beginn jedes Gesprächs',
  'aiBehavior.sessionStart': 'KI-Gespräch beginnt',
  'aiBehavior.treeComment': '// Gedächtnisstruktur überprüfen',
  'aiBehavior.treeOutput': 'Persönlich/\n  profil.md\n  Einstellungen/\nArbeit/\n  ProjektA/',
  'aiBehavior.readCall': 'read("Persönlich/profil.md")',
  'aiBehavior.readComment': '// Bei Bedarf lesen',
  'aiBehavior.greeting': 'Hallo! Ich erinnere mich, dass Sie einen minimalistischen Stil bevorzugen und am NoteForAI-Refactoring gearbeitet haben. Sollen wir weitermachen?',
  'aiBehavior.userLabel': 'Sie',
  'aiBehavior.userNote': 'Jede wertvolle Information im Gespräch — die KI speichert automatisch mit <code class="text-indigo-500 text-xs">write()</code>',

  // Features
  'features.title': 'Für KI-Notizen Entwickelt',
  'features.subtitle': 'Jedes Detail wurde entwickelt, damit die KI Ihre Informationen besser verwalten und nutzen kann',
  'features.storage.title': 'Persistente Speicherung',
  'features.storage.desc': 'Notizen dauerhaft über Gespräche hinweg gespeichert — die KI erinnert sich jederzeit und vergisst nie',
  'features.search.title': 'Volltextsuche',
  'features.search.desc': 'CJK + Englisch-Tokenisierung, Abruf in Millisekunden, jede Information genau lokalisieren',
  'features.hierarchy.title': 'Verzeichnishierarchie',
  'features.hierarchy.desc': 'Ordnerbasierte Pfade — die KI organisiert die Struktur autonom, sauber und geordnet',
  'features.git.title': 'Git-Versionsschutz',
  'features.git.desc': 'Automatischer Snapshot bei jeder Bearbeitung — Löschungen wiederherstellen, vollständige Versionshistorie',
  'features.export.title': 'Ein-Klick-Export',
  'features.export.desc': 'ZIP / JSON / Markdown — jederzeit migrieren ohne Plattform-Lock-in',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Duales Protokoll — natives MCP für Claude Code, HTTP für universellen Zugriff',
  'features.token.title': 'Token-Isolation',
  'features.token.desc': 'Jeder Token hat seinen eigenen Bereich — keine Konten erforderlich, vollständig privat',
  'features.ui.title': 'Verwaltungs-Dashboard',
  'features.ui.desc': 'Web-UI im Dateimanager-Stil — durchsuchen, bearbeiten, suchen, Versionshistorie',
  'features.selfhost.title': 'Selbst-Hostbar',
  'features.selfhost.desc': 'Einzelnes Go-Binary, Docker auf Knopfdruck — vollständige Datenhoheit',

  // API
  'api.title': 'API-Referenz',
  'api.subtitle.pre': 'Format: ',
  'api.subtitle.post': ' + JSON-Body, unterstützt auch GET-Query-Parameter',
  'api.col.op': 'Aktion',
  'api.col.desc': 'Beschreibung',
  'api.col.params': 'Parameter',
  'api.write': 'Erstellen oder überschreiben',
  'api.append': 'Inhalt anhängen',
  'api.read': 'Notiz lesen',
  'api.search': 'Volltextsuche',
  'api.tree': 'Verzeichnisbaum',
  'api.history': 'Versionshistorie',
  'api.delete': 'Löschen (in Papierkorb)',

  // Data
  'data.title': 'Ihre Daten, Immer Ihre',
  'data.subtitle': 'Im Gegensatz zu undurchsichtigem Gedächtnis auf anderen Plattformen gibt NoteForAI Ihnen die volle Kontrolle über Ihre Daten',
  'data.transparent.title': 'Vollständig Transparent',
  'data.transparent.desc': 'Alle Notizeninhalt im Dashboard einsehen — keine schwarzen Boxen, alles sichtbar',
  'data.export.title': 'Jederzeit Exportieren',
  'data.export.desc': 'Alle Notizen per Klick als Markdown ZIP oder JSON exportieren — frei migrieren ohne Lock-in',
  'data.version.title': 'Versionswiederherstellung',
  'data.version.desc': 'Git-basierte Versionierung — jede Bearbeitung nachverfolgbar, Löschungen wiederherstellbar, 30 Tage vollständige Historie',

  // Email
  'email.title': 'Konfiguration per E-Mail Senden',
  'email.desc': 'Token, Prompt und Einrichtungsanleitung — zur sicheren Aufbewahrung an Ihr Postfach gesendet',
  'email.placeholder': 'ihre@email.de',
  'email.send': 'Senden',
  'email.sent': '✓ Gesendet! Überprüfen Sie Ihren Posteingang',
  'email.hint': 'Über Ihren lokalen E-Mail-Client gesendet, nie über unseren Server',
  'email.subject': 'NoteForAI Einrichtungsanleitung',

  // Footer
  'footer.tagline': 'Ein Notizbuch für KI',
  'footer.dashboard': 'Dashboard',

  // Modal
  'modal.step1.heading': 'Ihr Exklusiver Token',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Bewahren Sie diesen Token sicher auf — er ist der einzige Schlüssel zu Ihrem Notizenbereich.',
  'modal.step1.next': 'Weiter: KI Konfigurieren →',
  'modal.step2.heading': 'Ihre KI Konfigurieren',
  'modal.step2.copyPrompt': 'Prompt Kopieren',
  'modal.step2.emailBtn': '✉️ Per E-Mail Senden',
  'modal.step2.dashboard': 'Zum Dashboard →',

  // Dashboard sidebar
  'sidebar.folders': 'Ordner',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Papierkorb',
  'sidebar.rootDir': 'Stammverzeichnis',
  'sidebar.noFolders': 'Keine Ordner',

  // Folder
  'folder.new': 'Neu',
  'folder.history': 'Verlauf',
  'folder.deleteFolder': 'Ordner Löschen',
  'folder.empty': 'Leerer Ordner',
  'folder.emptyHint': '+ Neue Notiz',

  // File
  'file.preview': 'Vorschau',
  'file.edit': 'Bearbeiten',
  'file.save': 'Speichern',
  'file.saved': 'Gespeichert',
  'file.history': 'Verlauf',
  'file.append': 'Anhängen',
  'file.delete': 'Löschen',
  'file.loading': 'Laden...',
  'file.loadFailed': 'Laden fehlgeschlagen',

  // Version
  'version.title': 'Versionshistorie',
  'version.current': 'Aktuell',
  'version.diff': 'Unterschiede',
  'version.restore': 'Wiederherstellen',
  'version.loading': 'Laden...',
  'version.empty': 'Kein Verlauf',
  'version.loadFailed': 'Laden fehlgeschlagen',

  // Diff
  'diff.title': 'Unterschiede Details',
  'diff.back': '←',
  'diff.loading': 'Laden...',
  'diff.noDiff': 'Keine Unterschiede',
  'diff.loadFailed': 'Laden fehlgeschlagen',

  // Config
  'config.title': 'Integrationskonfiguration',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'KI-Prompt',
  'config.mcpLabel': 'MCP-Konfiguration',
  'config.dangerLabel': 'Gefahrenzone',
  'config.destroy': 'Diesen Token Vernichten',

  // Recycle
  'recycle.title': 'Papierkorb',
  'recycle.empty': 'Der Papierkorb ist leer',
  'recycle.close': 'Schließen',
  'recycle.loading': 'Laden...',
  'recycle.loadFailed': 'Laden fehlgeschlagen',

  // Modals
  'newNote.title': 'Neue Notiz',
  'appendModal.title': 'Inhalt Anhängen',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Token eingeben, um auf das Dashboard zuzugreifen',
  'tokenModal.error': 'Ungültiger Token',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Startseite',
  'tokenModal.enter': 'Eingeben',

  // Export
  'export.zip': 'Alles herunterladen (.zip)',
  'export.json': 'JSON exportieren',

  // Context menu file
  'ctx.view': 'Ansehen',
  'ctx.edit': 'Bearbeiten',
  'ctx.append': 'Anhängen',
  'ctx.copyPath': 'Pfad Kopieren',
  'ctx.download': 'Herunterladen',
  'ctx.delete': 'Löschen',

  // Context menu folder
  'ctx.open': 'Öffnen',
  'ctx.newNote': 'Neue Notiz',
  'ctx.history': 'Versionshistorie',
  'ctx.downloadZip': 'Herunterladen (.zip)',
  'ctx.deleteFolder': 'Ordner Löschen',

  // Search
  'search.placeholder': 'Notizen suchen...',
  'search.searching': 'Suche läuft...',
  'search.noResults': 'Keine Ergebnisse',

  // Time
  'time.justNow': 'gerade eben',
  'time.yesterday': 'gestern',

  // Confirms
  'confirm.unsavedLeave': 'Sie haben ungespeicherte Änderungen. Trotzdem verlassen?',
  'confirm.destroy1': 'Diesen Token vernichten? Alle Daten werden gelöscht!',
  'confirm.destroy2': 'Nochmals bestätigen: Dies kann nicht rückgängig gemacht werden!',
  'alert.saveFailed': 'Speichern fehlgeschlagen',
  'alert.restoreFailed': 'Wiederherstellen fehlgeschlagen',
  'alert.noFiles': 'Keine Dateien',
  'alert.emptyFolder': 'Leerer Ordner',
  'alert.downloadFailed': 'Herunterladen fehlgeschlagen',

  // Zip progress
  'zip.progress': ({done, total}) => `Packe ${done}/${total}`,

  // Unsaved warning
  'unsaved.warning': 'Sie haben ungespeicherte Änderungen',

  // Dashboard title
  'dashboard.title': 'Dashboard — NoteForAI',

  // Token display
  'token.copy': 'Kopieren',

  // Function keys
  'folder.itemCount': ({count}) => `${count} Element${count !== 1 ? 'e' : ''}`,
  'time.minutesAgo': ({n}) => `vor ${n} Min.`,
  'time.hoursAgo': ({n}) => `vor ${n} Stunde${n !== 1 ? 'n' : ''}`,
  'confirm.deleteItem': ({path}) => `"${path}" löschen?`,
  'confirm.deleteFolder': ({path}) => `Ordner "${path}" und alle Inhalte löschen?`,
  'confirm.revert': ({path}) => `"${path}" auf diese Version zurücksetzen?`,
  'confirm.restoreBatch': ({count}) => `Alle ${count} Dateien in diesem Ordner wiederherstellen?`,
  'recycle.restoreAll': ({count}) => `Alles im Ordner wiederherstellen (${count})`,
};

// ======================== pt ========================
I18N._dict['pt'] = {
  // Common
  'copy': 'Copiar',
  'copied': 'Copiado',
  'cancel': 'Cancelar',
  'confirm': 'Confirmar',
  'delete': 'Excluir',
  'save': 'Salvar',
  'saved': 'Salvo',
  'loading': 'Carregando...',
  'failed': 'Falhou',
  'close': 'Fechar',
  'back': 'Voltar',
  'restore': 'Restaurar',
  'search': 'Pesquisar',
  'export': 'Exportar',
  'noResults': 'Sem resultados',
  'create': 'Criar',
  'open': 'Abrir',
  'download': 'Baixar',
  'enter': 'Entrar',

  // Page
  'page.title': 'NoteForAI — Um Caderno Dedicado para IA',
  'page.description': 'NoteForAI: Um sistema de notas criado para IA. Memória persistente entre conversas, busca de texto completo, versionamento Git e acesso via HTTP ou MCP.',

  // Nav
  'nav.start': 'Início',
  'nav.integration': 'Integrar',
  'nav.features': 'Recursos',
  'nav.api': 'API',
  'nav.dashboard': 'Painel',

  // Hero
  'hero.badge': 'Agora com versionamento Git + exportação',
  'hero.title': 'Um Caderno<br>Dedicado para IA',
  'hero.subtitle': 'Troque de IA sem perder memória · Desfaça qualquer alteração · Exporte a qualquer momento',
  'hero.techLine': 'Protocolo dual HTTP + MCP · Versionamento Git · Busca de texto completo · Um token para qualquer IA',
  'hero.cta.create': 'Criar Token Gratuito',
  'hero.cta.dashboard': 'Painel de Controle',

  // Before/After
  'hero.before.label': '❌ Sem NoteForAI',
  'hero.before.user': 'Usuário: Trabalho em produtos de IA, mencionei que prefiro um estilo minimalista...',
  'hero.before.ai': 'IA: Desculpe, não tenho registros da nossa última conversa. Poderia se apresentar novamente?',
  'hero.before.note': 'Apresentar-se novamente em cada conversa',
  'hero.after.label': '✔ Com NoteForAI',
  'hero.after.user': 'Usuário: Me ajude a melhorar este design',
  'hero.after.ai': 'IA: Claro! Com base na sua preferência por estilo minimalista e seu projeto de refatoração do NoteForAI, sugiro...',
  'hero.after.note': 'Como um velho amigo que lembra de tudo',

  // Compat
  'compat.title': 'Compatível com qualquer ferramenta de IA que você usa',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Qualquer ferramenta de IA',
  'compat.note': 'Sem bloqueio de plataforma · Troque de IA sem perder sua memória · API HTTP universal',

  // Steps
  'steps.title': 'Comece em 3 Passos',
  'steps.subtitle': '5 minutos de configuração para dar memória persistente à sua IA',
  'steps.1.title': 'Crie um Token',
  'steps.1.desc': 'Um clique para gerar — sem cadastro, disponível instantaneamente',
  'steps.2.title': 'Copie o Prompt para sua IA',
  'steps.2.desc': 'Um prompt completo é gerado automaticamente — basta colá-lo nas configurações da sua IA',
  'steps.3.title': 'Comece a Conversar',
  'steps.3.desc': 'A IA lembra automaticamente — a próxima conversa continua exatamente de onde parou',

  // Integration
  'integration.title': 'Integração',
  'integration.subtitle': 'Prompt de copiar e colar · Config MCP com um clique · Acesso direto à API',
  'integration.tab.prompt': 'Prompt para IA',
  'integration.tab.mcp': 'Config MCP',
  'integration.tab.curl': 'Exemplos curl',
  'integration.hint.prompt': 'Após criar um token, o prompt é preenchido automaticamente com seu endpoint e token reais — copie e use diretamente',
  'integration.hint.mcp': 'Para Claude Desktop / Cursor / Windsurf, etc. Conexão remota Streamable HTTP — sem instalação no cliente, basta substituir o token na URL',
  'integration.hint.curl': 'Todos os endpoints suportam GET (parâmetros de consulta) e POST (corpo JSON)',

  // AI behavior
  'aiBehavior.title': 'Como a IA se comporta após a configuração?',
  'aiBehavior.subtitle': 'Veja o que a IA realmente faz no início de cada conversa',
  'aiBehavior.sessionStart': 'Conversa com IA começa',
  'aiBehavior.treeComment': '// Revisar estrutura de memória',
  'aiBehavior.treeOutput': 'pessoal/\n  perfil.md\n  preferencias/\ntrabalho/\n  projetoA/',
  'aiBehavior.readCall': 'read("pessoal/perfil.md")',
  'aiBehavior.readComment': '// Ler conforme necessário',
  'aiBehavior.greeting': 'Olá! Lembro que você prefere um estilo minimalista e estava trabalhando na refatoração do NoteForAI. Vamos continuar?',
  'aiBehavior.userLabel': 'Você',
  'aiBehavior.userNote': 'Qualquer informação valiosa na conversa — a IA salva automaticamente com <code class="text-indigo-500 text-xs">write()</code>',

  // Features
  'features.title': 'Construído para Anotações com IA',
  'features.subtitle': 'Cada detalhe projetado para ajudar a IA a gerenciar e usar suas informações melhor',
  'features.storage.title': 'Armazenamento Persistente',
  'features.storage.desc': 'Notas salvas permanentemente entre conversas — a IA lembra a qualquer momento, nunca esquece',
  'features.search.title': 'Busca de Texto Completo',
  'features.search.desc': 'Tokenização CJK + inglês, recuperação em milissegundos, localize qualquer informação',
  'features.hierarchy.title': 'Hierarquia de Diretórios',
  'features.hierarchy.desc': 'Caminhos baseados em pastas — a IA organiza a estrutura de forma autônoma, limpa e ordenada',
  'features.git.title': 'Proteção de Versões Git',
  'features.git.desc': 'Snapshot automático a cada edição — recupere exclusões, histórico completo com reversão',
  'features.export.title': 'Exportação com Um Clique',
  'features.export.desc': 'ZIP / JSON / Markdown — migre a qualquer momento sem bloqueio de plataforma',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Protocolo dual — MCP nativo para Claude Code, HTTP para acesso universal',
  'features.token.title': 'Isolamento por Token',
  'features.token.desc': 'Cada token tem seu próprio espaço — sem contas necessárias, totalmente privado',
  'features.ui.title': 'Painel de Gerenciamento',
  'features.ui.desc': 'UI web estilo gerenciador de arquivos — navegar, editar, pesquisar, histórico de versões',
  'features.selfhost.title': 'Auto-hospedável',
  'features.selfhost.desc': 'Binário Go único, Docker com um clique — soberania total sobre seus dados',

  // API
  'api.title': 'Referência da API',
  'api.subtitle.pre': 'Formato: ',
  'api.subtitle.post': ' + corpo JSON, também suporta parâmetros GET',
  'api.col.op': 'Ação',
  'api.col.desc': 'Descrição',
  'api.col.params': 'Parâmetros',
  'api.write': 'Criar ou sobrescrever',
  'api.append': 'Anexar conteúdo',
  'api.read': 'Ler uma nota',
  'api.search': 'Busca de texto completo',
  'api.tree': 'Árvore de diretórios',
  'api.history': 'Histórico de versões',
  'api.delete': 'Excluir (para lixeira)',

  // Data
  'data.title': 'Seus Dados, Sempre Seus',
  'data.subtitle': 'Ao contrário da memória opaca em outras plataformas, o NoteForAI dá a você controle total sobre seus dados',
  'data.transparent.title': 'Totalmente Transparente',
  'data.transparent.desc': 'Veja todos os conteúdos das notas no painel — sem caixas pretas, tudo visível',
  'data.export.title': 'Exporte a Qualquer Momento',
  'data.export.desc': 'Exporte todas as notas com um clique como Markdown ZIP ou JSON — migre livremente sem bloqueio',
  'data.version.title': 'Reversão de Versões',
  'data.version.desc': 'Versionamento com Git — cada edição rastreada, exclusões recuperáveis, 30 dias de histórico completo',

  // Email
  'email.title': 'Envie sua Configuração por Email',
  'email.desc': 'Token, prompt e guia de configuração — enviado para sua caixa de entrada para guardar',
  'email.placeholder': 'seu@email.com',
  'email.send': 'Enviar',
  'email.sent': '✓ Enviado! Verifique sua caixa de entrada',
  'email.hint': 'Enviado pelo seu cliente de email local, nunca pelo nosso servidor',
  'email.subject': 'Guia de Configuração do NoteForAI',

  // Footer
  'footer.tagline': 'Um Caderno para IA',
  'footer.dashboard': 'Painel',

  // Modal
  'modal.step1.heading': 'Seu Token Exclusivo',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Guarde este token com segurança — é a única chave para seu espaço de notas.',
  'modal.step1.next': 'Próximo: Configurar IA →',
  'modal.step2.heading': 'Configure sua IA',
  'modal.step2.copyPrompt': 'Copiar Prompt',
  'modal.step2.emailBtn': '✉️ Enviar por Email',
  'modal.step2.dashboard': 'Ir para o Painel →',

  // Dashboard sidebar
  'sidebar.folders': 'Pastas',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Lixeira',
  'sidebar.rootDir': 'Raiz',
  'sidebar.noFolders': 'Sem pastas',

  // Folder
  'folder.new': 'Novo',
  'folder.history': 'Histórico',
  'folder.deleteFolder': 'Excluir Pasta',
  'folder.empty': 'Pasta vazia',
  'folder.emptyHint': '+ Nova Nota',

  // File
  'file.preview': 'Visualizar',
  'file.edit': 'Editar',
  'file.save': 'Salvar',
  'file.saved': 'Salvo',
  'file.history': 'Histórico',
  'file.append': 'Anexar',
  'file.delete': 'Excluir',
  'file.loading': 'Carregando...',
  'file.loadFailed': 'Falha ao carregar',

  // Version
  'version.title': 'Histórico de Versões',
  'version.current': 'Atual',
  'version.diff': 'Diferenças',
  'version.restore': 'Restaurar',
  'version.loading': 'Carregando...',
  'version.empty': 'Sem histórico',
  'version.loadFailed': 'Falha ao carregar',

  // Diff
  'diff.title': 'Detalhes das Diferenças',
  'diff.back': '←',
  'diff.loading': 'Carregando...',
  'diff.noDiff': 'Sem diferenças',
  'diff.loadFailed': 'Falha ao carregar',

  // Config
  'config.title': 'Configuração de Integração',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'Prompt para IA',
  'config.mcpLabel': 'Config MCP',
  'config.dangerLabel': 'Zona de Perigo',
  'config.destroy': 'Destruir Este Token',

  // Recycle
  'recycle.title': 'Lixeira',
  'recycle.empty': 'A lixeira está vazia',
  'recycle.close': 'Fechar',
  'recycle.loading': 'Carregando...',
  'recycle.loadFailed': 'Falha ao carregar',

  // Modals
  'newNote.title': 'Nova Nota',
  'appendModal.title': 'Anexar Conteúdo',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Digite o token para acessar o painel',
  'tokenModal.error': 'Token inválido',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Início',
  'tokenModal.enter': 'Entrar',

  // Export
  'export.zip': 'Baixar tudo (.zip)',
  'export.json': 'Exportar JSON',

  // Context menu file
  'ctx.view': 'Ver',
  'ctx.edit': 'Editar',
  'ctx.append': 'Anexar',
  'ctx.copyPath': 'Copiar Caminho',
  'ctx.download': 'Baixar',
  'ctx.delete': 'Excluir',

  // Context menu folder
  'ctx.open': 'Abrir',
  'ctx.newNote': 'Nova Nota',
  'ctx.history': 'Histórico de Versões',
  'ctx.downloadZip': 'Baixar (.zip)',
  'ctx.deleteFolder': 'Excluir Pasta',

  // Search
  'search.placeholder': 'Pesquisar notas...',
  'search.searching': 'Pesquisando...',
  'search.noResults': 'Sem resultados',

  // Time
  'time.justNow': 'agora mesmo',
  'time.yesterday': 'ontem',

  // Confirms
  'confirm.unsavedLeave': 'Você tem alterações não salvas. Sair mesmo assim?',
  'confirm.destroy1': 'Destruir este token? Todos os dados serão excluídos!',
  'confirm.destroy2': 'Confirme novamente: isso não pode ser desfeito!',
  'alert.saveFailed': 'Falha ao salvar',
  'alert.restoreFailed': 'Falha ao restaurar',
  'alert.noFiles': 'Sem arquivos',
  'alert.emptyFolder': 'Pasta vazia',
  'alert.downloadFailed': 'Falha ao baixar',

  // Zip progress
  'zip.progress': ({done, total}) => `Empacotando ${done}/${total}`,

  // Unsaved warning
  'unsaved.warning': 'Você tem alterações não salvas',

  // Dashboard title
  'dashboard.title': 'Painel — NoteForAI',

  // Token display
  'token.copy': 'Copiar',

  // Function keys
  'folder.itemCount': ({count}) => `${count} item${count !== 1 ? 'ns' : ''}`,
  'time.minutesAgo': ({n}) => `há ${n} min`,
  'time.hoursAgo': ({n}) => `há ${n} hora${n !== 1 ? 's' : ''}`,
  'confirm.deleteItem': ({path}) => `Excluir "${path}"?`,
  'confirm.deleteFolder': ({path}) => `Excluir a pasta "${path}" e todo o seu conteúdo?`,
  'confirm.revert': ({path}) => `Restaurar "${path}" para esta versão?`,
  'confirm.restoreBatch': ({count}) => `Restaurar todos os ${count} arquivos nesta pasta?`,
  'recycle.restoreAll': ({count}) => `Restaurar tudo na pasta (${count})`,
};
// ======================== ru ========================
I18N._dict['ru'] = {
  'copy': 'Копировать',
  'copied': 'Скопировано',
  'cancel': 'Отмена',
  'confirm': 'Подтвердить',
  'delete': 'Удалить',
  'save': 'Сохранить',
  'saved': 'Сохранено',
  'loading': 'Загрузка...',
  'failed': 'Ошибка',
  'close': 'Закрыть',
  'back': 'Назад',
  'restore': 'Восстановить',
  'search': 'Поиск',
  'export': 'Экспорт',
  'noResults': 'Нет результатов',
  'create': 'Создать',
  'open': 'Открыть',
  'download': 'Скачать',
  'enter': 'Войти',

  'page.title': 'NoteForAI — Персональный блокнот для ИИ',
  'page.description': 'NoteForAI: система заметок, созданная для ИИ...',

  'nav.start': 'Начало',
  'nav.integration': 'Интеграция',
  'nav.features': 'Возможности',
  'nav.api': 'API',
  'nav.dashboard': 'Панель управления',

  'hero.badge': 'Теперь с версионированием Git + экспортом',
  'hero.title': 'Персональный<br>блокнот для ИИ',
  'hero.subtitle': 'Переключайте ИИ — сохраняйте память · Отменяйте любые изменения · Экспортируйте когда угодно',
  'hero.techLine': 'HTTP + MCP двойной протокол · Версионирование Git · Полнотекстовый поиск · Один токен для любого ИИ',
  'hero.cta.create': 'Создать бесплатный токен',
  'hero.cta.dashboard': 'Панель управления',

  'hero.before.label': '❌ Без NoteForAI',
  'hero.before.user': 'Пользователь: Я работаю над ИИ-продуктами, я упоминал, что предпочитаю минималистичный стиль...',
  'hero.before.ai': 'ИИ: Извините, у меня нет записей из нашего прошлого чата. Не могли бы вы снова представиться?',
  'hero.before.note': 'Представляться заново при каждом разговоре',
  'hero.after.label': '✔ С NoteForAI',
  'hero.after.user': 'Пользователь: Помоги улучшить этот дизайн',
  'hero.after.ai': 'ИИ: Конечно! Учитывая ваше предпочтение минималистичного стиля и проект рефакторинга NoteForAI, я предлагаю...',
  'hero.after.note': 'Как старый друг, который помнит всё',

  'compat.title': 'Совместим с любым ИИ-инструментом',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Любой ИИ-инструмент',
  'compat.note': 'Без привязки к платформе · Переключайте ИИ-инструменты, сохраняя память · Универсальный HTTP API',

  'steps.title': 'Начните за 3 шага',
  'steps.subtitle': '5 минут на настройку — дайте вашему ИИ постоянную память',
  'steps.1.title': 'Создайте токен',
  'steps.1.desc': 'Один клик для генерации — без регистрации, готово мгновенно',
  'steps.2.title': 'Скопируйте промпт в ИИ',
  'steps.2.desc': 'Полный системный промпт генерируется автоматически — просто вставьте его в настройки ИИ',
  'steps.3.title': 'Начните общение',
  'steps.3.desc': 'ИИ запоминает автоматически — следующий разговор продолжится с того же места',

  'integration.title': 'Интеграция',
  'integration.subtitle': 'Промпт копированием · Конфигурация MCP одним кликом · Прямой доступ к API',
  'integration.tab.prompt': 'Промпт для ИИ',
  'integration.tab.mcp': 'Конфигурация MCP',
  'integration.tab.curl': 'Примеры curl',
  'integration.hint.prompt': 'После создания токена промпт автоматически заполняется реальным API-адресом и токеном — копируйте и используйте напрямую',
  'integration.hint.mcp': 'Для Claude Desktop / Cursor / Windsurf и др. Streamable HTTP удалённое подключение — установка клиента не требуется, просто замените токен в URL',
  'integration.hint.curl': 'Все эндпоинты поддерживают GET (query params) и POST (JSON body)',

  'aiBehavior.title': 'Как ИИ ведёт себя после настройки?',
  'aiBehavior.subtitle': 'Вот что ИИ делает в начале каждого разговора',
  'aiBehavior.sessionStart': 'Разговор с ИИ начинается',
  'aiBehavior.treeComment': '// Просмотр структуры памяти',
  'aiBehavior.treeOutput': '📁 пользователь/\n  📄 профиль.md\n  📁 проекты/\n  📁 предпочтения/',
  'aiBehavior.readCall': 'read("пользователь/профиль.md")',
  'aiBehavior.readComment': '// Читать по мере необходимости',
  'aiBehavior.greeting': 'Привет! Вижу, вы работаете над NoteForAI и предпочитаете минималистичный стиль. Чем могу помочь сегодня?',
  'aiBehavior.userLabel': 'Вы',
  'aiBehavior.userNote': 'Любая ценная информация в разговоре — ИИ автоматически сохраняет её в заметки через <code class="text-indigo-500 text-xs">write()</code>',

  'features.title': 'Создано для заметок ИИ',
  'features.subtitle': 'Каждая деталь разработана для того, чтобы ИИ мог лучше управлять вашей информацией и использовать её',
  'features.storage.title': 'Постоянное хранилище',
  'features.storage.desc': 'Заметки сохраняются навсегда между разговорами — ИИ вспомнит в любой момент, ничего не забудет',
  'features.search.title': 'Полнотекстовый поиск',
  'features.search.desc': 'Токенизация CJK + английский, поиск за миллисекунды, точное нахождение любой информации',
  'features.hierarchy.title': 'Иерархия каталогов',
  'features.hierarchy.desc': 'Пути на основе папок — ИИ организует структуру самостоятельно, чисто и упорядоченно',
  'features.git.title': 'Защита версий Git',
  'features.git.desc': 'Автоснимок при каждом редактировании — восстановление удалений, полная история изменений',
  'features.export.title': 'Экспорт одним кликом',
  'features.export.desc': 'ZIP / JSON / Markdown — мигрируйте когда угодно, без привязки',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Двойной протокол — нативный MCP для Claude Code, HTTP для универсального доступа',
  'features.token.title': 'Изоляция токенов',
  'features.token.desc': 'Каждый токен получает собственное пространство — без аккаунтов, полная приватность',
  'features.ui.title': 'Панель управления',
  'features.ui.desc': 'Веб-интерфейс в стиле файлового менеджера — просмотр, редактирование, поиск, откат версий',
  'features.selfhost.title': 'Самостоятельный хостинг',
  'features.selfhost.desc': 'Один бинарный файл Go, Docker развёртывание одним кликом — полный контроль над данными',

  'api.title': 'Справочник API',
  'api.subtitle.pre': 'Формат: ',
  'api.subtitle.post': ' + JSON body, также поддерживает GET query params',
  'api.col.op': 'Действие',
  'api.col.desc': 'Описание',
  'api.col.params': 'Параметры',
  'api.write': 'Создать или перезаписать',
  'api.append': 'Добавить содержимое',
  'api.read': 'Прочитать заметку',
  'api.search': 'Полнотекстовый поиск',
  'api.tree': 'Дерево каталогов',
  'api.history': 'История версий',
  'api.delete': 'Удалить (в корзину)',

  'data.title': 'Ваши данные всегда ваши',
  'data.subtitle': 'В отличие от непрозрачной памяти других платформ, NoteForAI даёт вам полный контроль над данными',
  'data.transparent.title': 'Полная прозрачность',
  'data.transparent.desc': 'Просматривайте все содержимое заметок в панели управления — никаких чёрных ящиков, всё видно',
  'data.export.title': 'Экспорт в любое время',
  'data.export.desc': 'Экспортируйте все заметки одним кликом в Markdown ZIP или JSON — мигрируйте свободно, без привязки',
  'data.version.title': 'Откат версий',
  'data.version.desc': 'Версионирование на основе Git — каждое изменение отслеживается, удалённое восстанавливается, 30 дней полной истории',

  'email.title': 'Отправить конфигурацию на email',
  'email.desc': 'Токен, промпт и руководство по настройке — отправьте себе на почту для сохранности',
  'email.placeholder': 'ваш@email.com',
  'email.send': 'Отправить',
  'email.sent': '✓ Отправлено! Проверьте почту',
  'email.hint': 'Отправляется через ваш локальный почтовый клиент, не через наш сервер',
  'email.subject': 'Руководство по настройке NoteForAI',

  'footer.tagline': 'Блокнот для ИИ',
  'footer.dashboard': 'Панель управления',

  'modal.step1.heading': 'Ваш эксклюзивный токен',
  'modal.step1.tokenLabel': 'ТОКЕН',
  'modal.step1.note': 'Сохраните этот токен в безопасном месте — это единственный ключ к вашему пространству заметок.',
  'modal.step1.next': 'Далее: Настроить ИИ →',
  'modal.step2.heading': 'Настройте вашего ИИ',
  'modal.step2.copyPrompt': 'Копировать промпт',
  'modal.step2.emailBtn': '✉️ Отправить на email',
  'modal.step2.dashboard': 'Перейти в панель управления →',

  'sidebar.folders': 'Папки',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Корзина',
  'sidebar.rootDir': 'Корень',
  'sidebar.noFolders': 'Нет папок',
  'folder.new': 'Новый',
  'folder.history': 'История',
  'folder.deleteFolder': 'Удалить папку',
  'folder.empty': 'Пустая папка',
  'folder.emptyHint': '+ Новая заметка',
  'file.preview': 'Просмотр',
  'file.edit': 'Редактировать',
  'file.save': 'Сохранить',
  'file.saved': 'Сохранено',
  'file.history': 'История',
  'file.append': 'Добавить',
  'file.delete': 'Удалить',
  'file.loading': 'Загрузка...',
  'file.loadFailed': 'Ошибка загрузки',

  'version.title': 'История версий',
  'version.current': 'Текущая',
  'version.diff': 'Diff',
  'version.restore': 'Восстановить',
  'version.loading': 'Загрузка...',
  'version.empty': 'Нет истории',
  'version.loadFailed': 'Ошибка загрузки',

  'diff.title': 'Детали Diff',
  'diff.back': '←',
  'diff.loading': 'Загрузка...',
  'diff.noDiff': 'Нет различий',
  'diff.loadFailed': 'Ошибка загрузки',

  'config.title': 'Конфигурация интеграции',
  'config.tokenLabel': 'ТОКЕН',
  'config.promptLabel': 'Промпт для ИИ',
  'config.mcpLabel': 'Конфигурация MCP',
  'config.dangerLabel': 'Опасная зона',
  'config.destroy': 'Уничтожить этот токен',

  'recycle.title': 'Корзина',
  'recycle.empty': 'Корзина пуста',
  'recycle.close': 'Закрыть',
  'recycle.loading': 'Загрузка...',
  'recycle.loadFailed': 'Ошибка загрузки',

  'newNote.title': 'Новая заметка',
  'appendModal.title': 'Добавить содержимое',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Введите токен для доступа к панели управления',
  'tokenModal.error': 'Недействительный токен',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Главная',
  'tokenModal.enter': 'Войти',

  'export.zip': 'Скачать всё (.zip)',
  'export.json': 'Экспорт JSON',

  'ctx.view': 'Просмотр',
  'ctx.edit': 'Редактировать',
  'ctx.append': 'Добавить',
  'ctx.copyPath': 'Копировать путь',
  'ctx.download': 'Скачать',
  'ctx.delete': 'Удалить',
  'ctx.open': 'Открыть',
  'ctx.newNote': 'Новая заметка',
  'ctx.history': 'История версий',
  'ctx.downloadZip': 'Скачать (.zip)',
  'ctx.deleteFolder': 'Удалить папку',

  'search.placeholder': 'Поиск заметок...',
  'search.searching': 'Поиск...',
  'search.noResults': 'Нет результатов',

  'time.justNow': 'только что',
  'time.yesterday': 'вчера',

  'confirm.unsavedLeave': 'Есть несохранённые изменения. Всё равно уйти?',
  'confirm.destroy1': 'Уничтожить этот токен? Все данные будут удалены!',
  'confirm.destroy2': 'Подтвердите ещё раз: это действие нельзя отменить!',
  'alert.saveFailed': 'Ошибка сохранения',
  'alert.restoreFailed': 'Ошибка восстановления',
  'alert.noFiles': 'Нет файлов',
  'alert.emptyFolder': 'Пустая папка',
  'alert.downloadFailed': 'Ошибка загрузки',

  'unsaved.warning': 'Есть несохранённые изменения',
  'dashboard.title': 'Панель управления — NoteForAI',
  'token.copy': 'Копировать токен',

  'folder.itemCount': ({count}) => `${count} эл.`,
  'time.minutesAgo': ({n}) => `${n} мин. назад`,
  'time.hoursAgo': ({n}) => `${n} ч. назад`,
  'confirm.deleteItem': ({path}) => `Удалить «${path}»?`,
  'confirm.deleteFolder': ({path}) => `Удалить папку «${path}» и всё её содержимое?`,
  'confirm.revert': ({path}) => `Восстановить «${path}» до этой версии?`,
  'confirm.restoreBatch': ({count}) => `Восстановить все ${count} файлов в этой папке?`,
  'recycle.restoreAll': ({count}) => `Восстановить все в папке (${count})`,
  'zip.progress': ({done, total}) => `Упаковка ${done}/${total}`,
};

// ======================== it ========================
I18N._dict['it'] = {
  'copy': 'Copia',
  'copied': 'Copiato',
  'cancel': 'Annulla',
  'confirm': 'Conferma',
  'delete': 'Elimina',
  'save': 'Salva',
  'saved': 'Salvato',
  'loading': 'Caricamento...',
  'failed': 'Errore',
  'close': 'Chiudi',
  'back': 'Indietro',
  'restore': 'Ripristina',
  'search': 'Cerca',
  'export': 'Esporta',
  'noResults': 'Nessun risultato',
  'create': 'Crea',
  'open': 'Apri',
  'download': 'Scarica',
  'enter': 'Accedi',

  'page.title': 'NoteForAI — Il Blocco Note Dedicato per AI',
  'page.description': 'NoteForAI: un sistema di note costruito per l\'AI...',

  'nav.start': 'Inizia',
  'nav.integration': 'Integrazione',
  'nav.features': 'Funzionalità',
  'nav.api': 'API',
  'nav.dashboard': 'Dashboard',

  'hero.badge': 'Ora con versioning Git + esportazione',
  'hero.title': 'Il Blocco Note<br>Dedicato per AI',
  'hero.subtitle': 'Cambia AI mantieni la memoria · Annulla qualsiasi modifica · Esporta quando vuoi',
  'hero.techLine': 'Doppio protocollo HTTP + MCP · Versioning Git · Ricerca full-text · Un token per qualsiasi AI',
  'hero.cta.create': 'Crea Token Gratuito',
  'hero.cta.dashboard': 'Dashboard',

  'hero.before.label': '❌ Senza NoteForAI',
  'hero.before.user': 'Utente: Lavoro su prodotti AI, avevo detto che preferisco uno stile minimalista...',
  'hero.before.ai': 'AI: Mi dispiace, non ho registrazioni della nostra ultima chat. Potresti ripresentarti?',
  'hero.before.note': 'Ripresentarsi ad ogni conversazione',
  'hero.after.label': '✔ Con NoteForAI',
  'hero.after.user': 'Utente: Aiutami a migliorare questo design',
  'hero.after.ai': 'AI: Certo! In base alla tua preferenza per lo stile minimalista e al tuo progetto di refactoring NoteForAI, suggerisco...',
  'hero.after.note': 'Come un vecchio amico che ricorda tutto',

  'compat.title': 'Compatibile con qualsiasi strumento AI',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Qualsiasi strumento AI',
  'compat.note': 'Nessun lock-in · Cambia strumenti AI mantenendo la memoria · API HTTP universale',

  'steps.title': 'Inizia in 3 Passi',
  'steps.subtitle': '5 minuti di configurazione per dare alla tua AI una memoria persistente',
  'steps.1.title': 'Crea un Token',
  'steps.1.desc': 'Un clic per generare — nessuna registrazione richiesta, pronto istantaneamente',
  'steps.2.title': 'Copia il Prompt nell\'AI',
  'steps.2.desc': 'Un prompt di sistema completo viene generato automaticamente — incollalo nelle impostazioni AI',
  'steps.3.title': 'Inizia a Chattare',
  'steps.3.desc': 'L\'AI ricorda automaticamente — la prossima conversazione riprende esattamente da dove avevi lasciato',

  'integration.title': 'Integrazione',
  'integration.subtitle': 'Prompt copia-incolla · Config MCP con un clic · Accesso diretto API',
  'integration.tab.prompt': 'Prompt AI',
  'integration.tab.mcp': 'Config MCP',
  'integration.tab.curl': 'Esempi curl',
  'integration.hint.prompt': 'Dopo aver creato un token, il prompt si compila automaticamente con il tuo endpoint API reale e il token — copia e usa direttamente',
  'integration.hint.mcp': 'Per Claude Desktop / Cursor / Windsurf ecc. Connessione remota Streamable HTTP — nessuna installazione client necessaria, sostituisci solo il token nell\'URL',
  'integration.hint.curl': 'Tutti gli endpoint supportano sia GET (query params) che POST (JSON body)',

  'aiBehavior.title': 'Come si comporta l\'AI dopo la configurazione?',
  'aiBehavior.subtitle': 'Ecco cosa fa l\'AI all\'inizio di ogni conversazione',
  'aiBehavior.sessionStart': 'La conversazione AI inizia',
  'aiBehavior.treeComment': '// Rivedi la struttura della memoria',
  'aiBehavior.treeOutput': '📁 utente/\n  📄 profilo.md\n  📁 progetti/\n  📁 preferenze/',
  'aiBehavior.readCall': 'read("utente/profilo.md")',
  'aiBehavior.readComment': '// Leggi secondo necessità',
  'aiBehavior.greeting': 'Ciao! Vedo che stai lavorando su NoteForAI e preferisci lo stile minimalista. Come posso aiutarti oggi?',
  'aiBehavior.userLabel': 'Tu',
  'aiBehavior.userNote': 'Qualsiasi informazione preziosa nella conversazione — l\'AI la salva automaticamente nelle note con <code class="text-indigo-500 text-xs">write()</code>',

  'features.title': 'Creato per le Note AI',
  'features.subtitle': 'Ogni dettaglio progettato per aiutare l\'AI a gestire e usare le tue informazioni al meglio',
  'features.storage.title': 'Archiviazione Persistente',
  'features.storage.desc': 'Note salvate permanentemente tra le conversazioni — l\'AI le ricorda sempre, non dimentica nulla',
  'features.search.title': 'Ricerca Full-Text',
  'features.search.desc': 'Tokenizzazione CJK + inglese, recupero in millisecondi, trova qualsiasi informazione',
  'features.hierarchy.title': 'Gerarchia di Directory',
  'features.hierarchy.desc': 'Percorsi basati su cartelle — l\'AI organizza la struttura autonomamente, ordinata e pulita',
  'features.git.title': 'Protezione Versioni Git',
  'features.git.desc': 'Snapshot automatico ad ogni modifica — recupero eliminazioni, cronologia completa',
  'features.export.title': 'Esportazione con Un Clic',
  'features.export.desc': 'ZIP / JSON / Markdown — migra quando vuoi, nessun lock-in',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Doppio protocollo — MCP nativo per Claude Code, HTTP per accesso universale',
  'features.token.title': 'Isolamento Token',
  'features.token.desc': 'Ogni token ha il suo spazio — nessun account necessario, completamente privato',
  'features.ui.title': 'Dashboard di Gestione',
  'features.ui.desc': 'Web UI in stile file manager — sfoglia, modifica, cerca, rollback versioni',
  'features.selfhost.title': 'Self-Hostable',
  'features.selfhost.desc': 'Singolo binario Go, deploy Docker con un clic — piena sovranità sui dati',

  'api.title': 'Riferimento API',
  'api.subtitle.pre': 'Formato: ',
  'api.subtitle.post': ' + JSON body, supporta anche GET query params',
  'api.col.op': 'Azione',
  'api.col.desc': 'Descrizione',
  'api.col.params': 'Parametri',
  'api.write': 'Crea o sovrascrivi',
  'api.append': 'Aggiungi contenuto',
  'api.read': 'Leggi una nota',
  'api.search': 'Ricerca full-text',
  'api.tree': 'Albero directory',
  'api.history': 'Cronologia versioni',
  'api.delete': 'Elimina (nel cestino)',

  'data.title': 'I Tuoi Dati Sempre Tuoi',
  'data.subtitle': 'A differenza della memoria opaca di altre piattaforme, NoteForAI ti dà il pieno controllo sui tuoi dati',
  'data.transparent.title': 'Completamente Trasparente',
  'data.transparent.desc': 'Visualizza tutti i contenuti delle note nella dashboard — nessuna scatola nera, tutto visibile',
  'data.export.title': 'Esporta Quando Vuoi',
  'data.export.desc': 'Esporta tutte le note con un clic come Markdown ZIP o JSON — migra liberamente, nessun lock-in',
  'data.version.title': 'Rollback Versioni',
  'data.version.desc': 'Versioning basato su Git — ogni modifica tracciata, eliminazioni recuperabili, 30 giorni di cronologia completa',

  'email.title': 'Invia Config via Email',
  'email.desc': 'Token, prompt e guida alla configurazione — inviati nella tua casella di posta per sicurezza',
  'email.placeholder': 'tua@email.com',
  'email.send': 'Invia',
  'email.sent': '✓ Inviato! Controlla la tua casella',
  'email.hint': 'Inviato tramite il tuo client email locale, mai attraverso il nostro server',
  'email.subject': 'Guida alla Configurazione NoteForAI',

  'footer.tagline': 'Un Blocco Note per AI',
  'footer.dashboard': 'Dashboard',

  'modal.step1.heading': 'Il Tuo Token Esclusivo',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Conserva questo token al sicuro — è l\'unica chiave per il tuo spazio note.',
  'modal.step1.next': 'Prossimo: Configura AI →',
  'modal.step2.heading': 'Configura la Tua AI',
  'modal.step2.copyPrompt': 'Copia Prompt',
  'modal.step2.emailBtn': '✉️ Invia via Email',
  'modal.step2.dashboard': 'Vai alla Dashboard →',

  'sidebar.folders': 'Cartelle',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Cestino',
  'sidebar.rootDir': 'Radice',
  'sidebar.noFolders': 'Nessuna cartella',
  'folder.new': 'Nuova',
  'folder.history': 'Cronologia',
  'folder.deleteFolder': 'Elimina Cartella',
  'folder.empty': 'Cartella vuota',
  'folder.emptyHint': '+ Nuova Nota',
  'file.preview': 'Anteprima',
  'file.edit': 'Modifica',
  'file.save': 'Salva',
  'file.saved': 'Salvato',
  'file.history': 'Cronologia',
  'file.append': 'Aggiungi',
  'file.delete': 'Elimina',
  'file.loading': 'Caricamento...',
  'file.loadFailed': 'Caricamento fallito',

  'version.title': 'Cronologia Versioni',
  'version.current': 'Corrente',
  'version.diff': 'Diff',
  'version.restore': 'Ripristina',
  'version.loading': 'Caricamento...',
  'version.empty': 'Nessuna cronologia',
  'version.loadFailed': 'Caricamento fallito',

  'diff.title': 'Dettagli Diff',
  'diff.back': '←',
  'diff.loading': 'Caricamento...',
  'diff.noDiff': 'Nessuna differenza',
  'diff.loadFailed': 'Caricamento fallito',

  'config.title': 'Config Integrazione',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'Prompt AI',
  'config.mcpLabel': 'Config MCP',
  'config.dangerLabel': 'Zona Pericolosa',
  'config.destroy': 'Distruggi Questo Token',

  'recycle.title': 'Cestino',
  'recycle.empty': 'Il cestino è vuoto',
  'recycle.close': 'Chiudi',
  'recycle.loading': 'Caricamento...',
  'recycle.loadFailed': 'Caricamento fallito',

  'newNote.title': 'Nuova Nota',
  'appendModal.title': 'Aggiungi Contenuto',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Inserisci il token per accedere alla dashboard',
  'tokenModal.error': 'Token non valido',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Home',
  'tokenModal.enter': 'Accedi',

  'export.zip': 'Scarica tutto (.zip)',
  'export.json': 'Esporta JSON',

  'ctx.view': 'Visualizza',
  'ctx.edit': 'Modifica',
  'ctx.append': 'Aggiungi',
  'ctx.copyPath': 'Copia Percorso',
  'ctx.download': 'Scarica',
  'ctx.delete': 'Elimina',
  'ctx.open': 'Apri',
  'ctx.newNote': 'Nuova Nota',
  'ctx.history': 'Cronologia Versioni',
  'ctx.downloadZip': 'Scarica (.zip)',
  'ctx.deleteFolder': 'Elimina Cartella',

  'search.placeholder': 'Cerca note...',
  'search.searching': 'Ricerca...',
  'search.noResults': 'Nessun risultato',

  'time.justNow': 'proprio ora',
  'time.yesterday': 'ieri',

  'confirm.unsavedLeave': 'Hai modifiche non salvate. Vuoi uscire comunque?',
  'confirm.destroy1': 'Distruggere questo token? Tutti i dati verranno eliminati!',
  'confirm.destroy2': 'Conferma di nuovo: questa operazione non può essere annullata!',
  'alert.saveFailed': 'Salvataggio fallito',
  'alert.restoreFailed': 'Ripristino fallito',
  'alert.noFiles': 'Nessun file',
  'alert.emptyFolder': 'Cartella vuota',
  'alert.downloadFailed': 'Download fallito',

  'unsaved.warning': 'Hai modifiche non salvate',
  'dashboard.title': 'Dashboard — NoteForAI',
  'token.copy': 'Copia Token',

  'folder.itemCount': ({count}) => `${count} elementi`,
  'time.minutesAgo': ({n}) => `${n} min fa`,
  'time.hoursAgo': ({n}) => `${n} ore fa`,
  'confirm.deleteItem': ({path}) => `Eliminare "${path}"?`,
  'confirm.deleteFolder': ({path}) => `Eliminare la cartella "${path}" e tutto il suo contenuto?`,
  'confirm.revert': ({path}) => `Ripristinare "${path}" a questa versione?`,
  'confirm.restoreBatch': ({count}) => `Ripristinare tutti i ${count} file in questa cartella?`,
  'recycle.restoreAll': ({count}) => `Ripristina tutti nella cartella (${count})`,
  'zip.progress': ({done, total}) => `Compressione ${done}/${total}`,
};

// ======================== tr ========================
I18N._dict['tr'] = {
  'copy': 'Kopyala',
  'copied': 'Kopyalandı',
  'cancel': 'İptal',
  'confirm': 'Onayla',
  'delete': 'Sil',
  'save': 'Kaydet',
  'saved': 'Kaydedildi',
  'loading': 'Yükleniyor...',
  'failed': 'Başarısız',
  'close': 'Kapat',
  'back': 'Geri',
  'restore': 'Geri Yükle',
  'search': 'Ara',
  'export': 'Dışa Aktar',
  'noResults': 'Sonuç yok',
  'create': 'Oluştur',
  'open': 'Aç',
  'download': 'İndir',
  'enter': 'Giriş',

  'page.title': 'NoteForAI — AI için Özel Not Defteri',
  'page.description': 'NoteForAI: AI için tasarlanmış bir not sistemi...',

  'nav.start': 'Başla',
  'nav.integration': 'Entegrasyon',
  'nav.features': 'Özellikler',
  'nav.api': 'API',
  'nav.dashboard': 'Kontrol Paneli',

  'hero.badge': 'Artık Git versiyonlama + dışa aktarma ile',
  'hero.title': 'AI için Özel<br>Not Defteri',
  'hero.subtitle': 'AI değiştir hafızanı koru · Her değişikliği geri al · İstediğin zaman dışa aktar',
  'hero.techLine': 'HTTP + MCP çift protokol · Git versiyonlama · Tam metin arama · Her AI için tek token',
  'hero.cta.create': 'Ücretsiz Token Oluştur',
  'hero.cta.dashboard': 'Kontrol Paneli',

  'hero.before.label': '❌ NoteForAI olmadan',
  'hero.before.user': 'Kullanıcı: AI ürünleri üzerinde çalışıyorum, minimalist stil tercih ettiğimi söylemiştim...',
  'hero.before.ai': 'AI: Üzgünüm, önceki sohbetimizden kayıtlarım yok. Kendinizi tekrar tanıtabilir misiniz?',
  'hero.before.note': 'Her sohbette kendini yeniden tanıtmak',
  'hero.after.label': '✔ NoteForAI ile',
  'hero.after.user': 'Kullanıcı: Bu tasarımı geliştirmeme yardım et',
  'hero.after.ai': 'AI: Tabii! Minimalist stil tercihinize ve NoteForAI yeniden yapılandırma projenize dayanarak şunları öneririm...',
  'hero.after.note': 'Her şeyi hatırlayan eski bir arkadaş gibi',

  'compat.title': 'Kullandığınız her AI aracıyla uyumlu',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Her AI aracı',
  'compat.note': 'Platform bağımlılığı yok · AI araçlarını değiştir hafızanı koru · Evrensel HTTP API',

  'steps.title': '3 Adımda Başlayın',
  'steps.subtitle': 'AI\'ınıza kalıcı hafıza vermek için 5 dakikalık kurulum',
  'steps.1.title': 'Token Oluşturun',
  'steps.1.desc': 'Oluşturmak için tek tık — kayıt gerekmez, anında hazır',
  'steps.2.title': 'Prompt\'u AI\'a Kopyalayın',
  'steps.2.desc': 'Eksiksiz bir sistem promptu otomatik oluşturulur — AI ayarlarınıza yapıştırın',
  'steps.3.title': 'Sohbet Etmeye Başlayın',
  'steps.3.desc': 'AI otomatik hatırlar — bir sonraki sohbet tam kaldığınız yerden devam eder',

  'integration.title': 'Entegrasyon',
  'integration.subtitle': 'Kopyala-yapıştır prompt · Tek tıkla MCP yapılandırması · Doğrudan API erişimi',
  'integration.tab.prompt': 'AI Prompt',
  'integration.tab.mcp': 'MCP Yapılandırması',
  'integration.tab.curl': 'curl Örnekleri',
  'integration.hint.prompt': 'Token oluşturduktan sonra prompt, gerçek API uç noktanız ve tokeninizle otomatik dolar — doğrudan kopyalayıp kullanın',
  'integration.hint.mcp': 'Claude Desktop / Cursor / Windsurf vb. için. Streamable HTTP uzak bağlantı — istemci kurulumu gerekmez, sadece URL\'deki tokeni değiştirin',
  'integration.hint.curl': 'Tüm uç noktalar hem GET (query params) hem POST (JSON body) destekler',

  'aiBehavior.title': 'Kurulumdan sonra AI nasıl davranır?',
  'aiBehavior.subtitle': 'AI\'ın her sohbetin başında gerçekte yaptıkları',
  'aiBehavior.sessionStart': 'AI sohbeti başlıyor',
  'aiBehavior.treeComment': '// Hafıza yapısını gözden geçir',
  'aiBehavior.treeOutput': '📁 kullanici/\n  📄 profil.md\n  📁 projeler/\n  📁 tercihler/',
  'aiBehavior.readCall': 'read("kullanici/profil.md")',
  'aiBehavior.readComment': '// Gerektiğinde oku',
  'aiBehavior.greeting': 'Merhaba! NoteForAI üzerinde çalıştığınızı ve minimalist stili tercih ettiğinizi görüyorum. Bugün nasıl yardımcı olabilirim?',
  'aiBehavior.userLabel': 'Siz',
  'aiBehavior.userNote': 'Sohbetteki değerli bilgiler — AI otomatik olarak <code class="text-indigo-500 text-xs">write()</code> ile notlara kaydeder',

  'features.title': 'AI Not Alma için Tasarlandı',
  'features.subtitle': 'AI\'ın bilgilerinizi daha iyi yönetmesi ve kullanması için her detay tasarlandı',
  'features.storage.title': 'Kalıcı Depolama',
  'features.storage.desc': 'Notlar sohbetler arasında kalıcı olarak kaydedilir — AI her zaman hatırlar, asla unutmaz',
  'features.search.title': 'Tam Metin Arama',
  'features.search.desc': 'CJK + İngilizce tokenizasyon, milisaniye geri alma, herhangi bir bilgiyi kesin bulma',
  'features.hierarchy.title': 'Dizin Hiyerarşisi',
  'features.hierarchy.desc': 'Klasör tabanlı yollar — AI yapıyı özerk olarak düzenler, temiz ve düzenli',
  'features.git.title': 'Git Sürüm Koruması',
  'features.git.desc': 'Her düzenlemede otomatik anlık görüntü — silinen dosyaları kurtarma, tam geçmiş geri alma',
  'features.export.title': 'Tek Tıkla Dışa Aktarma',
  'features.export.desc': 'ZIP / JSON / Markdown — istediğiniz zaman taşıyın, bağımlılık yok',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Çift protokol — Claude Code için yerel MCP, evrensel erişim için HTTP',
  'features.token.title': 'Token İzolasyonu',
  'features.token.desc': 'Her token kendi alanına sahip — hesap gerekmez, tamamen özel',
  'features.ui.title': 'Yönetim Kontrol Paneli',
  'features.ui.desc': 'Dosya yöneticisi tarzı Web UI — gözat, düzenle, ara, sürüm geri al',
  'features.selfhost.title': 'Kendi Sunucunda Barındır',
  'features.selfhost.desc': 'Tek Go ikili dosyası, Docker tek tıkla dağıtım — tam veri egemenliği',

  'api.title': 'API Referansı',
  'api.subtitle.pre': 'Format: ',
  'api.subtitle.post': ' + JSON body, GET query params da desteklenir',
  'api.col.op': 'Eylem',
  'api.col.desc': 'Açıklama',
  'api.col.params': 'Parametreler',
  'api.write': 'Oluştur veya üzerine yaz',
  'api.append': 'İçerik ekle',
  'api.read': 'Not oku',
  'api.search': 'Tam metin arama',
  'api.tree': 'Dizin ağacı',
  'api.history': 'Sürüm geçmişi',
  'api.delete': 'Sil (geri dönüşüm kutusuna)',

  'data.title': 'Verileriniz Her Zaman Sizin',
  'data.subtitle': 'Diğer platformların opak hafızasının aksine, NoteForAI verileriniz üzerinde tam kontrol sağlar',
  'data.transparent.title': 'Tamamen Şeffaf',
  'data.transparent.desc': 'Kontrol panelinde tüm not içeriklerini görüntüleyin — kara kutu yok, her şey görünür',
  'data.export.title': 'İstediğiniz Zaman Dışa Aktarın',
  'data.export.desc': 'Tüm notları tek tıkla Markdown ZIP veya JSON olarak dışa aktarın — özgürce taşıyın, platform bağımlılığı yok',
  'data.version.title': 'Sürüm Geri Alma',
  'data.version.desc': 'Git tabanlı versiyonlama — her düzenleme izlenir, silmeler kurtarılabilir, 30 günlük tam geçmiş',

  'email.title': 'Yapılandırmayı E-posta ile Gönder',
  'email.desc': 'Token, prompt ve kurulum kılavuzu — güvende tutmak için gelen kutunuza gönderilir',
  'email.placeholder': 'siz@eposta.com',
  'email.send': 'Gönder',
  'email.sent': '✓ Gönderildi! Gelen kutunuzu kontrol edin',
  'email.hint': 'Yerel e-posta istemciniz aracılığıyla gönderilir, sunucumuzdan asla gönderilmez',
  'email.subject': 'NoteForAI Kurulum Kılavuzu',

  'footer.tagline': 'AI için Not Defteri',
  'footer.dashboard': 'Kontrol Paneli',

  'modal.step1.heading': 'Özel Tokeniniz',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Bu tokeni güvende tutun — not alanınızın tek anahtarıdır.',
  'modal.step1.next': 'Sonraki: AI\'ı Yapılandır →',
  'modal.step2.heading': 'AI\'ınızı Yapılandırın',
  'modal.step2.copyPrompt': 'Promptu Kopyala',
  'modal.step2.emailBtn': '✉️ E-posta ile Gönder',
  'modal.step2.dashboard': 'Kontrol Paneline Git →',

  'sidebar.folders': 'Klasörler',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Geri Dönüşüm Kutusu',
  'sidebar.rootDir': 'Kök',
  'sidebar.noFolders': 'Klasör yok',
  'folder.new': 'Yeni',
  'folder.history': 'Geçmiş',
  'folder.deleteFolder': 'Klasörü Sil',
  'folder.empty': 'Boş klasör',
  'folder.emptyHint': '+ Yeni Not',
  'file.preview': 'Önizleme',
  'file.edit': 'Düzenle',
  'file.save': 'Kaydet',
  'file.saved': 'Kaydedildi',
  'file.history': 'Geçmiş',
  'file.append': 'Ekle',
  'file.delete': 'Sil',
  'file.loading': 'Yükleniyor...',
  'file.loadFailed': 'Yükleme başarısız',

  'version.title': 'Sürüm Geçmişi',
  'version.current': 'Güncel',
  'version.diff': 'Fark',
  'version.restore': 'Geri Yükle',
  'version.loading': 'Yükleniyor...',
  'version.empty': 'Geçmiş yok',
  'version.loadFailed': 'Yükleme başarısız',

  'diff.title': 'Fark Detayları',
  'diff.back': '←',
  'diff.loading': 'Yükleniyor...',
  'diff.noDiff': 'Fark yok',
  'diff.loadFailed': 'Yükleme başarısız',

  'config.title': 'Entegrasyon Yapılandırması',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'AI Prompt',
  'config.mcpLabel': 'MCP Yapılandırması',
  'config.dangerLabel': 'Tehlikeli Bölge',
  'config.destroy': 'Bu Tokeni Yok Et',

  'recycle.title': 'Geri Dönüşüm Kutusu',
  'recycle.empty': 'Geri dönüşüm kutusu boş',
  'recycle.close': 'Kapat',
  'recycle.loading': 'Yükleniyor...',
  'recycle.loadFailed': 'Yükleme başarısız',

  'newNote.title': 'Yeni Not',
  'appendModal.title': 'İçerik Ekle',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Kontrol paneline erişmek için token girin',
  'tokenModal.error': 'Geçersiz token',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Ana Sayfa',
  'tokenModal.enter': 'Giriş',

  'export.zip': 'Tümünü indir (.zip)',
  'export.json': 'JSON Dışa Aktar',

  'ctx.view': 'Görüntüle',
  'ctx.edit': 'Düzenle',
  'ctx.append': 'Ekle',
  'ctx.copyPath': 'Yolu Kopyala',
  'ctx.download': 'İndir',
  'ctx.delete': 'Sil',
  'ctx.open': 'Aç',
  'ctx.newNote': 'Yeni Not',
  'ctx.history': 'Sürüm Geçmişi',
  'ctx.downloadZip': 'İndir (.zip)',
  'ctx.deleteFolder': 'Klasörü Sil',

  'search.placeholder': 'Notlarda ara...',
  'search.searching': 'Aranıyor...',
  'search.noResults': 'Sonuç yok',

  'time.justNow': 'az önce',
  'time.yesterday': 'dün',

  'confirm.unsavedLeave': 'Kaydedilmemiş değişiklikleriniz var. Yine de ayrılmak istiyor musunuz?',
  'confirm.destroy1': 'Bu tokeni yok et? Tüm veriler silinecek!',
  'confirm.destroy2': 'Tekrar onaylayın: bu işlem geri alınamaz!',
  'alert.saveFailed': 'Kaydetme başarısız',
  'alert.restoreFailed': 'Geri yükleme başarısız',
  'alert.noFiles': 'Dosya yok',
  'alert.emptyFolder': 'Boş klasör',
  'alert.downloadFailed': 'İndirme başarısız',

  'unsaved.warning': 'Kaydedilmemiş değişiklikleriniz var',
  'dashboard.title': 'Kontrol Paneli — NoteForAI',
  'token.copy': 'Tokeni Kopyala',

  'folder.itemCount': ({count}) => `${count} öğe`,
  'time.minutesAgo': ({n}) => `${n} dk önce`,
  'time.hoursAgo': ({n}) => `${n} sa önce`,
  'confirm.deleteItem': ({path}) => `"${path}" silinsin mi?`,
  'confirm.deleteFolder': ({path}) => `"${path}" klasörü ve tüm içeriği silinsin mi?`,
  'confirm.revert': ({path}) => `"${path}" bu sürüme geri yüklensin mi?`,
  'confirm.restoreBatch': ({count}) => `Bu klasördeki tüm ${count} dosya geri yüklensin mi?`,
  'recycle.restoreAll': ({count}) => `Klasördeki tümünü geri yükle (${count})`,
  'zip.progress': ({done, total}) => `Paketleniyor ${done}/${total}`,
};

// ======================== pl ========================
I18N._dict['pl'] = {
  'copy': 'Kopiuj',
  'copied': 'Skopiowano',
  'cancel': 'Anuluj',
  'confirm': 'Potwierdź',
  'delete': 'Usuń',
  'save': 'Zapisz',
  'saved': 'Zapisano',
  'loading': 'Ładowanie...',
  'failed': 'Błąd',
  'close': 'Zamknij',
  'back': 'Wstecz',
  'restore': 'Przywróć',
  'search': 'Szukaj',
  'export': 'Eksportuj',
  'noResults': 'Brak wyników',
  'create': 'Utwórz',
  'open': 'Otwórz',
  'download': 'Pobierz',
  'enter': 'Wejdź',

  'page.title': 'NoteForAI — Dedykowany Notes dla AI',
  'page.description': 'NoteForAI: system notatek zbudowany dla AI...',

  'nav.start': 'Start',
  'nav.integration': 'Integracja',
  'nav.features': 'Funkcje',
  'nav.api': 'API',
  'nav.dashboard': 'Panel',

  'hero.badge': 'Teraz z wersjonowaniem Git + eksportem',
  'hero.title': 'Dedykowany<br>Notes dla AI',
  'hero.subtitle': 'Zmieniaj AI zachowaj pamięć · Cofaj każdą zmianę · Eksportuj kiedy chcesz',
  'hero.techLine': 'Podwójny protokół HTTP + MCP · Wersjonowanie Git · Wyszukiwanie pełnotekstowe · Jeden token dla każdego AI',
  'hero.cta.create': 'Utwórz Darmowy Token',
  'hero.cta.dashboard': 'Panel',

  'hero.before.label': '❌ Bez NoteForAI',
  'hero.before.user': 'Użytkownik: Pracuję nad produktami AI, wspomniałem, że preferuję minimalistyczny styl...',
  'hero.before.ai': 'AI: Przepraszam, nie mam zapisów z naszej ostatniej rozmowy. Czy mógłbyś się przedstawić ponownie?',
  'hero.before.note': 'Przedstawiać się na nowo przy każdej rozmowie',
  'hero.after.label': '✔ Z NoteForAI',
  'hero.after.user': 'Użytkownik: Pomóż mi ulepszyć ten design',
  'hero.after.ai': 'AI: Oczywiście! Na podstawie Twojej preferencji dla minimalistycznego stylu i projektu refaktoryzacji NoteForAI sugeruję...',
  'hero.after.note': 'Jak stary przyjaciel, który pamięta wszystko',

  'compat.title': 'Kompatybilny z każdym narzędziem AI',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Dowolne narzędzie AI',
  'compat.note': 'Bez uzależnienia od platformy · Zmieniaj narzędzia AI zachowując pamięć · Uniwersalne API HTTP',

  'steps.title': 'Zacznij w 3 Krokach',
  'steps.subtitle': '5 minut konfiguracji, aby dać AI trwałą pamięć',
  'steps.1.title': 'Utwórz Token',
  'steps.1.desc': 'Jedno kliknięcie do wygenerowania — bez rejestracji, gotowe natychmiast',
  'steps.2.title': 'Skopiuj Prompt do AI',
  'steps.2.desc': 'Kompletny systemowy prompt jest automatycznie generowany — wklej go w ustawienia AI',
  'steps.3.title': 'Zacznij Rozmawiać',
  'steps.3.desc': 'AI zapamiętuje automatycznie — następna rozmowa zaczyna się dokładnie tam, gdzie skończyłeś',

  'integration.title': 'Integracja',
  'integration.subtitle': 'Prompt kopiuj-wklej · Konfiguracja MCP jednym kliknięciem · Bezpośredni dostęp do API',
  'integration.tab.prompt': 'Prompt AI',
  'integration.tab.mcp': 'Konfiguracja MCP',
  'integration.tab.curl': 'Przykłady curl',
  'integration.hint.prompt': 'Po utworzeniu tokenu prompt automatycznie wypełnia się Twoim prawdziwym punktem końcowym API i tokenem — skopiuj i użyj bezpośrednio',
  'integration.hint.mcp': 'Dla Claude Desktop / Cursor / Windsurf itp. Zdalne połączenie Streamable HTTP — nie wymaga instalacji klienta, wystarczy zastąpić token w URL',
  'integration.hint.curl': 'Wszystkie punkty końcowe obsługują zarówno GET (query params) jak i POST (JSON body)',

  'aiBehavior.title': 'Jak AI zachowuje się po konfiguracji?',
  'aiBehavior.subtitle': 'Oto co AI faktycznie robi na początku każdej rozmowy',
  'aiBehavior.sessionStart': 'Rozmowa z AI rozpoczyna się',
  'aiBehavior.treeComment': '// Przejrzyj strukturę pamięci',
  'aiBehavior.treeOutput': '📁 uzytkownik/\n  📄 profil.md\n  📁 projekty/\n  📁 preferencje/',
  'aiBehavior.readCall': 'read("uzytkownik/profil.md")',
  'aiBehavior.readComment': '// Czytaj w razie potrzeby',
  'aiBehavior.greeting': 'Cześć! Widzę, że pracujesz nad NoteForAI i preferujesz minimalistyczny styl. Jak mogę Ci dzisiaj pomóc?',
  'aiBehavior.userLabel': 'Ty',
  'aiBehavior.userNote': 'Wszelkie cenne informacje w rozmowie — AI automatycznie zapisuje je do notatek przez <code class="text-indigo-500 text-xs">write()</code>',

  'features.title': 'Stworzone dla Notatek AI',
  'features.subtitle': 'Każdy szczegół zaprojektowany, aby pomóc AI lepiej zarządzać Twoimi informacjami i z nich korzystać',
  'features.storage.title': 'Trwałe Przechowywanie',
  'features.storage.desc': 'Notatki zapisane trwale między rozmowami — AI zawsze pamięta, nigdy nie zapomina',
  'features.search.title': 'Wyszukiwanie Pełnotekstowe',
  'features.search.desc': 'Tokenizacja CJK + angielski, odzyskiwanie w milisekundach, precyzyjne znajdowanie informacji',
  'features.hierarchy.title': 'Hierarchia Katalogów',
  'features.hierarchy.desc': 'Ścieżki oparte na folderach — AI organizuje strukturę autonomicznie, czysto i uporządkowanie',
  'features.git.title': 'Ochrona Wersji Git',
  'features.git.desc': 'Automatyczny snapshot przy każdej edycji — odzyskiwanie usunięć, pełna historia cofania',
  'features.export.title': 'Eksport Jednym Kliknięciem',
  'features.export.desc': 'ZIP / JSON / Markdown — migruj kiedy chcesz, bez uzależnienia',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Podwójny protokół — natywny MCP dla Claude Code, HTTP dla uniwersalnego dostępu',
  'features.token.title': 'Izolacja Tokenów',
  'features.token.desc': 'Każdy token ma własną przestrzeń — bez kont, całkowita prywatność',
  'features.ui.title': 'Panel Zarządzania',
  'features.ui.desc': 'Web UI w stylu menedżera plików — przeglądaj, edytuj, szukaj, cofaj wersje',
  'features.selfhost.title': 'Self-Hostable',
  'features.selfhost.desc': 'Jeden plik binarny Go, wdrożenie Docker jednym kliknięciem — pełna suwerenność danych',

  'api.title': 'Dokumentacja API',
  'api.subtitle.pre': 'Format: ',
  'api.subtitle.post': ' + JSON body, obsługuje też GET query params',
  'api.col.op': 'Akcja',
  'api.col.desc': 'Opis',
  'api.col.params': 'Parametry',
  'api.write': 'Utwórz lub nadpisz',
  'api.append': 'Dołącz treść',
  'api.read': 'Odczytaj notatkę',
  'api.search': 'Wyszukiwanie pełnotekstowe',
  'api.tree': 'Drzewo katalogów',
  'api.history': 'Historia wersji',
  'api.delete': 'Usuń (do kosza)',

  'data.title': 'Twoje Dane Zawsze Twoje',
  'data.subtitle': 'W przeciwieństwie do nieprzejrzystej pamięci innych platform, NoteForAI daje Ci pełną kontrolę nad danymi',
  'data.transparent.title': 'W Pełni Przejrzyste',
  'data.transparent.desc': 'Przeglądaj całą zawartość notatek w panelu — żadnych czarnych skrzynek, wszystko widoczne',
  'data.export.title': 'Eksportuj Kiedy Chcesz',
  'data.export.desc': 'Eksportuj wszystkie notatki jednym kliknięciem jako Markdown ZIP lub JSON — migruj swobodnie, bez uzależnienia',
  'data.version.title': 'Cofanie Wersji',
  'data.version.desc': 'Wersjonowanie oparte na Git — każda edycja śledzona, usunięcia odzyskiwalne, 30 dni pełnej historii',

  'email.title': 'Wyślij Konfigurację Emailem',
  'email.desc': 'Token, prompt i przewodnik konfiguracji — wysłane do Twojej skrzynki dla bezpieczeństwa',
  'email.placeholder': 'twoj@email.com',
  'email.send': 'Wyślij',
  'email.sent': '✓ Wysłano! Sprawdź skrzynkę',
  'email.hint': 'Wysyłane przez Twój lokalny klient email, nigdy przez nasz serwer',
  'email.subject': 'Przewodnik Konfiguracji NoteForAI',

  'footer.tagline': 'Notes dla AI',
  'footer.dashboard': 'Panel',

  'modal.step1.heading': 'Twój Ekskluzywny Token',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Zachowaj ten token bezpiecznie — to jedyny klucz do Twojej przestrzeni notatek.',
  'modal.step1.next': 'Dalej: Skonfiguruj AI →',
  'modal.step2.heading': 'Skonfiguruj Swoje AI',
  'modal.step2.copyPrompt': 'Kopiuj Prompt',
  'modal.step2.emailBtn': '✉️ Wyślij Emailem',
  'modal.step2.dashboard': 'Przejdź do Panelu →',

  'sidebar.folders': 'Foldery',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Kosz',
  'sidebar.rootDir': 'Katalog główny',
  'sidebar.noFolders': 'Brak folderów',
  'folder.new': 'Nowy',
  'folder.history': 'Historia',
  'folder.deleteFolder': 'Usuń Folder',
  'folder.empty': 'Pusty folder',
  'folder.emptyHint': '+ Nowa Notatka',
  'file.preview': 'Podgląd',
  'file.edit': 'Edytuj',
  'file.save': 'Zapisz',
  'file.saved': 'Zapisano',
  'file.history': 'Historia',
  'file.append': 'Dołącz',
  'file.delete': 'Usuń',
  'file.loading': 'Ładowanie...',
  'file.loadFailed': 'Ładowanie nie powiodło się',

  'version.title': 'Historia Wersji',
  'version.current': 'Bieżąca',
  'version.diff': 'Różnica',
  'version.restore': 'Przywróć',
  'version.loading': 'Ładowanie...',
  'version.empty': 'Brak historii',
  'version.loadFailed': 'Ładowanie nie powiodło się',

  'diff.title': 'Szczegóły Różnicy',
  'diff.back': '←',
  'diff.loading': 'Ładowanie...',
  'diff.noDiff': 'Brak różnic',
  'diff.loadFailed': 'Ładowanie nie powiodło się',

  'config.title': 'Konfiguracja Integracji',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'Prompt AI',
  'config.mcpLabel': 'Konfiguracja MCP',
  'config.dangerLabel': 'Strefa Niebezpieczna',
  'config.destroy': 'Zniszcz Ten Token',

  'recycle.title': 'Kosz',
  'recycle.empty': 'Kosz jest pusty',
  'recycle.close': 'Zamknij',
  'recycle.loading': 'Ładowanie...',
  'recycle.loadFailed': 'Ładowanie nie powiodło się',

  'newNote.title': 'Nowa Notatka',
  'appendModal.title': 'Dołącz Treść',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Wprowadź token, aby uzyskać dostęp do panelu',
  'tokenModal.error': 'Nieprawidłowy token',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Strona główna',
  'tokenModal.enter': 'Wejdź',

  'export.zip': 'Pobierz wszystko (.zip)',
  'export.json': 'Eksportuj JSON',

  'ctx.view': 'Podgląd',
  'ctx.edit': 'Edytuj',
  'ctx.append': 'Dołącz',
  'ctx.copyPath': 'Kopiuj Ścieżkę',
  'ctx.download': 'Pobierz',
  'ctx.delete': 'Usuń',
  'ctx.open': 'Otwórz',
  'ctx.newNote': 'Nowa Notatka',
  'ctx.history': 'Historia Wersji',
  'ctx.downloadZip': 'Pobierz (.zip)',
  'ctx.deleteFolder': 'Usuń Folder',

  'search.placeholder': 'Szukaj notatek...',
  'search.searching': 'Szukam...',
  'search.noResults': 'Brak wyników',

  'time.justNow': 'przed chwilą',
  'time.yesterday': 'wczoraj',

  'confirm.unsavedLeave': 'Masz niezapisane zmiany. Mimo to wyjść?',
  'confirm.destroy1': 'Zniszczyć ten token? Wszystkie dane zostaną usunięte!',
  'confirm.destroy2': 'Potwierdź ponownie: tej operacji nie można cofnąć!',
  'alert.saveFailed': 'Zapisywanie nie powiodło się',
  'alert.restoreFailed': 'Przywracanie nie powiodło się',
  'alert.noFiles': 'Brak plików',
  'alert.emptyFolder': 'Pusty folder',
  'alert.downloadFailed': 'Pobieranie nie powiodło się',

  'unsaved.warning': 'Masz niezapisane zmiany',
  'dashboard.title': 'Panel — NoteForAI',
  'token.copy': 'Kopiuj Token',

  'folder.itemCount': ({count}) => `${count} elementów`,
  'time.minutesAgo': ({n}) => `${n} min temu`,
  'time.hoursAgo': ({n}) => `${n} godz. temu`,
  'confirm.deleteItem': ({path}) => `Usunąć "${path}"?`,
  'confirm.deleteFolder': ({path}) => `Usunąć folder "${path}" i całą jego zawartość?`,
  'confirm.revert': ({path}) => `Przywrócić "${path}" do tej wersji?`,
  'confirm.restoreBatch': ({count}) => `Przywrócić wszystkie ${count} pliki w tym folderze?`,
  'recycle.restoreAll': ({count}) => `Przywróć wszystkie w folderze (${count})`,
  'zip.progress': ({done, total}) => `Pakowanie ${done}/${total}`,
};
// ======================== ar ========================
I18N._dict['ar'] = {
  'copy': 'نسخ',
  'copied': 'تم النسخ',
  'cancel': 'إلغاء',
  'confirm': 'تأكيد',
  'delete': 'حذف',
  'save': 'حفظ',
  'saved': 'تم الحفظ',
  'loading': 'جارٍ التحميل...',
  'failed': 'فشل',
  'close': 'إغلاق',
  'back': 'رجوع',
  'restore': 'استعادة',
  'search': 'بحث',
  'export': 'تصدير',
  'noResults': 'لا توجد نتائج',
  'create': 'إنشاء',
  'open': 'فتح',
  'download': 'تنزيل',
  'enter': 'دخول',

  'page.title': 'NoteForAI — دفتر ملاحظات مخصص للذكاء الاصطناعي',
  'page.description': 'NoteForAI: نظام ملاحظات مصمم للذكاء الاصطناعي...',

  'nav.start': 'البدء',
  'nav.integration': 'التكامل',
  'nav.features': 'الميزات',
  'nav.api': 'API',
  'nav.dashboard': 'لوحة التحكم',

  'hero.badge': 'الآن مع إصدار Git + التصدير',
  'hero.title': 'دفتر ملاحظات<br>مخصص للذكاء الاصطناعي',
  'hero.subtitle': 'احتفظ بذاكرة الذكاء الاصطناعي · تراجع عن أي تغيير · صدّر في أي وقت',
  'hero.techLine': 'بروتوكول HTTP + MCP المزدوج · إصدار Git · بحث نصي كامل · رمز واحد لأي ذكاء اصطناعي',
  'hero.cta.create': 'إنشاء رمز مجاني',
  'hero.cta.dashboard': 'لوحة التحكم',

  'hero.before.label': '❌ بدون NoteForAI',
  'hero.before.user': 'المستخدم: أعمل على منتجات الذكاء الاصطناعي وذكرت أنني أفضل الأسلوب البسيط...',
  'hero.before.ai': 'الذكاء الاصطناعي: آسف، ليس لديّ سجلات من محادثتنا السابقة. هل يمكنك تقديم نفسك مجدداً؟',
  'hero.before.note': 'تقديم نفسك من جديد في كل محادثة',
  'hero.after.label': '✔ مع NoteForAI',
  'hero.after.user': 'المستخدم: ساعدني في تحسين هذا التصميم',
  'hero.after.ai': 'الذكاء الاصطناعي: بالطبع! بناءً على تفضيلك للأسلوب البسيط ومشروع إعادة هيكلة NoteForAI الخاص بك، أقترح...',
  'hero.after.note': 'كصديق قديم يتذكر كل شيء',

  'compat.title': 'متوافق مع أي أداة ذكاء اصطناعي تستخدمها',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ أي أداة ذكاء اصطناعي',
  'compat.note': 'لا قيود على المنصة · انتقل بين أدوات الذكاء الاصطناعي مع الاحتفاظ بذاكرتك · واجهة HTTP عالمية',

  'steps.title': 'ابدأ في 3 خطوات',
  'steps.subtitle': '5 دقائق للإعداد ومنح ذكائك الاصطناعي ذاكرة دائمة',
  'steps.1.title': 'إنشاء رمز',
  'steps.1.desc': 'نقرة واحدة للتوليد — لا حاجة للتسجيل، جاهز فوراً',
  'steps.2.title': 'نسخ التعليمات إلى الذكاء الاصطناعي',
  'steps.2.desc': 'يتم توليد تعليمات نظام كاملة تلقائياً — فقط الصقها في إعدادات الذكاء الاصطناعي',
  'steps.3.title': 'ابدأ المحادثة',
  'steps.3.desc': 'الذكاء الاصطناعي يتذكر تلقائياً — المحادثة التالية تستأنف من حيث توقفت',

  'integration.title': 'التكامل',
  'integration.subtitle': 'تعليمات نسخ ولصق · إعداد MCP بنقرة واحدة · وصول مباشر للـ API',
  'integration.tab.prompt': 'تعليمات الذكاء الاصطناعي',
  'integration.tab.mcp': 'إعداد MCP',
  'integration.tab.curl': 'أمثلة curl',
  'integration.hint.prompt': 'بعد إنشاء الرمز، تُملأ التعليمات تلقائياً بنقطة API الحقيقية والرمز — انسخ واستخدم مباشرة',
  'integration.hint.mcp': 'لـ Claude Desktop / Cursor / Windsurf وغيرها. اتصال HTTP بعيد قابل للبث — لا حاجة لتثبيت عميل، فقط استبدل الرمز في الرابط',
  'integration.hint.curl': 'جميع نقاط النهاية تدعم GET (معاملات الاستعلام) و POST (جسم JSON)',

  'aiBehavior.title': 'كيف يتصرف الذكاء الاصطناعي بعد الإعداد؟',
  'aiBehavior.subtitle': 'هذا ما يفعله الذكاء الاصطناعي فعلاً في بداية كل محادثة',
  'aiBehavior.sessionStart': 'بدء محادثة الذكاء الاصطناعي',
  'aiBehavior.treeComment': '// مراجعة هيكل الذاكرة',
  'aiBehavior.treeOutput': '📁 المستخدم/\n  📄 التفضيلات.md\n  📄 المشاريع.md\n  📁 الملاحظات/',
  'aiBehavior.readCall': 'read("المستخدم/التفضيلات.md")',
  'aiBehavior.readComment': '// قراءة حسب الحاجة',
  'aiBehavior.greeting': 'مرحباً مجدداً! رأيت أنك تعمل على مشروع إعادة الهيكلة — هل تريد الاستمرار من حيث توقفت؟',
  'aiBehavior.userLabel': 'أنت',
  'aiBehavior.userNote': 'أي معلومات قيّمة في المحادثة — الذكاء الاصطناعي يحفظها تلقائياً باستخدام <code class="text-indigo-500 text-xs">write()</code>',

  'features.title': 'مصمم لتدوين ملاحظات الذكاء الاصطناعي',
  'features.subtitle': 'كل تفصيل مصمم لمساعدة الذكاء الاصطناعي على إدارة معلوماتك واستخدامها بشكل أفضل',
  'features.storage.title': 'تخزين دائم',
  'features.storage.desc': 'الملاحظات محفوظة بشكل دائم عبر المحادثات — الذكاء الاصطناعي يتذكر في أي وقت ولا ينسى أبداً',
  'features.search.title': 'بحث نصي كامل',
  'features.search.desc': 'تقسيم كلمات CJK + الإنجليزية، استرجاع بالميلي ثانية، تحديد أي معلومة بدقة',
  'features.hierarchy.title': 'تسلسل هرمي للمجلدات',
  'features.hierarchy.desc': 'مسارات قائمة على المجلدات — الذكاء الاصطناعي ينظم الهيكل باستقلالية، نظيف ومرتب',
  'features.git.title': 'حماية إصدار Git',
  'features.git.desc': 'لقطة تلقائية عند كل تعديل — استرجاع الحذف، سجل كامل للتراجع',
  'features.export.title': 'تصدير بنقرة واحدة',
  'features.export.desc': 'ZIP / JSON / Markdown — انتقل في أي وقت بدون قيود',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'بروتوكول مزدوج — MCP أصلي لـ Claude Code، HTTP للوصول العالمي',
  'features.token.title': 'عزل بالرمز',
  'features.token.desc': 'لكل رمز مساحته الخاصة — لا حاجة لحسابات، خصوصية كاملة',
  'features.ui.title': 'لوحة تحكم للإدارة',
  'features.ui.desc': 'واجهة ويب بأسلوب مدير الملفات — تصفح، تعديل، بحث، استرجاع الإصدار',
  'features.selfhost.title': 'قابل للاستضافة الذاتية',
  'features.selfhost.desc': 'ثنائي Go واحد، Docker بنقرة واحدة — سيادة كاملة على البيانات',

  'api.title': 'مرجع API',
  'api.subtitle.pre': 'الصيغة: ',
  'api.subtitle.post': ' + جسم JSON، يدعم أيضاً معاملات GET',
  'api.col.op': 'الإجراء',
  'api.col.desc': 'الوصف',
  'api.col.params': 'المعاملات',
  'api.write': 'إنشاء أو استبدال',
  'api.append': 'إضافة محتوى',
  'api.read': 'قراءة ملاحظة',
  'api.search': 'بحث نصي كامل',
  'api.tree': 'شجرة الدليل',
  'api.history': 'سجل الإصدارات',
  'api.delete': 'حذف (إلى سلة المهملات)',

  'data.title': 'بياناتك ملكك دائماً',
  'data.subtitle': 'على عكس الذاكرة المبهمة في المنصات الأخرى، NoteForAI يمنحك السيطرة الكاملة على بياناتك',
  'data.transparent.title': 'شفافية كاملة',
  'data.transparent.desc': 'عرض جميع محتويات الملاحظات في لوحة التحكم — لا صناديق سوداء، كل شيء مرئي',
  'data.export.title': 'تصدير في أي وقت',
  'data.export.desc': 'تصدير جميع الملاحظات بنقرة واحدة كـ Markdown ZIP أو JSON — انتقل بحرية بدون قيود المنصة',
  'data.version.title': 'استرجاع الإصدار',
  'data.version.desc': 'إصدار مدعوم بـ Git — كل تعديل مُتتبَّع، الحذف قابل للاسترداد، 30 يوماً من السجل الكامل',

  'email.title': 'أرسل إعداداتك بالبريد الإلكتروني',
  'email.desc': 'الرمز والتعليمات ودليل الإعداد — أرسل إلى صندوق البريد للحفظ',
  'email.placeholder': 'بريدك@example.com',
  'email.send': 'إرسال',
  'email.sent': '✓ تم الإرسال! تحقق من صندوق البريد',
  'email.hint': 'يُرسل عبر عميل البريد المحلي، لا يمر عبر خوادمنا أبداً',
  'email.subject': 'دليل إعداد NoteForAI',

  'footer.tagline': 'دفتر ملاحظات للذكاء الاصطناعي',
  'footer.dashboard': 'لوحة التحكم',

  'modal.step1.heading': 'رمزك الحصري',
  'modal.step1.tokenLabel': 'الرمز',
  'modal.step1.note': 'احتفظ بهذا الرمز بأمان — إنه المفتاح الوحيد لمساحة ملاحظاتك.',
  'modal.step1.next': 'التالي: تهيئة الذكاء الاصطناعي →',
  'modal.step2.heading': 'تهيئة ذكاءك الاصطناعي',
  'modal.step2.copyPrompt': 'نسخ التعليمات',
  'modal.step2.emailBtn': '✉️ إرسال بالبريد',
  'modal.step2.dashboard': 'الذهاب إلى لوحة التحكم →',

  'sidebar.folders': 'المجلدات',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'سلة المهملات',
  'sidebar.rootDir': 'الجذر',
  'sidebar.noFolders': 'لا توجد مجلدات',
  'folder.new': 'جديد',
  'folder.history': 'السجل',
  'folder.deleteFolder': 'حذف المجلد',
  'folder.empty': 'مجلد فارغ',
  'folder.emptyHint': '+ ملاحظة جديدة',
  'file.preview': 'معاينة',
  'file.edit': 'تعديل',
  'file.save': 'حفظ',
  'file.saved': 'تم الحفظ',
  'file.history': 'السجل',
  'file.append': 'إضافة',
  'file.delete': 'حذف',
  'file.loading': 'جارٍ التحميل...',
  'file.loadFailed': 'فشل التحميل',

  'version.title': 'سجل الإصدارات',
  'version.current': 'الحالي',
  'version.diff': 'الفرق',
  'version.restore': 'استعادة',
  'version.loading': 'جارٍ التحميل...',
  'version.empty': 'لا يوجد سجل',
  'version.loadFailed': 'فشل التحميل',

  'diff.title': 'تفاصيل الفرق',
  'diff.back': '←',
  'diff.loading': 'جارٍ التحميل...',
  'diff.noDiff': 'لا توجد فروق',
  'diff.loadFailed': 'فشل التحميل',

  'config.title': 'إعداد التكامل',
  'config.tokenLabel': 'الرمز',
  'config.promptLabel': 'تعليمات الذكاء الاصطناعي',
  'config.mcpLabel': 'إعداد MCP',
  'config.dangerLabel': 'منطقة الخطر',
  'config.destroy': 'تدمير هذا الرمز',

  'recycle.title': 'سلة المهملات',
  'recycle.empty': 'سلة المهملات فارغة',
  'recycle.close': 'إغلاق',
  'recycle.loading': 'جارٍ التحميل...',
  'recycle.loadFailed': 'فشل التحميل',

  'newNote.title': 'ملاحظة جديدة',
  'appendModal.title': 'إضافة محتوى',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'أدخل الرمز للوصول إلى لوحة التحكم',
  'tokenModal.error': 'رمز غير صالح',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'الرئيسية',
  'tokenModal.enter': 'دخول',

  'export.zip': 'تنزيل الكل (.zip)',
  'export.json': 'تصدير JSON',

  'ctx.view': 'عرض',
  'ctx.edit': 'تعديل',
  'ctx.append': 'إضافة',
  'ctx.copyPath': 'نسخ المسار',
  'ctx.download': 'تنزيل',
  'ctx.delete': 'حذف',
  'ctx.open': 'فتح',
  'ctx.newNote': 'ملاحظة جديدة',
  'ctx.history': 'سجل الإصدارات',
  'ctx.downloadZip': 'تنزيل (.zip)',
  'ctx.deleteFolder': 'حذف المجلد',

  'search.placeholder': 'ابحث في الملاحظات...',
  'search.searching': 'جارٍ البحث...',
  'search.noResults': 'لا توجد نتائج',

  'time.justNow': 'الآن',
  'time.yesterday': 'أمس',

  'confirm.unsavedLeave': 'لديك تغييرات غير محفوظة. هل تريد المغادرة على أي حال؟',
  'confirm.destroy1': 'تدمير هذا الرمز؟ سيتم حذف جميع البيانات!',
  'confirm.destroy2': 'تأكيد مجدداً: لا يمكن التراجع عن هذا!',
  'alert.saveFailed': 'فشل الحفظ',
  'alert.restoreFailed': 'فشل الاستعادة',
  'alert.noFiles': 'لا توجد ملفات',
  'alert.emptyFolder': 'مجلد فارغ',
  'alert.downloadFailed': 'فشل التنزيل',

  'unsaved.warning': 'لديك تغييرات غير محفوظة',
  'dashboard.title': 'لوحة التحكم — NoteForAI',
  'token.copy': 'نسخ',

  'folder.itemCount': ({count}) => `${count} عناصر`,
  'time.minutesAgo': ({n}) => `منذ ${n} دقيقة`,
  'time.hoursAgo': ({n}) => `منذ ${n} ساعة`,
  'confirm.deleteItem': ({path}) => `حذف "${path}"؟`,
  'confirm.deleteFolder': ({path}) => `حذف المجلد "${path}" وجميع محتوياته؟`,
  'confirm.revert': ({path}) => `استعادة "${path}" إلى هذا الإصدار؟`,
  'confirm.restoreBatch': ({count}) => `استعادة جميع الـ ${count} ملفات في هذا المجلد؟`,
  'recycle.restoreAll': ({count}) => `استعادة الكل في المجلد (${count})`,
  'zip.progress': ({done, total}) => `جارٍ الضغط ${done}/${total}`,
};

// ======================== vi ========================
I18N._dict['vi'] = {
  'copy': 'Sao chép',
  'copied': 'Đã sao chép',
  'cancel': 'Hủy',
  'confirm': 'Xác nhận',
  'delete': 'Xóa',
  'save': 'Lưu',
  'saved': 'Đã lưu',
  'loading': 'Đang tải...',
  'failed': 'Thất bại',
  'close': 'Đóng',
  'back': 'Quay lại',
  'restore': 'Khôi phục',
  'search': 'Tìm kiếm',
  'export': 'Xuất',
  'noResults': 'Không có kết quả',
  'create': 'Tạo',
  'open': 'Mở',
  'download': 'Tải xuống',
  'enter': 'Vào',

  'page.title': 'NoteForAI — Sổ tay chuyên dụng cho AI',
  'page.description': 'NoteForAI: Hệ thống ghi chú được xây dựng cho AI...',

  'nav.start': 'Bắt đầu',
  'nav.integration': 'Tích hợp',
  'nav.features': 'Tính năng',
  'nav.api': 'API',
  'nav.dashboard': 'Bảng điều khiển',

  'hero.badge': 'Giờ có phiên bản Git + xuất dữ liệu',
  'hero.title': 'Sổ tay chuyên dụng<br>cho AI',
  'hero.subtitle': 'Chuyển AI giữ nguyên bộ nhớ · Hoàn tác bất kỳ thay đổi · Xuất bất cứ lúc nào',
  'hero.techLine': 'Giao thức kép HTTP + MCP · Phiên bản Git · Tìm kiếm toàn văn · Một token cho mọi AI',
  'hero.cta.create': 'Tạo Token Miễn Phí',
  'hero.cta.dashboard': 'Bảng điều khiển',

  'hero.before.label': '❌ Không có NoteForAI',
  'hero.before.user': 'Người dùng: Tôi làm về sản phẩm AI, đã đề cập tôi thích phong cách tối giản...',
  'hero.before.ai': 'AI: Xin lỗi, tôi không có hồ sơ từ cuộc trò chuyện trước. Bạn có thể giới thiệu lại không?',
  'hero.before.note': 'Tự giới thiệu lại mỗi cuộc trò chuyện',
  'hero.after.label': '✔ Có NoteForAI',
  'hero.after.user': 'Người dùng: Giúp tôi cải thiện thiết kế này',
  'hero.after.ai': 'AI: Được! Dựa trên sở thích phong cách tối giản và dự án tái cấu trúc NoteForAI của bạn, tôi đề xuất...',
  'hero.after.note': 'Như người bạn cũ nhớ mọi thứ',

  'compat.title': 'Tương thích với mọi công cụ AI bạn dùng',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Bất kỳ công cụ AI nào',
  'compat.note': 'Không bị khóa nền tảng · Chuyển AI giữ nguyên bộ nhớ · API HTTP phổ quát',

  'steps.title': 'Bắt đầu trong 3 bước',
  'steps.subtitle': '5 phút thiết lập, cho AI của bạn bộ nhớ lâu dài',
  'steps.1.title': 'Tạo Token',
  'steps.1.desc': 'Một cú click để tạo — không cần đăng ký, sẵn sàng ngay lập tức',
  'steps.2.title': 'Sao chép Prompt vào AI',
  'steps.2.desc': 'Prompt hệ thống đầy đủ được tạo tự động — chỉ cần dán vào cài đặt AI',
  'steps.3.title': 'Bắt đầu trò chuyện',
  'steps.3.desc': 'AI tự động ghi nhớ — cuộc trò chuyện tiếp theo tiếp tục đúng chỗ bạn dừng',

  'integration.title': 'Tích hợp',
  'integration.subtitle': 'Prompt sao chép-dán · Cấu hình MCP một cú click · Truy cập API trực tiếp',
  'integration.tab.prompt': 'Prompt AI',
  'integration.tab.mcp': 'Cấu hình MCP',
  'integration.tab.curl': 'Ví dụ curl',
  'integration.hint.prompt': 'Sau khi tạo token, prompt tự động điền endpoint API thật và token của bạn — sao chép và dùng trực tiếp',
  'integration.hint.mcp': 'Dành cho Claude Desktop / Cursor / Windsurf v.v. Kết nối HTTP từ xa có thể stream — không cần cài client, chỉ thay token trong URL',
  'integration.hint.curl': 'Tất cả endpoint đều hỗ trợ GET (query params) và POST (JSON body)',

  'aiBehavior.title': 'AI hành xử thế nào sau khi thiết lập?',
  'aiBehavior.subtitle': 'Đây là những gì AI thực sự làm ở đầu mỗi cuộc trò chuyện',
  'aiBehavior.sessionStart': 'Bắt đầu cuộc trò chuyện AI',
  'aiBehavior.treeComment': '// Xem lại cấu trúc bộ nhớ',
  'aiBehavior.treeOutput': '📁 nguoi-dung/\n  📄 so-thich.md\n  📄 du-an.md\n  📁 ghi-chu/',
  'aiBehavior.readCall': 'read("nguoi-dung/so-thich.md")',
  'aiBehavior.readComment': '// Đọc khi cần',
  'aiBehavior.greeting': 'Chào lại! Tôi thấy bạn đang làm dự án tái cấu trúc — bạn muốn tiếp tục từ chỗ dừng không?',
  'aiBehavior.userLabel': 'Bạn',
  'aiBehavior.userNote': 'Bất kỳ thông tin có giá trị nào trong cuộc trò chuyện — AI tự động <code class="text-indigo-500 text-xs">write()</code> lưu vào ghi chú',

  'features.title': 'Được xây dựng cho ghi chú AI',
  'features.subtitle': 'Mỗi chi tiết được thiết kế để giúp AI quản lý và sử dụng thông tin của bạn tốt hơn',
  'features.storage.title': 'Lưu trữ lâu dài',
  'features.storage.desc': 'Ghi chú lưu vĩnh viễn qua các cuộc trò chuyện — AI nhớ lại bất cứ lúc nào, không bao giờ quên',
  'features.search.title': 'Tìm kiếm toàn văn',
  'features.search.desc': 'Phân tách từ CJK + Tiếng Anh, truy xuất mili giây, xác định chính xác mọi thông tin',
  'features.hierarchy.title': 'Cấu trúc thư mục',
  'features.hierarchy.desc': 'Đường dẫn dựa trên thư mục — AI tự tổ chức cấu trúc, gọn gàng và có thứ tự',
  'features.git.title': 'Bảo vệ phiên bản Git',
  'features.git.desc': 'Tự động snapshot mỗi lần chỉnh sửa — khôi phục xóa nhầm, lịch sử đầy đủ',
  'features.export.title': 'Xuất một cú click',
  'features.export.desc': 'ZIP / JSON / Markdown — di chuyển bất cứ lúc nào, không bị khóa',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Giao thức kép — MCP gốc cho Claude Code, HTTP cho truy cập phổ quát',
  'features.token.title': 'Cô lập theo Token',
  'features.token.desc': 'Mỗi token có không gian riêng — không cần tài khoản, hoàn toàn riêng tư',
  'features.ui.title': 'Bảng quản lý',
  'features.ui.desc': 'Giao diện Web kiểu file manager — duyệt, chỉnh sửa, tìm kiếm, khôi phục phiên bản',
  'features.selfhost.title': 'Tự lưu trữ được',
  'features.selfhost.desc': 'Một binary Go, Docker một cú click — toàn quyền kiểm soát dữ liệu',

  'api.title': 'Tài liệu API',
  'api.subtitle.pre': 'Định dạng: ',
  'api.subtitle.post': ' + JSON body, cũng hỗ trợ GET query params',
  'api.col.op': 'Hành động',
  'api.col.desc': 'Mô tả',
  'api.col.params': 'Tham số',
  'api.write': 'Tạo hoặc ghi đè',
  'api.append': 'Thêm nội dung',
  'api.read': 'Đọc ghi chú',
  'api.search': 'Tìm kiếm toàn văn',
  'api.tree': 'Cây thư mục',
  'api.history': 'Lịch sử phiên bản',
  'api.delete': 'Xóa (vào thùng rác)',

  'data.title': 'Dữ liệu của bạn luôn là của bạn',
  'data.subtitle': 'Không như bộ nhớ hộp đen ở các nền tảng khác, NoteForAI cho bạn kiểm soát hoàn toàn',
  'data.transparent.title': 'Hoàn toàn minh bạch',
  'data.transparent.desc': 'Xem tất cả nội dung ghi chú trong bảng điều khiển — không có hộp đen, mọi thứ đều hiển thị',
  'data.export.title': 'Xuất bất cứ lúc nào',
  'data.export.desc': 'Xuất tất cả ghi chú bằng một cú click dưới dạng Markdown ZIP hoặc JSON — di chuyển tự do, không bị khóa nền tảng',
  'data.version.title': 'Khôi phục phiên bản',
  'data.version.desc': 'Phiên bản hỗ trợ bởi Git — mọi chỉnh sửa được theo dõi, xóa có thể khôi phục, 30 ngày lịch sử đầy đủ',

  'email.title': 'Email cấu hình của bạn',
  'email.desc': 'Token, prompt và hướng dẫn thiết lập — gửi đến hộp thư để lưu giữ',
  'email.placeholder': 'ban@email.com',
  'email.send': 'Gửi',
  'email.sent': '✓ Đã gửi! Kiểm tra hộp thư',
  'email.hint': 'Gửi qua email client cục bộ, không bao giờ qua máy chủ của chúng tôi',
  'email.subject': 'Hướng dẫn thiết lập NoteForAI',

  'footer.tagline': 'Sổ tay cho AI',
  'footer.dashboard': 'Bảng điều khiển',

  'modal.step1.heading': 'Token độc quyền của bạn',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Giữ token này an toàn — đây là chìa khóa duy nhất vào không gian ghi chú của bạn.',
  'modal.step1.next': 'Tiếp theo: Cấu hình AI →',
  'modal.step2.heading': 'Cấu hình AI của bạn',
  'modal.step2.copyPrompt': 'Sao chép Prompt',
  'modal.step2.emailBtn': '✉️ Email',
  'modal.step2.dashboard': 'Vào Bảng điều khiển →',

  'sidebar.folders': 'Thư mục',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Thùng rác',
  'sidebar.rootDir': 'Gốc',
  'sidebar.noFolders': 'Không có thư mục',
  'folder.new': 'Mới',
  'folder.history': 'Lịch sử',
  'folder.deleteFolder': 'Xóa thư mục',
  'folder.empty': 'Thư mục trống',
  'folder.emptyHint': '+ Ghi chú mới',
  'file.preview': 'Xem trước',
  'file.edit': 'Chỉnh sửa',
  'file.save': 'Lưu',
  'file.saved': 'Đã lưu',
  'file.history': 'Lịch sử',
  'file.append': 'Thêm',
  'file.delete': 'Xóa',
  'file.loading': 'Đang tải...',
  'file.loadFailed': 'Tải thất bại',

  'version.title': 'Lịch sử phiên bản',
  'version.current': 'Hiện tại',
  'version.diff': 'So sánh',
  'version.restore': 'Khôi phục',
  'version.loading': 'Đang tải...',
  'version.empty': 'Không có lịch sử',
  'version.loadFailed': 'Tải thất bại',

  'diff.title': 'Chi tiết so sánh',
  'diff.back': '←',
  'diff.loading': 'Đang tải...',
  'diff.noDiff': 'Không có sự khác biệt',
  'diff.loadFailed': 'Tải thất bại',

  'config.title': 'Cấu hình tích hợp',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'Prompt AI',
  'config.mcpLabel': 'Cấu hình MCP',
  'config.dangerLabel': 'Vùng nguy hiểm',
  'config.destroy': 'Hủy token này',

  'recycle.title': 'Thùng rác',
  'recycle.empty': 'Thùng rác trống',
  'recycle.close': 'Đóng',
  'recycle.loading': 'Đang tải...',
  'recycle.loadFailed': 'Tải thất bại',

  'newNote.title': 'Ghi chú mới',
  'appendModal.title': 'Thêm nội dung',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Nhập token để truy cập bảng điều khiển',
  'tokenModal.error': 'Token không hợp lệ',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Trang chủ',
  'tokenModal.enter': 'Vào',

  'export.zip': 'Tải tất cả (.zip)',
  'export.json': 'Xuất JSON',

  'ctx.view': 'Xem',
  'ctx.edit': 'Chỉnh sửa',
  'ctx.append': 'Thêm',
  'ctx.copyPath': 'Sao chép đường dẫn',
  'ctx.download': 'Tải xuống',
  'ctx.delete': 'Xóa',
  'ctx.open': 'Mở',
  'ctx.newNote': 'Ghi chú mới',
  'ctx.history': 'Lịch sử phiên bản',
  'ctx.downloadZip': 'Tải xuống (.zip)',
  'ctx.deleteFolder': 'Xóa thư mục',

  'search.placeholder': 'Tìm kiếm ghi chú...',
  'search.searching': 'Đang tìm kiếm...',
  'search.noResults': 'Không có kết quả',

  'time.justNow': 'vừa xong',
  'time.yesterday': 'hôm qua',

  'confirm.unsavedLeave': 'Bạn có thay đổi chưa lưu. Vẫn rời đi?',
  'confirm.destroy1': 'Hủy token này? Tất cả dữ liệu sẽ bị xóa!',
  'confirm.destroy2': 'Xác nhận lần nữa: không thể hoàn tác!',
  'alert.saveFailed': 'Lưu thất bại',
  'alert.restoreFailed': 'Khôi phục thất bại',
  'alert.noFiles': 'Không có tệp',
  'alert.emptyFolder': 'Thư mục trống',
  'alert.downloadFailed': 'Tải xuống thất bại',

  'unsaved.warning': 'Bạn có thay đổi chưa lưu',
  'dashboard.title': 'Bảng điều khiển — NoteForAI',
  'token.copy': 'Sao chép',

  'folder.itemCount': ({count}) => `${count} mục`,
  'time.minutesAgo': ({n}) => `${n} phút trước`,
  'time.hoursAgo': ({n}) => `${n} giờ trước`,
  'confirm.deleteItem': ({path}) => `Xóa "${path}"?`,
  'confirm.deleteFolder': ({path}) => `Xóa thư mục "${path}" và toàn bộ nội dung?`,
  'confirm.revert': ({path}) => `Khôi phục "${path}" về phiên bản này?`,
  'confirm.restoreBatch': ({count}) => `Khôi phục tất cả ${count} tệp trong thư mục này?`,
  'recycle.restoreAll': ({count}) => `Khôi phục tất cả trong thư mục (${count})`,
  'zip.progress': ({done, total}) => `Đang nén ${done}/${total}`,
};

// ======================== th ========================
I18N._dict['th'] = {
  'copy': 'คัดลอก',
  'copied': 'คัดลอกแล้ว',
  'cancel': 'ยกเลิก',
  'confirm': 'ยืนยัน',
  'delete': 'ลบ',
  'save': 'บันทึก',
  'saved': 'บันทึกแล้ว',
  'loading': 'กำลังโหลด...',
  'failed': 'ล้มเหลว',
  'close': 'ปิด',
  'back': 'กลับ',
  'restore': 'กู้คืน',
  'search': 'ค้นหา',
  'export': 'ส่งออก',
  'noResults': 'ไม่พบผลลัพธ์',
  'create': 'สร้าง',
  'open': 'เปิด',
  'download': 'ดาวน์โหลด',
  'enter': 'เข้าสู่ระบบ',

  'page.title': 'NoteForAI — สมุดโน้ตเฉพาะสำหรับ AI',
  'page.description': 'NoteForAI: ระบบโน้ตที่สร้างขึ้นสำหรับ AI...',

  'nav.start': 'เริ่มต้น',
  'nav.integration': 'การเชื่อมต่อ',
  'nav.features': 'ฟีเจอร์',
  'nav.api': 'API',
  'nav.dashboard': 'แดชบอร์ด',

  'hero.badge': 'ตอนนี้มี Git เวอร์ชัน + ส่งออก',
  'hero.title': 'สมุดโน้ตเฉพาะ<br>สำหรับ AI',
  'hero.subtitle': 'เปลี่ยน AI แต่เก็บความทรงจำไว้ · เลิกทำการเปลี่ยนแปลงใดก็ได้ · ส่งออกได้ตลอดเวลา',
  'hero.techLine': 'โปรโตคอลคู่ HTTP + MCP · Git เวอร์ชัน · ค้นหาข้อความเต็ม · โทเค็นเดียวสำหรับ AI ทุกตัว',
  'hero.cta.create': 'สร้างโทเค็นฟรี',
  'hero.cta.dashboard': 'แดชบอร์ด',

  'hero.before.label': '❌ ไม่มี NoteForAI',
  'hero.before.user': 'ผู้ใช้: ฉันทำงานด้านผลิตภัณฑ์ AI เคยบอกว่าชอบสไตล์มินิมอล...',
  'hero.before.ai': 'AI: ขอโทษ ฉันไม่มีบันทึกจากการสนทนาครั้งก่อน คุณช่วยแนะนำตัวเองอีกครั้งได้ไหม?',
  'hero.before.note': 'ต้องแนะนำตัวเองใหม่ทุกครั้ง',
  'hero.after.label': '✔ มี NoteForAI',
  'hero.after.user': 'ผู้ใช้: ช่วยปรับปรุงดีไซน์นี้ให้หน่อย',
  'hero.after.ai': 'AI: แน่นอน! จากความชอบสไตล์มินิมอลและโปรเจกต์ refactoring NoteForAI ของคุณ ฉันแนะนำว่า...',
  'hero.after.note': 'เหมือนเพื่อนเก่าที่จำทุกอย่างได้',

  'compat.title': 'ใช้ได้กับทุกเครื่องมือ AI ที่คุณใช้',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ เครื่องมือ AI อื่นๆ',
  'compat.note': 'ไม่ถูกล็อกแพลตฟอร์ม · เปลี่ยน AI แต่เก็บความทรงจำ · HTTP API สากล',

  'steps.title': 'เริ่มต้นใน 3 ขั้นตอน',
  'steps.subtitle': '5 นาทีในการตั้งค่า มอบความทรงจำถาวรให้ AI ของคุณ',
  'steps.1.title': 'สร้างโทเค็น',
  'steps.1.desc': 'คลิกเดียวเพื่อสร้าง — ไม่ต้องสมัครสมาชิก พร้อมใช้งานทันที',
  'steps.2.title': 'คัดลอก Prompt ไปยัง AI',
  'steps.2.desc': 'System prompt ครบถ้วนถูกสร้างอัตโนมัติ — แค่วางลงในการตั้งค่า AI',
  'steps.3.title': 'เริ่มสนทนา',
  'steps.3.desc': 'AI จดจำอัตโนมัติ — การสนทนาครั้งต่อไปต่อจากจุดที่หยุด',

  'integration.title': 'การเชื่อมต่อ',
  'integration.subtitle': 'Prompt คัดลอก-วาง · ตั้งค่า MCP คลิกเดียว · เข้าถึง API โดยตรง',
  'integration.tab.prompt': 'AI Prompt',
  'integration.tab.mcp': 'ตั้งค่า MCP',
  'integration.tab.curl': 'ตัวอย่าง curl',
  'integration.hint.prompt': 'หลังสร้างโทเค็น prompt จะเติม endpoint API จริงและโทเค็นของคุณอัตโนมัติ — คัดลอกและใช้ได้เลย',
  'integration.hint.mcp': 'สำหรับ Claude Desktop / Cursor / Windsurf ฯลฯ การเชื่อมต่อ HTTP ระยะไกลแบบ Streamable — ไม่ต้องติดตั้ง client แค่เปลี่ยนโทเค็นใน URL',
  'integration.hint.curl': 'ทุก endpoint รองรับทั้ง GET (query params) และ POST (JSON body)',

  'aiBehavior.title': 'AI ทำอะไรหลังจากตั้งค่า?',
  'aiBehavior.subtitle': 'นี่คือสิ่งที่ AI ทำจริงๆ ในตอนต้นของแต่ละการสนทนา',
  'aiBehavior.sessionStart': 'เริ่มการสนทนา AI',
  'aiBehavior.treeComment': '// ทบทวนโครงสร้างความทรงจำ',
  'aiBehavior.treeOutput': '📁 ผู้ใช้/\n  📄 ความชอบ.md\n  📄 โปรเจกต์.md\n  📁 โน้ต/',
  'aiBehavior.readCall': 'read("ผู้ใช้/ความชอบ.md")',
  'aiBehavior.readComment': '// อ่านตามต้องการ',
  'aiBehavior.greeting': 'ยินดีต้อนรับกลับมา! เห็นว่าคุณกำลังทำโปรเจกต์ refactoring อยู่ — อยากต่อจากจุดที่หยุดไหม?',
  'aiBehavior.userLabel': 'คุณ',
  'aiBehavior.userNote': 'ข้อมูลที่มีคุณค่าใดๆ ในการสนทนา — AI จะ <code class="text-indigo-500 text-xs">write()</code> บันทึกลงโน้ตอัตโนมัติ',

  'features.title': 'สร้างมาเพื่อการจดโน้ต AI',
  'features.subtitle': 'ทุกรายละเอียดออกแบบมาเพื่อช่วยให้ AI จัดการและใช้ข้อมูลของคุณได้ดียิ่งขึ้น',
  'features.storage.title': 'จัดเก็บถาวร',
  'features.storage.desc': 'โน้ตบันทึกถาวรข้ามการสนทนา — AI เรียกคืนได้ตลอดเวลา ไม่มีวันลืม',
  'features.search.title': 'ค้นหาข้อความเต็ม',
  'features.search.desc': 'แบ่งคำ CJK + อังกฤษ ดึงข้อมูลมิลลิวินาที ระบุข้อมูลใดๆ ได้อย่างแม่นยำ',
  'features.hierarchy.title': 'โครงสร้างโฟลเดอร์',
  'features.hierarchy.desc': 'เส้นทางแบบโฟลเดอร์ — AI จัดระเบียบโครงสร้างเองอัตโนมัติ เป็นระเบียบเรียบร้อย',
  'features.git.title': 'ป้องกันเวอร์ชัน Git',
  'features.git.desc': 'Snapshot อัตโนมัติทุกครั้งที่แก้ไข — กู้คืนการลบ ประวัติครบถ้วนสำหรับย้อนกลับ',
  'features.export.title': 'ส่งออกคลิกเดียว',
  'features.export.desc': 'ZIP / JSON / Markdown — ย้ายข้อมูลได้ตลอดเวลา ไม่ถูกล็อก',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'โปรโตคอลคู่ — MCP แบบ native สำหรับ Claude Code, HTTP สำหรับเข้าถึงทั่วไป',
  'features.token.title': 'แยกส่วนด้วยโทเค็น',
  'features.token.desc': 'แต่ละโทเค็นมีพื้นที่ของตัวเอง — ไม่ต้องมีบัญชี เป็นส่วนตัวอย่างสมบูรณ์',
  'features.ui.title': 'แดชบอร์ดจัดการ',
  'features.ui.desc': 'Web UI แบบ file manager — ดู แก้ไข ค้นหา ย้อนเวอร์ชัน',
  'features.selfhost.title': 'Self-host ได้',
  'features.selfhost.desc': 'Go binary ตัวเดียว, Docker คลิกเดียว — ควบคุมข้อมูลอย่างสมบูรณ์',

  'api.title': 'เอกสาร API',
  'api.subtitle.pre': 'รูปแบบ: ',
  'api.subtitle.post': ' + JSON body รองรับ GET query params ด้วย',
  'api.col.op': 'การกระทำ',
  'api.col.desc': 'คำอธิบาย',
  'api.col.params': 'พารามิเตอร์',
  'api.write': 'สร้างหรือเขียนทับ',
  'api.append': 'เพิ่มเนื้อหา',
  'api.read': 'อ่านโน้ต',
  'api.search': 'ค้นหาข้อความเต็ม',
  'api.tree': 'โครงสร้างไดเรกทอรี',
  'api.history': 'ประวัติเวอร์ชัน',
  'api.delete': 'ลบ (ลงถังขยะ)',

  'data.title': 'ข้อมูลของคุณเป็นของคุณเสมอ',
  'data.subtitle': 'ไม่เหมือนความทรงจำแบบกล่องดำในแพลตฟอร์มอื่น NoteForAI มอบการควบคุมข้อมูลอย่างสมบูรณ์',
  'data.transparent.title': 'โปร่งใสอย่างสมบูรณ์',
  'data.transparent.desc': 'ดูเนื้อหาโน้ตทั้งหมดในแดชบอร์ด — ไม่มีกล่องดำ ทุกอย่างมองเห็นได้',
  'data.export.title': 'ส่งออกได้ตลอดเวลา',
  'data.export.desc': 'ส่งออกโน้ตทั้งหมดคลิกเดียวเป็น Markdown ZIP หรือ JSON — ย้ายได้อย่างอิสระ ไม่ถูกล็อก',
  'data.version.title': 'ย้อนเวอร์ชัน',
  'data.version.desc': 'เวอร์ชันที่ขับเคลื่อนด้วย Git — ทุกการแก้ไขถูกติดตาม การลบกู้คืนได้ ประวัติ 30 วันครบถ้วน',

  'email.title': 'ส่งการตั้งค่าทางอีเมล',
  'email.desc': 'โทเค็น prompt และคู่มือตั้งค่า — ส่งไปยังกล่องจดหมายเพื่อเก็บไว้',
  'email.placeholder': 'your@email.com',
  'email.send': 'ส่ง',
  'email.sent': '✓ ส่งแล้ว! ตรวจสอบกล่องจดหมาย',
  'email.hint': 'ส่งผ่าน email client ในเครื่อง ไม่ผ่านเซิร์ฟเวอร์ของเรา',
  'email.subject': 'คู่มือตั้งค่า NoteForAI',

  'footer.tagline': 'สมุดโน้ตสำหรับ AI',
  'footer.dashboard': 'แดชบอร์ด',

  'modal.step1.heading': 'โทเค็นเฉพาะของคุณ',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'เก็บโทเค็นนี้ไว้อย่างปลอดภัย — มันคือกุญแจเดียวสู่พื้นที่โน้ตของคุณ',
  'modal.step1.next': 'ถัดไป: ตั้งค่า AI →',
  'modal.step2.heading': 'ตั้งค่า AI ของคุณ',
  'modal.step2.copyPrompt': 'คัดลอก Prompt',
  'modal.step2.emailBtn': '✉️ ส่งอีเมล',
  'modal.step2.dashboard': 'ไปที่แดชบอร์ด →',

  'sidebar.folders': 'โฟลเดอร์',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'ถังขยะ',
  'sidebar.rootDir': 'ราก',
  'sidebar.noFolders': 'ไม่มีโฟลเดอร์',
  'folder.new': 'ใหม่',
  'folder.history': 'ประวัติ',
  'folder.deleteFolder': 'ลบโฟลเดอร์',
  'folder.empty': 'โฟลเดอร์ว่าง',
  'folder.emptyHint': '+ โน้ตใหม่',
  'file.preview': 'ดูตัวอย่าง',
  'file.edit': 'แก้ไข',
  'file.save': 'บันทึก',
  'file.saved': 'บันทึกแล้ว',
  'file.history': 'ประวัติ',
  'file.append': 'เพิ่ม',
  'file.delete': 'ลบ',
  'file.loading': 'กำลังโหลด...',
  'file.loadFailed': 'โหลดล้มเหลว',

  'version.title': 'ประวัติเวอร์ชัน',
  'version.current': 'ปัจจุบัน',
  'version.diff': 'เปรียบเทียบ',
  'version.restore': 'กู้คืน',
  'version.loading': 'กำลังโหลด...',
  'version.empty': 'ไม่มีประวัติ',
  'version.loadFailed': 'โหลดล้มเหลว',

  'diff.title': 'รายละเอียดการเปรียบเทียบ',
  'diff.back': '←',
  'diff.loading': 'กำลังโหลด...',
  'diff.noDiff': 'ไม่มีความแตกต่าง',
  'diff.loadFailed': 'โหลดล้มเหลว',

  'config.title': 'การตั้งค่าการเชื่อมต่อ',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'AI Prompt',
  'config.mcpLabel': 'ตั้งค่า MCP',
  'config.dangerLabel': 'โซนอันตราย',
  'config.destroy': 'ทำลายโทเค็นนี้',

  'recycle.title': 'ถังขยะ',
  'recycle.empty': 'ถังขยะว่าง',
  'recycle.close': 'ปิด',
  'recycle.loading': 'กำลังโหลด...',
  'recycle.loadFailed': 'โหลดล้มเหลว',

  'newNote.title': 'โน้ตใหม่',
  'appendModal.title': 'เพิ่มเนื้อหา',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'ป้อนโทเค็นเพื่อเข้าถึงแดชบอร์ด',
  'tokenModal.error': 'โทเค็นไม่ถูกต้อง',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'หน้าแรก',
  'tokenModal.enter': 'เข้าสู่ระบบ',

  'export.zip': 'ดาวน์โหลดทั้งหมด (.zip)',
  'export.json': 'ส่งออก JSON',

  'ctx.view': 'ดู',
  'ctx.edit': 'แก้ไข',
  'ctx.append': 'เพิ่ม',
  'ctx.copyPath': 'คัดลอกเส้นทาง',
  'ctx.download': 'ดาวน์โหลด',
  'ctx.delete': 'ลบ',
  'ctx.open': 'เปิด',
  'ctx.newNote': 'โน้ตใหม่',
  'ctx.history': 'ประวัติเวอร์ชัน',
  'ctx.downloadZip': 'ดาวน์โหลด (.zip)',
  'ctx.deleteFolder': 'ลบโฟลเดอร์',

  'search.placeholder': 'ค้นหาโน้ต...',
  'search.searching': 'กำลังค้นหา...',
  'search.noResults': 'ไม่พบผลลัพธ์',

  'time.justNow': 'เมื่อกี้',
  'time.yesterday': 'เมื่อวาน',

  'confirm.unsavedLeave': 'คุณมีการเปลี่ยนแปลงที่ยังไม่บันทึก ออกไปเลยไหม?',
  'confirm.destroy1': 'ทำลายโทเค็นนี้? ข้อมูลทั้งหมดจะถูกลบ!',
  'confirm.destroy2': 'ยืนยันอีกครั้ง: ไม่สามารถยกเลิกได้!',
  'alert.saveFailed': 'บันทึกล้มเหลว',
  'alert.restoreFailed': 'กู้คืนล้มเหลว',
  'alert.noFiles': 'ไม่มีไฟล์',
  'alert.emptyFolder': 'โฟลเดอร์ว่าง',
  'alert.downloadFailed': 'ดาวน์โหลดล้มเหลว',

  'unsaved.warning': 'คุณมีการเปลี่ยนแปลงที่ยังไม่บันทึก',
  'dashboard.title': 'แดชบอร์ด — NoteForAI',
  'token.copy': 'คัดลอก',

  'folder.itemCount': ({count}) => `${count} รายการ`,
  'time.minutesAgo': ({n}) => `${n} นาทีที่แล้ว`,
  'time.hoursAgo': ({n}) => `${n} ชั่วโมงที่แล้ว`,
  'confirm.deleteItem': ({path}) => `ลบ "${path}"?`,
  'confirm.deleteFolder': ({path}) => `ลบโฟลเดอร์ "${path}" และเนื้อหาทั้งหมด?`,
  'confirm.revert': ({path}) => `กู้คืน "${path}" เป็นเวอร์ชันนี้?`,
  'confirm.restoreBatch': ({count}) => `กู้คืนไฟล์ทั้งหมด ${count} ไฟล์ในโฟลเดอร์นี้?`,
  'recycle.restoreAll': ({count}) => `กู้คืนทั้งหมดในโฟลเดอร์ (${count})`,
  'zip.progress': ({done, total}) => `กำลังบีบอัด ${done}/${total}`,
};

// ======================== id ========================
I18N._dict['id'] = {
  'copy': 'Salin',
  'copied': 'Disalin',
  'cancel': 'Batal',
  'confirm': 'Konfirmasi',
  'delete': 'Hapus',
  'save': 'Simpan',
  'saved': 'Tersimpan',
  'loading': 'Memuat...',
  'failed': 'Gagal',
  'close': 'Tutup',
  'back': 'Kembali',
  'restore': 'Pulihkan',
  'search': 'Cari',
  'export': 'Ekspor',
  'noResults': 'Tidak ada hasil',
  'create': 'Buat',
  'open': 'Buka',
  'download': 'Unduh',
  'enter': 'Masuk',

  'page.title': 'NoteForAI — Buku Catatan Khusus untuk AI',
  'page.description': 'NoteForAI: Sistem catatan yang dibangun untuk AI...',

  'nav.start': 'Mulai',
  'nav.integration': 'Integrasi',
  'nav.features': 'Fitur',
  'nav.api': 'API',
  'nav.dashboard': 'Dasbor',

  'hero.badge': 'Kini dengan versioning Git + ekspor',
  'hero.title': 'Buku Catatan<br>Khusus untuk AI',
  'hero.subtitle': 'Ganti AI tetap ingat · Batalkan perubahan apapun · Ekspor kapanpun',
  'hero.techLine': 'Protokol ganda HTTP + MCP · Versioning Git · Pencarian teks penuh · Satu token untuk AI apapun',
  'hero.cta.create': 'Buat Token Gratis',
  'hero.cta.dashboard': 'Dasbor',

  'hero.before.label': '❌ Tanpa NoteForAI',
  'hero.before.user': 'Pengguna: Saya bekerja di produk AI, pernah bilang saya suka gaya minimalis...',
  'hero.before.ai': 'AI: Maaf, saya tidak punya catatan dari percakapan sebelumnya. Bisakah Anda memperkenalkan diri lagi?',
  'hero.before.note': 'Perkenalkan diri di setiap percakapan',
  'hero.after.label': '✔ Dengan NoteForAI',
  'hero.after.user': 'Pengguna: Bantu saya tingkatkan desain ini',
  'hero.after.ai': 'AI: Tentu! Berdasarkan preferensi gaya minimalis dan proyek refactoring NoteForAI Anda, saya sarankan...',
  'hero.after.note': 'Seperti teman lama yang ingat segalanya',

  'compat.title': 'Kompatibel dengan alat AI apapun yang Anda gunakan',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Alat AI apapun',
  'compat.note': 'Tidak terkunci platform · Ganti alat AI tetap simpan memori · HTTP API universal',

  'steps.title': 'Mulai dalam 3 Langkah',
  'steps.subtitle': '5 menit untuk setup, beri AI Anda memori persisten',
  'steps.1.title': 'Buat Token',
  'steps.1.desc': 'Satu klik untuk membuat — tanpa daftar, langsung siap',
  'steps.2.title': 'Salin Prompt ke AI',
  'steps.2.desc': 'System prompt lengkap dibuat otomatis — tinggal tempel ke pengaturan AI',
  'steps.3.title': 'Mulai Mengobrol',
  'steps.3.desc': 'AI ingat otomatis — percakapan berikutnya lanjut tepat dari tempat terakhir',

  'integration.title': 'Integrasi',
  'integration.subtitle': 'Prompt salin-tempel · Konfigurasi MCP satu klik · Akses API langsung',
  'integration.tab.prompt': 'Prompt AI',
  'integration.tab.mcp': 'Konfigurasi MCP',
  'integration.tab.curl': 'Contoh curl',
  'integration.hint.prompt': 'Setelah membuat token, prompt otomatis terisi endpoint API nyata dan token Anda — salin dan langsung pakai',
  'integration.hint.mcp': 'Untuk Claude Desktop / Cursor / Windsurf dll. Koneksi HTTP jarak jauh Streamable — tidak perlu instal klien, cukup ganti token di URL',
  'integration.hint.curl': 'Semua endpoint mendukung GET (query params) dan POST (JSON body)',

  'aiBehavior.title': 'Bagaimana AI berperilaku setelah setup?',
  'aiBehavior.subtitle': 'Inilah yang AI lakukan di awal setiap percakapan',
  'aiBehavior.sessionStart': 'Percakapan AI dimulai',
  'aiBehavior.treeComment': '// Tinjau struktur memori',
  'aiBehavior.treeOutput': '📁 pengguna/\n  📄 preferensi.md\n  📄 proyek.md\n  📁 catatan/',
  'aiBehavior.readCall': 'read("pengguna/preferensi.md")',
  'aiBehavior.readComment': '// Baca sesuai kebutuhan',
  'aiBehavior.greeting': 'Selamat datang kembali! Saya lihat Anda sedang mengerjakan proyek refactoring — mau lanjut dari tempat terakhir?',
  'aiBehavior.userLabel': 'Anda',
  'aiBehavior.userNote': 'Informasi berharga apapun dalam percakapan — AI otomatis <code class="text-indigo-500 text-xs">write()</code> simpan ke catatan',

  'features.title': 'Dibangun untuk Pencatatan AI',
  'features.subtitle': 'Setiap detail dirancang untuk membantu AI mengelola dan menggunakan informasi Anda dengan lebih baik',
  'features.storage.title': 'Penyimpanan Persisten',
  'features.storage.desc': 'Catatan tersimpan permanen lintas percakapan — AI ingat kapanpun, tidak pernah lupa',
  'features.search.title': 'Pencarian Teks Penuh',
  'features.search.desc': 'Tokenisasi CJK + Inggris, pengambilan milidetik, temukan informasi apapun dengan tepat',
  'features.hierarchy.title': 'Hierarki Direktori',
  'features.hierarchy.desc': 'Path berbasis folder — AI atur struktur secara mandiri, bersih dan teratur',
  'features.git.title': 'Perlindungan Versi Git',
  'features.git.desc': 'Snapshot otomatis setiap edit — pulihkan penghapusan, rollback riwayat penuh',
  'features.export.title': 'Ekspor Satu Klik',
  'features.export.desc': 'ZIP / JSON / Markdown — migrasi kapanpun tanpa terkunci',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Protokol ganda — MCP native untuk Claude Code, HTTP untuk akses universal',
  'features.token.title': 'Isolasi Token',
  'features.token.desc': 'Setiap token punya ruang sendiri — tanpa akun, sepenuhnya privat',
  'features.ui.title': 'Dasbor Manajemen',
  'features.ui.desc': 'Web UI gaya file manager — jelajahi, edit, cari, rollback versi',
  'features.selfhost.title': 'Bisa Self-Host',
  'features.selfhost.desc': 'Binary Go tunggal, Docker satu klik — kedaulatan data penuh',

  'api.title': 'Referensi API',
  'api.subtitle.pre': 'Format: ',
  'api.subtitle.post': ' + JSON body, juga mendukung GET query params',
  'api.col.op': 'Aksi',
  'api.col.desc': 'Deskripsi',
  'api.col.params': 'Parameter',
  'api.write': 'Buat atau timpa',
  'api.append': 'Tambahkan konten',
  'api.read': 'Baca catatan',
  'api.search': 'Pencarian teks penuh',
  'api.tree': 'Pohon direktori',
  'api.history': 'Riwayat versi',
  'api.delete': 'Hapus (ke tempat sampah)',

  'data.title': 'Data Anda Selalu Milik Anda',
  'data.subtitle': 'Berbeda dengan memori kotak hitam di platform lain, NoteForAI memberi Anda kendali penuh atas data',
  'data.transparent.title': 'Sepenuhnya Transparan',
  'data.transparent.desc': 'Lihat semua isi catatan di dasbor — tidak ada kotak hitam, semuanya terlihat',
  'data.export.title': 'Ekspor Kapanpun',
  'data.export.desc': 'Ekspor semua catatan satu klik sebagai Markdown ZIP atau JSON — migrasi bebas tanpa terkunci platform',
  'data.version.title': 'Rollback Versi',
  'data.version.desc': 'Versioning berbasis Git — setiap edit terlacak, penghapusan bisa dipulihkan, 30 hari riwayat penuh',

  'email.title': 'Email Konfigurasi Anda',
  'email.desc': 'Token, prompt, dan panduan setup — kirim ke kotak masuk untuk disimpan',
  'email.placeholder': 'anda@email.com',
  'email.send': 'Kirim',
  'email.sent': '✓ Terkirim! Periksa kotak masuk Anda',
  'email.hint': 'Dikirim melalui klien email lokal, tidak pernah melalui server kami',
  'email.subject': 'Panduan Setup NoteForAI',

  'footer.tagline': 'Buku Catatan untuk AI',
  'footer.dashboard': 'Dasbor',

  'modal.step1.heading': 'Token Eksklusif Anda',
  'modal.step1.tokenLabel': 'TOKEN',
  'modal.step1.note': 'Simpan token ini dengan aman — ini adalah satu-satunya kunci ke ruang catatan Anda.',
  'modal.step1.next': 'Berikutnya: Konfigurasi AI →',
  'modal.step2.heading': 'Konfigurasi AI Anda',
  'modal.step2.copyPrompt': 'Salin Prompt',
  'modal.step2.emailBtn': '✉️ Kirim Email',
  'modal.step2.dashboard': 'Pergi ke Dasbor →',

  'sidebar.folders': 'Folder',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Tempat Sampah',
  'sidebar.rootDir': 'Akar',
  'sidebar.noFolders': 'Tidak ada folder',
  'folder.new': 'Baru',
  'folder.history': 'Riwayat',
  'folder.deleteFolder': 'Hapus Folder',
  'folder.empty': 'Folder kosong',
  'folder.emptyHint': '+ Catatan Baru',
  'file.preview': 'Pratinjau',
  'file.edit': 'Edit',
  'file.save': 'Simpan',
  'file.saved': 'Tersimpan',
  'file.history': 'Riwayat',
  'file.append': 'Tambah',
  'file.delete': 'Hapus',
  'file.loading': 'Memuat...',
  'file.loadFailed': 'Gagal memuat',

  'version.title': 'Riwayat Versi',
  'version.current': 'Saat Ini',
  'version.diff': 'Diff',
  'version.restore': 'Pulihkan',
  'version.loading': 'Memuat...',
  'version.empty': 'Tidak ada riwayat',
  'version.loadFailed': 'Gagal memuat',

  'diff.title': 'Detail Diff',
  'diff.back': '←',
  'diff.loading': 'Memuat...',
  'diff.noDiff': 'Tidak ada perbedaan',
  'diff.loadFailed': 'Gagal memuat',

  'config.title': 'Konfigurasi Integrasi',
  'config.tokenLabel': 'TOKEN',
  'config.promptLabel': 'Prompt AI',
  'config.mcpLabel': 'Konfigurasi MCP',
  'config.dangerLabel': 'Zona Bahaya',
  'config.destroy': 'Hancurkan Token Ini',

  'recycle.title': 'Tempat Sampah',
  'recycle.empty': 'Tempat sampah kosong',
  'recycle.close': 'Tutup',
  'recycle.loading': 'Memuat...',
  'recycle.loadFailed': 'Gagal memuat',

  'newNote.title': 'Catatan Baru',
  'appendModal.title': 'Tambahkan Konten',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Masukkan token untuk mengakses dasbor',
  'tokenModal.error': 'Token tidak valid',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Beranda',
  'tokenModal.enter': 'Masuk',

  'export.zip': 'Unduh semua (.zip)',
  'export.json': 'Ekspor JSON',

  'ctx.view': 'Lihat',
  'ctx.edit': 'Edit',
  'ctx.append': 'Tambah',
  'ctx.copyPath': 'Salin Path',
  'ctx.download': 'Unduh',
  'ctx.delete': 'Hapus',
  'ctx.open': 'Buka',
  'ctx.newNote': 'Catatan Baru',
  'ctx.history': 'Riwayat Versi',
  'ctx.downloadZip': 'Unduh (.zip)',
  'ctx.deleteFolder': 'Hapus Folder',

  'search.placeholder': 'Cari catatan...',
  'search.searching': 'Mencari...',
  'search.noResults': 'Tidak ada hasil',

  'time.justNow': 'baru saja',
  'time.yesterday': 'kemarin',

  'confirm.unsavedLeave': 'Ada perubahan yang belum disimpan. Tetap pergi?',
  'confirm.destroy1': 'Hancurkan token ini? Semua data akan dihapus!',
  'confirm.destroy2': 'Konfirmasi lagi: tidak bisa dibatalkan!',
  'alert.saveFailed': 'Gagal menyimpan',
  'alert.restoreFailed': 'Gagal memulihkan',
  'alert.noFiles': 'Tidak ada file',
  'alert.emptyFolder': 'Folder kosong',
  'alert.downloadFailed': 'Gagal mengunduh',

  'unsaved.warning': 'Ada perubahan yang belum disimpan',
  'dashboard.title': 'Dasbor — NoteForAI',
  'token.copy': 'Salin',

  'folder.itemCount': ({count}) => `${count} item`,
  'time.minutesAgo': ({n}) => `${n} menit lalu`,
  'time.hoursAgo': ({n}) => `${n} jam lalu`,
  'confirm.deleteItem': ({path}) => `Hapus "${path}"?`,
  'confirm.deleteFolder': ({path}) => `Hapus folder "${path}" beserta seluruh isinya?`,
  'confirm.revert': ({path}) => `Pulihkan "${path}" ke versi ini?`,
  'confirm.restoreBatch': ({count}) => `Pulihkan semua ${count} file di folder ini?`,
  'recycle.restoreAll': ({count}) => `Pulihkan semua di folder (${count})`,
  'zip.progress': ({done, total}) => `Mengemas ${done}/${total}`,
};

// ======================== uk ========================
I18N._dict['uk'] = {
  'copy': 'Копіювати',
  'copied': 'Скопійовано',
  'cancel': 'Скасувати',
  'confirm': 'Підтвердити',
  'delete': 'Видалити',
  'save': 'Зберегти',
  'saved': 'Збережено',
  'loading': 'Завантаження...',
  'failed': 'Помилка',
  'close': 'Закрити',
  'back': 'Назад',
  'restore': 'Відновити',
  'search': 'Пошук',
  'export': 'Експорт',
  'noResults': 'Немає результатів',
  'create': 'Створити',
  'open': 'Відкрити',
  'download': 'Завантажити',
  'enter': 'Увійти',

  'page.title': 'NoteForAI — Спеціальний блокнот для ШІ',
  'page.description': 'NoteForAI: Система нотаток, створена для ШІ...',

  'nav.start': 'Початок',
  'nav.integration': 'Інтеграція',
  'nav.features': 'Функції',
  'nav.api': 'API',
  'nav.dashboard': 'Панель керування',

  'hero.badge': 'Тепер з Git-версіонуванням + експортом',
  'hero.title': 'Спеціальний<br>блокнот для ШІ',
  'hero.subtitle': 'Змінюйте ШІ — пам\'ять збережеться · Скасуйте будь-яку зміну · Експортуйте коли завгодно',
  'hero.techLine': 'Подвійний протокол HTTP + MCP · Git-версіонування · Повнотекстовий пошук · Один токен для будь-якого ШІ',
  'hero.cta.create': 'Створити безкоштовний токен',
  'hero.cta.dashboard': 'Панель керування',

  'hero.before.label': '❌ Без NoteForAI',
  'hero.before.user': 'Користувач: Я працюю над продуктами ШІ, казав що воліє мінімалістичний стиль...',
  'hero.before.ai': 'ШІ: Вибачте, у мене немає записів з нашої попередньої розмови. Чи не могли б ви представитися знову?',
  'hero.before.note': 'Представлятися заново кожної розмови',
  'hero.after.label': '✔ З NoteForAI',
  'hero.after.user': 'Користувач: Допоможи покращити цей дизайн',
  'hero.after.ai': 'ШІ: Звичайно! Зважаючи на ваш потяг до мінімалістичного стилю та проект рефакторингу NoteForAI, пропоную...',
  'hero.after.note': 'Як старий друг, що пам\'ятає все',

  'compat.title': 'Сумісний з будь-яким ШІ-інструментом',
  'compat.claude': '🤖 Claude',
  'compat.chatgpt': '💬 ChatGPT',
  'compat.gemini': '✨ Gemini',
  'compat.cursor': '🖱 Cursor',
  'compat.copilot': '💻 Copilot',
  'compat.perplexity': '🔮 Perplexity',
  'compat.chinese': '🌟 Tongyi/Wenxin',
  'compat.any': '+ Будь-який ШІ-інструмент',
  'compat.note': 'Без прив\'язки до платформи · Змінюйте ШІ — пам\'ять збережеться · Універсальний HTTP API',

  'steps.title': 'Розпочніть за 3 кроки',
  'steps.subtitle': '5 хвилин на налаштування — дайте ШІ постійну пам\'ять',
  'steps.1.title': 'Створіть токен',
  'steps.1.desc': 'Один клік для генерації — без реєстрації, одразу готово',
  'steps.2.title': 'Скопіюйте підказку в ШІ',
  'steps.2.desc': 'Повна системна підказка генерується автоматично — просто вставте в налаштування ШІ',
  'steps.3.title': 'Почніть спілкування',
  'steps.3.desc': 'ШІ запам\'ятовує автоматично — наступна розмова продовжується з того місця',

  'integration.title': 'Інтеграція',
  'integration.subtitle': 'Підказка копіювати-вставити · Конфігурація MCP одним кліком · Прямий доступ до API',
  'integration.tab.prompt': 'Підказка ШІ',
  'integration.tab.mcp': 'Конфігурація MCP',
  'integration.tab.curl': 'Приклади curl',
  'integration.hint.prompt': 'Після створення токена підказка автоматично заповнюється реальним API-ендпоінтом і токеном — скопіюйте та використовуйте одразу',
  'integration.hint.mcp': 'Для Claude Desktop / Cursor / Windsurf тощо. Потокове віддалене HTTP-підключення — не потрібно встановлювати клієнт, просто замініть токен в URL',
  'integration.hint.curl': 'Всі ендпоінти підтримують GET (query params) і POST (JSON body)',

  'aiBehavior.title': 'Як ШІ поводиться після налаштування?',
  'aiBehavior.subtitle': 'Ось що ШІ насправді робить на початку кожної розмови',
  'aiBehavior.sessionStart': 'Розмова зі ШІ починається',
  'aiBehavior.treeComment': '// Переглянути структуру пам\'яті',
  'aiBehavior.treeOutput': '📁 користувач/\n  📄 уподобання.md\n  📄 проекти.md\n  📁 нотатки/',
  'aiBehavior.readCall': 'read("користувач/уподобання.md")',
  'aiBehavior.readComment': '// Читати за потреби',
  'aiBehavior.greeting': 'З поверненням! Бачу, ви працюєте над проектом рефакторингу — продовжимо з того місця?',
  'aiBehavior.userLabel': 'Ви',
  'aiBehavior.userNote': 'Будь-яка цінна інформація в розмові — ШІ автоматично <code class="text-indigo-500 text-xs">write()</code> зберігає в нотатки',

  'features.title': 'Створено для нотаток ШІ',
  'features.subtitle': 'Кожна деталь розроблена, щоб допомогти ШІ краще управляти вашою інформацією',
  'features.storage.title': 'Постійне сховище',
  'features.storage.desc': 'Нотатки зберігаються назавжди між розмовами — ШІ пригадає будь-коли, ніколи не забуде',
  'features.search.title': 'Повнотекстовий пошук',
  'features.search.desc': 'Токенізація CJK + англійська, пошук за мілісекунди, знаходить будь-яку інформацію точно',
  'features.hierarchy.title': 'Ієрархія директорій',
  'features.hierarchy.desc': 'Шляхи на основі папок — ШІ організовує структуру самостійно, чисто й упорядковано',
  'features.git.title': 'Захист версій Git',
  'features.git.desc': 'Автоматичний знімок при кожному редагуванні — відновлення видалень, повна історія відкату',
  'features.export.title': 'Експорт одним кліком',
  'features.export.desc': 'ZIP / JSON / Markdown — мігруйте будь-коли без прив\'язки',
  'features.protocol.title': 'MCP + HTTP',
  'features.protocol.desc': 'Подвійний протокол — нативний MCP для Claude Code, HTTP для універсального доступу',
  'features.token.title': 'Ізоляція токенів',
  'features.token.desc': 'Кожен токен має власний простір — без облікових записів, повна приватність',
  'features.ui.title': 'Панель керування',
  'features.ui.desc': 'Веб-інтерфейс у стилі файлового менеджера — перегляд, редагування, пошук, відкат версій',
  'features.selfhost.title': 'Самостійне розгортання',
  'features.selfhost.desc': 'Один бінарний файл Go, Docker одним кліком — повний суверенітет даних',

  'api.title': 'Довідник API',
  'api.subtitle.pre': 'Формат: ',
  'api.subtitle.post': ' + тіло JSON, також підтримує GET query params',
  'api.col.op': 'Дія',
  'api.col.desc': 'Опис',
  'api.col.params': 'Параметри',
  'api.write': 'Створити або перезаписати',
  'api.append': 'Додати вміст',
  'api.read': 'Прочитати нотатку',
  'api.search': 'Повнотекстовий пошук',
  'api.tree': 'Дерево директорій',
  'api.history': 'Історія версій',
  'api.delete': 'Видалити (до кошика)',

  'data.title': 'Ваші дані завжди ваші',
  'data.subtitle': 'На відміну від непрозорої пам\'яті на інших платформах, NoteForAI дає вам повний контроль над даними',
  'data.transparent.title': 'Повна прозорість',
  'data.transparent.desc': 'Перегляньте весь вміст нотаток на панелі — ніяких чорних скриньок, все видно',
  'data.export.title': 'Експорт будь-коли',
  'data.export.desc': 'Одним кліком експортуйте всі нотатки як Markdown ZIP або JSON — мігруйте вільно без прив\'язки',
  'data.version.title': 'Відкат версій',
  'data.version.desc': 'Версіонування на основі Git — кожне редагування відстежується, видалення відновлюються, 30 днів повної історії',

  'email.title': 'Надішліть конфігурацію на email',
  'email.desc': 'Токен, підказка та посібник з налаштування — надіслати на пошту для збереження',
  'email.placeholder': 'your@email.com',
  'email.send': 'Надіслати',
  'email.sent': '✓ Надіслано! Перевірте пошту',
  'email.hint': 'Надсилається через локальний поштовий клієнт, ніколи через наш сервер',
  'email.subject': 'Посібник з налаштування NoteForAI',

  'footer.tagline': 'Блокнот для ШІ',
  'footer.dashboard': 'Панель керування',

  'modal.step1.heading': 'Ваш ексклюзивний токен',
  'modal.step1.tokenLabel': 'ТОКЕН',
  'modal.step1.note': 'Зберігайте цей токен у безпеці — це єдиний ключ до вашого простору нотаток.',
  'modal.step1.next': 'Далі: Налаштувати ШІ →',
  'modal.step2.heading': 'Налаштуйте свій ШІ',
  'modal.step2.copyPrompt': 'Скопіювати підказку',
  'modal.step2.emailBtn': '✉️ Надіслати на email',
  'modal.step2.dashboard': 'Перейти до панелі →',

  'sidebar.folders': 'Папки',
  'sidebar.git': 'Git',
  'sidebar.recycleBin': 'Кошик',
  'sidebar.rootDir': 'Корінь',
  'sidebar.noFolders': 'Немає папок',
  'folder.new': 'Нова',
  'folder.history': 'Історія',
  'folder.deleteFolder': 'Видалити папку',
  'folder.empty': 'Порожня папка',
  'folder.emptyHint': '+ Нова нотатка',
  'file.preview': 'Перегляд',
  'file.edit': 'Редагувати',
  'file.save': 'Зберегти',
  'file.saved': 'Збережено',
  'file.history': 'Історія',
  'file.append': 'Додати',
  'file.delete': 'Видалити',
  'file.loading': 'Завантаження...',
  'file.loadFailed': 'Помилка завантаження',

  'version.title': 'Історія версій',
  'version.current': 'Поточна',
  'version.diff': 'Різниця',
  'version.restore': 'Відновити',
  'version.loading': 'Завантаження...',
  'version.empty': 'Немає історії',
  'version.loadFailed': 'Помилка завантаження',

  'diff.title': 'Деталі різниці',
  'diff.back': '←',
  'diff.loading': 'Завантаження...',
  'diff.noDiff': 'Немає відмінностей',
  'diff.loadFailed': 'Помилка завантаження',

  'config.title': 'Конфігурація інтеграції',
  'config.tokenLabel': 'ТОКЕН',
  'config.promptLabel': 'Підказка ШІ',
  'config.mcpLabel': 'Конфігурація MCP',
  'config.dangerLabel': 'Небезпечна зона',
  'config.destroy': 'Знищити цей токен',

  'recycle.title': 'Кошик',
  'recycle.empty': 'Кошик порожній',
  'recycle.close': 'Закрити',
  'recycle.loading': 'Завантаження...',
  'recycle.loadFailed': 'Помилка завантаження',

  'newNote.title': 'Нова нотатка',
  'appendModal.title': 'Додати вміст',
  'tokenModal.title': 'NoteForAI',
  'tokenModal.subtitle': 'Введіть токен для доступу до панелі',
  'tokenModal.error': 'Недійсний токен',
  'tokenModal.placeholder': 'nfa_xxxxxxxx...',
  'tokenModal.home': 'Головна',
  'tokenModal.enter': 'Увійти',

  'export.zip': 'Завантажити все (.zip)',
  'export.json': 'Експортувати JSON',

  'ctx.view': 'Переглянути',
  'ctx.edit': 'Редагувати',
  'ctx.append': 'Додати',
  'ctx.copyPath': 'Скопіювати шлях',
  'ctx.download': 'Завантажити',
  'ctx.delete': 'Видалити',
  'ctx.open': 'Відкрити',
  'ctx.newNote': 'Нова нотатка',
  'ctx.history': 'Історія версій',
  'ctx.downloadZip': 'Завантажити (.zip)',
  'ctx.deleteFolder': 'Видалити папку',

  'search.placeholder': 'Пошук нотаток...',
  'search.searching': 'Пошук...',
  'search.noResults': 'Немає результатів',

  'time.justNow': 'щойно',
  'time.yesterday': 'вчора',

  'confirm.unsavedLeave': 'Є незбережені зміни. Все одно вийти?',
  'confirm.destroy1': 'Знищити цей токен? Всі дані будуть видалені!',
  'confirm.destroy2': 'Підтвердіть ще раз: це незворотно!',
  'alert.saveFailed': 'Помилка збереження',
  'alert.restoreFailed': 'Помилка відновлення',
  'alert.noFiles': 'Немає файлів',
  'alert.emptyFolder': 'Порожня папка',
  'alert.downloadFailed': 'Помилка завантаження',

  'unsaved.warning': 'Є незбережені зміни',
  'dashboard.title': 'Панель керування — NoteForAI',
  'token.copy': 'Копіювати',

  'folder.itemCount': ({count}) => `${count} елем.`,
  'time.minutesAgo': ({n}) => `${n} хв тому`,
  'time.hoursAgo': ({n}) => `${n} год тому`,
  'confirm.deleteItem': ({path}) => `Видалити "${path}"?`,
  'confirm.deleteFolder': ({path}) => `Видалити папку "${path}" і весь її вміст?`,
  'confirm.revert': ({path}) => `Відновити "${path}" до цієї версії?`,
  'confirm.restoreBatch': ({count}) => `Відновити всі ${count} файлів у цій папці?`,
  'recycle.restoreAll': ({count}) => `Відновити всі в папці (${count})`,
  'zip.progress': ({done, total}) => `Пакування ${done}/${total}`,
};

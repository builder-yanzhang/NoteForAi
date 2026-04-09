package api

import (
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"noteforai/store"
	"noteforai/token"

	"github.com/mark3labs/mcp-go/server"
)

const maxBodySize = 10 << 20 // 10 MB

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (sr *statusRecorder) WriteHeader(code int) {
	sr.status = code
	sr.ResponseWriter.WriteHeader(code)
}

//go:embed ui/index.html ui/dashboard.html ui/i18n.js
var uiFS embed.FS

type HTTPServer struct {
	store      *store.Store
	dataDir    string
	mux        *http.ServeMux
	mcpMu      sync.Mutex
	mcpServers map[string]*server.StreamableHTTPServer
}

func NewHTTPServer(s *store.Store, dataDir string) *HTTPServer {
	srv := &HTTPServer{store: s, dataDir: dataDir, mux: http.NewServeMux(), mcpServers: make(map[string]*server.StreamableHTTPServer)}

	// UI
	srv.mux.HandleFunc("GET /{$}", srv.serveUI)
	srv.mux.HandleFunc("GET /index.html", srv.serveUI)
	srv.mux.HandleFunc("GET /dashboard.html", srv.serveDashboard)
	srv.mux.HandleFunc("GET /i18n.js", srv.serveI18n)

	// Token creation — no auth required
	srv.mux.HandleFunc("/create_token", srv.createToken)

	// All data operations under /{token}/
	srv.mux.HandleFunc("/{token}/write", srv.requireToken(srv.write))
	srv.mux.HandleFunc("/{token}/read", srv.requireToken(srv.read))
	srv.mux.HandleFunc("/{token}/read/{path...}", srv.requireToken(srv.read))
	srv.mux.HandleFunc("/{token}/delete", srv.requireToken(srv.delete))
	srv.mux.HandleFunc("/{token}/append", srv.requireToken(srv.append))
	srv.mux.HandleFunc("/{token}/list", srv.requireToken(srv.list))
	srv.mux.HandleFunc("/{token}/list/{path...}", srv.requireToken(srv.list))
	srv.mux.HandleFunc("/{token}/tree", srv.requireToken(srv.tree))
	srv.mux.HandleFunc("/{token}/tree/{path...}", srv.requireToken(srv.tree))
	srv.mux.HandleFunc("/{token}/search", srv.requireToken(srv.search))
	srv.mux.HandleFunc("/{token}/history", srv.requireToken(srv.history))
	srv.mux.HandleFunc("/{token}/history/{path...}", srv.requireToken(srv.history))
	srv.mux.HandleFunc("/{token}/diff", srv.requireToken(srv.diff))
	srv.mux.HandleFunc("/{token}/revert", srv.requireToken(srv.revert))
	srv.mux.HandleFunc("/{token}/deleted", srv.requireToken(srv.deleted))
	srv.mux.HandleFunc("/{token}/destroy", srv.requireToken(srv.destroy))

	// MCP Streamable HTTP
	srv.mux.HandleFunc("/{token}/mcp", srv.requireToken(srv.serveMCP))

	return srv
}

func (h *HTTPServer) serveUI(w http.ResponseWriter, r *http.Request) {
	data, _ := uiFS.ReadFile("ui/index.html")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(data)
}

func (h *HTTPServer) serveDashboard(w http.ResponseWriter, r *http.Request) {
	data, _ := uiFS.ReadFile("ui/dashboard.html")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(data)
}

func (h *HTTPServer) serveI18n(w http.ResponseWriter, r *http.Request) {
	data, _ := uiFS.ReadFile("ui/i18n.js")
	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Write(data)
}

func (h *HTTPServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)
	start := time.Now()
	rec := &statusRecorder{ResponseWriter: w, status: 200}
	h.mux.ServeHTTP(rec, r)
	log.Printf("%s %s %d %s", r.Method, r.URL.Path, rec.status, time.Since(start).Round(time.Millisecond))
}

// requireToken validates the token from the URL path.
func (h *HTTPServer) requireToken(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		t := r.PathValue("token")
		if !token.IsValid(t) {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		if !token.Exists(h.dataDir, t) {
			http.Error(w, "token not found", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

// getParam reads a parameter from JSON body (POST) or query string (GET).
func getParam(r *http.Request, parsed map[string]any, key string) string {
	if v, ok := parsed[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return r.URL.Query().Get(key)
}

// parseBody parses JSON body for POST requests, returns empty map for GET.
func parseBody(r *http.Request) map[string]any {
	parsed := map[string]any{}
	if r.Method == http.MethodPost && r.Body != nil {
		ct := r.Header.Get("Content-Type")
		if strings.Contains(ct, "application/json") {
			json.NewDecoder(r.Body).Decode(&parsed)
		}
	}
	return parsed
}

// prefixPath prepends the token to the user's path for isolation.
func prefixPath(r *http.Request, userPath string) string {
	t := r.PathValue("token")
	if userPath == "" || userPath == "." {
		return t
	}
	return filepath.Join(t, userPath)
}

// getPathParam extracts path from URL wildcard {path...}, then JSON body, then query param.
func getPathParam(r *http.Request, body map[string]any) string {
	if p := r.PathValue("path"); p != "" {
		return p
	}
	return getParam(r, body, "path")
}

// --- Handlers ---

func (h *HTTPServer) createToken(w http.ResponseWriter, r *http.Request) {
	t, err := token.Create(h.dataDir)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Derive base URL from request for tutorial files
	scheme := "https"
	if r.TLS == nil && r.Header.Get("X-Forwarded-Proto") == "" {
		scheme = "http"
	} else if proto := r.Header.Get("X-Forwarded-Proto"); proto != "" {
		scheme = proto
	}
	baseURL := scheme + "://" + r.Host
	initTokenFiles(h.store, t, baseURL)
	writeJSON(w, map[string]string{"token": t})
}

// initTokenFiles writes tutorial and index files into a newly-created token space.
func initTokenFiles(s *store.Store, tok, baseURL string) {
	type file struct {
		path    string
		content string
	}

	endpoint := baseURL + "/" + tok

	files := []file{
		{
			path: tok + "/index.md",
			content: `# 我的笔记空间 · 索引

> AI 在每次对话开始时读取此文件。若"关于我"为空，请主动询问用户姓名和职业并记录；对话结束前更新"最近动态"。

## 👤 关于我
（待 AI 记录 — 姓名、职业、技能、背景等）

## 📌 重要信息
（待 AI 记录 — 进行中的项目、重要决定、关键约定）

## 🗂 目录结构
（待 AI 记录 — 你的笔记组织方式）

## 📅 最近动态
（待 AI 记录 — 格式：### YYYY-MM-DD，3-5 条要点，每条一句话）

## 📚 参考教程（仅供用户参考，AI 勿主动读取）
- 教程/快速入门.md — 接入各类 AI 工具
- 教程/接入/通用提示词.md — 适用于任意 AI 的提示词
- 教程/使用技巧/记录规范.md — 何时记录、记什么、怎么写
`,
		},
		{
			path: tok + "/教程/快速入门.md",
			content: `# NoteForAI 快速入门

## 是什么？
NoteForAI 是专为 AI 设计的持久记忆系统。配置后，AI 可以跨对话记住关于你的一切。

## 三步开始

**第一步：选择接入方式**
- Claude Desktop / Code → 教程/接入/Claude.md（MCP，最简单）
- ChatGPT / 通义 / 其他 → 教程/接入/通用提示词.md
- Cursor → 教程/接入/Cursor.md

**第二步：填入你的 Token**
你的 Token 在管理面板右上角"配置"中查看，格式为 nfa_xxx...

**第三步：开始对话**
配置后，AI 每次启动时自动读取 index.md 摘要，像老朋友一样了解你。

## 关键概念
- **index.md** — 你的记忆总索引，AI 启动时读取，随时保持更新
- **目录结构** — 按主题分文件夹，如 个人/、工作/、项目/
- **版本保护** — 每次写入自动 Git 快照，误删可恢复

## 你的接入信息
- 接口地址：` + endpoint + `/
- 管理面板：` + baseURL + `/dashboard.html?token=` + tok + `
- MCP 地址：` + endpoint + `/mcp
`,
		},
		{
			path: tok + "/教程/接入/Claude.md",
			content: `# 接入 Claude

## 方式一：MCP（推荐）
AI 直接调用笔记工具，无需在提示词中描述接口，效果最好。

### Claude Desktop
打开配置文件：
- macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
- Windows: %APPDATA%\Claude\claude_desktop_config.json

添加：
` + "```json" + `
{
  "mcpServers": {
    "noteforai": {
      "type": "streamable-http",
      "url": "` + endpoint + `/mcp"
    }
  }
}
` + "```" + `
保存后重启 Claude Desktop，左下角出现 🔌 图标即为成功。

### Claude Code
` + "```bash" + `
claude mcp add noteforai --transport streamable-http ` + endpoint + `/mcp
` + "```" + `

---

## 方式二：系统提示词
适用于 Claude.ai 网页版，在 Project 的 Instructions 中粘贴：

` + "```" + `
你拥有持久记忆系统 NoteForAI。接口：` + endpoint + `/
调用：POST + JSON body

操作：write / append / read / search / delete / history

行为准则：
1. 对话开始时，read("index.md") 获取记忆摘要
2. 主动记录用户偏好、项目进展、重要决定
3. 对话结束前 append 更新 index.md 的"最近动态"
4. 文件用 .md 后缀，首行 # 标题，中文目录结构
` + "```",
		},
		{
			path: tok + "/教程/接入/ChatGPT.md",
			content: `# 接入 ChatGPT

## 方式一：自定义指令（Custom Instructions）
Settings → 自定义指令 → "ChatGPT 应该了解你什么？" 填入：

` + "```" + `
我使用 NoteForAI 记忆系统记录个人信息和项目进展。
接口：` + endpoint + `/（POST + JSON body）

请在每次对话时：
1. 先 read("index.md") 了解我的背景
2. 将有价值的信息 write 或 append 到对应笔记
3. 对话结束前更新 index.md 的最近动态
` + "```" + `

## 方式二：每次对话开头
如果不想配置系统提示，每次对话开头发送：
"请先读取我的记忆摘要：GET ` + endpoint + `/read?path=index.md"

## 注意
ChatGPT 网页版对工具调用有限制，建议使用自定义 GPT 并开启 Actions 以获得最佳体验。
`,
		},
		{
			path: tok + "/教程/接入/Cursor.md",
			content: `# 接入 Cursor

## 方式一：Rules（推荐）
Settings → Rules → 添加：

` + "```" + `
你拥有持久记忆系统 NoteForAI。接口：` + endpoint + `/
调用：curl 命令，POST + JSON body，Content-Type: application/json

行为准则：
1. 项目开始时 read("index.md") 获取用户和项目信息
2. 记录用户编码偏好、项目架构决策、重要约定
3. 路径建议：个人/偏好.md、项目/[项目名]/进展.md
4. 完成重要任务后，append 更新 index.md 的"最近动态"
` + "```" + `

## 方式二：.cursorrules 文件
在项目根目录创建 .cursorrules 文件：

` + "```" + `
# NoteForAI 记忆系统
接口: ` + endpoint + `/

对话开始时 read("index.md")。
重点记录：用户编码习惯、架构决策、项目约定、常用命令。
` + "```" + `

## 方式三：MCP
Settings → MCP Servers → 添加（JSON 格式）：
` + "```json" + `
{
  "noteforai": {
    "type": "streamable-http",
    "url": "` + endpoint + `/mcp"
  }
}
` + "```",
		},
		{
			path: tok + "/教程/接入/通用提示词.md",
			content: `# 通用 AI 提示词

适用于任何支持系统提示词（System Prompt）的 AI 工具。

## 标准版（推荐直接使用）

将以下内容复制到 AI 的系统提示 / 自定义指令中：

---

你拥有一个持久记忆系统 NoteForAI，用它记住关于用户的一切。

接口：` + endpoint + `/
调用：POST + JSON body，Content-Type: application/json

| 操作 | 用途 | Body |
|------|------|------|
| write | 新建或覆盖笔记 | {"path":"目录/文件.md","content":"# 标题\n内容"} |
| append | 追加内容到末尾 | {"path":"日志/2025.md","content":"\n### YYYY-MM-DD\n- 事项"} |
| read | 读取笔记 | {"path":"index.md"} |
| search | 全文搜索 | {"query":"关键词"} |
| delete | 删除笔记 | {"path":"文件.md"} |
| history | 版本历史 | {"path":"文件.md","limit":20} |

行为准则：
1. 对话开始时，先 read("index.md") 获取记忆摘要（不用 tree）
2. 发现有价值信息立即保存：新建/更新用 write，追加新内容用 append
3. 对话结束前，append 更新 index.md 的"最近动态"部分
4. 所有文件用 .md 后缀，首行 # 标题，按主题组织中文目录

触发记录的场景：用户提到偏好/习惯、新项目启动、重要决定、个人信息、待办事项

---

## 极简版（Token 限制严格时使用）

你有 NoteForAI 持久记忆（` + endpoint + `/）。
对话开始：read("index.md")；发现有价值信息：POST write/append；结束：更新 index.md。
`,
		},
		{
			path: tok + "/教程/接入/curl示例.md",
			content: `# API 调用示例

所有接口支持 GET（参数放 URL）和 POST（JSON body）两种方式。

## 读取摘要索引
` + "```bash" + `
curl '` + endpoint + `/read?path=index.md'
` + "```" + `

## 写入笔记
` + "```bash" + `
curl -X POST '` + endpoint + `/write' \
  -H 'Content-Type: application/json' \
  -d '{"path":"个人/基本信息.md","content":"# 基本信息\n\n姓名：张三\n职业：产品经理"}'
` + "```" + `

## 追加内容
` + "```bash" + `
curl -X POST '` + endpoint + `/append' \
  -H 'Content-Type: application/json' \
  -d '{"path":"日志/工作.md","content":"\n\n## 2025-01-15\n- 完成需求评审"}'
` + "```" + `

## 全文搜索
` + "```bash" + `
curl '` + endpoint + `/search?q=关键词'
` + "```" + `

## 查看目录树
` + "```bash" + `
curl '` + endpoint + `/tree'
` + "```" + `

## 版本历史与恢复
` + "```bash" + `
# 查看历史
curl '` + endpoint + `/history?path=个人/基本信息.md'

# 查看某次变更内容
curl '` + endpoint + `/diff?path=个人/基本信息.md&commit=abc1234'

# 恢复到历史版本
curl -X POST '` + endpoint + `/revert' \
  -H 'Content-Type: application/json' \
  -d '{"path":"个人/基本信息.md","commit":"abc1234"}'
` + "```" + `

## 查看并恢复已删除文件
` + "```bash" + `
curl '` + endpoint + `/deleted'
` + "```",
		},
		{
			path: tok + "/教程/使用技巧/目录结构.md",
			content: `# 推荐目录结构

合理的目录结构让 AI 更快找到相关信息。

## 推荐结构

` + "```" + `
index.md              ← 总索引，AI 启动必读
个人/
  基本信息.md         ← 姓名、职业、联系方式
  偏好.md             ← 风格偏好、工作习惯、喜好
  背景.md             ← 教育经历、技能、经验
工作/
  进行中/
    项目A.md          ← 项目概述、进展、关键决定
    项目B.md
  归档/               ← 已完成项目
  日志.md             ← 工作日志（append 追加）
知识库/
  技术.md             ← 常用技术栈、工具
  资源.md             ← 常用链接、参考资料
待办/
  本周.md             ← 本周待办事项
` + "```" + `

## 四个原则

1. **按主题分，不按时间**：时间用 append 记在同一文件里
2. **路径自描述**：一看路径就知道内容
3. **index.md 常更新**：摘要始终反映最新状态
4. **宁深勿杂**：3级目录比把所有文件堆在根目录好

## 反面示例
❌ 2025-01-15-meeting.md（散文件，难以积累）
❌ misc.md（啥都往里放）
✅ 工作/进行中/NoteForAI重构.md（主题明确，可持续追加）
`,
		},
		{
			path: tok + "/教程/使用技巧/记录规范.md",
			content: `# 记录规范 · 何时记、记什么、怎么写

## 何时记录

### 立即记录（不需要用户明确要求）
- ✅ 用户提到偏好（"我喜欢简洁风格"、"习惯早上工作"）
- ✅ 新项目或任务开始
- ✅ 重要决定或结论（"决定用 React"、"选择了方案B"）
- ✅ 用户基本信息（职业、技能、背景）
- ✅ 明确的待办事项或计划
- ✅ 常用工具、流程、团队约定

### 谨慎记录（可先询问）
- ❓ 敏感信息（健康、财务）
- ❓ 暂时性想法（"也许可以试试..."）

### 不需要记录
- ❌ 普通闲聊
- ❌ 已有记录的重复信息
- ❌ 纯技术问答（无个人化内容）

## 文件格式规范

` + "```markdown" + `
# 文件标题

> 一句话描述本文件的内容范围

## 核心信息
最重要的内容放最前面

## 详细记录

### 2025-01-15
- 具体事项，简洁一句话
- 另一个事项

### 2025-01-16
- 新增内容用 append 追加在此
` + "```" + `

## write vs append

| 场景 | 用哪个 |
|------|--------|
| 第一次创建文件 | write |
| 信息有更新需要覆盖 | write |
| 追加新日志、新事件 | append |
| 补充额外信息 | append |

## 更新 index.md

每次对话结束前，append 更新最近动态：

` + "```markdown" + `

### 2025-01-15
- 讨论了 NoteForAI 接入方案，决定优先用 MCP
- 用户偏好简洁设计风格，已记录到 个人/偏好.md
` + "```" + `

## 好例子 vs 坏例子

✅ write("个人/偏好.md", "# 个人偏好\n\n## 工作风格\n- 喜欢简洁、模块化代码\n- 偏好先设计后编码\n\n## 2025-01-15\n- 补充：代码注释习惯用中文")

❌ write("笔记.md", "用户说喜欢简洁") — 路径不清，格式随意，难以积累
`,
		},
		{
			path: tok + "/教程/使用技巧/版本管理.md",
			content: `# 版本管理 · 回溯与恢复

NoteForAI 每次 write 和 append 自动创建 Git 版本快照，永远不用担心误删。

## 查看文件历史版本

` + "```bash" + `
curl '` + endpoint + `/history?path=个人/基本信息.md'
` + "```" + `

返回示例：
` + "```" + `
abc12345 2025-01-15T10:30:00+08:00 write 个人/基本信息.md
def67890 2025-01-14T09:00:00+08:00 append 个人/基本信息.md
` + "```" + `

## 查看某次变更详情

` + "```bash" + `
curl '` + endpoint + `/diff?path=个人/基本信息.md&commit=abc12345'
` + "```" + `

## 恢复到历史版本

` + "```bash" + `
curl -X POST '` + endpoint + `/revert' \
  -H 'Content-Type: application/json' \
  -d '{"path":"个人/基本信息.md","commit":"abc12345"}'
` + "```" + `

> 恢复是非破坏性的：写入一个新版本，不会丢失中间的修改历史。

## 恢复已删除的文件

` + "```bash" + `
# 第一步：查看可恢复的文件
curl '` + endpoint + `/deleted'

# 第二步：用 restore_hash 恢复
curl -X POST '` + endpoint + `/revert' \
  -H 'Content-Type: application/json' \
  -d '{"path":"已删除的文件.md","commit":"restore_hash_值"}'
` + "```" + `

## 在管理面板操作

打开管理面板 → 点击文件 → 点击"历史"按钮，图形化查看和恢复版本，无需命令行。
`,
		},
	}

	for _, f := range files {
		if _, err := s.Write(f.path, []byte(f.content)); err != nil {
			log.Printf("initTokenFiles: failed to write %s: %v", f.path, err)
		}
	}
	log.Printf("initTokenFiles: initialized %d files for token %s", len(files), tok[:12]+"...")
}

func (h *HTTPServer) write(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	var content []byte
	if c, ok := body["content"]; ok {
		content = []byte(fmt.Sprint(c))
	} else if q := r.URL.Query().Get("content"); q != "" {
		content = []byte(q)
	} else {
		// Try raw body for non-JSON POST
		if r.Method == http.MethodPost {
			var readErr error
			content, readErr = io.ReadAll(r.Body)
			if readErr != nil {
				http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
				return
			}
		}
	}

	created, err := h.store.Write(prefixPath(r, path), content)
	if err != nil {
		if errors.Is(err, store.ErrQuotaExceeded) {
			http.Error(w, err.Error(), http.StatusInsufficientStorage)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if created {
		w.WriteHeader(http.StatusCreated)
	} else {
		w.WriteHeader(http.StatusOK)
	}
}

func (h *HTTPServer) read(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getPathParam(r, body)
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	full := prefixPath(r, path)
	data, err := h.store.Read(full)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if isText(data) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	} else {
		w.Header().Set("Content-Type", "application/octet-stream")
	}
	w.Write(data)
}

func (h *HTTPServer) delete(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	if err := h.store.Delete(prefixPath(r, path)); err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *HTTPServer) append(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	var content []byte
	if c, ok := body["content"]; ok {
		content = []byte(fmt.Sprint(c))
	} else if q := r.URL.Query().Get("content"); q != "" {
		content = []byte(q)
	} else if r.Method == http.MethodPost {
		var readErr error
		content, readErr = io.ReadAll(r.Body)
		if readErr != nil {
			http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
			return
		}
	}

	if err := h.store.Append(prefixPath(r, path), content); err != nil {
		if errors.Is(err, store.ErrQuotaExceeded) {
			http.Error(w, err.Error(), http.StatusInsufficientStorage)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *HTTPServer) list(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getPathParam(r, body)
	full := prefixPath(r, path)

	entries, err := h.store.List(full)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, entries)
}

func (h *HTTPServer) tree(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getPathParam(r, body)
	full := prefixPath(r, path)

	node, err := h.store.Tree(full)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, node)
}

func (h *HTTPServer) search(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	query := getParam(r, body, "query")
	if query == "" {
		query = getParam(r, body, "q")
	}
	if query == "" {
		http.Error(w, "query required", http.StatusBadRequest)
		return
	}

	t := r.PathValue("token")
	scopePath := getParam(r, body, "path")

	// Force scope to user's prefix
	var searchPrefix string
	if scopePath != "" {
		searchPrefix = filepath.Join(t, scopePath)
	} else {
		searchPrefix = t + "/"
	}

	results, err := h.store.Search(query, searchPrefix)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Strip token prefix from result paths
	stripped := make([]store.SearchResult, len(results))
	for i, r := range results {
		stripped[i] = store.SearchResult{
			Path:    strings.TrimPrefix(r.Path, t+"/"),
			Snippet: r.Snippet,
		}
	}
	writeJSON(w, stripped)
}

func (h *HTTPServer) history(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getPathParam(r, body)
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}
	limit := 20
	if s := getParam(r, body, "limit"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			limit = n
		}
	}
	entries, err := h.store.History(prefixPath(r, path), limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []store.HistoryEntry{}
	}
	writeJSON(w, entries)
}

func (h *HTTPServer) diff(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	commit := getParam(r, body, "commit")
	if path == "" || commit == "" {
		http.Error(w, "path and commit required", http.StatusBadRequest)
		return
	}
	d, err := h.store.Diff(prefixPath(r, path), commit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write([]byte(d))
}

func (h *HTTPServer) revert(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	commit := getParam(r, body, "commit")
	if path == "" || commit == "" {
		http.Error(w, "path and commit required", http.StatusBadRequest)
		return
	}
	if err := h.store.Revert(prefixPath(r, path), commit); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *HTTPServer) deleted(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	limit := 50
	if s := getParam(r, body, "limit"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			limit = n
		}
	}
	t := r.PathValue("token")
	entries, err := h.store.Deleted(t, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []store.DeletedEntry{}
	}
	writeJSON(w, entries)
}

func (h *HTTPServer) destroy(w http.ResponseWriter, r *http.Request) {
	t := r.PathValue("token")
	if err := token.Destroy(h.dataDir, t); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.store.DestroyToken(t)
	h.mcpMu.Lock()
	delete(h.mcpServers, t)
	h.mcpMu.Unlock()
	w.WriteHeader(http.StatusOK)
}

func (h *HTTPServer) getOrCreateMCP(tok string) *server.StreamableHTTPServer {
	h.mcpMu.Lock()
	defer h.mcpMu.Unlock()
	if s, ok := h.mcpServers[tok]; ok {
		return s
	}
	mcpSrv := NewMCPServer(h.store, tok)
	s := server.NewStreamableHTTPServer(mcpSrv, server.WithStateLess(true))
	h.mcpServers[tok] = s
	return s
}

func (h *HTTPServer) serveMCP(w http.ResponseWriter, r *http.Request) {
	tok := r.PathValue("token")
	h.getOrCreateMCP(tok).ServeHTTP(w, r)
}

func isText(data []byte) bool {
	check := data
	if len(check) > 512 {
		check = check[:512]
	}
	for _, b := range check {
		if b == 0 {
			return false
		}
	}
	return true
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	enc.Encode(v)
}

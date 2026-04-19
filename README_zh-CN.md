# NoteForAI

[English](README.md) · [简体中文](README_zh-CN.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Español](README_es.md) · [Français](README_fr.md) · [Deutsch](README_de.md) · [Português](README_pt-BR.md) · [Русский](README_ru.md)

**给你的 AI 一个永不遗忘的笔记本。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![MCP](https://img.shields.io/badge/MCP-已支持-brightgreen)](https://modelcontextprotocol.io)
[![可自部署](https://img.shields.io/badge/可自部署-✓-orange)]()

> **立即免费试用** → [noteforai.com](https://noteforai.com) · 无需注册，一键获取 Token。

---

![NoteForAI 主页](docs/images/hero.png)

---

## 问题所在

每次 AI 对话都从头开始。AI 忘记你的偏好，丢失项目上下文，让你一遍又一遍地重复自己——每次都是。

```
你：我是一名后端工程师，喜欢 Go 语言，正在做 NoteForAI 项目……
AI：好的！我能帮你什么？

【下一次对话】

你：帮我优化一下 API 设计
AI：当然！能先介绍一下你的项目背景吗？  ← 😤
```

## 解决方案

NoteForAI 给任何 AI 一个持久的、结构化的笔记空间。跨对话、跨工具、跨设备都能使用。

![管理面板](docs/images/dashboard.png)

---

## 快速开始 — 30 秒上手

无需注册，无需安装，直接运行：

```bash
# 1. 获取你的 Token
TOKEN=$(curl -s -X POST https://noteforai.com/create_token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "你的 Token：$TOKEN"

# 2. 保存一些关于你的信息
curl -X POST "https://noteforai.com/$TOKEN/write" \
  -H 'Content-Type: application/json' \
  -d '{"path":"个人/基本信息.md","content":"# 关于我\n\n职业：后端工程师\n偏好：Go 语言，简洁代码\n当前项目：NoteForAI"}'

# 3. 你的 AI 现在记住你了 — 每次对话都如此 ✓
```

然后将以下内容粘贴到 AI 的系统提示中（替换 `YOUR_TOKEN`）：

```
你拥有一个持久记忆系统 NoteForAI，用它记住关于用户的一切。
接口：https://noteforai.com/YOUR_TOKEN/
调用：POST + JSON body

行为准则：
1. 每次对话开始，先 read("个人/基本信息.md") 获取用户信息
2. 对话中主动记录有价值的信息（偏好、项目进展、重要决定）
3. 所有文件用 .md 后缀，首行 # 标题，按主题组织目录
```

或者使用 **MCP** 获得更好的原生体验（见下文）。

---

## 核心功能

| 功能 | 说明 |
|------|------|
| 📝 **文件系统 API** | write、read、append、delete、list、tree、search |
| 🔍 **全文搜索** | Bleve 引擎，支持中文（CJK 分词）及多语言 |
| 🔀 **Git 版本管理** | 每次写入自动快照，支持 history、diff、revert |
| 🌐 **双协议支持** | HTTP API + MCP（Streamable HTTP 或 stdio）|
| 🔒 **多租户隔离** | Token 完全隔离，无需注册账号 |
| 📦 **随时导出** | ZIP / JSON 格式，无平台绑定 |
| 🏠 **可自部署** | 单个 Go 二进制，无需数据库 |
| 🌍 **18 种语言** | Web UI 内置国际化支持 |

---

## MCP 接入（推荐）

最简洁的方式，让 Claude 或任何兼容 MCP 的 AI 获得持久记忆。

![接入方式](docs/images/integration.png)

### Claude Desktop / Claude Code

**托管服务** — Streamable HTTP，无需安装：

```json
{
  "mcpServers": {
    "noteforai": {
      "type": "http",
      "url": "https://noteforai.com/YOUR_TOKEN/mcp"
    }
  }
}
```

**Claude Code 命令行：**
```bash
claude mcp add noteforai --transport http https://noteforai.com/YOUR_TOKEN/mcp
```

**自部署版** — stdio 协议：
```json
{
  "mcpServers": {
    "noteforai": {
      "command": "/path/to/noteforai",
      "args": ["mcp", "YOUR_TOKEN"]
    }
  }
}
```

MCP 工具共 11 个：`write`、`read`、`append`、`delete`、`list`、`tree`、`search`、`history`、`diff`、`revert`、`deleted`。

---

## Git 版本历史

每次 write 和 append 都自动创建 Git 快照，可随时在管理面板浏览、对比、恢复。

![版本历史](docs/images/history.png)

```bash
# 查看历史
curl "https://noteforai.com/$TOKEN/history?path=个人/基本信息.md"

# 查看某次变更
curl "https://noteforai.com/$TOKEN/diff?path=个人/基本信息.md&commit=abc12345"

# 恢复到历史版本
curl -X POST "https://noteforai.com/$TOKEN/revert" \
  -d '{"path":"个人/基本信息.md","commit":"abc12345"}'
```

---

## 使用场景

**🖥 Claude Code / Cursor / Windsurf**
AI 记住你的编码风格、项目架构决策和常用模式，每次会话都无缝延续。

**🤖 自主 AI Agent**
Agent 在长期运行中持续积累知识，而不是每次冷启动。

**👤 个人 AI 助理**
存储偏好、目标、联系人、项目上下文——AI 像老朋友一样了解你。

---

## 自部署

完全掌控你的数据，单个二进制文件，无需数据库。

```bash
# 编译并运行
go build -o noteforai .
./noteforai serve

# 或使用 Docker
docker compose up --build
```

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `PORT` | `8080` | 监听端口 |
| `DATA_DIR` | `./data` | 数据存储目录 |
| `QUOTA_MB` | `0` | 每个 Token 的磁盘配额（MB，0 为不限制）|
| `TRASH_DAYS` | `30` | 软删除保留天数 |

支持部署到任意 VPS、Fly.io、Railway 或 Render。

---

## Web 管理面板

![Token 创建](docs/images/token-modal.png)

内置文件管理器 UI，访问 `/dashboard.html`：
- 浏览、创建、编辑、预览（Markdown 渲染）笔记
- 实时全文搜索
- 版本历史，一键恢复
- 导出全部笔记为 ZIP 或 JSON
- 回收站，可恢复已删除文件

---

## API 参考

所有接口支持 `GET`（查询参数）和 `POST`（JSON body）两种方式。

| 接口 | 参数 | 说明 |
|------|------|------|
| `POST /create_token` | — | 创建新 Token |
| `/{token}/write` | `path`、`content` | 新建或覆盖文件 |
| `/{token}/read` | `path` | 读取文件 |
| `/{token}/append` | `path`、`content` | 追加内容到文件 |
| `/{token}/delete` | `path` | 删除文件或目录（软删除）|
| `/{token}/list` | `path` | 列出目录内容 |
| `/{token}/tree` | `path` | 递归目录树 |
| `/{token}/search` | `query`、`path` | 全文搜索 |
| `/{token}/history` | `path`、`limit` | Git 版本历史 |
| `/{token}/diff` | `path`、`commit` | 查看指定提交的变更 |
| `/{token}/revert` | `path`、`commit` | 恢复文件到指定版本 |
| `/{token}/deleted` | `limit` | 列出可恢复的已删除文件 |
| `/{token}/destroy` | — | 销毁 Token 及全部数据 |
| `/{token}/mcp` | — | MCP Streamable HTTP 端点 |

HTTP 状态码：`201` 已创建 · `200` 成功 · `404` 不存在 · `401` Token 无效 · `413` 超出配额

---

## 项目架构

```
main.go           入口 — CLI（serve / mcp <token>）
api/http.go       HTTP API + 请求日志 + 10MB 请求体限制
api/mcp.go        MCP 服务器（Streamable HTTP + stdio）
store/store.go    核心层：文件操作 + Indexer 接口 + 并发锁 + 磁盘配额
store/git.go      Git 版本控制（go-git）
index/bleve.go    全文搜索 — Bleve + CJK 二元分词
token/token.go    Token 生成（nfa_ 前缀 + 32 位随机字符）
api/ui/           嵌入式 Web UI — 18 种语言，无需构建
```

---

## 参与贡献

欢迎提交 PR，请在提交前运行测试：

```bash
go test ./... -v -race
go vet ./...
```

---

## 开源协议

[MIT](LICENSE) — 随意使用、Fork、自部署。

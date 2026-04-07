# NoteForAI

AI 专用笔记系统 — 提供类文件系统的 HTTP/MCP 接口，让 AI 高效存取结构化信息。

## 特性

- **类文件系统接口** — write / read / append / delete / list / tree / search
- **全文搜索** — Bleve 引擎 + CJK 二元分词，支持中英文混合检索
- **多用户隔离** — Token 即用户，路径前缀隔离，互不可见
- **双协议** — HTTP API（多用户）+ MCP stdio（单用户，AI 直连）
- **安全防护** — 请求体 10MB 限制、路径穿越防护、并发写入锁、磁盘配额
- **零依赖存储** — 文件系统存数据，无需数据库

## 快速开始

```bash
# 构建
go build -o noteforai .

# 启动 HTTP 服务
./noteforai serve

# 创建 Token
curl -X POST http://localhost:8080/create_token
# → {"token":"nfa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}

# 写入
curl -X POST http://localhost:8080/nfa_xxx.../write \
  -H 'Content-Type: application/json' \
  -d '{"path":"笔记/hello","content":"Hello World"}'

# 读取
curl -X POST http://localhost:8080/nfa_xxx.../read \
  -H 'Content-Type: application/json' \
  -d '{"path":"笔记/hello"}'

# 搜索
curl -X POST http://localhost:8080/nfa_xxx.../search \
  -H 'Content-Type: application/json' \
  -d '{"query":"Hello"}'
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `8080` | 监听端口 |
| `DATA_DIR` | `./data` | 数据存储目录 |
| `QUOTA_MB` | `0`（不限） | 每个 Token 的磁盘配额（MB） |

## API

所有数据接口支持 GET（query param）和 POST（JSON body）两种调用方式。

| 接口 | 参数 | 说明 | 状态码 |
|------|------|------|--------|
| `/create_token` | — | 创建 Token（免认证） | 200 |
| `/{token}/write` | `path`, `content` | 写入文件（不存在则创建） | 201/200 |
| `/{token}/read` | `path` | 读取文件 | 200/404 |
| `/{token}/append` | `path`, `content` | 追加内容 | 200 |
| `/{token}/delete` | `path` | 删除文件或目录 | 204/404 |
| `/{token}/list` | `path` | 列出目录内容 | 200 |
| `/{token}/tree` | `path` | 递归目录树 | 200 |
| `/{token}/search` | `query`/`q`, `path` | 全文搜索（可限定目录） | 200 |

错误状态码：`400` 缺少参数、`401` Token 无效、`413` 请求体过大、`507` 超出配额。

## MCP 模式

以 stdio 方式运行，适合 AI 直连（如 Claude Code）：

```bash
./noteforai mcp <token>
```

提供与 HTTP API 相同的 7 个 tool，路径自动注入 token 前缀。

## 部署

### 直接运行

```bash
PORT=443 DATA_DIR=/opt/noteforai/data QUOTA_MB=500 ./noteforai serve
```

### Docker

```bash
docker compose up --build
```

### systemd

```ini
[Unit]
Description=NoteForAI
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/noteforai
ExecStart=/opt/noteforai/noteforai serve
Environment=PORT=443
Environment=DATA_DIR=/opt/noteforai/data
Environment=QUOTA_MB=500
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

低端口需授权：`setcap 'cap_net_bind_service=+ep' ./noteforai`

## 架构

```
main.go              入口，CLI (serve / mcp <token>)
store/store.go       核心层：7 个操作，文件系统 + Indexer 接口 + 并发锁 + 配额
index/bleve.go       Bleve 全文索引，CJK 二元分词
api/http.go          HTTP API，请求日志 + 请求体限制 + Token 校验
api/mcp.go           MCP Server (stdio)，单用户模式
token/token.go       Token 生成与校验 (nfa_ + 32 位随机字符)
api/ui/index.html    Web UI
```

**数据目录结构：**

```
data/
├── files/{token}/    各用户的文件存储
└── index/            Bleve 全文索引（共享）
```

## 测试

```bash
go test ./... -v        # 运行全部测试
go test ./... -race     # 带竞争检测
go vet ./...            # 静态检查
```

# NoteForAI

**A persistent note system designed for AI.** File-system-like HTTP/MCP interface for AI to efficiently store and retrieve structured information.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-00ADD8?logo=go&logoColor=white)](https://go.dev)

**Try it now:** [noteforai.com](https://noteforai.com) — get a free token and start using it with your AI in seconds.

## Features

- **7 file-system operations** — write / read / append / delete / list / tree / search
- **Full-text search** — Bleve engine + CJK bigram tokenizer
- **Multi-tenant isolation** — one token per user, fully isolated
- **Dual protocol** — HTTP API + MCP stdio (direct AI connection)
- **Git-based versioning** — history, diff, revert for every file
- **Security** — 10MB body limit, path traversal protection, per-path locks, disk quota
- **Zero-dependency storage** — file system only, no database

## Hosted Service

Use NoteForAI without deploying anything:

```bash
# Get your token
curl -X POST https://noteforai.com/create_token
# → {"token":"nfa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}

# Write
curl -X POST https://noteforai.com/nfa_xxx.../write \
  -H 'Content-Type: application/json' \
  -d '{"path":"hello.md","content":"# Hello World"}'

# Read
curl -X POST https://noteforai.com/nfa_xxx.../read \
  -H 'Content-Type: application/json' \
  -d '{"path":"hello.md"}'
```

## Self-Hosted

```bash
go build -o noteforai .
./noteforai serve
```

Or with Docker:

```bash
docker compose up --build
```

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Listen port |
| `DATA_DIR` | `./data` | Data directory |
| `QUOTA_MB` | `0` (unlimited) | Per-token disk quota (MB) |
| `TRASH_DAYS` | `30` | Soft-delete retention days |

## API

All endpoints accept both GET (query params) and POST (JSON body).

| Endpoint | Params | Description |
|----------|--------|-------------|
| `/create_token` | — | Create a new token |
| `/{token}/write` | `path`, `content` | Write file |
| `/{token}/read` | `path` | Read file |
| `/{token}/append` | `path`, `content` | Append to file |
| `/{token}/delete` | `path` | Delete file or directory |
| `/{token}/list` | `path` | List directory |
| `/{token}/tree` | `path` | Recursive directory tree |
| `/{token}/search` | `query`, `path` | Full-text search |
| `/{token}/destroy` | — | Destroy token (soft delete) |

## MCP Mode

Connect directly from AI tools like Claude Code. Add to your MCP config (e.g. `~/.claude/claude_code_config.json`):

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

Or run standalone via stdio:

```bash
./noteforai mcp <token>
```

## Architecture

```
main.go           CLI entry (serve / mcp)
api/http.go       HTTP API + request logging + token validation
api/mcp.go        MCP Server (stdio)
store/store.go    Core: 7 operations, file system + indexer + locks + quota
store/git.go      Git-based version control
index/bleve.go    Bleve full-text index, CJK bigram tokenizer
token/token.go    Token generation (nfa_ + 32 random chars)
api/ui/           Embedded web UI (18 languages)
```

## License

[MIT](LICENSE)

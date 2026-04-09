# NoteForAI

**Give your AI a notebook that never forgets.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![Website](https://img.shields.io/badge/noteforai.com-live-brightgreen)](https://noteforai.com)

## The Problem

Every AI conversation starts from scratch. Your AI forgets your preferences, loses project context, and makes you repeat yourself — every single time.

## The Solution

NoteForAI gives AI a persistent, structured notebook. It works across conversations, across tools, across devices.

- **File-system-like API** — write, read, append, delete, list, tree, search
- **Full-text search** — Bleve engine with CJK + multilingual support
- **Multi-tenant** — one token per user, fully isolated
- **Git versioning** — history, diff, revert for every file
- **Dual protocol** — HTTP API + MCP stdio
- **Self-hostable** — single binary, no database, your data stays yours

## Try It in 30 Seconds

No signup. No install. Just run:

```bash
# 1. Get your token
curl -X POST https://noteforai.com/create_token
# → {"token":"nfa_abc123..."}

# 2. Save something
curl -X POST https://noteforai.com/nfa_abc123.../write \
  -H 'Content-Type: application/json' \
  -d '{"path":"me.md","content":"# About Me\nI prefer concise code and dark themes."}'

# 3. Read it back (from any conversation, any device)
curl -X POST https://noteforai.com/nfa_abc123.../read \
  -d '{"path":"me.md"}'
```

Now paste the API config into your AI tool (e.g. CLAUDE.md), and your AI remembers everything.

## Use Cases

**Claude Code / Cursor** — AI remembers your coding style, project decisions, and tech stack across sessions.

**AI Agents** — Agents accumulate knowledge over time instead of starting cold every run.

**Personal AI Assistant** — Store preferences, goals, contacts — your AI knows you like an old friend.

## Two Ways to Use

### Hosted (noteforai.com)

Zero setup. Create a token and start calling the API. Free to use.

### Self-Hosted

Full control over your data. Single binary, no database.

```bash
# Build and run
go build -o noteforai .
./noteforai serve

# Or use Docker
docker compose up --build
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Listen port |
| `DATA_DIR` | `./data` | Data directory |
| `QUOTA_MB` | `0` | Per-token disk quota in MB (0 = unlimited) |
| `TRASH_DAYS` | `30` | Soft-delete retention days |

## API Reference

All endpoints accept GET (query params) and POST (JSON body).

| Endpoint | Params | Description |
|----------|--------|-------------|
| `POST /create_token` | — | Get a new token |
| `/{token}/write` | `path`, `content` | Create or overwrite a file |
| `/{token}/read` | `path` | Read a file |
| `/{token}/append` | `path`, `content` | Append to a file |
| `/{token}/delete` | `path` | Delete a file or directory |
| `/{token}/list` | `path` | List directory contents |
| `/{token}/tree` | `path` | Recursive directory tree |
| `/{token}/search` | `query`, `path` | Full-text search |
| `/{token}/destroy` | — | Delete token and all data |

## MCP Mode (Self-Hosted)

When self-hosting, connect AI tools directly via MCP stdio. Add to Claude Code config:

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

Provides 11 tools: write, read, append, delete, list, tree, search, history, diff, revert, deleted.

## Architecture

```
main.go           Entry point (serve / mcp)
api/http.go       HTTP API + logging + validation
api/mcp.go        MCP stdio server
store/store.go    Core: file operations + indexer + locks + quota
store/git.go      Git-based version control
index/bleve.go    Full-text search (Bleve + CJK bigram)
token/token.go    Token generation (nfa_ + 32 random chars)
api/ui/           Embedded web UI (18 languages)
```

## License

[MIT](LICENSE)

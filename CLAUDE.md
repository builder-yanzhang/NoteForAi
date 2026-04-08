# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoteForAI — AI 专用笔记系统，提供类文件系统的 HTTP/MCP 接口让 AI 高效存取信息。Go 实现，文件系统存储 + Bleve 全文索引（CJK 分词）。多用户 Token 隔离。

## Build & Run

```bash
go build -o noteforai .          # 构建
./noteforai serve                # HTTP 模式 (默认 :8080)
./noteforai mcp <token>          # MCP stdio 模式
go test ./... -v -race           # 运行测试（带竞争检测）
go vet ./...                     # 静态检查
```

环境变量: `PORT` (默认 8080), `DATA_DIR` (默认 ./data), `QUOTA_MB` (默认 0=不限，单位 MB), `TRASH_DAYS` (默认 30，软删除保留天数)

Docker: `docker compose up --build`

## Architecture

```
main.go              入口，CLI (serve / mcp <token>)，读取环境变量配置配额
store/store.go       核心层：7 个操作，文件系统读写 + Indexer 接口 + per-path 并发锁 + 磁盘配额
index/bleve.go       Bleve 全文索引，CJK 二元分词器
api/http.go          HTTP API，请求日志中间件 + 10MB 请求体限制 + Token 校验
api/mcp.go           MCP Server (stdio)，token 前缀自动注入，纯文本返回
token/token.go       Token 生成与校验 (nfa_ + 32位 a-zA-Z0-9)
api/ui/index.html    嵌入式 Web UI
```

核心设计：Store 通过 Indexer 接口与搜索解耦。写入时文件存磁盘，文本内容同步写入 Bleve 索引。多用户隔离在 API 层完成（token 作为路径前缀），Store 层无感知。

数据目录：`data/files/{token}/` 存文件，`data/index/` 存 Bleve 索引。

## API

Token 在 URL 路径中，所有接口支持 GET（query param）和 POST（JSON body）。

```
/create_token                         创建 Token（免认证）
/{token}/write   path=, content=      写入（新建 201，覆盖 200）
/{token}/read    path=                读取（200/404）
/{token}/delete  path=                删除（204/404）
/{token}/append  path=, content=      追加（200）
/{token}/list    path=                列目录（200）
/{token}/tree    path=                目录树（200）
/{token}/search  query=|q=, path=     全文搜索（200）
/{token}/destroy                      销毁 Token（软删除，200）
```

错误码：400 缺参数、401 Token 无效、413 请求体过大/超配额、507 磁盘配额超限。

## Key Decisions

- 存储即文件系统，无数据库
- Token 严格模式：必须通过 create_token 创建，目录不存在 → 401
- 路径安全：filepath.Clean + Abs 前缀校验防目录穿越
- 搜索结果强制限定用户 token 前缀，返回时剥离前缀
- 请求体上限 10MB（http.MaxBytesReader）
- 并发写入安全：per-path sync.Mutex，Write/Append/Delete 加锁
- 磁盘配额：按 token 统计用量，首次访问 lazy 计算，写入时增减
- 索引错误不阻塞主流程，仅日志记录
- CJK 二元分词兼顾中英文搜索（变更分析器需删 data/index/ 重建）
- MCP tool 返回纯文本格式，对 LLM 更友好

## Deployment

VPS (8.130.144.194): systemd 管理，二进制在 /opt/noteforai/，PORT=443，QUOTA_MB=500。
部署流程：本地构建 → scp 二进制到 VPS → systemctl restart noteforai。
SSH: `ssh -i ~/.ssh/id_rsa root@8.130.144.194`

## Language

项目文档使用中文（简体中文）。

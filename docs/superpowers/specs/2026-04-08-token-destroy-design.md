# Token 销毁接口设计

## 背景

NoteForAI 缺少 token 销毁机制。需要提供 API 让 token 持有者可以销毁自己的 token，释放资源。

## 方案：软删除 + 每日定时清理

### 接口

```
POST /{token}/destroy → 200 OK
```

Token 自毁，无需额外认证（知道 token 即有权销毁）。仅 HTTP API，MCP 不暴露此操作。

### 软删除流程

1. 重命名 `data/files/{token}/` → `data/files/{token}.deleted.{unix_timestamp}`
2. 清除 Bleve 索引中 `{token}/` 前缀的所有文档（`index.RemoveByPrefix`）
3. 清理 Store 内存缓存：usage、locks、repos map 中该 token 的条目
4. 后续该 token 所有接口返回 401（`token.Exists()` 检查原目录不存在）

### 定时清理

- 触发时机：服务启动时执行一次 + 每天执行一次（goroutine + `time.Ticker` 24h）
- 逻辑：扫描 `data/files/` 下匹配 `*.deleted.*` 的目录，解析后缀中的 unix 时间戳，超过保留期的执行 `os.RemoveAll`
- 保留期：环境变量 `TRASH_DAYS`，默认 30，设为 0 则软删除时立即物理删除

### 已删除 token 的行为

- 所有数据接口（read/write/list/tree/search/history/diff/revert）返回 401
- `create_token` 不会复用已删除的 token（随机生成 + 目录名含 `.deleted.` 后缀不匹配格式校验）

### 恢复

不提供 API。手动操作：将 `data/files/{token}.deleted.{timestamp}` 重命名回 `data/files/{token}`，重启服务后索引需通过重新写入文件重建。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `token/token.go` | 新增 `Destroy(dataDir, token)` 函数（重命名目录） |
| `store/store.go` | 新增 `DestroyToken(token)` 方法（清索引 + 清缓存），新增 `StartTrashCleaner()` 定时清理 |
| `api/http.go` | 新增 `/{token}/destroy` 路由和 handler |
| `main.go` | 读取 `TRASH_DAYS` 环境变量，启动时调用 `StartTrashCleaner()` |

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `TRASH_DAYS` | `30` | 软删除保留天数，0 = 立即物理删除 |

### 测试

- `token/token_test.go`: TestDestroy（重命名成功、目录不存在）
- `store/store_test.go`: TestDestroyToken（索引清除、缓存清理）
- `api/http_test.go`: TestDestroyEndpoint（软删除后 401、数据不可访问）

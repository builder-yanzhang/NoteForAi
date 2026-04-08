package api

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"noteforai/store"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// NewMCPServer creates an MCP server scoped to a specific token.
// All operations are automatically prefixed with the token path.
func NewMCPServer(s *store.Store, tok string) *server.MCPServer {
	srv := server.NewMCPServer("NoteForAI", "1.0.0",
		server.WithToolCapabilities(true),
		server.WithInstructions(`NoteForAI — AI 专属持久记忆系统，跨对话保存和检索信息。

## 启动流程
每次对话开始，执行：read("index.md")
这是记忆总索引，包含用户基本信息、当前项目、最近动态。
直接读取索引即可，不需要先调用 tree()。

## 何时记录（无需用户明确要求）
- 用户提到偏好、习惯、风格（"我喜欢简洁代码"）
- 新项目或任务开始
- 重要决定或结论
- 用户基本信息（职业、技能、背景）
- 待办事项或明确计划

## 记录格式
- 文件用 .md 后缀，首行 # 标题
- 按主题组织中文目录：个人/、工作/、项目/
- 追加内容标注日期（### YYYY-MM-DD）
- 新建用 write，补充用 append，信息有变化用 write 覆盖

## 对话结束前
append 更新 index.md 的"最近动态"（### YYYY-MM-DD，3-5 条要点，每条一句话）。

## 工具速查
- read("index.md") — 启动必读
- write(path, content) — 新建或覆盖
- append(path, content) — 追加到末尾
- search(query) — 全文搜索
- history(path) — 查看历史版本列表（附 hash）
- diff(path, commit) — 查看某次变更内容（回溯前确认）
- revert(path, commit) — 恢复到指定版本
- deleted() — 查看可恢复的已删除文件`),
	)

	p := &mcpPrefix{store: s, token: tok}

	srv.AddTool(mcp.NewTool("write",
		mcp.WithDescription("Write (create or overwrite) a Markdown note. Parent directories are created automatically. Every write is versioned by Git.\n\n写入笔记，自动创建目录，每次写入自动 Git 版本快照。\n\nConventions:\n- Use .md suffix: 'user/profile.md'\n- Start content with '# Title'\n- Use '/' as path separator"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path with .md suffix, e.g. '个人/基本信息.md' or 'work/todo.md'")),
		mcp.WithString("content", mcp.Required(), mcp.Description("Markdown content. Start with '# Title' heading.")),
	), p.write)

	srv.AddTool(mcp.NewTool("read",
		mcp.WithDescription("Read the content of a note. Returns the raw Markdown text.\n\n读取笔记内容，返回原始 Markdown 文本。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path, e.g. '个人/基本信息.md'")),
	), p.read)

	srv.AddTool(mcp.NewTool("delete",
		mcp.WithDescription("Delete a file or entire directory. Deleted files can be recovered via 'deleted' + 'revert' tools.\n\n删除文件或目录，可通过 deleted + revert 恢复。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File or directory path to delete")),
	), p.delete)

	srv.AddTool(mcp.NewTool("append",
		mcp.WithDescription("Append content to the end of a note. Creates the file if it doesn't exist. Auto-prepends a newline.\n\n追加内容到笔记末尾，文件不存在则自动创建，自动换行。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path, e.g. '日志/2025.md'")),
		mcp.WithString("content", mcp.Required(), mcp.Description("Content to append (newline is auto-prepended)")),
	), p.append)

	srv.AddTool(mcp.NewTool("list",
		mcp.WithDescription("List files and subdirectories in a directory. Directories have '/' suffix.\n\n列出目录内容，目录名以 '/' 结尾。"),
		mcp.WithString("path", mcp.Description("Directory path. Leave empty or '.' for root directory.")),
	), p.list)

	srv.AddTool(mcp.NewTool("tree",
		mcp.WithDescription("Show the full directory tree recursively. Useful for exploring the note structure.\n\n递归显示目录树，用于浏览笔记结构。"),
		mcp.WithString("path", mcp.Description("Directory path. Leave empty for full tree from root.")),
	), p.tree)

	srv.AddTool(mcp.NewTool("search",
		mcp.WithDescription("Full-text search across all notes. Supports Chinese (CJK bigram) and English. Returns paths with snippets.\n\n全文搜索，支持中英文分词，返回匹配路径和摘要。"),
		mcp.WithString("query", mcp.Required(), mcp.Description("Search keywords, e.g. '量化交易' or 'API design'")),
		mcp.WithString("path", mcp.Description("Limit search to this directory prefix, e.g. '工作/'")),
	), p.search)

	srv.AddTool(mcp.NewTool("history",
		mcp.WithDescription("Show Git version history for a file or directory. Each entry has hash, date, and message. Use hash with 'diff' or 'revert'.\n\n查看 Git 版本历史。用返回的 hash 配合 diff 或 revert 使用。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File or directory path, e.g. '个人/基本信息.md' or '个人/'")),
		mcp.WithNumber("limit", mcp.Description("Max entries to return. Default 20.")),
	), p.history)

	srv.AddTool(mcp.NewTool("diff",
		mcp.WithDescription("Show the unified diff of a specific Git commit for a file. Shows added (+) and removed (-) lines.\n\n查看某次提交的变更详情，显示增删行。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path, e.g. '个人/基本信息.md'")),
		mcp.WithString("commit", mcp.Required(), mcp.Description("Full or partial commit hash from history output")),
	), p.diff)

	srv.AddTool(mcp.NewTool("revert",
		mcp.WithDescription("Restore a file to its content at a specific Git commit. Non-destructive (writes as new version).\n\n恢复文件到指定版本，非破坏性操作（写入为新版本）。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path to restore, e.g. '个人/旧笔记.md'")),
		mcp.WithString("commit", mcp.Required(), mcp.Description("Commit hash to restore from (use restore_hash from 'deleted' tool for deleted files)")),
	), p.revert)

	srv.AddTool(mcp.NewTool("deleted",
		mcp.WithDescription("List deleted files that can be restored. Each entry has path, date, and restore_hash. Use revert(path, restore_hash) to recover.\n\n列出可恢复的已删除文件。用 revert(path, restore_hash) 恢复。"),
		mcp.WithNumber("limit", mcp.Description("Max results. Default 50.")),
	), p.deleted)

	return srv
}

type mcpPrefix struct {
	store *store.Store
	token string
}

func (m *mcpPrefix) prefix(userPath string) string {
	if userPath == "" || userPath == "." {
		return m.token
	}
	return filepath.Join(m.token, userPath)
}

func (m *mcpPrefix) stripPrefix(path string) string {
	return strings.TrimPrefix(path, m.token+"/")
}

func (m *mcpPrefix) write(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := req.GetArguments()["path"].(string)
	content := req.GetArguments()["content"].(string)

	created, err := m.store.Write(m.prefix(path), []byte(content))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if created {
		return mcp.NewToolResultText(fmt.Sprintf("Created: %s", path)), nil
	}
	return mcp.NewToolResultText(fmt.Sprintf("Updated: %s", path)), nil
}

func (m *mcpPrefix) read(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := req.GetArguments()["path"].(string)
	data, err := m.store.Read(m.prefix(path))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(string(data)), nil
}

func (m *mcpPrefix) delete(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := req.GetArguments()["path"].(string)
	if err := m.store.Delete(m.prefix(path)); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(fmt.Sprintf("Deleted: %s", path)), nil
}

func (m *mcpPrefix) append(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := req.GetArguments()["path"].(string)
	content := req.GetArguments()["content"].(string)
	if err := m.store.Append(m.prefix(path), []byte(content)); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(fmt.Sprintf("Appended to: %s", path)), nil
}

func (m *mcpPrefix) list(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := ""
	if p, ok := req.GetArguments()["path"].(string); ok && p != "" {
		path = p
	}
	entries, err := m.store.List(m.prefix(path))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	var sb strings.Builder
	for _, e := range entries {
		if e.IsDir {
			sb.WriteString(e.Name + "/\n")
		} else {
			sb.WriteString(e.Name + "\n")
		}
	}
	return mcp.NewToolResultText(sb.String()), nil
}

func (m *mcpPrefix) tree(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := ""
	if p, ok := req.GetArguments()["path"].(string); ok && p != "" {
		path = p
	}
	node, err := m.store.Tree(m.prefix(path))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	var sb strings.Builder
	printTree(&sb, node, "")
	return mcp.NewToolResultText(sb.String()), nil
}

func printTree(sb *strings.Builder, node *store.TreeNode, prefix string) {
	sb.WriteString(prefix + node.Name + "\n")
	for _, child := range node.Children {
		printTree(sb, child, prefix+"  ")
	}
}

func (m *mcpPrefix) search(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	query := req.GetArguments()["query"].(string)
	scopePath := ""
	if p, ok := req.GetArguments()["path"].(string); ok {
		scopePath = p
	}

	var searchPrefix string
	if scopePath != "" {
		searchPrefix = filepath.Join(m.token, scopePath)
	} else {
		searchPrefix = m.token + "/"
	}

	results, err := m.store.Search(query, searchPrefix)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if len(results) == 0 {
		return mcp.NewToolResultText("No results found."), nil
	}

	var sb strings.Builder
	for _, r := range results {
		sb.WriteString(fmt.Sprintf("--- %s ---\n%s\n\n", m.stripPrefix(r.Path), r.Snippet))
	}
	return mcp.NewToolResultText(sb.String()), nil
}

func (m *mcpPrefix) history(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := req.GetArguments()["path"].(string)
	limit := 20
	if l, ok := req.GetArguments()["limit"].(float64); ok && l > 0 {
		limit = int(l)
	}
	entries, err := m.store.History(m.prefix(path), limit)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if len(entries) == 0 {
		return mcp.NewToolResultText("No history found."), nil
	}
	var hsb strings.Builder
	for _, e := range entries {
		hsb.WriteString(fmt.Sprintf("%s %s %s\n", e.Hash[:8], e.Date, e.Message))
	}
	return mcp.NewToolResultText(hsb.String()), nil
}

func (m *mcpPrefix) diff(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := req.GetArguments()["path"].(string)
	commit := req.GetArguments()["commit"].(string)
	d, err := m.store.Diff(m.prefix(path), commit)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(d), nil
}

func (m *mcpPrefix) revert(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := req.GetArguments()["path"].(string)
	commit := req.GetArguments()["commit"].(string)
	if err := m.store.Revert(m.prefix(path), commit); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(fmt.Sprintf("Reverted %s to %s", path, commit[:8])), nil
}

func (m *mcpPrefix) deleted(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	limit := 50
	if l, ok := req.GetArguments()["limit"].(float64); ok && l > 0 {
		limit = int(l)
	}
	entries, err := m.store.Deleted(m.token, limit)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if len(entries) == 0 {
		return mcp.NewToolResultText("No deleted files."), nil
	}
	var sb strings.Builder
	for _, e := range entries {
		sb.WriteString(fmt.Sprintf("%s  deleted %s  restore: %s\n", e.Path, e.Date, e.RestoreHash[:8]))
	}
	return mcp.NewToolResultText(sb.String()), nil
}

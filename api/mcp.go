package api

import (
	"context"
	"fmt"
	"path/filepath"
	"strconv"
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
每次对话开始：
1. read("index.md")
2. 若 index.md 包含「请先完成初始化」区块 →
   在回应用户任何请求之前，先执行其中的引导流程
3. 否则 → 正常对话，按下方规则记录

## 何时记录
以 index.md「记录时机」的设置为准。
若 index.md 中无此设置，默认：遇到重要决策、项目进展、明确待办、用户偏好时主动记录。

## 记录格式
- 文件用 .md 后缀，首行 # 标题
- 按主题组织中文目录：个人/、工作/、项目/
- 追加内容标注日期（### YYYY-MM-DD）
- 新建用 write，补充用 append，信息有变化用 write 覆盖

## 对话结束前
append 更新 index.md 的"最近动态"（### YYYY-MM-DD，3-5 条要点，每条一句话）。

## 工具速查
- read(path, lines?) — 启动必读 index.md；lines="10-50" 可读片段
- write(path, content) — 新建或覆盖
- patch(path, old, new) — 精准替换文件中唯一的一段文本（比 write 更省 token）
- append(path, content) — 追加到末尾
- move(from, to) — 移动/重命名文件
- delete(path) — 删除文件（可通过 deleted + revert 恢复）
- search(query) — 全文搜索
- list(path) — 列出目录内容（轻量浏览子目录）
- tree(path, depth?) — 目录树，depth 默认 3
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
		mcp.WithDescription("Read the content of a note. Returns the raw Markdown text. Use 'lines' to read a partial range (e.g. '10-50') for large files.\n\n读取笔记内容。lines='10-50' 可只读片段，节省 token。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path, e.g. '个人/基本信息.md'")),
		mcp.WithString("lines", mcp.Description("Optional line range, e.g. '10-50' or '1-20'. Omit to read the full file.")),
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
		mcp.WithDescription("Show the directory tree. Default depth is 3 levels. Use depth=-1 for unlimited.\n\n显示目录树，默认 3 层，depth=-1 显示全部。"),
		mcp.WithString("path", mcp.Description("Directory path. Leave empty for full tree from root.")),
		mcp.WithNumber("depth", mcp.Description("Max depth to display. Default 3. Use -1 for unlimited.")),
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

	srv.AddTool(mcp.NewTool("patch",
		mcp.WithDescription("Precisely replace a unique string in a note without rewriting the whole file. Much more token-efficient than write for small edits.\n\n精准替换文件中的一段文本，比 write 更省 token。old_string 必须在文件中唯一存在。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path, e.g. '工作/项目.md'")),
		mcp.WithString("old", mcp.Required(), mcp.Description("The exact string to replace. Must appear exactly once in the file.")),
		mcp.WithString("new", mcp.Required(), mcp.Description("The replacement string.")),
	), p.patch)

	srv.AddTool(mcp.NewTool("move",
		mcp.WithDescription("Move or rename a note. Git history is preserved.\n\n移动或重命名笔记，保留 Git 历史。"),
		mcp.WithString("from", mcp.Required(), mcp.Description("Source file path, e.g. '临时/想法.md'")),
		mcp.WithString("to", mcp.Required(), mcp.Description("Destination file path, e.g. '项目/产品A/需求.md'")),
	), p.move)

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
	content := string(data)

	// Handle optional line range e.g. "10-50"
	if linesArg, ok := req.GetArguments()["lines"].(string); ok && linesArg != "" {
		parts := strings.SplitN(linesArg, "-", 2)
		if len(parts) == 2 {
			from, err1 := strconv.Atoi(strings.TrimSpace(parts[0]))
			to, err2 := strconv.Atoi(strings.TrimSpace(parts[1]))
			if err1 == nil && err2 == nil && from >= 1 && to >= from {
				lines := strings.Split(content, "\n")
				if from > len(lines) {
					return mcp.NewToolResultError(fmt.Sprintf("line %d out of range (file has %d lines)", from, len(lines))), nil
				}
				if to > len(lines) {
					to = len(lines)
				}
				content = strings.Join(lines[from-1:to], "\n")
				content = fmt.Sprintf("[lines %d-%d of %d]\n%s", from, to, len(lines), content)
			}
		}
	}
	return mcp.NewToolResultText(content), nil
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
	maxDepth := 3
	if d, ok := req.GetArguments()["depth"].(float64); ok {
		maxDepth = int(d)
	}
	node, err := m.store.Tree(m.prefix(path))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	var sb strings.Builder
	printTree(&sb, node, "", 0, maxDepth)
	return mcp.NewToolResultText(sb.String()), nil
}

func printTree(sb *strings.Builder, node *store.TreeNode, prefix string, depth, maxDepth int) {
	sb.WriteString(prefix + node.Name + "\n")
	if maxDepth >= 0 && depth >= maxDepth {
		if len(node.Children) > 0 {
			sb.WriteString(prefix + "  … (" + strconv.Itoa(len(node.Children)) + " items)\n")
		}
		return
	}
	for _, child := range node.Children {
		printTree(sb, child, prefix+"  ", depth+1, maxDepth)
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

func (m *mcpPrefix) patch(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path := req.GetArguments()["path"].(string)
	oldStr := req.GetArguments()["old"].(string)
	newStr := req.GetArguments()["new"].(string)
	if err := m.store.Patch(m.prefix(path), oldStr, newStr); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(fmt.Sprintf("Patched: %s", path)), nil
}

func (m *mcpPrefix) move(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	from := req.GetArguments()["from"].(string)
	to := req.GetArguments()["to"].(string)
	if err := m.store.Move(m.prefix(from), m.prefix(to)); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(fmt.Sprintf("Moved: %s → %s", from, to)), nil
}

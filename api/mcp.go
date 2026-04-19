package api

import (
	"context"
	"encoding/json"
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
- edit(path, old, new, replace_all?) — 精准替换，比 write 省 token
- append(path, content, under_heading?) — 追加到末尾；under_heading 插入到指定标题下
- stat(path) — 文件元数据（大小/行数/修改时间）
- bulk_read(paths) — 批量读取多个文件
- bulk_write(files, atomic?) — 批量写入多个文件，atomic=true 共用一次 Git 提交
- frontmatter(path) — 解析 Markdown 前置 YAML 元数据
- move(from, to) — 移动/重命名文件
- delete(path) — 删除文件（可通过 deleted + revert 恢复）
- search(query, regex?, context?, files_only?, limit?) — 关键词或正则搜索
- list(path) — 列出目录内容
- tree(path, depth?) — 目录树，depth 默认 3
- history(path) — 查看历史版本列表（附 hash）
- diff(path, commit) — 查看某次变更内容
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
		mcp.WithDescription("Append content to a note. By default appends at the end. Use 'under_heading' to insert immediately after a specific Markdown heading.\n\n追加内容到笔记末尾，或用 under_heading 插入到指定标题下方。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path, e.g. '日志/2025.md'")),
		mcp.WithString("content", mcp.Required(), mcp.Description("Content to append")),
		mcp.WithString("under_heading", mcp.Description("Insert after this heading, e.g. '## 最近动态'. Appends at end if heading not found.")),
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
		mcp.WithDescription("Search notes by keyword (default) or regex. Keyword mode uses full-text index (CJK+EN). Regex mode walks files and returns line numbers + context.\n\n关键词搜索（默认）或正则搜索。正则模式返回行号和上下文。"),
		mcp.WithString("query", mcp.Required(), mcp.Description("Search keywords or regex pattern, e.g. '量化交易' or 'API\\s+key'")),
		mcp.WithString("path", mcp.Description("Limit search to this directory, e.g. '工作/'")),
		mcp.WithBoolean("regex", mcp.Description("If true, treat query as a regular expression.")),
		mcp.WithNumber("context", mcp.Description("Lines of context before/after each match (regex mode only). Default 0.")),
		mcp.WithBoolean("files_only", mcp.Description("If true, return only file paths without line details.")),
		mcp.WithNumber("limit", mcp.Description("Max results. Default 50.")),
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

	srv.AddTool(mcp.NewTool("edit",
		mcp.WithDescription("Precisely replace a string in a note without rewriting the whole file. Token-efficient for small edits. By default old_string must appear exactly once; set replace_all=true to replace all occurrences.\n\n精准替换文件中的文本，比 write 更省 token。默认 old 必须唯一；replace_all=true 则替换全部。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path, e.g. '工作/项目.md'")),
		mcp.WithString("old", mcp.Required(), mcp.Description("The exact string to replace.")),
		mcp.WithString("new", mcp.Required(), mcp.Description("The replacement string.")),
		mcp.WithBoolean("replace_all", mcp.Description("If true, replace all occurrences. Default false (requires unique match).")),
	), p.edit)

	srv.AddTool(mcp.NewTool("stat",
		mcp.WithDescription("Get metadata for a file or directory: size, line count, last modified time.\n\n获取文件或目录的元数据：大小、行数、修改时间。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File or directory path.")),
	), p.stat)

	srv.AddTool(mcp.NewTool("bulk_read",
		mcp.WithDescription("Read multiple notes in a single call. Returns array of {path, content, error}.\n\n批量读取多个笔记，减少往返次数。"),
		mcp.WithString("paths", mcp.Required(), mcp.Description("JSON array of file paths, e.g. '[\"index.md\", \"工作/项目.md\"]'")),
	), p.bulkRead)

	srv.AddTool(mcp.NewTool("move",
		mcp.WithDescription("Move or rename a note. Git history is preserved.\n\n移动或重命名笔记，保留 Git 历史。"),
		mcp.WithString("from", mcp.Required(), mcp.Description("Source file path, e.g. '临时/想法.md'")),
		mcp.WithString("to", mcp.Required(), mcp.Description("Destination file path, e.g. '项目/产品A/需求.md'")),
	), p.move)

	srv.AddTool(mcp.NewTool("bulk_write",
		mcp.WithDescription("Write multiple notes in one call. Use atomic=true to stop on first error with a single shared git commit.\n\n批量写入多个笔记，atomic=true 时任一失败即终止，所有成功文件共用一次 Git 提交。"),
		mcp.WithString("files", mcp.Required(), mcp.Description(`JSON array of {path, content} objects, e.g. '[{"path":"a.md","content":"# A"},{"path":"b.md","content":"# B"}]'`)),
		mcp.WithBoolean("atomic", mcp.Description("If true, stop on first error and use a single git commit for all files. Default false.")),
	), p.bulkWrite)

	srv.AddTool(mcp.NewTool("frontmatter",
		mcp.WithDescription("Parse YAML front matter from a Markdown file. Returns metadata fields and the body content separately.\n\n解析 Markdown 文件的 YAML 前置元数据，返回 meta 字段和正文。"),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path, e.g. '项目/规格.md'")),
	), p.frontmatter)

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

// mustStr extracts a required string argument from MCP tool args.
// Returns a ToolResultError (never panics) when the argument is missing or not a string,
// so malformed client requests become structured errors instead of crashing the handler.
func mustStr(args map[string]any, key string) (string, *mcp.CallToolResult) {
	s, ok := args[key].(string)
	if !ok {
		return "", mcp.NewToolResultError(fmt.Sprintf("missing or invalid argument: %s", key))
	}
	return s, nil
}

func (m *mcpPrefix) write(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()
	path, errRes := mustStr(args, "path")
	if errRes != nil {
		return errRes, nil
	}
	content, errRes := mustStr(args, "content")
	if errRes != nil {
		return errRes, nil
	}

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
	path, errRes := mustStr(req.GetArguments(), "path")
	if errRes != nil {
		return errRes, nil
	}
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
	path, errRes := mustStr(req.GetArguments(), "path")
	if errRes != nil {
		return errRes, nil
	}
	if err := m.store.Delete(m.prefix(path)); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(fmt.Sprintf("Deleted: %s", path)), nil
}

func (m *mcpPrefix) append(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()
	path, errRes := mustStr(args, "path")
	if errRes != nil {
		return errRes, nil
	}
	content, errRes := mustStr(args, "content")
	if errRes != nil {
		return errRes, nil
	}
	heading, _ := args["under_heading"].(string)

	var err error
	if heading != "" {
		err = m.store.AppendUnderHeading(m.prefix(path), heading, []byte(content))
	} else {
		err = m.store.Append(m.prefix(path), []byte(content))
	}
	if err != nil {
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
	args := req.GetArguments()
	query, errRes := mustStr(args, "query")
	if errRes != nil {
		return errRes, nil
	}
	scopePath, _ := args["path"].(string)
	useRegex, _ := args["regex"].(bool)
	filesOnly, _ := args["files_only"].(bool)
	contextLines := 0
	if c, ok := args["context"].(float64); ok {
		contextLines = int(c)
	}
	limit := 50
	if l, ok := args["limit"].(float64); ok && l > 0 {
		limit = int(l)
	}

	var results []store.SearchResult
	var err error

	if useRegex {
		results, err = m.store.RegexSearch(m.token, query, scopePath, contextLines, limit, filesOnly)
	} else {
		var searchPrefix string
		if scopePath != "" {
			searchPrefix = filepath.Join(m.token, scopePath)
		} else {
			searchPrefix = m.token + "/"
		}
		results, err = m.store.Search(query, searchPrefix)
		for i := range results {
			results[i].Path = m.stripPrefix(results[i].Path)
		}
		if limit > 0 && len(results) > limit {
			results = results[:limit]
		}
	}

	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if len(results) == 0 {
		return mcp.NewToolResultText("No results found."), nil
	}

	var sb strings.Builder
	for _, r := range results {
		if filesOnly || (r.Line == 0 && r.Match == "") {
			sb.WriteString(r.Path + "\n")
			continue
		}
		if r.Line > 0 {
			for _, b := range r.Before {
				sb.WriteString(fmt.Sprintf("%s:%d-: %s\n", r.Path, r.Line-len(r.Before), b))
			}
			sb.WriteString(fmt.Sprintf("%s:%d: %s\n", r.Path, r.Line, r.Match))
			for j, a := range r.After {
				sb.WriteString(fmt.Sprintf("%s:%d+: %s\n", r.Path, r.Line+j+1, a))
			}
			sb.WriteString("\n")
		} else {
			sb.WriteString(fmt.Sprintf("--- %s ---\n%s\n\n", r.Path, r.Snippet))
		}
	}
	return mcp.NewToolResultText(sb.String()), nil
}

func (m *mcpPrefix) history(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()
	path, errRes := mustStr(args, "path")
	if errRes != nil {
		return errRes, nil
	}
	limit := 20
	if l, ok := args["limit"].(float64); ok && l > 0 {
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
	args := req.GetArguments()
	path, errRes := mustStr(args, "path")
	if errRes != nil {
		return errRes, nil
	}
	commit, errRes := mustStr(args, "commit")
	if errRes != nil {
		return errRes, nil
	}
	d, err := m.store.Diff(m.prefix(path), commit)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(d), nil
}

func (m *mcpPrefix) revert(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()
	path, errRes := mustStr(args, "path")
	if errRes != nil {
		return errRes, nil
	}
	commit, errRes := mustStr(args, "commit")
	if errRes != nil {
		return errRes, nil
	}
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

func (m *mcpPrefix) edit(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()
	path, errRes := mustStr(args, "path")
	if errRes != nil {
		return errRes, nil
	}
	oldStr, errRes := mustStr(args, "old")
	if errRes != nil {
		return errRes, nil
	}
	newStr, errRes := mustStr(args, "new")
	if errRes != nil {
		return errRes, nil
	}
	replaceAll, _ := args["replace_all"].(bool)
	if err := m.store.Edit(m.prefix(path), oldStr, newStr, replaceAll); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(fmt.Sprintf("Edited: %s", path)), nil
}

func (m *mcpPrefix) stat(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path, errRes := mustStr(req.GetArguments(), "path")
	if errRes != nil {
		return errRes, nil
	}
	result, err := m.store.Stat(m.prefix(path))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	result.Path = path
	kind := "file"
	if result.IsDir {
		kind = "directory"
	}
	text := fmt.Sprintf("path: %s\ntype: %s\nsize: %d bytes\nlines: %d\nmodified: %s",
		result.Path, kind, result.Size, result.Lines, result.Modified)
	return mcp.NewToolResultText(text), nil
}

func (m *mcpPrefix) bulkRead(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	pathsRaw, ok := req.GetArguments()["paths"].(string)
	if !ok {
		return mcp.NewToolResultError("paths must be a JSON array string"), nil
	}
	var paths []string
	if err := json.Unmarshal([]byte(pathsRaw), &paths); err != nil {
		return mcp.NewToolResultError("paths must be a JSON array: " + err.Error()), nil
	}

	var sb strings.Builder
	for _, p := range paths {
		sb.WriteString(fmt.Sprintf("=== %s ===\n", p))
		data, err := m.store.Read(m.prefix(p))
		if err != nil {
			sb.WriteString(fmt.Sprintf("[error: %s]\n\n", err.Error()))
		} else {
			sb.WriteString(string(data))
			sb.WriteString("\n\n")
		}
	}
	return mcp.NewToolResultText(sb.String()), nil
}

func (m *mcpPrefix) move(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()
	from, errRes := mustStr(args, "from")
	if errRes != nil {
		return errRes, nil
	}
	to, errRes := mustStr(args, "to")
	if errRes != nil {
		return errRes, nil
	}
	if err := m.store.Move(m.prefix(from), m.prefix(to)); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(fmt.Sprintf("Moved: %s → %s", from, to)), nil
}

func (m *mcpPrefix) bulkWrite(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	filesRaw, ok := req.GetArguments()["files"].(string)
	if !ok {
		return mcp.NewToolResultError("files must be a JSON array string"), nil
	}
	var items []store.BulkWriteItem
	if err := json.Unmarshal([]byte(filesRaw), &items); err != nil {
		return mcp.NewToolResultError("files must be a JSON array of {path, content}: " + err.Error()), nil
	}
	atomic, _ := req.GetArguments()["atomic"].(bool)

	results, err := m.store.BulkWrite(m.token, items, atomic)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	var sb strings.Builder
	for _, r := range results {
		if r.Error != "" {
			sb.WriteString(fmt.Sprintf("ERROR %s: %s\n", r.Path, r.Error))
		} else if r.Created {
			sb.WriteString(fmt.Sprintf("Created: %s\n", r.Path))
		} else {
			sb.WriteString(fmt.Sprintf("Updated: %s\n", r.Path))
		}
	}
	return mcp.NewToolResultText(sb.String()), nil
}

func (m *mcpPrefix) frontmatter(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path, errRes := mustStr(req.GetArguments(), "path")
	if errRes != nil {
		return errRes, nil
	}
	result, err := m.store.ReadFrontmatter(m.prefix(path))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	metaJSON, _ := json.MarshalIndent(result.Meta, "", "  ")
	text := fmt.Sprintf("path: %s\nfrontmatter:\n%s\n\n--- body ---\n%s",
		result.Path, string(metaJSON), result.Body)
	return mcp.NewToolResultText(text), nil
}

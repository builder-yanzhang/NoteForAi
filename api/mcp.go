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
	)

	p := &mcpPrefix{store: s, token: tok}

	srv.AddTool(mcp.NewTool("write",
		mcp.WithDescription("Write content to a file. Creates parent directories automatically. Overwrites if exists."),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path, e.g. 'project/notes/todo'")),
		mcp.WithString("content", mcp.Required(), mcp.Description("File content")),
	), p.write)

	srv.AddTool(mcp.NewTool("read",
		mcp.WithDescription("Read file content."),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path")),
	), p.read)

	srv.AddTool(mcp.NewTool("delete",
		mcp.WithDescription("Delete a file or directory."),
		mcp.WithString("path", mcp.Required(), mcp.Description("File or directory path")),
	), p.delete)

	srv.AddTool(mcp.NewTool("append",
		mcp.WithDescription("Append content to the end of a file. Creates the file if it does not exist."),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path")),
		mcp.WithString("content", mcp.Required(), mcp.Description("Content to append")),
	), p.append)

	srv.AddTool(mcp.NewTool("list",
		mcp.WithDescription("List files and subdirectories in a directory."),
		mcp.WithString("path", mcp.Description("Directory path. Defaults to root.")),
	), p.list)

	srv.AddTool(mcp.NewTool("tree",
		mcp.WithDescription("Show the full directory tree recursively."),
		mcp.WithString("path", mcp.Description("Directory path. Defaults to root.")),
	), p.tree)

	srv.AddTool(mcp.NewTool("search",
		mcp.WithDescription("Full-text search across all text files. Returns matching file paths with content snippets."),
		mcp.WithString("query", mcp.Required(), mcp.Description("Search text")),
		mcp.WithString("path", mcp.Description("Limit search to this directory path")),
	), p.search)

	srv.AddTool(mcp.NewTool("history",
		mcp.WithDescription("Show version history (git commits) for a file."),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path")),
		mcp.WithNumber("limit", mcp.Description("Max entries to return (default 20)")),
	), p.history)

	srv.AddTool(mcp.NewTool("diff",
		mcp.WithDescription("Show diff of a specific commit for a file."),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path")),
		mcp.WithString("commit", mcp.Required(), mcp.Description("Commit hash")),
	), p.diff)

	srv.AddTool(mcp.NewTool("revert",
		mcp.WithDescription("Revert a file to its content at a specific commit."),
		mcp.WithString("path", mcp.Required(), mcp.Description("File path")),
		mcp.WithString("commit", mcp.Required(), mcp.Description("Commit hash")),
	), p.revert)

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

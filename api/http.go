package api

import (
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"noteforai/store"
	"noteforai/token"

	"github.com/mark3labs/mcp-go/server"
)

const maxBodySize = 10 << 20 // 10 MB

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (sr *statusRecorder) WriteHeader(code int) {
	sr.status = code
	sr.ResponseWriter.WriteHeader(code)
}

//go:embed ui/index.html ui/dashboard.html ui/i18n.js
var uiFS embed.FS

type HTTPServer struct {
	store      *store.Store
	dataDir    string
	mux        *http.ServeMux
	mcpMu      sync.Mutex
	mcpServers map[string]*server.StreamableHTTPServer
}

func NewHTTPServer(s *store.Store, dataDir string) *HTTPServer {
	srv := &HTTPServer{store: s, dataDir: dataDir, mux: http.NewServeMux(), mcpServers: make(map[string]*server.StreamableHTTPServer)}

	// UI
	srv.mux.HandleFunc("GET /{$}", srv.serveUI)
	srv.mux.HandleFunc("GET /index.html", srv.serveUI)
	srv.mux.HandleFunc("GET /dashboard.html", srv.serveDashboard)
	srv.mux.HandleFunc("GET /i18n.js", srv.serveI18n)

	// Token creation — no auth required
	srv.mux.HandleFunc("/create_token", srv.createToken)

	// All data operations under /{token}/
	srv.mux.HandleFunc("/{token}/write", srv.requireToken(srv.write))
	srv.mux.HandleFunc("/{token}/read", srv.requireToken(srv.read))
	srv.mux.HandleFunc("/{token}/read/{path...}", srv.requireToken(srv.read))
	srv.mux.HandleFunc("/{token}/delete", srv.requireToken(srv.delete))
	srv.mux.HandleFunc("/{token}/append", srv.requireToken(srv.append))
	srv.mux.HandleFunc("/{token}/list", srv.requireToken(srv.list))
	srv.mux.HandleFunc("/{token}/list/{path...}", srv.requireToken(srv.list))
	srv.mux.HandleFunc("/{token}/tree", srv.requireToken(srv.tree))
	srv.mux.HandleFunc("/{token}/tree/{path...}", srv.requireToken(srv.tree))
	srv.mux.HandleFunc("/{token}/search", srv.requireToken(srv.search))
	srv.mux.HandleFunc("/{token}/history", srv.requireToken(srv.history))
	srv.mux.HandleFunc("/{token}/history/{path...}", srv.requireToken(srv.history))
	srv.mux.HandleFunc("/{token}/diff", srv.requireToken(srv.diff))
	srv.mux.HandleFunc("/{token}/revert", srv.requireToken(srv.revert))
	srv.mux.HandleFunc("/{token}/deleted", srv.requireToken(srv.deleted))
	srv.mux.HandleFunc("/{token}/destroy", srv.requireToken(srv.destroy))

	// MCP Streamable HTTP
	srv.mux.HandleFunc("/{token}/mcp", srv.requireToken(srv.serveMCP))

	return srv
}

func (h *HTTPServer) serveUI(w http.ResponseWriter, r *http.Request) {
	data, _ := uiFS.ReadFile("ui/index.html")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(data)
}

func (h *HTTPServer) serveDashboard(w http.ResponseWriter, r *http.Request) {
	data, _ := uiFS.ReadFile("ui/dashboard.html")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(data)
}

func (h *HTTPServer) serveI18n(w http.ResponseWriter, r *http.Request) {
	data, _ := uiFS.ReadFile("ui/i18n.js")
	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Write(data)
}

func (h *HTTPServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)
	start := time.Now()
	rec := &statusRecorder{ResponseWriter: w, status: 200}
	h.mux.ServeHTTP(rec, r)
	log.Printf("%s %s %d %s", r.Method, r.URL.Path, rec.status, time.Since(start).Round(time.Millisecond))
}

// requireToken validates the token from the URL path.
func (h *HTTPServer) requireToken(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		t := r.PathValue("token")
		if !token.IsValid(t) {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		if !token.Exists(h.dataDir, t) {
			http.Error(w, "token not found", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

// getParam reads a parameter from JSON body (POST) or query string (GET).
func getParam(r *http.Request, parsed map[string]any, key string) string {
	if v, ok := parsed[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return r.URL.Query().Get(key)
}

// parseBody parses JSON body for POST requests, returns empty map for GET.
func parseBody(r *http.Request) map[string]any {
	parsed := map[string]any{}
	if r.Method == http.MethodPost && r.Body != nil {
		ct := r.Header.Get("Content-Type")
		if strings.Contains(ct, "application/json") {
			json.NewDecoder(r.Body).Decode(&parsed)
		}
	}
	return parsed
}

// prefixPath prepends the token to the user's path for isolation.
func prefixPath(r *http.Request, userPath string) string {
	t := r.PathValue("token")
	if userPath == "" || userPath == "." {
		return t
	}
	return filepath.Join(t, userPath)
}

// getPathParam extracts path from URL wildcard {path...}, then JSON body, then query param.
func getPathParam(r *http.Request, body map[string]any) string {
	if p := r.PathValue("path"); p != "" {
		return p
	}
	return getParam(r, body, "path")
}

// --- Handlers ---

func (h *HTTPServer) createToken(w http.ResponseWriter, r *http.Request) {
	t, err := token.Create(h.dataDir)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]string{"token": t})
}

func (h *HTTPServer) write(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	var content []byte
	if c, ok := body["content"]; ok {
		content = []byte(fmt.Sprint(c))
	} else if q := r.URL.Query().Get("content"); q != "" {
		content = []byte(q)
	} else {
		// Try raw body for non-JSON POST
		if r.Method == http.MethodPost {
			var readErr error
			content, readErr = io.ReadAll(r.Body)
			if readErr != nil {
				http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
				return
			}
		}
	}

	created, err := h.store.Write(prefixPath(r, path), content)
	if err != nil {
		if errors.Is(err, store.ErrQuotaExceeded) {
			http.Error(w, err.Error(), http.StatusInsufficientStorage)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if created {
		w.WriteHeader(http.StatusCreated)
	} else {
		w.WriteHeader(http.StatusOK)
	}
}

func (h *HTTPServer) read(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getPathParam(r, body)
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	full := prefixPath(r, path)
	data, err := h.store.Read(full)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if isText(data) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	} else {
		w.Header().Set("Content-Type", "application/octet-stream")
	}
	w.Write(data)
}

func (h *HTTPServer) delete(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	if err := h.store.Delete(prefixPath(r, path)); err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *HTTPServer) append(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	var content []byte
	if c, ok := body["content"]; ok {
		content = []byte(fmt.Sprint(c))
	} else if q := r.URL.Query().Get("content"); q != "" {
		content = []byte(q)
	} else if r.Method == http.MethodPost {
		var readErr error
		content, readErr = io.ReadAll(r.Body)
		if readErr != nil {
			http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
			return
		}
	}

	if err := h.store.Append(prefixPath(r, path), content); err != nil {
		if errors.Is(err, store.ErrQuotaExceeded) {
			http.Error(w, err.Error(), http.StatusInsufficientStorage)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *HTTPServer) list(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getPathParam(r, body)
	full := prefixPath(r, path)

	entries, err := h.store.List(full)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, entries)
}

func (h *HTTPServer) tree(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getPathParam(r, body)
	full := prefixPath(r, path)

	node, err := h.store.Tree(full)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, node)
}

func (h *HTTPServer) search(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	query := getParam(r, body, "query")
	if query == "" {
		query = getParam(r, body, "q")
	}
	if query == "" {
		http.Error(w, "query required", http.StatusBadRequest)
		return
	}

	t := r.PathValue("token")
	scopePath := getParam(r, body, "path")

	// Force scope to user's prefix
	var searchPrefix string
	if scopePath != "" {
		searchPrefix = filepath.Join(t, scopePath)
	} else {
		searchPrefix = t + "/"
	}

	results, err := h.store.Search(query, searchPrefix)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Strip token prefix from result paths
	stripped := make([]store.SearchResult, len(results))
	for i, r := range results {
		stripped[i] = store.SearchResult{
			Path:    strings.TrimPrefix(r.Path, t+"/"),
			Snippet: r.Snippet,
		}
	}
	writeJSON(w, stripped)
}

func (h *HTTPServer) history(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getPathParam(r, body)
	if path == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}
	limit := 20
	if s := getParam(r, body, "limit"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			limit = n
		}
	}
	entries, err := h.store.History(prefixPath(r, path), limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []store.HistoryEntry{}
	}
	writeJSON(w, entries)
}

func (h *HTTPServer) diff(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	commit := getParam(r, body, "commit")
	if path == "" || commit == "" {
		http.Error(w, "path and commit required", http.StatusBadRequest)
		return
	}
	d, err := h.store.Diff(prefixPath(r, path), commit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write([]byte(d))
}

func (h *HTTPServer) revert(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	path := getParam(r, body, "path")
	commit := getParam(r, body, "commit")
	if path == "" || commit == "" {
		http.Error(w, "path and commit required", http.StatusBadRequest)
		return
	}
	if err := h.store.Revert(prefixPath(r, path), commit); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *HTTPServer) deleted(w http.ResponseWriter, r *http.Request) {
	body := parseBody(r)
	limit := 50
	if s := getParam(r, body, "limit"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			limit = n
		}
	}
	t := r.PathValue("token")
	entries, err := h.store.Deleted(t, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []store.DeletedEntry{}
	}
	writeJSON(w, entries)
}

func (h *HTTPServer) destroy(w http.ResponseWriter, r *http.Request) {
	t := r.PathValue("token")
	if err := token.Destroy(h.dataDir, t); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.store.DestroyToken(t)
	h.mcpMu.Lock()
	delete(h.mcpServers, t)
	h.mcpMu.Unlock()
	w.WriteHeader(http.StatusOK)
}

func (h *HTTPServer) getOrCreateMCP(tok string) *server.StreamableHTTPServer {
	h.mcpMu.Lock()
	defer h.mcpMu.Unlock()
	if s, ok := h.mcpServers[tok]; ok {
		return s
	}
	mcpSrv := NewMCPServer(h.store, tok)
	s := server.NewStreamableHTTPServer(mcpSrv, server.WithStateLess(true))
	h.mcpServers[tok] = s
	return s
}

func (h *HTTPServer) serveMCP(w http.ResponseWriter, r *http.Request) {
	tok := r.PathValue("token")
	h.getOrCreateMCP(tok).ServeHTTP(w, r)
}

func isText(data []byte) bool {
	check := data
	if len(check) > 512 {
		check = check[:512]
	}
	for _, b := range check {
		if b == 0 {
			return false
		}
	}
	return true
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	enc.Encode(v)
}

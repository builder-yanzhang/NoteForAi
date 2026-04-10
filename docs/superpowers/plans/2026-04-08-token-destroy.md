# Token Destroy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add soft-delete token destroy API with daily trash cleanup.

**Architecture:** `token.Destroy()` renames directory, `store.DestroyToken()` clears index + caches, `store.StartTrashCleaner()` runs daily goroutine. HTTP handler at `/{token}/destroy`.

**Tech Stack:** Go stdlib (os, time, filepath, strconv)

---

### Task 1: token.Destroy() — 重命名目录

**Files:**
- Modify: `token/token.go`

- [ ] **Step 1: Write the failing test**

Create `token/token_test.go`:

```go
package token_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"noteforai/token"
)

func TestDestroy(t *testing.T) {
	dir := t.TempDir()
	tok, err := token.Create(dir)
	if err != nil {
		t.Fatal(err)
	}

	if err := token.Destroy(dir, tok); err != nil {
		t.Fatal(err)
	}

	// Original directory should not exist
	if token.Exists(dir, tok) {
		t.Error("token still exists after destroy")
	}

	// A .deleted. directory should exist
	entries, _ := os.ReadDir(filepath.Join(dir, "files"))
	found := false
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), tok+".deleted.") {
			found = true
		}
	}
	if !found {
		t.Error("no .deleted. directory found")
	}
}

func TestDestroyNotFound(t *testing.T) {
	dir := t.TempDir()
	os.MkdirAll(filepath.Join(dir, "files"), 0755)
	err := token.Destroy(dir, "nfa_nonexistent00000000000000000000")
	if err == nil {
		t.Error("expected error for non-existent token")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./token/ -v -run TestDestroy`
Expected: FAIL — `token.Destroy` not defined

- [ ] **Step 3: Write implementation**

Add to `token/token.go`:

```go
// Destroy soft-deletes a token by renaming its directory with a .deleted.{timestamp} suffix.
func Destroy(dataDir string, t string) error {
	src := filepath.Join(dataDir, "files", t)
	if _, err := os.Stat(src); err != nil {
		return fmt.Errorf("token not found: %s", t)
	}
	dst := fmt.Sprintf("%s.deleted.%d", src, time.Now().Unix())
	return os.Rename(src, dst)
}
```

Add `"time"` to the import block.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./token/ -v -run TestDestroy`
Expected: PASS (both TestDestroy and TestDestroyNotFound)

- [ ] **Step 5: Commit**

```bash
git add token/token.go token/token_test.go
git commit -m "feat: add token.Destroy() soft-delete"
```

---

### Task 2: store.DestroyToken() — 清索引 + 清缓存

**Files:**
- Modify: `store/store.go`

- [ ] **Step 1: Write the failing test**

Add to `store/store_test.go`:

```go
func TestDestroyToken(t *testing.T) {
	s, tok, cleanup := setupWithToken(t)
	defer cleanup()

	// Write some data
	s.Write(tok+"/note1", []byte("hello"))
	s.Write(tok+"/note2", []byte("world"))

	// Verify searchable
	results, _ := s.Search("hello", tok+"/")
	if len(results) != 1 {
		t.Fatalf("expected 1 search result before destroy, got %d", len(results))
	}

	// Destroy
	s.DestroyToken(tok)

	// Index should be cleared
	results, _ = s.Search("hello", tok+"/")
	if len(results) != 0 {
		t.Errorf("expected 0 search results after destroy, got %d", len(results))
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./store/ -v -run TestDestroyToken`
Expected: FAIL — `s.DestroyToken` not defined

- [ ] **Step 3: Write implementation**

Add to `store/store.go`:

```go
// DestroyToken clears all index entries and in-memory caches for a token.
func (s *Store) DestroyToken(token string) {
	// Clear index
	if err := s.index.RemoveByPrefix(token + "/"); err != nil {
		log.Printf("index cleanup error for %s: %v", token, err)
	}

	// Clear usage cache
	s.usageMu.Lock()
	delete(s.usage, token)
	s.usageMu.Unlock()

	// Clear path locks
	s.mu.Lock()
	for k := range s.locks {
		if strings.HasPrefix(k, filepath.Join(s.basePath, token)) {
			delete(s.locks, k)
		}
	}
	s.mu.Unlock()

	// Clear git repo cache
	s.repoMu.Lock()
	delete(s.repos, token)
	s.repoMu.Unlock()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./store/ -v -run TestDestroyToken`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add store/store.go store/store_test.go
git commit -m "feat: add store.DestroyToken() index and cache cleanup"
```

---

### Task 3: store.StartTrashCleaner() — 定时清理

**Files:**
- Modify: `store/store.go`
- Modify: `main.go`

- [ ] **Step 1: Write the failing test**

Add to `store/store_test.go`:

```go
func TestCleanTrash(t *testing.T) {
	s, _, cleanup := setupWithToken(t)
	defer cleanup()

	// Create a fake .deleted. directory with an old timestamp (0 = 1970)
	oldDir := filepath.Join(s.BasePath(), "nfa_fake.deleted.0")
	os.MkdirAll(oldDir, 0755)
	os.WriteFile(filepath.Join(oldDir, "file"), []byte("old"), 0644)

	// Create a recent .deleted. directory
	recentDir := fmt.Sprintf("%s/nfa_fake2.deleted.%d", s.BasePath(), time.Now().Unix())
	os.MkdirAll(recentDir, 0755)

	// Clean with 30 day retention
	s.CleanTrash(30)

	// Old one should be gone
	if _, err := os.Stat(oldDir); err == nil {
		t.Error("old trash directory should have been removed")
	}

	// Recent one should remain
	if _, err := os.Stat(recentDir); err != nil {
		t.Error("recent trash directory should still exist")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./store/ -v -run TestCleanTrash`
Expected: FAIL — `s.BasePath()` and `s.CleanTrash()` not defined

- [ ] **Step 3: Write implementation**

Add to `store/store.go`:

```go
// BasePath returns the store's base path (for testing).
func (s *Store) BasePath() string {
	return s.basePath
}

// CleanTrash removes .deleted. directories older than the given retention days.
func (s *Store) CleanTrash(retentionDays int) {
	entries, err := os.ReadDir(s.basePath)
	if err != nil {
		log.Printf("trash cleaner: read dir error: %v", err)
		return
	}
	cutoff := time.Now().Unix() - int64(retentionDays)*86400
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		name := e.Name()
		idx := strings.LastIndex(name, ".deleted.")
		if idx == -1 {
			continue
		}
		tsStr := name[idx+len(".deleted."):]
		ts, err := strconv.ParseInt(tsStr, 10, 64)
		if err != nil {
			continue
		}
		if ts < cutoff {
			dir := filepath.Join(s.basePath, name)
			if err := os.RemoveAll(dir); err != nil {
				log.Printf("trash cleaner: remove error: %v", err)
			} else {
				log.Printf("trash cleaner: removed %s", name)
			}
		}
	}
}

// StartTrashCleaner runs CleanTrash on startup and then daily.
func (s *Store) StartTrashCleaner(retentionDays int) {
	s.CleanTrash(retentionDays)
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			s.CleanTrash(retentionDays)
		}
	}()
}
```

Add `"strconv"` and `"time"` to `store/store.go` imports.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./store/ -v -run TestCleanTrash`
Expected: PASS

- [ ] **Step 5: Update main.go**

Add `TRASH_DAYS` env var reading after the quota block in `main.go`:

```go
trashDays := 30
if td := env("TRASH_DAYS", "30"); td != "30" {
	if d, err := strconv.Atoi(td); err == nil && d >= 0 {
		trashDays = d
	}
}
s.StartTrashCleaner(trashDays)
log.Printf("Trash cleaner: %d day retention", trashDays)
```

- [ ] **Step 6: Run all tests**

Run: `go vet ./... && go test ./... -race -count=1`
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add store/store.go store/store_test.go main.go
git commit -m "feat: add trash cleaner with daily schedule"
```

---

### Task 4: HTTP destroy endpoint

**Files:**
- Modify: `api/http.go`

- [ ] **Step 1: Write the failing test**

Add to `api/http_test.go`:

```go
func TestDestroyEndpoint(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	// Write data
	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"hello"}`)

	// Destroy
	resp, err := postJSON(env.ts.URL+"/"+tok+"/destroy", `{}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("destroy status = %d, want 200", resp.StatusCode)
	}
	resp.Body.Close()

	// All operations should now return 401
	resp, _ = postJSON(env.ts.URL+"/"+tok+"/read", `{"path":"note"}`)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("read after destroy status = %d, want 401", resp.StatusCode)
	}
	resp.Body.Close()

	resp, _ = postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"new"}`)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("write after destroy status = %d, want 401", resp.StatusCode)
	}
	resp.Body.Close()
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./api/ -v -run TestDestroyEndpoint`
Expected: FAIL — route not registered, returns 404 or 405

- [ ] **Step 3: Write implementation**

Add route in `NewHTTPServer` (after the revert route):

```go
srv.mux.HandleFunc("/{token}/destroy", srv.requireToken(srv.destroy))
```

Add handler method:

```go
func (h *HTTPServer) destroy(w http.ResponseWriter, r *http.Request) {
	t := r.PathValue("token")
	if err := token.Destroy(h.dataDir, t); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.store.DestroyToken(t)
	w.WriteHeader(http.StatusOK)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./api/ -v -run TestDestroyEndpoint`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `go vet ./... && go test ./... -v -race -count=1`
Expected: all pass, no race conditions

- [ ] **Step 6: Commit**

```bash
git add api/http.go api/http_test.go
git commit -m "feat: add /{token}/destroy HTTP endpoint"
```

---

### Task 5: Update docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Update CLAUDE.md API section**

Add destroy to the API table:

```
/{token}/destroy                      销毁 Token（软删除，200）
```

Add `TRASH_DAYS` to environment variables mention.

- [ ] **Step 2: Update README.md API table**

Add row:

```
| `/{token}/destroy` | — | 销毁 Token（软删除） | 200 |
```

Add `TRASH_DAYS` to environment variables table:

```
| `TRASH_DAYS` | `30` | 软删除保留天数（0=立即删除） |
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: add destroy endpoint and TRASH_DAYS to documentation"
```

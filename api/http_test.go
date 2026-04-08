package api_test

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"noteforai/api"
	"noteforai/index"
	"noteforai/store"
	"noteforai/token"
)

type testEnv struct {
	ts      *httptest.Server
	dataDir string
}

func setup(t *testing.T) *testEnv {
	t.Helper()
	dir := t.TempDir()
	idx, err := index.NewBleve(filepath.Join(dir, "index"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { idx.Close() })
	s := store.New(filepath.Join(dir, "files"), idx)
	ts := httptest.NewServer(api.NewHTTPServer(s, dir))
	t.Cleanup(ts.Close)
	return &testEnv{ts: ts, dataDir: dir}
}

func createToken(t *testing.T, env *testEnv) string {
	t.Helper()
	resp, err := http.Get(env.ts.URL + "/create_token")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("create_token status = %d", resp.StatusCode)
	}
	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	tok := result["token"]
	if tok == "" {
		t.Fatal("empty token")
	}
	return tok
}

func postJSON(url string, body string) (*http.Response, error) {
	return http.Post(url, "application/json", strings.NewReader(body))
}

// --- Token Tests ---

func TestCreateToken(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)
	if !token.IsValid(tok) {
		t.Errorf("invalid token format: %s", tok)
	}
}

func TestCreateTokenViaPost(t *testing.T) {
	env := setup(t)
	resp, err := http.Post(env.ts.URL+"/create_token", "", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	if !token.IsValid(result["token"]) {
		t.Error("POST create_token failed")
	}
}

func TestInvalidToken401(t *testing.T) {
	env := setup(t)
	resp, _ := http.Get(env.ts.URL + "/bad_token/list")
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
	resp.Body.Close()
}

func TestNonexistentToken401(t *testing.T) {
	env := setup(t)
	// Valid format but not created
	resp, _ := http.Get(env.ts.URL + "/nfa_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaAA/list")
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
	resp.Body.Close()
}

// --- Write + Read (POST JSON) ---

func TestWriteReadPostJSON(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	resp, err := postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"hello","content":"world"}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("write status = %d, want 201", resp.StatusCode)
	}
	resp.Body.Close()

	resp, err = postJSON(env.ts.URL+"/"+tok+"/read", `{"path":"hello"}`)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "world" {
		t.Errorf("read = %q, want %q", body, "world")
	}
}

// --- Write + Read (GET query params) ---

func TestWriteReadGetQuery(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	resp, err := http.Get(env.ts.URL + "/" + tok + "/write?path=hello&content=world")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("write status = %d, want 201", resp.StatusCode)
	}
	resp.Body.Close()

	resp, err = http.Get(env.ts.URL + "/" + tok + "/read?path=hello")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "world" {
		t.Errorf("read = %q, want %q", body, "world")
	}
}

// --- Overwrite ---

func TestOverwrite(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"f","content":"v1"}`)
	resp, _ := postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"f","content":"v2"}`)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("overwrite status = %d, want 200", resp.StatusCode)
	}
	resp.Body.Close()

	resp, _ = postJSON(env.ts.URL+"/"+tok+"/read", `{"path":"f"}`)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "v2" {
		t.Errorf("got %q", body)
	}
}

// --- Append ---

func TestAppend(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"log","content":"line1"}`)
	resp, _ := postJSON(env.ts.URL+"/"+tok+"/append", `{"path":"log","content":"\nline2"}`)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("append status = %d", resp.StatusCode)
	}
	resp.Body.Close()

	resp, _ = postJSON(env.ts.URL+"/"+tok+"/read", `{"path":"log"}`)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "line1\nline2" {
		t.Errorf("got %q", body)
	}
}

// --- Delete ---

func TestDelete(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"tmp","content":"x"}`)
	resp, _ := postJSON(env.ts.URL+"/"+tok+"/delete", `{"path":"tmp"}`)
	if resp.StatusCode != http.StatusNoContent {
		t.Errorf("delete status = %d, want 204", resp.StatusCode)
	}
	resp.Body.Close()

	resp, _ = postJSON(env.ts.URL+"/"+tok+"/read", `{"path":"tmp"}`)
	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("after delete, read status = %d, want 404", resp.StatusCode)
	}
	resp.Body.Close()
}

// --- List ---

func TestList(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"dir/a","content":"1"}`)
	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"dir/b","content":"2"}`)

	resp, _ := postJSON(env.ts.URL+"/"+tok+"/list", `{"path":"dir"}`)
	defer resp.Body.Close()

	var entries []store.Entry
	json.NewDecoder(resp.Body).Decode(&entries)
	if len(entries) != 2 {
		t.Errorf("expected 2 entries, got %d", len(entries))
	}
}

func TestListRoot(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note1","content":"a"}`)

	resp, err := http.Get(env.ts.URL + "/" + tok + "/list")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	var entries []store.Entry
	json.NewDecoder(resp.Body).Decode(&entries)
	if len(entries) != 1 {
		t.Errorf("expected 1 entry, got %d", len(entries))
	}
}

// --- Tree ---

func TestTree(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"a/b","content":"deep"}`)

	resp, err := http.Get(env.ts.URL + "/" + tok + "/tree")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	var node store.TreeNode
	json.NewDecoder(resp.Body).Decode(&node)
	if node.Name != "." {
		t.Errorf("root = %q, want %q", node.Name, ".")
	}
	if len(node.Children) == 0 {
		t.Error("expected children")
	}
}

// --- Search ---

func TestSearch(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"doc","content":"Go语言并发编程"}`)

	// Wait for index
	resp, _ := postJSON(env.ts.URL+"/"+tok+"/search", `{"query":"并发"}`)
	defer resp.Body.Close()

	var results []store.SearchResult
	json.NewDecoder(resp.Body).Decode(&results)
	if len(results) != 1 {
		t.Errorf("expected 1 result, got %d", len(results))
	}
	if len(results) > 0 && results[0].Path != "doc" {
		t.Errorf("result path = %q, want %q", results[0].Path, "doc")
	}
}

func TestSearchGetQuery(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"测试内容"}`)

	resp, err := http.Get(env.ts.URL + "/" + tok + "/search?q=测试")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	var results []store.SearchResult
	json.NewDecoder(resp.Body).Decode(&results)
	if len(results) != 1 {
		t.Errorf("expected 1 result, got %d", len(results))
	}
}

// --- Multi-user Isolation ---

func TestUserIsolation(t *testing.T) {
	env := setup(t)
	tok1 := createToken(t, env)
	tok2 := createToken(t, env)

	// User 1 writes
	postJSON(env.ts.URL+"/"+tok1+"/write", `{"path":"secret","content":"user1 data"}`)

	// User 2 cannot read user 1's data
	resp, _ := postJSON(env.ts.URL+"/"+tok2+"/read", `{"path":"secret"}`)
	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("user2 read user1 data: status = %d, want 404", resp.StatusCode)
	}
	resp.Body.Close()

	// User 2 cannot search user 1's data
	resp, _ = postJSON(env.ts.URL+"/"+tok2+"/search", `{"query":"user1"}`)
	defer resp.Body.Close()
	var results []store.SearchResult
	json.NewDecoder(resp.Body).Decode(&results)
	if len(results) != 0 {
		t.Errorf("user2 found user1 data in search: %d results", len(results))
	}
}

// --- Not Found ---

func TestReadNotFound(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	resp, _ := http.Get(env.ts.URL + "/" + tok + "/read?path=nope")
	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("status = %d, want 404", resp.StatusCode)
	}
	resp.Body.Close()
}

// --- Missing path param ---

func TestWriteMissingPath(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	resp, _ := postJSON(env.ts.URL+"/"+tok+"/write", `{"content":"no path"}`)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", resp.StatusCode)
	}
	resp.Body.Close()
}

// --- Version Tracking Tests ---

func TestHistoryEndpoint(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"v1"}`)
	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"v2"}`)

	resp, err := postJSON(env.ts.URL+"/"+tok+"/history", `{"path":"note"}`)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("history status = %d", resp.StatusCode)
	}
	var entries []store.HistoryEntry
	json.NewDecoder(resp.Body).Decode(&entries)
	if len(entries) != 2 {
		t.Errorf("expected 2 history entries, got %d", len(entries))
	}
}

func TestDiffEndpoint(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"v1"}`)
	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"v2"}`)

	resp, _ := postJSON(env.ts.URL+"/"+tok+"/history", `{"path":"note"}`)
	var entries []store.HistoryEntry
	json.NewDecoder(resp.Body).Decode(&entries)
	resp.Body.Close()

	if len(entries) < 1 {
		t.Fatal("no history entries")
	}

	resp, err := postJSON(env.ts.URL+"/"+tok+"/diff",
		fmt.Sprintf(`{"path":"note","commit":"%s"}`, entries[0].Hash))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("diff status = %d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if len(body) == 0 {
		t.Error("expected non-empty diff")
	}
}

func TestRevertEndpoint(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"original"}`)
	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"changed"}`)

	resp, _ := postJSON(env.ts.URL+"/"+tok+"/history", `{"path":"note"}`)
	var entries []store.HistoryEntry
	json.NewDecoder(resp.Body).Decode(&entries)
	resp.Body.Close()

	if len(entries) < 2 {
		t.Fatal("expected at least 2 history entries")
	}

	// Revert to first commit (entries[1] is the oldest)
	resp, err := postJSON(env.ts.URL+"/"+tok+"/revert",
		fmt.Sprintf(`{"path":"note","commit":"%s"}`, entries[1].Hash))
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("revert status = %d", resp.StatusCode)
	}
	resp.Body.Close()

	// Verify content restored
	resp, _ = postJSON(env.ts.URL+"/"+tok+"/read", `{"path":"note"}`)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "original" {
		t.Errorf("got %q, want %q", body, "original")
	}
}

// --- Destroy Tests ---

func TestDestroyEndpoint(t *testing.T) {
	env := setup(t)
	tok := createToken(t, env)

	postJSON(env.ts.URL+"/"+tok+"/write", `{"path":"note","content":"hello"}`)

	resp, err := postJSON(env.ts.URL+"/"+tok+"/destroy", `{}`)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("destroy status = %d, want 200", resp.StatusCode)
	}
	resp.Body.Close()

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

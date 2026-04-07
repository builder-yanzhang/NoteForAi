package store_test

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"noteforai/index"
	"noteforai/store"
)

func setup(t *testing.T) (*store.Store, func()) {
	t.Helper()
	dir := t.TempDir()
	idx, err := index.NewBleve(filepath.Join(dir, "index"))
	if err != nil {
		t.Fatal(err)
	}
	s := store.New(filepath.Join(dir, "files"), idx)
	return s, func() { idx.Close() }
}

func TestWriteAndRead(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	created, err := s.Write("a/b/note1", []byte("hello world"))
	if err != nil {
		t.Fatal(err)
	}
	if !created {
		t.Error("expected created=true for new file")
	}

	data, err := s.Read("a/b/note1")
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "hello world" {
		t.Errorf("got %q, want %q", data, "hello world")
	}

	// Overwrite
	created, err = s.Write("a/b/note1", []byte("updated"))
	if err != nil {
		t.Fatal(err)
	}
	if created {
		t.Error("expected created=false for overwrite")
	}

	data, _ = s.Read("a/b/note1")
	if string(data) != "updated" {
		t.Errorf("got %q, want %q", data, "updated")
	}
}

func TestReadNotExist(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	_, err := s.Read("nonexistent")
	if !os.IsNotExist(err) {
		t.Errorf("expected not exist error, got %v", err)
	}
}

func TestAppend(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	s.Write("log", []byte("line1"))
	s.Append("log", []byte("\nline2"))

	data, _ := s.Read("log")
	if string(data) != "line1\nline2" {
		t.Errorf("got %q", data)
	}
}

func TestAppendCreatesFile(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	err := s.Append("new/file", []byte("content"))
	if err != nil {
		t.Fatal(err)
	}

	data, _ := s.Read("new/file")
	if string(data) != "content" {
		t.Errorf("got %q", data)
	}
}

func TestDelete(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	s.Write("to-delete", []byte("tmp"))
	err := s.Delete("to-delete")
	if err != nil {
		t.Fatal(err)
	}

	_, err = s.Read("to-delete")
	if !os.IsNotExist(err) {
		t.Error("expected file to be deleted")
	}
}

func TestDeleteDirectory(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	s.Write("dir/a", []byte("1"))
	s.Write("dir/b", []byte("2"))

	err := s.Delete("dir")
	if err != nil {
		t.Fatal(err)
	}

	_, err = s.Read("dir/a")
	if !os.IsNotExist(err) {
		t.Error("expected directory to be deleted")
	}
}

func TestList(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	s.Write("proj/readme", []byte("hi"))
	s.Write("proj/sub/note", []byte("note"))

	entries, err := s.List("proj")
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}

	names := map[string]bool{}
	for _, e := range entries {
		names[e.Name] = e.IsDir
	}

	if !names["sub"] {
		t.Error("expected 'sub' to be a directory")
	}
	if names["readme"] {
		t.Error("expected 'readme' to not be a directory")
	}
}

func TestTree(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	s.Write("a/b/c", []byte("deep"))
	s.Write("a/x", []byte("shallow"))

	node, err := s.Tree(".")
	if err != nil {
		t.Fatal(err)
	}

	if node.Name != "." {
		t.Errorf("root name = %q, want %q", node.Name, ".")
	}
	if len(node.Children) != 1 {
		t.Fatalf("expected 1 child (a/), got %d", len(node.Children))
	}
	if node.Children[0].Name != "a/" {
		t.Errorf("child name = %q, want %q", node.Children[0].Name, "a/")
	}
}

func TestSearch(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	s.Write("notes/redis", []byte("Redis连接池配置建议200"))
	s.Write("notes/mysql", []byte("MySQL索引优化"))
	s.Write("other/doc", []byte("Redis缓存策略"))

	results, err := s.Search("Redis", "")
	if err != nil {
		t.Fatal(err)
	}
	if len(results) != 2 {
		t.Errorf("expected 2 results, got %d", len(results))
	}

	// Scoped search
	results, err = s.Search("Redis", "notes/")
	if err != nil {
		t.Fatal(err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 scoped result, got %d", len(results))
	}
}

func TestSearchAfterDelete(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	s.Write("tmp", []byte("temporary data"))
	s.Delete("tmp")

	results, _ := s.Search("temporary", "")
	if len(results) != 0 {
		t.Errorf("expected 0 results after delete, got %d", len(results))
	}
}

func TestPathTraversal(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	_, err := s.Write("../../etc/passwd", []byte("hack"))
	if err == nil {
		t.Error("expected path traversal to be rejected")
	}
}

func TestBinaryFileNotIndexed(t *testing.T) {
	s, cleanup := setup(t)
	defer cleanup()

	binary := []byte{0x89, 0x50, 0x4E, 0x47, 0x00, 0x00, 0x00}
	s.Write("image.png", binary)

	results, _ := s.Search("PNG", "")
	if len(results) != 0 {
		t.Error("binary file should not be indexed")
	}
}

// --- Version Tracking Tests ---

func setupWithToken(t *testing.T) (*store.Store, string, func()) {
	t.Helper()
	dir := t.TempDir()
	idx, err := index.NewBleve(filepath.Join(dir, "index"))
	if err != nil {
		t.Fatal(err)
	}
	s := store.New(filepath.Join(dir, "files"), idx)
	tok := "nfa_testtoken00000000000000000000"
	os.MkdirAll(filepath.Join(dir, "files", tok), 0755)
	return s, tok, func() { idx.Close() }
}

func TestHistory(t *testing.T) {
	s, tok, cleanup := setupWithToken(t)
	defer cleanup()

	s.Write(tok+"/file", []byte("v1"))
	s.Write(tok+"/file", []byte("v2"))
	s.Write(tok+"/file", []byte("v3"))

	entries, err := s.History(tok+"/file", 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 3 {
		t.Fatalf("expected 3 history entries, got %d", len(entries))
	}
	if entries[0].Message != "write file" {
		t.Errorf("unexpected message: %q", entries[0].Message)
	}
}

func TestHistoryLimit(t *testing.T) {
	s, tok, cleanup := setupWithToken(t)
	defer cleanup()

	for i := 0; i < 5; i++ {
		s.Write(tok+"/file", []byte(fmt.Sprintf("v%d", i)))
	}
	entries, err := s.History(tok+"/file", 2)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 2 {
		t.Errorf("expected 2 entries with limit, got %d", len(entries))
	}
}

func TestDiff(t *testing.T) {
	s, tok, cleanup := setupWithToken(t)
	defer cleanup()

	s.Write(tok+"/file", []byte("hello"))
	s.Write(tok+"/file", []byte("world"))

	entries, err := s.History(tok+"/file", 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) < 1 {
		t.Fatal("no history")
	}
	diff, err := s.Diff(tok+"/file", entries[0].Hash)
	if err != nil {
		t.Fatal(err)
	}
	if diff == "" {
		t.Error("expected non-empty diff")
	}
}

func TestRevert(t *testing.T) {
	s, tok, cleanup := setupWithToken(t)
	defer cleanup()

	s.Write(tok+"/file", []byte("original"))
	s.Write(tok+"/file", []byte("changed"))

	entries, err := s.History(tok+"/file", 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) < 2 {
		t.Fatal("expected at least 2 entries")
	}
	// entries[0] is latest ("changed"), entries[1] is first ("original")
	err = s.Revert(tok+"/file", entries[1].Hash)
	if err != nil {
		t.Fatal(err)
	}

	data, err := s.Read(tok + "/file")
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "original" {
		t.Errorf("got %q, want %q", data, "original")
	}

	// Should have 3 entries now (write, write, revert)
	entries, _ = s.History(tok+"/file", 10)
	if len(entries) != 3 {
		t.Fatalf("expected 3 entries after revert, got %d", len(entries))
	}
	if entries[0].Message != "revert file" {
		t.Errorf("expected revert commit, got %q", entries[0].Message)
	}
}

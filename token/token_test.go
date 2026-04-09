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

	if token.Exists(dir, tok) {
		t.Error("token still exists after destroy")
	}

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

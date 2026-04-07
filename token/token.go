package token

import (
	"crypto/rand"
	"math/big"
	"os"
	"path/filepath"
	"strings"
)

const (
	Prefix  = "nfa_"
	charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	randLen = 32
)

// Generate creates a new token: nfa_ + 32 random chars (a-zA-Z0-9).
func Generate() (string, error) {
	b := make([]byte, randLen)
	for i := range b {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		b[i] = charset[n.Int64()]
	}
	return Prefix + string(b), nil
}

// IsValid checks if a token has the correct format.
func IsValid(t string) bool {
	if !strings.HasPrefix(t, Prefix) || len(t) != len(Prefix)+randLen {
		return false
	}
	for _, c := range t[len(Prefix):] {
		if !strings.ContainsRune(charset, c) {
			return false
		}
	}
	return true
}

// Exists checks if a token's storage directory exists on disk.
func Exists(dataDir string, t string) bool {
	dir := filepath.Join(dataDir, "files", t)
	info, err := os.Stat(dir)
	return err == nil && info.IsDir()
}

// Create generates a new token and creates its storage directory.
func Create(dataDir string) (string, error) {
	t, err := Generate()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(dataDir, "files", t)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	return t, nil
}

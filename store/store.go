package store

import (
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	git "github.com/go-git/go-git/v5"
)

type SearchResult struct {
	Path    string `json:"path"`
	Snippet string `json:"snippet"`
}

type Indexer interface {
	Index(path string, content string) error
	Remove(path string) error
	RemoveByPrefix(prefix string) error
	Search(query string, pathPrefix string) ([]SearchResult, error)
	Close() error
}

type Entry struct {
	Name  string `json:"name"`
	IsDir bool   `json:"is_dir"`
}

type TreeNode struct {
	Name     string      `json:"name"`
	Children []*TreeNode `json:"children,omitempty"`
}

var ErrQuotaExceeded = errors.New("quota exceeded")

type Store struct {
	basePath string
	index    Indexer
	mu       sync.Mutex
	locks    map[string]*sync.Mutex
	quota    int64
	usageMu  sync.Mutex
	usage    map[string]int64
	repoMu  sync.Mutex
	repos   map[string]*git.Repository
}

func New(basePath string, index Indexer) *Store {
	os.MkdirAll(basePath, 0755)
	return &Store{
		basePath: basePath,
		index:    index,
		locks:    make(map[string]*sync.Mutex),
		usage:    make(map[string]int64),
		repos:   make(map[string]*git.Repository),
	}
}

func (s *Store) SetQuota(bytes int64) {
	s.quota = bytes
}

func (s *Store) pathLock(path string) *sync.Mutex {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.locks[path]; !ok {
		s.locks[path] = &sync.Mutex{}
	}
	return s.locks[path]
}

func tokenFromPath(p string) string {
	parts := strings.SplitN(filepath.Clean(p), string(filepath.Separator), 2)
	return parts[0]
}

func (s *Store) getUsage(token string) int64 {
	s.usageMu.Lock()
	defer s.usageMu.Unlock()
	if _, ok := s.usage[token]; !ok {
		var total int64
		dir := filepath.Join(s.basePath, token)
		filepath.Walk(dir, func(_ string, info os.FileInfo, err error) error {
			if err == nil && !info.IsDir() {
				total += info.Size()
			}
			return nil
		})
		s.usage[token] = total
	}
	return s.usage[token]
}

func (s *Store) addUsage(token string, delta int64) {
	s.usageMu.Lock()
	defer s.usageMu.Unlock()
	s.usage[token] += delta
}

func (s *Store) checkQuota(token string, additional int64) error {
	if s.quota <= 0 {
		return nil
	}
	if s.getUsage(token)+additional > s.quota {
		return fmt.Errorf("%w: token %s limit %d MB", ErrQuotaExceeded, token, s.quota/(1<<20))
	}
	return nil
}

func (s *Store) resolve(p string) (string, error) {
	p = filepath.Clean(p)
	// Block access to .git directories
	for _, part := range strings.Split(filepath.ToSlash(p), "/") {
		if part == ".git" {
			return "", fmt.Errorf("invalid path: %s", p)
		}
	}
	full := filepath.Join(s.basePath, p)
	abs, err := filepath.Abs(full)
	if err != nil {
		return "", err
	}
	base, err := filepath.Abs(s.basePath)
	if err != nil {
		return "", err
	}
	if !strings.HasPrefix(abs, base) {
		return "", fmt.Errorf("invalid path: %s", p)
	}
	return abs, nil
}

// relativePath returns the path relative to basePath, using forward slashes.
func (s *Store) relativePath(full string) string {
	base, _ := filepath.Abs(s.basePath)
	rel, _ := filepath.Rel(base, full)
	return filepath.ToSlash(rel)
}

// writeInternal performs the core write logic (lock, quota, file, index) without git commit.
func (s *Store) writeInternal(path string, content []byte) (created bool, err error) {
	full, err := s.resolve(path)
	if err != nil {
		return false, err
	}

	token := tokenFromPath(path)

	lk := s.pathLock(full)
	lk.Lock()
	defer lk.Unlock()

	// Quota check: compute delta (new size - old size)
	var oldSize int64
	if info, statErr := os.Stat(full); statErr == nil {
		oldSize = info.Size()
	} else {
		created = true
	}
	delta := int64(len(content)) - oldSize
	if delta > 0 {
		if err := s.checkQuota(token, delta); err != nil {
			return false, err
		}
	}

	if err := os.MkdirAll(filepath.Dir(full), 0755); err != nil {
		return false, err
	}
	if err := os.WriteFile(full, content, 0644); err != nil {
		return false, err
	}

	s.addUsage(token, delta)

	if isText(content) {
		if err := s.index.Index(s.relativePath(full), string(content)); err != nil {
			log.Printf("index error on write %s: %v", s.relativePath(full), err)
		}
	}
	return created, nil
}

func (s *Store) Write(path string, content []byte) (created bool, err error) {
	created, err = s.writeInternal(path, content)
	if err != nil {
		return created, err
	}
	token, rel := tokenAndRel(path)
	if rel != "" {
		s.gitCommit(token, rel, "write")
	}
	return created, nil
}

func (s *Store) Read(path string) ([]byte, error) {
	full, err := s.resolve(path)
	if err != nil {
		return nil, err
	}
	return os.ReadFile(full)
}

func (s *Store) Delete(path string) error {
	full, err := s.resolve(path)
	if err != nil {
		return err
	}

	token := tokenFromPath(path)

	lk := s.pathLock(full)
	lk.Lock()
	defer lk.Unlock()

	info, err := os.Stat(full)
	if err != nil {
		return err
	}

	// Calculate size to reclaim
	var size int64
	if info.IsDir() {
		filepath.Walk(full, func(_ string, fi os.FileInfo, err error) error {
			if err == nil && !fi.IsDir() {
				size += fi.Size()
			}
			return nil
		})
		s.index.RemoveByPrefix(s.relativePath(full) + "/")
	} else {
		size = info.Size()
		s.index.Remove(s.relativePath(full))
	}

	isDir := info.IsDir()

	if err := os.RemoveAll(full); err != nil {
		return err
	}

	s.addUsage(token, -size)

	tok, rel := tokenAndRel(path)
	if rel != "" {
		if isDir {
			s.gitCommitAll(tok, fmt.Sprintf("delete %s/", rel))
		} else {
			s.gitCommit(tok, rel, "delete")
		}
	}
	return nil
}

func (s *Store) Append(path string, content []byte) error {
	full, err := s.resolve(path)
	if err != nil {
		return err
	}

	token := tokenFromPath(path)

	lk := s.pathLock(full)
	lk.Lock()
	defer lk.Unlock()

	appendSize := int64(len(content))
	if err := s.checkQuota(token, appendSize); err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(full), 0755); err != nil {
		return err
	}

	f, err := os.OpenFile(full, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err := f.Write(content); err != nil {
		return err
	}

	s.addUsage(token, appendSize)

	// Re-index full content
	data, err := os.ReadFile(full)
	if err == nil && isText(data) {
		if err := s.index.Index(s.relativePath(full), string(data)); err != nil {
			log.Printf("index error on append %s: %v", s.relativePath(full), err)
		}
	}

	tok, rel := tokenAndRel(path)
	if rel != "" {
		s.gitCommit(tok, rel, "append")
	}
	return nil
}

func (s *Store) List(path string) ([]Entry, error) {
	full, err := s.resolve(path)
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(full)
	if err != nil {
		return nil, err
	}

	result := make([]Entry, 0, len(entries))
	for _, e := range entries {
		if e.Name() == ".git" {
			continue
		}
		result = append(result, Entry{
			Name:  e.Name(),
			IsDir: e.IsDir(),
		})
	}
	return result, nil
}

func (s *Store) Tree(path string) (*TreeNode, error) {
	full, err := s.resolve(path)
	if err != nil {
		return nil, err
	}
	node, err := s.buildTree(full)
	if err != nil {
		return nil, err
	}
	node.Name = "."
	return node, nil
}

func (s *Store) buildTree(fullPath string) (*TreeNode, error) {
	info, err := os.Stat(fullPath)
	if err != nil {
		return nil, err
	}

	node := &TreeNode{Name: info.Name()}

	if info.IsDir() {
		entries, err := os.ReadDir(fullPath)
		if err != nil {
			return nil, err
		}
		for _, e := range entries {
			if e.Name() == ".git" {
				continue
			}
			child, err := s.buildTree(filepath.Join(fullPath, e.Name()))
			if err != nil {
				continue
			}
			if e.IsDir() {
				child.Name += "/"
			}
			node.Children = append(node.Children, child)
		}
	}

	return node, nil
}

func (s *Store) Search(query string, scopePath string) ([]SearchResult, error) {
	return s.index.Search(query, scopePath)
}

func (s *Store) History(path string, limit int) ([]HistoryEntry, error) {
	token, rel := tokenAndRel(path)
	if rel == "" {
		return nil, fmt.Errorf("path required")
	}
	return s.gitHistory(token, rel, limit)
}

func (s *Store) Diff(path string, commitHash string) (string, error) {
	token, rel := tokenAndRel(path)
	if rel == "" {
		return "", fmt.Errorf("path required")
	}
	return s.gitDiff(token, rel, commitHash)
}

func (s *Store) Revert(path string, commitHash string) error {
	token, rel := tokenAndRel(path)
	if rel == "" {
		return fmt.Errorf("path required")
	}
	content, err := s.gitGetFileAtCommit(token, rel, commitHash)
	if err != nil {
		return err
	}
	_, err = s.writeInternal(path, content)
	if err != nil {
		return err
	}
	s.gitCommit(token, rel, "revert")
	return nil
}

// isText returns true if content appears to be text (no null bytes in first 512 bytes).
func isText(content []byte) bool {
	if len(content) == 0 {
		return true
	}
	check := content
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

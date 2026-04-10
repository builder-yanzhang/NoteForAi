package store

import (
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	git "github.com/go-git/go-git/v5"
)

type SearchResult struct {
	Path    string   `json:"path"`
	Line    int      `json:"line,omitempty"`
	Match   string   `json:"match,omitempty"`
	Before  []string `json:"before,omitempty"`
	After   []string `json:"after,omitempty"`
	Snippet string   `json:"snippet,omitempty"`
}

type StatResult struct {
	Path     string `json:"path"`
	Size     int64  `json:"size"`
	Lines    int    `json:"lines,omitempty"`
	Modified string `json:"modified"`
	IsDir    bool   `json:"is_dir"`
}

type BulkReadResult struct {
	Path    string `json:"path"`
	Content string `json:"content,omitempty"`
	Error   string `json:"error,omitempty"`
}

type BulkWriteItem struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

type BulkWriteResult struct {
	Path    string `json:"path"`
	Created bool   `json:"created"`
	Error   string `json:"error,omitempty"`
}

type FrontmatterResult struct {
	Path  string            `json:"path"`
	Meta  map[string]string `json:"meta"`
	Body  string            `json:"body"`
}

type Indexer interface {
	Index(path string, content string) error
	Remove(path string) error
	RemoveByPrefix(prefix string) error
	Search(query string, pathPrefix string) ([]SearchResult, error)
	Close() error
}

type Entry struct {
	Name     string `json:"name"`
	IsDir    bool   `json:"is_dir"`
	Size     int64  `json:"size,omitempty"`
	Modified string `json:"modified,omitempty"`
}

type TreeNode struct {
	Name     string      `json:"name"`
	IsDir    bool        `json:"is_dir"`
	Size     int64       `json:"size,omitempty"`
	Modified string      `json:"modified,omitempty"`
	Children []*TreeNode `json:"children,omitempty"`
}

var ErrQuotaExceeded = errors.New("quota exceeded")
var ErrNotFound = errors.New("not found")

type Store struct {
	basePath string
	index    Indexer
	mu       sync.Mutex
	locks    map[string]*sync.Mutex
	quota    int64
	usageMu  sync.Mutex
	usage    map[string]int64
	repoMu   sync.Mutex
	repos    map[string]*git.Repository
	gitLocks map[string]*sync.Mutex // per-repo lock for git write operations
}

func New(basePath string, index Indexer) *Store {
	os.MkdirAll(basePath, 0755)
	return &Store{
		basePath: basePath,
		index:    index,
		locks:    make(map[string]*sync.Mutex),
		usage:    make(map[string]int64),
		repos:    make(map[string]*git.Repository),
		gitLocks: make(map[string]*sync.Mutex),
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

	// Calculate size to reclaim and collect file paths for git
	var size int64
	var deletedFiles []string // relative to token dir, for per-file git commits
	tok, rel := tokenAndRel(path)
	tokenBase := filepath.Join(s.basePath, tok)

	if info.IsDir() {
		filepath.Walk(full, func(p string, fi os.FileInfo, err error) error {
			if err == nil && !fi.IsDir() && !strings.Contains(p, ".git") {
				size += fi.Size()
				if r, relErr := filepath.Rel(tokenBase, p); relErr == nil && r != "." {
					deletedFiles = append(deletedFiles, filepath.ToSlash(r))
				}
			}
			return nil
		})
		s.index.RemoveByPrefix(s.relativePath(full) + "/")
	} else {
		size = info.Size()
		s.index.Remove(s.relativePath(full))
		if r, relErr := filepath.Rel(tokenBase, full); relErr == nil && r != "." {
			deletedFiles = append(deletedFiles, filepath.ToSlash(r))
		}
	}

	if err := os.RemoveAll(full); err != nil {
		return err
	}

	s.addUsage(token, -size)

	if rel != "" && len(deletedFiles) > 0 {
		s.gitCommitEach(tok, deletedFiles, "delete")
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
	if _, err := f.Write(content); err != nil {
		f.Close()
		return err
	}
	f.Close()

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
		entry := Entry{Name: e.Name(), IsDir: e.IsDir()}
		if info, err := e.Info(); err == nil {
			entry.Size = info.Size()
			entry.Modified = info.ModTime().UTC().Format("2006-01-02T15:04:05Z")
		}
		result = append(result, entry)
	}
	return result, nil
}

func (s *Store) Tree(path string) (*TreeNode, error) {
	return s.TreeDepth(path, -1)
}

// TreeDepth returns the directory tree up to maxDepth levels (−1 = unlimited).
func (s *Store) TreeDepth(path string, maxDepth int) (*TreeNode, error) {
	full, err := s.resolve(path)
	if err != nil {
		return nil, err
	}
	node, err := s.buildTree(full, 0, maxDepth)
	if err != nil {
		return nil, err
	}
	node.Name = "."
	return node, nil
}

func (s *Store) buildTree(fullPath string, depth, maxDepth int) (*TreeNode, error) {
	info, err := os.Stat(fullPath)
	if err != nil {
		return nil, err
	}

	node := &TreeNode{
		Name:     info.Name(),
		IsDir:    info.IsDir(),
		Modified: info.ModTime().UTC().Format("2006-01-02T15:04:05Z"),
	}

	if info.IsDir() {
		if maxDepth >= 0 && depth >= maxDepth {
			return node, nil // stop recursing
		}
		entries, err := os.ReadDir(fullPath)
		if err != nil {
			return nil, err
		}
		for _, e := range entries {
			if e.Name() == ".git" {
				continue
			}
			child, err := s.buildTree(filepath.Join(fullPath, e.Name()), depth+1, maxDepth)
			if err != nil {
				continue
			}
			if e.IsDir() {
				child.Name += "/"
			}
			node.Children = append(node.Children, child)
		}
	} else {
		node.Size = info.Size()
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
	// Auto-detect: if path resolves to a directory, show folder history
	full, err := s.resolve(path)
	if err == nil {
		if info, statErr := os.Stat(full); statErr == nil && info.IsDir() {
			return s.gitFolderHistory(token, rel, limit)
		}
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

// Deleted returns files that have been deleted for a given token.
func (s *Store) Deleted(token string, limit int) ([]DeletedEntry, error) {
	return s.gitDeleted(token, limit)
}

// BasePath returns the store's base path.
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

// DestroyToken clears all index entries and in-memory caches for a token.
func (s *Store) DestroyToken(token string) {
	if err := s.index.RemoveByPrefix(token + "/"); err != nil {
		log.Printf("index cleanup error for %s: %v", token, err)
	}

	s.usageMu.Lock()
	delete(s.usage, token)
	s.usageMu.Unlock()

	s.mu.Lock()
	for k := range s.locks {
		if strings.HasPrefix(k, filepath.Join(s.basePath, token)) {
			delete(s.locks, k)
		}
	}
	s.mu.Unlock()

	s.repoMu.Lock()
	delete(s.repos, token)
	delete(s.gitLocks, token)
	s.repoMu.Unlock()
}

// Edit replaces occurrences of oldStr with newStr in a file.
// If replaceAll is false, oldStr must appear exactly once; if true, all occurrences are replaced.
func (s *Store) Edit(path string, oldStr, newStr string, replaceAll bool) error {
	data, err := s.Read(path)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("%w: %s", ErrNotFound, path)
		}
		return err
	}
	content := string(data)
	count := strings.Count(content, oldStr)
	if count == 0 {
		return fmt.Errorf("old_string not found in %s", path)
	}
	if !replaceAll && count > 1 {
		return fmt.Errorf("ambiguous: found %d matches for old_string, add more surrounding context to make it unique (or set replace_all=true)", count)
	}
	var newContent string
	if replaceAll {
		newContent = strings.ReplaceAll(content, oldStr, newStr)
	} else {
		newContent = strings.Replace(content, oldStr, newStr, 1)
	}
	_, err = s.Write(path, []byte(newContent))
	return err
}

// Stat returns metadata for a file or directory.
func (s *Store) Stat(path string) (*StatResult, error) {
	full, err := s.resolve(path)
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(full)
	if err != nil {
		return nil, err
	}
	result := &StatResult{
		Path:     path,
		Size:     info.Size(),
		Modified: info.ModTime().UTC().Format("2006-01-02T15:04:05Z"),
		IsDir:    info.IsDir(),
	}
	if !info.IsDir() {
		if data, err := os.ReadFile(full); err == nil {
			result.Lines = strings.Count(string(data), "\n") + 1
		}
	}
	return result, nil
}

// RegexSearch searches files under prefix using a regular expression.
// contextLines controls how many lines before/after each match to include.
// filesOnly returns only file paths (no line details).
func (s *Store) RegexSearch(token, pattern, subPath string, contextLines, limit int, filesOnly bool) ([]SearchResult, error) {
	re, err := regexp.Compile(pattern)
	if err != nil {
		return nil, fmt.Errorf("invalid regex: %v", err)
	}
	if limit <= 0 {
		limit = 50
	}

	baseDir := filepath.Join(s.basePath, token)
	if subPath != "" {
		baseDir = filepath.Join(baseDir, subPath)
	}

	var results []SearchResult
	seenFiles := map[string]bool{}

	_ = filepath.Walk(baseDir, func(fpath string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		if strings.Contains(fpath, ".git") {
			return nil
		}
		if !filesOnly && len(results) >= limit {
			return nil
		}

		data, readErr := os.ReadFile(fpath)
		if readErr != nil || !isText(data) {
			return nil
		}

		lines := strings.Split(string(data), "\n")
		relPath := strings.TrimPrefix(s.relativePath(fpath), token+"/")

		for i, line := range lines {
			if !re.MatchString(line) {
				continue
			}
			if filesOnly {
				if !seenFiles[relPath] {
					seenFiles[relPath] = true
					results = append(results, SearchResult{Path: relPath})
				}
				return nil
			}

			var before, after []string
			for j := i - contextLines; j < i; j++ {
				if j >= 0 {
					before = append(before, lines[j])
				}
			}
			for j := i + 1; j <= i+contextLines && j < len(lines); j++ {
				after = append(after, lines[j])
			}
			results = append(results, SearchResult{
				Path:   relPath,
				Line:   i + 1,
				Match:  line,
				Before: before,
				After:  after,
			})
			if len(results) >= limit {
				return nil
			}
		}
		return nil
	})

	return results, nil
}

// Move moves a file from src to dst within the same token space.
// Both paths must include the token prefix (e.g. "nfa_xxx/a.md" → "nfa_xxx/b.md").
func (s *Store) Move(src, dst string) error {
	srcToken := tokenFromPath(src)
	dstToken := tokenFromPath(dst)
	if srcToken != dstToken {
		return fmt.Errorf("cannot move across tokens")
	}

	srcFull, err := s.resolve(src)
	if err != nil {
		return err
	}
	info, err := os.Stat(srcFull)
	if err != nil {
		return fmt.Errorf("%w: %s", ErrNotFound, src)
	}
	if info.IsDir() {
		return fmt.Errorf("moving directories is not supported; move files individually")
	}

	data, err := os.ReadFile(srcFull)
	if err != nil {
		return err
	}

	// Write destination (quota check, index, file)
	if _, err := s.writeInternal(dst, data); err != nil {
		return err
	}

	// Remove source file + update index/usage
	dstFull, _ := s.resolve(dst)
	_ = dstFull

	lk := s.pathLock(srcFull)
	lk.Lock()
	s.index.Remove(s.relativePath(srcFull))
	os.Remove(srcFull)
	s.addUsage(srcToken, -info.Size())
	lk.Unlock()

	// Git: commit destination (new file)
	tok, dstRel := tokenAndRel(dst)
	if dstRel != "" {
		s.gitCommit(tok, dstRel, "move from "+tokenAndRelPath(src))
	}
	// Git: commit source deletion
	_, srcRel := tokenAndRel(src)
	if srcRel != "" {
		s.gitCommitEach(tok, []string{srcRel}, "delete")
	}
	return nil
}

// BulkWrite writes multiple files.
//
// Non-atomic (default): each file is written and committed independently;
// errors are collected per-file and processing continues.
//
// Atomic: all paths are validated and originals saved first; if any write
// fails, previously written files are rolled back; on success all files
// share a single git commit.
func (s *Store) BulkWrite(token string, items []BulkWriteItem, atomic bool) ([]BulkWriteResult, error) {
	results := make([]BulkWriteResult, len(items))

	if !atomic {
		for i, item := range items {
			path := filepath.Join(token, item.Path)
			created, err := s.writeInternal(path, []byte(item.Content))
			if err != nil {
				results[i] = BulkWriteResult{Path: item.Path, Error: err.Error()}
				continue
			}
			results[i] = BulkWriteResult{Path: item.Path, Created: created}
			_, rel := tokenAndRel(path)
			if rel != "" {
				s.gitCommit(token, rel, "write")
			}
		}
		return results, nil
	}

	// Atomic: Phase 1 — validate all paths and save originals before any write.
	type origEntry struct {
		storePath string
		fullPath  string
		data      []byte // nil if file did not exist
		existed   bool
	}
	originals := make([]origEntry, len(items))

	for i, item := range items {
		path := filepath.Join(token, item.Path)
		full, err := s.resolve(path)
		if err != nil {
			results[i] = BulkWriteResult{Path: item.Path, Error: err.Error()}
			return results, fmt.Errorf("atomic bulk_write: path validation failed at %q: %w", item.Path, err)
		}
		var orig []byte
		var existed bool
		if data, readErr := os.ReadFile(full); readErr == nil {
			orig = data
			existed = true
		}
		originals[i] = origEntry{storePath: path, fullPath: full, data: orig, existed: existed}
	}

	// Phase 2 — write all files using writeInternal (no git).
	var relPaths []string
	failAt := -1

	for i, item := range items {
		created, err := s.writeInternal(originals[i].storePath, []byte(item.Content))
		if err != nil {
			results[i] = BulkWriteResult{Path: item.Path, Error: err.Error()}
			failAt = i
			break
		}
		results[i] = BulkWriteResult{Path: item.Path, Created: created}
		_, rel := tokenAndRel(originals[i].storePath)
		if rel != "" {
			relPaths = append(relPaths, rel)
		}
	}

	if failAt >= 0 {
		// Phase 3 — rollback files 0..failAt-1.
		for i := 0; i < failAt; i++ {
			orig := originals[i]
			if orig.existed {
				// Restore previous content (no git commit).
				s.writeInternal(orig.storePath, orig.data)
			} else {
				// Delete newly-created file.
				s.rollbackNewFile(tokenFromPath(orig.storePath), orig.fullPath)
			}
		}
		return results, fmt.Errorf("atomic bulk_write failed at %q (index %d), rolled back %d file(s)",
			items[failAt].Path, failAt, failAt)
	}

	// Phase 4 — single git commit for all files.
	if len(relPaths) > 0 {
		s.gitCommitAll(token, relPaths, "bulk_write")
	}
	return results, nil
}

// rollbackNewFile removes a newly-created file (no previous version) during
// an atomic bulk_write rollback. Updates index and usage without git.
func (s *Store) rollbackNewFile(token, full string) {
	lk := s.pathLock(full)
	lk.Lock()
	defer lk.Unlock()
	info, err := os.Stat(full)
	if err != nil || info.IsDir() {
		return
	}
	s.index.Remove(s.relativePath(full))
	os.Remove(full)
	s.addUsage(token, -info.Size())
}

// headingMatches returns true if line matches the target heading.
// Supports exact match (e.g. "## A") or text-only match (e.g. "A" matches "## A").
func headingMatches(line, target string) bool {
	line = strings.TrimRight(line, " \t")
	target = strings.TrimSpace(target)
	if line == target {
		return true
	}
	// Strip leading # characters from the line and compare plain text
	stripped := strings.TrimLeft(line, "#")
	stripped = strings.TrimSpace(stripped)
	return stripped == target
}

// AppendUnderHeading inserts content immediately after the first matching heading.
// Matching is flexible: "## A" and "A" both match the line "## A".
// Returns ErrNotFound if the heading is not present in the file.
// Creates the file (with heading + content) if it doesn't exist.
func (s *Store) AppendUnderHeading(path, heading string, content []byte) error {
	existing, err := s.Read(path)
	if err != nil {
		if os.IsNotExist(err) {
			newContent := strings.TrimSpace(heading) + "\n" + string(content) + "\n"
			_, err = s.Write(path, []byte(newContent))
			return err
		}
		return err
	}

	lines := strings.Split(string(existing), "\n")
	insertAt := -1
	for i, line := range lines {
		if headingMatches(line, heading) {
			insertAt = i + 1
			break
		}
	}

	if insertAt == -1 {
		return fmt.Errorf("%w: heading %q not found in %s", ErrNotFound, heading, path)
	}

	// Insert content after the heading line
	newLines := make([]string, 0, len(lines)+2)
	newLines = append(newLines, lines[:insertAt]...)
	newLines = append(newLines, string(content))
	newLines = append(newLines, lines[insertAt:]...)
	_, err = s.Write(path, []byte(strings.Join(newLines, "\n")))
	return err
}

// ReadFrontmatter parses YAML front matter (--- delimited) from a Markdown file.
// Returns the metadata map and the body (content after front matter).
func (s *Store) ReadFrontmatter(path string) (*FrontmatterResult, error) {
	data, err := s.Read(path)
	if err != nil {
		return nil, err
	}

	content := string(data)
	meta := map[string]string{}
	body := content

	if strings.HasPrefix(content, "---\n") {
		end := strings.Index(content[4:], "\n---")
		if end >= 0 {
			fmBlock := content[4 : 4+end]
			body = strings.TrimPrefix(content[4+end+4:], "\n")
			for _, line := range strings.Split(fmBlock, "\n") {
				if idx := strings.Index(line, ":"); idx > 0 {
					k := strings.TrimSpace(line[:idx])
					v := strings.TrimSpace(line[idx+1:])
					// Strip optional surrounding quotes
					v = strings.Trim(v, `"'`)
					if k != "" {
						meta[k] = v
					}
				}
			}
		}
	}

	_, rel := tokenAndRel(path)
	return &FrontmatterResult{Path: rel, Meta: meta, Body: body}, nil
}

// Reindex fully rebuilds the search index for a token.
// It first removes ALL Bleve documents under the token prefix (clearing orphans
// whose disk files no longer exist), then re-indexes every file on disk.
func (s *Store) Reindex(token string) (int, error) {
	// Step 1: purge every index entry for this token, including orphans
	if err := s.index.RemoveByPrefix(token + "/"); err != nil {
		log.Printf("reindex: remove prefix error for %s: %v", token, err)
	}

	// Step 2: re-index all files present on disk
	dir := filepath.Join(s.basePath, token)
	count := 0
	var walkErr error
	_ = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || strings.Contains(path, ".git") {
			return nil
		}
		data, readErr := os.ReadFile(path)
		if readErr != nil || !isText(data) {
			return nil
		}
		rel := s.relativePath(path)
		if indexErr := s.index.Index(rel, string(data)); indexErr != nil {
			walkErr = indexErr
			log.Printf("reindex error for %s: %v", rel, indexErr)
		} else {
			count++
		}
		return nil
	})
	return count, walkErr
}

// tokenAndRelPath returns only the relative part of a store path.
func tokenAndRelPath(path string) string {
	_, rel := tokenAndRel(path)
	return rel
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

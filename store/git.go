package store

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
)

// HistoryEntry represents a single git commit for a file.
type HistoryEntry struct {
	Hash    string `json:"hash"`
	Date    string `json:"date"`
	Message string `json:"message"`
}

// DeletedEntry represents a file that was deleted and can be restored.
type DeletedEntry struct {
	Path        string `json:"path"`
	DeleteHash  string `json:"delete_hash"`
	RestoreHash string `json:"restore_hash"`
	Date        string `json:"date"`
}

var authorInfo = &object.Signature{
	Name:  "NoteForAI",
	Email: "noreply@noteforai",
}

func newAuthor() *object.Signature {
	return &object.Signature{
		Name:  authorInfo.Name,
		Email: authorInfo.Email,
		When:  time.Now(),
	}
}

// getRepo returns the git repo for a token, lazily initializing if needed.
func (s *Store) getRepo(token string) *git.Repository {
	s.repoMu.Lock()
	defer s.repoMu.Unlock()

	if repo, ok := s.repos[token]; ok {
		return repo
	}

	repoPath := filepath.Join(s.basePath, token)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		repo, err = git.PlainInit(repoPath, false)
		if err != nil {
			log.Printf("git init error for %s: %v", token, err)
			return nil
		}
	}
	s.repos[token] = repo
	return repo
}

// gitWriteLock returns a per-repo mutex for serializing git write operations.
// This prevents concurrent Add+Commit from corrupting the staging area.
func (s *Store) gitWriteLock(token string) *sync.Mutex {
	s.repoMu.Lock()
	defer s.repoMu.Unlock()
	if _, ok := s.gitLocks[token]; !ok {
		s.gitLocks[token] = &sync.Mutex{}
	}
	return s.gitLocks[token]
}

// tokenAndRel splits a store path like "nfa_xxx/dir/file" into token and relative path.
func tokenAndRel(path string) (token string, rel string) {
	clean := filepath.Clean(path)
	parts := strings.SplitN(filepath.ToSlash(clean), "/", 2)
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return parts[0], ""
}

// gitCommit stages the file at relPath and commits with a per-repo lock.
func (s *Store) gitCommit(token, relPath, action string) {
	lk := s.gitWriteLock(token)
	lk.Lock()
	defer lk.Unlock()

	repo := s.getRepo(token)
	if repo == nil {
		return
	}
	w, err := repo.Worktree()
	if err != nil {
		log.Printf("git worktree error: %v", err)
		return
	}
	if _, err := w.Add(relPath); err != nil {
		log.Printf("git add error for %s: %v", relPath, err)
		return
	}
	_, err = w.Commit(fmt.Sprintf("%s %s", action, relPath), &git.CommitOptions{
		Author: newAuthor(),
	})
	if err != nil {
		log.Printf("git commit error: %v", err)
	}
}

// gitCommitEach stages and commits each file individually under the per-repo lock.
// Used for directory deletes so each file gets its own "delete path" commit.
func (s *Store) gitCommitEach(token string, relPaths []string, action string) {
	lk := s.gitWriteLock(token)
	lk.Lock()
	defer lk.Unlock()

	repo := s.getRepo(token)
	if repo == nil {
		return
	}
	w, err := repo.Worktree()
	if err != nil {
		log.Printf("git worktree error: %v", err)
		return
	}
	for _, p := range relPaths {
		if _, err := w.Add(p); err != nil {
			log.Printf("git add error for %s: %v", p, err)
			continue
		}
		_, err = w.Commit(fmt.Sprintf("%s %s", action, p), &git.CommitOptions{
			Author: newAuthor(),
		})
		if err != nil {
			log.Printf("git commit error for %s: %v", p, err)
		}
	}
}

// gitHistory returns commit history for a file.
func (s *Store) gitHistory(token, relPath string, limit int) ([]HistoryEntry, error) {
	repo := s.getRepo(token)
	if repo == nil {
		return nil, fmt.Errorf("git not initialized")
	}
	iter, err := repo.Log(&git.LogOptions{FileName: &relPath})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var entries []HistoryEntry
	_ = iter.ForEach(func(c *object.Commit) error {
		if len(entries) >= limit {
			return fmt.Errorf("stop")
		}
		entries = append(entries, HistoryEntry{
			Hash:    c.Hash.String(),
			Date:    c.Author.When.Format(time.RFC3339),
			Message: strings.TrimSpace(c.Message),
		})
		return nil
	})
	return entries, nil
}

// gitFolderHistory returns commit history for all files under a directory prefix.
// Parses commit messages (format: "{action} {relPath}") to filter by prefix.
func (s *Store) gitFolderHistory(token, dirPrefix string, limit int) ([]HistoryEntry, error) {
	repo := s.getRepo(token)
	if repo == nil {
		return nil, fmt.Errorf("git not initialized")
	}
	iter, err := repo.Log(&git.LogOptions{})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	prefix := dirPrefix + "/"
	var entries []HistoryEntry
	_ = iter.ForEach(func(c *object.Commit) error {
		if len(entries) >= limit {
			return fmt.Errorf("stop")
		}
		msg := strings.TrimSpace(c.Message)
		// Extract path from "{action} {relPath}" format
		idx := strings.Index(msg, " ")
		if idx == -1 {
			return nil
		}
		commitPath := msg[idx+1:]
		if strings.HasPrefix(commitPath, prefix) {
			entries = append(entries, HistoryEntry{
				Hash:    c.Hash.String(),
				Date:    c.Author.When.Format(time.RFC3339),
				Message: msg,
			})
		}
		return nil
	})
	return entries, nil
}

// gitDiff returns the unified diff of a specific commit for a file.
func (s *Store) gitDiff(token, relPath, commitHash string) (string, error) {
	repo := s.getRepo(token)
	if repo == nil {
		return "", fmt.Errorf("git not initialized")
	}
	commit, err := repo.CommitObject(plumbing.NewHash(commitHash))
	if err != nil {
		return "", fmt.Errorf("commit not found: %w", err)
	}

	var parentTree *object.Tree
	if commit.NumParents() > 0 {
		parent, err := commit.Parent(0)
		if err == nil {
			parentTree, _ = parent.Tree()
		}
	}

	commitTree, err := commit.Tree()
	if err != nil {
		return "", err
	}

	changes, err := object.DiffTree(parentTree, commitTree)
	if err != nil {
		return "", err
	}

	for _, change := range changes {
		if change.From.Name == relPath || change.To.Name == relPath {
			patch, err := change.Patch()
			if err != nil {
				return "", err
			}
			return patch.String(), nil
		}
	}
	return "", fmt.Errorf("file %s not found in commit %s", relPath, commitHash[:8])
}

// gitGetFileAtCommit reads file content from a specific commit.
func (s *Store) gitGetFileAtCommit(token, relPath, commitHash string) ([]byte, error) {
	repo := s.getRepo(token)
	if repo == nil {
		return nil, fmt.Errorf("git not initialized")
	}
	commit, err := repo.CommitObject(plumbing.NewHash(commitHash))
	if err != nil {
		return nil, fmt.Errorf("commit not found: %w", err)
	}
	tree, err := commit.Tree()
	if err != nil {
		return nil, err
	}
	file, err := tree.File(relPath)
	if err != nil {
		return nil, fmt.Errorf("file %s not found at commit %s: %w", relPath, commitHash[:8], err)
	}
	content, err := file.Contents()
	if err != nil {
		return nil, err
	}
	return []byte(content), nil
}

// gitDeleted scans git log for delete commits and returns files that are still deleted.
// For directory-level delete commits (legacy), it expands into individual files from the parent tree.
func (s *Store) gitDeleted(token string, limit int) ([]DeletedEntry, error) {
	repo := s.getRepo(token)
	if repo == nil {
		return nil, fmt.Errorf("git not initialized")
	}
	iter, err := repo.Log(&git.LogOptions{})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var entries []DeletedEntry
	seen := make(map[string]bool)
	basePath := filepath.Join(s.basePath, token)

	_ = iter.ForEach(func(c *object.Commit) error {
		if len(entries) >= limit {
			return fmt.Errorf("stop")
		}
		msg := strings.TrimSpace(c.Message)
		if !strings.HasPrefix(msg, "delete ") {
			return nil
		}
		rawPath := strings.TrimPrefix(msg, "delete ")
		isDir := strings.HasSuffix(rawPath, "/")
		relPath := strings.TrimSuffix(rawPath, "/")

		dateStr := c.Author.When.Format(time.RFC3339)
		deleteHash := c.Hash.String()
		restoreHash := ""
		if c.NumParents() > 0 {
			if parent, err := c.Parent(0); err == nil {
				restoreHash = parent.Hash.String()
			}
		}

		if isDir && restoreHash != "" {
			// Directory delete: expand into individual files from parent tree
			parentCommit, err := repo.CommitObject(plumbing.NewHash(restoreHash))
			if err != nil {
				return nil
			}
			parentTree, err := parentCommit.Tree()
			if err != nil {
				return nil
			}
			// Walk the subtree to find all files under the deleted directory
			subtree, err := parentTree.Tree(relPath)
			if err != nil {
				return nil
			}
			subtree.Files().ForEach(func(f *object.File) error {
				if len(entries) >= limit {
					return fmt.Errorf("stop")
				}
				filePath := relPath + "/" + f.Name
				if seen[filePath] {
					return nil
				}
				seen[filePath] = true
				fullPath := filepath.Join(basePath, filePath)
				if _, err := os.Stat(fullPath); err == nil {
					return nil // file exists again, skip
				}
				entries = append(entries, DeletedEntry{
					Path:        filePath,
					DeleteHash:  deleteHash,
					RestoreHash: restoreHash,
					Date:        dateStr,
				})
				return nil
			})
		} else {
			// Single file delete
			if seen[relPath] {
				return nil
			}
			seen[relPath] = true
			fullPath := filepath.Join(basePath, relPath)
			if _, err := os.Stat(fullPath); err == nil {
				return nil
			}
			entries = append(entries, DeletedEntry{
				Path:        relPath,
				DeleteHash:  deleteHash,
				RestoreHash: restoreHash,
				Date:        dateStr,
			})
		}
		return nil
	})
	return entries, nil
}

// gitCommitAll stages all relPaths in a single commit under the per-repo lock.
// Used for atomic bulk_write so all files share one git commit.
func (s *Store) gitCommitAll(token string, relPaths []string, action string) {
	lk := s.gitWriteLock(token)
	lk.Lock()
	defer lk.Unlock()

	repo := s.getRepo(token)
	if repo == nil {
		return
	}
	w, err := repo.Worktree()
	if err != nil {
		log.Printf("git worktree error: %v", err)
		return
	}
	for _, p := range relPaths {
		if _, err := w.Add(p); err != nil {
			log.Printf("git add error for %s: %v", p, err)
		}
	}
	msg := fmt.Sprintf("%s [%d files]", action, len(relPaths))
	if _, err := w.Commit(msg, &git.CommitOptions{Author: newAuthor()}); err != nil {
		log.Printf("git commit error: %v", err)
	}
}

// InitRepo initializes a git repo for a token directory (called from token.Create).
func InitRepo(basePath, token string) {
	repoPath := filepath.Join(basePath, token)
	if _, err := git.PlainInit(repoPath, false); err != nil {
		log.Printf("git init error for %s: %v", token, err)
	}
}

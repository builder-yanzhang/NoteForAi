package store

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"
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

var author = &object.Signature{
	Name:  "NoteForAI",
	Email: "noreply@noteforai",
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

// tokenAndRel splits a store path like "nfa_xxx/dir/file" into token and relative path.
func tokenAndRel(path string) (token string, rel string) {
	clean := filepath.Clean(path)
	parts := strings.SplitN(filepath.ToSlash(clean), "/", 2)
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return parts[0], ""
}

// gitCommit stages the file at relPath (relative to token dir) and commits.
func (s *Store) gitCommit(token, relPath, action string) {
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
		Author: &object.Signature{
			Name:  author.Name,
			Email: author.Email,
			When:  time.Now(),
		},
	})
	if err != nil {
		log.Printf("git commit error: %v", err)
	}
}

// gitCommitAll stages all changes and commits (used for directory deletes).
func (s *Store) gitCommitAll(token, message string) {
	repo := s.getRepo(token)
	if repo == nil {
		return
	}
	w, err := repo.Worktree()
	if err != nil {
		log.Printf("git worktree error: %v", err)
		return
	}
	if _, err := w.Add("."); err != nil {
		log.Printf("git add all error: %v", err)
		return
	}
	_, err = w.Commit(message, &git.CommitOptions{
		Author: &object.Signature{
			Name:  author.Name,
			Email: author.Email,
			When:  time.Now(),
		},
	})
	if err != nil {
		log.Printf("git commit error: %v", err)
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

// InitRepo initializes a git repo for a token directory (called from token.Create).
func InitRepo(basePath, token string) {
	repoPath := filepath.Join(basePath, token)
	if _, err := git.PlainInit(repoPath, false); err != nil {
		log.Printf("git init error for %s: %v", token, err)
	}
}


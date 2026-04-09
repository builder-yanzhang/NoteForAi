package index

import (
	"strings"

	"noteforai/store"

	"github.com/blevesearch/bleve/v2"
	_ "github.com/blevesearch/bleve/v2/analysis/lang/cjk"
	"github.com/blevesearch/bleve/v2/mapping"
	"github.com/blevesearch/bleve/v2/search"
)

type BleveIndex struct {
	idx bleve.Index
}

type doc struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

func NewBleve(indexPath string) (*BleveIndex, error) {
	idx, err := bleve.Open(indexPath)
	if err != nil {
		m := buildMapping()
		idx, err = bleve.New(indexPath, m)
		if err != nil {
			return nil, err
		}
	}
	return &BleveIndex{idx: idx}, nil
}

func buildMapping() mapping.IndexMapping {
	im := bleve.NewIndexMapping()

	dm := bleve.NewDocumentMapping()

	content := bleve.NewTextFieldMapping()
	content.Store = true
	content.IncludeTermVectors = true
	content.Analyzer = "cjk"
	dm.AddFieldMappingsAt("content", content)

	path := bleve.NewKeywordFieldMapping()
	path.Store = true
	dm.AddFieldMappingsAt("path", path)

	im.DefaultMapping = dm
	return im
}

func (b *BleveIndex) Index(path string, content string) error {
	return b.idx.Index(path, doc{Path: path, Content: content})
}

func (b *BleveIndex) Remove(path string) error {
	return b.idx.Delete(path)
}

func (b *BleveIndex) RemoveByPrefix(prefix string) error {
	q := bleve.NewPrefixQuery(prefix)
	q.SetField("path")
	req := bleve.NewSearchRequest(q)
	req.Size = 10000
	req.Fields = []string{"path"}

	res, err := b.idx.Search(req)
	if err != nil {
		return err
	}

	batch := b.idx.NewBatch()
	for _, hit := range res.Hits {
		batch.Delete(hit.ID)
	}
	return b.idx.Batch(batch)
}

func (b *BleveIndex) Search(query string, pathPrefix string) ([]store.SearchResult, error) {
	q := bleve.NewMatchQuery(query)
	q.SetField("content")

	var searchReq *bleve.SearchRequest

	if pathPrefix != "" {
		pq := bleve.NewPrefixQuery(pathPrefix)
		pq.SetField("path")
		searchReq = bleve.NewSearchRequest(bleve.NewConjunctionQuery(q, pq))
	} else {
		searchReq = bleve.NewSearchRequest(q)
	}

	searchReq.Highlight = bleve.NewHighlightWithStyle("html")
	searchReq.Fields = []string{"path"}
	searchReq.Size = 20

	res, err := b.idx.Search(searchReq)
	if err != nil {
		return nil, err
	}

	items := make([]store.SearchResult, 0, len(res.Hits))
	for _, hit := range res.Hits {
		snippet := extractSnippet(hit)
		items = append(items, store.SearchResult{
			Path:    hit.ID,
			Snippet: snippet,
		})
	}
	return items, nil
}

func extractSnippet(hit *search.DocumentMatch) string {
	if fragments, ok := hit.Fragments["content"]; ok && len(fragments) > 0 {
		// Strip HTML highlight tags for clean output
		s := fragments[0]
		s = strings.ReplaceAll(s, "<mark>", "")
		s = strings.ReplaceAll(s, "</mark>", "")
		return s
	}
	return ""
}

func (b *BleveIndex) Close() error {
	return b.idx.Close()
}

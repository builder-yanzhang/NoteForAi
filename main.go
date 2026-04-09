package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"noteforai/api"
	"noteforai/index"
	"noteforai/store"
	"noteforai/token"

	mcpserver "github.com/mark3labs/mcp-go/server"
)

func main() {
	dataDir := env("DATA_DIR", "./data")
	port := env("PORT", "8080")

	idx, err := index.NewBleve(dataDir + "/index")
	if err != nil {
		log.Fatal(err)
	}
	defer idx.Close()

	s := store.New(dataDir+"/files", idx)

	if qm := env("QUOTA_MB", "0"); qm != "0" {
		if mb, err := strconv.ParseInt(qm, 10, 64); err == nil && mb > 0 {
			s.SetQuota(mb * 1024 * 1024)
			log.Printf("Per-token quota: %d MB", mb)
		}
	}

	trashDays := 30
	if td := env("TRASH_DAYS", "30"); td != "30" {
		if d, err := strconv.Atoi(td); err == nil && d >= 0 {
			trashDays = d
		}
	}
	s.StartTrashCleaner(trashDays)
	log.Printf("Trash cleaner: %d day retention", trashDays)

	mode := "serve"
	if len(os.Args) > 1 {
		mode = os.Args[1]
	}

	switch mode {
	case "serve":
		srv := api.NewHTTPServer(s, dataDir)
		log.Printf("NoteForAI HTTP server on :%s", port)
		log.Fatal(http.ListenAndServe(":"+port, srv))

	case "mcp":
		if len(os.Args) < 3 {
			fmt.Fprintf(os.Stderr, "Usage: noteforai mcp <token>\n")
			os.Exit(1)
		}
		tok := os.Args[2]
		if !token.IsValid(tok) {
			log.Fatal("invalid token format")
		}
		if !token.Exists(dataDir, tok) {
			log.Fatal("token not found, create one via POST /create_token first")
		}

		srv := api.NewMCPServer(s, tok)
		if err := mcpserver.ServeStdio(srv); err != nil {
			log.Fatal(err)
		}

	default:
		fmt.Fprintf(os.Stderr, "Usage: noteforai [serve|mcp <token>]\n")
		os.Exit(1)
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

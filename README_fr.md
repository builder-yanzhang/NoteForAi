# NoteForAI

[English](README.md) · [简体中文](README_zh-CN.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Español](README_es.md) · [Français](README_fr.md) · [Deutsch](README_de.md) · [Português](README_pt-BR.md) · [Русский](README_ru.md)

**Donnez à votre IA un carnet qui n'oublie jamais.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![MCP](https://img.shields.io/badge/MCP-Compatible-brightgreen)](https://modelcontextprotocol.io)
[![Auto-hébergeable](https://img.shields.io/badge/Auto--hébergeable-✓-orange)]()

> **Essayez gratuitement** → [noteforai.com](https://noteforai.com) · Sans inscription, obtenez un Token en un clic.

---

![Page d'accueil NoteForAI](docs/images/hero.png)

---

## Le problème

Chaque conversation IA repart de zéro. Votre IA oublie vos préférences, perd le contexte du projet et vous fait tout répéter — à chaque fois.

## La solution

NoteForAI offre à n'importe quelle IA un carnet de notes persistant et structuré. Fonctionne entre les conversations, les outils et les appareils.

![Tableau de bord](docs/images/dashboard.png)

---

## Démarrage rapide — 30 secondes

```bash
# 1. Obtenez votre Token
TOKEN=$(curl -s -X POST https://noteforai.com/create_token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Enregistrez des informations vous concernant
curl -X POST "https://noteforai.com/$TOKEN/write" \
  -H 'Content-Type: application/json' \
  -d '{"path":"moi/profil.md","content":"# À propos de moi\n\nRôle : Ingénieur backend\nPréférences : Go, code propre"}'

# 3. Votre IA se souvient maintenant de vous ✓
```

Collez ceci dans le prompt système de votre IA（remplacez `YOUR_TOKEN`）：

```
Vous disposez d'un système de mémoire persistante NoteForAI. Utilisez-le pour mémoriser tout sur l'utilisateur.
API : https://noteforai.com/YOUR_TOKEN/
Appel : POST + JSON body

Directives :
1. En début de conversation, exécutez read("moi/profil.md") pour récupérer le contexte
2. Enregistrez activement les informations utiles（préférences, avancement de projets, décisions importantes）
3. Utilisez l'extension .md, organisez par répertoires thématiques
```

---

## Intégration MCP（Recommandé）

### Claude Desktop / Claude Code

**Service hébergé** — Streamable HTTP, sans installation：

```json
{
  "mcpServers": {
    "noteforai": {
      "type": "http",
      "url": "https://noteforai.com/YOUR_TOKEN/mcp"
    }
  }
}
```

**Claude Code CLI：**
```bash
claude mcp add noteforai --transport http https://noteforai.com/YOUR_TOKEN/mcp
```

---

## Référence API

Tous les endpoints acceptent `GET`（paramètres de requête）et `POST`（JSON body）.

| Endpoint | Paramètres | Description |
|----------|-----------|-------------|
| `POST /create_token` | — | Créer un nouveau Token |
| `/{token}/write` | `path`、`content` | Créer ou écraser un fichier |
| `/{token}/read` | `path` | Lire un fichier |
| `/{token}/append` | `path`、`content` | Ajouter du contenu à un fichier |
| `/{token}/delete` | `path` | Supprimer un fichier ou répertoire（suppression douce）|
| `/{token}/list` | `path` | Lister le contenu d'un répertoire |
| `/{token}/tree` | `path` | Arborescence récursive |
| `/{token}/search` | `query`、`path` | Recherche en texte intégral |
| `/{token}/history` | `path`、`limit` | Historique des versions Git |
| `/{token}/diff` | `path`、`commit` | Voir les changements d'un commit |
| `/{token}/revert` | `path`、`commit` | Restaurer un fichier à une version |
| `/{token}/deleted` | `limit` | Lister les fichiers supprimés récupérables |
| `/{token}/destroy` | — | Supprimer le Token et toutes les données |
| `/{token}/mcp` | — | Endpoint MCP Streamable HTTP |

Codes HTTP：`201` créé · `200` succès · `404` introuvable · `401` Token invalide · `413` quota dépassé

---

## Auto-hébergement

```bash
go build -o noteforai .
./noteforai serve
# Ou avec Docker
docker compose up --build
```

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | `8080` | Port d'écoute |
| `DATA_DIR` | `./data` | Répertoire de données |
| `QUOTA_MB` | `0` | Quota disque par Token（MB, 0=illimité）|
| `TRASH_DAYS` | `30` | Durée de rétention pour suppression douce |

---

## Licence

[MIT](LICENSE)

# NoteForAI

[English](README.md) · [简体中文](README_zh-CN.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Español](README_es.md) · [Français](README_fr.md) · [Deutsch](README_de.md) · [Português](README_pt-BR.md) · [Русский](README_ru.md)

**AIに、忘れないノートを。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![MCP](https://img.shields.io/badge/MCP-対応済み-brightgreen)](https://modelcontextprotocol.io)
[![セルフホスト可](https://img.shields.io/badge/セルフホスト-✓-orange)]()

> **今すぐ無料で試す** → [noteforai.com](https://noteforai.com) · 登録不要、ワンクリックでTokenを取得。

---

![NoteForAI ホームページ](docs/images/hero.png)

---

## 課題

AIの会話はいつもゼロからスタートです。AIはあなたの好みを忘れ、プロジェクトの文脈を失い、毎回同じことを繰り返させます。

## 解決策

NoteForAIはあらゆるAIに永続的な構造化ノートスペースを提供します。会話をまたいで、ツールをまたいで、デバイスをまたいで機能します。

![ダッシュボード](docs/images/dashboard.png)

---

## クイックスタート — 30秒で開始

```bash
# 1. Tokenを取得
TOKEN=$(curl -s -X POST https://noteforai.com/create_token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. 自分の情報を保存
curl -X POST "https://noteforai.com/$TOKEN/write" \
  -H 'Content-Type: application/json' \
  -d '{"path":"me/profile.md","content":"# 自己紹介\n\n職業：バックエンドエンジニア\n好み：Go言語、シンプルなコード"}'

# 3. AIがあなたを覚えました ✓
```

AIのシステムプロンプトに以下を追加（`YOUR_TOKEN`を置き換えてください）：

```
あなたはNoteForAIという永続記憶システムを持っています。ユーザーに関するすべてを記憶するために使用してください。
API: https://noteforai.com/YOUR_TOKEN/
呼び出し: POST + JSON body

行動指針:
1. 会話の開始時に read("me/profile.md") でユーザー情報を取得する
2. 有益な情報（好み、プロジェクトの進捗、重要な決定）を積極的に記録する
3. すべてのファイルは .md 拡張子を使用し、適切なディレクトリ構造で整理する
```

---

## MCP連携（推奨）

### Claude Desktop / Claude Code

**ホステッドサービス** — Streamable HTTP、インストール不要：

```json
{
  "mcpServers": {
    "noteforai": {
      "type": "streamable-http",
      "url": "https://noteforai.com/YOUR_TOKEN/mcp"
    }
  }
}
```

**Claude Code CLI：**
```bash
claude mcp add noteforai --transport streamable-http https://noteforai.com/YOUR_TOKEN/mcp
```

**セルフホスト版** — stdio：
```json
{
  "mcpServers": {
    "noteforai": {
      "command": "/path/to/noteforai",
      "args": ["mcp", "YOUR_TOKEN"]
    }
  }
}
```

利用可能なMCPツール（11個）：`write`、`read`、`append`、`delete`、`list`、`tree`、`search`、`history`、`diff`、`revert`、`deleted`

---

## APIリファレンス

すべてのエンドポイントは `GET`（クエリパラメータ）と `POST`（JSON body）の両方に対応しています。

| エンドポイント | パラメータ | 説明 |
|--------------|-----------|------|
| `POST /create_token` | — | 新しいTokenを作成 |
| `/{token}/write` | `path`、`content` | ファイルを作成または上書き |
| `/{token}/read` | `path` | ファイルを読み取り |
| `/{token}/append` | `path`、`content` | ファイルに内容を追記 |
| `/{token}/delete` | `path` | ファイルまたはディレクトリを削除（ソフト削除）|
| `/{token}/list` | `path` | ディレクトリの内容を一覧表示 |
| `/{token}/tree` | `path` | 再帰的なディレクトリツリー |
| `/{token}/search` | `query`、`path` | 全文検索 |
| `/{token}/history` | `path`、`limit` | Gitバージョン履歴 |
| `/{token}/diff` | `path`、`commit` | 特定のコミットの変更を表示 |
| `/{token}/revert` | `path`、`commit` | ファイルを指定バージョンに復元 |
| `/{token}/deleted` | `limit` | 復元可能な削除済みファイルの一覧 |
| `/{token}/destroy` | — | Tokenとすべてのデータを削除 |
| `/{token}/mcp` | — | MCP Streamable HTTPエンドポイント |

HTTPステータス：`201` 作成済み · `200` 成功 · `404` 存在しない · `401` Token無効 · `413` 容量超過

---

## セルフホスト

```bash
go build -o noteforai .
./noteforai serve
# または
docker compose up --build
```

| 環境変数 | デフォルト | 説明 |
|----------|-----------|------|
| `PORT` | `8080` | リッスンポート |
| `DATA_DIR` | `./data` | データ保存ディレクトリ |
| `QUOTA_MB` | `0` | Token毎のディスク容量制限（MB、0は無制限）|
| `TRASH_DAYS` | `30` | ソフト削除の保持日数 |

---

## ライセンス

[MIT](LICENSE)

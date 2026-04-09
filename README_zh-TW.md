# NoteForAI

[English](README.md) · [简体中文](README_zh-CN.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Español](README_es.md) · [Français](README_fr.md) · [Deutsch](README_de.md) · [Português](README_pt-BR.md) · [Русский](README_ru.md)

**給你的 AI 一個永不遺忘的筆記本。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![MCP](https://img.shields.io/badge/MCP-已支援-brightgreen)](https://modelcontextprotocol.io)
[![可自部署](https://img.shields.io/badge/可自部署-✓-orange)]()

> **立即免費試用** → [noteforai.com](https://noteforai.com) · 無需註冊，一鍵取得 Token。

---

![NoteForAI 主頁](docs/images/hero.png)

---

## 問題所在

每次 AI 對話都從頭開始。AI 忘記你的偏好，遺失專案上下文，讓你一遍又一遍地重複說明——每次都是。

## 解決方案

NoteForAI 給任何 AI 一個持久的、結構化的筆記空間。跨對話、跨工具、跨裝置皆可使用。

![管理面板](docs/images/dashboard.png)

---

## 快速開始 — 30 秒上手

```bash
# 1. 取得你的 Token
TOKEN=$(curl -s -X POST https://noteforai.com/create_token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. 儲存關於你的資訊
curl -X POST "https://noteforai.com/$TOKEN/write" \
  -H 'Content-Type: application/json' \
  -d '{"path":"個人/基本資訊.md","content":"# 關於我\n\n職業：後端工程師\n偏好：Go 語言，簡潔程式碼"}'

# 3. 你的 AI 現在記住你了 ✓
```

將以下內容貼到 AI 的系統提示中（替換 `YOUR_TOKEN`）：

```
你擁有一個持久記憶系統 NoteForAI，用它記住關於使用者的一切。
接口：https://noteforai.com/YOUR_TOKEN/
調用：POST + JSON body
行為準則：
1. 每次對話開始，先 read("個人/基本資訊.md") 獲取使用者資訊
2. 主動記錄有價值的資訊（偏好、專案進展、重要決定）
```

---

## MCP 接入（推薦）

### Claude Desktop / Claude Code

**託管服務** — Streamable HTTP，無需安裝：

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

**Claude Code 命令列：**
```bash
claude mcp add noteforai --transport streamable-http https://noteforai.com/YOUR_TOKEN/mcp
```

---

## API 參考

所有接口支援 `GET`（查詢參數）和 `POST`（JSON body）兩種方式。

| 接口 | 參數 | 說明 |
|------|------|------|
| `POST /create_token` | — | 建立新 Token |
| `/{token}/write` | `path`、`content` | 新建或覆蓋檔案 |
| `/{token}/read` | `path` | 讀取檔案 |
| `/{token}/append` | `path`、`content` | 追加內容到檔案 |
| `/{token}/delete` | `path` | 刪除檔案或目錄（軟刪除）|
| `/{token}/list` | `path` | 列出目錄內容 |
| `/{token}/tree` | `path` | 遞迴目錄樹 |
| `/{token}/search` | `query`、`path` | 全文搜尋 |
| `/{token}/history` | `path`、`limit` | Git 版本歷史 |
| `/{token}/diff` | `path`、`commit` | 查看指定提交的變更 |
| `/{token}/revert` | `path`、`commit` | 恢復檔案到指定版本 |
| `/{token}/deleted` | `limit` | 列出可恢復的已刪除檔案 |
| `/{token}/destroy` | — | 銷毀 Token 及全部資料 |
| `/{token}/mcp` | — | MCP Streamable HTTP 端點 |

---

## 自部署

```bash
go build -o noteforai .
./noteforai serve
# 或
docker compose up --build
```

| 環境變數 | 預設值 | 說明 |
|----------|--------|------|
| `PORT` | `8080` | 監聽埠號 |
| `DATA_DIR` | `./data` | 資料儲存目錄 |
| `QUOTA_MB` | `0` | 每個 Token 的磁碟配額（MB，0 為不限制）|
| `TRASH_DAYS` | `30` | 軟刪除保留天數 |

---

## 開源協議

[MIT](LICENSE)

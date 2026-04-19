# NoteForAI

[English](README.md) · [简体中文](README_zh-CN.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Español](README_es.md) · [Français](README_fr.md) · [Deutsch](README_de.md) · [Português](README_pt-BR.md) · [Русский](README_ru.md)

**Дайте вашему ИИ блокнот, который никогда не забывает.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![MCP](https://img.shields.io/badge/MCP-Поддерживается-brightgreen)](https://modelcontextprotocol.io)
[![Самостоятельный хостинг](https://img.shields.io/badge/Свой_хостинг-✓-orange)]()

> **Попробуйте бесплатно** → [noteforai.com](https://noteforai.com) · Без регистрации, Token в один клик.

---

![Главная страница NoteForAI](docs/images/hero.png)

---

## Проблема

Каждый разговор с ИИ начинается с нуля. ИИ забывает ваши предпочтения, теряет контекст проекта и заставляет вас повторяться снова и снова.

## Решение

NoteForAI даёт любому ИИ постоянное структурированное пространство для заметок. Работает между разговорами, инструментами и устройствами.

![Панель управления](docs/images/dashboard.png)

---

## Быстрый старт — 30 секунд

```bash
# 1. Получите ваш Token
TOKEN=$(curl -s -X POST https://noteforai.com/create_token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Сохраните информацию о себе
curl -X POST "https://noteforai.com/$TOKEN/write" \
  -H 'Content-Type: application/json' \
  -d '{"path":"я/профиль.md","content":"# О себе\n\nРоль: Backend-разработчик\nПредпочтения: Go, чистый код"}'

# 3. Теперь ваш ИИ помнит вас ✓
```

Вставьте это в системный промпт вашего ИИ（замените `YOUR_TOKEN`）：

```
У вас есть система постоянной памяти NoteForAI. Используйте её, чтобы помнить всё о пользователе.
API: https://noteforai.com/YOUR_TOKEN/
Вызов: POST + JSON body

Руководящие принципы:
1. В начале каждого разговора выполняйте read("я/профиль.md") для получения контекста
2. Активно записывайте ценную информацию（предпочтения, прогресс проектов, важные решения）
3. Используйте расширение .md для всех файлов, организуйте по тематическим директориям
```

---

## Интеграция MCP（Рекомендуется）

### Claude Desktop / Claude Code

**Облачный сервис** — Streamable HTTP, без установки：

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

**Самостоятельный хостинг** — stdio：
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

---

## Справочник API

Все эндпоинты поддерживают `GET`（параметры запроса）и `POST`（JSON body）.

| Эндпоинт | Параметры | Описание |
|----------|-----------|----------|
| `POST /create_token` | — | Создать новый Token |
| `/{token}/write` | `path`、`content` | Создать или перезаписать файл |
| `/{token}/read` | `path` | Прочитать файл |
| `/{token}/append` | `path`、`content` | Добавить содержимое к файлу |
| `/{token}/delete` | `path` | Удалить файл или директорию（мягкое удаление）|
| `/{token}/list` | `path` | Список содержимого директории |
| `/{token}/tree` | `path` | Рекурсивное дерево директорий |
| `/{token}/search` | `query`、`path` | Полнотекстовый поиск |
| `/{token}/history` | `path`、`limit` | История версий Git |
| `/{token}/diff` | `path`、`commit` | Просмотр изменений коммита |
| `/{token}/revert` | `path`、`commit` | Восстановить файл до версии |
| `/{token}/deleted` | `limit` | Список восстанавливаемых удалённых файлов |
| `/{token}/destroy` | — | Удалить Token и все данные |
| `/{token}/mcp` | — | Эндпоинт MCP Streamable HTTP |

HTTP-коды：`201` создан · `200` успех · `404` не найден · `401` Token недействителен · `413` квота превышена

---

## Самостоятельный хостинг

```bash
go build -o noteforai .
./noteforai serve
# Или с Docker
docker compose up --build
```

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `PORT` | `8080` | Порт прослушивания |
| `DATA_DIR` | `./data` | Директория данных |
| `QUOTA_MB` | `0` | Квота диска на Token（МБ, 0=без ограничений）|
| `TRASH_DAYS` | `30` | Дней хранения при мягком удалении |

---

## Лицензия

[MIT](LICENSE)

# NoteForAI

[English](README.md) · [简体中文](README_zh-CN.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Español](README_es.md) · [Français](README_fr.md) · [Deutsch](README_de.md) · [Português](README_pt-BR.md) · [Русский](README_ru.md)

**Dale a tu IA un cuaderno que nunca olvida.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![MCP](https://img.shields.io/badge/MCP-Compatible-brightgreen)](https://modelcontextprotocol.io)
[![Auto-hospedable](https://img.shields.io/badge/Auto--hospedable-✓-orange)]()

> **Pruébalo gratis** → [noteforai.com](https://noteforai.com) · Sin registro, obtén un Token en un clic.

---

![Página principal de NoteForAI](docs/images/hero.png)

---

## El problema

Cada conversación con IA comienza desde cero. Tu IA olvida tus preferencias, pierde el contexto del proyecto y te hace repetir todo — cada vez.

## La solución

NoteForAI le da a cualquier IA un cuaderno persistente y estructurado. Funciona entre conversaciones, entre herramientas, entre dispositivos.

![Panel de control](docs/images/dashboard.png)

---

## Inicio rápido — 30 segundos

Sin registro. Sin instalación. Solo ejecuta:

```bash
# 1. Obtén tu Token
TOKEN=$(curl -s -X POST https://noteforai.com/create_token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Guarda información sobre ti
curl -X POST "https://noteforai.com/$TOKEN/write" \
  -H 'Content-Type: application/json' \
  -d '{"path":"me/perfil.md","content":"# Sobre mí\n\nRol: Ingeniero backend\nPreferencias: Go, código limpio"}'

# 3. Tu IA ahora te recuerda — en cada conversación ✓
```

Pega esto en el system prompt de tu IA（reemplaza `YOUR_TOKEN`）：

```
Tienes un sistema de memoria persistente llamado NoteForAI. Úsalo para recordar todo sobre el usuario.
API: https://noteforai.com/YOUR_TOKEN/
Llamada: POST + JSON body

Directrices:
1. Al iniciar cada conversación, ejecuta read("me/perfil.md") para obtener el contexto del usuario
2. Registra activamente información valiosa（preferencias, progreso de proyectos, decisiones importantes）
3. Usa extensión .md para todos los archivos, organiza en directorios temáticos
```

---

## Integración MCP（Recomendado）

### Claude Desktop / Claude Code

**Servicio hospedado** — Streamable HTTP, sin instalación：

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

---

## Referencia de API

Todos los endpoints aceptan `GET`（parámetros de consulta）y `POST`（JSON body）.

| Endpoint | Parámetros | Descripción |
|----------|-----------|-------------|
| `POST /create_token` | — | Crear nuevo Token |
| `/{token}/write` | `path`、`content` | Crear o sobrescribir archivo |
| `/{token}/read` | `path` | Leer archivo |
| `/{token}/append` | `path`、`content` | Agregar contenido al archivo |
| `/{token}/delete` | `path` | Eliminar archivo o directorio（borrado suave）|
| `/{token}/list` | `path` | Listar contenido del directorio |
| `/{token}/tree` | `path` | Árbol de directorio recursivo |
| `/{token}/search` | `query`、`path` | Búsqueda de texto completo |
| `/{token}/history` | `path`、`limit` | Historial de versiones Git |
| `/{token}/diff` | `path`、`commit` | Ver cambios de un commit específico |
| `/{token}/revert` | `path`、`commit` | Restaurar archivo a una versión |
| `/{token}/deleted` | `limit` | Listar archivos eliminados recuperables |
| `/{token}/destroy` | — | Eliminar Token y todos los datos |
| `/{token}/mcp` | — | Endpoint MCP Streamable HTTP |

Códigos HTTP：`201` creado · `200` exitoso · `404` no encontrado · `401` Token inválido · `413` cuota excedida

---

## Auto-hospedaje

```bash
go build -o noteforai .
./noteforai serve
# O con Docker
docker compose up --build
```

| Variable | Defecto | Descripción |
|----------|---------|-------------|
| `PORT` | `8080` | Puerto de escucha |
| `DATA_DIR` | `./data` | Directorio de datos |
| `QUOTA_MB` | `0` | Cuota de disco por Token（MB, 0=ilimitado）|
| `TRASH_DAYS` | `30` | Días de retención para borrado suave |

---

## Licencia

[MIT](LICENSE)

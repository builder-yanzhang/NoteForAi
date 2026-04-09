# NoteForAI

[English](README.md) · [简体中文](README_zh-CN.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Español](README_es.md) · [Français](README_fr.md) · [Deutsch](README_de.md) · [Português](README_pt-BR.md) · [Русский](README_ru.md)

**Dê à sua IA um caderno que nunca esquece.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![MCP](https://img.shields.io/badge/MCP-Suportado-brightgreen)](https://modelcontextprotocol.io)
[![Auto-hospedável](https://img.shields.io/badge/Auto--hospedável-✓-orange)]()

> **Experimente gratuitamente** → [noteforai.com](https://noteforai.com) · Sem cadastro, obtenha um Token em um clique.

---

![Página inicial do NoteForAI](docs/images/hero.png)

---

## O problema

Cada conversa com IA começa do zero. Sua IA esquece suas preferências, perde o contexto do projeto e faz você repetir tudo — toda vez.

## A solução

NoteForAI dá a qualquer IA um espaço de notas persistente e estruturado. Funciona entre conversas, ferramentas e dispositivos.

![Painel de controle](docs/images/dashboard.png)

---

## Início rápido — 30 segundos

```bash
# 1. Obtenha seu Token
TOKEN=$(curl -s -X POST https://noteforai.com/create_token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Salve informações sobre você
curl -X POST "https://noteforai.com/$TOKEN/write" \
  -H 'Content-Type: application/json' \
  -d '{"path":"eu/perfil.md","content":"# Sobre mim\n\nFunção: Engenheiro backend\nPreferências: Go, código limpo"}'

# 3. Sua IA agora lembra de você ✓
```

Cole isto no system prompt da sua IA（substitua `YOUR_TOKEN`）：

```
Você tem um sistema de memória persistente chamado NoteForAI. Use-o para lembrar de tudo sobre o usuário.
API: https://noteforai.com/YOUR_TOKEN/
Chamada: POST + JSON body

Diretrizes:
1. No início de cada conversa, execute read("eu/perfil.md") para obter o contexto
2. Registre ativamente informações valiosas（preferências, progresso de projetos, decisões importantes）
3. Use extensão .md para todos os arquivos, organize em diretórios temáticos
```

---

## Integração MCP（Recomendado）

### Claude Desktop / Claude Code

**Serviço hospedado** — Streamable HTTP, sem instalação：

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

## Referência da API

Todos os endpoints aceitam `GET`（parâmetros de consulta）e `POST`（JSON body）.

| Endpoint | Parâmetros | Descrição |
|----------|-----------|-----------|
| `POST /create_token` | — | Criar novo Token |
| `/{token}/write` | `path`、`content` | Criar ou sobrescrever arquivo |
| `/{token}/read` | `path` | Ler arquivo |
| `/{token}/append` | `path`、`content` | Adicionar conteúdo ao arquivo |
| `/{token}/delete` | `path` | Excluir arquivo ou diretório（exclusão suave）|
| `/{token}/list` | `path` | Listar conteúdo do diretório |
| `/{token}/tree` | `path` | Árvore de diretório recursiva |
| `/{token}/search` | `query`、`path` | Pesquisa de texto completo |
| `/{token}/history` | `path`、`limit` | Histórico de versões Git |
| `/{token}/diff` | `path`、`commit` | Ver mudanças de um commit específico |
| `/{token}/revert` | `path`、`commit` | Restaurar arquivo para uma versão |
| `/{token}/deleted` | `limit` | Listar arquivos excluídos recuperáveis |
| `/{token}/destroy` | — | Excluir Token e todos os dados |
| `/{token}/mcp` | — | Endpoint MCP Streamable HTTP |

Códigos HTTP：`201` criado · `200` sucesso · `404` não encontrado · `401` Token inválido · `413` cota excedida

---

## Auto-hospedagem

```bash
go build -o noteforai .
./noteforai serve
# Ou com Docker
docker compose up --build
```

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `8080` | Porta de escuta |
| `DATA_DIR` | `./data` | Diretório de dados |
| `QUOTA_MB` | `0` | Cota de disco por Token（MB, 0=ilimitado）|
| `TRASH_DAYS` | `30` | Dias de retenção para exclusão suave |

---

## Licença

[MIT](LICENSE)

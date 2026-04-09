# NoteForAI

[English](README.md) · [简体中文](README_zh-CN.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Español](README_es.md) · [Français](README_fr.md) · [Deutsch](README_de.md) · [Português](README_pt-BR.md) · [Русский](README_ru.md)

**AI에게 절대 잊지 않는 노트북을.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![MCP](https://img.shields.io/badge/MCP-지원됨-brightgreen)](https://modelcontextprotocol.io)
[![셀프호스팅](https://img.shields.io/badge/셀프호스팅-✓-orange)]()

> **지금 무료로 시작** → [noteforai.com](https://noteforai.com) · 가입 불필요, 원클릭으로 Token 발급.

---

![NoteForAI 홈페이지](docs/images/hero.png)

---

## 문제점

AI 대화는 매번 처음부터 시작됩니다. AI는 당신의 선호를 잊고, 프로젝트 맥락을 잃어버리며, 매번 같은 내용을 반복하게 만듭니다.

## 해결책

NoteForAI는 모든 AI에게 영구적이고 구조화된 노트 공간을 제공합니다. 대화를 넘어, 도구를 넘어, 기기를 넘어 작동합니다.

![대시보드](docs/images/dashboard.png)

---

## 빠른 시작 — 30초

```bash
# 1. Token 발급
TOKEN=$(curl -s -X POST https://noteforai.com/create_token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. 나의 정보 저장
curl -X POST "https://noteforai.com/$TOKEN/write" \
  -H 'Content-Type: application/json' \
  -d '{"path":"나/프로필.md","content":"# 나에 대해\n\n직업：백엔드 엔지니어\n선호：Go 언어, 간결한 코드"}'

# 3. AI가 이제 당신을 기억합니다 ✓
```

AI 시스템 프롬프트에 추가하세요（`YOUR_TOKEN` 교체）：

```
당신은 NoteForAI라는 영구 기억 시스템을 가지고 있습니다. 사용자에 관한 모든 것을 기억하는 데 사용하세요.
API: https://noteforai.com/YOUR_TOKEN/
호출: POST + JSON body

행동 지침:
1. 대화 시작 시 read("나/프로필.md")로 사용자 정보 확인
2. 가치 있는 정보(선호도, 프로젝트 진행 상황, 중요한 결정)를 적극적으로 기록
3. 모든 파일은 .md 확장자 사용, 주제별 디렉토리로 구성
```

---

## MCP 연동（권장）

### Claude Desktop / Claude Code

**호스팅 서비스** — Streamable HTTP, 설치 불필요：

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

## API 레퍼런스

모든 엔드포인트는 `GET`（쿼리 파라미터）과 `POST`（JSON body） 모두 지원합니다.

| 엔드포인트 | 파라미터 | 설명 |
|-----------|---------|------|
| `POST /create_token` | — | 새 Token 생성 |
| `/{token}/write` | `path`、`content` | 파일 생성 또는 덮어쓰기 |
| `/{token}/read` | `path` | 파일 읽기 |
| `/{token}/append` | `path`、`content` | 파일에 내용 추가 |
| `/{token}/delete` | `path` | 파일 또는 디렉토리 삭제（소프트 삭제）|
| `/{token}/list` | `path` | 디렉토리 내용 목록 |
| `/{token}/tree` | `path` | 재귀적 디렉토리 트리 |
| `/{token}/search` | `query`、`path` | 전문 검색 |
| `/{token}/history` | `path`、`limit` | Git 버전 이력 |
| `/{token}/diff` | `path`、`commit` | 특정 커밋 변경사항 확인 |
| `/{token}/revert` | `path`、`commit` | 파일을 특정 버전으로 복원 |
| `/{token}/deleted` | `limit` | 복원 가능한 삭제된 파일 목록 |
| `/{token}/destroy` | — | Token과 모든 데이터 삭제 |
| `/{token}/mcp` | — | MCP Streamable HTTP 엔드포인트 |

HTTP 상태 코드：`201` 생성됨 · `200` 성공 · `404` 없음 · `401` Token 무효 · `413` 용량 초과

---

## 셀프호스팅

```bash
go build -o noteforai .
./noteforai serve
# 또는
docker compose up --build
```

| 환경변수 | 기본값 | 설명 |
|---------|--------|------|
| `PORT` | `8080` | 리스닝 포트 |
| `DATA_DIR` | `./data` | 데이터 저장 디렉토리 |
| `QUOTA_MB` | `0` | Token별 디스크 할당량（MB, 0=무제한）|
| `TRASH_DAYS` | `30` | 소프트 삭제 보존 일수 |

---

## 라이선스

[MIT](LICENSE)

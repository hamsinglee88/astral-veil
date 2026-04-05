# Story 1.2 — ASP.NET Core 运势 API

## Story

作为运维/产品，我希望生产环境由 **ASP.NET Core** 提供 `POST /api/horoscope`，以便密钥留在服务端且契约可文档化。

## Acceptance Criteria

1. **AC1** — 仓库内存在 `server/AstralVeil.Api/`，`POST /api/horoscope` 接受 PRD §14.3 请求体，成功返回 `{ "horoscope": { ... } }`（camelCase）。
2. **AC2** — 错误响应与 PRD 一致：`400` 缺少参数、`503` `NO_API_KEY`、`502` `AI_UPSTREAM` / `EMPTY_AI_RESPONSE`、`500` `HOROSCOPE_FAILED`。
3. **AC3** — 开发环境下 OpenAPI 文档可访问（`MapOpenApi`）；`OPENAI_API_KEY` 仅通过配置/环境变量读取，不提交仓库。

## Tasks / Subtasks

- [x] 使用 `dotnet new webapi` 创建 `server/AstralVeil.Api`（控制器 + OpenAPI）
- [x] 实现 `HoroscopeController` + `HoroscopeAiService`（OpenAI 兼容 Chat Completions）
- [x] 集成测试：`NO_API_KEY`、参数缺失、`GET /openapi/v1.json`
- [x] `dotnet test`、`dotnet build` 通过

## Dev Notes

- 与 `server/horoscope-api-plugin.ts` 行为对齐；密钥名 `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`。
- 目标框架：`net10.0`（与当前 SDK 一致）。

## Dev Agent Record

### Debug Log

- 无阻塞；无 `ready-for-dev` 时从 epics 升版 Story 1.2 并执行。

### Completion Notes

- 新建 `server/AstralVeil.Api/`：模型 `HoroscopeRequest` / `HoroscopePayload`、`HoroscopeController`、`HoroscopeAiService`。
- `Program.cs`：`AddOpenApi()`，Development 下 `MapOpenApi()`；`AddHttpClient("openai")`；JSON camelCase。
- `server/AstralVeil.Api.Tests`：`WebApplicationFactory` 覆盖 503/400/OpenAPI。
- `AstralVeil.Api.http` 更新示例请求；`.gitignore` 增加 `server/**/bin/`、`server/**/obj/`。

## File List

- `.env.example`
- `.gitignore`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-2-aspnet-horoscope-api.md`（本文件）
- `server/AstralVeil.Api/**`（新建工程，含 `Controllers/`、`Models/`、`Services/`、`Program.cs` 等）
- `server/AstralVeil.Api.Tests/**`（新建测试项目）

## Change Log

| 日期 | 说明 |
|------|------|
| 2026-04-04 | 实现 Story 1.2：.NET 运势 API + 测试 |

## Status

review

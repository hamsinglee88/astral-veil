# Story 1.3 — 开发代理与前端超时兜底

## Story

作为开发者/用户，我希望本地前端请求 `/api` 可转发到 .NET，且浏览器端在 30 秒超时或 5xx 时看到兜底运势，避免无限加载。

## Acceptance Criteria

1. **AC1** — 可选通过环境变量启用 Vite `server.proxy`，将 `/api` 转发至 ASP.NET Core 默认地址；启用时不再走 Node `horoscope-api-plugin`。
2. **AC2** — `fetchHoroscope` 对单次请求使用 **30 秒** 超时（与 PRD NFR3 一致）；超时或网络错误走 `buildFallbackHoroscope`。
3. **AC3** — `.env.example` 说明如何联调 .NET。

## Tasks / Subtasks

- [x] `vite.config.ts`：`loadEnv` + 条件代理与条件插件
- [x] `fetchHoroscope`：`AbortSignal.timeout(30_000)` + `catch` 兜底
- [x] Vitest：超时/失败 → 兜底
- [x] `npm run lint` / `npm run test` 通过

## Dev Notes

- .NET 默认：`http://localhost:5020`（`launchSettings.json`）。

## Dev Agent Record

### Debug Log

- `plugins` 数组需标注为 `PluginOption[]`，否则 `push(horoscopeApiPlugin())` 与 `tailwind` 返回类型推断冲突。

### Completion Notes

- `VITE_USE_DOTNET_API=true` 或设置 `VITE_API_PROXY_TARGET` / `VITE_DOTNET_API_URL` 时启用 `/api` → `http://localhost:5020`（或可配置），并 **不** 加载 Node 运势插件。
- `fetchHoroscope` 使用 `AbortSignal.timeout(30_000)`，异常与既有 `!res.ok` 分支均走兜底。
- 新增 `fetchHoroscope.test.ts`；导出 `HOROSCOPE_FETCH_TIMEOUT_MS` 供断言。

## File List

- `.env.example`
- `vite.config.ts`
- `src/lib/fetchHoroscope.ts`
- `src/lib/fetchHoroscope.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-3-dev-proxy-timeout-fallback.md`（本文件）

## Change Log

| 日期 | 说明 |
|------|------|
| 2026-04-05 | 实现 Story 1.3：代理、30s 超时、测试与文档 |

## Status

review

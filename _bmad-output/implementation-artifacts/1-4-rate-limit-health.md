# Story 1.4 — 限流与健康检查

## Story

作为服务方，我希望公开运势接口具备基本限流与健康检查，降低滥用风险。

## Acceptance Criteria

1. **AC1** — `POST /api/horoscope` 具备按 IP 的固定窗口限流，阈值可在配置中调整；超限返回 **429** 与 JSON `error: RATE_LIMITED`。
2. **AC2** — `GET /health` 返回 **200** 与可解析 JSON（含 `status: ok`），供负载均衡探活。
3. **AC3** — 集成测试覆盖健康检查与限流（低阈值下第三次请求 429）。

## Tasks / Subtasks

- [x] `Program.cs`：`AddRateLimiter` + `UseRateLimiter` + `MapGet /health`
- [x] `HoroscopeController`：`[EnableRateLimiting("horoscope")]`
- [x] `appsettings.json`：`RateLimiting:Horoscope` 默认 60 次 / 60 秒
- [x] `HoroscopeApiTests`：Health、429 用例
- [x] `dotnet test` 通过

## Dev Notes

- 策略名 `horoscope`；分区键为 `RemoteIpAddress`。

## Dev Agent Record

### Debug Log

- 测试中用 `WebHostBuilder.UseSetting` 注入低阈值，避免额外 NuGet 包。

### Completion Notes

- 限流：`FixedWindowLimiter`，默认每 IP 每分钟 60 次（可配置）。
- 429 正文：`{"error":"RATE_LIMITED","message":"..."}`。
- `/health`：`{"status":"ok"}`。

## File List

- `server/AstralVeil.Api/Program.cs`
- `server/AstralVeil.Api/appsettings.json`
- `server/AstralVeil.Api/Controllers/HoroscopeController.cs`
- `server/AstralVeil.Api.Tests/HoroscopeApiTests.cs`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-4-rate-limit-health.md`（本文件）

## Change Log

| 日期 | 说明 |
|------|------|
| 2026-04-05 | 实现 Story 1.4：限流 + /health + 测试 |

## Status

review

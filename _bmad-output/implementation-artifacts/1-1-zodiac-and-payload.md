# Story 1.1 — 星座推算与请求载荷

## Story

作为已建档用户，我希望系统根据我的出生月日算出星座，并在请求运势时带上 PRD §14.3 约定的 JSON 字段，以便获得与后端契约一致的当日运势。

## Acceptance Criteria

1. **AC1** — `POST /api/horoscope` 请求体字段与 PRD §14.3 表格一致：`birthYear`、`birthMonth`、`birthDay`、`zodiacLabel`（必填）、`dateISO`（可选，YYYY-MM-DD）。
2. **AC2** — 客户端用于请求的星座中文名 `zodiacLabel` 与 `getZodiacLabel(profile.zodiacId)` 一致，且建档流程中的 `zodiacId` 由公历月日通过 `getZodiacFromMonthDay` 得到（与 FR-H1 一致）。
3. **AC3** — 请求体构造逻辑集中在一处（单一数据源），便于与 .NET 后端及 OpenAPI 对齐（NFR4）。

## Tasks / Subtasks

- [x] 定义 `HoroscopeApiRequestBody` 类型并对照 PRD §14.3
- [x] 实现 `buildHoroscopeRequestBody(profile, dateISO?)` 并在 `fetchHoroscope` 中使用
- [x] 添加 Vitest：星座边界月日、`buildHoroscopeRequestBody` 输出形状
- [x] `npm run test` 与 `npm run lint`（tsc）通过

## Dev Notes

- PRD：`prd.md` §14.3；棕地：`fetchHoroscope.ts`、`horoscope-api-plugin.ts` 已使用相同字段名。
- 勿在请求体中引入 API 密钥（NFR2）。

## Dev Agent Record

### Debug Log

- 无阻塞项；仓库原无 `sprint-status.yaml` 与 Story 文件，已按 BMAD 补全并执行本 Story。

### Completion Notes

- 新增 `HoroscopeApiRequestBody` 与 `buildHoroscopeRequestBody()`，集中构造 `POST /api/horoscope` 请求体，与 PRD §14.3 对齐。
- `fetchHoroscope` 改为使用该函数，避免字段散落。
- Vitest：`zodiac.test.ts` 覆盖典型边界；`buildHoroscopeRequestBody.test.ts` 校验输出形状与中文星座名。
- `package.json` 增加 `test` 脚本与 `vitest`；`vite.config.ts` 增加 `test` 配置。

## File List

- `_bmad-output/implementation-artifacts/sprint-status.yaml`（新建）
- `_bmad-output/implementation-artifacts/1-1-zodiac-and-payload.md`（新建，本文件）
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `src/lib/buildHoroscopeRequestBody.ts`（新建）
- `src/lib/buildHoroscopeRequestBody.test.ts`（新建）
- `src/lib/zodiac.test.ts`（新建）
- `src/lib/fetchHoroscope.ts`（修改）

## Change Log

| 日期 | 说明 |
|------|------|
| 2026-04-04 | 创建 Story，自 `epics.md` Story 1.1 |
| 2026-04-04 | 实现请求体抽取、Vitest、sprint 工件 |

## Status

review

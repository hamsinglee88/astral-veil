# Story 2.2 — 档案持久化与展示（手机号掩码）

## Story

作为回访用户，我希望昵称、生日、星座被记住；在「我的」中手机号以掩码显示。

## Acceptance Criteria

1. **AC1** — 档案通过 `localStorage` 持久化，刷新后仍存在（FR-A2）。
2. **AC2** — 所有面向用户的手机号展示使用统一掩码：11 位为 `前三 + **** + 后四`（NFR1）。

## Tasks / Subtasks

- [x] 抽取 `maskCnMobilePhone`（`phoneDisplay.ts`）
- [x] 建档页「已绑定手机」与「我的」页展示使用掩码
- [x] Vitest 覆盖掩码逻辑
- [x] `npm run lint` / `npm run test` 通过

## Dev Notes

- 持久化已由 `App.tsx` + `userProfile.ts` 实现；本 Story 聚焦掩码与「我的」展示。

## Dev Agent Record

### Completion Notes

- 「我的」页昵称下增加一行 `手机 138****8000` 形式文案。

## File List

- `src/lib/phoneDisplay.ts`
- `src/lib/phoneDisplay.test.ts`
- `src/components.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-2-profile-persist-mask.md`（本文件）

## Change Log

| 日期 | 说明 |
|------|------|
| 2026-04-06 | Story 2.2：掩码函数与 Profile 展示 |

## Status

review

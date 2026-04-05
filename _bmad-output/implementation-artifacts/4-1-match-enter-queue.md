# Story 4.1 — 入队

## Story

作为用户，我通过明确操作进入匹配队列。

## Acceptance Criteria

1. **AC1** — 在匹配页点击主操作（「开始匹配」）后进入等待/队列状态（FR-M1）。

## Tasks / Subtasks

- [x] `joinMatchQueue` / `MatchPage`：`phase` 进入 searching，持久化队列（FR-M1）
- [x] `npm run lint` / `npm run test` 通过

## Dev Notes

- 棕地：`matchQueue.ts` 与 `MatchPage` 已存在；本 Story 登记入队行为与 PRD 对齐。

## Dev Agent Record

### Completion Notes

- `MatchPage` 在「开始匹配」时调用 `joinMatchQueue(sessionId)`，界面进入「匹配中…」与队列说明文案。

## File List

- `src/lib/matchQueue.ts`
- `src/components.tsx`（`MatchPage`）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-1-match-enter-queue.md`（本文件）

## Change Log

| 日期 | 说明 |
|------|------|
| 2026-04-06 | Story 4.1：登记入队与 sprint 条目 |

## Status

review

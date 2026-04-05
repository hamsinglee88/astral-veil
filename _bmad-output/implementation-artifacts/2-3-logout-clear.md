# Story 2.3 — 注销

## Story

作为用户，我希望注销后本设备档案被清除。

## Acceptance Criteria

1. **AC1** — 注销后 `localStorage` 中用户档案键被移除（FR-A3）。
2. **AC2** — 用户点击注销时有一次确认，避免误触（与 epics 旅程 5 一致）。
3. **AC3** — 与本会话相关的匹配演示计数、队列、会话 ID 一并清除，避免下一用户看到残留演示数据。

## Tasks / Subtasks

- [x] `clearUserDataOnLogout`：档案 + 匹配次数 + `matchQueue` 存储 + session 会话键
- [x] `ProfilePage`：`window.confirm` 后再 `onLogout`
- [x] `App.tsx`：`handleLogout` 调用 `clearUserDataOnLogout`
- [x] Vitest：`logoutClear.test.ts`
- [x] `npm run lint` / `npm run test` 通过

## Dev Notes

- 树洞消息为内存态，无需清 localStorage。

## Dev Agent Record

### Completion Notes

- 新增 `logoutClear.ts`；`matchQueue.ts` 导出 `clearMatchQueueStorage`。

## File List

- `src/lib/logoutClear.ts`
- `src/lib/logoutClear.test.ts`
- `src/lib/matchQueue.ts`
- `src/App.tsx`
- `src/components.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-3-logout-clear.md`（本文件）

## Change Log

| 日期 | 说明 |
|------|------|
| 2026-04-06 | Story 2.3：注销清理与确认 |

## Status

review

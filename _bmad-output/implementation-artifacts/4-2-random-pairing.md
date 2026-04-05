# Story 4.2 — 配对与随机性

## Story

作为系统，当队列中至少两人时，应随机配对两人并移出队列；无需实名认证。

## Acceptance Criteria

1. **AC1** — 队列至少两人时配对两人并移出队列（FR-M2）。
2. **AC2** — 配对在队列成员间随机选取（FR-M3）。
3. **AC3** — 匹配不依赖实名（FR-M4，与档案/登录解耦）。

## Tasks / Subtasks

- [x] `pickTwoRandomForPairing`：从队列中均匀随机选两人，其余保留为 `rest`
- [x] `tryPair` 使用上述逻辑并 `BroadcastChannel` 通知双方
- [x] Vitest：`matchQueue.test.ts` 覆盖边界与 `Math.random` 可复现用例
- [x] `npm run lint` / `npm run test` 通过

### Review Findings

- [x] [Review][Patch] `rest` 原按 `id` 过滤：若队列中同 `id` 出现多于一条（损坏或竞态），会误删多于两条 — 已改为按索引 `i`/`j` 剔除，并补充 Vitest 用例 [`matchQueue.ts` / `matchQueue.test.ts`]

- [x] [Review][Defer] 多标签页同时读写 `localStorage` 队列的经典竞态 — 棕地架构已知限制，非本 Story 引入 [`matchQueue.ts`] — deferred, pre-existing

## Dev Notes

- 先前实现为「队首两人」出队，与 FR-M3 不一致；现改为无放回随机二元组。

## Dev Agent Record

### Completion Notes

- 导出 `pickTwoRandomForPairing`，在 `tryPair` 中写回 `rest` 并推送 `matched` 事件；单元测试验证 0/1/2/3 人队列与 spy `Math.random`。

## File List

- `src/lib/matchQueue.ts`
- `src/lib/matchQueue.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-2-random-pairing.md`（本文件）
- `_bmad-output/implementation-artifacts/deferred-work.md`（评审延期项）

## Change Log

| 日期 | 说明 |
|------|------|
| 2026-04-06 | Story 4.2：随机配对与测试 |
| 2026-04-06 | Code review：索引剔除 rest + 重复 id 测试 |

## Status

done

# Story 3.1 — 群聊房间与消息流

## Story

作为用户，我希望在树洞进入共享房间，滚动查看历史并发送消息，新消息在本会话内可见。

## Acceptance Criteria

1. **AC1** — 树洞为群聊语义（星河大厅），非一对一私聊（FR-T1）。
2. **AC2** — 可发送文本，新消息出现在列表；消息持久化至 `localStorage` 以便刷新后仍可见（MVP 会话扩展）。

## Tasks / Subtasks

- [x] `treeHole.ts`：类型、加载/保存、种子消息
- [x] `TreeHolePage`：接入持久化与发送逻辑
- [x] Vitest：过滤与分类辅助函数（与 3.2 共用模块）
- [x] `npm run lint` / `npm run test` 通过

## Status

review

# Story 3.2 — 分类筛选

## Story

作为用户，我希望按分类查看消息，且仍能正常发送与浏览列表。

## Acceptance Criteria

1. **AC1** — 每条消息具备分区 `category`（1–3），Tab「全部」展示全部，其余 Tab 仅展示对应分区（FR-T3）。
2. **AC2** — 切换 Tab 时发送区仍可用；新消息归入当前逻辑分区（「全部」下默认元素区）。

## Tasks / Subtasks

- [x] `filterTreeHoleMessages` + `categoryForNewMessage`
- [x] 种子消息覆盖三个分区 + 演示第三条
- [x] `npm run lint` / `npm run test` 通过

## Status

review

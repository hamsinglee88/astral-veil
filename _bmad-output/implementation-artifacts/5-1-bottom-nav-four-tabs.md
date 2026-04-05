# Story 5.1 — Bottom navigation (four tabs)

## Story

As a logged-in user, I want to switch between Horoscope, Tree Hole, Match, and Profile using the bottom navigation.

## Acceptance Criteria

1. **AC1** — Tapping each tab switches the view without blocking errors (FR-N1).

## Tasks / Subtasks

- [x] `BottomNav` maps 运势 / 树洞 / 匹配 / 我的 to `Page` routes; `App` wires `setPage`
- [x] `aria-label` on `<nav>`, per-tab `aria-current` + `aria-label` for assistive tech
- [x] `npm run lint` / `npm run test` pass

### Review Findings

- [x] [Review][Defer] 底部导航为 `<button>` 组 + `aria-current`，未采用 `role="tablist"` / `role="tab"`；对 NFR6 基线可接受，完整 Tab 模式留作后续增强 [`components.tsx`：`BottomNav`] — deferred, pre-existing scope

## Dev Agent Record

### Completion Notes

- Brownfield: navigation already present; this story records acceptance and strengthens semantics for Epic 5.

## File List

- `src/components.tsx` (`BottomNav`)
- `src/App.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-1-bottom-nav-four-tabs.md` (this file)

## Change Log

| Date | Notes |
|------|--------|
| 2026-04-06 | Story 5.1: nav aria |
| 2026-04-07 | Code review：通过 |

## Status

done

# Story 5.3 — Keyboard operability (main path baseline)

## Story

As a keyboard-only user, I want to complete login → onboarding → horoscope without relying on the mouse (NFR6 baseline).

## Acceptance Criteria

1. **AC1** — Login and onboarding primary actions submit via **Enter** from the form (no focus trap on the happy path).
2. **AC2** — Login fields use associated labels (`htmlFor` / `id`).

## Tasks / Subtasks

- [x] `NebulaButton`: optional `buttonType="submit"`
- [x] `LoginPage`: `<form onSubmit>` wrapping fields; submit button
- [x] `OnboardingPage`: root `<form onSubmit>` + submit button for 「进入秘境」
- [x] `npm run lint` / `npm run test` pass

### Review Findings

- [x] [Review][Patch] 建档页「出生日期」单 `<label>` 关联多控件不符合规范 — 已改为 `<fieldset>` + `<legend>`，年/月/日加 `id` 与 `aria-label`；昵称 `htmlFor` + `id` [`components.tsx`：`OnboardingPage`]

## Dev Agent Record

### Completion Notes

- Forms use `preventDefault` + existing `submit` / `finish` handlers; WCAG AA full audit is out of scope (per epic).

## File List

- `src/components.tsx` (`NebulaButton`, `LoginPage`, `OnboardingPage`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-3-keyboard-main-path-baseline.md` (this file)

## Change Log

| Date | Notes |
|------|--------|
| 2026-04-06 | Story 5.3: forms + submit |
| 2026-04-07 | Code review：fieldset 与标签关联修复 |

## Status

done

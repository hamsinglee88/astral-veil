# Story 5.2 — App shell brand title

## Story

As a user, I want the product name shown in the shell to be the brand name 「星聊」.

## Acceptance Criteria

1. **AC1** — Header / shell title matches brand 「星聊」 (FR-N2); single source of truth for strings that must stay in sync.

## Tasks / Subtasks

- [x] `src/lib/appMeta.ts`: `APP_BRAND_NAME`
- [x] `Header` and login hero title use `APP_BRAND_NAME`; horoscope share title uses template with constant
- [x] Vitest: `appMeta.test.ts`
- [x] `npm run lint` / `npm run test` pass

### Review Findings

- （无阻塞项）`APP_BRAND_NAME` 与壳层/分享标题一致，源内无残留硬编码「星聊」。

## Dev Agent Record

### Completion Notes

- Replaced hardcoded 「星聊」 in shell and share title with `APP_BRAND_NAME`.

## File List

- `src/lib/appMeta.ts`
- `src/lib/appMeta.test.ts`
- `src/components.tsx` (`Header`, `LoginPage`, `HoroscopePage` share)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-2-app-brand-title.md` (this file)

## Change Log

| Date | Notes |
|------|--------|
| 2026-04-06 | Story 5.2: `APP_BRAND_NAME` |
| 2026-04-07 | Code review：通过 |

## Status

done

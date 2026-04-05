# Story 2.1 — 手机号与验证码门禁

## Story

作为新用户，我只有在输入合法手机号与 6 位验证码后才能进入建档，以减少无效流程。

## Acceptance Criteria

1. **AC1** — 手机号须为 **11 位**且符合 `1` 开头的中国大陆号段校验。
2. **AC2** — 验证码须为 **6 位数字**。
3. **AC3** — 校验逻辑可单测，登录页与建档前复检共用同一套规则（FR-A1）。

## Tasks / Subtasks

- [x] 抽取 `loginValidation.ts`（`isValidCnMobilePhone` / `isValidOtpSixDigits`）
- [x] `LoginPage` / `OnboardingPage` 完成按钮路径使用上述函数
- [x] Vitest 覆盖合法/非法用例
- [x] `npm run lint` / `npm run test` 通过

## Dev Notes

- 棕地：`LoginPage` 已有等价校验；本 Story 主要为可测试性与单一数据源。

## Dev Agent Record

### Completion Notes

- 新建 `src/lib/loginValidation.ts`；`components.tsx` 中登录与建档 `finish` 统一使用。

## File List

- `src/lib/loginValidation.ts`
- `src/lib/loginValidation.test.ts`
- `src/components.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-1-phone-otp-gate.md`（本文件）

## Change Log

| 日期 | 说明 |
|------|------|
| 2026-04-05 | Story 2.1：校验抽取与测试 |

## Status

review

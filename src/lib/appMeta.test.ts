import { describe, expect, it } from 'vitest';
import { APP_BRAND_NAME } from './appMeta';

describe('appMeta', () => {
  it('品牌名与 PRD 一致', () => {
    expect(APP_BRAND_NAME).toBe('星聊');
  });
});

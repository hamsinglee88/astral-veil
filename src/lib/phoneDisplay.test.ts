import { describe, expect, it } from 'vitest';
import { maskCnMobilePhone } from './phoneDisplay';

describe('maskCnMobilePhone', () => {
  it('masks middle 4 digits for 11-digit mobile', () => {
    expect(maskCnMobilePhone('13800138000')).toBe('138****8000');
    expect(maskCnMobilePhone(' 15912345678 ')).toBe('159****5678');
  });

  it('handles non-standard length without exposing full string', () => {
    const m = maskCnMobilePhone('123456789');
    expect(m).toMatch(/\*\*\*\*/);
    expect(m).not.toBe('123456789');
  });

  it('returns minimal mask for very short input', () => {
    expect(maskCnMobilePhone('123')).toBe('****');
  });
});

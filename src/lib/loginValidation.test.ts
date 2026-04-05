import { describe, expect, it } from 'vitest';
import { isValidCnMobilePhone, isValidOtpSixDigits } from './loginValidation';

describe('loginValidation', () => {
  it('accepts 11-digit mainland mobile starting with 1', () => {
    expect(isValidCnMobilePhone('13800138000')).toBe(true);
    expect(isValidCnMobilePhone(' 15900000000 ')).toBe(true);
  });

  it('rejects invalid phone', () => {
    expect(isValidCnMobilePhone('')).toBe(false);
    expect(isValidCnMobilePhone('23800138000')).toBe(false);
    expect(isValidCnMobilePhone('1380013800')).toBe(false);
    expect(isValidCnMobilePhone('abcdefghijk')).toBe(false);
  });

  it('accepts exactly 6 digit OTP', () => {
    expect(isValidOtpSixDigits('123456')).toBe(true);
    expect(isValidOtpSixDigits(' 000000 ')).toBe(true);
  });

  it('rejects non-6-digit OTP', () => {
    expect(isValidOtpSixDigits('12345')).toBe(false);
    expect(isValidOtpSixDigits('1234567')).toBe(false);
    expect(isValidOtpSixDigits('12ab56')).toBe(false);
  });
});

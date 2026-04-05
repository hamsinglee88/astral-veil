import { describe, expect, it } from 'vitest';
import { getZodiacFromMonthDay, getZodiacLabel } from './zodiac';

describe('getZodiacFromMonthDay', () => {
  it('白羊座起点 3/21', () => {
    expect(getZodiacFromMonthDay(3, 21)).toBe('aries');
    expect(getZodiacLabel(getZodiacFromMonthDay(3, 21))).toBe('白羊座');
  });

  it('摩羯座跨年 12/25 与 1/15', () => {
    expect(getZodiacFromMonthDay(12, 25)).toBe('capricorn');
    expect(getZodiacFromMonthDay(1, 15)).toBe('capricorn');
  });

  it('天蝎座典型区间', () => {
    expect(getZodiacFromMonthDay(11, 8)).toBe('scorpio');
    expect(getZodiacLabel('scorpio')).toBe('天蝎座');
  });
});

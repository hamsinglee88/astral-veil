import { describe, expect, it } from 'vitest';
import { buildHoroscopeRequestBody } from './buildHoroscopeRequestBody';
import type { UserProfile } from './userProfile';

const baseProfile: UserProfile = {
  phone: '13800138000',
  nickname: '测试',
  birthYear: 1999,
  birthMonth: 11,
  birthDay: 8,
  zodiacId: 'scorpio',
};

describe('buildHoroscopeRequestBody', () => {
  it('matches PRD §14.3 shape (camelCase)', () => {
    const body = buildHoroscopeRequestBody(baseProfile, '2026-04-04');
    expect(body).toEqual({
      birthYear: 1999,
      birthMonth: 11,
      birthDay: 8,
      zodiacLabel: '天蝎座',
      dateISO: '2026-04-04',
    });
    expect(Object.keys(body).sort()).toEqual(
      ['birthDay', 'birthMonth', 'birthYear', 'dateISO', 'zodiacLabel'].sort(),
    );
  });
});

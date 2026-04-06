import type { UserProfile } from './userProfile';
import { getZodiacLabel } from './zodiac';

/**
 * 与 PRD §14.3 `POST /api/horoscope` 请求体一致（camelCase），供前端与 OpenAPI 对齐。
 */
export interface HoroscopeApiRequestBody {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  zodiacLabel: string;
  /** 大陆手机号，用于每日运势缓存与用户关联 */
  phone: string;
  /** 运势日期 YYYY-MM-DD；省略时由服务端或调用方约定 */
  dateISO?: string;
}

/**
 * 从用户档案构造运势 API 请求体，保证与建档时的星座 ID 一致。
 */
export function buildHoroscopeRequestBody(
  profile: UserProfile,
  dateISO: string,
): HoroscopeApiRequestBody {
  return {
    birthYear: profile.birthYear,
    birthMonth: profile.birthMonth,
    birthDay: profile.birthDay,
    zodiacLabel: getZodiacLabel(profile.zodiacId),
    phone: profile.phone,
    dateISO,
  };
}

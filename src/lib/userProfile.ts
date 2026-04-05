import type { ZodiacId } from './zodiac';

export interface UserProfile {
  phone: string;
  nickname: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  zodiacId: ZodiacId;
  /** 首次完成档案的时间，用于展示「漫游天数」 */
  joinedAt?: string;
}

const KEY = 'astral-veil-profile';

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(p: UserProfile): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearProfile(): void {
  localStorage.removeItem(KEY);
}

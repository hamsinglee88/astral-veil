import type { UserProfile } from './userProfile';

/** 将档案同步到后端 SQLite（联调 .NET 或 Vite 代理时生效） */
export async function syncUserProfileToServer(profile: UserProfile): Promise<void> {
  try {
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: profile.phone,
        nickname: profile.nickname,
        birthYear: profile.birthYear,
        birthMonth: profile.birthMonth,
        birthDay: profile.birthDay,
        zodiacId: profile.zodiacId,
        joinedAt: profile.joinedAt,
      }),
    });
    if (!res.ok) {
      console.warn('[syncUserProfileToServer]', res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    console.warn('[syncUserProfileToServer]', e);
  }
}

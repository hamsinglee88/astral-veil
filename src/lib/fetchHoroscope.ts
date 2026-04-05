import { buildHoroscopeRequestBody } from './buildHoroscopeRequestBody';
import type { HoroscopePayload } from './horoscopeTypes';
import { buildFallbackHoroscope } from './horoscopeFallback';
import type { UserProfile } from './userProfile';

/** PRD NFR3：单次运势请求客户端超时 30 秒 */
export const HOROSCOPE_FETCH_TIMEOUT_MS = 30_000;

function normalizePayload(raw: Record<string, unknown>): HoroscopePayload {
  const dims = raw.dimensions as Record<string, { rating?: number; text?: string }> | undefined;
  return {
    moonNote: String(raw.moonNote ?? ''),
    insight: String(raw.insight ?? ''),
    luckyColorName: String(raw.luckyColorName ?? ''),
    luckyColorHex: String(raw.luckyColorHex ?? '#888888'),
    luckyNumber: String(raw.luckyNumber ?? '00'),
    luckyItem: String(raw.luckyItem ?? ''),
    dimensions: {
      love: {
        rating: Math.min(5, Math.max(1, Number(dims?.love?.rating ?? 3))),
        text: String(dims?.love?.text ?? ''),
      },
      career: {
        rating: Math.min(5, Math.max(1, Number(dims?.career?.rating ?? 3))),
        text: String(dims?.career?.text ?? ''),
      },
      energy: {
        rating: Math.min(5, Math.max(1, Number(dims?.energy?.rating ?? 3))),
        text: String(dims?.energy?.text ?? ''),
      },
    },
  };
}

export async function fetchHoroscope(profile: UserProfile): Promise<HoroscopePayload> {
  const dateISO = new Date().toISOString().slice(0, 10);
  const body = buildHoroscopeRequestBody(profile, dateISO);

  let res: Response;
  try {
    res = await fetch('/api/horoscope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(HOROSCOPE_FETCH_TIMEOUT_MS),
    });
  } catch {
    // 超时、断网或中止：与 PRD 兜底一致，避免无限等待
    return buildFallbackHoroscope(profile.zodiacId, dateISO);
  }

  if (res.status === 503) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (j.error === 'NO_API_KEY') {
      return buildFallbackHoroscope(profile.zodiacId, dateISO);
    }
  }

  if (!res.ok) {
    return buildFallbackHoroscope(profile.zodiacId, dateISO);
  }

  let j: { horoscope?: Record<string, unknown> };
  try {
    j = (await res.json()) as { horoscope?: Record<string, unknown> };
  } catch {
    // 200 但正文非合法 JSON（或截断）：与 PRD 兜底一致
    return buildFallbackHoroscope(profile.zodiacId, dateISO);
  }
  if (!j.horoscope) {
    return buildFallbackHoroscope(profile.zodiacId, dateISO);
  }
  return normalizePayload(j.horoscope);
}

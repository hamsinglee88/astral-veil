import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchHoroscope, HOROSCOPE_FETCH_TIMEOUT_MS } from './fetchHoroscope';
import type { UserProfile } from './userProfile';

const profile: UserProfile = {
  phone: '13800138000',
  nickname: '测',
  birthYear: 1999,
  birthMonth: 11,
  birthDay: 8,
  zodiacId: 'scorpio',
};

describe('fetchHoroscope', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('uses 30s timeout constant per NFR3', () => {
    expect(HOROSCOPE_FETCH_TIMEOUT_MS).toBe(30_000);
  });

  it('returns fallback when fetch rejects (e.g. timeout/abort)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    const result = await fetchHoroscope(profile);
    expect(result.insight.length).toBeGreaterThan(0);
    expect(result.moonNote.length).toBeGreaterThan(0);
  });

  it('returns fallback on 502', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'AI_UPSTREAM' }),
    } as Response);
    const result = await fetchHoroscope(profile);
    expect(result.insight.length).toBeGreaterThan(0);
  });

  it('returns fallback when 200 body is not valid JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Response);
    const result = await fetchHoroscope(profile);
    expect(result.insight.length).toBeGreaterThan(0);
  });

  it('returns normalized payload on 200 with horoscope', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        horoscope: {
          moonNote: '月相一句',
          insight: '启示正文',
          luckyColorName: '红',
          luckyColorHex: '#ff0000',
          luckyNumber: '07',
          luckyItem: '小物',
          dimensions: {
            love: { rating: 4, text: '恋' },
            career: { rating: 3, text: '事' },
            energy: { rating: 5, text: '能' },
          },
        },
      }),
    } as Response);
    const result = await fetchHoroscope(profile);
    expect(result.insight).toBe('启示正文');
    expect(result.moonNote).toBe('月相一句');
    expect(result.dimensions.love.rating).toBe(4);
  });
});

import { describe, expect, it } from 'vitest';
import { isoUtcToHHmm } from './treeHoleSignalR';

describe('isoUtcToHHmm', () => {
  it('formats valid ISO string', () => {
    const s = '2026-04-06T08:30:00.000Z';
    const out = isoUtcToHHmm(s);
    expect(out).toMatch(/^\d{2}:\d{2}$/);
  });

  it('returns placeholder for invalid', () => {
    expect(isoUtcToHHmm('not-a-date')).toBe('--:--');
  });
});

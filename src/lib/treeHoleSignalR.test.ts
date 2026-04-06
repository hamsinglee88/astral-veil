import { describe, expect, it } from 'vitest';
import { isoUtcToHHmm, normalizeTreeHoleRealtimePayload } from './treeHoleSignalR';

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

describe('normalizeTreeHoleRealtimePayload', () => {
  it('accepts camelCase', () => {
    const p = normalizeTreeHoleRealtimePayload({
      id: 'a1',
      author: 'x',
      text: 'hi',
      category: 2,
      time: '2026-01-01T00:00:00.000Z',
      self: false,
    });
    expect(p?.category).toBe(2);
  });

  it('accepts PascalCase from .NET', () => {
    const p = normalizeTreeHoleRealtimePayload({
      Id: 'b2',
      Author: 'y',
      Text: 'hello',
      Category: 3,
      Time: '2026-01-01T00:00:00.000Z',
      Self: false,
    });
    expect(p?.id).toBe('b2');
    expect(p?.text).toBe('hello');
  });

  it('returns null for bad input', () => {
    expect(normalizeTreeHoleRealtimePayload(null)).toBeNull();
    expect(normalizeTreeHoleRealtimePayload({})).toBeNull();
  });
});

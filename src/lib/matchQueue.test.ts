import { describe, expect, it, vi } from 'vitest';
import { pickTwoRandomForPairing } from './matchQueue';

describe('pickTwoRandomForPairing', () => {
  it('队列不足两人时返回 null', () => {
    expect(pickTwoRandomForPairing([])).toBeNull();
    expect(pickTwoRandomForPairing([{ id: 'a', joinedAt: 1 }])).toBeNull();
  });

  it('恰好两人时配对这两人且 rest 为空', () => {
    const q = [
      { id: 'a', joinedAt: 1 },
      { id: 'b', joinedAt: 2 },
    ];
    const r = pickTwoRandomForPairing(q);
    expect(r).not.toBeNull();
    expect(r!.rest).toHaveLength(0);
    const ids = new Set([r!.pair[0].id, r!.pair[1].id]);
    expect(ids.has('a')).toBe(true);
    expect(ids.has('b')).toBe(true);
  });

  it('三人时移除两人、rest 剩一人', () => {
    const q = [
      { id: 'a', joinedAt: 1 },
      { id: 'b', joinedAt: 2 },
      { id: 'c', joinedAt: 3 },
    ];
    const r = pickTwoRandomForPairing(q);
    expect(r).not.toBeNull();
    expect(r!.rest).toHaveLength(1);
    const paired = new Set([r!.pair[0].id, r!.pair[1].id]);
    expect(paired.size).toBe(2);
    expect(q.map((e) => e.id).filter((id) => !paired.has(id))).toEqual([
      r!.rest[0]!.id,
    ]);
  });

  it('同 id 在不同位置时仍只移除被抽中的两个索引', () => {
    const q = [
      { id: 'dup', joinedAt: 1 },
      { id: 'dup', joinedAt: 2 },
      { id: 'c', joinedAt: 3 },
    ];
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    const r = pickTwoRandomForPairing(q);
    vi.restoreAllMocks();
    expect(r).not.toBeNull();
    expect(r!.rest).toHaveLength(1);
    expect(r!.rest[0]!.id).toBe('c');
  });

  it('随机种子固定时配对可复现（验证使用 Math.random）', () => {
    const q = [
      { id: 'a', joinedAt: 1 },
      { id: 'b', joinedAt: 2 },
      { id: 'c', joinedAt: 3 },
    ];
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    const r = pickTwoRandomForPairing(q);
    vi.restoreAllMocks();
    expect(r).not.toBeNull();
    expect(r!.pair[0].id).toBe('a');
    expect(r!.pair[1].id).toBe('b');
    expect(r!.rest.map((e) => e.id)).toEqual(['c']);
  });
});

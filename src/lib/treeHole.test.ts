import { describe, expect, it } from 'vitest';
import {
  categoryForNewMessage,
  filterTreeHoleMessages,
  type TreeHoleMessage,
} from './treeHole';

const sample: TreeHoleMessage[] = [
  { id: 'a', author: 'A', text: 't1', time: '10:00', category: 1 },
  { id: 'b', author: 'B', text: 't2', time: '10:01', category: 2 },
  { id: 'c', author: 'C', text: 't3', time: '10:02' },
];

describe('filterTreeHoleMessages', () => {
  it('tab 0 returns all', () => {
    expect(filterTreeHoleMessages(sample, 0)).toHaveLength(3);
  });

  it('tab 1–3 filters by category', () => {
    expect(filterTreeHoleMessages(sample, 1).map((m) => m.id)).toEqual(['a']);
    expect(filterTreeHoleMessages(sample, 2).map((m) => m.id)).toEqual(['b']);
    expect(filterTreeHoleMessages(sample, 3)).toHaveLength(0);
  });
});

describe('categoryForNewMessage', () => {
  it('defaults to element when on tab 全部', () => {
    expect(categoryForNewMessage(0)).toBe(1);
  });

  it('matches current tab for 1–3', () => {
    expect(categoryForNewMessage(1)).toBe(1);
    expect(categoryForNewMessage(2)).toBe(2);
    expect(categoryForNewMessage(3)).toBe(3);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearUserDataOnLogout, MATCH_COUNT_STORAGE_KEY } from './logoutClear';
import { TREEHOLE_MESSAGES_STORAGE_KEY } from './treeHole';

function createMemoryStorage() {
  const m: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in m ? m[k]! : null),
    setItem: (k: string, v: string) => {
      m[k] = v;
    },
    removeItem: (k: string) => {
      delete m[k];
    },
    _m: m,
  };
}

describe('clearUserDataOnLogout', () => {
  const ls = createMemoryStorage();
  const ss = createMemoryStorage();

  beforeEach(() => {
    Object.keys(ls._m).forEach((k) => delete ls._m[k]);
    Object.keys(ss._m).forEach((k) => delete ss._m[k]);
    vi.stubGlobal('localStorage', ls as unknown as Storage);
    vi.stubGlobal('sessionStorage', ss as unknown as Storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('removes profile, match count, queue and session keys', () => {
    ls.setItem('astral-veil-profile', '{"phone":"1"}');
    ls.setItem(MATCH_COUNT_STORAGE_KEY, '3');
    ls.setItem('astral-veil-match-queue-v1', '[]');
    ls.setItem(TREEHOLE_MESSAGES_STORAGE_KEY, '[]');
    ss.setItem('astral-veil-match-session', 'sid-1');

    clearUserDataOnLogout();

    expect(ls.getItem('astral-veil-profile')).toBeNull();
    expect(ls.getItem(MATCH_COUNT_STORAGE_KEY)).toBeNull();
    expect(ls.getItem(TREEHOLE_MESSAGES_STORAGE_KEY)).toBeNull();
    expect(ls.getItem('astral-veil-match-queue-v1')).toBeNull();
    expect(ss.getItem('astral-veil-match-session')).toBeNull();
  });
});

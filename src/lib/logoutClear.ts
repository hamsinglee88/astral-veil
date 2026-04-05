import { clearMatchQueueStorage } from './matchQueue';
import { TREEHOLE_MESSAGES_STORAGE_KEY } from './treeHole';
import { clearProfile } from './userProfile';

/** 与匹配页「累计匹配次数」共用，须与读写处一致 */
export const MATCH_COUNT_STORAGE_KEY = 'astral-veil-match-count';

/**
 * FR-A3：注销时清除本设备用户档案及与本账号相关的本地演示数据。
 */
export function clearUserDataOnLogout(): void {
  clearProfile();
  try {
    localStorage.removeItem(MATCH_COUNT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(TREEHOLE_MESSAGES_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  clearMatchQueueStorage();
}

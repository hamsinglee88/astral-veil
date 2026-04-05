/**
 * 树洞群聊（共享房间）— FR-T1～FR-T3；MVP 会话数据存 localStorage。
 */

export const TREEHOLE_MESSAGES_STORAGE_KEY = 'astral-veil-treehole-messages-v1';

/** Tab：0 全部，1 元素，2 午夜，3 梦境空间 */
export type TreeHoleTabIndex = 0 | 1 | 2 | 3;

export interface TreeHoleMessage {
  id: string;
  author: string;
  text: string;
  self?: boolean;
  time: string;
  /** 分区：1=元素 2=午夜 3=梦境；缺省时仅出现在「全部」 */
  category?: 1 | 2 | 3;
}

export function filterTreeHoleMessages(
  messages: TreeHoleMessage[],
  tabIndex: number,
): TreeHoleMessage[] {
  if (tabIndex === 0) return messages;
  if (tabIndex < 1 || tabIndex > 3) return messages;
  return messages.filter((m) => m.category === tabIndex);
}

/** 发送时：在「全部」下默认归入元素分区，与单 Tab 一致 */
export function categoryForNewMessage(tabIndex: TreeHoleTabIndex): 1 | 2 | 3 {
  return tabIndex === 0 ? 1 : tabIndex;
}

export function loadTreeHoleMessages(): TreeHoleMessage[] | null {
  try {
    const raw = localStorage.getItem(TREEHOLE_MESSAGES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as TreeHoleMessage[];
  } catch {
    return null;
  }
}

export function saveTreeHoleMessages(messages: TreeHoleMessage[]): void {
  try {
    localStorage.setItem(TREEHOLE_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore quota */
  }
}

export const TREEHOLE_SEED_MESSAGES: TreeHoleMessage[] = [
  {
    id: '1',
    author: '星尘旅人',
    text: '有人也在等水逆结束吗？今晚想听大家说一句安心的话。',
    time: '22:01',
    category: 1,
  },
  {
    id: '2',
    author: '匿名水母',
    text: '群聊就像轨道交会——不必认识彼此全貌，也能共振一瞬。',
    time: '22:04',
    category: 2,
  },
  {
    id: '3',
    author: '梦境信使',
    text: '在梦境空间留一句晚安吧，宇宙会替你签收。',
    time: '22:08',
    category: 3,
  },
];

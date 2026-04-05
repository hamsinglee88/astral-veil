/** 匹配队列：多标签页通过 BroadcastChannel + localStorage 协调，随机两两配对 */

const STORAGE_KEY = 'astral-veil-match-queue-v1';
const CHANNEL = 'astral-veil-match';

export interface QueueEntry {
  id: string;
  joinedAt: number;
}

export interface MatchPairEvent {
  selfId: string;
  partnerId: string;
  /** 为演示生成的对方昵称 */
  partnerNickname: string;
  /** 为演示生成的对方星座标签 */
  partnerZodiacLabel: string;
}

const MOCK_NAMES = [
  '午夜寻路人',
  '星云漫游者',
  '静默观测者',
  '潮汐捕梦人',
  '虚空回信员',
];
const MOCK_SIGNS = ['天蝎座', '双鱼座', '天秤座', '射手座', '水瓶座'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function readQueue(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueueEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(q: QueueEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
  notifyQueueBump();
}

function notifyQueueBump(): void {
  const ch = new BroadcastChannel(CHANNEL);
  ch.postMessage({ type: 'queue-bump' });
  ch.close();
}

/** 跨标签页收到队列变更后再尝试配对 */
export function tryPairFromQueue(): void {
  tryPair();
}

/**
 * 从队列中随机选出两人配对（FR-M3）；剩余条目原序保留在 rest。
 * 导出供单元测试。
 */
export function pickTwoRandomForPairing(entries: QueueEntry[]): {
  pair: [QueueEntry, QueueEntry];
  rest: QueueEntry[];
} | null {
  const n = entries.length;
  if (n < 2) return null;
  let i = Math.floor(Math.random() * n);
  let j = Math.floor(Math.random() * (n - 1));
  if (j >= i) j += 1;
  const a = entries[i]!;
  const b = entries[j]!;
  // 按索引剔除两人，避免 id 偶发重复时 filter 误删多条同 id
  const rest = entries.filter((_, idx) => idx !== i && idx !== j);
  return { pair: [a, b], rest };
}

function tryPair(): void {
  const q = readQueue();
  const picked = pickTwoRandomForPairing(q);
  if (!picked) return;

  const [a, b] = picked.pair;
  writeQueue(picked.rest);

  const ch = new BroadcastChannel(CHANNEL);
  const payloadA: MatchPairEvent = {
    selfId: a.id,
    partnerId: b.id,
    partnerNickname: randomPick(MOCK_NAMES),
    partnerZodiacLabel: randomPick(MOCK_SIGNS),
  };
  const payloadB: MatchPairEvent = {
    selfId: b.id,
    partnerId: a.id,
    partnerNickname: randomPick(MOCK_NAMES),
    partnerZodiacLabel: randomPick(MOCK_SIGNS),
  };
  ch.postMessage({ type: 'paired', ...payloadA });
  ch.postMessage({ type: 'paired', ...payloadB });
  ch.close();
}

/** 加入队列并尝试配对；返回本次会话 id */
export function joinMatchQueue(sessionId: string): void {
  const q = readQueue();
  if (!q.some((e) => e.id === sessionId)) {
    q.push({ id: sessionId, joinedAt: Date.now() });
    writeQueue(q);
  }
  tryPair();
}

export function leaveMatchQueue(sessionId: string): void {
  const q = readQueue().filter((e) => e.id !== sessionId);
  writeQueue(q);
}

/** 任一队列入队后通知所有标签页再尝试配对 */
export function subscribeQueueBump(onBump: () => void): () => void {
  const ch = new BroadcastChannel(CHANNEL);
  const handler = (e: MessageEvent) => {
    if (e.data?.type === 'queue-bump') onBump();
  };
  ch.addEventListener('message', handler);
  return () => {
    ch.removeEventListener('message', handler);
    ch.close();
  };
}

export function subscribeMatch(
  sessionId: string,
  onPaired: (ev: MatchPairEvent) => void,
): () => void {
  const ch = new BroadcastChannel(CHANNEL);
  const handler = (msg: MessageEvent) => {
    const d = msg.data as { type?: string } & Partial<MatchPairEvent>;
    if (d.type !== 'paired' || d.selfId !== sessionId) return;
    onPaired({
      selfId: d.selfId!,
      partnerId: d.partnerId!,
      partnerNickname: d.partnerNickname!,
      partnerZodiacLabel: d.partnerZodiacLabel!,
    });
  };
  ch.addEventListener('message', handler);
  return () => {
    ch.removeEventListener('message', handler);
    ch.close();
  };
}

export function getOrCreateSessionId(): string {
  const k = 'astral-veil-match-session';
  let id = sessionStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(k, id);
  }
  return id;
}

/** 注销时清除匹配队列演示数据与会话 ID */
export function clearMatchQueueStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem('astral-veil-match-session');
  } catch {
    /* ignore */
  }
}

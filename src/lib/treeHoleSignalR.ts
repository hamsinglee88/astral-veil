import { HubConnectionBuilder, type HubConnection } from '@microsoft/signalr';
import type { TreeHoleMessage } from './treeHole';

/** 与后端星河大厅一致；见 architecture-signalr-realtime.md */
export const TREE_HOLE_LOBBY_ROOM_ID = 'lobby';

export type TreeHoleRealtimePayload = {
  id: string;
  author: string;
  text: string;
  category: number;
  time: string;
  self: boolean;
};

/** 兼容 SignalR 序列化 PascalCase 与异常负载，避免更新状态时抛错白屏 */
export function normalizeTreeHoleRealtimePayload(raw: unknown): TreeHoleRealtimePayload | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? o.Id ?? '').trim();
  const text = String(o.text ?? o.Text ?? '').trim();
  if (!id || !text) return null;
  const author = String(o.author ?? o.Author ?? '匿名');
  const catRaw = o.category ?? o.Category;
  const category =
    typeof catRaw === 'number' && catRaw >= 1 && catRaw <= 3
      ? catRaw
      : Number.parseInt(String(catRaw), 10);
  const safeCategory = Number.isFinite(category) && category >= 1 && category <= 3 ? category : 1;
  const time = String(o.time ?? o.Time ?? new Date().toISOString());
  const self = Boolean(o.self ?? o.Self);
  return { id, author, text, category: safeCategory, time, self };
}

/** 兼容 SignalR 序列化 PascalCase 与异常负载，避免 setState 读 undefined 导致白屏 */
export function parseTreeHoleRealtimePayload(raw: unknown): TreeHoleRealtimePayload | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = (o.id ?? o.Id) as string | undefined;
  const author = (o.author ?? o.Author) as string | undefined;
  const text = (o.text ?? o.Text) as string | undefined;
  const category = (o.category ?? o.Category) as number | undefined;
  const time = (o.time ?? o.Time) as string | undefined;
  const self = Boolean(o.self ?? o.Self);
  if (!id || !author || !text || time == null || category == null || Number.isNaN(Number(category))) {
    return null;
  }
  return {
    id,
    author,
    text,
    category: Number(category),
    time,
    self,
  };
}

/** 与 `VITE_USE_DOTNET_API` 联调时启用树洞 SignalR（同源经 Vite `/hubs` 代理）。 */
export function isTreeHoleRealtimeEnabled(): boolean {
  const v = import.meta.env.VITE_USE_DOTNET_API;
  return v === 'true' || v === '1';
}

/** 将服务端 UTC ISO 时间转为本地 HH:mm，供气泡展示。 */
export function isoUtcToHHmm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function realtimePayloadToMessage(p: TreeHoleRealtimePayload): TreeHoleMessage {
  return {
    id: p.id,
    author: p.author,
    text: p.text,
    self: p.self,
    time: isoUtcToHHmm(p.time),
    category: p.category as 1 | 2 | 3,
  };
}

/**
 * 建立 TreeHole Hub 会话：JoinRoom + 订阅 NewMessage。
 * Story 6.2 起若改为 REST 写库后再广播，仍可使用同一 `NewMessage` 形状。
 */
export async function connectTreeHoleRealtime(onNewMessage: (p: TreeHoleRealtimePayload) => void): Promise<{
  send: (text: string, category: number) => Promise<void>;
  disconnect: () => Promise<void>;
}> {
  const url = `${window.location.origin}/hubs/treehole`;
  const conn: HubConnection = new HubConnectionBuilder()
    .withUrl(url)
    .withAutomaticReconnect()
    .build();

  await conn.start();
  await conn.invoke('JoinRoom', TREE_HOLE_LOBBY_ROOM_ID);

  const handler = (raw: unknown) => {
    const payload = normalizeTreeHoleRealtimePayload(raw);
    if (payload) onNewMessage(payload);
  };
  conn.on('NewMessage', handler);

  return {
    send: (text: string, category: number) =>
      conn.invoke('SendMessage', TREE_HOLE_LOBBY_ROOM_ID, text, category),
    disconnect: async () => {
      conn.off('NewMessage', handler);
      await conn.stop();
    },
  };
}

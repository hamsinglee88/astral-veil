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

  const handler = (payload: TreeHoleRealtimePayload) => onNewMessage(payload);
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

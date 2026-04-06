/**
 * 生成客户端消息 id。`crypto.randomUUID()` 需[安全上下文](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)；
 * 通过局域网 IP 访问 `http://192.168.*:3000` 时不可用，会抛错导致 React 白屏。
 */
export function createClientMessageId(): string {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    /* 非安全上下文等 */
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

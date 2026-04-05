/**
 * NFR1：摘要中不得完整展示手机号，中间 4 位以掩码代替（11 位大陆手机）。
 * 非 11 位数字时做降级展示，避免泄露完整输入。
 */
export function maskCnMobilePhone(phone: string): string {
  const d = phone.trim().replace(/\D/g, '');
  if (d.length === 11) {
    return `${d.slice(0, 3)}****${d.slice(7)}`;
  }
  if (d.length > 4) {
    return `${d.slice(0, 2)}****${d.slice(-4)}`;
  }
  return '****';
}

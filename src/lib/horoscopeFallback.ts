import type { HoroscopePayload } from './horoscopeTypes';
import type { ZodiacId } from './zodiac';
import { getZodiacLabel } from './zodiac';

/** 无 API Key 或请求失败时的本地兜底文案 */
export function buildFallbackHoroscope(zodiacId: ZodiacId, isoDate: string): HoroscopePayload {
  const label = getZodiacLabel(zodiacId);
  const d = new Date(isoDate);
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  return {
    moonNote: `${md} — 月亮行经你的内在宫位，适合倾听直觉。`,
    insight: `亲爱的${label}，今日星盘强调内在节奏。你不必向外界证明什么，先与自己和解；午后灵感可能以碎片形式出现，随手记下即可。`,
    luckyColorName: '深空紫罗兰',
    luckyColorHex: '#4B3C6E',
    luckyNumber: String((zodiacId.length + d.getDate()) % 90 + 10),
    luckyItem: '一枚旧硬币',
    dimensions: {
      love: { rating: 4, text: '温柔对话胜过激烈表态。' },
      career: { rating: 3, text: '稳步推进，避免冲动承诺。' },
      energy: { rating: 4, text: '身体需要拉伸与补水。' },
    },
  };
}

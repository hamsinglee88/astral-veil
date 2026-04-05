/** 根据公历月日计算西方星座（中文名） */
export type ZodiacId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

const ZODIAC_LABELS: Record<ZodiacId, string> = {
  aries: '白羊座',
  taurus: '金牛座',
  gemini: '双子座',
  cancer: '巨蟹座',
  leo: '狮子座',
  virgo: '处女座',
  libra: '天秤座',
  scorpio: '天蝎座',
  sagittarius: '射手座',
  capricorn: '摩羯座',
  aquarius: '水瓶座',
  pisces: '双鱼座',
};

const ZODIAC_RULERS: Record<ZodiacId, string> = {
  aries: '火星',
  taurus: '金星',
  gemini: '水星',
  cancer: '月亮',
  leo: '太阳',
  virgo: '水星',
  libra: '金星',
  scorpio: '冥王星',
  sagittarius: '木星',
  capricorn: '土星',
  aquarius: '天王星',
  pisces: '海王星',
};

/** 边界为 [月, 日] 含当日 */
const RANGES: { id: ZodiacId; start: [number, number]; end: [number, number] }[] = [
  { id: 'capricorn', start: [12, 22], end: [1, 19] },
  { id: 'aquarius', start: [1, 20], end: [2, 18] },
  { id: 'pisces', start: [2, 19], end: [3, 20] },
  { id: 'aries', start: [3, 21], end: [4, 19] },
  { id: 'taurus', start: [4, 20], end: [5, 20] },
  { id: 'gemini', start: [5, 21], end: [6, 20] },
  { id: 'cancer', start: [6, 21], end: [7, 22] },
  { id: 'leo', start: [7, 23], end: [8, 22] },
  { id: 'virgo', start: [8, 23], end: [9, 22] },
  { id: 'libra', start: [9, 23], end: [10, 22] },
  { id: 'scorpio', start: [10, 23], end: [11, 21] },
  { id: 'sagittarius', start: [11, 22], end: [12, 21] },
];

function dayOfYear(month: number, day: number): number {
  const days = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return days[month - 1] + day;
}

export function getZodiacFromMonthDay(month: number, day: number): ZodiacId {
  const d = dayOfYear(month, day);
  // 摩羯跨年：12/22 - 12/31 或 1/1 - 1/19
  const capStart = dayOfYear(12, 22);
  const capEnd = dayOfYear(1, 19);
  if (d >= capStart || d <= capEnd) return 'capricorn';

  for (const r of RANGES) {
    if (r.id === 'capricorn') continue;
    const a = dayOfYear(r.start[0], r.start[1]);
    const b = dayOfYear(r.end[0], r.end[1]);
    if (d >= a && d <= b) return r.id;
  }
  return 'capricorn';
}

export function getZodiacLabel(id: ZodiacId): string {
  return ZODIAC_LABELS[id];
}

export function getRulingPlanet(id: ZodiacId): string {
  return ZODIAC_RULERS[id];
}

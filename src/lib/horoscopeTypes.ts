/** 运势页 UI 所需的结构化数据（由 AI JSON 或本地兜底填充） */
export interface HoroscopePayload {
  /** 副标题：月相 / 天象一句 */
  moonNote: string;
  /** 今日启示正文 */
  insight: string;
  luckyColorName: string;
  luckyColorHex: string;
  luckyNumber: string;
  luckyItem: string;
  dimensions: {
    love: { rating: number; text: string };
    career: { rating: number; text: string };
    energy: { rating: number; text: string };
  };
}

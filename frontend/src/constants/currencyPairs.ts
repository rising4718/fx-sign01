// 型定義をローカルで定義（import問題回避）
type CurrencyPair = 'USDJPY' | 'EURUSD' | 'GBPUSD' | 'AUDUSD';

interface CurrencyInfo {
  name: CurrencyPair;
  displayName: string;
  pipValue: number;
  decimalPlaces: number;
  sessionTimes: {
    rangeStartHour: number;
    rangeStartMinute: number;
    rangeEndHour: number; 
    rangeEndMinute: number;
    tradingEndHour: number;
    tradingEndMinute: number;
  };
}

export const CURRENCY_PAIRS: Record<CurrencyPair, CurrencyInfo> = {
  USDJPY: {
    name: 'USDJPY',
    displayName: 'USD/JPY',
    pipValue: 0.01,
    decimalPlaces: 3,
    sessionTimes: {
      rangeStartHour: 9,   // 東京時間 9:00
      rangeStartMinute: 0,
      rangeEndHour: 9,     // 9:45
      rangeEndMinute: 45,
      tradingEndHour: 11,  // 11:00
      tradingEndMinute: 0
    }
  },
  EURUSD: {
    name: 'EURUSD', 
    displayName: 'EUR/USD',
    pipValue: 0.0001,
    decimalPlaces: 5,
    sessionTimes: {
      rangeStartHour: 8,   // ロンドン時間 8:00 UTC
      rangeStartMinute: 0,
      rangeEndHour: 8,     // 8:45 UTC
      rangeEndMinute: 45,
      tradingEndHour: 10,  // 10:00 UTC
      tradingEndMinute: 0
    }
  },
  GBPUSD: {
    name: 'GBPUSD',
    displayName: 'GBP/USD', 
    pipValue: 0.0001,
    decimalPlaces: 5,
    sessionTimes: {
      rangeStartHour: 8,   // ロンドン時間 8:00 UTC
      rangeStartMinute: 0,
      rangeEndHour: 8,     // 8:45 UTC
      rangeEndMinute: 45,
      tradingEndHour: 10,  // 10:00 UTC
      tradingEndMinute: 0
    }
  },
  AUDUSD: {
    name: 'AUDUSD',
    displayName: 'AUD/USD',
    pipValue: 0.0001,
    decimalPlaces: 5,
    sessionTimes: {
      rangeStartHour: 21,  // シドニー時間 21:00 UTC (翌日7:00 AEDT)
      rangeStartMinute: 0,
      rangeEndHour: 21,    // 21:45 UTC
      rangeEndMinute: 45,
      tradingEndHour: 23,  // 23:00 UTC
      tradingEndMinute: 0
    }
  }
};

export const DEFAULT_SELECTED_PAIRS: CurrencyPair[] = ['USDJPY', 'EURUSD'];

// 現在時刻に基づいて最も適切なセッションの通貨ペアを取得
export const getCurrentSessionPairs = (): CurrencyPair[] => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  
  // 東京時間 (JST = UTC+9): 0:00-2:00 UTC
  if (utcHour >= 0 && utcHour < 2) {
    return ['USDJPY', 'AUDUSD'];
  }
  // ロンドン時間 (GMT = UTC): 8:00-10:00 UTC  
  else if (utcHour >= 8 && utcHour < 10) {
    return ['EURUSD', 'GBPUSD'];
  }
  // ニューヨーク時間 (EST = UTC-5): 13:00-15:00 UTC
  else if (utcHour >= 13 && utcHour < 15) {
    return ['EURUSD', 'GBPUSD'];
  }
  // シドニー時間 (AEDT = UTC+11): 21:00-23:00 UTC
  else if (utcHour >= 21 && utcHour < 23) {
    return ['AUDUSD'];
  }
  
  return DEFAULT_SELECTED_PAIRS;
};

// 通貨ペアの現在のセッション状態を取得
export const getSessionStatus = (pair: CurrencyPair): {
  isRangeActive: boolean;
  isTradingTime: boolean;
  nextSessionTime: Date | null;
} => {
  const pairInfo = CURRENCY_PAIRS[pair];
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const currentMinutes = utcHour * 60 + utcMinute;
  
  const sessionTimes = pairInfo.sessionTimes;
  const rangeStart = sessionTimes.rangeStartHour * 60 + sessionTimes.rangeStartMinute;
  const rangeEnd = sessionTimes.rangeEndHour * 60 + sessionTimes.rangeEndMinute;
  const tradingEnd = sessionTimes.tradingEndHour * 60 + sessionTimes.tradingEndMinute;
  
  const isRangeActive = currentMinutes >= rangeStart && currentMinutes <= rangeEnd;
  const isTradingTime = currentMinutes > rangeEnd && currentMinutes < tradingEnd;
  
  // 次のセッション開始時間を計算
  let nextSessionTime: Date | null = null;
  if (!isRangeActive && !isTradingTime) {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(sessionTimes.rangeStartHour, sessionTimes.rangeStartMinute, 0, 0);
    nextSessionTime = tomorrow;
  }
  
  return {
    isRangeActive,
    isTradingTime, 
    nextSessionTime
  };
};
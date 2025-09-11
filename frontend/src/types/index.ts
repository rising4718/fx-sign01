// FXに関連する型定義

export interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TORBSignal {
  type: 'BUY' | 'SELL';
  price: number;
  time: string;
  target: number;
  stopLoss: number;
  rangeHigh: number;
  rangeLow: number;
}

export interface TORBRange {
  high: number;
  low: number;
  width: number;
  startTime: string;
  endTime: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  timestamp: string;
  change: number;
  changePercent: number;
}

// API レスポンス型
export interface FXApiResponse {
  symbol: string;
  data: OHLCData[];
  lastUpdated: string;
}

// 通貨ペア型
export type CurrencyPair = 'USDJPY' | 'EURUSD' | 'GBPUSD' | 'AUDUSD';

export interface CurrencyInfo {
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

// 設定型
export interface TORBSettings {
  rangeStartHour: number; // 9
  rangeStartMinute: number; // 0
  rangeEndHour: number; // 9
  rangeEndMinute: number; // 45
  tradingEndHour: number; // 11
  tradingEndMinute: number; // 0
  minRangeWidth: number; // 15 pips
  maxRangeWidth: number; // 50 pips
  profitMultiplier: number; // 1.5
  stopLossBuffer: number; // 5 pips
  selectedPairs: CurrencyPair[]; // 複数通貨ペア対応
}

// 通貨ペア別のTORB状態
export interface CurrencyPairState {
  pair: CurrencyPair;
  currentRange: TORBRange | null;
  activeSignal: TORBSignal | null;
  signalStatus: 'ACTIVE' | 'PROFIT' | 'LOSS' | null;
  rsiValue: number | null;
  marketData: MarketData | null;
}

// パターン分析関連型（Phase 2）
export interface PatternMatch {
  date: string;
  similarity: number;
  patternType: 'FLAG' | 'PENNANT' | 'TRIANGLE' | 'RANGE_BREAKOUT';
  prediction: {
    direction: 'UP' | 'DOWN';
    probability: number;
    targetPips: number;
    timeframe: number; // minutes
  };
  confidence: number; // 0-5 stars
}

export interface PatternAnalysis {
  currentPattern: PatternMatch | null;
  similarPatterns: PatternMatch[];
  prediction: {
    bullishProbability: number;
    bearishProbability: number;
    expectedRange: {
      high: number;
      low: number;
    };
  };
}
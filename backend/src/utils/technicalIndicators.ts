import { CandleData } from '../types';

/**
 * ATR (Average True Range) 計算
 */
export function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length < Math.max(period, 2)) {
    return 0;
  }

  const trueRanges: number[] = [];

  // True Range計算
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
  }

  // ATR = Simple Moving Average of True Ranges
  const recentTR = trueRanges.slice(-period);
  const atr = recentTR.reduce((sum, tr) => sum + tr, 0) / recentTR.length;
  
  return parseFloat(atr.toFixed(5));
}

/**
 * RSI (Relative Strength Index) 計算
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // neutral RSI if not enough data
  }

  const gains: number[] = [];
  const losses: number[] = [];

  // 価格変化を計算
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // 平均上昇・下降を計算
  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return parseFloat(rsi.toFixed(2));
}

/**
 * スイング高値/安値検出
 */
export function findSwingLevels(candles: CandleData[], lookback: number = 5): {
  swingHigh: number | null;
  swingLow: number | null;
} {
  if (candles.length < lookback * 2 + 1) {
    return { swingHigh: null, swingLow: null };
  }

  let swingHigh: number | null = null;
  let swingLow: number | null = null;

  // 直近のスイング高値/安値を検索
  for (let i = candles.length - lookback - 1; i >= lookback; i--) {
    const current = candles[i];
    
    // スイング高値チェック
    let isSwingHigh = true;
    for (let j = 1; j <= lookback; j++) {
      if (current.high <= candles[i - j].high || current.high <= candles[i + j].high) {
        isSwingHigh = false;
        break;
      }
    }
    
    if (isSwingHigh && swingHigh === null) {
      swingHigh = current.high;
    }

    // スイング安値チェック
    let isSwingLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (current.low >= candles[i - j].low || current.low >= candles[i + j].low) {
        isSwingLow = false;
        break;
      }
    }
    
    if (isSwingLow && swingLow === null) {
      swingLow = current.low;
    }

    // 両方見つかったら終了
    if (swingHigh !== null && swingLow !== null) {
      break;
    }
  }

  return { swingHigh, swingLow };
}

/**
 * セッション判定
 */
export function getCurrentSession(date: Date = new Date()): {
  name: 'tokyo' | 'london' | 'ny_early' | 'off';
  multiplier: number;
} {
  // JST時間に変換
  const jst = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  const hour = jst.getHours();
  
  if (hour >= 9 && hour < 15) {
    return { name: 'tokyo', multiplier: 1.5 };
  }
  if (hour >= 16 && hour < 24) {
    return { name: 'london', multiplier: 2.5 };
  }
  if (hour >= 22 || hour < 2) {
    return { name: 'ny_early', multiplier: 2.0 };
  }
  
  return { name: 'off', multiplier: 1.5 };
}

/**
 * MACD ヒストグラム計算（簡易版）
 */
export function calculateMACDHistogram(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26): number {
  if (prices.length < slowPeriod) {
    return 0;
  }

  // EMA計算
  const calculateEMA = (data: number[], period: number): number => {
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  };

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  return fastEMA - slowEMA; // 簡易ヒストグラム（シグナルライン差分省略）
}

/**
 * pips変換ユーティリティ
 */
export function priceToPips(priceChange: number, symbol: string = 'USD/JPY'): number {
  // USD/JPY: 1 pip = 0.001
  // EUR/USD: 1 pip = 0.0001
  const pipValue = symbol === 'USD/JPY' ? 0.001 : 0.0001;
  return priceChange / pipValue;
}

export function pipsToPrice(pips: number, symbol: string = 'USD/JPY'): number {
  const pipValue = symbol === 'USD/JPY' ? 0.001 : 0.0001;
  return pips * pipValue;
}
import type { CandlestickData } from 'lightweight-charts';
import { type TORBSignal, type TORBRange, type TORBSettings } from '../types';

// デフォルトのTORB設定
export const DEFAULT_TORB_SETTINGS: TORBSettings = {
  rangeStartHour: 9,
  rangeStartMinute: 0,
  rangeEndHour: 9,
  rangeEndMinute: 45,
  tradingEndHour: 11,
  tradingEndMinute: 0,
  minRangeWidth: 15, // pips
  maxRangeWidth: 50, // pips
  profitMultiplier: 1.5,
  stopLossBuffer: 5, // pips
  selectedPairs: ['USDJPY'] // Default to USD/JPY
};

// 1pip = 0.01 (USD/JPY)
const PIP_VALUE = 0.01;

// TORBロジッククラス
export class TORBLogic {
  private settings: TORBSettings;
  private currentRange: TORBRange | null = null;
  private activeSignal: TORBSignal | null = null;

  constructor(settings: TORBSettings = DEFAULT_TORB_SETTINGS) {
    this.settings = settings;
  }

  // 東京時間のレンジを計算
  calculateTokyoRange(data: CandlestickData[], date: Date = new Date()): TORBRange | null {
    if (data.length === 0) return null;

    // 指定した日の9:00-9:45のデータを抽出
    const rangeStart = new Date(date);
    rangeStart.setHours(this.settings.rangeStartHour, this.settings.rangeStartMinute, 0, 0);
    
    const rangeEnd = new Date(date);
    rangeEnd.setHours(this.settings.rangeEndHour, this.settings.rangeEndMinute, 0, 0);

    const rangeStartTime = Math.floor(rangeStart.getTime() / 1000);
    const rangeEndTime = Math.floor(rangeEnd.getTime() / 1000);

    // レンジ期間内のデータを抽出
    const rangeData = data.filter(candle => {
      const candleTime = typeof candle.time === 'number' 
        ? candle.time 
        : typeof candle.time === 'string'
        ? new Date(candle.time).getTime() / 1000
        : new Date((candle.time as any).year, (candle.time as any).month - 1, (candle.time as any).day).getTime() / 1000;
      return candleTime >= rangeStartTime && candleTime <= rangeEndTime;
    });

    if (rangeData.length === 0) return null;

    // 高値と安値を計算
    let high = -Infinity;
    let low = Infinity;

    rangeData.forEach(candle => {
      high = Math.max(high, candle.high);
      low = Math.min(low, candle.low);
    });

    const width = (high - low) / PIP_VALUE; // pips単位

    // レンジ幅のフィルタリング
    if (width < this.settings.minRangeWidth || width > this.settings.maxRangeWidth) {
      return null;
    }

    const range: TORBRange = {
      high,
      low,
      width,
      startTime: rangeStart.toISOString(),
      endTime: rangeEnd.toISOString()
    };

    this.currentRange = range;
    return range;
  }

  // ブレイクアウトシグナルをチェック
  checkBreakoutSignal(
    currentPrice: number, 
    currentTime: Date,
    previousCandle?: CandlestickData,
    rsiValue?: number
  ): TORBSignal | null {
    if (!this.currentRange) return null;

    // 取引時間の確認（9:45-11:00）
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    
    const tradingStart = this.settings.rangeEndHour * 60 + this.settings.rangeEndMinute;
    const tradingEnd = this.settings.tradingEndHour * 60 + this.settings.tradingEndMinute;
    const currentMinutes = hour * 60 + minute;

    if (currentMinutes < tradingStart || currentMinutes >= tradingEnd) {
      return null;
    }

    const { high: rangeHigh, low: rangeLow } = this.currentRange;

    // 上向きブレイクアウト
    if (currentPrice > rangeHigh) {
      // RSIフィルター（オプション）
      if (rsiValue && rsiValue <= 55) return null;

      // 前日NYクローズとの比較（簡易版）
      const previousClose = previousCandle?.close || currentPrice;
      if (currentPrice <= previousClose * 0.999) return null; // 前日比でマイナス

      const breakoutDistance = currentPrice - rangeHigh;
      const targetPrice = currentPrice + (breakoutDistance * this.settings.profitMultiplier);
      const stopLossPrice = rangeLow - (this.settings.stopLossBuffer * PIP_VALUE);

      const signal: TORBSignal = {
        type: 'BUY',
        price: currentPrice,
        time: currentTime.toISOString(),
        target: Number(targetPrice.toFixed(3)),
        stopLoss: Number(stopLossPrice.toFixed(3)),
        rangeHigh,
        rangeLow
      };

      this.activeSignal = signal;
      return signal;
    }

    // 下向きブレイクアウト
    if (currentPrice < rangeLow) {
      // RSIフィルター（オプション）
      if (rsiValue && rsiValue >= 45) return null;

      // 前日NYクローズとの比較（簡易版）
      const previousClose = previousCandle?.close || currentPrice;
      if (currentPrice >= previousClose * 1.001) return null; // 前日比でプラス

      const breakoutDistance = rangeLow - currentPrice;
      const targetPrice = currentPrice - (breakoutDistance * this.settings.profitMultiplier);
      const stopLossPrice = rangeHigh + (this.settings.stopLossBuffer * PIP_VALUE);

      const signal: TORBSignal = {
        type: 'SELL',
        price: currentPrice,
        time: currentTime.toISOString(),
        target: Number(targetPrice.toFixed(3)),
        stopLoss: Number(stopLossPrice.toFixed(3)),
        rangeHigh,
        rangeLow
      };

      this.activeSignal = signal;
      return signal;
    }

    return null;
  }

  // 現在のレンジ情報を取得
  getCurrentRange(): TORBRange | null {
    return this.currentRange;
  }

  // アクティブシグナルを取得
  getActiveSignal(): TORBSignal | null {
    return this.activeSignal;
  }

  // シグナルをクリア
  clearSignal(): void {
    this.activeSignal = null;
  }

  // 利確・損切りのチェック
  checkSignalStatus(currentPrice: number): 'ACTIVE' | 'PROFIT' | 'LOSS' | null {
    if (!this.activeSignal) return null;

    const { type, target, stopLoss } = this.activeSignal;

    if (type === 'BUY') {
      if (currentPrice >= target) return 'PROFIT';
      if (currentPrice <= stopLoss) return 'LOSS';
    } else {
      if (currentPrice <= target) return 'PROFIT';
      if (currentPrice >= stopLoss) return 'LOSS';
    }

    return 'ACTIVE';
  }

  // RSI計算（14期間）
  calculateRSI(data: CandlestickData[], period: number = 14): number | null {
    if (data.length < period + 1) return null;

    const prices = data.slice(-period - 1).map(candle => candle.close);
    
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Number(rsi.toFixed(2));
  }

  // 設定の更新
  updateSettings(newSettings: Partial<TORBSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  // 設定の取得
  getSettings(): TORBSettings {
    return { ...this.settings };
  }
}

// シングルトンインスタンス
export const torbLogic = new TORBLogic();
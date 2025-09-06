import type { CandlestickData } from 'lightweight-charts';
import type {} from '../types';

// モックデータ生成関数
export const generateMockOHLCData = (
  startPrice: number = 150.0,
  count: number = 100,
  startTime: Date = new Date(Date.now() - count * 15 * 60 * 1000)
): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = startPrice;

  for (let i = 0; i < count; i++) {
    const time = new Date(startTime.getTime() + i * 15 * 60 * 1000);
    
    // ランダムな価格変動を生成（より現実的な動き）
    const volatility = 0.002; // 0.2%の変動幅
    const trend = (Math.random() - 0.5) * 0.001; // 軽微なトレンド
    const randomChange = (Math.random() - 0.5) * volatility;
    
    const open = currentPrice;
    const change = trend + randomChange;
    const close = open + change;
    
    // 高値・安値の計算
    const range = Math.abs(change) * (1 + Math.random());
    const high = Math.max(open, close) + range * Math.random();
    const low = Math.min(open, close) - range * Math.random();
    
    data.push({
      time: Math.floor(time.getTime() / 1000) as any, // Unix timestamp
      open: Number(open.toFixed(3)),
      high: Number(high.toFixed(3)),
      low: Number(low.toFixed(3)),
      close: Number(close.toFixed(3)),
    });
    
    currentPrice = close;
  }

  return data;
};

// 東京時間のモックデータ（9:00-11:00）
export const generateTokyoSessionData = (date: Date = new Date()): CandlestickData[] => {
  // 9:00 JST から開始
  const tokyoStart = new Date(date);
  tokyoStart.setHours(9, 0, 0, 0);
  
  // 2時間分（8本の15分足）
  const candleCount = 8;
  const basePrice = 150.0 + (Math.random() - 0.5) * 2; // 148-152の範囲
  
  return generateMockOHLCData(basePrice, candleCount, tokyoStart);
};

// TORB戦略用のレンジデータを含むモックデータ
export const generateTORBMockData = (): CandlestickData[] => {
  const data: CandlestickData[] = [];
  const basePrice = 150.0;
  const today = new Date();
  
  // 9:00から9:45まで（3本）- レンジ形成期間
  const rangeHigh = basePrice + 0.2;
  const rangeLow = basePrice - 0.2;
  
  for (let i = 0; i < 3; i++) {
    const time = new Date(today);
    time.setHours(9, i * 15, 0, 0);
    
    const open = basePrice + (Math.random() - 0.5) * 0.1;
    const close = basePrice + (Math.random() - 0.5) * 0.1;
    
    data.push({
      time: Math.floor(time.getTime() / 1000) as any,
      open: Number(open.toFixed(3)),
      high: Number(Math.min(rangeHigh, Math.max(open, close) + 0.05).toFixed(3)),
      low: Number(Math.max(rangeLow, Math.min(open, close) - 0.05).toFixed(3)),
      close: Number(close.toFixed(3)),
    });
  }
  
  // 9:45以降 - ブレイクアウト
  for (let i = 3; i < 8; i++) {
    const time = new Date(today);
    time.setHours(9, i * 15, 0, 0);
    
    const isBreakout = i === 3; // 最初のブレイクアウト
    let open = data[i - 1].close;
    let close: number;
    
    if (isBreakout) {
      // 上向きブレイクアウトをシミュレート
      close = rangeHigh + 0.1 + Math.random() * 0.2;
    } else {
      close = open + (Math.random() - 0.3) * 0.1; // 継続的な上昇
    }
    
    const high = Math.max(open, close) + Math.random() * 0.05;
    const low = Math.min(open, close) - Math.random() * 0.02;
    
    data.push({
      time: Math.floor(time.getTime() / 1000) as any,
      open: Number(open.toFixed(3)),
      high: Number(high.toFixed(3)),
      low: Number(low.toFixed(3)),
      close: Number(close.toFixed(3)),
    });
  }
  
  return data;
};

// リアルタイム更新用のモックデータ
export const generateNextCandle = (lastCandle: CandlestickData): CandlestickData => {
  const lastTime = typeof lastCandle.time === 'number' 
    ? lastCandle.time 
    : typeof lastCandle.time === 'string'
    ? new Date(lastCandle.time).getTime() / 1000
    : new Date((lastCandle.time as any).year, (lastCandle.time as any).month - 1, (lastCandle.time as any).day).getTime() / 1000;
  const nextTime = lastTime + (15 * 60); // 15分後
  
  const volatility = 0.001;
  const change = (Math.random() - 0.5) * volatility;
  const open = lastCandle.close;
  const close = open + change;
  
  const range = Math.abs(change) * (1 + Math.random());
  const high = Math.max(open, close) + range * Math.random() * 0.5;
  const low = Math.min(open, close) - range * Math.random() * 0.5;
  
  return {
    time: nextTime as any,
    open: Number(open.toFixed(3)),
    high: Number(high.toFixed(3)),
    low: Number(low.toFixed(3)),
    close: Number(close.toFixed(3)),
  };
};
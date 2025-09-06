import { useState, useEffect, useCallback } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import type { MarketData } from '../types';
import { fxApiService } from '../services/fxApi';
import { generateTORBMockData, generateNextCandle } from '../utils/mockData';

interface UseFxDataReturn {
  chartData: CandlestickData[];
  currentPrice: MarketData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useFxData = (symbol: string = 'USDJPY'): UseFxDataReturn => {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ更新関数
  const refreshData = useCallback(async () => {
    try {
      setError(null);
      
      // 現在価格を取得
      const price = await fxApiService.getCurrentPrice(symbol);
      setCurrentPrice(price);

      // 履歴データを取得
      const historical = await fxApiService.getHistoricalData(symbol, '15m', 100);
      setChartData(historical);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データ取得エラー');
      console.error('FX Data Error:', err);
      
      // エラー時はモックデータを使用
      const mockData = generateTORBMockData();
      setChartData(mockData);
      
      // モック価格データ
      setCurrentPrice({
        symbol,
        price: 150.123,
        timestamp: new Date().toISOString(),
        change: 0.045,
        changePercent: 0.03
      });
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  // 初期データ読み込み
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // リアルタイム更新の設定
  useEffect(() => {
    const handleRealTimeUpdate = (data: MarketData) => {
      setCurrentPrice(data);
      
      // 新しいローソク足データを生成（簡易版）
      setChartData(currentData => {
        if (currentData.length > 0) {
          const lastCandle = currentData[currentData.length - 1];
          const now = Math.floor(Date.now() / 1000);
          const lastTime = typeof lastCandle.time === 'number' ? lastCandle.time : new Date(lastCandle.time).getTime() / 1000;
          
          // 15分経過していたら新しいローソク足を追加
          if (now - lastTime >= 15 * 60) {
            const nextCandle = generateNextCandle(lastCandle);
            return [...currentData, nextCandle];
          } else {
            // 現在のローソク足を更新
            const updatedCandle = {
              ...lastCandle,
              close: data.price,
              high: Math.max(lastCandle.high, data.price),
              low: Math.min(lastCandle.low, data.price)
            };
            return [...currentData.slice(0, -1), updatedCandle];
          }
        }
        return currentData;
      });
    };

    // リアルタイム更新を開始
    fxApiService.connectRealTimeUpdates(handleRealTimeUpdate);

    // クリーンアップ
    return () => {
      fxApiService.disconnectRealTimeUpdates();
    };
  }, []);

  return {
    chartData,
    currentPrice,
    isLoading,
    error,
    refreshData
  };
};
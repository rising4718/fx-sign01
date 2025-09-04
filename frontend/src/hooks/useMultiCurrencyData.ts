import { useState, useEffect, useCallback } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { CurrencyPair, CurrencyPairState, MarketData } from '../types';
import { fxApiService } from '../services/fxApi';
import { CURRENCY_PAIRS } from '../constants/currencyPairs';

interface UseMultiCurrencyDataReturn {
  currencyStates: Map<CurrencyPair, CurrencyPairState>;
  activePair: CurrencyPair;
  setActivePair: (pair: CurrencyPair) => void;
  selectedPairs: CurrencyPair[];
  setSelectedPairs: (pairs: CurrencyPair[]) => void;
  chartData: CandlestickData[];
  isLoading: boolean;
  error: string | null;
}

export const useMultiCurrencyData = (
  initialPairs: CurrencyPair[] = ['USDJPY', 'EURUSD']
): UseMultiCurrencyDataReturn => {
  const [currencyStates, setCurrencyStates] = useState<Map<CurrencyPair, CurrencyPairState>>(new Map());
  const [selectedPairs, setSelectedPairs] = useState<CurrencyPair[]>(initialPairs);
  const [activePair, setActivePair] = useState<CurrencyPair>(initialPairs[0]);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期データを取得
  const fetchInitialData = useCallback(async (pairs: CurrencyPair[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newStates = new Map<CurrencyPair, CurrencyPairState>();
      
      // 各通貨ペアの履歴データと現在価格を並列取得
      const promises = pairs.map(async (pair) => {
        try {
          const [historicalData, marketData] = await Promise.all([
            fxApiService.getHistoricalData(pair, '15m', 100),
            fxApiService.getCurrentPrice(pair)
          ]);

          const state: CurrencyPairState = {
            pair,
            currentRange: null,
            activeSignal: null,
            signalStatus: null,
            rsiValue: null,
            marketData
          };

          newStates.set(pair, state);

          // アクティブペアのチャートデータを設定
          if (pair === activePair) {
            setChartData(historicalData);
          }

          return { pair, historicalData };
        } catch (pairError) {
          console.error(`Failed to fetch data for ${pair}:`, pairError);
          
          // エラー時のフォールバック
          const fallbackState: CurrencyPairState = {
            pair,
            currentRange: null,
            activeSignal: null, 
            signalStatus: null,
            rsiValue: null,
            marketData: null
          };
          
          newStates.set(pair, fallbackState);
          return { pair, historicalData: [] };
        }
      });

      await Promise.all(promises);
      setCurrencyStates(newStates);

    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError('初期データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [activePair]);

  // 価格データのリアルタイム更新
  const updateMarketData = useCallback(async () => {
    if (selectedPairs.length === 0) return;

    try {
      const pricesMap = await fxApiService.getMultiplePrices(selectedPairs);
      
      setCurrencyStates(prev => {
        const updated = new Map(prev);
        
        pricesMap.forEach((marketData, pair) => {
          const existingState = updated.get(pair);
          if (existingState) {
            updated.set(pair, {
              ...existingState,
              marketData
            });
          }
        });
        
        return updated;
      });

    } catch (err) {
      console.error('Failed to update market data:', err);
    }
  }, [selectedPairs]);

  // アクティブペアのチャートデータを更新
  const updateActiveChartData = useCallback(async () => {
    try {
      const newData = await fxApiService.getHistoricalData(activePair, '15m', 100);
      setChartData(newData);
    } catch (err) {
      console.error('Failed to update chart data:', err);
    }
  }, [activePair]);

  // 通貨ペア状態を更新
  const updateCurrencyState = useCallback((pair: CurrencyPair, updates: Partial<CurrencyPairState>) => {
    setCurrencyStates(prev => {
      const updated = new Map(prev);
      const existingState = updated.get(pair);
      
      if (existingState) {
        updated.set(pair, { ...existingState, ...updates });
      }
      
      return updated;
    });
  }, []);

  // 選択通貨ペア変更時の処理
  useEffect(() => {
    if (selectedPairs.length > 0) {
      // アクティブペアが選択されていない場合は最初のペアをアクティブにする
      if (!selectedPairs.includes(activePair)) {
        setActivePair(selectedPairs[0]);
      }
      
      fetchInitialData(selectedPairs);
    }
  }, [selectedPairs, fetchInitialData, activePair]);

  // アクティブペア変更時のチャートデータ更新
  useEffect(() => {
    if (selectedPairs.includes(activePair)) {
      updateActiveChartData();
    }
  }, [activePair, updateActiveChartData, selectedPairs]);

  // リアルタイム価格更新のポーリング
  useEffect(() => {
    if (selectedPairs.length === 0) return;

    const interval = setInterval(updateMarketData, 30000); // 30秒ごと
    
    // 初回実行
    updateMarketData();

    return () => clearInterval(interval);
  }, [updateMarketData]);

  // Cleanup
  useEffect(() => {
    return () => {
      fxApiService.disconnectRealTimeUpdates();
    };
  }, []);

  return {
    currencyStates,
    activePair,
    setActivePair,
    selectedPairs,
    setSelectedPairs,
    chartData,
    isLoading,
    error
  };
};
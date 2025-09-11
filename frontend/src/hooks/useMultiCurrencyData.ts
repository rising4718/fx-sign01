import { useState, useEffect, useCallback } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { type CurrencyPair, CurrencyPairState, MarketData } from '../types';
import { fxApiService } from '../services/fxApi';
import { CURRENCY_PAIRS } from '../constants/currencyPairs';
import { cacheService } from '../services/cacheService';

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
            fxApiService.getHistoricalData(pair, '15m', 7),
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
          console.error(`GMO API failed for ${pair}:`, pairError);
          throw pairError;
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

  // 🚀 Phase 4: リアルタイム価格更新（プロ仕様）
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

      console.log('💰 [Phase 4] 価格更新完了 - プロ仕様1秒更新');
    } catch (err) {
      console.error('❌ [Phase 4] 価格更新失敗:', err);
    }
  }, [selectedPairs]);

  // 🎯 Phase 4: 最新ローソク足のリアルタイム更新
  const updateCurrentCandle = useCallback(async () => {
    if (!activePair) return;

    try {
      const currentPrice = await fxApiService.getCurrentPrice(activePair);
      
      setChartData(prev => {
        if (prev.length === 0) return prev;
        
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        const lastCandle = updated[lastIndex];
        
        // 🔥 最新足のOHLC更新（プロ仕様）
        updated[lastIndex] = {
          ...lastCandle,
          close: currentPrice.ask,
          high: Math.max(lastCandle.high, currentPrice.ask),
          low: Math.min(lastCandle.low, currentPrice.bid),
          time: lastCandle.time // 時間は変更しない
        };
        
        return updated;
      });

      console.log('📈 [Phase 4] 最新ローソク足更新:', {
        pair: activePair,
        price: currentPrice.ask,
        timestamp: new Date().toLocaleTimeString()
      });
      
    } catch (err) {
      console.error('❌ [Phase 4] ローソク足更新失敗:', err);
    }
  }, [activePair]);

  // アクティブペアのチャートデータを更新
  const updateActiveChartData = useCallback(async () => {
    try {
      const newData = await fxApiService.getHistoricalData(activePair, '15m', 7);
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

  // 🚀 Phase 4: プロ仕様リアルタイム更新システム
  useEffect(() => {
    if (selectedPairs.length === 0) return;

    console.log('🚀 [Phase 4] プロ仕様リアルタイムシステム開始');
    
    // 🔥 最新ローソク足: 1秒間隔更新（プロ仕様）
    const realtimeInterval = setInterval(updateCurrentCandle, 1000);
    
    // 💰 価格データ: 1秒間隔更新
    const priceInterval = setInterval(updateMarketData, 1000);
    
    // 📊 過去ローソク足: 5分間隔更新（効率化）
    const historicalInterval = setInterval(updateActiveChartData, 300000);
    
    // 初回実行
    updateMarketData();
    updateCurrentCandle();

    return () => {
      clearInterval(realtimeInterval);
      clearInterval(priceInterval);
      clearInterval(historicalInterval);
      console.log('🧹 [Phase 4] リアルタイムシステム停止');
    };
  }, [updateMarketData, updateCurrentCandle, updateActiveChartData, selectedPairs]);

  // キャッシュクリーンアップとリアルタイム更新切断
  useEffect(() => {
    // 定期的なキャッシュクリーンアップを開始
    const cleanupInterval = setInterval(() => {
      cacheService.cleanupExpiredCache();
    }, 60000); // 1分ごと

    return () => {
      // コンポーネントアンマウント時のクリーンアップ
      clearInterval(cleanupInterval);
      fxApiService.disconnectRealTimeUpdates();
      console.log('🧹 [Multi Currency Hook] クリーンアップ完了');
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
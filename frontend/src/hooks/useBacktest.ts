import { useState, useCallback } from 'react';
import { BacktestResult, BacktestParameters, backtestEngine } from '../utils/backtestEngine';
import { fxApiService } from '../services/fxApi';
import type { CandlestickData } from 'lightweight-charts';
import { CurrencyPair } from '../types';

interface UseBacktestReturn {
  result: BacktestResult | null;
  isRunning: boolean;
  error: string | null;
  progress: number; // 0-100
  runBacktest: (parameters: BacktestParameters) => Promise<void>;
  clearResult: () => void;
}

export const useBacktest = (): UseBacktestReturn => {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateHistoricalData = useCallback(async (
    pairs: CurrencyPair[],
    startDate: Date,
    endDate: Date
  ): Promise<Map<CurrencyPair, CandlestickData[]>> => {
    const historicalData = new Map<CurrencyPair, CandlestickData[]>();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dataPointsPerDay = 96; // 15分足で1日96本
    const totalDataPoints = totalDays * dataPointsPerDay;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      setProgress(Math.floor((i / pairs.length) * 50)); // 0-50%でデータ生成
      
      // 過去データを生成
      const data = await fxApiService.getHistoricalData(pair, '15m', totalDataPoints);
      
      // 日付範囲でフィルター
      const filteredData = data.filter(candle => {
        const candleTime = new Date(
          typeof candle.time === 'number' ? candle.time * 1000 : candle.time
        );
        return candleTime >= startDate && candleTime <= endDate;
      });

      // データを時系列順にソート
      filteredData.sort((a, b) => {
        const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime() / 1000;
        const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime() / 1000;
        return timeA - timeB;
      });

      historicalData.set(pair, filteredData);
      
      // 少し遅延を入れて非同期感を演出
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return historicalData;
  }, []);

  const runBacktest = useCallback(async (parameters: BacktestParameters) => {
    if (isRunning) return;
    
    setIsRunning(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      console.log('バックテスト開始:', {
        期間: `${parameters.startDate.toLocaleDateString()} - ${parameters.endDate.toLocaleDateString()}`,
        通貨ペア: parameters.pairs.length,
        初期資金: parameters.initialBalance
      });

      // Step 1: 履歴データ生成 (0-50%)
      setProgress(10);
      const historicalData = await generateHistoricalData(
        parameters.pairs,
        parameters.startDate,
        parameters.endDate
      );

      // Step 2: バックテスト実行 (50-90%)
      setProgress(60);
      
      // データ量の確認
      let totalDataPoints = 0;
      historicalData.forEach(data => totalDataPoints += data.length);
      
      if (totalDataPoints === 0) {
        throw new Error('指定期間にデータが見つかりませんでした');
      }

      console.log(`バックテスト実行中: ${totalDataPoints}データポイント`);

      // バックテスト実行（進捗更新付き）
      const backtestResult = await backtestEngine.runBacktest(historicalData, parameters);

      setProgress(95);

      // Step 3: 結果処理 (90-100%)
      if (!backtestResult || backtestResult.totalTrades === 0) {
        console.warn('バックテスト結果: 取引が発生しませんでした');
        setResult({
          ...backtestResult,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPips: 0,
          avgWinPips: 0,
          avgLossPips: 0,
          maxConsecutiveWins: 0,
          maxConsecutiveLosses: 0,
          maxDrawdown: 0,
          profitFactor: 0,
          trades: [],
          dailyPnL: [],
          monthlyStats: []
        });
      } else {
        setResult(backtestResult);
        
        console.log('バックテスト完了:', {
          総取引数: backtestResult.totalTrades,
          勝率: `${(backtestResult.winRate * 100).toFixed(1)}%`,
          総獲得pips: backtestResult.totalPips.toFixed(1),
          プロフィットファクター: backtestResult.profitFactor.toFixed(2)
        });
      }

      setProgress(100);

    } catch (err) {
      console.error('Backtest error:', err);
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(`バックテスト実行中にエラーが発生しました: ${errorMessage}`);
    } finally {
      setIsRunning(false);
      // プログレスをリセット（少し遅れて）
      setTimeout(() => setProgress(0), 2000);
    }
  }, [isRunning, generateHistoricalData]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    result,
    isRunning,
    error,
    progress,
    runBacktest,
    clearResult
  };
};
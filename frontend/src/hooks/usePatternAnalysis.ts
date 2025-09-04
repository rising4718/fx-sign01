import { useState, useEffect, useCallback } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { PatternAnalysis, CurrencyPair, MarketData } from '../types';
import { patternAnalysisEngine } from '../utils/patternAnalysis';

interface UsePatternAnalysisReturn {
  analysis: PatternAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  lastAnalysisTime: Date | null;
  refreshAnalysis: () => void;
}

export const usePatternAnalysis = (
  chartData: CandlestickData[],
  currentPrice: MarketData | null,
  activePair: CurrencyPair
): UsePatternAnalysisReturn => {
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);

  // パターン分析を実行
  const performAnalysis = useCallback(async () => {
    if (!currentPrice || chartData.length < 20) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // 非同期処理をシミュレート（実際の重い計算処理）
      await new Promise(resolve => setTimeout(resolve, 500));

      const analysisResult = patternAnalysisEngine.analyzeCurrentPattern(
        chartData,
        currentPrice.price,
        activePair
      );

      setAnalysis(analysisResult);
      setLastAnalysisTime(new Date());
      
    } catch (err) {
      console.error('Pattern analysis error:', err);
      setError('パターン分析中にエラーが発生しました');
    } finally {
      setIsAnalyzing(false);
    }
  }, [chartData, currentPrice, activePair]);

  // 手動リフレッシュ
  const refreshAnalysis = useCallback(() => {
    performAnalysis();
  }, [performAnalysis]);

  // データ変更時の自動分析
  useEffect(() => {
    if (chartData.length === 0 || !currentPrice) return;

    // デバウンス処理：データ変更から1秒後に分析実行
    const debounceTimer = setTimeout(() => {
      performAnalysis();
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [performAnalysis]);

  // 定期的な再分析（5分ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      if (chartData.length > 0 && currentPrice && !isAnalyzing) {
        performAnalysis();
      }
    }, 5 * 60 * 1000); // 5分

    return () => clearInterval(interval);
  }, [performAnalysis, chartData.length, currentPrice, isAnalyzing]);

  // 通貨ペア変更時の即座の分析
  useEffect(() => {
    if (chartData.length > 0 && currentPrice) {
      performAnalysis();
    }
  }, [activePair]); // activePairの変更のみを監視

  return {
    analysis,
    isAnalyzing,
    error,
    lastAnalysisTime,
    refreshAnalysis
  };
};
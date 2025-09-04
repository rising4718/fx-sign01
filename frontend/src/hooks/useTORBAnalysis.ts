import { useState, useEffect, useCallback } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { TORBSignal, TORBRange, MarketData } from '../types';
import { TORBLogic } from '../utils/torbLogic';

interface UseTORBAnalysisReturn {
  currentRange: TORBRange | null;
  activeSignal: TORBSignal | null;
  signalStatus: 'ACTIVE' | 'PROFIT' | 'LOSS' | null;
  rsiValue: number | null;
  isRangeActive: boolean;
  isTradingTime: boolean;
}

export const useTORBAnalysis = (
  chartData: CandlestickData[],
  currentPrice?: MarketData | null
): UseTORBAnalysisReturn => {
  const [torbLogic] = useState(() => new TORBLogic());
  const [currentRange, setCurrentRange] = useState<TORBRange | null>(null);
  const [activeSignal, setActiveSignal] = useState<TORBSignal | null>(null);
  const [signalStatus, setSignalStatus] = useState<'ACTIVE' | 'PROFIT' | 'LOSS' | null>(null);
  const [rsiValue, setRsiValue] = useState<number | null>(null);

  // 東京時間の判定
  const checkTokyoTime = useCallback(() => {
    const now = new Date();
    const jstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const hour = jstTime.getHours();
    const minute = jstTime.getMinutes();
    const currentMinutes = hour * 60 + minute;

    const rangeStart = 9 * 60; // 9:00
    const rangeEnd = 9 * 60 + 45; // 9:45
    const tradingEnd = 11 * 60; // 11:00

    return {
      isRangeActive: currentMinutes >= rangeStart && currentMinutes <= rangeEnd,
      isTradingTime: currentMinutes > rangeEnd && currentMinutes < tradingEnd
    };
  }, []);

  // レンジ計算の実行
  const calculateRange = useCallback(() => {
    if (chartData.length === 0) {
      setCurrentRange(null);
      return;
    }

    const today = new Date();
    const range = torbLogic.calculateTokyoRange(chartData, today);
    setCurrentRange(range);
  }, [chartData, torbLogic]);

  // シグナル生成のチェック
  const checkForSignal = useCallback(() => {
    if (!currentPrice || !currentRange || activeSignal) return;

    const { isTradingTime } = checkTokyoTime();
    if (!isTradingTime) return;

    const now = new Date(currentPrice.timestamp);
    const previousCandle = chartData.length > 0 ? chartData[chartData.length - 1] : undefined;
    const rsi = torbLogic.calculateRSI(chartData);

    setRsiValue(rsi);

    const signal = torbLogic.checkBreakoutSignal(
      currentPrice.price,
      now,
      previousCandle,
      rsi || undefined
    );

    if (signal) {
      setActiveSignal(signal);
      setSignalStatus('ACTIVE');
    }
  }, [currentPrice, currentRange, activeSignal, chartData, torbLogic, checkTokyoTime]);

  // シグナルステータスの更新
  const updateSignalStatus = useCallback(() => {
    if (!activeSignal || !currentPrice) return;

    const status = torbLogic.checkSignalStatus(currentPrice.price);
    setSignalStatus(status);

    // シグナルが終了した場合（利確または損切り）
    if (status === 'PROFIT' || status === 'LOSS') {
      setTimeout(() => {
        setActiveSignal(null);
        setSignalStatus(null);
        torbLogic.clearSignal();
      }, 5000); // 5秒後にクリア
    }
  }, [activeSignal, currentPrice, torbLogic]);

  // レンジの計算（チャートデータが更新されたとき）
  useEffect(() => {
    calculateRange();
  }, [calculateRange]);

  // シグナルのチェック（価格とレンジが更新されたとき）
  useEffect(() => {
    checkForSignal();
  }, [checkForSignal]);

  // シグナルステータスの更新（価格が更新されたとき）
  useEffect(() => {
    updateSignalStatus();
  }, [updateSignalStatus]);

  // 時間によるリセット処理
  useEffect(() => {
    const interval = setInterval(() => {
      const { isRangeActive, isTradingTime } = checkTokyoTime();
      
      // 取引時間外になったらシグナルをクリア
      if (!isTradingTime && activeSignal) {
        setActiveSignal(null);
        setSignalStatus(null);
        torbLogic.clearSignal();
      }

      // 新しい日になったらレンジをリセット
      const now = new Date();
      const hour = new Date(now.getTime() + (9 * 60 * 60 * 1000)).getHours();
      if (hour < 9) {
        setCurrentRange(null);
        setActiveSignal(null);
        setSignalStatus(null);
        torbLogic.clearSignal();
      }
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(interval);
  }, [activeSignal, torbLogic, checkTokyoTime]);

  const timeInfo = checkTokyoTime();

  return {
    currentRange,
    activeSignal,
    signalStatus,
    rsiValue,
    isRangeActive: timeInfo.isRangeActive,
    isTradingTime: timeInfo.isTradingTime
  };
};
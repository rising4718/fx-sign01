import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Card, Row, Col, Typography, Tag, Space } from 'antd';
import Chart from '../components/Chart';
import DualChart from '../components/DualChart';
import AntHeader from '../components/AntHeader';
import { fxApiService } from '../services/fxApi';
import { cacheService } from '../services/cacheService';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import { getCurrentJST } from '../utils/timeUtils';
import { TradingSimulator, createDefaultAccount, TradeParameters } from '../utils/tradingSimulation';

const { Content } = Layout;
const { Text } = Typography;

const TradingPage: React.FC = () => {
  const { settings, isDemo } = useSettings();
  
  // Phase3: WebSocket接続（自動接続有効）
  const { 
    connectionState, 
    latestPrice, 
    latestSignal, 
    priceHistory, 
    subscribeToPrices, 
    subscribeToSignals 
  } = useWebSocket(true);
  
  // 取引シミュレーター初期化（デモ設定の初期残高を使用）
  const [tradingSimulator] = useState(() => new TradingSimulator({
    balance: settings?.demo?.initialBalance || settings?.account?.balance || 300000,
    leverage: settings?.account?.leverage || 25,
    marginRequirement: settings?.account?.marginRequirement || 4.0,
    riskPercent: settings?.demo?.riskPercentage || settings?.account?.riskPercent || 2.0,
    currency: settings?.account?.currency || 'JPY'
  }));
  const [currentPrice, setCurrentPrice] = useState<number>(150.123);
  const [chartData, setChartData] = useState<any[]>([]);
  const [detailChartData, setDetailChartData] = useState<any[]>([]);
  const [currentRange, setCurrentRange] = useState<{ high: number; low: number; width: number; quality?: string } | null>(null);
  const [activeSignal, setActiveSignal] = useState<any>(null);
  const [signalHistory, setSignalHistory] = useState<any[]>([]);
  const [tradingHistory, setTradingHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('tradingHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [dailyStats, setDailyStats] = useState<any>(() => {
    const saved = localStorage.getItem('dailySignalStats');
    return saved ? JSON.parse(saved) : {};
  });
  const [lastCandleSwitch, setLastCandleSwitch] = useState<Date | null>(null);
  const [cumulativePnL, setCumulativePnL] = useState<number>(0);
  const [priceUpdateInfo, setPriceUpdateInfo] = useState<{
    lastUpdateTime: Date | null;
    updateCount: number;
    lastChange: number;
    apiSuccessCount: number;
    cacheHits: number;
    cacheStats: { memoryEntries: number; localStorageUsage: number; indexedDBSize: number } | null;
  }>({
    lastUpdateTime: null,
    updateCount: 0,
    lastChange: 0,
    apiSuccessCount: 0,
    cacheHits: 0,
    cacheStats: null
  });

  // 現在残高を取得する関数
  const getCurrentBalance = () => {
    const today = new Date().toLocaleDateString('ja-JP');
    const stats = dailyStats[today];
    const initialBalance = isDemo ? settings.demo.initialBalance : settings.demo.initialBalance;
    
    if (!stats) return initialBalance;
    
    // 累積PnLから現在残高を計算
    const totalPnL = stats.totalPnL || 0;
    return initialBalance + totalPnL;
  };

  // TORB状態を計算する関数
  const getTorbStatus = () => {
    const now = getCurrentJST();
    const hour = now.getHours();
    const isRangeTime = hour >= 9 && hour < 11;
    const isBreakoutTime = hour >= 11 && hour < 15;
    
    if (activeSignal) {
      return {
        phase: 'trading' as const,
        hasActiveSignal: true,
        currentRange: currentRange || undefined
      };
    } else if (isBreakoutTime && currentRange) {
      return {
        phase: 'breakout' as const,
        hasActiveSignal: false,
        currentRange: currentRange
      };
    } else if (isRangeTime) {
      return {
        phase: 'range' as const,
        hasActiveSignal: false,
        currentRange: currentRange || undefined
      };
    } else {
      return {
        phase: 'off' as const,
        hasActiveSignal: false,
        currentRange: currentRange || undefined
      };
    }
  };

  // セッション情報を取得する関数
  const getCurrentSession = () => {
    // 正しいJST時間の計算 (UTC+9)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jst = new Date(utc + (9 * 60 * 60 * 1000));
    const hour = jst.getHours();
    
    // デバッグログ（開発環境のみ）
    if (import.meta.env.MODE === 'development') {
      console.log(`Session check - UTC: ${now.toISOString()}, JST: ${jst.toISOString()}, Hour: ${hour}`);
    }
    
    // 6つのFX主要セッション（JST基準）
    if (hour >= 6 && hour < 9) return { name: 'シドニー', color: '#13c2c2' };
    if (hour >= 9 && hour < 15) return { name: '東京', color: '#52c41a' };
    if (hour >= 15 && hour < 16) return { name: '東京後場', color: '#73d13d' };
    if (hour >= 16 && hour < 22) return { name: 'ロンドン', color: '#1890ff' };
    if (hour >= 22 || hour < 2) return { name: 'NY序盤', color: '#fa8c16' };
    if (hour >= 2 && hour < 6) return { name: 'NY後半', color: '#ff7875' };
    return { name: 'オフ', color: '#8c8c8c' };
  };

  // 現実的な損益計算関数（TradingSimulatorを使用）
  const calculateRealisticPnL = (signal: any, exitPrice: number): number => {
    if (!signal || !currentRange) return 0;

    const tradeParams: TradeParameters = {
      symbol: 'USD/JPY',
      direction: signal.type,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopPrice,
      takeProfit: signal.targetPrice,
      torbRangeWidth: currentRange.width
    };

    const result = tradingSimulator.simulateTrade(tradeParams, exitPrice);
    return result.isValidTrade ? result.pnl : 0;
  };

  // TORBロジック設定（ローカルストレージから取得）
  const [torbSettings, setTorbSettings] = useState(() => {
    const saved = localStorage.getItem('torbSettings');
    return saved ? JSON.parse(saved) : {
      rangeStartHour: 9,
      rangeStartMinute: 0,
      rangeEndHour: 10,
      rangeEndMinute: 0,
      tradingEndHour: 15,
      tradingEndMinute: 0,
      minRangeWidth: 10,
      maxRangeWidth: 40,
      profitMultiplier: 1.5,
      stopLossBuffer: 5
    };
  });

  useEffect(() => {
    let basePrice = 150.0;
    
    // 15分区切りの正確な時間を計算する関数
    const get15MinuteTime = (date: Date) => {
      const minutes = date.getMinutes();
      const roundedMinutes = Math.floor(minutes / 15) * 15;
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), roundedMinutes, 0, 0);
    };
    
    // 現在の15分区切り時間を取得
    const now = new Date();
    let currentCandleStart = get15MinuteTime(now);
    
    // 🚨 GMOコインAPIのみを使用 - フォールバック処理完全削除
    const fetchInitialDataOnce = async () => {
      console.log('🔄 [GMO ONLY] GMOコインAPIから初期FXデータを取得中...');
      const candleData = await fxApiService.getHistoricalData('USDJPY', '15m', 7);
      
      console.log('✅ [GMO API] 15分足データを取得しました:', candleData.length + '本');
      console.log('📋 [DEBUG 15分足] Raw candle data sample:', candleData.slice(0, 3));
      
      const formattedData = candleData.map((candle: any, index: number) => {
        // fxApiService already returns unix timestamp, no need to convert again
        const unixTime = typeof candle.time === 'number' ? candle.time : Math.floor(new Date(candle.time || candle.timestamp).getTime() / 1000);
        const displayTime = new Date(unixTime * 1000);
        const displayTimeStr = `${displayTime.getHours().toString().padStart(2, '0')}:${displayTime.getMinutes().toString().padStart(2, '0')}`;
        
        if (index < 3) {
          console.log(`🕐 [DEBUG 15分足 ${index}] Candle time: ${candle.time} (type: ${typeof candle.time}) → Unix: ${unixTime} → Display: ${displayTimeStr}`);
        }
        
        return {
          time: unixTime,
          open: Number(candle.open.toFixed(3)),
          high: Number(candle.high.toFixed(3)),
          low: Number(candle.low.toFixed(3)),
          close: Number(candle.close.toFixed(3))
        };
      });
      
      return formattedData;
    };
    

    // TORB API からレンジデータを取得する関数
    const fetchTORBRange = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fxApiService.getTORBRange('USDJPY', today);
        
        if (response.success && response.data) {
          const { high, low, width, isValid, quality } = response.data;
          if (isValid) {
            setCurrentRange({ 
              high: Number(high.toFixed(5)), 
              low: Number(low.toFixed(5)), 
              width: Number(width.toFixed(1)),
              quality // レンジ品質情報を追加
            });
            console.log(`📊 [TORB API] レンジ取得成功: H=${high} L=${low} (${width} pips) 品質=${quality}`);
          } else {
            console.log(`⚠️ [TORB API] 無効なレンジ: ${width} pips (基準外)`);
          }
        } else {
          console.log(`ℹ️ [TORB API] 本日のレンジデータなし`);
        }
      } catch (error) {
        console.error('🚨 [TORB API] レンジ取得エラー:', error);
        // フォールバック: ローカル計算
        // TORB APIエラー時はローカル計算スキップ（エラー表示のみ）
        console.warn('⚠️ [TORB API] フォールバック無効 - API修復待ち');
      }
    };

    // フォールバック用ローカルレンジ計算
    const calculateRangeLocal = (data: any[]) => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // レンジ形成時間かチェック
      const isInRangeTime = (
        currentHour === torbSettings.rangeStartHour && currentMinute >= torbSettings.rangeStartMinute
      ) || (
        currentHour === torbSettings.rangeEndHour && currentMinute < torbSettings.rangeEndMinute
      ) || (
        currentHour > torbSettings.rangeStartHour && currentHour < torbSettings.rangeEndHour
      );
      
      if (isInRangeTime && data.length >= 4) {
        // レンジ形成期間：最高値・最安値を計算
        const rangeData = data.slice(-4); // 直近1時間分（15分足4本）
        const high = Math.max(...rangeData.map(d => d.high));
        const low = Math.min(...rangeData.map(d => d.low));
        const width = (high - low) * 10000; // pips換算
        
        if (width >= torbSettings.minRangeWidth && width <= torbSettings.maxRangeWidth) {
          setCurrentRange({ 
            high: Number(high.toFixed(5)), 
            low: Number(low.toFixed(5)), 
            width: Number(width.toFixed(1)),
            quality: 'local' // ローカル計算マーク
          });
          console.log(`📊 [Local Calc] フォールバックレンジ: H=${high} L=${low} (${width} pips)`);
        }
      }
    };

    // ブレイクアウト監視とシグナル生成
    const monitorBreakout = (data: any[]) => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // ブレイクアウト監視時間かチェック
      const isBreakoutTime = currentHour >= torbSettings.rangeEndHour && currentHour < torbSettings.tradingEndHour;
      
      if (isBreakoutTime && currentRange && !activeSignal) {
        // ブレイクアウト監視：サイン生成
        const currentPriceValue = data[data.length - 1]?.close || currentPrice;
        
        if (currentPriceValue > currentRange.high) {
          // 上抜けブレイクアウト → 買いサイン
          const target = currentPriceValue + (currentRange.width / 10000) * torbSettings.profitMultiplier;
          const stop = currentRange.low - (torbSettings.stopLossBuffer / 10000);
          
          const signal = {
            type: 'buy' as const,
            entryPrice: Number(currentPriceValue.toFixed(3)),
            targetPrice: Number(target.toFixed(3)),
            stopPrice: Number(stop.toFixed(3)),
            timestamp: new Date()
          };
          
          setActiveSignal(signal);
          autoSaveTradingRecord(signal);
          console.log('📈 [Breakout] 買いシグナル生成:', signal);
          
        } else if (currentPriceValue < currentRange.low) {
          // 下抜けブレイクアウト → 売りサイン
          const target = currentPriceValue - (currentRange.width / 10000) * torbSettings.profitMultiplier;
          const stop = currentRange.high + (torbSettings.stopLossBuffer / 10000);
          
          const signal = {
            type: 'sell' as const,
            entryPrice: Number(currentPriceValue.toFixed(3)),
            targetPrice: Number(target.toFixed(3)),
            stopPrice: Number(stop.toFixed(3)),
            timestamp: new Date()
          };
          
          setActiveSignal(signal);
          autoSaveTradingRecord(signal);
          console.log('📉 [Breakout] 売りシグナル生成:', signal);
        }
      } else if (currentHour >= torbSettings.tradingEndHour) {
        // 取引終了時間：リセット
        setCurrentRange(null);
        setActiveSignal(null);
        console.log('🔄 [TORB] 取引セッション終了 - レンジとシグナルをリセット');
      }
    };

    // リアルなPnL計算関数
    const calculateRealisticPnL = (signal: any, exitPrice: number): number => {
      try {
        const tradeParams: TradeParameters = {
          symbol: 'USD/JPY',
          direction: signal.type,
          entryPrice: signal.entryPrice,
          stopLoss: signal.stopPrice,
          takeProfit: signal.targetPrice,
          torbRangeWidth: currentRange?.width || 20
        };
        
        const result = tradingSimulator.simulateTrade(tradeParams, exitPrice);
        return result.isValidTrade ? result.pnl : 0;
      } catch (error) {
        console.error('PnL計算エラー:', error);
        return 0;
      }
    };

    // 日別統計更新（リアルPnL対応版）
    const updateDailyStats = (signal: any, result?: 'win' | 'loss' | null, pnlAmount?: number) => {
      const today = new Date().toLocaleDateString('ja-JP');
      const updatedStats = { ...dailyStats };
      
      if (!updatedStats[today]) {
        updatedStats[today] = {
          totalSignals: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          totalPnL: 0,
          signals: []
        };
      }
      
      if (result === undefined) {
        // 新しいシグナル生成時
        updatedStats[today].totalSignals += 1;
        updatedStats[today].signals.push({
          ...signal,
          id: Date.now(),
          status: 'active'
        });
      } else if (result && pnlAmount !== undefined) {
        // シグナル結果更新時（リアルPnLを記録）
        if (result === 'win') {
          updatedStats[today].wins += 1;
        } else if (result === 'loss') {
          updatedStats[today].losses += 1;
        }
        
        // 累積PnLを更新
        updatedStats[today].totalPnL = (updatedStats[today].totalPnL || 0) + pnlAmount;
        
        // 勝率計算
        const completed = updatedStats[today].wins + updatedStats[today].losses;
        if (completed > 0) {
          updatedStats[today].winRate = Number(((updatedStats[today].wins / completed) * 100).toFixed(1));
        }
      }
      
      setDailyStats(updatedStats);
      localStorage.setItem('dailySignalStats', JSON.stringify(updatedStats));
    };

    // 自動取引記録保存
    const autoSaveTradingRecord = (signal: any) => {
      const tradeRecord = {
        id: Date.now(),
        date: new Date().toLocaleDateString('ja-JP'),
        signalTime: signal.timestamp,
        entryTime: new Date(),
        type: signal.type,
        entryPrice: signal.entryPrice,
        targetPrice: signal.targetPrice,
        stopPrice: signal.stopPrice,
        exitPrice: null,
        result: null,
        pips: null,
        status: 'active',
        settings: { ...torbSettings },
        autoRecorded: true
      };
      
      const updatedHistory = [tradeRecord, ...tradingHistory];
      setTradingHistory(updatedHistory);
      localStorage.setItem('tradingHistory', JSON.stringify(updatedHistory));
      
      // アクティブシグナルを履歴に移動
      setSignalHistory(prev => [signal, ...prev.slice(0, 9)]);
      
      // 日別統計を更新
      updateDailyStats(signal);
      
      setActiveSignal(null);
    };

    // 自動決済チェック機能
    const checkAutoClose = (currentPrice: number) => {
      if (!activeSignal) return;
      
      let shouldClose = false;
      let result: 'win' | 'loss' = 'loss';
      let reason = '';
      
      if (activeSignal.type === 'buy') {
        // 買いシグナルの場合
        if (currentPrice >= activeSignal.targetPrice) {
          shouldClose = true;
          result = 'win';
          reason = 'ターゲット到達';
        } else if (currentPrice <= activeSignal.stopPrice) {
          shouldClose = true;
          result = 'loss';
          reason = 'ストップロス';
        }
      } else {
        // 売りシグナルの場合
        if (currentPrice <= activeSignal.targetPrice) {
          shouldClose = true;
          result = 'win';
          reason = 'ターゲット到達';
        } else if (currentPrice >= activeSignal.stopPrice) {
          shouldClose = true;
          result = 'loss';
          reason = 'ストップロス';
        }
      }
      
      if (shouldClose) {
        // pips計算
        const pips = activeSignal.type === 'buy' 
          ? (currentPrice - activeSignal.entryPrice) * 10000 
          : (activeSignal.entryPrice - currentPrice) * 10000;
        
        // リアルなPnL計算
        const realisticPnL = calculateRealisticPnL(activeSignal, currentPrice);
        
        // 取引履歴を更新
        const updatedHistory = tradingHistory.map((trade: any) => {
          if (trade.entryPrice === activeSignal.entryPrice && trade.status === 'active') {
            return {
              ...trade,
              exitTime: new Date(),
              exitPrice: currentPrice,
              result,
              pips: Number(pips.toFixed(1)),
              pnl: realisticPnL,
              status: 'completed',
              closeReason: reason
            };
          }
          return trade;
        });
        
        setTradingHistory(updatedHistory);
        localStorage.setItem('tradingHistory', JSON.stringify(updatedHistory));
        
        // シグナル履歴を更新（結果付きで）
        setSignalHistory(prev => prev.map((signal, index) => {
          if (index === 0) { // 最新のシグナル
            return {
              ...signal,
              result,
              pips: Number(pips.toFixed(1)),
              pnl: realisticPnL,
              exitPrice: currentPrice,
              closeReason: reason
            };
          }
          return signal;
        }));
        
        // 累積PnLを更新
        setCumulativePnL(prev => prev + realisticPnL);
        
        // 日別統計を更新（リアルPnLを渡す）
        updateDailyStats(activeSignal, result, realisticPnL);
        
        // アクティブシグナルをクリア
        setActiveSignal(null);
        
        console.log(`🎯 自動決済: ${activeSignal.type.toUpperCase()} ${activeSignal.entryPrice} → ${currentPrice} (${result}: ${pips.toFixed(1)} pips / ¥${realisticPnL.toFixed(0)}) - ${reason}`);
      }
    };

    // 最後のローソク足をリアルタイムAPIで更新する関数
    const updateCurrentCandle = async (prevData: any[]) => {
      if (prevData.length === 0) return prevData;
      
      try {
        // 実際の現在価格を取得
        const currentPriceData = await fxApiService.getCurrentPrice('USDJPY');
        if (currentPriceData) {
          const newPrice = currentPriceData.price;
          
          const newData = [...prevData];
          const lastCandle = newData[newData.length - 1];
          const now = new Date();
          
          // 実際の15分区切り時刻をチェック
          const next15MinTime = get15MinuteTime(new Date(currentCandleStart.getTime() + 15 * 60 * 1000));
          
          // 現在時刻が次の15分区切り時刻に達したかチェック
          if (now >= next15MinTime) {
            // 新しい15分足を開始
            currentCandleStart = next15MinTime;
            const newCandleTime = Math.floor(currentCandleStart.getTime() / 1000);
            const newOpen = lastCandle.close;
            
            const switchTime = new Date();
            console.log(`🕐 新しいローソク足作成 (実価格): ${switchTime.toLocaleTimeString('ja-JP')} (予定時刻: ${next15MinTime.toLocaleTimeString('ja-JP')})`);
            setLastCandleSwitch(switchTime);
            
            const newCandle = {
              time: newCandleTime,
              open: Number(newOpen.toFixed(3)),
              high: Number(newPrice.toFixed(3)),
              low: Number(newPrice.toFixed(3)),
              close: Number(newPrice.toFixed(3))
            };
            
            newData.push(newCandle);
            
            // 20本以上になったら古いデータを削除
            if (newData.length > 20) {
              newData.shift();
            }
            
            // TORB レンジ取得とブレイクアウト監視
            await fetchTORBRange();
            monitorBreakout(newData);
            
            return newData;
          } else {
            // 現在のローソク足をリアルタイム価格で更新
            const newHigh = Math.max(lastCandle.high, newPrice);
            const newLow = Math.min(lastCandle.low, newPrice);
            
            newData[newData.length - 1] = {
              ...lastCandle,
              high: Number(newHigh.toFixed(3)),
              low: Number(newLow.toFixed(3)),
              close: Number(newPrice.toFixed(3))
            };
            
            // 現在価格を更新
            setCurrentPrice(newPrice);
            
            // TORB レンジ取得とブレイクアウト監視
            await fetchTORBRange();
            monitorBreakout(newData);
            
            // アクティブシグナルの自動決済チェック
            if (activeSignal) {
              checkAutoClose(newPrice);
            }
            
            return newData;
          }
        }
      } catch (error) {
        console.error('GMOコインAPIエラー:', error);
        throw error; // フォールバック処理を完全に削除
      }
      
      return prevData;
    };
    

    // 🚨 ONCE ONLY: 初期データを非同期で取得・設定（1回限り）
    const initializeDataOnce = async () => {
      const initialData = await fetchInitialDataOnce();
      setChartData(initialData);
      setCurrentPrice(initialData[initialData.length - 1]?.close || 150.123);
      
      // 初期TORB レンジ取得とブレイクアウト監視
      await fetchTORBRange();
      monitorBreakout(initialData);
      console.log('🎯 [INITIALIZATION] 初期データ設定完了 - この後はリアルタイム更新のみ');
    };
    
    initializeDataOnce();
    
    // 🚨 GMOコインAPIのみを使用 - 5分足データ取得
    const fetch5MinDataOnce = async () => {
      console.log('🔄 [GMO ONLY] GMOコインAPIから5分足データを取得中... (修正版)');
      const candleData = await fxApiService.getHistoricalData('USDJPY', '5m', 7);
      
      console.log('✅ [GMO API] 5分足データを取得しました:', candleData.length + '本');
      console.log('📋 [DEBUG] Raw candle data sample:', candleData.slice(0, 3));
      
      const formattedData = candleData.map((candle: any, index: number) => {
        // fxApiService already returns unix timestamp, no need to convert again
        const unixTime = typeof candle.time === 'number' ? candle.time : Math.floor(new Date(candle.time || candle.timestamp).getTime() / 1000);
        const displayTime = new Date(unixTime * 1000);
        const displayTimeStr = `${displayTime.getHours().toString().padStart(2, '0')}:${displayTime.getMinutes().toString().padStart(2, '0')}`;
        
        if (index < 3) {
          console.log(`🕐 [DEBUG ${index}] Candle time: ${candle.time} (type: ${typeof candle.time}) → Unix: ${unixTime} → Display: ${displayTimeStr}`);
        }
        
        return {
          time: unixTime,
          open: Number(candle.open.toFixed(3)),
          high: Number(candle.high.toFixed(3)),
          low: Number(candle.low.toFixed(3)),
          close: Number(candle.close.toFixed(3))
        };
      });
      
      return formattedData;
    };

    // 🚨 ONCE ONLY: 5分足データを非同期で取得・設定（1回限り）
    const initialize5MinDataOnce = async () => {
      const detail5MinData = await fetch5MinDataOnce();
      console.log('🚨 [5分足設定] データ確認:', detail5MinData.slice(0, 3).map(d => ({ 
        time: d.time, 
        date: new Date(d.time * 1000).toLocaleString('ja-JP') 
      })));
      setDetailChartData(detail5MinData);
      console.log('🎯 [INITIALIZATION] 5分足初期データ設定完了 - この後はリアルタイム更新のみ');
    };
    
    initialize5MinDataOnce();

    // 1秒ごとに現在のローソク足を更新（リアルタイム価格変動）
    const interval = setInterval(async () => {
      // console.log('🔄 setInterval実行中:', new Date().toLocaleTimeString()); // デバッグ用に一時停止
      
      try {
        // キャッシュ統計更新用フラグ
        const startTime = Date.now();
        
        // 現在価格を取得（キャッシュ統合版）
        const currentPriceData = await fxApiService.getCurrentPrice('USDJPY');
        if (currentPriceData) {
          // console.log('✅ 現在価格取得成功:', currentPriceData.price); // デバッグ用に一時停止
          const change = currentPriceData.price - currentPrice;
          const responseTime = Date.now() - startTime;
          const isFromCache = responseTime < 50; // 50ms以下はキャッシュヒットとみなす
          
          setCurrentPrice(currentPriceData.price);
          setPriceUpdateInfo(prev => ({
            lastUpdateTime: new Date(),
            updateCount: prev.updateCount + 1,
            lastChange: change,
            apiSuccessCount: prev.apiSuccessCount + 1,
            cacheHits: isFromCache ? prev.cacheHits + 1 : prev.cacheHits,
            cacheStats: prev.cacheStats
          }));
        } else {
          throw new Error('GMOコインAPIから価格データを取得できませんでした');
        }
        
        // 現在のチャートデータを元に更新を実行（直接非同期処理）
        setChartData(currentChartData => {
          // 非同期でチャートデータ更新を実行
          (async () => {
            try {
              // console.log('📈 チャートデータ更新開始'); // デバッグ用に一時停止
              const updatedData = await updateCurrentCandle(currentChartData);
              if (updatedData && updatedData !== currentChartData) {
                // console.log('✅ チャートデータ更新成功'); // デバッグ用に一時停止
                setChartData(updatedData);
                
                // 5分足データもリアルタイムで適切に更新
                if (updatedData.length > 0) {
                  const latestPrice = updatedData[updatedData.length - 1].close;
                  console.log('🕐 5分足チャートデータ更新中:', latestPrice);
                  
                  setDetailChartData(prevDetailData => {
                    const newDetailData = [...prevDetailData];
                    if (newDetailData.length === 0) return newDetailData;
                    
                    const now = new Date();
                    
                    // 5分区切り時刻を計算（JST基準）
                    const get5MinuteTime = (date: Date) => {
                      const minutes = date.getMinutes();
                      const roundedMinutes = Math.floor(minutes / 5) * 5;
                      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), roundedMinutes, 0, 0);
                    };
                    
                    const current5MinTime = get5MinuteTime(now);
                    const current5MinUnix = Math.floor(current5MinTime.getTime() / 1000);
                    const lastCandle = newDetailData[newDetailData.length - 1];
                    
                    // 新しい5分区切り時間に達したかチェック
                    if (current5MinUnix > lastCandle.time) {
                      // 新しい5分足を開始
                      const newCandle = {
                        time: current5MinUnix,
                        open: lastCandle.close,
                        high: latestPrice,
                        low: latestPrice,
                        close: latestPrice
                      };
                      
                      newDetailData.push(newCandle);
                      
                      // 12本以上になったら古いデータを削除
                      if (newDetailData.length > 12) {
                        newDetailData.shift();
                      }
                      
                      console.log(`🆕 新しい5分足作成: ${current5MinTime.toLocaleTimeString('ja-JP')}`);
                    } else {
                      // 現在の5分足を更新
                      newDetailData[newDetailData.length - 1] = {
                        ...lastCandle,
                        high: Math.max(lastCandle.high, latestPrice),
                        low: Math.min(lastCandle.low, latestPrice),
                        close: latestPrice
                      };
                      console.log('📊 5分足更新完了:', latestPrice);
                    }
                    
                    return newDetailData;
                  });
                }
              } else {
                console.log('⚠️ チャートデータ変更なし');
              }
            } catch (error) {
              console.error('❌ チャートデータ更新エラー:', error);
            }
          })();
          
          // 現在の状態をそのまま返す
          return currentChartData;
        });
      } catch (error) {
        console.error('setInterval更新エラー:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Phase3: WebSocket価格データ受信処理
  useEffect(() => {
    if (latestPrice) {
      console.log('📡 WebSocket価格受信:', latestPrice);
      
      // WebSocketから受信した価格でcurrentPriceを更新
      setCurrentPrice(latestPrice.bid);
      
      // 価格更新統計を更新
      setPriceUpdateInfo(prev => ({
        lastUpdateTime: new Date(),
        updateCount: prev.updateCount + 1,
        lastChange: latestPrice.bid - currentPrice,
        apiSuccessCount: prev.apiSuccessCount + 1,
        cacheHits: prev.cacheHits, // WebSocketは直接受信のためキャッシュヒットとして扱わない
        cacheStats: prev.cacheStats
      }));
    }
  }, [latestPrice, currentPrice]);

  // Phase3: WebSocket接続状態監視とサブスクリプション
  useEffect(() => {
    if (connectionState.connected) {
      console.log('🔌 WebSocket接続成功 - 価格とシグナルを購読');
      subscribeToPrices('USD/JPY');
      subscribeToSignals('USD/JPY');
    }
  }, [connectionState.connected, subscribeToPrices, subscribeToSignals]);

  // TORB レンジの定期取得 (15分間隔)
  useEffect(() => {
    const fetchTORBRangeInterval = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fxApiService.getTORBRange('USDJPY', today);
        
        if (response.success && response.data && response.data.isValid) {
          const { high, low, width, quality } = response.data;
          setCurrentRange({ 
            high: Number(high.toFixed(5)), 
            low: Number(low.toFixed(5)), 
            width: Number(width.toFixed(1)),
            quality 
          });
          console.log(`📊 [TORB API定期取得] レンジ更新: H=${high} L=${low} (${width} pips) 品質=${quality}`);
        } else {
          console.log(`ℹ️ [TORB API定期取得] 現在利用可能なレンジなし`);
        }
      } catch (error) {
        console.error('🚨 [TORB API定期取得] エラー:', error);
      }
    };

    // 即座に一回実行
    fetchTORBRangeInterval();
    
    // 15分間隔で定期実行
    const interval = setInterval(fetchTORBRangeInterval, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // キャッシュ統計の定期更新
  useEffect(() => {
    const updateCacheStats = async () => {
      try {
        const stats = await cacheService.getCacheStats();
        setPriceUpdateInfo(prev => ({
          ...prev,
          cacheStats: stats
        }));
      } catch (error) {
        console.warn('⚠️ [Cache Stats] 統計取得エラー:', error);
      }
    };

    // 初回実行
    updateCacheStats();
    
    // 30秒ごとに更新
    const statsInterval = setInterval(updateCacheStats, 30000);
    
    return () => clearInterval(statsInterval);
  }, []);

  const items = [
    {
      key: 'chart',
      label: (
        <span>
          📊 チャート分析
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={19}>
            <Card style={{ 
              minHeight: '380px', 
              height: 'auto',
              backgroundColor: '#141414'
            }}>
              <DualChart 
                mainData={chartData}
                detailData={detailChartData}
                currentPrice={currentPrice}
                torbRange={currentRange}
                signals={signalHistory}
              />
            </Card>
          </Col>
          <Col xs={24} lg={5}>
            <Row gutter={[0, 12]}>
              <Col xs={24}>
                <Card title="💰 損益" size="small" styles={{ body: { padding: '12px' } }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>残高</Text>
                    <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#52c41a' }}>
                      ¥{getCurrentBalance().toLocaleString()}
                    </Text>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>本日</Text>
                    <Text style={{ 
                      fontSize: '15px', 
                      fontWeight: 'bold',
                      color: (() => {
                        const today = new Date().toLocaleDateString('ja-JP');
                        const stats = dailyStats[today];
                        const totalPnL = stats?.totalPnL || 0;
                        return totalPnL >= 0 ? '#52c41a' : '#ff4d4f';
                      })()
                    }}>
                      {(() => {
                        const today = new Date().toLocaleDateString('ja-JP');
                        const stats = dailyStats[today];
                        const totalPnL = stats?.totalPnL || 0;
                        return `${totalPnL >= 0 ? '+' : ''}¥${Math.round(totalPnL).toLocaleString()}`;
                      })()}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>DD</Text>
                    <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff4d4f' }}>
                      {(() => {
                        // 今日の最大ドローダウンを計算（簡易版）
                        const today = new Date().toLocaleDateString('ja-JP');
                        const stats = dailyStats[today];
                        if (!stats) return '¥0';
                        
                        // 負の最大PnLをドローダウンとして表示
                        const totalPnL = stats.totalPnL || 0;
                        const drawdown = totalPnL < 0 ? totalPnL : 0;
                        return `¥${Math.round(drawdown).toLocaleString()}`;
                      })()}
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="📊 取引" size="small" styles={{ body: { padding: '12px' } }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>取引量</Text>
                    <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#1890ff' }}>
                      {settings.demo.lotSize.toLocaleString()}通貨
                    </Text>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>本日回数</Text>
                    <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>
                      {(() => {
                        const today = new Date().toLocaleDateString('ja-JP');
                        const stats = dailyStats[today];
                        return stats ? stats.totalSignals : 0;
                      })()}回
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>証拠金</Text>
                    <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#fa8c16' }}>
                      {(() => {
                        const marginUsed = activeSignal ? 
                          (settings.demo.lotSize * currentPrice * 0.04) : 0; // 4%証拠金
                        const marginRatio = marginUsed / getCurrentBalance() * 100;
                        return marginRatio > 0 ? `${marginRatio.toFixed(1)}%` : '0%';
                      })()}
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="💼 ポジション" size="small" styles={{ body: { padding: '12px' } }}>
                  {activeSignal ? (
                    <div>
                      <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Tag color={activeSignal.type === 'buy' ? 'green' : 'red'} style={{ fontSize: '11px', margin: 0 }}>
                          {activeSignal.type === 'buy' ? 'LONG' : 'SHORT'}
                        </Tag>
                        <Text style={{ fontSize: '13px', color: '#ffffff' }}>USD/JPY</Text>
                      </div>
                      <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>エントリー</Text>
                        <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>
                          {activeSignal.entryPrice}
                        </Text>
                      </div>
                      <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>現在</Text>
                        <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffeb3b' }}>
                          {currentPrice.toFixed(3)}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>含み損益</Text>
                        <Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 'bold',
                          color: (() => {
                            const unrealizedPnL = calculateRealisticPnL(activeSignal, currentPrice);
                            return unrealizedPnL >= 0 ? '#52c41a' : '#ff4d4f';
                          })()
                        }}>
                          {(() => {
                            const unrealizedPnL = calculateRealisticPnL(activeSignal, currentPrice);
                            const pips = activeSignal.type === 'buy' 
                              ? (currentPrice - activeSignal.entryPrice) * 10000 
                              : (activeSignal.entryPrice - currentPrice) * 10000;
                            return `${unrealizedPnL >= 0 ? '+' : ''}¥${Math.round(unrealizedPnL).toLocaleString()} (${pips >= 0 ? '+' : ''}${pips.toFixed(1)}p)`;
                          })()}
                        </Text>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '12px 0' }}>
                      <Text style={{ fontSize: '13px', color: '#8c8c8c' }}>ポジションなし</Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="⚙️ システム" size="small" styles={{ body: { padding: '12px' } }}>
                  <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>モード</Text>
                    <Tag color={isDemo ? 'blue' : 'red'} style={{ fontSize: '11px', margin: 0 }}>
                      {isDemo ? 'DEMO' : 'REAL'}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>自動取引</Text>
                    <Tag color={settings.trading.autoTrading ? 'green' : 'red'} style={{ fontSize: '11px', margin: 0 }}>
                      {settings.trading.autoTrading ? 'ON' : 'OFF'}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>次回シグナル</Text>
                    <Text style={{ fontSize: '13px', color: '#fa8c16' }}>09:45</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
          <Col xs={24}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={6}>
                <Card styles={{ body: { padding: '12px' } }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>今日のシグナル数</Text>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                      {(() => {
                        const today = new Date().toLocaleDateString('ja-JP');
                        return dailyStats[today]?.totalSignals || 0;
                      })()}
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card styles={{ body: { padding: '12px' } }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>勝利数</Text>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                      {(() => {
                        const today = new Date().toLocaleDateString('ja-JP');
                        return dailyStats[today]?.wins || 0;
                      })()}
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card styles={{ body: { padding: '12px' } }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>敗北数</Text>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
                      {(() => {
                        const today = new Date().toLocaleDateString('ja-JP');
                        return dailyStats[today]?.losses || 0;
                      })()}
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card styles={{ body: { padding: '12px' } }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>勝率</Text>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                      {(() => {
                        const today = new Date().toLocaleDateString('ja-JP');
                        const stats = dailyStats[today];
                        if (!stats || (stats.wins + stats.losses) === 0) return '0%';
                        return `${stats.winRate}%`;
                      })()}
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
          <Col xs={24}>
            <Card title="アクティブシグナル" size="small" styles={{ body: { padding: '12px' } }}>
              {activeSignal ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Tag color={activeSignal.type === 'buy' ? 'green' : 'red'} style={{ fontSize: '12px', padding: '2px 6px' }}>
                      {activeSignal.type === 'buy' ? '🔺 BUY' : '🔻 SELL'}
                    </Tag>
                    <Text strong style={{ marginLeft: 8, fontSize: '13px' }}>エントリー: {activeSignal.entryPrice}</Text>
                    <Text style={{ marginLeft: 12, fontSize: '13px' }}>TP: {activeSignal.targetPrice}</Text>
                    <Text style={{ marginLeft: 12, fontSize: '13px' }}>SL: {activeSignal.stopPrice}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>発生時刻: {activeSignal.timestamp.toLocaleTimeString('ja-JP')}</Text>
                  </div>
                </Space>
              ) : (
                <Text type="secondary" style={{ fontSize: '13px' }}>現在アクティブなシグナルはありません</Text>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'signal-history',
      label: (
        <span>
          📈 シグナル履歴
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Card title="今日のシグナル履歴">
              <Text type="secondary">シグナル履歴がありません</Text>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'debug',
      label: (
        <span>
          🐛 デバッグ情報
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="TORB設定情報">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>レンジ時間: </Text>
                  <Text>{torbSettings.rangeStartHour}:{torbSettings.rangeStartMinute.toString().padStart(2, '0')} - {torbSettings.rangeEndHour}:{torbSettings.rangeEndMinute.toString().padStart(2, '0')}</Text>
                </div>
                <div>
                  <Text strong>取引終了: </Text>
                  <Text>{torbSettings.tradingEndHour}:{torbSettings.tradingEndMinute.toString().padStart(2, '0')}</Text>
                </div>
                <div>
                  <Text strong>レンジ幅制限: </Text>
                  <Text>{torbSettings.minRangeWidth} - {torbSettings.maxRangeWidth} pips</Text>
                </div>
                <div>
                  <Text strong>利益倍率: </Text>
                  <Text>{torbSettings.profitMultiplier}x</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="現在の状態">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>現在価格: </Text>
                  <Text>{currentPrice.toFixed(3)}</Text>
                </div>
                <div>
                  <Text strong>TORBレンジ: </Text>
                  {currentRange ? (
                    <Text>High: {currentRange.high.toFixed(3)} / Low: {currentRange.low.toFixed(3)} ({currentRange.width} pips)</Text>
                  ) : (
                    <Text type="secondary">未設定</Text>
                  )}
                </div>
                <div>
                  <Text strong>最後のローソク切替: </Text>
                  <Text>{lastCandleSwitch ? lastCandleSwitch.toLocaleTimeString('ja-JP') : '未実行'}</Text>
                </div>
                <div>
                  <Text strong>データ本数: </Text>
                  <Text>15分足: {chartData.length}本 / 5分足: {detailChartData.length}本</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="🔌 WebSocket接続状態">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>接続状態: </Text>
                  <Tag color={connectionState.connected ? 'green' : connectionState.connecting ? 'orange' : 'red'}>
                    {connectionState.connected ? '接続中' : connectionState.connecting ? '接続試行中' : '切断中'}
                  </Tag>
                </div>
                <div>
                  <Text strong>WebSocketサーバー: </Text>
                  <Text code>{connectionState.url || (window.location.hostname === 'fxbuybuy.site' ? 'wss://fxbuybuy.site/ws' : 'ws://localhost:3002')}</Text>
                </div>
                <div>
                  <Text strong>再接続試行回数: </Text>
                  <Text>{connectionState.reconnectAttempts}/5</Text>
                </div>
                <div>
                  <Text strong>受信済み価格履歴: </Text>
                  <Text>{priceHistory.length}件</Text>
                </div>
                {latestSignal && (
                  <div>
                    <Text strong>最新シグナル: </Text>
                    <Tag color={latestSignal.signal === 'BUY' ? 'green' : 'red'}>
                      {latestSignal.signal} - {latestSignal.symbol} (信頼度: {Math.round(latestSignal.confidence * 100)}%)
                    </Tag>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="💰 価格更新状況">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>総更新回数: </Text>
                  <Text>{priceUpdateInfo.updateCount}回</Text>
                </div>
                <div>
                  <Text strong>API成功: </Text>
                  <Text style={{ color: '#52c41a' }}>{priceUpdateInfo.apiSuccessCount}回</Text>
                </div>
                <div>
                  <Text strong>最終更新: </Text>
                  <Text>{priceUpdateInfo.lastUpdateTime ? priceUpdateInfo.lastUpdateTime.toLocaleTimeString('ja-JP') : '未更新'}</Text>
                </div>
                <div>
                  <Text strong>最後の変動: </Text>
                  <Text style={{ color: priceUpdateInfo.lastChange >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {priceUpdateInfo.lastChange >= 0 ? '+' : ''}{priceUpdateInfo.lastChange.toFixed(5)}
                  </Text>
                </div>
                <div>
                  <Text strong>成功率: </Text>
                  <Text style={{ 
                    color: priceUpdateInfo.updateCount > 0 && 
                           (priceUpdateInfo.apiSuccessCount / priceUpdateInfo.updateCount) > 0.8 ? 
                           '#52c41a' : '#faad14' 
                  }}>
                    {priceUpdateInfo.updateCount > 0 ? 
                     Math.round((priceUpdateInfo.apiSuccessCount / priceUpdateInfo.updateCount) * 100) : 0}%
                  </Text>
                </div>
                <div>
                  <Text strong>キャッシュヒット: </Text>
                  <Text style={{ color: '#1890ff' }}>
                    {priceUpdateInfo.cacheHits}回 ({priceUpdateInfo.updateCount > 0 ? 
                     Math.round((priceUpdateInfo.cacheHits / priceUpdateInfo.updateCount) * 100) : 0}%)
                  </Text>
                </div>
                {priceUpdateInfo.cacheStats && (
                  <>
                    <div>
                      <Text strong>メモリキャッシュ: </Text>
                      <Text style={{ color: '#722ed1' }}>{priceUpdateInfo.cacheStats.memoryEntries}件</Text>
                    </div>
                    <div>
                      <Text strong>ストレージ使用量: </Text>
                      <Text style={{ color: '#eb2f96' }}>{priceUpdateInfo.cacheStats.localStorageUsage}KB</Text>
                    </div>
                  </>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader 
        currentPrice={currentPrice}
        currencyPair="USD/JPY"
        sessionInfo={getCurrentSession()}
        torbStatus={getTorbStatus()}
      />
      <Content style={{ padding: '16px' }}>
        <Tabs defaultActiveKey="chart" items={items} />
      </Content>
    </Layout>
  );
};

export default TradingPage;
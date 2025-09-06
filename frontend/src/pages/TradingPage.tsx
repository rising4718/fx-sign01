import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Card, Row, Col, Typography, Tag, Space } from 'antd';
import Chart from '../components/Chart';
import DualChart from '../components/DualChart';
import AntHeader from '../components/AntHeader';
import { fxApiService } from '../services/fxApi';
import { useSettings } from '../contexts/SettingsContext';

const { Content } = Layout;
const { Text } = Typography;

const TradingPage: React.FC = () => {
  const { settings, isDemo } = useSettings();
  const [currentPrice, setCurrentPrice] = useState<number>(150.123);
  const [chartData, setChartData] = useState<any[]>([]);
  const [detailChartData, setDetailChartData] = useState<any[]>([]);
  const [currentRange, setCurrentRange] = useState<{ high: number; low: number; width: number } | null>(null);
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

  // セッション情報を取得する関数
  const getCurrentSession = () => {
    const jst = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const hour = jst.getHours();
    
    if (hour >= 9 && hour < 15) return { name: '東京', color: '#52c41a' };
    if (hour >= 16 && hour < 24) return { name: 'ロンドン', color: '#1890ff' };
    if (hour >= 22 || hour < 2) return { name: 'NY序盤', color: '#fa8c16' };
    return { name: 'オフ', color: '#8c8c8c' };
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
    
    // 初期データ生成（過去19本 + 現在進行中の1本）
    const generateInitialData = () => {
      const data = [];
      
      // 過去19本の完成されたローソク足（正確な15分刻み）
      for (let i = 19; i >= 1; i--) {
        const candleDate = new Date(currentCandleStart.getTime() - i * 15 * 60 * 1000);
        const candleTime = Math.floor(candleDate.getTime() / 1000);
        const change = (Math.random() - 0.5) * 0.005;
        
        const open = basePrice;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * 0.002;
        const low = Math.min(open, close) - Math.random() * 0.002;
        
        data.push({
          time: candleTime,
          open: Number(open.toFixed(3)),
          high: Number(high.toFixed(3)),
          low: Number(low.toFixed(3)),
          close: Number(close.toFixed(3))
        });
        
        basePrice = close;
      }
      
      // 現在進行中のローソク足（最初の値）
      const currentTime = Math.floor(currentCandleStart.getTime() / 1000);
      const currentOpen = basePrice;
      data.push({
        time: currentTime,
        open: Number(currentOpen.toFixed(3)),
        high: Number(currentOpen.toFixed(3)),
        low: Number(currentOpen.toFixed(3)),
        close: Number(currentOpen.toFixed(3))
      });
      
      return data;
    };

    // TORB範囲計算関数
    const calculateRange = (data: any[]) => {
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
      
      // ブレイクアウト監視時間かチェック
      const isBreakoutTime = currentHour >= torbSettings.rangeEndHour && currentHour < torbSettings.tradingEndHour;
      
      if (isInRangeTime) {
        // レンジ形成期間：最高値・最安値を計算
        const rangeData = data.slice(-4); // 直近1時間分（15分足4本）
        if (rangeData.length >= 4) {
          const high = Math.max(...rangeData.map(d => d.high));
          const low = Math.min(...rangeData.map(d => d.low));
          const width = (high - low) * 10000; // pips換算
          
          if (width >= torbSettings.minRangeWidth && width <= torbSettings.maxRangeWidth) {
            setCurrentRange({ high, low, width: Number(width.toFixed(1)) });
          }
        }
      } else if (isBreakoutTime && currentRange && !activeSignal) {
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
        }
      } else if (currentHour >= torbSettings.tradingEndHour) {
        // 取引終了時間：リセット
        setCurrentRange(null);
        setActiveSignal(null);
      }
    };

    // 日別統計更新
    const updateDailyStats = (signal: any, result?: 'win' | 'loss' | null) => {
      const today = new Date().toLocaleDateString('ja-JP');
      const updatedStats = { ...dailyStats };
      
      if (!updatedStats[today]) {
        updatedStats[today] = {
          totalSignals: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
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
      } else if (result) {
        // シグナル結果更新時
        if (result === 'win') {
          updatedStats[today].wins += 1;
        } else if (result === 'loss') {
          updatedStats[today].losses += 1;
        }
        
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
        
        // 取引履歴を更新
        const updatedHistory = tradingHistory.map((trade: any) => {
          if (trade.entryPrice === activeSignal.entryPrice && trade.status === 'active') {
            return {
              ...trade,
              exitTime: new Date(),
              exitPrice: currentPrice,
              result,
              pips: Number(pips.toFixed(1)),
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
              exitPrice: currentPrice,
              closeReason: reason
            };
          }
          return signal;
        }));
        
        // 日別統計を更新
        updateDailyStats(activeSignal, result);
        
        // アクティブシグナルをクリア
        setActiveSignal(null);
        
        console.log(`🎯 自動決済: ${activeSignal.type.toUpperCase()} ${activeSignal.entryPrice} → ${currentPrice} (${result}: ${pips.toFixed(1)} pips) - ${reason}`);
      }
    };

    // 最後のローソク足を更新する関数（15分以内の価格変動）
    const updateCurrentCandle = (prevData: any[]) => {
      if (prevData.length === 0) return prevData;
      
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
        
        // デバッグログ：新しいローソク足作成
        const switchTime = new Date();
        console.log(`🕐 新しいローソク足作成: ${switchTime.toLocaleTimeString('ja-JP')} (予定時刻: ${next15MinTime.toLocaleTimeString('ja-JP')})`);
        setLastCandleSwitch(switchTime);
        
        const newCandle = {
          time: newCandleTime,
          open: Number(newOpen.toFixed(3)),
          high: Number(newOpen.toFixed(3)),
          low: Number(newOpen.toFixed(3)),
          close: Number(newOpen.toFixed(3))
        };
        
        newData.push(newCandle);
        
        // 20本以上になったら古いデータを削除
        if (newData.length > 20) {
          newData.shift();
        }
        
        // TORB計算を実行
        calculateRange(newData);
        
        return newData;
      } else {
        // 現在のローソク足を更新
        const volatility = 0.002;
        const priceChange = (Math.random() - 0.5) * volatility;
        const newClose = lastCandle.close + priceChange;
        
        // high/lowを適切に更新
        const newHigh = Math.max(lastCandle.high, newClose);
        const newLow = Math.min(lastCandle.low, newClose);
        
        newData[newData.length - 1] = {
          ...lastCandle,
          high: Number(newHigh.toFixed(3)),
          low: Number(newLow.toFixed(3)),
          close: Number(newClose.toFixed(3))
        };
        
        // 現在価格を更新
        setCurrentPrice(newClose);
        
        // TORB計算を実行
        calculateRange(newData);
        
        // アクティブシグナルの自動決済チェック
        checkAutoClose(newClose);
        
        return newData;
      }
    };

    // 初期データ設定
    const initialData = generateInitialData();
    setChartData(initialData);
    setCurrentPrice(initialData[initialData.length - 1]?.close || 150.123);
    
    // 5分足データ取得（12本）
    const generate5MinData = () => {
      const data = [];
      let detailPrice = basePrice;
      
      for (let i = 11; i >= 0; i--) {
        const candleDate = new Date(currentCandleStart.getTime() - i * 5 * 60 * 1000);
        const candleTime = Math.floor(candleDate.getTime() / 1000);
        const change = (Math.random() - 0.5) * 0.002;
        
        const open = detailPrice;
        const close = detailPrice + change;
        const high = Math.max(open, close) + Math.random() * 0.001;
        const low = Math.min(open, close) - Math.random() * 0.001;
        
        data.push({
          time: candleTime,
          open: Number(open.toFixed(3)),
          high: Number(high.toFixed(3)),
          low: Number(low.toFixed(3)),
          close: Number(close.toFixed(3))
        });
        
        detailPrice = close;
      }
      return data;
    };

    const detail5MinData = generate5MinData();
    setDetailChartData(detail5MinData);
    
    // 初期TORB計算
    calculateRange(initialData);

    // 1秒ごとに現在のローソク足を更新（リアルタイム価格変動）
    const interval = setInterval(() => {
      setChartData(prevData => {
        const updatedData = updateCurrentCandle(prevData);
        
        // 5分足データも同期して更新
        if (updatedData.length > 0) {
          const latestPrice = updatedData[updatedData.length - 1].close;
          setDetailChartData(prevDetailData => {
            const newDetailData = [...prevDetailData];
            if (newDetailData.length > 0) {
              const lastDetailCandle = newDetailData[newDetailData.length - 1];
              
              // 最後の5分足も現在価格で更新
              newDetailData[newDetailData.length - 1] = {
                ...lastDetailCandle,
                high: Math.max(lastDetailCandle.high, latestPrice),
                low: Math.min(lastDetailCandle.low, latestPrice),
                close: latestPrice
              };
            }
            return newDetailData;
          });
        }
        
        return updatedData;
      });
    }, 1000);

    return () => clearInterval(interval);
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
                <Card title="💰 損益" size="small" bodyStyle={{ padding: '12px' }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>残高</Text>
                    <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#52c41a' }}>
                      {(() => {
                        const today = new Date().toLocaleDateString('ja-JP');
                        const stats = dailyStats[today];
                        const totalPnL = stats ? (stats.wins * 5000) - (stats.losses * 3000) : 0;
                        const initialBalance = isDemo ? settings.demo.initialBalance : settings.demo.initialBalance;
                        return `¥${(initialBalance + totalPnL).toLocaleString()}`;
                      })()}
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
                        const totalPnL = stats ? (stats.wins * 5000) - (stats.losses * 3000) : 0;
                        return totalPnL >= 0 ? '#52c41a' : '#ff4d4f';
                      })()
                    }}>
                      {(() => {
                        const today = new Date().toLocaleDateString('ja-JP');
                        const stats = dailyStats[today];
                        const totalPnL = stats ? (stats.wins * 5000) - (stats.losses * 3000) : 0;
                        return `${totalPnL >= 0 ? '+' : ''}¥${totalPnL.toLocaleString()}`;
                      })()}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>DD</Text>
                    <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff4d4f' }}>
                      -¥12,000
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="📊 取引" size="small" bodyStyle={{ padding: '12px' }}>
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
                      23%
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="💼 ポジション" size="small" bodyStyle={{ padding: '12px' }}>
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
                            const pips = activeSignal.type === 'buy' 
                              ? (currentPrice - activeSignal.entryPrice) * 10000 
                              : (activeSignal.entryPrice - currentPrice) * 10000;
                            return pips >= 0 ? '#52c41a' : '#ff4d4f';
                          })()
                        }}>
                          {(() => {
                            const pips = activeSignal.type === 'buy' 
                              ? (currentPrice - activeSignal.entryPrice) * 10000 
                              : (activeSignal.entryPrice - currentPrice) * 10000;
                            return `${pips >= 0 ? '+' : ''}${pips.toFixed(1)}p`;
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
                <Card title="⚙️ システム" size="small" bodyStyle={{ padding: '12px' }}>
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
                <Card bodyStyle={{ padding: '12px' }}>
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
                <Card bodyStyle={{ padding: '12px' }}>
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
                <Card bodyStyle={{ padding: '12px' }}>
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
                <Card bodyStyle={{ padding: '12px' }}>
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
            <Card title="アクティブシグナル" size="small" bodyStyle={{ padding: '12px' }}>
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
      />
      <Content style={{ padding: '16px' }}>
        <Tabs defaultActiveKey="chart" items={items} />
      </Content>
    </Layout>
  );
};

export default TradingPage;
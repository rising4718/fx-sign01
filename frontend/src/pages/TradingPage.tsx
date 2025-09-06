import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Card, Row, Col, Typography, Tag, Space } from 'antd';
import Chart from '../components/Chart';
import AntHeader from '../components/AntHeader';

const { Content } = Layout;
const { Title, Text } = Typography;

const TradingPage: React.FC = () => {
  const [currentPrice, setCurrentPrice] = useState<number>(150.123);
  const [chartData, setChartData] = useState<any[]>([]);
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
    
    // 初期TORB計算
    calculateRange(initialData);

    // 1秒ごとに現在のローソク足を更新（リアルタイム価格変動）
    const interval = setInterval(() => {
      setChartData(prevData => updateCurrentCandle(prevData));
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
          <Col xs={24} lg={16}>
            <Card style={{ height: '600px' }}>
              <Chart data={chartData} width={1000} height={500} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Card title="TORB レンジ情報">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {currentRange ? (
                    <>
                      <div>
                        <Text strong>レンジ高値: </Text>
                        <Tag color="green">{currentRange.high.toFixed(3)}</Tag>
                      </div>
                      <div>
                        <Text strong>レンジ安値: </Text>
                        <Tag color="red">{currentRange.low.toFixed(3)}</Tag>
                      </div>
                      <div>
                        <Text strong>レンジ幅: </Text>
                        <Text>{currentRange.width} pips</Text>
                      </div>
                    </>
                  ) : (
                    <div>
                      <Text type="secondary">レンジ未形成</Text>
                    </div>
                  )}
                  <div>
                    <Text strong>現在価格: </Text>
                    <Tag color="blue">{currentPrice.toFixed(3)}</Tag>
                  </div>
                </Space>
              </Card>
              
              <Card title="シグナル状況">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>状態: </Text>
                    {(() => {
                      const now = new Date();
                      const currentHour = now.getHours();
                      const currentMinute = now.getMinutes();
                      
                      const isInRangeTime = (
                        currentHour === torbSettings.rangeStartHour && currentMinute >= torbSettings.rangeStartMinute
                      ) || (
                        currentHour === torbSettings.rangeEndHour && currentMinute < torbSettings.rangeEndMinute
                      ) || (
                        currentHour > torbSettings.rangeStartHour && currentHour < torbSettings.rangeEndHour
                      );
                      
                      const isBreakoutTime = currentHour >= torbSettings.rangeEndHour && currentHour < torbSettings.tradingEndHour;
                      
                      if (isInRangeTime) {
                        return <Tag color="orange">レンジ形成中</Tag>;
                      } else if (isBreakoutTime) {
                        return <Tag color="blue">ブレイクアウト監視中</Tag>;
                      } else {
                        return <Tag color="gray">取引時間外</Tag>;
                      }
                    })()} 
                  </div>
                  <div>
                    <Text strong>レンジ時間: </Text>
                    <Text>{torbSettings.rangeStartHour.toString().padStart(2, '0')}:{torbSettings.rangeStartMinute.toString().padStart(2, '0')} - {torbSettings.rangeEndHour.toString().padStart(2, '0')}:{torbSettings.rangeEndMinute.toString().padStart(2, '0')}</Text>
                  </div>
                  {activeSignal ? (
                    <div>
                      <Text strong>アクティブシグナル: </Text>
                      <Tag color={activeSignal.type === 'buy' ? 'green' : 'red'}>
                        {activeSignal.type === 'buy' ? 'BUY' : 'SELL'} {activeSignal.entryPrice}
                      </Tag>
                    </div>
                  ) : (
                    <div>
                      <Text strong>次のシグナル: </Text>
                      <Text>ブレイクアウト待ち</Text>
                    </div>
                  )}
                </Space>
              </Card>
              
              <Card title="デバッグ情報" size="small">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>現在時刻</Text>
                    <br />
                    <Text code>{new Date().toLocaleTimeString('ja-JP')}</Text>
                  </div>
                  
                  {lastCandleSwitch && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>最後の足切替</Text>
                      <br />
                      <Text code>{lastCandleSwitch.toLocaleTimeString('ja-JP')}</Text>
                    </div>
                  )}
                  
                  {chartData.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>現在の足時刻</Text>
                      <br />
                      <Text code>
                        {new Date(chartData[chartData.length - 1].time * 1000).toLocaleTimeString('ja-JP')}
                      </Text>
                    </div>
                  )}
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      ),
    },
    {
      key: 'signals',
      label: (
        <span>
          🎯 シグナル履歴
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>今日のシグナル履歴</Title>
          
          {/* 日別統計サマリー */}
          {(() => {
            const today = new Date().toLocaleDateString('ja-JP');
            const todayStats = dailyStats[today];
            
            if (todayStats) {
              return (
                <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f2ff' }}>
                  <Space size="large">
                    <div>
                      <Text strong>総シグナル数: </Text>
                      <Tag color="blue">{todayStats.totalSignals}</Tag>
                    </div>
                    <div>
                      <Text strong>勝利: </Text>
                      <Tag color="green">{todayStats.wins}</Tag>
                    </div>
                    <div>
                      <Text strong>敗北: </Text>
                      <Tag color="red">{todayStats.losses}</Tag>
                    </div>
                    <div>
                      <Text strong>勝率: </Text>
                      <Tag color={todayStats.winRate >= 50 ? 'green' : 'orange'}>
                        {todayStats.winRate}%
                      </Tag>
                    </div>
                  </Space>
                </Card>
              );
            }
            return (
              <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f6f6f6' }}>
                <Text type="secondary">今日はまだシグナルが発生していません</Text>
              </Card>
            );
          })()}
          
          {/* シグナル履歴リスト */}
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {signalHistory.length > 0 ? (
              signalHistory.map((signal, index) => (
                <Card key={signal.id || index} size="small">
                  <Space>
                    <Tag color={signal.type === 'buy' ? 'green' : 'red'}>
                      {signal.type === 'buy' ? 'BUY' : 'SELL'}
                    </Tag>
                    <Text strong>{signal.entryPrice}</Text>
                    <Text type="secondary">
                      {signal.timestamp ? new Date(signal.timestamp).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''}
                    </Text>
                    {signal.result ? (
                      <>
                        <Tag color={signal.result === 'win' ? 'green' : 'red'}>
                          {signal.result === 'win' ? '利確' : '損切り'}
                        </Tag>
                        <Text strong style={{ color: signal.result === 'win' ? '#52c41a' : '#ff4d4f' }}>
                          {signal.pips > 0 ? '+' : ''}{signal.pips} pips
                        </Text>
                      </>
                    ) : (
                      <Tag color="orange">進行中</Tag>
                    )}
                  </Space>
                </Card>
              ))
            ) : (
              <Card size="small">
                <Text type="secondary">シグナル履歴がありません</Text>
              </Card>
            )}
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader currentPrice={currentPrice} />
      <Content style={{ padding: '24px' }}>
        <Tabs defaultActiveKey="chart" items={items} />
      </Content>
    </Layout>
  );
};

export default TradingPage;
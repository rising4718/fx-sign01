import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Card, Statistic, Row, Col, Typography, Tag, Space, Button, message } from 'antd';
import { LineChartOutlined, SettingOutlined, RiseOutlined, InfoCircleOutlined, DollarOutlined, BarChartOutlined } from '@ant-design/icons';
import Chart from './components/Chart';
import LogicManagement from './components/LogicManagement';
import TradingResults from './components/TradingResults';
import FundManagement from './components/FundManagement';
import 'antd/dist/reset.css';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function AppWithChart() {
  const [currentPrice, setCurrentPrice] = useState(150.123);
  const [chartData, setChartData] = useState([]);
  const [lastCandleSwitch, setLastCandleSwitch] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'logic' | 'results' | 'fund'>('chart');
  
  // レンジとサイン管理
  const [currentRange, setCurrentRange] = useState<{high: number, low: number, width: number} | null>(null);
  const [activeSignal, setActiveSignal] = useState<{
    type: 'buy' | 'sell',
    entryPrice: number,
    targetPrice: number,
    stopPrice: number,
    timestamp: Date
  } | null>(null);
  const [signalHistory, setSignalHistory] = useState<any[]>([]);
  const [tradingHistory, setTradingHistory] = useState(() => {
    const saved = localStorage.getItem('tradingHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  // TORBロジック設定（ローカルストレージから取得）
  const [torbSettings, setTorbSettings] = useState(() => {
    const saved = localStorage.getItem('torbSettings');
    return saved ? JSON.parse(saved) : {
      rangeStartHour: 9,
      rangeStartMinute: 0,
      rangeEndHour: 10,
      rangeEndMinute: 0,
      tradingEndHour: 17,
      tradingEndMinute: 0,
      minRangeWidth: 5,
      maxRangeWidth: 50,
      profitMultiplier: 1.5,
      stopLossBuffer: 2
    };
  });

  // ローカルストレージの変更を監視
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('torbSettings');
      if (saved) {
        setTorbSettings(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 同じタブ内での変更も検知するために定期的にチェック
    const interval = setInterval(() => {
      const saved = localStorage.getItem('torbSettings');
      if (saved) {
        const newSettings = JSON.parse(saved);
        setTorbSettings(prevSettings => {
          // オブジェクトの値が変更されているかチェック
          if (JSON.stringify(prevSettings) !== JSON.stringify(newSettings)) {
            return newSettings;
          }
          return prevSettings;
        });
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
      status: 'active', // active, completed
      settings: { ...torbSettings },
      autoRecorded: true // 自動記録フラグ
    };
    
    const updatedHistory = [tradeRecord, ...tradingHistory];
    setTradingHistory(updatedHistory);
    localStorage.setItem('tradingHistory', JSON.stringify(updatedHistory));
    
    console.log(`🚀 ${signal.type}シグナル発生 → 自動記録完了`, tradeRecord);
  };

  // 取引実行ハンドラー（手動用 - 今後は不要）
  const executeTrade = () => {
    if (!activeSignal) return;
    
    // アクティブシグナルを取引履歴に追加（エントリー状態）
    const tradeRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ja-JP'),
      signalTime: activeSignal.timestamp,
      entryTime: new Date(),
      type: activeSignal.type,
      entryPrice: activeSignal.entryPrice,
      targetPrice: activeSignal.targetPrice,
      stopPrice: activeSignal.stopPrice,
      exitPrice: null,
      result: null,
      pips: null,
      status: 'active', // active, completed
      settings: { ...torbSettings }
    };
    
    const updatedHistory = [tradeRecord, ...tradingHistory];
    setTradingHistory(updatedHistory);
    localStorage.setItem('tradingHistory', JSON.stringify(updatedHistory));
    
    // アクティブシグナルを履歴に移動
    setSignalHistory(prev => [activeSignal, ...prev.slice(0, 9)]);
    setActiveSignal(null);
    
    message.success('取引を実行しました');
  };

  // 取引決済ハンドラー
  const closeTrade = (tradeId: number, exitPrice: number, result: 'win' | 'loss') => {
    const updatedHistory = tradingHistory.map((trade: any) => {
      if (trade.id === tradeId && trade.status === 'active') {
        const pips = trade.type === 'buy' 
          ? (exitPrice - trade.entryPrice) * 10000 
          : (trade.entryPrice - exitPrice) * 10000;
        
        return {
          ...trade,
          exitTime: new Date(),
          exitPrice,
          result,
          pips: Number(pips.toFixed(1)),
          status: 'completed'
        };
      }
      return trade;
    });
    
    setTradingHistory(updatedHistory);
    localStorage.setItem('tradingHistory', JSON.stringify(updatedHistory));
    
    message.success(`取引を決済しました（${result === 'win' ? '利確' : '損切り'}）`);
  };

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

    // レンジ計算とサイン検知
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
          
          // 🔥 自動で取引記録を保存
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
          
          // 🔥 自動で取引記録を保存
          autoSaveTradingRecord(signal);
        }
      } else if (currentHour >= torbSettings.tradingEndHour) {
        // 取引終了時間：リセット
        setCurrentRange(null);
        setActiveSignal(null);
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
        
        // 古いデータを削除して新しいローソク足を追加
        newData.splice(0, 1);
        newData.push(newCandle);
      } else {
        // 現在のローソク足を更新（価格変動）
        const change = (Math.random() - 0.5) * 0.003;
        const newClose = lastCandle.close + change;
        
        lastCandle.close = Number(newClose.toFixed(3));
        lastCandle.high = Number(Math.max(lastCandle.high, newClose).toFixed(3));
        lastCandle.low = Number(Math.min(lastCandle.low, newClose).toFixed(3));
      }
      
      setCurrentPrice(lastCandle.close);
      
      // レンジ計算とサイン検知を実行
      calculateRange(newData);
      
      return newData;
    };

    // 初期データ設定
    const initialData = generateInitialData();
    setChartData(initialData);
    setCurrentPrice(initialData[initialData.length - 1]?.close || 150.123);

    // 1秒ごとに現在のローソク足を更新（リアルタイム価格変動）
    const interval = setInterval(() => {
      setChartData(prevData => updateCurrentCandle(prevData));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const tabItems = [
    {
      key: 'chart',
      label: (
        <span>
          <LineChartOutlined />
          チャート分析
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col span={18}>
              <Card 
                title={
                  <Space>
                    <RiseOutlined />
                    <Text strong>USD/JPY - 15分足チャート</Text>
                  </Space>
                }
                style={{ height: '100%' }}
              >
                <Chart data={chartData} width={950} height={500} />
              </Card>
            </Col>
            
            <Col span={6}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card 
                  title={
                    <span>
                      <InfoCircleOutlined /> 東京時間レンジブレイクアウト
                    </span>
                  } 
                  size="small"
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>レンジ時間</Text>
                      <br />
                      <Text strong>
                        {torbSettings.rangeStartHour.toString().padStart(2, '0')}:{torbSettings.rangeStartMinute.toString().padStart(2, '0')} - 
                        {torbSettings.rangeEndHour.toString().padStart(2, '0')}:{torbSettings.rangeEndMinute.toString().padStart(2, '0')}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>レンジ幅</Text>
                      <br />
                      <Text strong>{torbSettings.minRangeWidth} - {torbSettings.maxRangeWidth} pips</Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>利確倍率 / 取引終了</Text>
                      <br />
                      <Text strong>
                        {torbSettings.profitMultiplier}x / {torbSettings.tradingEndHour.toString().padStart(2, '0')}:{torbSettings.tradingEndMinute.toString().padStart(2, '0')}
                      </Text>
                    </div>
                  </Space>
                  <div style={{ marginTop: 12 }}>
                    <Tag color="blue">レンジブレイクアウト戦略</Tag>
                  </div>
                </Card>

                <Card title="シグナル状況" size="small">
                  {activeSignal ? (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ 
                        background: activeSignal.type === 'buy' ? '#f6ffed' : '#fff2e8',
                        padding: '8px',
                        borderRadius: '4px',
                        border: `1px solid ${activeSignal.type === 'buy' ? '#b7eb8f' : '#ffbb96'}`
                      }}>
                        <Text strong style={{ 
                          color: activeSignal.type === 'buy' ? '#52c41a' : '#fa8c16',
                          fontSize: '14px'
                        }}>
                          🚨 {activeSignal.type === 'buy' ? '買いシグナル' : '売りシグナル'}
                        </Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>エントリー価格</Text>
                        <br />
                        <Text strong>{activeSignal.entryPrice}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>利確目標 / 損切り</Text>
                        <br />
                        <Text strong style={{ color: '#52c41a' }}>{activeSignal.targetPrice}</Text>
                        <Text> / </Text>
                        <Text strong style={{ color: '#f5222d' }}>{activeSignal.stopPrice}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          {activeSignal.timestamp.toLocaleTimeString('ja-JP')} 発生
                        </Text>
                      </div>
                      <div style={{ 
                        background: '#e6f7ff', 
                        padding: '8px', 
                        borderRadius: '4px',
                        border: '1px solid #91d5ff',
                        textAlign: 'center'
                      }}>
                        <Text style={{ fontSize: '12px', color: '#1890ff' }}>
                          ✅ 取引記録を自動保存しました
                        </Text>
                      </div>
                    </Space>
                  ) : currentRange ? (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Tag color="blue">レンジ形成中</Tag>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>High / Low</Text>
                        <br />
                        <Text>{currentRange.high} / {currentRange.low}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>レンジ幅</Text>
                        <br />
                        <Text strong>{currentRange.width} pips</Text>
                      </div>
                    </Space>
                  ) : (
                    <Tag color="orange">待機中</Tag>
                  )}
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
        </div>
      )
    },
    {
      key: 'logic',
      label: (
        <span>
          <SettingOutlined />
          戦略設定
        </span>
      ),
      children: <LogicManagement />
    },
    {
      key: 'results',
      label: (
        <span>
          <BarChartOutlined />
          取引実績
        </span>
      ),
      children: <TradingResults />
    },
    {
      key: 'fund',
      label: (
        <span>
          <DollarOutlined />
          資金管理
        </span>
      ),
      children: <FundManagement />
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            FX Sign Tool - Phase 2
          </Title>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text style={{ color: 'white', fontSize: '16px' }}>USD/JPY</Text>
          <Statistic
            value={currentPrice}
            precision={3}
            valueStyle={{ 
              color: 'white', 
              fontSize: '24px', 
              fontFamily: 'Monaco, Menlo, monospace' 
            }}
          />
        </div>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Tabs
          defaultActiveKey="chart"
          items={tabItems}
          size="large"
          style={{ 
            background: 'white',
            borderRadius: '8px',
            padding: '16px'
          }}
        />
      </Content>
    </Layout>
  );
}

export default AppWithChart;
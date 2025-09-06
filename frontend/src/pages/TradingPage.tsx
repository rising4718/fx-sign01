import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Card, Row, Col, Typography, Tag, Space } from 'antd';
import Chart from '../components/Chart';
import AntHeader from '../components/AntHeader';

const { Content } = Layout;
const { Title, Text } = Typography;

const TradingPage: React.FC = () => {
  const [currentPrice, setCurrentPrice] = useState<number>(150.123);
  const [chartData, setChartData] = useState<any[]>([]);
  const [torbRange, setTorbRange] = useState({ high: 150.200, low: 150.050 });
  const [lastCandleSwitch, setLastCandleSwitch] = useState<Date | null>(null);

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
        
        return newData;
      }
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
                  <div>
                    <Text strong>レンジ高値: </Text>
                    <Tag color="green">{torbRange.high.toFixed(3)}</Tag>
                  </div>
                  <div>
                    <Text strong>レンジ安値: </Text>
                    <Tag color="red">{torbRange.low.toFixed(3)}</Tag>
                  </div>
                  <div>
                    <Text strong>レンジ幅: </Text>
                    <Text>{((torbRange.high - torbRange.low) * 100).toFixed(1)} pips</Text>
                  </div>
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
                    <Tag color="orange">レンジ形成中</Tag>
                  </div>
                  <div>
                    <Text strong>時間: </Text>
                    <Text>9:00 - 9:45 (東京時間)</Text>
                  </div>
                  <div>
                    <Text strong>次のシグナル: </Text>
                    <Text>ブレイクアウト待ち</Text>
                  </div>
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
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Card size="small">
              <Space>
                <Tag color="green">BUY</Tag>
                <Text>150.180</Text>
                <Text type="secondary">09:47</Text>
                <Tag color="blue">+25 pips</Tag>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <Tag color="red">SELL</Tag>
                <Text>149.950</Text>
                <Text type="secondary">10:15</Text>
                <Tag color="orange">進行中</Tag>
              </Space>
            </Card>
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
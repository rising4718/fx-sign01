import React, { useState, useEffect } from 'react';
import Chart from './components/Chart';
import './App.css';

function AppWithChart() {
  const [currentPrice, setCurrentPrice] = useState(150.123);
  const [chartData, setChartData] = useState([]);
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>FX Sign Tool - Phase 2</h1>
        <div className="market-info">
          <span>USD/JPY</span>
          <span className="price">{currentPrice}</span>
        </div>
      </header>
      
      <main className="main-content">
        <div className="chart-section">
          <Chart data={chartData} width={1000} height={500} />
        </div>
        
        <div className="info-panel">
          <div className="torb-section">
            <h4>TORB レンジ状況</h4>
            <p>チャートデータ: {chartData.length} 本</p>
            <p>ステータス: TORB統合準備完了</p>
          </div>
          
          <div className="torb-section">
            <h4>シグナル状況</h4>
            <p>アクティブなシグナルなし</p>
          </div>

          <div className="torb-section">
            <h4>デバッグ情報</h4>
            <p>現在時刻: {new Date().toLocaleTimeString('ja-JP')}</p>
            {lastCandleSwitch && (
              <p>最後の足切替: {lastCandleSwitch.toLocaleTimeString('ja-JP')}</p>
            )}
            {chartData.length > 0 && (
              <p>現在の足時刻: {new Date(chartData[chartData.length - 1].time * 1000).toLocaleTimeString('ja-JP')}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppWithChart;
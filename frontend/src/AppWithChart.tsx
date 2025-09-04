import React, { useState, useEffect } from 'react';
import Chart from './components/Chart';
import './App.css';

function AppWithChart() {
  const [currentPrice, setCurrentPrice] = useState(150.123);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // 簡単なモックデータ生成
    const generateData = () => {
      const data = [];
      let price = 150.0;
      const now = Date.now();
      
      for (let i = 0; i < 20; i++) {
        const time = Math.floor((now - (19 - i) * 15 * 60 * 1000) / 1000);
        const change = (Math.random() - 0.5) * 0.005;
        
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 0.002;
        const low = Math.min(open, close) - Math.random() * 0.002;
        
        data.push({
          time,
          open: Number(open.toFixed(3)),
          high: Number(high.toFixed(3)),
          low: Number(low.toFixed(3)),
          close: Number(close.toFixed(3))
        });
        
        price = close;
      }
      
      return data;
    };

    const data = generateData();
    setChartData(data);
    setCurrentPrice(data[data.length - 1]?.close || 150.123);
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
            <h4>TORB Range Status</h4>
            <p>Chart Data: {chartData.length} candles</p>
            <p>Current Price: {currentPrice}</p>
            <p>Status: Ready for TORB integration</p>
          </div>
          
          <div className="torb-section">
            <h4>Signal Status</h4>
            <p>No active signal</p>
          </div>

          <div className="torb-section">
            <h4>Current Price</h4>
            <p className="price-value">{currentPrice}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppWithChart;
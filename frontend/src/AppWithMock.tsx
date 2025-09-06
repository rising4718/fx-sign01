import Header from "./components/Header";
import { useState, useEffect } from 'react';
import Chart from './components/Chart';
import './App.css';

function AppWithMock() {
  const [currentPrice, setCurrentPrice] = useState(150.123);
  const [change, setChange] = useState(0.045);
  const [chartData, setChartData] = useState<{time: number, open: number, high: number, low: number, close: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 簡単なモックデータ生成
  useEffect(() => {
    const generateMockData = () => {
      const data = [];
      let basePrice = 150.0;
      const now = Date.now();
      
      for (let i = 0; i < 50; i++) {
        const time = Math.floor((now - (49 - i) * 15 * 60 * 1000) / 1000);
        const volatility = 0.001;
        const change = (Math.random() - 0.5) * volatility;
        
        const open = basePrice;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * 0.001;
        const low = Math.min(open, close) - Math.random() * 0.001;
        
        data.push({
          time,
          open: Number(open.toFixed(3)),
          high: Number(high.toFixed(3)),
          low: Number(low.toFixed(3)),
          close: Number(close.toFixed(3))
        });
        
        basePrice = close;
      }
      
      return data;
    };

    // データ生成をシミュレート
    setTimeout(() => {
      const mockData = generateMockData();
      setChartData(mockData);
      setCurrentPrice(mockData[mockData.length - 1]?.close || 150.123);
      setIsLoading(false);
    }, 1000);

    // 価格更新をシミュレート
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const newChange = (Math.random() - 0.5) * 0.005;
        const newPrice = prev + newChange;
        setChange(newChange);
        return Number(newPrice.toFixed(3));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="loading">
        <h2>Loading FX data...</h2>
      </div>
    );
  }

  return (
    <div className="app">
      <Header 
        currentPrice={{
          symbol: 'USDJPY',
          price: currentPrice,
          change: change,
          changePercent: (change / currentPrice) * 100,
          timestamp: new Date().toISOString()
        }}
        error="Using mock data - External API disabled"
      />
      
      <main className="main-content">
        <div className="chart-section">
          <Chart data={chartData} width={1000} height={500} />
        </div>
        
        <div className="info-panel">
          <div className="torb-section">
            <h4>TORB Range Status</h4>
            <p>Chart Data: {chartData.length} candles</p>
            <p>Current Price: {currentPrice}</p>
            <p>Status: Mock data active</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppWithMock;
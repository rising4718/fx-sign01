import React from 'react';
import Chart from './components/Chart';
import { useFxData } from './hooks/useFxData';
import './App.css';

function AppWithData() {
  const { chartData, currentPrice, isLoading, error } = useFxData('USDJPY');

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className="loading">
        <h2>Loading FX data...</h2>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>FX Sign Tool - Phase 2</h1>
        <div className="market-info">
          <span>USD/JPY</span>
          <span className="price">
            {currentPrice ? currentPrice.price.toFixed(3) : 'Loading...'}
          </span>
          {currentPrice && (
            <span className={`change ${currentPrice.change >= 0 ? 'positive' : 'negative'}`}>
              {currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(3)}
              ({currentPrice.changePercent >= 0 ? '+' : ''}{currentPrice.changePercent.toFixed(2)}%)
            </span>
          )}
        </div>
        {error && (
          <div className="error-message">
            {error} - Using mock data
          </div>
        )}
      </header>
      
      <main className="main-content">
        <div className="chart-section">
          <Chart data={chartData} width={1000} height={500} />
        </div>
        
        <div className="info-panel">
          <div className="torb-section">
            <h4>TORB Range Status</h4>
            <p>Chart Data: {chartData.length} candles</p>
            <p>Current Price: {currentPrice?.price || 'N/A'}</p>
            <p>Last Update: {currentPrice?.timestamp ? new Date(currentPrice.timestamp).toLocaleTimeString() : 'N/A'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppWithData;
import React from 'react';
import Chart from './components/Chart';
import TORBPanel from './components/TORBPanel';
import { useFxData } from './hooks/useFxData';
import { useTORBAnalysis } from './hooks/useTORBAnalysis';
import './App.css';

function App() {
  const { chartData, currentPrice, isLoading, error, refreshData } = useFxData('USDJPY');
  const torbAnalysis = useTORBAnalysis(chartData, currentPrice);

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
          <TORBPanel
            currentRange={torbAnalysis.currentRange}
            activeSignal={torbAnalysis.activeSignal}
            signalStatus={torbAnalysis.signalStatus}
            currentPrice={currentPrice?.price || 0}
          />
        </div>
      </main>
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading FX data...</div>
        </div>
      )}
    </div>
  );
}

export default App;
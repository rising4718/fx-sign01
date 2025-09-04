import React, { useState, useEffect } from 'react';
import './App.css';

function AppNoChart() {
  const [currentPrice, setCurrentPrice] = useState(150.123);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('useEffect triggered');
    
    setTimeout(() => {
      console.log('setTimeout executed, setting loading to false');
      setIsLoading(false);
      setCurrentPrice(150.456);
    }, 1000);
  }, []);

  console.log('Render - isLoading:', isLoading, 'currentPrice:', currentPrice);

  if (isLoading) {
    console.log('Rendering loading state');
    return (
      <div className="loading">
        <h2>Loading FX data...</h2>
      </div>
    );
  }

  console.log('Rendering main app');
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
          <h2>App Working Successfully!</h2>
          <p>Current Price: {currentPrice}</p>
          <p>No Chart Component - Testing Basic Functionality</p>
        </div>
        
        <div className="info-panel">
          <div className="torb-section">
            <h4>Status Panel</h4>
            <p>✅ React rendering working</p>
            <p>✅ State management working</p>
            <p>✅ useEffect working</p>
            <p>✅ CSS styling working</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppNoChart;
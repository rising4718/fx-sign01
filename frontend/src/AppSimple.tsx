import React from 'react';
import './App.css';

function AppSimple() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>FX Sign Tool - Phase 2</h1>
        <div className="market-info">
          <span>USD/JPY</span>
          <span className="price">Testing...</span>
        </div>
      </header>
      
      <main className="main-content">
        <div className="chart-section">
          <h2>App is working!</h2>
          <p>Basic React rendering successful.</p>
        </div>
        
        <div className="info-panel">
          <div className="torb-section">
            <h4>Test Panel</h4>
            <p>React components rendering correctly.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppSimple;
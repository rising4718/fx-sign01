import React from 'react';
import './App.css';

function AppMinimal() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>FX Sign Tool - Phase 2</h1>
        <div className="market-info">
          <span>USD/JPY</span>
          <span className="price">150.000</span>
        </div>
      </header>
      
      <main className="main-content">
        <div className="chart-section">
          <h2>✅ FX App is Running Successfully!</h2>
          <p>Basic React components working correctly.</p>
          <p>CSS styling applied successfully.</p>
          <p>Ready to add more functionality.</p>
        </div>
        
        <div className="info-panel">
          <div className="torb-section">
            <h4>TORB Range Status</h4>
            <p>No range detected</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppMinimal;
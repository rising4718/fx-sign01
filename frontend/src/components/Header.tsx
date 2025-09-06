import React from 'react';
import { type MarketData } from '../types';

interface HeaderProps {
  currentPrice?: MarketData | null;
  error?: string | null;
  currencyPair?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  currentPrice, 
  error, 
  currencyPair = 'USD/JPY' 
}) => {
  return (
    <header className="app-header">
      <h1 style={{fontSize: '1rem'}}>FX Pattern Analyzer</h1>
      <div className="market-info" style={{fontSize: '1rem'}}>
        <span>{currencyPair}</span>
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
  );
};

export default Header;
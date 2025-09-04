import React from 'react';

interface TORBRange {
  high: number;
  low: number;
  width: number;
  startTime: string;
  endTime: string;
}

interface TORBSignal {
  type: 'BUY' | 'SELL';
  price: number;
  time: string;
  target: number;
  stopLoss: number;
  rangeHigh: number;
  rangeLow: number;
}

interface TORBPanelProps {
  currentRange: TORBRange | null;
  activeSignal: TORBSignal | null;
  signalStatus: 'ACTIVE' | 'PROFIT' | 'LOSS' | null;
  currentPrice: number;
}

const TORBPanel: React.FC<TORBPanelProps> = ({
  currentRange,
  activeSignal,
  signalStatus,
  currentPrice
}) => {
  return (
    <div className="torb-panel">
      <div className="torb-section">
        <h4>TORB Range Status</h4>
        {currentRange ? (
          <div>
            <p>High: {currentRange.high}</p>
            <p>Low: {currentRange.low}</p>
            <p>Width: {currentRange.width} pips</p>
          </div>
        ) : (
          <p>No range detected</p>
        )}
      </div>

      <div className="torb-section">
        <h4>Signal Status</h4>
        {activeSignal ? (
          <div>
            <p>Type: {activeSignal.type}</p>
            <p>Price: {activeSignal.price}</p>
            <p>Target: {activeSignal.target}</p>
            <p>Stop Loss: {activeSignal.stopLoss}</p>
            <p>Status: {signalStatus}</p>
          </div>
        ) : (
          <p>No active signal</p>
        )}
      </div>

      <div className="torb-section">
        <h4>Current Price</h4>
        <p>{currentPrice}</p>
      </div>
    </div>
  );
};

export default TORBPanel;
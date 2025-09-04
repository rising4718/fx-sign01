import React, { useEffect, useRef } from 'react';

interface CandlestickData {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartProps {
  data: CandlestickData[];
  width?: number;
  height?: number;
}

const Chart: React.FC<ChartProps> = ({ data, width = 800, height = 400 }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // 改良されたプレースホルダー表示
    const container = chartContainerRef.current;
    const latestPrice = data.length > 0 ? data[data.length - 1] : null;
    
    container.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: 100%; 
        background: linear-gradient(135deg, #1e1e1e 0%, #2d3748 100%); 
        color: #fff; 
        border-radius: 8px;
        position: relative;
      ">
        <div style="text-align: center;">
          <h3 style="margin: 0 0 1rem 0; color: #4ade80;">USD/JPY Chart</h3>
          <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <p style="margin: 0.5rem 0; font-size: 1.1rem;"><strong>データ件数:</strong> ${data.length} candles</p>
            ${latestPrice ? `
              <p style="margin: 0.5rem 0;"><strong>最新価格:</strong> ${latestPrice.close}</p>
              <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #94a3b8;">
                O: ${latestPrice.open} | H: ${latestPrice.high} | L: ${latestPrice.low} | C: ${latestPrice.close}
              </p>
            ` : ''}
          </div>
          <p style="margin: 0; color: #fbbf24; font-size: 0.9rem;">📈 Lightweight Charts 準備中...</p>
        </div>
        <div style="
          position: absolute; 
          bottom: 10px; 
          right: 10px; 
          background: rgba(34, 197, 94, 0.2); 
          color: #22c55e; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 0.8rem;
        ">
          ✅ Data Ready
        </div>
      </div>
    `;
    
  }, [data]);
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>USD/JPY - 15分足</h3>
        <span className="data-info">{data.length} candles</span>
      </div>
      <div 
        ref={chartContainerRef}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          border: '1px solid #333',
          borderRadius: '8px'
        }}
      />
    </div>
  );
};

export default Chart;
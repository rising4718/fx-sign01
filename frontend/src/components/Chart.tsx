import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

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
    if (!chartContainerRef.current || data.length === 0) return;
    
    // コンテナをクリア
    chartContainerRef.current.innerHTML = '';
    
    // Canvas要素を作成
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.background = '#1e1e1e';
    canvas.style.borderRadius = '8px';
    chartContainerRef.current.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 価格の範囲を計算
    const allPrices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;
    
    // 描画パラメータ（価格ラベル用に右側余白を増加）
    const chartLeft = 60;
    const chartRight = width - 80;
    const chartTop = 30;
    const chartBottom = height - 50;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;
    const candleWidth = chartWidth / data.length * 0.8;
    
    // 価格を画面座標に変換
    const priceToY = (price: number) => {
      return chartTop + (maxPrice + padding - price) / (priceRange + padding * 2) * chartHeight;
    };
    
    // 背景とグリッドを描画
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);
    
    // グリッド線
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = chartTop + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }
    
    // 価格軸ラベル
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice + padding - (priceRange + padding * 2) / 5 * i;
      const y = chartTop + (chartHeight / 5) * i;
      ctx.fillText(price.toFixed(3), chartLeft - 10, y + 4);
    }
    
    // 時間軸ラベル（15分刻みで表示）
    ctx.textAlign = 'center';
    data.forEach((candle, index) => {
      const date = new Date(candle.time * 1000);
      const minutes = date.getMinutes();
      
      // 15分刻み（00, 15, 30, 45）の時だけラベルを表示
      if (minutes % 15 === 0) {
        const x = chartLeft + (index + 0.5) * (chartWidth / data.length);
        const timeStr = date.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        ctx.fillText(timeStr, x, height - 5);
      }
    });
    
    // ローソク足を描画
    data.forEach((candle, index) => {
      const x = chartLeft + (index + 0.5) * (chartWidth / data.length);
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      
      const isUp = candle.close > candle.open;
      const color = isUp ? '#4caf50' : '#f44336';
      
      // ひげを描画
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // 実体を描画
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });
    
    // 現在価格ラベル（最後のローソク足の位置に表示）
    if (data.length > 0) {
      const lastCandle = data[data.length - 1];
      const lastIndex = data.length - 1;
      const lastX = chartLeft + (lastIndex + 0.5) * (chartWidth / data.length);
      const currentPriceY = priceToY(lastCandle.close);
      
      // 価格ラベルの背景ボックス
      const labelText = lastCandle.close.toFixed(3);
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      const labelWidth = ctx.measureText(labelText).width + 8;
      const labelHeight = 18;
      
      // 背景色（価格の動きに応じて色を変える）
      const isUp = lastCandle.close >= lastCandle.open;
      ctx.fillStyle = isUp ? '#4caf50' : '#f44336';
      ctx.fillRect(lastX + 10, currentPriceY - labelHeight/2, labelWidth, labelHeight);
      
      // 価格テキスト
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(labelText, lastX + 14, currentPriceY + 4);
      
      // 価格ラインを右端まで延長
      ctx.strokeStyle = isUp ? '#4caf50' : '#f44336';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lastX + 10, currentPriceY);
      ctx.lineTo(chartRight, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // タイトル
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📊 USD/JPY 15分足チャート', width / 2, 25);
    
    
    console.log('Canvas chart drawn successfully');
  }, [data, width, height]);
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>USD/JPY - 15分足</h3>
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
import React, { useEffect, useRef } from 'react';

interface FundGrowthData {
  date: string;
  balance: number;
  drawdown: number;
  trades: number;
}

interface FundGrowthChartProps {
  data: FundGrowthData[];
  initialCapital: number;
  width?: number;
  height?: number;
}

const FundGrowthChart: React.FC<FundGrowthChartProps> = ({ 
  data, 
  initialCapital, 
  width = 600, 
  height = 300 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min/max values
    const maxBalance = Math.max(...data.map(d => d.balance), initialCapital);
    const minBalance = Math.min(...data.map(d => d.balance), initialCapital);
    const range = maxBalance - minBalance;
    const yMargin = range * 0.1;

    const yMax = maxBalance + yMargin;
    const yMin = minBalance - yMargin;

    // Helper functions
    const xPos = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
    const yPos = (value: number) => padding.top + ((yMax - value) / (yMax - yMin)) * chartHeight;

    // Draw grid lines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (price levels)
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const value = yMin + (yMax - yMin) * (i / gridSteps);
      const y = yPos(value);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      
      // Y-axis labels
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`¥${Math.round(value).toLocaleString()}`, padding.left - 10, y + 4);
    }

    // Vertical grid lines (dates)
    const dateSteps = Math.min(5, data.length - 1);
    for (let i = 0; i <= dateSteps; i++) {
      const index = Math.round((i / dateSteps) * (data.length - 1));
      const x = xPos(index);
      
      ctx.strokeStyle = '#f0f0f0';
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
      
      // X-axis labels
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      const date = new Date(data[index].date);
      const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
      ctx.fillText(dateLabel, x, height - padding.bottom + 15);
    }

    // Draw initial capital line
    const initialY = yPos(initialCapital);
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, initialY);
    ctx.lineTo(padding.left + chartWidth, initialY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw balance line
    if (data.length > 1) {
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      // Start from initial capital
      ctx.moveTo(padding.left, yPos(initialCapital));
      
      data.forEach((point, index) => {
        const x = xPos(index);
        const y = yPos(point.balance);
        ctx.lineTo(x, y);
      });
      
      ctx.stroke();
    }

    // Draw data points
    data.forEach((point, index) => {
      const x = xPos(index);
      const y = yPos(point.balance);
      
      // Point circle
      ctx.fillStyle = point.balance >= initialCapital ? '#52c41a' : '#f5222d';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Point border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw profit/loss areas
    if (data.length > 1) {
      const initialY = yPos(initialCapital);
      
      // Create gradient for profit area
      const profitGradient = ctx.createLinearGradient(0, padding.top, 0, initialY);
      profitGradient.addColorStop(0, 'rgba(82, 196, 26, 0.1)');
      profitGradient.addColorStop(1, 'rgba(82, 196, 26, 0.05)');
      
      // Create gradient for loss area  
      const lossGradient = ctx.createLinearGradient(0, initialY, 0, padding.top + chartHeight);
      lossGradient.addColorStop(0, 'rgba(245, 34, 45, 0.1)');
      lossGradient.addColorStop(1, 'rgba(245, 34, 45, 0.05)');
      
      // Fill profit area
      ctx.fillStyle = profitGradient;
      ctx.beginPath();
      ctx.moveTo(padding.left, initialY);
      
      data.forEach((point, index) => {
        const x = xPos(index);
        const y = Math.min(yPos(point.balance), initialY);
        ctx.lineTo(x, y);
      });
      
      ctx.lineTo(padding.left + chartWidth, initialY);
      ctx.closePath();
      ctx.fill();
      
      // Fill loss area
      ctx.fillStyle = lossGradient;
      ctx.beginPath();
      ctx.moveTo(padding.left, initialY);
      
      data.forEach((point, index) => {
        const x = xPos(index);
        const y = Math.max(yPos(point.balance), initialY);
        ctx.lineTo(x, y);
      });
      
      ctx.lineTo(padding.left + chartWidth, initialY);
      ctx.closePath();
      ctx.fill();
    }

    // Draw current balance label
    if (data.length > 0) {
      const lastPoint = data[data.length - 1];
      const lastX = xPos(data.length - 1);
      const lastY = yPos(lastPoint.balance);
      
      // Current price label background
      ctx.fillStyle = lastPoint.balance >= initialCapital ? '#52c41a' : '#f5222d';
      ctx.fillRect(lastX + 10, lastY - 12, 100, 24);
      
      // Current price text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`¥${Math.round(lastPoint.balance).toLocaleString()}`, lastX + 15, lastY + 4);
    }

    // Draw legend
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // Initial capital legend
    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(padding.left, 5, 15, 2);
    ctx.fillStyle = '#666';
    ctx.fillText('初期資金', padding.left + 20, 14);
    
    // Balance line legend
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(padding.left + 120, 6);
    ctx.lineTo(padding.left + 135, 6);
    ctx.stroke();
    ctx.fillStyle = '#666';
    ctx.fillText('資金残高', padding.left + 140, 14);

  }, [data, initialCapital, width, height]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}
      />
      {data.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#999',
          fontSize: '14px'
        }}>
          取引データがありません
        </div>
      )}
    </div>
  );
};

export default FundGrowthChart;
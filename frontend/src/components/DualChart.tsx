import React, { useEffect, useRef, useState } from 'react';
import { Card, Space, Typography, Tag } from 'antd';
import SessionHelpModal from './SessionHelpModal';

const { Text } = Typography;

interface CandlestickData {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface DualChartProps {
  mainData: CandlestickData[];      // 15分足7本
  detailData: CandlestickData[];    // 5分足7本
  currentPrice?: number;
  torbRange?: {
    high: number;
    low: number;
    width: number;
    quality?: string;
  };
  signals?: any[];
}

const DualChart: React.FC<DualChartProps> = ({ 
  mainData, 
  detailData, 
  currentPrice,
  torbRange,
  signals = []
}) => {
  const mainChartRef = useRef<HTMLDivElement>(null);
  const detailChartRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sessionHelpVisible, setSessionHelpVisible] = useState(false);

  // レスポンシブ対応
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    // ResizeObserverでコンテナサイズ変更を監視
    let mainObserver: ResizeObserver | null = null;
    let detailObserver: ResizeObserver | null = null;
    
    if (mainChartRef.current && window.ResizeObserver) {
      mainObserver = new ResizeObserver(() => {
        setTimeout(() => {
          if (mainData.length > 0) {
            drawMainChart();
          }
        }, 100); // 少し遅延させて描画（データがある場合のみ）
      });
      mainObserver.observe(mainChartRef.current);
    }
    
    if (detailChartRef.current && window.ResizeObserver) {
      detailObserver = new ResizeObserver(() => {
        setTimeout(() => {
          if (detailData.length > 0) {
            drawDetailChart();
          }
        }, 100);
      });
      detailObserver.observe(detailChartRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      mainObserver?.disconnect();
      detailObserver?.disconnect();
    };
  }, []);

  // 15分足メインチャート描画
  const drawMainChart = () => {
    console.log('🎨 [DualChart] drawMainChart called', {
      hasRef: !!mainChartRef.current,
      dataLength: mainData.length,
      timestamp: new Date().toISOString()
    });
    
    if (!mainChartRef.current || mainData.length === 0) {
      console.warn('❌ [DualChart] Cannot draw chart', {
        hasRef: !!mainChartRef.current,
        dataLength: mainData.length
      });
      return;
    }
    
    // 既存のcanvasを再利用または新規作成
    let canvas = mainChartRef.current.querySelector('canvas') as HTMLCanvasElement;
    const canvasExists = !!canvas;
    
    if (!canvas) {
      console.log('📦 [DualChart] Creating new main canvas');
      canvas = document.createElement('canvas');
      canvas.style.background = '#1e1e1e';
      canvas.style.borderRadius = '8px';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      mainChartRef.current.appendChild(canvas);
    } else {
      console.log('♻️ [DualChart] Reusing existing main canvas');
    }
    
    // 親要素の実際の内部サイズを取得
    const containerRect = mainChartRef.current.getBoundingClientRect();
    const containerWidth = Math.max(containerRect.width, 300); // 最小幅を保証
    const containerHeight = isMobile ? 300 : 460;
    
    console.log('📐 [DualChart] Canvas dimensions', {
      canvasExists,
      containerWidth,
      containerHeight,
      isMobile,
      rectWidth: containerRect.width,
      rectHeight: containerRect.height
    });
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ [DualChart] Failed to get 2D context');
      return;
    }

    // 価格範囲計算
    const allPrices = mainData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    console.log('💹 [DualChart] Price data analysis', {
      dataCount: mainData.length,
      minPrice,
      maxPrice,
      priceRange: maxPrice - minPrice,
      sampleData: mainData.slice(0, 2)
    });
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    // チャート領域（レスポンシブ対応）
    const chartLeft = isMobile ? 40 : 60;
    const chartRight = containerWidth - (isMobile ? 50 : 80);
    const chartTop = isMobile ? 30 : 40;
    const chartBottom = containerHeight - (isMobile ? 40 : 60);
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    // 価格座標変換
    const priceToY = (price: number) => {
      return chartBottom - ((price - (minPrice - padding)) / (priceRange + 2 * padding)) * chartHeight;
    };

    // 時間座標変換
    const candleWidth = chartWidth / Math.max(mainData.length, 1);

    // 背景グリッド
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // 水平線
    for (let i = 0; i <= 5; i++) {
      const y = chartTop + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }

    // 垂直線
    for (let i = 0; i <= 4; i++) {
      const x = chartLeft + (chartWidth / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, chartTop);
      ctx.lineTo(x, chartBottom);
      ctx.stroke();
    }

    // TORBレンジライン描画（品質別色分け）
    if (torbRange) {
      // 品質に応じた色設定
      const getQualityColor = (quality?: string, width?: number) => {
        if (quality === 'excellent' || (width && width >= 70 && width <= 100)) return '#52c41a'; // 緑: 優秀
        if (quality === 'good' || (width && width >= 50 && width <= 120)) return '#ffa940';      // オレンジ: 良好
        if (quality === 'fair' || (width && width >= 30 && width <= 150)) return '#faad14';     // 黄色: 普通
        if (quality === 'local') return '#722ed1';                                              // 紫: ローカル計算
        return '#f5222d';                                                                       // 赤: 品質不良
      };

      const rangeColor = getQualityColor(torbRange.quality, torbRange.width);
      
      ctx.strokeStyle = rangeColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      
      // レンジボックス背景（薄い色）
      const highY = priceToY(torbRange.high);
      const lowY = priceToY(torbRange.low);
      
      ctx.fillStyle = `${rangeColor}15`; // 透明度を追加
      ctx.fillRect(chartLeft, highY, chartRight - chartLeft, lowY - highY);
      
      // High line
      ctx.beginPath();
      ctx.moveTo(chartLeft, highY);
      ctx.lineTo(chartRight, highY);
      ctx.stroke();
      
      // Low line
      ctx.beginPath();
      ctx.moveTo(chartLeft, lowY);
      ctx.lineTo(chartRight, lowY);
      ctx.stroke();
      
      // レンジラベル（右端に表示）
      ctx.setLineDash([]);
      ctx.fillStyle = rangeColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      
      // High ラベル
      ctx.fillText(`H: ${torbRange.high.toFixed(3)}`, chartRight + 5, highY + 4);
      
      // Low ラベル  
      ctx.fillText(`L: ${torbRange.low.toFixed(3)}`, chartRight + 5, lowY + 4);
      
      // 中央に品質マーク
      const centerY = (highY + lowY) / 2;
      const qualityText = torbRange.quality === 'excellent' ? '★' : 
                         torbRange.quality === 'good' ? '◆' : 
                         torbRange.quality === 'local' ? '◈' : '○';
      ctx.fillText(qualityText, chartRight + 5, centerY + 4);
      
      ctx.setLineDash([]);
    }

    // ローソク足描画（レスポンシブ対応）
    console.log('🕯️ [DualChart] Starting candlestick drawing', {
      candleCount: mainData.length,
      candleWidth,
      chartArea: { chartLeft, chartRight, chartTop, chartBottom, chartWidth, chartHeight }
    });
    
    mainData.forEach((candle, index) => {
      const x = chartLeft + (index + 0.5) * candleWidth;
      const bodyWidth = candleWidth * (isMobile ? 0.8 : 0.7);
      
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      
      const isGreen = candle.close > candle.open;
      const isCurrentCandle = index === mainData.length - 1;
      
      // ヒゲ
      ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, Math.min(openY, closeY));
      ctx.moveTo(x, Math.max(openY, closeY));
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // ボディ
      if (isGreen) {
        ctx.fillStyle = isCurrentCandle ? '#4caf50' : '#26a69a'; // 現在のローソク足は明るく
      } else {
        ctx.fillStyle = isCurrentCandle ? '#f44336' : '#ef5350'; // 現在のローソク足は明るく
      }
      
      if (isGreen) {
        ctx.fillRect(x - bodyWidth/2, closeY, bodyWidth, openY - closeY);
      } else {
        ctx.fillRect(x - bodyWidth/2, openY, bodyWidth, closeY - openY);
      }
      
      // 現在のローソク足に枠線追加
      if (isCurrentCandle) {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - bodyWidth/2, Math.min(openY, closeY), bodyWidth, Math.abs(openY - closeY));
      }
    });

    // 15分足では現在価格ラインは表示しない

    // 価格ラベル（レスポンシブフォント）
    ctx.fillStyle = '#ffffff';
    ctx.font = `${isMobile ? 10 : 12}px Arial`;
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = (minPrice - padding) + (priceRange + 2 * padding) * (1 - i / 5);
      const y = chartTop + (chartHeight / 5) * i;
      ctx.fillText(price.toFixed(3), chartLeft - 10, y + 4);
    }

    // 時間軸ラベル（全20本を4本間隔で表示、レスポンシブフォント）
    ctx.fillStyle = '#ffffff';
    ctx.font = `${isMobile ? 8 : 10}px Arial`;
    ctx.textAlign = 'center';
    
    // 全7本のローソク足に時間ラベルを表示
    mainData.forEach((candle, idx) => {
      const x = chartLeft + (idx + 0.5) * candleWidth;
      const time = new Date(typeof candle.time === 'string' ? candle.time : candle.time * 1000);
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      
      if (idx < 3) {
        console.log(`🕐 [15分足表示${idx}] candle.time:${candle.time} → Date:${time.toLocaleString('ja-JP')} → 表示:${timeStr}`);
      }
      
      ctx.fillText(timeStr, x, chartBottom + 15);
    });

    // タイトル（レスポンシブ）
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${isMobile ? 14 : 16}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('15分足 (7本)', chartLeft, isMobile ? 20 : 25);
  };

  // 5分足詳細チャート描画
  const drawDetailChart = () => {
    console.log('📊 [DualChart] drawDetailChart called', {
      hasRef: !!detailChartRef.current,
      detailDataLength: detailData.length,
      expectedLength: 20,
      actualData: detailData.length > 0 ? `First: ${new Date(detailData[0].time).toLocaleTimeString()}, Last: ${new Date(detailData[detailData.length-1].time).toLocaleTimeString()}` : 'No data',
      timestamp: new Date().toISOString()
    });
    
    if (!detailChartRef.current || detailData.length === 0) {
      console.warn('❌ [DualChart] Cannot draw detail chart', {
        hasRef: !!detailChartRef.current,
        detailDataLength: detailData.length
      });
      return;
    }
    
    // 既存のcanvasを再利用または新規作成
    let canvas = detailChartRef.current.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.background = '#1e1e1e';
      canvas.style.borderRadius = '8px';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      detailChartRef.current.appendChild(canvas);
    }
    
    // 親要素の実際の内部サイズを取得
    const containerRect = detailChartRef.current.getBoundingClientRect();
    const containerWidth = Math.max(containerRect.width, 200); // 最小幅を保証
    const containerHeight = isMobile ? 300 : 460;
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 価格範囲計算
    const allPrices = detailData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    // チャート領域（レスポンシブ対応）
    const chartLeft = isMobile ? 30 : 40;
    const chartRight = containerWidth - (isMobile ? 40 : 60);
    const chartTop = isMobile ? 30 : 40;
    const chartBottom = containerHeight - (isMobile ? 40 : 60);
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    // 価格座標変換
    const priceToY = (price: number) => {
      return chartBottom - ((price - (minPrice - padding)) / (priceRange + 2 * padding)) * chartHeight;
    };

    // 時間座標変換
    const candleWidth = chartWidth / Math.max(detailData.length, 1);

    // 背景グリッド
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // 水平線
    for (let i = 0; i <= 5; i++) {
      const y = chartTop + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }

    // ローソク足描画（レスポンシブ対応）
    detailData.forEach((candle, index) => {
      const x = chartLeft + (index + 0.5) * candleWidth;
      const bodyWidth = candleWidth * (isMobile ? 0.9 : 0.8);
      
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      
      const isGreen = candle.close > candle.open;
      const isCurrentCandle = index === detailData.length - 1;
      
      // ヒゲ
      ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, Math.min(openY, closeY));
      ctx.moveTo(x, Math.max(openY, closeY));
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // ボディ
      if (isGreen) {
        ctx.fillStyle = isCurrentCandle ? '#4caf50' : '#26a69a'; // 現在のローソク足は明るく
      } else {
        ctx.fillStyle = isCurrentCandle ? '#f44336' : '#ef5350'; // 現在のローソク足は明るく
      }
      
      if (isGreen) {
        ctx.fillRect(x - bodyWidth/2, closeY, bodyWidth, openY - closeY);
      } else {
        ctx.fillRect(x - bodyWidth/2, openY, bodyWidth, closeY - openY);
      }
      
      // 現在のローソク足に枠線追加（5分足）
      if (isCurrentCandle) {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - bodyWidth/2, Math.min(openY, closeY), bodyWidth, Math.abs(openY - closeY));
      }
    });

    // 現在価格ライン表示（5分足のみ）
    if (currentPrice) {
      const currentPriceY = priceToY(currentPrice);
      ctx.strokeStyle = '#ffeb3b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(chartLeft, currentPriceY);
      ctx.lineTo(chartRight, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // 現在価格ラベル（5分足、レスポンシブ）
      ctx.fillStyle = '#ffeb3b';
      ctx.font = `bold ${isMobile ? 9 : 11}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(currentPrice.toFixed(3), chartRight + 3, currentPriceY + 4);
    }

    // 価格ラベル（レスポンシブフォント）
    ctx.fillStyle = '#ffffff';
    ctx.font = `${isMobile ? 8 : 10}px Arial`;
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = (minPrice - padding) + (priceRange + 2 * padding) * (1 - i / 5);
      const y = chartTop + (chartHeight / 5) * i;
      ctx.fillText(price.toFixed(3), chartLeft - 5, y + 3);
    }

    // 時間軸ラベル（全7本をすべて表示、レスポンシブフォント）
    ctx.fillStyle = '#ffffff';
    ctx.font = `${isMobile ? 6 : 8}px Arial`;
    ctx.textAlign = 'center';
    
    // 全7本のローソク足に時間ラベルを表示
    detailData.forEach((candle, idx) => {
      const x = chartLeft + (idx + 0.5) * candleWidth;
      const time = new Date(typeof candle.time === 'string' ? candle.time : candle.time * 1000);
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      
      if (idx % 3 === 0) {
        console.log(`🕐 [5分足表示${idx}] candle.time:${candle.time} → Date:${time.toLocaleString('ja-JP')} → 表示:${timeStr}`);
      }
      
      ctx.fillText(timeStr, x, chartBottom + 15);
    });

    // タイトル（レスポンシブ）
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${isMobile ? 12 : 14}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('5分足 (7本)', chartLeft, isMobile ? 20 : 25);
  };

  useEffect(() => {
    console.log('🔄 [DualChart] useEffect triggered', {
      mainDataLength: mainData.length,
      torbRange: !!torbRange,
      isMobile,
      reason: 'mainData, torbRange, or isMobile changed'
    });
    
    const timer = setTimeout(() => {
      if (mainData.length > 0) {
        drawMainChart();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [mainData, torbRange, isMobile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (detailData.length > 0) {
        drawDetailChart();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [detailData, isMobile]);

  const getCurrentSession = () => {
    // 正しいJST時間の計算 (UTC+9)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jst = new Date(utc + (9 * 60 * 60 * 1000));
    const hour = jst.getHours();
    
    // 6つのFX主要セッション（JST基準）
    if (hour >= 6 && hour < 9) return { name: 'シドニー', color: '#13c2c2' };
    if (hour >= 9 && hour < 15) return { name: '東京', color: '#52c41a' };
    if (hour >= 15 && hour < 16) return { name: '東京後場', color: '#73d13d' };
    if (hour >= 16 && hour < 22) return { name: 'ロンドン', color: '#1890ff' };
    if (hour >= 22 || hour < 2) return { name: 'NY序盤', color: '#fa8c16' };
    if (hour >= 2 && hour < 6) return { name: 'NY後半', color: '#ff7875' };
    return { name: 'オフ', color: '#8c8c8c' };
  };

  const session = getCurrentSession();

  return (
    <div style={{ width: '100%', height: 'auto', overflow: 'hidden' }}>
      <div style={{ marginBottom: 8, padding: '8px 0' }}>
        <Space size="small">
          <Tag 
            color={session.color} 
            onClick={() => setSessionHelpVisible(true)}
            style={{ 
              fontSize: '11px', 
              padding: '2px 6px',
              cursor: 'pointer'
            }}
            title="クリックしてセッション詳細を表示"
          >
            {session.name}セッション <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '14px',
              height: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              marginLeft: '4px'
            }}>?</span>
          </Tag>
          {currentPrice && (
            <Text style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold' }}>
              現在価格: {currentPrice.toFixed(3)}
            </Text>
          )}
          {torbRange && (
            <Space size={4}>
              <Text style={{ 
                color: torbRange.quality === 'excellent' ? '#52c41a' : 
                       torbRange.quality === 'good' ? '#ffa940' : 
                       torbRange.quality === 'local' ? '#722ed1' : '#f5222d', 
                fontSize: '12px', 
                fontWeight: 'bold' 
              }}>
                TORBレンジ: {torbRange.width.toFixed(1)} pips
              </Text>
              {torbRange.quality && (
                <Tag 
                  color={
                    torbRange.quality === 'excellent' ? 'green' : 
                    torbRange.quality === 'good' ? 'orange' : 
                    torbRange.quality === 'local' ? 'purple' : 'red'
                  }
                  style={{ fontSize: '10px', padding: '0 4px' }}
                >
                  {torbRange.quality === 'excellent' ? '優秀' : 
                   torbRange.quality === 'good' ? '良好' : 
                   torbRange.quality === 'fair' ? '普通' :
                   torbRange.quality === 'local' ? 'ローカル' : '要注意'}
                </Tag>
              )}
            </Space>
          )}
        </Space>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        minHeight: 300,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {/* 15分足メインチャート */}
        <Card 
          style={{ 
            flex: isMobile ? '1' : '0 0 70%', 
            backgroundColor: '#262626',
            border: '1px solid #434343',
            minHeight: 300
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div 
            ref={mainChartRef} 
            style={{ 
              width: '100%', 
              height: isMobile ? 300 : 460,
              minHeight: 300,
              overflow: 'hidden',
              position: 'relative'
            }}
          />
        </Card>
        
        {/* 5分足詳細チャート */}
        <Card 
          style={{ 
            flex: isMobile ? '1' : '0 0 30%', 
            backgroundColor: '#262626',
            border: '1px solid #434343',
            minHeight: 300
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div 
            ref={detailChartRef} 
            style={{ 
              width: '100%', 
              height: isMobile ? 300 : 460,
              minHeight: 300,
              overflow: 'hidden',
              position: 'relative'
            }}
          />
        </Card>
      </div>
      
      <SessionHelpModal
        visible={sessionHelpVisible}
        onCancel={() => setSessionHelpVisible(false)}
      />
    </div>
  );
};

export default DualChart;
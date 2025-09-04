import type { CandlestickData } from 'lightweight-charts';
import { PatternMatch, PatternAnalysis, CurrencyPair } from '../types';
import { CURRENCY_PAIRS } from '../constants/currencyPairs';

// パターン分析エンジン
export class PatternAnalysisEngine {
  private historicalPatterns: Map<string, PatternMatch[]> = new Map();

  constructor() {
    this.initializeHistoricalPatterns();
  }

  // 履歴パターンの初期化（Phase 2で実際のデータベースと連携）
  private initializeHistoricalPatterns() {
    // モック履歴パターンデータ
    const mockPatterns: PatternMatch[] = [
      {
        date: '2024-08-15',
        similarity: 0.92,
        patternType: 'FLAG',
        prediction: {
          direction: 'UP',
          probability: 0.75,
          targetPips: 25,
          timeframe: 120
        },
        confidence: 4
      },
      {
        date: '2024-07-22',
        similarity: 0.89,
        patternType: 'PENNANT',
        prediction: {
          direction: 'UP',
          probability: 0.68,
          targetPips: 18,
          timeframe: 90
        },
        confidence: 3
      },
      {
        date: '2024-06-10',
        similarity: 0.87,
        patternType: 'TRIANGLE',
        prediction: {
          direction: 'DOWN',
          probability: 0.72,
          targetPips: -22,
          timeframe: 105
        },
        confidence: 4
      }
    ];

    this.historicalPatterns.set('USDJPY', mockPatterns);
    this.historicalPatterns.set('EURUSD', mockPatterns.map(p => ({ ...p, similarity: p.similarity * 0.85 })));
    this.historicalPatterns.set('GBPUSD', mockPatterns.map(p => ({ ...p, similarity: p.similarity * 0.78 })));
    this.historicalPatterns.set('AUDUSD', mockPatterns.map(p => ({ ...p, similarity: p.similarity * 0.81 })));
  }

  // フラッグパターンの検出
  detectFlagPattern(data: CandlestickData[]): PatternMatch | null {
    if (data.length < 20) return null;

    const recent = data.slice(-20);
    const prices = recent.map(c => c.close);
    
    // フラッグの特徴：
    // 1. 強い上昇/下降トレンド
    // 2. その後の逆方向への小さな調整
    // 3. 平行なサポート・レジスタンスライン

    const strongMove = this.detectStrongMove(prices.slice(0, 10));
    if (!strongMove) return null;

    const consolidation = this.detectConsolidation(prices.slice(10));
    if (!consolidation) return null;

    const similarity = this.calculatePatternSimilarity('FLAG', recent);
    
    if (similarity < 0.6) return null;

    return {
      date: new Date().toISOString(),
      similarity,
      patternType: 'FLAG',
      prediction: {
        direction: strongMove.direction,
        probability: Math.min(0.8, similarity * 1.1),
        targetPips: Math.floor(strongMove.magnitude * 0.8),
        timeframe: 60 + Math.floor(Math.random() * 60)
      },
      confidence: Math.min(5, Math.floor(similarity * 5) + 1)
    };
  }

  // ペナントパターンの検出
  detectPennantPattern(data: CandlestickData[]): PatternMatch | null {
    if (data.length < 15) return null;

    const recent = data.slice(-15);
    const highs = recent.map(c => c.high);
    const lows = recent.map(c => c.low);

    // ペナントの特徴：
    // 1. 強い価格変動
    // 2. 三角形の収束パターン
    // 3. 出来高の減少（モックでは省略）

    const convergence = this.detectConvergence(highs, lows);
    if (!convergence) return null;

    const strongMove = this.detectStrongMove(recent.slice(0, 8).map(c => c.close));
    if (!strongMove) return null;

    const similarity = this.calculatePatternSimilarity('PENNANT', recent);
    
    if (similarity < 0.65) return null;

    return {
      date: new Date().toISOString(),
      similarity,
      patternType: 'PENNANT',
      prediction: {
        direction: strongMove.direction,
        probability: Math.min(0.75, similarity * 1.05),
        targetPips: Math.floor(strongMove.magnitude * 0.7),
        timeframe: 45 + Math.floor(Math.random() * 45)
      },
      confidence: Math.min(5, Math.floor(similarity * 4) + 2)
    };
  }

  // 三角保合パターンの検出
  detectTrianglePattern(data: CandlestickData[]): PatternMatch | null {
    if (data.length < 25) return null;

    const recent = data.slice(-25);
    const highs = recent.map(c => c.high);
    const lows = recent.map(c => c.low);

    // 三角保合の特徴：
    // 1. 上値抵抗線の下降
    // 2. 下値支持線の上昇
    // 3. 収束点への接近

    const upperTrend = this.calculateTrendLine(highs, false); // 下降トレンドライン
    const lowerTrend = this.calculateTrendLine(lows, true);   // 上昇トレンドライン

    if (!upperTrend || !lowerTrend) return null;

    const convergence = this.calculateConvergencePoint(upperTrend, lowerTrend);
    if (!convergence || convergence.distance > 10) return null;

    const similarity = this.calculatePatternSimilarity('TRIANGLE', recent);
    
    if (similarity < 0.7) return null;

    // 三角保合は方向を予測しにくいので、ボラティリティとモメンタムから判断
    const direction = this.predictTriangleBreakout(recent);

    return {
      date: new Date().toISOString(),
      similarity,
      patternType: 'TRIANGLE',
      prediction: {
        direction,
        probability: Math.min(0.65, similarity * 0.9),
        targetPips: Math.floor((Math.max(...highs) - Math.min(...lows)) * 0.6),
        timeframe: 90 + Math.floor(Math.random() * 60)
      },
      confidence: Math.min(5, Math.floor(similarity * 3) + 2)
    };
  }

  // レンジブレイクアウトパターンの検出（既存のTORBを拡張）
  detectRangeBreakoutPattern(data: CandlestickData[], currentPrice: number): PatternMatch | null {
    if (data.length < 10) return null;

    const recent = data.slice(-10);
    const prices = recent.map(c => c.close);
    const high = Math.max(...recent.map(c => c.high));
    const low = Math.min(...recent.map(c => c.low));
    
    const rangeWidth = high - low;
    const avgPrice = (high + low) / 2;
    
    // レンジの条件
    if (rangeWidth < 0.001 || rangeWidth > 0.01) return null;

    // ブレイクアウトの検出
    const breakoutThreshold = rangeWidth * 0.1;
    let direction: 'UP' | 'DOWN' | null = null;
    
    if (currentPrice > high + breakoutThreshold) {
      direction = 'UP';
    } else if (currentPrice < low - breakoutThreshold) {
      direction = 'DOWN';
    } else {
      return null;
    }

    const similarity = 0.85 + Math.random() * 0.1; // レンジブレイクアウトは比較的確実

    return {
      date: new Date().toISOString(),
      similarity,
      patternType: 'RANGE_BREAKOUT',
      prediction: {
        direction,
        probability: 0.8,
        targetPips: Math.floor(rangeWidth * 1.5 * 10000), // pips計算
        timeframe: 30 + Math.floor(Math.random() * 30)
      },
      confidence: 4
    };
  }

  // 現在のデータに基づいてパターンを分析
  analyzeCurrentPattern(
    data: CandlestickData[], 
    currentPrice: number,
    pair: CurrencyPair
  ): PatternAnalysis {
    const patterns: PatternMatch[] = [];

    // 各パターンを検出
    const flag = this.detectFlagPattern(data);
    const pennant = this.detectPennantPattern(data);
    const triangle = this.detectTrianglePattern(data);
    const rangeBreakout = this.detectRangeBreakoutPattern(data, currentPrice);

    [flag, pennant, triangle, rangeBreakout].forEach(pattern => {
      if (pattern) patterns.push(pattern);
    });

    // 類似の履歴パターンを取得
    const historicalPatterns = this.historicalPatterns.get(pair) || [];
    const similarPatterns = historicalPatterns
      .filter(p => patterns.some(cp => cp.patternType === p.patternType))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    // 最も信頼性の高い現在パターンを選択
    const currentPattern = patterns.length > 0 ? 
      patterns.sort((a, b) => (b.similarity * b.confidence) - (a.similarity * a.confidence))[0] : 
      null;

    // 予想を計算
    const prediction = this.calculatePrediction(patterns, similarPatterns, currentPrice);

    return {
      currentPattern,
      similarPatterns,
      prediction
    };
  }

  // ヘルパーメソッド群
  private detectStrongMove(prices: number[]): { direction: 'UP' | 'DOWN', magnitude: number } | null {
    if (prices.length < 5) return null;

    const start = prices[0];
    const end = prices[prices.length - 1];
    const change = end - start;
    const magnitude = Math.abs(change);

    // 強い動きの閾値
    if (magnitude < 0.005) return null;

    return {
      direction: change > 0 ? 'UP' : 'DOWN',
      magnitude: magnitude * 10000 // pipsに変換
    };
  }

  private detectConsolidation(prices: number[]): boolean {
    if (prices.length < 5) return false;

    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;
    const avgPrice = prices.reduce((a, b) => a + b) / prices.length;

    // 収束の条件：レンジが平均価格の0.3%以下
    return range / avgPrice <= 0.003;
  }

  private detectConvergence(highs: number[], lows: number[]): boolean {
    if (highs.length < 8) return false;

    const recentHighs = highs.slice(-8);
    const recentLows = lows.slice(-8);

    const highRange = Math.max(...recentHighs) - Math.min(...recentHighs);
    const lowRange = Math.max(...recentLows) - Math.min(...recentLows);

    // 収束の条件：高値と安値の範囲が狭まっている
    return (highRange + lowRange) < (highs[0] - lows[0]) * 0.5;
  }

  private calculateTrendLine(prices: number[], ascending: boolean): { slope: number, intercept: number } | null {
    // 簡易的な線形回帰
    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * prices[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // トレンドラインの方向性をチェック
    if (ascending && slope <= 0) return null;
    if (!ascending && slope >= 0) return null;

    return { slope, intercept };
  }

  private calculateConvergencePoint(upper: any, lower: any): { distance: number } | null {
    // 2つのトレンドラインの交点までの距離を計算
    if (Math.abs(upper.slope - lower.slope) < 0.00001) return null;

    const intersectX = (lower.intercept - upper.intercept) / (upper.slope - lower.slope);
    const distance = Math.abs(intersectX);

    return { distance };
  }

  private predictTriangleBreakout(data: CandlestickData[]): 'UP' | 'DOWN' {
    // 簡易的な方向予測：最近の価格動向とボラティリティから判断
    const closes = data.map(c => c.close);
    const recentTrend = closes[closes.length - 1] - closes[closes.length - 5];
    
    // RSI的な指標を計算
    const gains = closes.slice(1).map((price, i) => Math.max(0, price - closes[i]));
    const losses = closes.slice(1).map((price, i) => Math.max(0, closes[i] - price));
    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
    const momentum = avgGain / (avgGain + avgLoss);

    // トレンド + モメンタムで方向を決定
    const score = recentTrend * 1000 + (momentum - 0.5) * 2;
    return score > 0 ? 'UP' : 'DOWN';
  }

  private calculatePatternSimilarity(patternType: string, data: CandlestickData[]): number {
    // パターン類似度の計算（モック実装）
    // 実際の実装では、形状分析や統計的類似度を使用

    const prices = data.map(c => c.close);
    const volatility = this.calculateVolatility(prices);
    const trend = this.calculateTrend(prices);

    let baseScore = 0.5;

    switch (patternType) {
      case 'FLAG':
        baseScore += Math.min(0.3, volatility * 2);
        baseScore += Math.min(0.2, Math.abs(trend));
        break;
      case 'PENNANT':
        baseScore += Math.min(0.25, volatility * 1.5);
        baseScore += Math.min(0.25, Math.abs(trend) * 0.8);
        break;
      case 'TRIANGLE':
        baseScore += Math.min(0.35, (1 - volatility) * 2);
        baseScore += Math.min(0.15, 1 - Math.abs(trend));
        break;
    }

    return Math.min(0.95, baseScore + Math.random() * 0.1);
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((acc, change) => acc + Math.pow(change - avgChange, 2), 0) / changes.length;
    
    return Math.sqrt(variance);
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const start = prices[0];
    const end = prices[prices.length - 1];
    
    return (end - start) / start;
  }

  private calculatePrediction(
    currentPatterns: PatternMatch[],
    similarPatterns: PatternMatch[],
    currentPrice: number
  ): PatternAnalysis['prediction'] {
    if (currentPatterns.length === 0) {
      return {
        bullishProbability: 0.5,
        bearishProbability: 0.5,
        expectedRange: {
          high: currentPrice * 1.002,
          low: currentPrice * 0.998
        }
      };
    }

    // 現在パターンと履歴パターンを重み付けして予想を計算
    const allPatterns = [...currentPatterns, ...similarPatterns];
    
    const bullishWeight = allPatterns
      .filter(p => p.prediction.direction === 'UP')
      .reduce((acc, p) => acc + p.prediction.probability * p.confidence, 0);
      
    const bearishWeight = allPatterns
      .filter(p => p.prediction.direction === 'DOWN')
      .reduce((acc, p) => acc + p.prediction.probability * p.confidence, 0);

    const totalWeight = bullishWeight + bearishWeight;
    
    const bullishProbability = totalWeight > 0 ? bullishWeight / totalWeight : 0.5;
    const bearishProbability = 1 - bullishProbability;

    // 期待レンジの計算
    const avgTargetPips = allPatterns.reduce((acc, p) => acc + Math.abs(p.prediction.targetPips), 0) / allPatterns.length;
    const pipValue = CURRENCY_PAIRS.USDJPY.pipValue; // デフォルト値、実際は通貨ペア別

    return {
      bullishProbability,
      bearishProbability,
      expectedRange: {
        high: currentPrice + (avgTargetPips * pipValue),
        low: currentPrice - (avgTargetPips * pipValue)
      }
    };
  }
}

// シングルトンインスタンス
export const patternAnalysisEngine = new PatternAnalysisEngine();
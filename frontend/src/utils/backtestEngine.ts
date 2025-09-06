import type { CandlestickData } from 'lightweight-charts';
import { type TORBSignal, type TORBSettings, type CurrencyPair } from '../types';
import { CURRENCY_PAIRS } from '../constants/currencyPairs';
import { TORBLogic } from './torbLogic';

// バックテスト結果の型定義
export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPips: number;
  avgWinPips: number;
  avgLossPips: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxDrawdown: number;
  profitFactor: number;
  trades: BacktestTrade[];
  dailyPnL: DailyPnL[];
  monthlyStats: MonthlyStats[];
}

export interface BacktestTrade {
  date: string;
  pair: CurrencyPair;
  signal: TORBSignal;
  entryPrice: number;
  exitPrice: number;
  exitReason: 'TARGET' | 'STOP_LOSS' | 'TIME_EXIT';
  pips: number;
  duration: number; // minutes
  isWin: boolean;
}

export interface DailyPnL {
  date: string;
  trades: number;
  totalPips: number;
  winRate: number;
  cumulativePips: number;
}

export interface MonthlyStats {
  month: string;
  trades: number;
  winRate: number;
  totalPips: number;
  bestDay: number;
  worstDay: number;
}

export interface BacktestParameters {
  startDate: Date;
  endDate: Date;
  pairs: CurrencyPair[];
  settings: TORBSettings;
  initialBalance: number;
  riskPerTrade: number; // パーセンテージ
}

export class BacktestEngine {
  private torbLogic: TORBLogic;
  
  constructor() {
    this.torbLogic = new TORBLogic();
  }

  // メインのバックテスト実行
  async runBacktest(
    historicalData: Map<CurrencyPair, CandlestickData[]>,
    parameters: BacktestParameters
  ): Promise<BacktestResult> {
    const trades: BacktestTrade[] = [];
    let currentBalance = parameters.initialBalance;
    
    console.log('バックテスト開始:', {
      期間: `${parameters.startDate.toLocaleDateString()} - ${parameters.endDate.toLocaleDateString()}`,
      通貨ペア: parameters.pairs,
      初期資金: parameters.initialBalance
    });

    // 各通貨ペアでバックテスト実行
    for (const pair of parameters.pairs) {
      const data = historicalData.get(pair);
      if (!data || data.length === 0) continue;

      // 設定を通貨ペア別にカスタマイズ
      const pairSettings = this.adaptSettingsForPair(parameters.settings, pair);
      this.torbLogic.updateSettings(pairSettings);

      const pairTrades = await this.backtestPair(pair, data, parameters);
      trades.push(...pairTrades);
    }

    // 結果を時系列でソート
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 統計を計算
    const result = this.calculateStatistics(trades, parameters);
    
    console.log('バックテスト完了:', {
      総取引数: result.totalTrades,
      勝率: `${(result.winRate * 100).toFixed(1)}%`,
      総獲得pips: result.totalPips.toFixed(1)
    });

    return result;
  }

  // 単一通貨ペアのバックテスト
  private async backtestPair(
    pair: CurrencyPair,
    data: CandlestickData[],
    parameters: BacktestParameters
  ): Promise<BacktestTrade[]> {
    const trades: BacktestTrade[] = [];
    const pairInfo = CURRENCY_PAIRS[pair];
    let activeSignal: TORBSignal | null = null;
    let signalStartIndex = 0;

    // 日付フィルタリング
    const filteredData = data.filter(candle => {
      const candleTime = new Date(
        typeof candle.time === 'number' 
          ? candle.time * 1000 
          : typeof candle.time === 'string'
          ? candle.time
          : new Date((candle.time as any).year, (candle.time as any).month - 1, (candle.time as any).day).getTime()
      );
      return candleTime >= parameters.startDate && candleTime <= parameters.endDate;
    });

    for (let i = 20; i < filteredData.length; i++) { // 最低20本のデータが必要
      const current = filteredData[i];
      const currentDate = new Date(
        typeof current.time === 'number' 
          ? current.time * 1000 
          : typeof current.time === 'string'
          ? current.time
          : new Date((current.time as any).year, (current.time as any).month - 1, (current.time as any).day).getTime()
      );

      // 週末をスキップ
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;

      // 前のシグナルの結果をチェック
      if (activeSignal) {
        const exitResult = this.checkSignalExit(
          activeSignal, 
          current, 
          currentDate,
          i - signalStartIndex
        );

        if (exitResult) {
          const trade: BacktestTrade = {
            date: activeSignal.time,
            pair,
            signal: activeSignal,
            entryPrice: activeSignal.price,
            exitPrice: exitResult.price,
            exitReason: exitResult.reason,
            pips: this.calculatePips(
              activeSignal.price,
              exitResult.price,
              activeSignal.type,
              pair
            ),
            duration: (currentDate.getTime() - new Date(activeSignal.time).getTime()) / (1000 * 60),
            isWin: exitResult.isWin
          };

          trades.push(trade);
          activeSignal = null;
        }
      }

      // 新しいシグナルをチェック（アクティブシグナルがない場合のみ）
      if (!activeSignal) {
        const recentData = filteredData.slice(Math.max(0, i - 50), i + 1);
        
        // TORB範囲を計算
        const range = this.torbLogic.calculateTokyoRange(recentData, currentDate);
        
        if (range) {
          // ブレイクアウトシグナルをチェック
          const signal = this.torbLogic.checkBreakoutSignal(
            current.close,
            currentDate,
            i > 0 ? filteredData[i - 1] : undefined,
            this.calculateMockRSI(recentData) // モックRSI
          );

          if (signal) {
            activeSignal = signal;
            signalStartIndex = i;
          }
        }
      }
    }

    return trades;
  }

  // シグナルの決済条件をチェック
  private checkSignalExit(
    signal: TORBSignal,
    currentCandle: CandlestickData,
    currentTime: Date,
    durationMinutes: number
  ): { price: number; reason: BacktestTrade['exitReason']; isWin: boolean } | null {
    const currentPrice = currentCandle.close;

    // 利確達成
    if (signal.type === 'BUY' && currentPrice >= signal.target) {
      return {
        price: signal.target,
        reason: 'TARGET',
        isWin: true
      };
    }

    if (signal.type === 'SELL' && currentPrice <= signal.target) {
      return {
        price: signal.target,
        reason: 'TARGET',
        isWin: true
      };
    }

    // 損切り
    if (signal.type === 'BUY' && currentPrice <= signal.stopLoss) {
      return {
        price: signal.stopLoss,
        reason: 'STOP_LOSS',
        isWin: false
      };
    }

    if (signal.type === 'SELL' && currentPrice >= signal.stopLoss) {
      return {
        price: signal.stopLoss,
        reason: 'STOP_LOSS',
        isWin: false
      };
    }

    // 時間切れ（4時間後）
    if (durationMinutes >= 240) {
      return {
        price: currentPrice,
        reason: 'TIME_EXIT',
        isWin: this.calculatePips(signal.price, currentPrice, signal.type, 'USDJPY') > 0
      };
    }

    return null;
  }

  // Pips計算
  private calculatePips(
    entryPrice: number,
    exitPrice: number,
    tradeType: 'BUY' | 'SELL',
    pair: CurrencyPair
  ): number {
    const pairInfo = CURRENCY_PAIRS[pair];
    const priceDiff = tradeType === 'BUY' 
      ? exitPrice - entryPrice 
      : entryPrice - exitPrice;
    
    return Number((priceDiff / pairInfo.pipValue).toFixed(1));
  }

  // 統計計算
  private calculateStatistics(
    trades: BacktestTrade[],
    parameters: BacktestParameters
  ): BacktestResult {
    if (trades.length === 0) {
      return this.getEmptyResult(trades);
    }

    const winningTrades = trades.filter(t => t.isWin);
    const losingTrades = trades.filter(t => !t.isWin);

    const totalPips = trades.reduce((sum, t) => sum + t.pips, 0);
    const winPips = winningTrades.reduce((sum, t) => sum + t.pips, 0);
    const lossPips = Math.abs(losingTrades.reduce((sum, t) => sum + t.pips, 0));

    // 連続勝敗の計算
    const { maxConsecutiveWins, maxConsecutiveLosses } = this.calculateConsecutiveStats(trades);

    // 最大ドローダウンの計算
    const maxDrawdown = this.calculateMaxDrawdown(trades);

    // 日次・月次統計
    const dailyPnL = this.calculateDailyPnL(trades);
    const monthlyStats = this.calculateMonthlyStats(trades);

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: winningTrades.length / trades.length,
      totalPips,
      avgWinPips: winningTrades.length > 0 ? winPips / winningTrades.length : 0,
      avgLossPips: losingTrades.length > 0 ? lossPips / losingTrades.length : 0,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      maxDrawdown,
      profitFactor: lossPips > 0 ? winPips / lossPips : winPips > 0 ? 10 : 0,
      trades,
      dailyPnL,
      monthlyStats
    };
  }

  // 空の結果を返す
  private getEmptyResult(trades: BacktestTrade[]): BacktestResult {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPips: 0,
      avgWinPips: 0,
      avgLossPips: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      maxDrawdown: 0,
      profitFactor: 0,
      trades,
      dailyPnL: [],
      monthlyStats: []
    };
  }

  // 連続勝敗統計
  private calculateConsecutiveStats(trades: BacktestTrade[]): {
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  } {
    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    for (const trade of trades) {
      if (trade.isWin) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    }

    return { maxConsecutiveWins: maxWins, maxConsecutiveLosses: maxLosses };
  }

  // 最大ドローダウン計算
  private calculateMaxDrawdown(trades: BacktestTrade[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativePips = 0;

    for (const trade of trades) {
      cumulativePips += trade.pips;
      if (cumulativePips > peak) {
        peak = cumulativePips;
      } else {
        const drawdown = peak - cumulativePips;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }

    return maxDrawdown;
  }

  // 日次損益計算
  private calculateDailyPnL(trades: BacktestTrade[]): DailyPnL[] {
    const dailyMap = new Map<string, BacktestTrade[]>();

    // 日付別にグループ化
    trades.forEach(trade => {
      const date = new Date(trade.date).toDateString();
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)!.push(trade);
    });

    const results: DailyPnL[] = [];
    let cumulativePips = 0;

    Array.from(dailyMap.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(([date, dayTrades]) => {
        const dayPips = dayTrades.reduce((sum, t) => sum + t.pips, 0);
        const dayWins = dayTrades.filter(t => t.isWin).length;
        cumulativePips += dayPips;

        results.push({
          date,
          trades: dayTrades.length,
          totalPips: dayPips,
          winRate: dayTrades.length > 0 ? dayWins / dayTrades.length : 0,
          cumulativePips
        });
      });

    return results;
  }

  // 月次統計計算
  private calculateMonthlyStats(trades: BacktestTrade[]): MonthlyStats[] {
    const monthlyMap = new Map<string, BacktestTrade[]>();

    trades.forEach(trade => {
      const date = new Date(trade.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, []);
      }
      monthlyMap.get(monthKey)!.push(trade);
    });

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, monthTrades]) => {
        const dailyPips = this.calculateDailyPnL(monthTrades).map(d => d.totalPips);
        const wins = monthTrades.filter(t => t.isWin).length;
        
        return {
          month,
          trades: monthTrades.length,
          winRate: monthTrades.length > 0 ? wins / monthTrades.length : 0,
          totalPips: monthTrades.reduce((sum, t) => sum + t.pips, 0),
          bestDay: dailyPips.length > 0 ? Math.max(...dailyPips) : 0,
          worstDay: dailyPips.length > 0 ? Math.min(...dailyPips) : 0
        };
      });
  }

  // 通貨ペア別設定の調整
  private adaptSettingsForPair(baseSettings: TORBSettings, pair: CurrencyPair): TORBSettings {
    const pairInfo = CURRENCY_PAIRS[pair];
    
    return {
      ...baseSettings,
      // 通貨ペアの取引時間を適用
      rangeStartHour: pairInfo.sessionTimes.rangeStartHour,
      rangeStartMinute: pairInfo.sessionTimes.rangeStartMinute,
      rangeEndHour: pairInfo.sessionTimes.rangeEndHour,
      rangeEndMinute: pairInfo.sessionTimes.rangeEndMinute,
      tradingEndHour: pairInfo.sessionTimes.tradingEndHour,
      tradingEndMinute: pairInfo.sessionTimes.tradingEndMinute
    };
  }

  // モックRSI計算（簡易版）
  private calculateMockRSI(data: CandlestickData[]): number | undefined {
    if (data.length < 14) return undefined;
    
    const recent = data.slice(-14);
    const changes = recent.slice(1).map((candle, i) => candle.close - recent[i].close);
    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(l => Math.abs(l));
    
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
}

// シングルトンインスタンス
export const backtestEngine = new BacktestEngine();
/**
 * Auto Trading Service - Tokyo Box Strategy
 * 自動取引記録システム（仮想取引）
 */

import { logger } from '../utils/logger';
import { TORBAnalysisService } from './torbAnalysisService';
import { PerformanceTrackingService } from './performanceTrackingService';
import { FXDataService } from './fxDataService';
import { getWebSocketService } from './websocketService';
import { TORBSignal, CandleData } from '../types';

interface VirtualTrade {
  id: string;
  signal: TORBSignal;
  entryTime: Date;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  status: 'OPEN' | 'CLOSED' | 'STOPPED';
  exitTime?: Date;
  exitPrice?: number;
  exitReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TIME_STOP' | 'MANUAL';
  pnlPips?: number;
  pnlAmount?: number;
  maxHours: number;
}

export class AutoTradingService {
  private torbAnalysis: TORBAnalysisService;
  private performanceTracking: PerformanceTrackingService;
  private fxDataService: FXDataService;
  private websocket: ReturnType<typeof getWebSocketService>;
  
  private activeTrades: Map<string, VirtualTrade> = new Map();
  private recentBreakouts: Map<string, TORBSignal> = new Map(); // For retest tracking
  private isRunning: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  
  // Trading settings from Tokyo Box Strategy
  private readonly RISK_PER_TRADE = 0.02; // 2%
  private readonly MAX_CONSECUTIVE_LOSSES = 3;
  private readonly DAILY_DRAWDOWN_LIMIT = -0.05; // -5%
  private readonly MAX_POSITIONS = 1;
  private readonly MAX_TRADE_HOURS = 4;
  
  constructor() {
    this.torbAnalysis = new TORBAnalysisService();
    this.performanceTracking = new PerformanceTrackingService(
      process.env.DATABASE_URL || 'postgresql://localhost:5432/fx_sign_db'
    );
    this.fxDataService = new FXDataService();
    this.websocket = getWebSocketService();
  }

  public async startAutoTrading(symbol: string = 'USDJPY'): Promise<void> {
    if (this.isRunning) {
      logger.warn('Auto trading is already running');
      return;
    }

    this.isRunning = true;
    logger.info(`🤖 Auto trading started for ${symbol}`);

    // Monitor every 5 minutes (300 seconds)
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.processTokyoBoxStrategy(symbol);
        await this.monitorActiveTrades(symbol);
      } catch (error) {
        logger.error('Auto trading monitoring error:', error);
      }
    }, 5 * 60 * 1000);

    // Initial run
    await this.processTokyoBoxStrategy(symbol);
  }

  public stopAutoTrading(): void {
    if (!this.isRunning) {
      logger.warn('Auto trading is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    logger.info('🛑 Auto trading stopped');
  }

  private async processTokyoBoxStrategy(symbol: string): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if we should be trading (Tue-Fri, trading hours)
    if (!this.isValidTradingTime(now)) {
      return;
    }

    // Risk management: Check consecutive losses and daily drawdown
    if (!await this.passesRiskChecks()) {
      logger.info('Auto trading paused due to risk management limits');
      return;
    }

    // Max positions check
    if (this.activeTrades.size >= this.MAX_POSITIONS) {
      logger.debug('Max positions reached, waiting for exits');
      return;
    }

    try {
      // Step 1: Check for 15-minute breakout signals
      const currentPrice = await this.fxDataService.getCurrentPrice(symbol);
      const tokyoBoxRange = await this.torbAnalysis.calculateTokyoBoxRange(symbol, today);
      
      if (!tokyoBoxRange) {
        logger.debug('No valid Tokyo Box range for today');
        return;
      }

      // Get 15-minute candle data
      const candles15m = await this.fxDataService.getHistoricalData(symbol, '15m', 20);
      if (candles15m.length === 0) {
        return;
      }

      const currentCandle15m = candles15m[candles15m.length - 1];
      const rsi = this.calculateRSI(candles15m.slice(-14), 14);

      // Check for breakout on 15-minute close
      const breakoutSignal = await this.torbAnalysis.checkBreakoutConditions(
        symbol,
        tokyoBoxRange,
        currentCandle15m.close,
        rsi,
        candles15m
      );

      if (breakoutSignal) {
        // Store breakout for potential retest entry
        this.recentBreakouts.set(symbol, breakoutSignal);
        logger.info(`💡 Breakout detected, waiting for retest: ${breakoutSignal.type} at ${breakoutSignal.entryPrice}`);
        return;
      }

      // Step 2: Check for retest entry on 5-minute
      const recentBreakout = this.recentBreakouts.get(symbol);
      if (recentBreakout) {
        const candles5m = await this.fxDataService.getHistoricalData(symbol, '5m', 12);
        const retestSignal = await this.torbAnalysis.checkRetestEntry(symbol, recentBreakout, candles5m);
        
        if (retestSignal) {
          await this.executeVirtualTrade(symbol, retestSignal);
          this.recentBreakouts.delete(symbol); // Clean up after entry
        }
      }

    } catch (error) {
      logger.error(`Tokyo Box Strategy processing error for ${symbol}:`, error);
    }
  }

  private async executeVirtualTrade(symbol: string, signal: TORBSignal): Promise<void> {
    const tradeId = signal.id;
    const entryPrice = signal.entryPrice;
    const stopLoss = signal.stopLoss;
    
    // Calculate position size based on 2% risk
    const accountBalance = 300000; // JPY (from demo settings)
    const riskAmount = accountBalance * this.RISK_PER_TRADE;
    const pipsRisk = Math.abs(entryPrice - stopLoss);
    const positionSize = Math.floor(riskAmount / (pipsRisk * 100)); // 100 JPY per pip for USDJPY

    // Calculate take profit based on session
    const session = this.getCurrentSession();
    const riskDistance = Math.abs(entryPrice - stopLoss);
    let tpMultiplier: number;
    
    if (session === 'Tokyo') tpMultiplier = 1.5;
    else if (session === 'London') tpMultiplier = 2.5;
    else tpMultiplier = 2.0; // NY

    const takeProfit = signal.type === 'LONG' 
      ? entryPrice + (riskDistance * tpMultiplier)
      : entryPrice - (riskDistance * tpMultiplier);

    // Create virtual trade
    const virtualTrade: VirtualTrade = {
      id: tradeId,
      signal,
      entryTime: new Date(),
      entryPrice,
      stopLoss,
      takeProfit,
      status: 'OPEN',
      maxHours: this.MAX_TRADE_HOURS
    };

    // Record trade in database
    await this.performanceTracking.recordTrade({
      symbol,
      entryTime: virtualTrade.entryTime,
      direction: signal.type,
      boxHigh: signal.range.high,
      boxLow: signal.range.low,
      boxWidthPips: signal.range.range,
      entrySession: session === 'Tokyo' ? 'NY_EARLY' : session === 'London' ? 'EUROPE' : 'NY_EARLY',
      entryPrice,
      entryMethod: 'RETEST',
      positionSize,
      stopLoss,
      takeProfit,
      riskRewardRatio: tpMultiplier,
      spreadAtEntry: 1.5, // Assume 1.5 pips spread
      volatilityRegime: 'MEDIUM'
    });

    // Store active trade
    this.activeTrades.set(tradeId, virtualTrade);

    // Broadcast signal via WebSocket
    this.websocket.broadcastTORBSignal(signal);

    logger.info(`🎯 Virtual trade executed: ${signal.type} ${symbol} at ${entryPrice}, SL: ${stopLoss}, TP: ${takeProfit}, Size: ${positionSize}`);
  }

  private async monitorActiveTrades(symbol: string): Promise<void> {
    if (this.activeTrades.size === 0) {
      return;
    }

    const currentPrice = await this.fxDataService.getCurrentPrice(symbol);
    const now = new Date();

    for (const [tradeId, trade] of this.activeTrades.entries()) {
      if (trade.status !== 'OPEN') {
        continue;
      }

      let shouldClose = false;
      let exitReason: VirtualTrade['exitReason'] = 'MANUAL';
      let exitPrice = currentPrice.ask;

      // Check for take profit
      if ((trade.signal.type === 'LONG' && currentPrice.bid >= trade.takeProfit) ||
          (trade.signal.type === 'SHORT' && currentPrice.ask <= trade.takeProfit)) {
        shouldClose = true;
        exitReason = 'TAKE_PROFIT';
        exitPrice = trade.takeProfit;
      }
      // Check for stop loss
      else if ((trade.signal.type === 'LONG' && currentPrice.bid <= trade.stopLoss) ||
               (trade.signal.type === 'SHORT' && currentPrice.ask >= trade.stopLoss)) {
        shouldClose = true;
        exitReason = 'STOP_LOSS';
        exitPrice = trade.stopLoss;
      }
      // Check for time stop (4 hours max)
      else if ((now.getTime() - trade.entryTime.getTime()) > (trade.maxHours * 60 * 60 * 1000)) {
        shouldClose = true;
        exitReason = 'TIME_STOP';
      }

      if (shouldClose) {
        await this.closeVirtualTrade(tradeId, exitPrice, exitReason, now);
      }
    }
  }

  private async closeVirtualTrade(
    tradeId: string,
    exitPrice: number,
    exitReason: VirtualTrade['exitReason'],
    exitTime: Date
  ): Promise<void> {
    
    const trade = this.activeTrades.get(tradeId);
    if (!trade) {
      return;
    }

    // Calculate P&L
    const pnlPips = trade.signal.type === 'LONG' 
      ? (exitPrice - trade.entryPrice) 
      : (trade.entryPrice - exitPrice);
    const pnlAmount = pnlPips * 100; // 100 JPY per pip for USDJPY

    // Update trade
    trade.status = 'CLOSED';
    trade.exitTime = exitTime;
    trade.exitPrice = exitPrice;
    trade.exitReason = exitReason;
    trade.pnlPips = pnlPips;
    trade.pnlAmount = pnlAmount;

    // TODO: Store the DB trade ID when creating trade to update exit info
    // For now, the initial trade record contains the complete information

    // Remove from active trades
    this.activeTrades.delete(tradeId);

    const result = pnlPips > 0 ? '✅ WIN' : '❌ LOSS';
    logger.info(`${result} Trade closed: ${trade.signal.type} ${exitReason} at ${exitPrice}, P&L: ${pnlPips.toFixed(1)} pips / ${pnlAmount.toFixed(0)} JPY`);
  }

  private calculateRSI(candles: CandleData[], period: number): number {
    if (candles.length < period + 1) {
      return 50; // Neutral RSI if insufficient data
    }

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < Math.min(period + 1, candles.length); i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / (avgLoss || 0.0001); // Avoid division by zero
    const rsi = 100 - (100 / (1 + rs));

    return Math.max(0, Math.min(100, rsi));
  }

  private getCurrentSession(): string {
    const now = new Date();
    const jst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const hour = jst.getHours();

    if (hour >= 9 && hour < 15) return 'Tokyo';
    if (hour >= 16 && hour < 24) return 'London';
    if (hour >= 22 || hour < 2) return 'NY';
    return 'Tokyo';
  }

  private isValidTradingTime(date: Date): boolean {
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const jst = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    const hour = jst.getHours();

    // Allowed days: Tue-Fri (2-5)
    if (dayOfWeek < 2 || dayOfWeek > 5) {
      return false;
    }

    // Allowed trading windows
    return (hour >= 16 && hour < 18) || // Europe initial
           (hour >= 21 && hour < 23);   // NY early
  }

  private async passesRiskChecks(): Promise<boolean> {
    // This would check recent performance stats
    // For now, return true (implement based on database records)
    return true;
  }

  public getActiveTradesCount(): number {
    return this.activeTrades.size;
  }

  public getActiveTrades(): VirtualTrade[] {
    return Array.from(this.activeTrades.values());
  }
}
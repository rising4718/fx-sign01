import { logger } from '../utils/logger';
import { TORBRange, TORBSignal, CandleData } from '../types';
import { FXDataService } from './fxDataService';
import { uuidv4 } from '../utils/uuid';

export class TORBAnalysisService {
  private fxDataService: FXDataService;
  private activeSignals: Map<string, TORBSignal> = new Map();
  private torbRanges: Map<string, TORBRange> = new Map(); // key: symbol_date

  constructor() {
    this.fxDataService = new FXDataService();
  }

  private getJSTTime(date?: Date): Date {
    const utc = date || new Date();
    // JST is UTC+9
    return new Date(utc.getTime() + (9 * 60 * 60 * 1000));
  }

  private isTokyoTradingTime(date: Date): boolean {
    const jst = this.getJSTTime(date);
    const hour = jst.getHours();
    const minute = jst.getMinutes();
    
    // Tokyo trading time: 9:00-11:00 JST
    return hour >= 9 && (hour < 11 || (hour === 11 && minute === 0));
  }

  private isTORBRangeTime(date: Date): boolean {
    const jst = this.getJSTTime(date);
    const hour = jst.getHours();
    const minute = jst.getMinutes();
    
    // TORB range setting time: 9:00-9:45 JST
    return hour === 9 && minute < 45;
  }

  private isTORBBreakoutTime(date: Date): boolean {
    const jst = this.getJSTTime(date);
    const hour = jst.getHours();
    const minute = jst.getMinutes();
    
    // TORB breakout monitoring time: 9:45-11:00 JST
    return (hour === 9 && minute >= 45) || (hour === 10) || (hour === 11 && minute === 0);
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      return 50; // neutral RSI if not enough data
    }

    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate average gains and losses
    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return parseFloat(rsi.toFixed(2));
  }

  private pipsToPrice(pips: number): number {
    // For USD/JPY, 1 pip = 0.001
    return pips * 0.001;
  }

  private priceToPips(priceChange: number): number {
    // For USD/JPY, convert price change to pips
    return priceChange / 0.001;
  }

  public async calculateTORBRange(symbol: string, date: string): Promise<TORBRange | null> {
    const jstDate = new Date(date + 'T09:00:00+09:00');
    const endTime = new Date(jstDate.getTime() + (45 * 60 * 1000)); // 9:45 JST
    
    logger.debug(`Calculating TORB range for ${symbol} on ${date} (9:00-9:45 JST)`);

    try {
      // Get historical data for the range period (would use actual data in production)
      const historicalData = await this.fxDataService.getHistoricalData(symbol, '1m', 45);
      
      if (historicalData.length === 0) {
        logger.warn(`No historical data available for ${symbol} on ${date}`);
        return null;
      }

      // Calculate high and low during range period
      const high = Math.max(...historicalData.map(candle => candle.high));
      const low = Math.min(...historicalData.map(candle => candle.low));
      const rangePips = this.priceToPips(high - low);

      const torbRange: TORBRange = {
        startTime: jstDate,
        endTime,
        high,
        low,
        range: parseFloat(rangePips.toFixed(1))
      };

      // Cache the range
      const cacheKey = `${symbol}_${date}`;
      this.torbRanges.set(cacheKey, torbRange);

      logger.info(`TORB range calculated for ${symbol}: High=${high}, Low=${low}, Range=${rangePips} pips`);
      return torbRange;

    } catch (error) {
      logger.error(`Error calculating TORB range for ${symbol}:`, error);
      return null;
    }
  }

  public async getTORBRange(symbol: string, date: string): Promise<TORBRange | null> {
    const cacheKey = `${symbol}_${date}`;
    const cached = this.torbRanges.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Calculate if not cached
    return await this.calculateTORBRange(symbol, date);
  }

  private async checkBreakoutConditions(
    symbol: string, 
    range: TORBRange, 
    currentPrice: number,
    rsi: number
  ): Promise<TORBSignal | null> {
    
    // Check range width filter (15-50 pips)
    if (range.range < 15 || range.range > 50) {
      logger.debug(`Range width ${range.range} pips outside valid range (15-50 pips)`);
      return null;
    }

    let signalType: 'LONG' | 'SHORT' | null = null;
    let entryPrice = currentPrice;
    let targetPrice: number = 0;
    let stopLoss: number = 0;

    // Check for breakout above range high (LONG signal)
    if (currentPrice > range.high && rsi > 55) {
      signalType = 'LONG';
      const breakoutPips = this.priceToPips(currentPrice - range.high);
      targetPrice = currentPrice + (breakoutPips * 1.5 * 0.001); // 1.5x breakout distance
      stopLoss = range.low - this.pipsToPrice(5); // Range low - 5 pips
      
      logger.info(`LONG breakout detected: Price=${currentPrice}, Range High=${range.high}, RSI=${rsi}`);
    }
    // Check for breakout below range low (SHORT signal)
    else if (currentPrice < range.low && rsi < 45) {
      signalType = 'SHORT';
      const breakoutPips = this.priceToPips(range.low - currentPrice);
      targetPrice = currentPrice - (breakoutPips * 1.5 * 0.001); // 1.5x breakout distance
      stopLoss = range.high + this.pipsToPrice(5); // Range high + 5 pips
      
      logger.info(`SHORT breakout detected: Price=${currentPrice}, Range Low=${range.low}, RSI=${rsi}`);
    }

    if (!signalType) {
      return null;
    }

    // Calculate confidence based on RSI strength and breakout strength
    const rsiStrength = signalType === 'LONG' ? (rsi - 55) / 45 : (45 - rsi) / 45;
    const breakoutStrength = signalType === 'LONG' ? 
      this.priceToPips(currentPrice - range.high) / 10 : 
      this.priceToPips(range.low - currentPrice) / 10;
    
    const confidence = Math.min(0.95, Math.max(0.5, (rsiStrength + breakoutStrength) / 2));

    const signal: TORBSignal = {
      id: uuidv4(),
      timestamp: new Date(),
      type: signalType,
      entryPrice,
      targetPrice: parseFloat(targetPrice.toFixed(3)),
      stopLoss: parseFloat(stopLoss.toFixed(3)),
      range,
      rsi,
      confidence: parseFloat(confidence.toFixed(2)),
      status: 'ACTIVE'
    };

    return signal;
  }

  public async getCurrentSignals(symbol: string): Promise<TORBSignal[]> {
    const now = new Date();
    
    if (!this.isTokyoTradingTime(now)) {
      logger.debug('Outside Tokyo trading hours, no signals generated');
      return Array.from(this.activeSignals.values()).filter(s => s.status === 'ACTIVE');
    }

    const today = this.getJSTTime(now).toISOString().split('T')[0];
    const range = await this.getTORBRange(symbol, today);
    
    if (!range) {
      logger.debug('No TORB range available for signal generation');
      return Array.from(this.activeSignals.values()).filter(s => s.status === 'ACTIVE');
    }

    // Only check for new signals during breakout time
    if (this.isTORBBreakoutTime(now)) {
      try {
        const currentPrice = await this.fxDataService.getCurrentPrice(symbol);
        
        // Get recent price data for RSI calculation
        const recentData = await this.fxDataService.getHistoricalData(symbol, '5m', 20);
        const prices = recentData.map(candle => candle.close);
        const rsi = this.calculateRSI(prices);
        
        logger.debug(`Checking breakout conditions: Price=${currentPrice.ask}, RSI=${rsi}`);
        
        const newSignal = await this.checkBreakoutConditions(
          symbol, 
          range, 
          currentPrice.ask, 
          rsi
        );
        
        if (newSignal) {
          this.activeSignals.set(newSignal.id, newSignal);
          logger.info(`New TORB signal generated: ${newSignal.type} at ${newSignal.entryPrice}`);
        }
        
      } catch (error) {
        logger.error('Error checking for new signals:', error);
      }
    }

    return Array.from(this.activeSignals.values()).filter(s => s.status === 'ACTIVE');
  }

  public async getTORBAnalysis(symbol: string): Promise<any> {
    const now = new Date();
    const jstNow = this.getJSTTime(now);
    const today = jstNow.toISOString().split('T')[0];
    
    const analysis = {
      symbol,
      timestamp: now,
      tokyoTime: jstNow,
      tradingSession: {
        isActive: this.isTokyoTradingTime(now),
        isRangeTime: this.isTORBRangeTime(now),
        isBreakoutTime: this.isTORBBreakoutTime(now)
      },
      range: null as TORBRange | null,
      currentPrice: null as any,
      signals: [] as TORBSignal[],
      marketCondition: 'UNKNOWN'
    };

    try {
      // Get current range
      analysis.range = await this.getTORBRange(symbol, today);
      
      // Get current price
      analysis.currentPrice = await this.fxDataService.getCurrentPrice(symbol);
      
      // Get current signals
      analysis.signals = await this.getCurrentSignals(symbol);
      
      // Determine market condition
      if (analysis.range && analysis.currentPrice) {
        const price = analysis.currentPrice.ask;
        if (price > analysis.range.high) {
          analysis.marketCondition = 'ABOVE_RANGE';
        } else if (price < analysis.range.low) {
          analysis.marketCondition = 'BELOW_RANGE';
        } else {
          analysis.marketCondition = 'WITHIN_RANGE';
        }
      }
      
    } catch (error) {
      logger.error('Error performing TORB analysis:', error);
    }

    return analysis;
  }

  public async calculateTORB(symbol: string, date: string): Promise<any> {
    logger.info(`Manual TORB calculation for ${symbol} on ${date}`);
    
    const range = await this.calculateTORBRange(symbol, date);
    if (!range) {
      throw new Error(`Could not calculate TORB range for ${symbol} on ${date}`);
    }

    // Simulate signal generation for the day
    const signals: TORBSignal[] = [];
    
    // This would normally check historical price data for breakouts
    // For now, generate mock signals based on range
    if (Math.random() > 0.7) { // 30% chance of signal
      const signalType: 'LONG' | 'SHORT' = Math.random() > 0.5 ? 'LONG' : 'SHORT';
      const entryPrice = signalType === 'LONG' ? range.high + 0.005 : range.low - 0.005;
      
      const signal: TORBSignal = {
        id: uuidv4(),
        timestamp: new Date(date + 'T10:00:00+09:00'),
        type: signalType,
        entryPrice,
        targetPrice: signalType === 'LONG' ? 
          entryPrice + (range.range * 1.5 * 0.001) : 
          entryPrice - (range.range * 1.5 * 0.001),
        stopLoss: signalType === 'LONG' ? 
          range.low - 0.005 : 
          range.high + 0.005,
        range,
        rsi: Math.random() > 0.5 ? 65 : 35,
        confidence: 0.75 + Math.random() * 0.2,
        status: 'COMPLETED'
      };
      
      signals.push(signal);
    }

    return {
      date,
      range,
      signals,
      performance: {
        totalSignals: signals.length,
        winRate: signals.length > 0 ? Math.random() * 0.4 + 0.6 : 0, // 60-100% mock win rate
        avgPnL: signals.length > 0 ? (Math.random() - 0.3) * 50 : 0 // Mock P&L
      }
    };
  }

  public async getTORBHistory(symbol: string, days: number, limit: number): Promise<any> {
    const signals: TORBSignal[] = [];
    const endDate = new Date();
    
    // Generate mock historical signals
    for (let i = 0; i < Math.min(days, limit); i++) {
      const date = new Date(endDate.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      
      if (Math.random() > 0.6) { // 40% chance of signal per day
        const mockSignal = await this.calculateTORB(symbol, dateStr);
        signals.push(...mockSignal.signals);
      }
    }

    // Calculate performance metrics
    const completedSignals = signals.filter(s => s.status === 'COMPLETED');
    const winningSignals = completedSignals.filter(() => Math.random() > 0.25); // Mock 75% win rate
    
    const performance = {
      totalSignals: completedSignals.length,
      winningSignals: winningSignals.length,
      winRate: completedSignals.length > 0 ? winningSignals.length / completedSignals.length : 0,
      totalPnL: winningSignals.length * 25 - (completedSignals.length - winningSignals.length) * 15, // Mock P&L
      avgPnL: completedSignals.length > 0 ? 
        (winningSignals.length * 25 - (completedSignals.length - winningSignals.length) * 15) / completedSignals.length : 0
    };

    return {
      signals: signals.slice(0, limit),
      performance
    };
  }

  public getActiveSignalsCount(): number {
    return Array.from(this.activeSignals.values()).filter(s => s.status === 'ACTIVE').length;
  }

  public clearOldSignals(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [id, signal] of this.activeSignals.entries()) {
      if (now - signal.timestamp.getTime() > maxAge) {
        this.activeSignals.delete(id);
      }
    }
  }
}
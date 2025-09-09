"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoTradingService = void 0;
const logger_1 = require("../utils/logger");
const torbAnalysisService_1 = require("./torbAnalysisService");
const performanceTrackingService_1 = require("./performanceTrackingService");
const fxDataService_1 = require("./fxDataService");
const websocketService_1 = require("./websocketService");
class AutoTradingService {
    constructor() {
        this.activeTrades = new Map();
        this.recentBreakouts = new Map();
        this.isRunning = false;
        this.RISK_PER_TRADE = 0.02;
        this.MAX_CONSECUTIVE_LOSSES = 3;
        this.DAILY_DRAWDOWN_LIMIT = -0.05;
        this.MAX_POSITIONS = 1;
        this.MAX_TRADE_HOURS = 4;
        this.torbAnalysis = new torbAnalysisService_1.TORBAnalysisService();
        this.performanceTracking = new performanceTrackingService_1.PerformanceTrackingService(process.env.DATABASE_URL || 'postgresql://localhost:5432/fx_sign_db');
        this.fxDataService = new fxDataService_1.FXDataService();
        this.websocket = (0, websocketService_1.getWebSocketService)();
    }
    async startAutoTrading(symbol = 'USDJPY') {
        if (this.isRunning) {
            logger_1.logger.warn('Auto trading is already running');
            return;
        }
        this.isRunning = true;
        logger_1.logger.info(`🤖 Auto trading started for ${symbol}`);
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.processTokyoBoxStrategy(symbol);
                await this.monitorActiveTrades(symbol);
            }
            catch (error) {
                logger_1.logger.error('Auto trading monitoring error:', error);
            }
        }, 5 * 60 * 1000);
        await this.processTokyoBoxStrategy(symbol);
    }
    stopAutoTrading() {
        if (!this.isRunning) {
            logger_1.logger.warn('Auto trading is not running');
            return;
        }
        this.isRunning = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        logger_1.logger.info('🛑 Auto trading stopped');
    }
    async processTokyoBoxStrategy(symbol) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        if (!this.isValidTradingTime(now)) {
            return;
        }
        if (!await this.passesRiskChecks()) {
            logger_1.logger.info('Auto trading paused due to risk management limits');
            return;
        }
        if (this.activeTrades.size >= this.MAX_POSITIONS) {
            logger_1.logger.debug('Max positions reached, waiting for exits');
            return;
        }
        try {
            const currentPrice = await this.fxDataService.getCurrentPrice(symbol);
            const tokyoBoxRange = await this.torbAnalysis.calculateTokyoBoxRange(symbol, today);
            if (!tokyoBoxRange) {
                logger_1.logger.debug('No valid Tokyo Box range for today');
                return;
            }
            const candles15m = await this.fxDataService.getHistoricalData(symbol, '15m', 20);
            if (candles15m.length === 0) {
                return;
            }
            const currentCandle15m = candles15m[candles15m.length - 1];
            const rsi = this.calculateRSI(candles15m.slice(-14), 14);
            const breakoutSignal = await this.torbAnalysis.checkBreakoutConditions(symbol, tokyoBoxRange, currentCandle15m.close, rsi, candles15m);
            if (breakoutSignal) {
                this.recentBreakouts.set(symbol, breakoutSignal);
                logger_1.logger.info(`💡 Breakout detected, waiting for retest: ${breakoutSignal.type} at ${breakoutSignal.entryPrice}`);
                return;
            }
            const recentBreakout = this.recentBreakouts.get(symbol);
            if (recentBreakout) {
                const candles5m = await this.fxDataService.getHistoricalData(symbol, '5m', 12);
                const retestSignal = await this.torbAnalysis.checkRetestEntry(symbol, recentBreakout, candles5m);
                if (retestSignal) {
                    await this.executeVirtualTrade(symbol, retestSignal);
                    this.recentBreakouts.delete(symbol);
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`Tokyo Box Strategy processing error for ${symbol}:`, error);
        }
    }
    async executeVirtualTrade(symbol, signal) {
        const tradeId = signal.id;
        const entryPrice = signal.entryPrice;
        const stopLoss = signal.stopLoss;
        const accountBalance = 300000;
        const riskAmount = accountBalance * this.RISK_PER_TRADE;
        const pipsRisk = Math.abs(entryPrice - stopLoss);
        const positionSize = Math.floor(riskAmount / (pipsRisk * 100));
        const session = this.getCurrentSession();
        const riskDistance = Math.abs(entryPrice - stopLoss);
        let tpMultiplier;
        if (session === 'Tokyo')
            tpMultiplier = 1.5;
        else if (session === 'London')
            tpMultiplier = 2.5;
        else
            tpMultiplier = 2.0;
        const takeProfit = signal.type === 'LONG'
            ? entryPrice + (riskDistance * tpMultiplier)
            : entryPrice - (riskDistance * tpMultiplier);
        const virtualTrade = {
            id: tradeId,
            signal,
            entryTime: new Date(),
            entryPrice,
            stopLoss,
            takeProfit,
            status: 'OPEN',
            maxHours: this.MAX_TRADE_HOURS
        };
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
            spreadAtEntry: 1.5,
            volatilityRegime: 'MEDIUM'
        });
        this.activeTrades.set(tradeId, virtualTrade);
        this.websocket.broadcastTORBSignal(signal);
        logger_1.logger.info(`🎯 Virtual trade executed: ${signal.type} ${symbol} at ${entryPrice}, SL: ${stopLoss}, TP: ${takeProfit}, Size: ${positionSize}`);
    }
    async monitorActiveTrades(symbol) {
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
            let exitReason = 'MANUAL';
            let exitPrice = currentPrice.ask;
            if ((trade.signal.type === 'LONG' && currentPrice.bid >= trade.takeProfit) ||
                (trade.signal.type === 'SHORT' && currentPrice.ask <= trade.takeProfit)) {
                shouldClose = true;
                exitReason = 'TAKE_PROFIT';
                exitPrice = trade.takeProfit;
            }
            else if ((trade.signal.type === 'LONG' && currentPrice.bid <= trade.stopLoss) ||
                (trade.signal.type === 'SHORT' && currentPrice.ask >= trade.stopLoss)) {
                shouldClose = true;
                exitReason = 'STOP_LOSS';
                exitPrice = trade.stopLoss;
            }
            else if ((now.getTime() - trade.entryTime.getTime()) > (trade.maxHours * 60 * 60 * 1000)) {
                shouldClose = true;
                exitReason = 'TIME_STOP';
            }
            if (shouldClose) {
                await this.closeVirtualTrade(tradeId, exitPrice, exitReason, now);
            }
        }
    }
    async closeVirtualTrade(tradeId, exitPrice, exitReason, exitTime) {
        const trade = this.activeTrades.get(tradeId);
        if (!trade) {
            return;
        }
        const pnlPips = trade.signal.type === 'LONG'
            ? (exitPrice - trade.entryPrice)
            : (trade.entryPrice - exitPrice);
        const pnlAmount = pnlPips * 100;
        trade.status = 'CLOSED';
        trade.exitTime = exitTime;
        trade.exitPrice = exitPrice;
        trade.exitReason = exitReason;
        trade.pnlPips = pnlPips;
        trade.pnlAmount = pnlAmount;
        this.activeTrades.delete(tradeId);
        const result = pnlPips > 0 ? '✅ WIN' : '❌ LOSS';
        logger_1.logger.info(`${result} Trade closed: ${trade.signal.type} ${exitReason} at ${exitPrice}, P&L: ${pnlPips.toFixed(1)} pips / ${pnlAmount.toFixed(0)} JPY`);
    }
    calculateRSI(candles, period) {
        if (candles.length < period + 1) {
            return 50;
        }
        let gains = 0;
        let losses = 0;
        for (let i = 1; i < Math.min(period + 1, candles.length); i++) {
            const change = candles[i].close - candles[i - 1].close;
            if (change > 0) {
                gains += change;
            }
            else {
                losses += Math.abs(change);
            }
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / (avgLoss || 0.0001);
        const rsi = 100 - (100 / (1 + rs));
        return Math.max(0, Math.min(100, rsi));
    }
    getCurrentSession() {
        const now = new Date();
        const jst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const hour = jst.getHours();
        if (hour >= 9 && hour < 15)
            return 'Tokyo';
        if (hour >= 16 && hour < 24)
            return 'London';
        if (hour >= 22 || hour < 2)
            return 'NY';
        return 'Tokyo';
    }
    isValidTradingTime(date) {
        const dayOfWeek = date.getUTCDay();
        const jst = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        const hour = jst.getHours();
        if (dayOfWeek < 2 || dayOfWeek > 5) {
            return false;
        }
        return (hour >= 16 && hour < 18) ||
            (hour >= 21 && hour < 23);
    }
    async passesRiskChecks() {
        return true;
    }
    getActiveTradesCount() {
        return this.activeTrades.size;
    }
    getActiveTrades() {
        return Array.from(this.activeTrades.values());
    }
}
exports.AutoTradingService = AutoTradingService;
//# sourceMappingURL=autoTradingService.js.map
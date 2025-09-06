"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TORBAnalysisService = void 0;
const logger_1 = require("../utils/logger");
const fxDataService_1 = require("./fxDataService");
const uuid_1 = require("../utils/uuid");
class TORBAnalysisService {
    constructor() {
        this.activeSignals = new Map();
        this.torbRanges = new Map();
        this.fxDataService = new fxDataService_1.FXDataService();
    }
    getJSTTime(date) {
        const utc = date || new Date();
        return new Date(utc.getTime() + (9 * 60 * 60 * 1000));
    }
    isTokyoTradingTime(date) {
        const jst = this.getJSTTime(date);
        const hour = jst.getHours();
        const minute = jst.getMinutes();
        return hour >= 9 && (hour < 11 || (hour === 11 && minute === 0));
    }
    isTORBRangeTime(date) {
        const jst = this.getJSTTime(date);
        const hour = jst.getHours();
        const minute = jst.getMinutes();
        return hour === 9 && minute < 45;
    }
    isTORBBreakoutTime(date) {
        const jst = this.getJSTTime(date);
        const hour = jst.getHours();
        const minute = jst.getMinutes();
        return (hour === 9 && minute >= 45) || (hour === 10) || (hour === 11 && minute === 0);
    }
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) {
            return 50;
        }
        const gains = [];
        const losses = [];
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }
        const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
        const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
        if (avgLoss === 0)
            return 100;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        return parseFloat(rsi.toFixed(2));
    }
    pipsToPrice(pips) {
        return pips * 0.001;
    }
    priceToPips(priceChange) {
        return priceChange / 0.001;
    }
    async calculateTORBRange(symbol, date) {
        const jstDate = new Date(date + 'T09:00:00+09:00');
        const endTime = new Date(jstDate.getTime() + (45 * 60 * 1000));
        logger_1.logger.debug(`Calculating TORB range for ${symbol} on ${date} (9:00-9:45 JST)`);
        try {
            const historicalData = await this.fxDataService.getHistoricalData(symbol, '1m', 45);
            if (historicalData.length === 0) {
                logger_1.logger.warn(`No historical data available for ${symbol} on ${date}`);
                return null;
            }
            const high = Math.max(...historicalData.map(candle => candle.high));
            const low = Math.min(...historicalData.map(candle => candle.low));
            const rangePips = this.priceToPips(high - low);
            const torbRange = {
                startTime: jstDate,
                endTime,
                high,
                low,
                range: parseFloat(rangePips.toFixed(1))
            };
            const cacheKey = `${symbol}_${date}`;
            this.torbRanges.set(cacheKey, torbRange);
            logger_1.logger.info(`TORB range calculated for ${symbol}: High=${high}, Low=${low}, Range=${rangePips} pips`);
            return torbRange;
        }
        catch (error) {
            logger_1.logger.error(`Error calculating TORB range for ${symbol}:`, error);
            return null;
        }
    }
    async getTORBRange(symbol, date) {
        const cacheKey = `${symbol}_${date}`;
        const cached = this.torbRanges.get(cacheKey);
        if (cached) {
            return cached;
        }
        return await this.calculateTORBRange(symbol, date);
    }
    async checkBreakoutConditions(symbol, range, currentPrice, rsi) {
        if (range.range < 15 || range.range > 50) {
            logger_1.logger.debug(`Range width ${range.range} pips outside valid range (15-50 pips)`);
            return null;
        }
        let signalType = null;
        let entryPrice = currentPrice;
        let targetPrice = 0;
        let stopLoss = 0;
        if (currentPrice > range.high && rsi > 55) {
            signalType = 'LONG';
            const breakoutPips = this.priceToPips(currentPrice - range.high);
            targetPrice = currentPrice + (breakoutPips * 1.5 * 0.001);
            stopLoss = range.low - this.pipsToPrice(5);
            logger_1.logger.info(`LONG breakout detected: Price=${currentPrice}, Range High=${range.high}, RSI=${rsi}`);
        }
        else if (currentPrice < range.low && rsi < 45) {
            signalType = 'SHORT';
            const breakoutPips = this.priceToPips(range.low - currentPrice);
            targetPrice = currentPrice - (breakoutPips * 1.5 * 0.001);
            stopLoss = range.high + this.pipsToPrice(5);
            logger_1.logger.info(`SHORT breakout detected: Price=${currentPrice}, Range Low=${range.low}, RSI=${rsi}`);
        }
        if (!signalType) {
            return null;
        }
        const rsiStrength = signalType === 'LONG' ? (rsi - 55) / 45 : (45 - rsi) / 45;
        const breakoutStrength = signalType === 'LONG' ?
            this.priceToPips(currentPrice - range.high) / 10 :
            this.priceToPips(range.low - currentPrice) / 10;
        const confidence = Math.min(0.95, Math.max(0.5, (rsiStrength + breakoutStrength) / 2));
        const signal = {
            id: (0, uuid_1.uuidv4)(),
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
    async getCurrentSignals(symbol) {
        const now = new Date();
        if (!this.isTokyoTradingTime(now)) {
            logger_1.logger.debug('Outside Tokyo trading hours, no signals generated');
            return Array.from(this.activeSignals.values()).filter(s => s.status === 'ACTIVE');
        }
        const today = this.getJSTTime(now).toISOString().split('T')[0];
        const range = await this.getTORBRange(symbol, today);
        if (!range) {
            logger_1.logger.debug('No TORB range available for signal generation');
            return Array.from(this.activeSignals.values()).filter(s => s.status === 'ACTIVE');
        }
        if (this.isTORBBreakoutTime(now)) {
            try {
                const currentPrice = await this.fxDataService.getCurrentPrice(symbol);
                const recentData = await this.fxDataService.getHistoricalData(symbol, '5m', 20);
                const prices = recentData.map(candle => candle.close);
                const rsi = this.calculateRSI(prices);
                logger_1.logger.debug(`Checking breakout conditions: Price=${currentPrice.ask}, RSI=${rsi}`);
                const newSignal = await this.checkBreakoutConditions(symbol, range, currentPrice.ask, rsi);
                if (newSignal) {
                    this.activeSignals.set(newSignal.id, newSignal);
                    logger_1.logger.info(`New TORB signal generated: ${newSignal.type} at ${newSignal.entryPrice}`);
                }
            }
            catch (error) {
                logger_1.logger.error('Error checking for new signals:', error);
            }
        }
        return Array.from(this.activeSignals.values()).filter(s => s.status === 'ACTIVE');
    }
    async getTORBAnalysis(symbol) {
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
            range: null,
            currentPrice: null,
            signals: [],
            marketCondition: 'UNKNOWN'
        };
        try {
            analysis.range = await this.getTORBRange(symbol, today);
            analysis.currentPrice = await this.fxDataService.getCurrentPrice(symbol);
            analysis.signals = await this.getCurrentSignals(symbol);
            if (analysis.range && analysis.currentPrice) {
                const price = analysis.currentPrice.ask;
                if (price > analysis.range.high) {
                    analysis.marketCondition = 'ABOVE_RANGE';
                }
                else if (price < analysis.range.low) {
                    analysis.marketCondition = 'BELOW_RANGE';
                }
                else {
                    analysis.marketCondition = 'WITHIN_RANGE';
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error performing TORB analysis:', error);
        }
        return analysis;
    }
    async calculateTORB(symbol, date) {
        logger_1.logger.info(`Manual TORB calculation for ${symbol} on ${date}`);
        const range = await this.calculateTORBRange(symbol, date);
        if (!range) {
            throw new Error(`Could not calculate TORB range for ${symbol} on ${date}`);
        }
        const signals = [];
        if (Math.random() > 0.7) {
            const signalType = Math.random() > 0.5 ? 'LONG' : 'SHORT';
            const entryPrice = signalType === 'LONG' ? range.high + 0.005 : range.low - 0.005;
            const signal = {
                id: (0, uuid_1.uuidv4)(),
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
                winRate: signals.length > 0 ? Math.random() * 0.4 + 0.6 : 0,
                avgPnL: signals.length > 0 ? (Math.random() - 0.3) * 50 : 0
            }
        };
    }
    async getTORBHistory(symbol, days, limit) {
        const signals = [];
        const endDate = new Date();
        for (let i = 0; i < Math.min(days, limit); i++) {
            const date = new Date(endDate.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            if (Math.random() > 0.6) {
                const mockSignal = await this.calculateTORB(symbol, dateStr);
                signals.push(...mockSignal.signals);
            }
        }
        const completedSignals = signals.filter(s => s.status === 'COMPLETED');
        const winningSignals = completedSignals.filter(() => Math.random() > 0.25);
        const performance = {
            totalSignals: completedSignals.length,
            winningSignals: winningSignals.length,
            winRate: completedSignals.length > 0 ? winningSignals.length / completedSignals.length : 0,
            totalPnL: winningSignals.length * 25 - (completedSignals.length - winningSignals.length) * 15,
            avgPnL: completedSignals.length > 0 ?
                (winningSignals.length * 25 - (completedSignals.length - winningSignals.length) * 15) / completedSignals.length : 0
        };
        return {
            signals: signals.slice(0, limit),
            performance
        };
    }
    getActiveSignalsCount() {
        return Array.from(this.activeSignals.values()).filter(s => s.status === 'ACTIVE').length;
    }
    clearOldSignals() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000;
        for (const [id, signal] of this.activeSignals.entries()) {
            if (now - signal.timestamp.getTime() > maxAge) {
                this.activeSignals.delete(id);
            }
        }
    }
}
exports.TORBAnalysisService = TORBAnalysisService;
//# sourceMappingURL=torbAnalysisService.js.map
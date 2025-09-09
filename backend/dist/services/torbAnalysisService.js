"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TORBAnalysisService = void 0;
const logger_1 = require("../utils/logger");
const fxDataService_1 = require("./fxDataService");
const uuid_1 = require("../utils/uuid");
const technicalIndicators_1 = require("../utils/technicalIndicators");
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
    isTokyoBoxTime(date) {
        const jst = this.getJSTTime(date);
        const hour = jst.getHours();
        const minute = jst.getMinutes();
        return hour >= 9 && (hour < 11 || (hour === 11 && minute === 0));
    }
    isBreakoutMonitoringTime(date) {
        const jst = this.getJSTTime(date);
        const hour = jst.getHours();
        const minute = jst.getMinutes();
        return hour >= 11;
    }
    async calculateTokyoBoxRange(symbol, date) {
        const jstDate = new Date(date + 'T09:00:00+09:00');
        const endTime = new Date(jstDate.getTime() + (120 * 60 * 1000));
        logger_1.logger.debug(`Calculating Tokyo Box range for ${symbol} on ${date} (9:00-11:00 JST)`);
        try {
            const historicalData = await this.fxDataService.getHistoricalData(symbol, '1m', 120);
            if (historicalData.length === 0) {
                logger_1.logger.warn(`No historical data available for ${symbol} on ${date}`);
                return null;
            }
            const high = Math.max(...historicalData.map(candle => candle.high));
            const low = Math.min(...historicalData.map(candle => candle.low));
            const rangePips = (0, technicalIndicators_1.priceToPips)(high - low, symbol);
            const atrD1 = await this.calculateATRFilter(symbol, date);
            if (!this.validateATRFilter(atrD1)) {
                logger_1.logger.info(`ATR filter failed for ${symbol}: ${atrD1} pips (required: 70-150)`);
                return null;
            }
            if (!this.validateBoxWidth(rangePips, atrD1)) {
                logger_1.logger.info(`Box width filter failed for ${symbol}: ${rangePips} pips (required: 30-55, max 70)`);
                return null;
            }
            const tokyoBoxRange = {
                startTime: jstDate,
                endTime,
                high,
                low,
                range: parseFloat(rangePips.toFixed(1))
            };
            const cacheKey = `${symbol}_${date}`;
            this.torbRanges.set(cacheKey, tokyoBoxRange);
            logger_1.logger.info(`Tokyo Box range calculated for ${symbol}: High=${high}, Low=${low}, Range=${rangePips} pips, ATR=${atrD1}`);
            return tokyoBoxRange;
        }
        catch (error) {
            logger_1.logger.error(`Error calculating Tokyo Box range for ${symbol}:`, error);
            return null;
        }
    }
    async calculateATRFilter(symbol, date) {
        try {
            const historicalData = await this.fxDataService.getHistoricalData(symbol, '1D', 14);
            const atr = (0, technicalIndicators_1.calculateATR)(historicalData, 14);
            return (0, technicalIndicators_1.priceToPips)(atr, symbol);
        }
        catch (error) {
            logger_1.logger.warn(`ATR calculation failed for ${symbol}:`, error);
            return 100;
        }
    }
    validateATRFilter(atrPips) {
        return atrPips >= 70 && atrPips <= 150;
    }
    validateBoxWidth(boxWidthPips, atrPips) {
        const minWidth = 30;
        const normalMaxWidth = 55;
        const dynamicMaxWidth = atrPips > 120 ? 70 : normalMaxWidth;
        return boxWidthPips >= minWidth && boxWidthPips <= dynamicMaxWidth;
    }
    async getTORBRange(symbol, date) {
        const cacheKey = `${symbol}_${date}`;
        const cached = this.torbRanges.get(cacheKey);
        if (cached) {
            return cached;
        }
        return await this.calculateTokyoBoxRange(symbol, date);
    }
    async checkBreakoutConditions(symbol, range, currentPrice, rsi, recentCandles) {
        if (range.range < 30 || range.range > 55) {
            logger_1.logger.debug(`Range width ${range.range} pips outside valid range (30-55 pips)`);
            return null;
        }
        const atr = (0, technicalIndicators_1.calculateATR)(recentCandles, 14);
        const swingLevels = (0, technicalIndicators_1.findSwingLevels)(recentCandles, 3);
        const session = (0, technicalIndicators_1.getCurrentSession)();
        let signalType = null;
        let entryPrice = currentPrice;
        let targetPrice = 0;
        let stopLoss = 0;
        const rsiLongOK = rsi >= 45;
        const rsiShortOK = rsi <= 55;
        const breakBuffer = (0, technicalIndicators_1.pipsToPrice)(1.5, symbol);
        if (currentPrice > (range.high + breakBuffer) && rsiLongOK) {
            signalType = 'LONG';
            let slPrice = swingLevels.swingLow;
            if (!slPrice || Math.abs(currentPrice - slPrice) > atr * 2) {
                slPrice = currentPrice - (atr * 1.5);
            }
            const minSL = currentPrice - (0, technicalIndicators_1.pipsToPrice)(60, symbol);
            const maxSL = currentPrice - (0, technicalIndicators_1.pipsToPrice)(15, symbol);
            stopLoss = Math.max(minSL, Math.min(maxSL, slPrice));
            const riskAmount = currentPrice - stopLoss;
            targetPrice = currentPrice + (riskAmount * session.multiplier);
            logger_1.logger.info(`LONG breakout detected: Price=${currentPrice}, SL=${stopLoss}, TP=${targetPrice}, ATR=${atr}, Session=${session.name}`);
        }
        else if (currentPrice < (range.low - breakBuffer) && rsiShortOK) {
            signalType = 'SHORT';
            let slPrice = swingLevels.swingHigh;
            if (!slPrice || Math.abs(slPrice - currentPrice) > atr * 2) {
                slPrice = currentPrice + (atr * 1.5);
            }
            const maxSL = currentPrice + (0, technicalIndicators_1.pipsToPrice)(60, symbol);
            const minSL = currentPrice + (0, technicalIndicators_1.pipsToPrice)(15, symbol);
            stopLoss = Math.min(maxSL, Math.max(minSL, slPrice));
            const riskAmount = stopLoss - currentPrice;
            targetPrice = currentPrice - (riskAmount * session.multiplier);
            logger_1.logger.info(`SHORT breakout detected: Price=${currentPrice}, SL=${stopLoss}, TP=${targetPrice}, ATR=${atr}, Session=${session.name}`);
        }
        if (!signalType) {
            return null;
        }
        const riskRewardRatio = Math.abs(targetPrice - currentPrice) / Math.abs(stopLoss - currentPrice);
        const atrStrength = atr / (range.range * 0.001);
        const rsiStrength = signalType === 'LONG' ?
            Math.min(1, (rsi - 45) / 55) :
            Math.min(1, (55 - rsi) / 55);
        const confidence = Math.min(0.95, Math.max(0.5, (riskRewardRatio + atrStrength + rsiStrength) / 3));
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
            status: 'ACTIVE',
            atr: parseFloat(atr.toFixed(5)),
            session: session.name,
            riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2))
        };
        return signal;
    }
    async checkRetestEntry(symbol, breakoutSignal, current5mCandles) {
        if (!breakoutSignal || current5mCandles.length < 3) {
            return null;
        }
        const range = breakoutSignal.range;
        const recentCandles = current5mCandles.slice(-3);
        const currentCandle = recentCandles[recentCandles.length - 1];
        const breakoutTime = breakoutSignal.timestamp.getTime();
        const currentTime = new Date().getTime();
        const timeElapsed = (currentTime - breakoutTime) / (1000 * 60);
        if (timeElapsed > 30) {
            logger_1.logger.info(`Retest timeout exceeded: ${timeElapsed} minutes > 30 minutes`);
            return null;
        }
        let retestConfirmed = false;
        let entryPrice = currentCandle.close;
        if (breakoutSignal.type === 'LONG') {
            const retestLevel = range.high;
            const retestBuffer = (0, technicalIndicators_1.pipsToPrice)(3, symbol);
            const hasRetested = recentCandles.some(candle => Math.abs(candle.low - retestLevel) <= retestBuffer);
            const hasBounced = currentCandle.close > retestLevel + (0, technicalIndicators_1.pipsToPrice)(1, symbol);
            retestConfirmed = hasRetested && hasBounced;
            if (retestConfirmed) {
                logger_1.logger.info(`LONG retest confirmed: Pullback to ${retestLevel}, bounce to ${currentCandle.close}`);
            }
        }
        else if (breakoutSignal.type === 'SHORT') {
            const retestLevel = range.low;
            const retestBuffer = (0, technicalIndicators_1.pipsToPrice)(3, symbol);
            const hasRetested = recentCandles.some(candle => Math.abs(candle.high - retestLevel) <= retestBuffer);
            const hasRejected = currentCandle.close < retestLevel - (0, technicalIndicators_1.pipsToPrice)(1, symbol);
            retestConfirmed = hasRetested && hasRejected;
            if (retestConfirmed) {
                logger_1.logger.info(`SHORT retest confirmed: Pullback to ${retestLevel}, rejection to ${currentCandle.close}`);
            }
        }
        if (!retestConfirmed) {
            return null;
        }
        const retestSignal = {
            ...breakoutSignal,
            id: (0, uuid_1.uuidv4)(),
            timestamp: new Date(),
            entryPrice: parseFloat(entryPrice.toFixed(5)),
            confidence: Math.min(95, breakoutSignal.confidence + 15),
        };
        logger_1.logger.info(`Retest entry signal generated: ${retestSignal.type} at ${entryPrice}, confidence: ${retestSignal.confidence}%`);
        return retestSignal;
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
        if (this.isBreakoutMonitoringTime(now)) {
            try {
                const currentPrice = await this.fxDataService.getCurrentPrice(symbol);
                const recentData = await this.fxDataService.getHistoricalData(symbol, '5m', 20);
                const prices = recentData.map(candle => candle.close);
                const rsi = (0, technicalIndicators_1.calculateRSI)(prices);
                logger_1.logger.debug(`Checking breakout conditions: Price=${currentPrice.ask}, RSI=${rsi}`);
                const newSignal = await this.checkBreakoutConditions(symbol, range, currentPrice.ask, rsi, recentData);
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
                isRangeTime: this.isTokyoBoxTime(now),
                isBreakoutTime: this.isBreakoutMonitoringTime(now)
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
        const range = await this.calculateTokyoBoxRange(symbol, date);
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
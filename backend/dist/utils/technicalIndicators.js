"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateATR = calculateATR;
exports.calculateRSI = calculateRSI;
exports.findSwingLevels = findSwingLevels;
exports.getCurrentSession = getCurrentSession;
exports.calculateMACDHistogram = calculateMACDHistogram;
exports.priceToPips = priceToPips;
exports.pipsToPrice = pipsToPrice;
function calculateATR(candles, period = 14) {
    if (candles.length < period + 1) {
        return 0;
    }
    const trueRanges = [];
    for (let i = 1; i < candles.length; i++) {
        const current = candles[i];
        const previous = candles[i - 1];
        const tr1 = current.high - current.low;
        const tr2 = Math.abs(current.high - previous.close);
        const tr3 = Math.abs(current.low - previous.close);
        const trueRange = Math.max(tr1, tr2, tr3);
        trueRanges.push(trueRange);
    }
    const recentTR = trueRanges.slice(-period);
    const atr = recentTR.reduce((sum, tr) => sum + tr, 0) / period;
    return parseFloat(atr.toFixed(5));
}
function calculateRSI(prices, period = 14) {
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
function findSwingLevels(candles, lookback = 5) {
    if (candles.length < lookback * 2 + 1) {
        return { swingHigh: null, swingLow: null };
    }
    let swingHigh = null;
    let swingLow = null;
    for (let i = candles.length - lookback - 1; i >= lookback; i--) {
        const current = candles[i];
        let isSwingHigh = true;
        for (let j = 1; j <= lookback; j++) {
            if (current.high <= candles[i - j].high || current.high <= candles[i + j].high) {
                isSwingHigh = false;
                break;
            }
        }
        if (isSwingHigh && swingHigh === null) {
            swingHigh = current.high;
        }
        let isSwingLow = true;
        for (let j = 1; j <= lookback; j++) {
            if (current.low >= candles[i - j].low || current.low >= candles[i + j].low) {
                isSwingLow = false;
                break;
            }
        }
        if (isSwingLow && swingLow === null) {
            swingLow = current.low;
        }
        if (swingHigh !== null && swingLow !== null) {
            break;
        }
    }
    return { swingHigh, swingLow };
}
function getCurrentSession(date = new Date()) {
    const jst = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    const hour = jst.getHours();
    if (hour >= 9 && hour < 15) {
        return { name: 'tokyo', multiplier: 1.5 };
    }
    if (hour >= 16 && hour < 24) {
        return { name: 'london', multiplier: 2.5 };
    }
    if (hour >= 22 || hour < 2) {
        return { name: 'ny_early', multiplier: 2.0 };
    }
    return { name: 'off', multiplier: 1.5 };
}
function calculateMACDHistogram(prices, fastPeriod = 12, slowPeriod = 26) {
    if (prices.length < slowPeriod) {
        return 0;
    }
    const calculateEMA = (data, period) => {
        const multiplier = 2 / (period + 1);
        let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
        for (let i = period; i < data.length; i++) {
            ema = (data[i] * multiplier) + (ema * (1 - multiplier));
        }
        return ema;
    };
    const fastEMA = calculateEMA(prices, fastPeriod);
    const slowEMA = calculateEMA(prices, slowPeriod);
    return fastEMA - slowEMA;
}
function priceToPips(priceChange, symbol = 'USD/JPY') {
    const pipValue = symbol === 'USD/JPY' ? 0.001 : 0.0001;
    return priceChange / pipValue;
}
function pipsToPrice(pips, symbol = 'USD/JPY') {
    const pipValue = symbol === 'USD/JPY' ? 0.001 : 0.0001;
    return pips * pipValue;
}
//# sourceMappingURL=technicalIndicators.js.map
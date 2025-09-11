"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FXDataService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
class FXDataService {
    constructor() {
        this.lastGMORequest = 0;
        this.lastAlphaVantageRequest = 0;
        this.cache = new Map();
        this.CACHE_DURATION = 1000;
        this.gmoBaseURL = process.env.GMO_API_BASE_URL || 'https://forex-api.coin.z.com/public/v1';
        this.alphaVantageBaseURL = process.env.ALPHAVANTAGE_BASE_URL || 'https://www.alphavantage.co/query';
        this.alphaVantageApiKey = process.env.ALPHAVANTAGE_API_KEY || 'demo';
    }
    isRateLimited(lastRequest, limitPerSecond) {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequest;
        const minInterval = 1000 / limitPerSecond;
        return timeSinceLastRequest < minInterval;
    }
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }
    setCacheData(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
    async fetchFromGMO(endpoint) {
        const cacheKey = `gmo_${endpoint}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            logger_1.logger.debug('Returning cached GMO data');
            return cached;
        }
        if (this.isRateLimited(this.lastGMORequest, 1)) {
            const waitTime = 1000 - (Date.now() - this.lastGMORequest);
            logger_1.logger.debug(`GMO API rate limited, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        try {
            const url = `${this.gmoBaseURL}${endpoint}`;
            logger_1.logger.debug(`Fetching from GMO API: ${url}`);
            const response = await axios_1.default.get(url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'FX-Sign-Tool/1.0.0'
                }
            });
            this.lastGMORequest = Date.now();
            if (response.data.status !== 0) {
                throw new types_1.APIError(`GMO API error: status ${response.data.status}`, 'GMO_API_ERROR', response.status || 500, 'gmo');
            }
            this.setCacheData(cacheKey, response.data);
            logger_1.logger.debug('GMO API response received and cached');
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('GMO API request failed:', error.message);
            if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                throw new types_1.APIError('GMO API connection failed', 'GMO_CONNECTION_ERROR', 503, 'gmo');
            }
            throw new types_1.APIError(`GMO API request failed: ${error.message}`, 'GMO_REQUEST_ERROR', error.response?.status || 500, 'gmo');
        }
    }
    async fetchFromAlphaVantage(params) {
        const cacheKey = `alphavantage_${JSON.stringify(params)}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            logger_1.logger.debug('Returning cached Alpha Vantage data');
            return cached;
        }
        if (this.isRateLimited(this.lastAlphaVantageRequest, 5 / 60)) {
            const waitTime = 12000 - (Date.now() - this.lastAlphaVantageRequest);
            logger_1.logger.debug(`Alpha Vantage API rate limited, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        try {
            const queryParams = new URLSearchParams({
                ...params,
                apikey: this.alphaVantageApiKey
            });
            const url = `${this.alphaVantageBaseURL}?${queryParams}`;
            logger_1.logger.debug(`Fetching from Alpha Vantage API: ${url}`);
            const response = await axios_1.default.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'FX-Sign-Tool/1.0.0'
                }
            });
            this.lastAlphaVantageRequest = Date.now();
            if (!response.data || response.data['Error Message']) {
                throw new types_1.APIError(`Alpha Vantage API error: ${response.data['Error Message'] || 'Unknown error'}`, 'ALPHAVANTAGE_API_ERROR', response.status || 500, 'alphavantage');
            }
            this.setCacheData(cacheKey, response.data);
            logger_1.logger.debug('Alpha Vantage API response received and cached');
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Alpha Vantage API request failed:', error.message);
            if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                throw new types_1.APIError('Alpha Vantage API connection failed', 'ALPHAVANTAGE_CONNECTION_ERROR', 503, 'alphavantage');
            }
            throw new types_1.APIError(`Alpha Vantage API request failed: ${error.message}`, 'ALPHAVANTAGE_REQUEST_ERROR', error.response?.status || 500, 'alphavantage');
        }
    }
    async getCurrentPrice(symbol = 'USD/JPY') {
        logger_1.logger.debug(`Fetching current price for ${symbol}`);
        const gmoData = await this.fetchFromGMO('/ticker');
        const usdJpyData = gmoData.data.find((item) => item.symbol === 'USD_JPY');
        if (!usdJpyData) {
            throw new types_1.APIError('USD/JPY data not found in GMO API response', 'GMO_DATA_NOT_FOUND', 404, 'gmo');
        }
        const priceData = {
            symbol: 'USD/JPY',
            bid: parseFloat(usdJpyData.bid),
            ask: parseFloat(usdJpyData.ask),
            spread: parseFloat(usdJpyData.ask) - parseFloat(usdJpyData.bid),
            timestamp: new Date(usdJpyData.timestamp),
            source: 'gmo'
        };
        logger_1.logger.info(`Current price from GMO: ${symbol} - Bid: ${priceData.bid}, Ask: ${priceData.ask}`);
        return priceData;
    }
    async getHistoricalData(symbol, timeframe, limit) {
        logger_1.logger.debug(`Fetching historical data for ${symbol}, timeframe: ${timeframe}, limit: ${limit}`);
        try {
            const interval = timeframe === '5m' ? '5min' : '15min';
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const gmoSymbol = symbol.replace('/', '_');
            const url = `${this.gmoBaseURL}/klines?symbol=${gmoSymbol}&priceType=BID&interval=${interval}&date=${today}`;
            logger_1.logger.debug(`Fetching KLine data from GMO: ${url}`);
            const response = await axios_1.default.get(url);
            if (response.data && response.data.status === 0 && response.data.data) {
                const klineData = response.data.data;
                const limitedData = klineData.slice(-limit);
                const data = limitedData.map((candle) => ({
                    timestamp: new Date(parseInt(candle.openTime)),
                    open: parseFloat(candle.open),
                    high: parseFloat(candle.high),
                    low: parseFloat(candle.low),
                    close: parseFloat(candle.close),
                    volume: 0
                }));
                logger_1.logger.info(`Retrieved ${data.length} historical candles from GMO API`);
                return data;
            }
        }
        catch (error) {
            logger_1.logger.error('Error fetching historical data from GMO API:', error);
        }
        logger_1.logger.warn('Using fallback data due to API error');
        const currentPriceData = await this.getCurrentPrice(symbol);
        const currentPrice = (currentPriceData.bid + currentPriceData.ask) / 2;
        let price = currentPrice;
        const data = [];
        const now = new Date();
        const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 : 15 * 60 * 1000;
        for (let i = limit - 1; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - (i * intervalMs));
            if (i === 0) {
                data.push({
                    timestamp,
                    open: price,
                    high: currentPriceData.ask,
                    low: currentPriceData.bid,
                    close: currentPrice,
                    volume: 0
                });
            }
            else {
                const priceChange = Math.sin(i * 0.1) * 0.2;
                const open = price;
                const close = price + priceChange;
                const highVariation = Math.abs(Math.cos(i * 0.05)) * 0.1;
                const lowVariation = Math.abs(Math.sin(i * 0.07)) * 0.1;
                const high = Math.max(open, close) + highVariation;
                const low = Math.min(open, close) - lowVariation;
                data.push({
                    timestamp,
                    open: parseFloat(open.toFixed(3)),
                    high: parseFloat(high.toFixed(3)),
                    low: parseFloat(low.toFixed(3)),
                    close: parseFloat(close.toFixed(3)),
                    volume: 0
                });
                price = close;
            }
        }
        logger_1.logger.info(`Generated ${data.length} historical candles based on GMO current price for ${symbol}`);
        return data;
    }
    async getAPIStatus() {
        const status = {
            gmo: { available: false, latency: null, lastCheck: new Date() },
            alphavantage: { available: false, latency: null, lastCheck: new Date() },
            fallback: { active: false, reason: null }
        };
        try {
            const start = Date.now();
            await this.fetchFromGMO('/ticker');
            status.gmo.available = true;
            status.gmo.latency = Date.now() - start;
            logger_1.logger.debug(`GMO API status: Available, latency: ${status.gmo.latency}ms`);
        }
        catch (error) {
            logger_1.logger.debug('GMO API status: Unavailable');
            status.fallback.active = true;
            status.fallback.reason = 'GMO API unavailable';
        }
        try {
            const start = Date.now();
            await this.fetchFromAlphaVantage({
                function: 'CURRENCY_EXCHANGE_RATE',
                from_currency: 'USD',
                to_currency: 'JPY'
            });
            status.alphavantage.available = true;
            status.alphavantage.latency = Date.now() - start;
            logger_1.logger.debug(`Alpha Vantage API status: Available, latency: ${status.alphavantage.latency}ms`);
        }
        catch (error) {
            logger_1.logger.debug('Alpha Vantage API status: Unavailable');
        }
        return status;
    }
}
exports.FXDataService = FXDataService;
//# sourceMappingURL=fxDataService.js.map
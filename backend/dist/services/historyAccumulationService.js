"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryAccumulationService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const fxDataService_1 = require("./fxDataService");
const HistoricalData_1 = require("../models/HistoricalData");
const websocketService_1 = require("./websocketService");
const logger_1 = require("../utils/logger");
class HistoryAccumulationService {
    constructor(pool) {
        this.pool = pool;
        this.priceCollectionJob = null;
        this.candleCollectionJob = null;
        this.cleanupJob = null;
        this.isCollectingPrices = false;
        this.isCollectingCandles = false;
        this.fxDataService = new fxDataService_1.FXDataService();
        this.historicalDataModel = new HistoricalData_1.HistoricalDataModel(pool);
    }
    start() {
        logger_1.logger.info('🚀 [History Service] Starting data accumulation service...');
        this.priceCollectionJob = node_cron_1.default.schedule('*/30 * * * * *', async () => {
            if (!this.isCollectingPrices) {
                await this.collectCurrentPrices();
            }
        }, {
            scheduled: true,
            timezone: 'Asia/Tokyo'
        });
        this.candleCollectionJob = node_cron_1.default.schedule('*/5 * * * *', async () => {
            if (!this.isCollectingCandles) {
                await this.collectCandleData();
            }
        }, {
            scheduled: true,
            timezone: 'Asia/Tokyo'
        });
        this.cleanupJob = node_cron_1.default.schedule('0 2 * * *', async () => {
            await this.performCleanup();
        }, {
            scheduled: true,
            timezone: 'Asia/Tokyo'
        });
        logger_1.logger.info('✅ [History Service] All scheduled jobs started');
    }
    stop() {
        logger_1.logger.info('⏹️ [History Service] Stopping data accumulation service...');
        if (this.priceCollectionJob) {
            this.priceCollectionJob.stop();
            this.priceCollectionJob = null;
        }
        if (this.candleCollectionJob) {
            this.candleCollectionJob.stop();
            this.candleCollectionJob = null;
        }
        if (this.cleanupJob) {
            this.cleanupJob.stop();
            this.cleanupJob = null;
        }
        logger_1.logger.info('✅ [History Service] All scheduled jobs stopped');
    }
    async collectCurrentPrices() {
        this.isCollectingPrices = true;
        const startTime = Date.now();
        try {
            const symbols = ['USD/JPY', 'EUR/USD', 'GBP/USD', 'AUD/USD'];
            const promises = symbols.map(async (symbol) => {
                try {
                    const startRequest = Date.now();
                    const priceData = await this.fxDataService.getCurrentPrice(symbol);
                    const responseTime = Date.now() - startRequest;
                    const record = {
                        symbol: symbol.replace('/', ''),
                        bid: priceData.bid,
                        ask: priceData.ask,
                        spread: priceData.spread,
                        timestamp: priceData.timestamp,
                        source: priceData.source
                    };
                    await this.historicalDataModel.savePriceHistory(record);
                    try {
                        const wsService = (0, websocketService_1.getWebSocketService)();
                        wsService.broadcastPriceUpdate({
                            symbol: priceData.symbol,
                            bid: priceData.bid,
                            ask: priceData.ask,
                            spread: priceData.spread,
                            timestamp: priceData.timestamp,
                            source: priceData.source
                        });
                        logger_1.logger.debug(`📡 [History Service] Price broadcasted via WebSocket: ${symbol}`);
                    }
                    catch (wsError) {
                        logger_1.logger.warn(`⚠️ [History Service] WebSocket broadcast failed for ${symbol}:`, wsError);
                    }
                    await this.historicalDataModel.updateAPIStats({
                        endpoint: 'fx/ticker',
                        totalCalls: 1,
                        successfulCalls: 1,
                        failedCalls: 0,
                        avgResponseTimeMs: responseTime,
                        cacheHits: responseTime < 50 ? 1 : 0,
                        cacheMisses: responseTime >= 50 ? 1 : 0,
                        dataPointsCollected: 1
                    });
                    return { symbol, success: true, responseTime };
                }
                catch (error) {
                    logger_1.logger.error(`❌ [History Service] Failed to collect price for ${symbol}:`, error);
                    await this.historicalDataModel.updateAPIStats({
                        endpoint: 'fx/ticker',
                        totalCalls: 1,
                        successfulCalls: 0,
                        failedCalls: 1,
                        avgResponseTimeMs: 0,
                        cacheHits: 0,
                        cacheMisses: 1,
                        dataPointsCollected: 0
                    });
                    return { symbol, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
                }
            });
            const results = await Promise.all(promises);
            const successful = results.filter(r => r.success).length;
            const totalTime = Date.now() - startTime;
            logger_1.logger.info(`💰 [History Service] Price collection completed: ${successful}/${symbols.length} symbols in ${totalTime}ms`);
        }
        catch (error) {
            logger_1.logger.error('❌ [History Service] Price collection failed:', error);
        }
        finally {
            this.isCollectingPrices = false;
        }
    }
    async collectCandleData() {
        this.isCollectingCandles = true;
        const startTime = Date.now();
        try {
            const symbols = ['USD/JPY', 'EUR/USD'];
            const timeframes = ['5m', '15m'];
            for (const symbol of symbols) {
                for (const timeframe of timeframes) {
                    try {
                        const startRequest = Date.now();
                        const candleData = await this.fxDataService.getHistoricalData(symbol, timeframe, 1);
                        const responseTime = Date.now() - startRequest;
                        if (candleData.length > 0) {
                            const candle = candleData[0];
                            const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 : 15 * 60 * 1000;
                            const record = {
                                symbol: symbol.replace('/', ''),
                                timeframe,
                                openPrice: candle.open,
                                highPrice: candle.high,
                                lowPrice: candle.low,
                                closePrice: candle.close,
                                volume: candle.volume || 0,
                                candleStart: candle.timestamp,
                                candleEnd: new Date(candle.timestamp.getTime() + intervalMs),
                                source: 'gmo'
                            };
                            await this.historicalDataModel.saveCandleData(record);
                            await this.historicalDataModel.updateAPIStats({
                                endpoint: 'fx/historical',
                                totalCalls: 1,
                                successfulCalls: 1,
                                failedCalls: 0,
                                avgResponseTimeMs: responseTime,
                                cacheHits: 0,
                                cacheMisses: 1,
                                dataPointsCollected: 1
                            });
                            logger_1.logger.debug(`📊 [History Service] Candle saved: ${symbol} ${timeframe} at ${candle.timestamp}`);
                        }
                    }
                    catch (error) {
                        logger_1.logger.error(`❌ [History Service] Failed to collect candle data for ${symbol} ${timeframe}:`, error);
                        await this.historicalDataModel.updateAPIStats({
                            endpoint: 'fx/historical',
                            totalCalls: 1,
                            successfulCalls: 0,
                            failedCalls: 1,
                            avgResponseTimeMs: 0,
                            cacheHits: 0,
                            cacheMisses: 1,
                            dataPointsCollected: 0
                        });
                    }
                }
            }
            const totalTime = Date.now() - startTime;
            logger_1.logger.info(`📊 [History Service] Candle collection completed in ${totalTime}ms`);
        }
        catch (error) {
            logger_1.logger.error('❌ [History Service] Candle collection failed:', error);
        }
        finally {
            this.isCollectingCandles = false;
        }
    }
    async performCleanup() {
        logger_1.logger.info('🧹 [History Service] Starting daily cleanup...');
        try {
            await this.historicalDataModel.cleanupOldData(30);
            const stats = await this.historicalDataModel.getDatabaseStats();
            logger_1.logger.info(`📊 [History Service] Database stats:`, {
                priceRecords: stats.priceHistoryCount,
                candleRecords: stats.candleDataCount,
                apiStatsRecords: stats.apiStatsCount,
                oldestRecord: stats.oldestPriceRecord,
                newestRecord: stats.newestPriceRecord
            });
            logger_1.logger.info('✅ [History Service] Daily cleanup completed');
        }
        catch (error) {
            logger_1.logger.error('❌ [History Service] Cleanup failed:', error);
        }
    }
    async backfillHistoricalData(symbol, timeframe, hours = 24) {
        logger_1.logger.info(`🔄 [History Service] Starting backfill for ${symbol} ${timeframe} (${hours}h)`);
        try {
            const limit = timeframe === '5m' ? hours * 12 : hours * 4;
            const candleData = await this.fxDataService.getHistoricalData(symbol, timeframe, limit);
            let saved = 0;
            for (const candle of candleData) {
                try {
                    const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 : 15 * 60 * 1000;
                    const record = {
                        symbol: symbol.replace('/', ''),
                        timeframe,
                        openPrice: candle.open,
                        highPrice: candle.high,
                        lowPrice: candle.low,
                        closePrice: candle.close,
                        volume: candle.volume || 0,
                        candleStart: candle.timestamp,
                        candleEnd: new Date(candle.timestamp.getTime() + intervalMs),
                        source: 'gmo'
                    };
                    await this.historicalDataModel.saveCandleData(record);
                    saved++;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    if (!errorMessage.includes('duplicate key')) {
                        logger_1.logger.warn(`⚠️ [History Service] Failed to save candle at ${candle.timestamp}:`, errorMessage);
                    }
                }
            }
            logger_1.logger.info(`✅ [History Service] Backfill completed: ${saved}/${candleData.length} candles saved`);
        }
        catch (error) {
            logger_1.logger.error(`❌ [History Service] Backfill failed for ${symbol} ${timeframe}:`, error);
            throw error;
        }
    }
    getStatus() {
        return {
            isRunning: this.priceCollectionJob !== null,
            isCollectingPrices: this.isCollectingPrices,
            isCollectingCandles: this.isCollectingCandles,
            nextPriceCollection: this.priceCollectionJob ? 'Every 30 seconds' : null,
            nextCandleCollection: this.candleCollectionJob ? 'Every 5 minutes' : null,
            nextCleanup: this.cleanupJob ? 'Daily at 02:00 JST' : null
        };
    }
}
exports.HistoryAccumulationService = HistoryAccumulationService;
//# sourceMappingURL=historyAccumulationService.js.map
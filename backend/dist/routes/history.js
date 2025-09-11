"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyRoutes = exports.createHistoryRoutes = void 0;
const express_1 = require("express");
const HistoricalData_1 = require("../models/HistoricalData");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.historyRoutes = router;
const createHistoryRoutes = (pool, getHistoryService) => {
    const historicalDataModel = new HistoricalData_1.HistoricalDataModel(pool);
    router.get('/stats', async (req, res) => {
        try {
            const stats = await historicalDataModel.getDatabaseStats();
            const historyService = getHistoryService();
            const serviceStatus = historyService?.getStatus() || {
                isRunning: false,
                isCollectingPrices: false,
                isCollectingCandles: false,
                nextPriceCollection: null,
                nextCandleCollection: null,
                nextCleanup: null
            };
            res.json({
                success: true,
                data: {
                    database: stats,
                    service: serviceStatus,
                    timestamp: new Date().toISOString()
                }
            });
            logger_1.logger.debug(`📊 [History API] Database stats retrieved`);
        }
        catch (error) {
            logger_1.logger.error('❌ [History API] Failed to get stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve database statistics'
            });
        }
    });
    router.get('/candles', async (req, res) => {
        try {
            const { symbol = 'USDJPY', timeframe = '15m', limit = 100, before } = req.query;
            const beforeDate = before ? new Date(before) : undefined;
            if (beforeDate && isNaN(beforeDate.getTime())) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid before date format'
                });
                return;
            }
            const candles = await historicalDataModel.getCandleData(symbol, timeframe, parseInt(limit), beforeDate);
            res.json({
                success: true,
                data: candles,
                meta: {
                    symbol,
                    timeframe,
                    limit: parseInt(limit),
                    before: beforeDate?.toISOString() || null,
                    count: candles.length
                }
            });
            logger_1.logger.debug(`📊 [History API] Candle data retrieved: ${candles.length} records`);
        }
        catch (error) {
            logger_1.logger.error('❌ [History API] Failed to get candle data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve candle data'
            });
        }
    });
    router.get('/prices', async (req, res) => {
        try {
            const { symbol = 'USDJPY', minutes = 60 } = req.query;
            const prices = await historicalDataModel.getRecentPriceHistory(symbol, parseInt(minutes));
            res.json({
                success: true,
                data: prices,
                meta: {
                    symbol,
                    minutes: parseInt(minutes),
                    count: prices.length
                }
            });
            logger_1.logger.debug(`💰 [History API] Price history retrieved: ${prices.length} records`);
        }
        catch (error) {
            logger_1.logger.error('❌ [History API] Failed to get price history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve price history'
            });
        }
    });
    router.post('/backfill', async (req, res) => {
        try {
            const { symbol = 'USD/JPY', timeframe = '15m', hours = 24 } = req.body;
            const historyService = getHistoryService();
            if (!historyService) {
                res.status(503).json({
                    success: false,
                    error: 'History service not available'
                });
                return;
            }
            historyService.backfillHistoricalData(symbol, timeframe, hours)
                .then(() => {
                logger_1.logger.info(`✅ [History API] Backfill completed: ${symbol} ${timeframe} ${hours}h`);
            })
                .catch((error) => {
                logger_1.logger.error(`❌ [History API] Backfill failed: ${symbol} ${timeframe}:`, error);
            });
            res.json({
                success: true,
                message: 'Backfill started in background',
                data: {
                    symbol,
                    timeframe,
                    hours,
                    startTime: new Date().toISOString()
                }
            });
            logger_1.logger.info(`🔄 [History API] Backfill started: ${symbol} ${timeframe} ${hours}h`);
        }
        catch (error) {
            logger_1.logger.error('❌ [History API] Failed to start backfill:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to start backfill process'
            });
        }
    });
    router.delete('/cleanup', async (req, res) => {
        try {
            const { retentionDays = 30 } = req.body;
            await historicalDataModel.cleanupOldData(retentionDays);
            res.json({
                success: true,
                message: 'Cleanup completed',
                data: {
                    retentionDays,
                    completedAt: new Date().toISOString()
                }
            });
            logger_1.logger.info(`🧹 [History API] Manual cleanup completed: ${retentionDays} days retention`);
        }
        catch (error) {
            logger_1.logger.error('❌ [History API] Cleanup failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cleanup old data'
            });
        }
    });
    router.get('/health', async (req, res) => {
        try {
            const testQuery = await pool.query('SELECT 1 as test');
            const dbHealthy = testQuery.rows.length > 0;
            const historyService = getHistoryService();
            const serviceStatus = historyService?.getStatus() || {
                isRunning: false,
                isCollectingPrices: false,
                isCollectingCandles: false
            };
            const health = {
                status: dbHealthy && serviceStatus.isRunning ? 'healthy' : 'degraded',
                database: dbHealthy ? 'connected' : 'disconnected',
                service: serviceStatus.isRunning ? 'running' : 'stopped',
                details: serviceStatus,
                timestamp: new Date().toISOString()
            };
            res.status(health.status === 'healthy' ? 200 : 503).json({
                success: true,
                data: health
            });
            logger_1.logger.debug(`🏥 [History API] Health check: ${health.status}`);
        }
        catch (error) {
            logger_1.logger.error('❌ [History API] Health check failed:', error);
            res.status(503).json({
                success: false,
                data: {
                    status: 'unhealthy',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                }
            });
        }
    });
    return router;
};
exports.createHistoryRoutes = createHistoryRoutes;
//# sourceMappingURL=history.js.map
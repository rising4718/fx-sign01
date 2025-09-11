"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalDataModel = void 0;
const logger_1 = require("../utils/logger");
class HistoricalDataModel {
    constructor(pool) {
        this.pool = pool;
    }
    async savePriceHistory(record) {
        const query = `
      INSERT INTO price_history (symbol, bid, ask, spread, timestamp, source)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
        try {
            const result = await this.pool.query(query, [
                record.symbol,
                record.bid,
                record.ask,
                record.spread,
                record.timestamp,
                record.source
            ]);
            const recordId = result.rows[0].id;
            logger_1.logger.debug(`💾 [DB] Price history saved: ${record.symbol} at ${record.timestamp} (ID: ${recordId})`);
            return recordId;
        }
        catch (error) {
            logger_1.logger.error('❌ [DB] Failed to save price history:', error);
            throw error;
        }
    }
    async savePriceHistoryBatch(records) {
        if (records.length === 0)
            return [];
        const values = records.map((_, index) => {
            const base = index * 6;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
        }).join(', ');
        const query = `
      INSERT INTO price_history (symbol, bid, ask, spread, timestamp, source)
      VALUES ${values}
      RETURNING id
    `;
        const params = records.flatMap(record => [
            record.symbol,
            record.bid,
            record.ask,
            record.spread,
            record.timestamp,
            record.source
        ]);
        try {
            const result = await this.pool.query(query, params);
            const ids = result.rows.map(row => row.id);
            logger_1.logger.info(`💾 [DB] Batch saved ${records.length} price records`);
            return ids;
        }
        catch (error) {
            logger_1.logger.error('❌ [DB] Failed to batch save price history:', error);
            throw error;
        }
    }
    async saveCandleData(record) {
        const query = `
      INSERT INTO candle_data 
      (symbol, timeframe, open_price, high_price, low_price, close_price, volume, candle_start, candle_end, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (symbol, timeframe, candle_start) 
      DO UPDATE SET
        open_price = EXCLUDED.open_price,
        high_price = EXCLUDED.high_price,
        low_price = EXCLUDED.low_price,
        close_price = EXCLUDED.close_price,
        volume = EXCLUDED.volume,
        candle_end = EXCLUDED.candle_end,
        source = EXCLUDED.source
      RETURNING id
    `;
        try {
            const result = await this.pool.query(query, [
                record.symbol,
                record.timeframe,
                record.openPrice,
                record.highPrice,
                record.lowPrice,
                record.closePrice,
                record.volume || 0,
                record.candleStart,
                record.candleEnd,
                record.source
            ]);
            const recordId = result.rows[0].id;
            logger_1.logger.debug(`📊 [DB] Candle data saved: ${record.symbol} ${record.timeframe} at ${record.candleStart} (ID: ${recordId})`);
            return recordId;
        }
        catch (error) {
            logger_1.logger.error('❌ [DB] Failed to save candle data:', error);
            throw error;
        }
    }
    async getCandleData(symbol, timeframe, limit = 100, before) {
        let query = `
      SELECT id, symbol, timeframe, open_price as "openPrice", high_price as "highPrice", 
             low_price as "lowPrice", close_price as "closePrice", volume,
             candle_start as "candleStart", candle_end as "candleEnd", source
      FROM candle_data
      WHERE symbol = $1 AND timeframe = $2
    `;
        const params = [symbol, timeframe];
        if (before) {
            query += ` AND candle_start < $3`;
            params.push(before);
        }
        query += ` ORDER BY candle_start DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        try {
            const result = await this.pool.query(query, params);
            logger_1.logger.debug(`📊 [DB] Retrieved ${result.rows.length} candles for ${symbol} ${timeframe}`);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('❌ [DB] Failed to get candle data:', error);
            throw error;
        }
    }
    async getRecentPriceHistory(symbol, minutes = 60) {
        const query = `
      SELECT id, symbol, bid, ask, spread, timestamp, source
      FROM price_history
      WHERE symbol = $1 AND timestamp > NOW() - INTERVAL '${minutes} minutes'
      ORDER BY timestamp DESC
    `;
        try {
            const result = await this.pool.query(query, [symbol]);
            logger_1.logger.debug(`💰 [DB] Retrieved ${result.rows.length} recent prices for ${symbol}`);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('❌ [DB] Failed to get recent price history:', error);
            throw error;
        }
    }
    async updateAPIStats(stats) {
        const today = new Date().toISOString().split('T')[0];
        const query = `
      INSERT INTO api_stats 
      (date, endpoint, total_calls, successful_calls, failed_calls, 
       avg_response_time_ms, cache_hits, cache_misses, data_points_collected)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (date, endpoint) 
      DO UPDATE SET
        total_calls = api_stats.total_calls + EXCLUDED.total_calls,
        successful_calls = api_stats.successful_calls + EXCLUDED.successful_calls,
        failed_calls = api_stats.failed_calls + EXCLUDED.failed_calls,
        avg_response_time_ms = 
          CASE WHEN EXCLUDED.total_calls > 0 THEN
            ((api_stats.avg_response_time_ms * api_stats.total_calls + 
              EXCLUDED.avg_response_time_ms * EXCLUDED.total_calls) / 
             (api_stats.total_calls + EXCLUDED.total_calls))
          ELSE api_stats.avg_response_time_ms
          END,
        cache_hits = api_stats.cache_hits + EXCLUDED.cache_hits,
        cache_misses = api_stats.cache_misses + EXCLUDED.cache_misses,
        data_points_collected = api_stats.data_points_collected + EXCLUDED.data_points_collected
    `;
        try {
            await this.pool.query(query, [
                today,
                stats.endpoint || 'unknown',
                stats.totalCalls || 0,
                stats.successfulCalls || 0,
                stats.failedCalls || 0,
                stats.avgResponseTimeMs || 0,
                stats.cacheHits || 0,
                stats.cacheMisses || 0,
                stats.dataPointsCollected || 0
            ]);
            logger_1.logger.debug(`📈 [DB] API stats updated for ${stats.endpoint} on ${today}`);
        }
        catch (error) {
            logger_1.logger.error('❌ [DB] Failed to update API stats:', error);
            throw error;
        }
    }
    async cleanupOldData(retentionDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const queries = [
            {
                table: 'price_history',
                query: 'DELETE FROM price_history WHERE timestamp < $1',
                param: cutoffDate
            },
            {
                table: 'api_stats',
                query: 'DELETE FROM api_stats WHERE date < $1',
                param: cutoffDate.toISOString().split('T')[0]
            },
            {
                table: 'system_metrics',
                query: 'DELETE FROM system_metrics WHERE timestamp < $1',
                param: cutoffDate
            }
        ];
        try {
            for (const { table, query, param } of queries) {
                const result = await this.pool.query(query, [param]);
                logger_1.logger.info(`🧹 [DB] Cleaned up ${result.rowCount} old records from ${table}`);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ [DB] Failed to cleanup old data:', error);
            throw error;
        }
    }
    async getDatabaseStats() {
        const queries = [
            'SELECT COUNT(*) as count FROM price_history',
            'SELECT COUNT(*) as count FROM candle_data',
            'SELECT COUNT(*) as count FROM api_stats',
            'SELECT MIN(timestamp) as oldest FROM price_history',
            'SELECT MAX(timestamp) as newest FROM price_history'
        ];
        try {
            const results = await Promise.all(queries.map(query => this.pool.query(query)));
            return {
                priceHistoryCount: parseInt(results[0].rows[0].count),
                candleDataCount: parseInt(results[1].rows[0].count),
                apiStatsCount: parseInt(results[2].rows[0].count),
                oldestPriceRecord: results[3].rows[0].oldest,
                newestPriceRecord: results[4].rows[0].newest
            };
        }
        catch (error) {
            logger_1.logger.error('❌ [DB] Failed to get database stats:', error);
            throw error;
        }
    }
}
exports.HistoricalDataModel = HistoricalDataModel;
//# sourceMappingURL=HistoricalData.js.map
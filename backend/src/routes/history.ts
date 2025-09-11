import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { HistoricalDataModel } from '../models/HistoricalData';
import { HistoryAccumulationService } from '../services/historyAccumulationService';
import { logger } from '../utils/logger';

const router = Router();

// Phase2: 履歴データ管理API
export const createHistoryRoutes = (pool: Pool, getHistoryService: () => HistoryAccumulationService | null) => {
  const historicalDataModel = new HistoricalDataModel(pool);

  /**
   * GET /api/v1/history/stats
   * データベース統計取得
   */
  router.get('/stats', async (req: Request, res: Response) => {
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

      logger.debug(`📊 [History API] Database stats retrieved`);
    } catch (error) {
      logger.error('❌ [History API] Failed to get stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve database statistics'
      });
    }
  });

  /**
   * GET /api/v1/history/candles
   * キャンドルデータ取得
   */
  router.get('/candles', async (req: Request, res: Response) => {
    try {
      const {
        symbol = 'USDJPY',
        timeframe = '15m',
        limit = 100,
        before
      } = req.query;

      const beforeDate = before ? new Date(before as string) : undefined;
      
      if (beforeDate && isNaN(beforeDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid before date format'
        });
        return;
      }

      const candles = await historicalDataModel.getCandleData(
        symbol as string,
        timeframe as '5m' | '15m',
        parseInt(limit as string),
        beforeDate
      );

      res.json({
        success: true,
        data: candles,
        meta: {
          symbol,
          timeframe,
          limit: parseInt(limit as string),
          before: beforeDate?.toISOString() || null,
          count: candles.length
        }
      });

      logger.debug(`📊 [History API] Candle data retrieved: ${candles.length} records`);
    } catch (error) {
      logger.error('❌ [History API] Failed to get candle data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve candle data'
      });
    }
  });

  /**
   * GET /api/v1/history/prices
   * 価格履歴取得
   */
  router.get('/prices', async (req: Request, res: Response) => {
    try {
      const {
        symbol = 'USDJPY',
        minutes = 60
      } = req.query;

      const prices = await historicalDataModel.getRecentPriceHistory(
        symbol as string,
        parseInt(minutes as string)
      );

      res.json({
        success: true,
        data: prices,
        meta: {
          symbol,
          minutes: parseInt(minutes as string),
          count: prices.length
        }
      });

      logger.debug(`💰 [History API] Price history retrieved: ${prices.length} records`);
    } catch (error) {
      logger.error('❌ [History API] Failed to get price history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve price history'
      });
    }
  });

  /**
   * POST /api/v1/history/backfill
   * 手動バックフィル実行
   */
  router.post('/backfill', async (req: Request, res: Response) => {
    try {
      const {
        symbol = 'USD/JPY',
        timeframe = '15m',
        hours = 24
      } = req.body;

      const historyService = getHistoryService();
      if (!historyService) {
        res.status(503).json({
          success: false,
          error: 'History service not available'
        });
        return;
      }

      // 非同期でバックフィル実行
      historyService.backfillHistoricalData(symbol, timeframe, hours)
        .then(() => {
          logger.info(`✅ [History API] Backfill completed: ${symbol} ${timeframe} ${hours}h`);
        })
        .catch((error) => {
          logger.error(`❌ [History API] Backfill failed: ${symbol} ${timeframe}:`, error);
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

      logger.info(`🔄 [History API] Backfill started: ${symbol} ${timeframe} ${hours}h`);
    } catch (error) {
      logger.error('❌ [History API] Failed to start backfill:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start backfill process'
      });
    }
  });

  /**
   * DELETE /api/v1/history/cleanup
   * 古いデータクリーンアップ
   */
  router.delete('/cleanup', async (req: Request, res: Response) => {
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

      logger.info(`🧹 [History API] Manual cleanup completed: ${retentionDays} days retention`);
    } catch (error) {
      logger.error('❌ [History API] Cleanup failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup old data'
      });
    }
  });

  /**
   * GET /api/v1/history/health
   * ヘルスチェック
   */
  router.get('/health', async (req: Request, res: Response) => {
    try {
      // データベース接続テスト
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

      logger.debug(`🏥 [History API] Health check: ${health.status}`);
    } catch (error: unknown) {
      logger.error('❌ [History API] Health check failed:', error);
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

export { router as historyRoutes };
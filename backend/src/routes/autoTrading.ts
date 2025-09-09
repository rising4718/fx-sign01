/**
 * Auto Trading API Routes
 * 自動取引システムのAPI
 */

import express, { Request, Response } from 'express';
import { AutoTradingService } from '../services/autoTradingService';
import { logger } from '../utils/logger';

const router = express.Router();
let autoTradingService: AutoTradingService | null = null;

/**
 * POST /api/v1/auto-trading/start
 * 自動取引開始
 */
router.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol = 'USDJPY' } = req.body;

    if (autoTradingService) {
      res.status(400).json({
        success: false,
        error: 'Auto trading is already running',
        code: 'ALREADY_RUNNING'
      });
      return;
    }

    autoTradingService = new AutoTradingService();
    await autoTradingService.startAutoTrading(symbol);

    logger.info(`Auto trading started for ${symbol}`);

    res.json({
      success: true,
      message: 'Auto trading started',
      data: {
        symbol,
        status: 'running',
        startedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Auto trading start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start auto trading',
      code: 'START_ERROR'
    });
  }
});

/**
 * POST /api/v1/auto-trading/stop
 * 自動取引停止
 */
router.post('/stop', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!autoTradingService) {
      res.status(400).json({
        success: false,
        error: 'Auto trading is not running',
        code: 'NOT_RUNNING'
      });
      return;
    }

    autoTradingService.stopAutoTrading();
    autoTradingService = null;

    logger.info('Auto trading stopped');

    res.json({
      success: true,
      message: 'Auto trading stopped',
      data: {
        status: 'stopped',
        stoppedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Auto trading stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop auto trading',
      code: 'STOP_ERROR'
    });
  }
});

/**
 * GET /api/v1/auto-trading/status
 * 自動取引状態取得
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const isRunning = autoTradingService !== null;
    
    const statusData = {
      isRunning,
      activeTradesCount: isRunning && autoTradingService ? autoTradingService.getActiveTradesCount() : 0,
      activeTrades: isRunning && autoTradingService ? autoTradingService.getActiveTrades() : [],
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: statusData
    });

  } catch (error) {
    logger.error('Auto trading status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auto trading status',
      code: 'STATUS_ERROR'
    });
  }
});

/**
 * GET /api/v1/auto-trading/active-trades
 * アクティブな取引一覧
 */
router.get('/active-trades', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!autoTradingService) {
      res.json({
        success: true,
        data: [],
        message: 'Auto trading is not running'
      });
      return;
    }

    const activeTrades = autoTradingService.getActiveTrades();

    res.json({
      success: true,
      data: activeTrades,
      count: activeTrades.length
    });

  } catch (error) {
    logger.error('Active trades fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active trades',
      code: 'FETCH_ERROR'
    });
  }
});

export { router as autoTradingRoutes };
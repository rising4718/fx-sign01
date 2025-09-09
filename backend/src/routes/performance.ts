/**
 * Performance API Routes
 * Phase 1: パフォーマンス追跡・分析API
 * 作成日: 2025-09-07
 */

import express, { Request, Response } from 'express';
import { PerformanceTrackingService } from '../services/performanceTrackingService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const performanceService = new PerformanceTrackingService(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/fx_sign_tool'
);

// === Trade Recording APIs ===

/**
 * POST /api/v1/performance/trades
 * 取引記録の登録
 */
router.post('/trades', async (req: Request, res: Response): Promise<void> => {
  try {
    const tradeData = req.body;
    
    // 必須フィールドの検証
    const requiredFields = [
      'symbol', 'entryTime', 'direction', 'boxHigh', 'boxLow', 
      'boxWidthPips', 'entrySession', 'entryPrice', 'positionSize', 'stopLoss'
    ];
    
    for (const field of requiredFields) {
      if (!(field in tradeData)) {
        res.status(400).json({
          error: `Missing required field: ${field}`,
          code: 'MISSING_FIELD'
        });
        return;
      }
    }

    const tradeId = await performanceService.recordTrade({
      symbol: tradeData.symbol,
      entryTime: new Date(tradeData.entryTime),
      exitTime: tradeData.exitTime ? new Date(tradeData.exitTime) : undefined,
      direction: tradeData.direction,
      boxHigh: parseFloat(tradeData.boxHigh),
      boxLow: parseFloat(tradeData.boxLow),
      boxWidthPips: parseFloat(tradeData.boxWidthPips),
      entrySession: tradeData.entrySession,
      entryPrice: parseFloat(tradeData.entryPrice),
      entryMethod: tradeData.entryMethod,
      exitPrice: tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : undefined,
      exitReason: tradeData.exitReason,
      positionSize: parseFloat(tradeData.positionSize),
      stopLoss: parseFloat(tradeData.stopLoss),
      takeProfit: tradeData.takeProfit ? parseFloat(tradeData.takeProfit) : undefined,
      pnlPips: tradeData.pnlPips ? parseFloat(tradeData.pnlPips) : undefined,
      pnlAmount: tradeData.pnlAmount ? parseFloat(tradeData.pnlAmount) : undefined,
      riskRewardRatio: tradeData.riskRewardRatio ? parseFloat(tradeData.riskRewardRatio) : undefined,
      atrD1: tradeData.atrD1 ? parseFloat(tradeData.atrD1) : undefined,
      spreadAtEntry: tradeData.spreadAtEntry ? parseFloat(tradeData.spreadAtEntry) : undefined,
      volatilityRegime: tradeData.volatilityRegime
    });

    logger.info('Trade recorded successfully', { tradeId, symbol: tradeData.symbol });

    res.status(201).json({
      success: true,
      tradeId,
      message: 'Trade recorded successfully'
    });

  } catch (error) {
    logger.error('Trade recording error:', error);
    res.status(500).json({
      error: 'Failed to record trade',
      code: 'TRADE_RECORD_ERROR'
    });
  }
});

/**
 * PUT /api/v1/performance/trades/:id/exit
 * 取引終了の記録
 */
router.put('/trades/:id/exit', async (req: Request, res: Response): Promise<void> => {
  try {
    const tradeId = parseInt(req.params.id);
    const { exitPrice, exitReason, pnlPips, pnlAmount } = req.body;

    if (!exitPrice || !exitReason) {
      res.status(400).json({
        error: 'exitPrice and exitReason are required',
        code: 'MISSING_EXIT_DATA'
      });
      return;
    }

    await performanceService.updateTradeExit(
      tradeId,
      parseFloat(exitPrice),
      exitReason,
      pnlPips ? parseFloat(pnlPips) : undefined,
      pnlAmount ? parseFloat(pnlAmount) : undefined
    );

    logger.info('Trade exit updated', { tradeId, exitReason, pnlPips });

    res.json({
      success: true,
      message: 'Trade exit recorded successfully'
    });

  } catch (error) {
    logger.error('Trade exit update error:', error);
    res.status(500).json({
      error: 'Failed to update trade exit',
      code: 'TRADE_EXIT_ERROR'
    });
  }
});

// === Performance Analysis APIs ===

/**
 * GET /api/v1/performance/daily
 * 日次パフォーマンス取得
 */
router.get('/daily', async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate as string || 
                     new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = req.query.endDate as string || 
                   new Date().toISOString().split('T')[0];

    // 開発環境でデータベース接続エラーが発生した場合、モックデータを返す
    if (process.env.NODE_ENV === 'development') {
      try {
        const dailyPerformance = await performanceService.getDailyPerformance(startDate, endDate);
        
        res.json({
          success: true,
          data: dailyPerformance,
          period: { startDate, endDate }
        });
        return;
      } catch (dbError) {
        logger.warn('Database unavailable for daily data, returning mock data:', dbError);
        
        // 開発用モック日次データ
        const mockDailyData = [
          {
            date: '2025-09-07',
            totalTrades: 3,
            winningTrades: 2,
            losingTrades: 1,
            winRate: 66.7,
            grossProfit: 500,
            grossLoss: -250,
            netProfit: 250,
            profitFactor: 2.0
          },
          {
            date: '2025-09-08',
            totalTrades: 2,
            winningTrades: 2,
            losingTrades: 0,
            winRate: 100.0,
            grossProfit: 400,
            grossLoss: 0,
            netProfit: 400,
            profitFactor: null
          },
          {
            date: '2025-09-09',
            totalTrades: 4,
            winningTrades: 3,
            losingTrades: 1,
            winRate: 75.0,
            grossProfit: 750,
            grossLoss: -150,
            netProfit: 600,
            profitFactor: 5.0
          }
        ];

        res.json({
          success: true,
          data: mockDailyData,
          period: { startDate, endDate },
          isDevelopmentMock: true
        });
        return;
      }
    }

    // 本番環境では通常処理
    const dailyPerformance = await performanceService.getDailyPerformance(startDate, endDate);

    res.json({
      success: true,
      data: dailyPerformance,
      period: { startDate, endDate }
    });

  } catch (error) {
    logger.error('Daily performance fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch daily performance',
      code: 'DAILY_PERFORMANCE_ERROR'
    });
  }
});

/**
 * GET /api/v1/performance/summary
 * Phase 1 パフォーマンスサマリー
 */
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    // 開発環境でデータベース接続エラーが発生した場合、モックデータを返す
    if (process.env.NODE_ENV === 'development') {
      try {
        const phaseSummary = await performanceService.getCurrentPhaseSummary();
        const days = parseInt(req.query.days as string) || 30;
        const detailedStats = await performanceService.getPerformanceStats(days);

        res.json({
          success: true,
          data: {
            phase: phaseSummary,
            detailed: detailedStats,
            analysisPeriod: `${days} days`
          }
        });
        return;
      } catch (dbError) {
        logger.warn('Database unavailable, returning mock data:', dbError);
        
        // 開発用モックデータ
        const mockData = {
          phase: {
            currentPhase: 'Phase 1',
            totalTrades: 45,
            winningTrades: 32,
            losingTrades: 13,
            avgWinRate: 71.1,
            totalPnlPips: 420,
            avgPnlPerTrade: 9.3,
            maxDrawdown: 15.2,
            monthlyReturn: 8.5,
            daysAboveTarget: 18,
            totalDaysActive: 25
          },
          detailed: {
            totalTrades: 45,
            winRate: 71.1,
            avgDailyReturn: 2.1,
            maxDrawdown: 15.2,
            sharpeRatio: 1.4,
            profitFactor: 1.8,
            bestDay: 12.5,
            worstDay: -8.3,
            consecutiveWinStreak: 7,
            consecutiveLossStreak: 3
          },
          analysisPeriod: `${parseInt(req.query.days as string) || 30} days`
        };

        res.json({
          success: true,
          data: mockData,
          isDevelopmentMock: true
        });
        return;
      }
    }

    // 本番環境では通常処理
    const phaseSummary = await performanceService.getCurrentPhaseSummary();
    const days = parseInt(req.query.days as string) || 30;
    const detailedStats = await performanceService.getPerformanceStats(days);

    res.json({
      success: true,
      data: {
        phase: phaseSummary,
        detailed: detailedStats,
        analysisPeriod: `${days} days`
      }
    });

  } catch (error) {
    logger.error('Performance summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch performance summary',
      code: 'PERFORMANCE_SUMMARY_ERROR'
    });
  }
});

// === Market Environment APIs ===

/**
 * POST /api/v1/performance/market-environment
 * 市場環境データ記録
 */
router.post('/market-environment', async (req: Request, res: Response): Promise<void> => {
  try {
    const environmentData = req.body;

    if (!environmentData.date) {
      res.status(400).json({
        error: 'Date is required',
        code: 'MISSING_DATE'
      });
      return;
    }

    await performanceService.recordMarketEnvironment({
      date: environmentData.date,
      atrD1Usdjpy: environmentData.atrD1Usdjpy ? parseFloat(environmentData.atrD1Usdjpy) : undefined,
      atrD1Eurusd: environmentData.atrD1Eurusd ? parseFloat(environmentData.atrD1Eurusd) : undefined,
      dailyRangeUsdjpy: environmentData.dailyRangeUsdjpy ? parseFloat(environmentData.dailyRangeUsdjpy) : undefined,
      dailyRangeEurusd: environmentData.dailyRangeEurusd ? parseFloat(environmentData.dailyRangeEurusd) : undefined,
      tokyoSessionRange: environmentData.tokyoSessionRange ? parseFloat(environmentData.tokyoSessionRange) : undefined,
      europeSessionRange: environmentData.europeSessionRange ? parseFloat(environmentData.europeSessionRange) : undefined,
      nySessionRange: environmentData.nySessionRange ? parseFloat(environmentData.nySessionRange) : undefined,
      vixValue: environmentData.vixValue ? parseFloat(environmentData.vixValue) : undefined,
      dxyClose: environmentData.dxyClose ? parseFloat(environmentData.dxyClose) : undefined,
      nikkeiChangePercent: environmentData.nikkeiChangePercent ? parseFloat(environmentData.nikkeiChangePercent) : undefined,
      spxChangePercent: environmentData.spxChangePercent ? parseFloat(environmentData.spxChangePercent) : undefined,
      majorNewsEvents: environmentData.majorNewsEvents,
      economicCalendarImpact: environmentData.economicCalendarImpact
    });

    logger.info('Market environment recorded', { date: environmentData.date });

    res.json({
      success: true,
      message: 'Market environment data recorded successfully'
    });

  } catch (error) {
    logger.error('Market environment recording error:', error);
    res.status(500).json({
      error: 'Failed to record market environment',
      code: 'MARKET_ENVIRONMENT_ERROR'
    });
  }
});

// === Backtesting APIs ===

/**
 * POST /api/v1/performance/backtests
 * バックテスト結果保存
 */
router.post('/backtests', async (req: Request, res: Response): Promise<void> => {
  try {
    const backtestData = req.body;
    
    const requiredFields = [
      'testName', 'startDate', 'endDate', 'strategyVersion', 'parameters',
      'totalTrades', 'winningTrades', 'losingTrades', 'winRate', 'netProfit'
    ];
    
    for (const field of requiredFields) {
      if (!(field in backtestData)) {
        res.status(400).json({
          error: `Missing required field: ${field}`,
          code: 'MISSING_FIELD'
        });
        return;
      }
    }

    const backtestId = await performanceService.saveBacktestResult({
      testName: backtestData.testName,
      startDate: backtestData.startDate,
      endDate: backtestData.endDate,
      strategyVersion: backtestData.strategyVersion,
      parameters: backtestData.parameters,
      totalTrades: parseInt(backtestData.totalTrades),
      winningTrades: parseInt(backtestData.winningTrades),
      losingTrades: parseInt(backtestData.losingTrades),
      winRate: parseFloat(backtestData.winRate),
      netProfit: parseFloat(backtestData.netProfit),
      profitFactor: backtestData.profitFactor ? parseFloat(backtestData.profitFactor) : undefined,
      maxDrawdown: backtestData.maxDrawdown ? parseFloat(backtestData.maxDrawdown) : undefined,
      maxDrawdownPercent: backtestData.maxDrawdownPercent ? parseFloat(backtestData.maxDrawdownPercent) : undefined,
      sharpeRatio: backtestData.sharpeRatio ? parseFloat(backtestData.sharpeRatio) : undefined,
      sortinoRatio: backtestData.sortinoRatio ? parseFloat(backtestData.sortinoRatio) : undefined,
      monthlyReturns: backtestData.monthlyReturns,
      dailyEquityCurve: backtestData.dailyEquityCurve,
      notes: backtestData.notes
    });

    logger.info('Backtest result saved', { backtestId, testName: backtestData.testName });

    res.status(201).json({
      success: true,
      backtestId,
      message: 'Backtest result saved successfully'
    });

  } catch (error) {
    logger.error('Backtest save error:', error);
    res.status(500).json({
      error: 'Failed to save backtest result',
      code: 'BACKTEST_SAVE_ERROR'
    });
  }
});

/**
 * GET /api/v1/performance/backtests
 * 最近のバックテスト結果取得
 */
router.get('/backtests', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const backtests = await performanceService.getRecentBacktests(limit);

    res.json({
      success: true,
      data: backtests
    });

  } catch (error) {
    logger.error('Backtests fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch backtest results',
      code: 'BACKTESTS_FETCH_ERROR'
    });
  }
});

// === Phase Progress API ===

/**
 * GET /api/v1/performance/phase-progress
 * Phase 1 進捗状況
 */
router.get('/phase-progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const phaseSummary = await performanceService.getCurrentPhaseSummary();
    
    // Phase 1 目標値
    const phase1Targets = {
      winRate: { min: 70, max: 75 },
      profitFactor: { min: 1.6, max: 2.0 },
      maxDrawdown: { max: 20 },
      monthlyReturn: { min: 8, max: 12 }
    };

    // 達成度計算
    const achievements = {
      winRateProgress: Math.min(100, (phaseSummary.avgWinRate / 70) * 100),
      targetAchievement: phaseSummary.daysAboveTarget / Math.max(1, phaseSummary.totalDaysActive) * 100,
      dataCollectionDays: phaseSummary.totalDaysActive,
      phase1Complete: phaseSummary.totalDaysActive >= 90 && phaseSummary.avgWinRate >= 70 // 3ヶ月 + 目標勝率
    };

    res.json({
      success: true,
      data: {
        currentPhase: 'Phase 1',
        summary: phaseSummary,
        targets: phase1Targets,
        achievements,
        nextMilestone: achievements.phase1Complete ? 'Phase 2 準備中' : 'Phase 1 データ収集継続'
      }
    });

  } catch (error) {
    logger.error('Phase progress error:', error);
    res.status(500).json({
      error: 'Failed to fetch phase progress',
      code: 'PHASE_PROGRESS_ERROR'
    });
  }
});

export { router as performanceRoutes };
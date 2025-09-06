import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { TORBAnalysisService } from '../services/torbAnalysisService';
import { logger } from '../utils/logger';

const router = express.Router();
const torbService = new TORBAnalysisService();

/**
 * GET /api/v1/torb/signals
 * Get current TORB signals
 */
router.get('/signals', asyncHandler(async (req, res) => {
  const symbol = req.query.symbol as string || 'USD/JPY';
  
  logger.debug(`Fetching TORB signals for ${symbol}`);
  
  try {
    const signals = await torbService.getCurrentSignals(symbol);
    
    res.json({
      success: true,
      data: signals,
      meta: {
        symbol,
        count: signals.length,
        activeSignals: signals.filter(s => s.status === 'ACTIVE').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching TORB signals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TORB signals',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * GET /api/v1/torb/analysis
 * Get current TORB analysis including range and market conditions
 */
router.get('/analysis', asyncHandler(async (req, res) => {
  const symbol = req.query.symbol as string || 'USD/JPY';
  
  logger.debug(`Fetching TORB analysis for ${symbol}`);
  
  try {
    const analysis = await torbService.getTORBAnalysis(symbol);
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching TORB analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TORB analysis',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * GET /api/v1/torb/range
 * Get current Tokyo Opening Range data
 */
router.get('/range', asyncHandler(async (req, res) => {
  const symbol = req.query.symbol as string || 'USD/JPY';
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  
  logger.debug(`Fetching TORB range for ${symbol} on ${date}`);
  
  try {
    const range = await torbService.getTORBRange(symbol, date);
    
    res.json({
      success: true,
      data: range,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching TORB range:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TORB range',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * GET /api/v1/torb/history
 * Get historical TORB signals and performance
 */
router.get('/history', asyncHandler(async (req, res) => {
  const symbol = req.query.symbol as string || 'USD/JPY';
  const days = parseInt(req.query.days as string) || 30;
  const limit = parseInt(req.query.limit as string) || 100;
  
  logger.debug(`Fetching TORB history for ${symbol}, ${days} days, limit: ${limit}`);
  
  try {
    const history = await torbService.getTORBHistory(symbol, days, limit);
    
    res.json({
      success: true,
      data: history.signals,
      meta: {
        symbol,
        days,
        totalSignals: history.signals.length,
        winRate: history.performance.winRate,
        totalPnL: history.performance.totalPnL,
        avgPnL: history.performance.avgPnL
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching TORB history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TORB history',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * POST /api/v1/torb/calculate
 * Manually trigger TORB calculation for testing
 */
router.post('/calculate', asyncHandler(async (req, res) => {
  const symbol = req.body.symbol || 'USD/JPY';
  const date = req.body.date || new Date().toISOString().split('T')[0];
  
  logger.info(`Manual TORB calculation triggered for ${symbol} on ${date}`);
  
  try {
    const result = await torbService.calculateTORB(symbol, date);
    
    res.json({
      success: true,
      data: result,
      message: 'TORB calculation completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error calculating TORB:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate TORB',
      timestamp: new Date().toISOString()
    });
  }
}));

export { router as torbRoutes };
import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FXDataService } from '../services/fxDataService';
import { logger } from '../utils/logger';

const router = express.Router();
const fxService = new FXDataService();

/**
 * GET /api/v1/fx/ticker
 * Get current FX price data for USD/JPY
 */
router.get('/ticker', asyncHandler(async (req, res) => {
  const symbol = req.query.symbol as string || 'USD/JPY';
  
  logger.debug(`Fetching ticker data for ${symbol}`);
  
  try {
    const priceData = await fxService.getCurrentPrice(symbol);
    
    res.json({
      success: true,
      data: priceData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching ticker data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticker data',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * GET /api/v1/fx/historical
 * Get historical price data for analysis
 */
router.get('/historical', asyncHandler(async (req, res) => {
  const symbol = req.query.symbol as string || 'USD/JPY';
  const timeframe = req.query.timeframe as string || '15m';
  const limit = parseInt(req.query.limit as string) || 100;
  
  logger.debug(`Fetching historical data for ${symbol}, timeframe: ${timeframe}, limit: ${limit}`);
  
  try {
    const historicalData = await fxService.getHistoricalData(symbol, timeframe, limit);
    
    res.json({
      success: true,
      data: historicalData,
      meta: {
        symbol,
        timeframe,
        count: historicalData.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical data',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * GET /api/v1/fx/status
 * Get API connection status and health
 */
router.get('/status', asyncHandler(async (req, res) => {
  try {
    const status = await fxService.getAPIStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting API status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get API status',
      timestamp: new Date().toISOString()
    });
  }
}));

export { router as fxRoutes };
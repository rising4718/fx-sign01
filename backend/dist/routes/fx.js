"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fxRoutes = void 0;
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../middleware/errorHandler");
const fxDataService_1 = require("../services/fxDataService");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
exports.fxRoutes = router;
const fxService = new fxDataService_1.FXDataService();
router.get('/ticker', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const symbol = req.query.symbol || 'USD/JPY';
    logger_1.logger.debug(`Fetching ticker data for ${symbol}`);
    try {
        const priceData = await fxService.getCurrentPrice(symbol);
        res.json({
            success: true,
            data: priceData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching ticker data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ticker data',
            timestamp: new Date().toISOString()
        });
    }
}));
router.get('/historical', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const symbol = req.query.symbol || 'USD/JPY';
    const timeframe = req.query.timeframe || '15m';
    const limit = parseInt(req.query.limit) || 100;
    logger_1.logger.debug(`Fetching historical data for ${symbol}, timeframe: ${timeframe}, limit: ${limit}`);
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching historical data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch historical data',
            timestamp: new Date().toISOString()
        });
    }
}));
router.get('/status', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const status = await fxService.getAPIStatus();
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting API status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get API status',
            timestamp: new Date().toISOString()
        });
    }
}));
//# sourceMappingURL=fx.js.map
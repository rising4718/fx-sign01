"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.torbRoutes = void 0;
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../middleware/errorHandler");
const torbAnalysisService_1 = require("../services/torbAnalysisService");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
exports.torbRoutes = router;
const torbService = new torbAnalysisService_1.TORBAnalysisService();
router.get('/signals', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const symbol = req.query.symbol || 'USD/JPY';
    logger_1.logger.debug(`Fetching TORB signals for ${symbol}`);
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching TORB signals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch TORB signals',
            timestamp: new Date().toISOString()
        });
    }
}));
router.get('/analysis', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const symbol = req.query.symbol || 'USD/JPY';
    logger_1.logger.debug(`Fetching TORB analysis for ${symbol}`);
    try {
        const analysis = await torbService.getTORBAnalysis(symbol);
        res.json({
            success: true,
            data: analysis,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching TORB analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch TORB analysis',
            timestamp: new Date().toISOString()
        });
    }
}));
router.get('/range', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const symbol = req.query.symbol || 'USD/JPY';
    const date = req.query.date || new Date().toISOString().split('T')[0];
    logger_1.logger.debug(`Fetching TORB range for ${symbol} on ${date}`);
    try {
        const range = await torbService.getTORBRange(symbol, date);
        res.json({
            success: true,
            data: range,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching TORB range:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch TORB range',
            timestamp: new Date().toISOString()
        });
    }
}));
router.get('/history', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const symbol = req.query.symbol || 'USD/JPY';
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 100;
    logger_1.logger.debug(`Fetching TORB history for ${symbol}, ${days} days, limit: ${limit}`);
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching TORB history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch TORB history',
            timestamp: new Date().toISOString()
        });
    }
}));
router.post('/calculate', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const symbol = req.body.symbol || 'USD/JPY';
    const date = req.body.date || new Date().toISOString().split('T')[0];
    logger_1.logger.info(`Manual TORB calculation triggered for ${symbol} on ${date}`);
    try {
        const result = await torbService.calculateTORB(symbol, date);
        res.json({
            success: true,
            data: result,
            message: 'TORB calculation completed',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating TORB:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate TORB',
            timestamp: new Date().toISOString()
        });
    }
}));
//# sourceMappingURL=torb.js.map
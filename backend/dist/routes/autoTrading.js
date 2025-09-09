"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoTradingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const autoTradingService_1 = require("../services/autoTradingService");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
exports.autoTradingRoutes = router;
let autoTradingService = null;
router.post('/start', async (req, res) => {
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
        autoTradingService = new autoTradingService_1.AutoTradingService();
        await autoTradingService.startAutoTrading(symbol);
        logger_1.logger.info(`Auto trading started for ${symbol}`);
        res.json({
            success: true,
            message: 'Auto trading started',
            data: {
                symbol,
                status: 'running',
                startedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Auto trading start error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start auto trading',
            code: 'START_ERROR'
        });
    }
});
router.post('/stop', async (req, res) => {
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
        logger_1.logger.info('Auto trading stopped');
        res.json({
            success: true,
            message: 'Auto trading stopped',
            data: {
                status: 'stopped',
                stoppedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Auto trading stop error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to stop auto trading',
            code: 'STOP_ERROR'
        });
    }
});
router.get('/status', async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Auto trading status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get auto trading status',
            code: 'STATUS_ERROR'
        });
    }
});
router.get('/active-trades', async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Active trades fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch active trades',
            code: 'FETCH_ERROR'
        });
    }
});
//# sourceMappingURL=autoTrading.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const performanceTrackingService_1 = require("../services/performanceTrackingService");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
exports.performanceRoutes = router;
const performanceService = new performanceTrackingService_1.PerformanceTrackingService(process.env.DATABASE_URL || 'postgresql://localhost:5432/fx_sign_tool');
router.post('/trades', async (req, res) => {
    try {
        const tradeData = req.body;
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
        logger_1.logger.info('Trade recorded successfully', { tradeId, symbol: tradeData.symbol });
        res.status(201).json({
            success: true,
            tradeId,
            message: 'Trade recorded successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Trade recording error:', error);
        res.status(500).json({
            error: 'Failed to record trade',
            code: 'TRADE_RECORD_ERROR'
        });
    }
});
router.put('/trades/:id/exit', async (req, res) => {
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
        await performanceService.updateTradeExit(tradeId, parseFloat(exitPrice), exitReason, pnlPips ? parseFloat(pnlPips) : undefined, pnlAmount ? parseFloat(pnlAmount) : undefined);
        logger_1.logger.info('Trade exit updated', { tradeId, exitReason, pnlPips });
        res.json({
            success: true,
            message: 'Trade exit recorded successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Trade exit update error:', error);
        res.status(500).json({
            error: 'Failed to update trade exit',
            code: 'TRADE_EXIT_ERROR'
        });
    }
});
router.get('/daily', async (req, res) => {
    try {
        const startDate = req.query.startDate ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = req.query.endDate ||
            new Date().toISOString().split('T')[0];
        const dailyPerformance = await performanceService.getDailyPerformance(startDate, endDate);
        res.json({
            success: true,
            data: dailyPerformance,
            period: { startDate, endDate }
        });
    }
    catch (error) {
        logger_1.logger.error('Daily performance fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch daily performance',
            code: 'DAILY_PERFORMANCE_ERROR'
        });
    }
});
router.get('/summary', async (req, res) => {
    try {
        const phaseSummary = await performanceService.getCurrentPhaseSummary();
        const days = parseInt(req.query.days) || 30;
        const detailedStats = await performanceService.getPerformanceStats(days);
        res.json({
            success: true,
            data: {
                phase: phaseSummary,
                detailed: detailedStats,
                analysisPeriod: `${days} days`
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Performance summary error:', error);
        res.status(500).json({
            error: 'Failed to fetch performance summary',
            code: 'PERFORMANCE_SUMMARY_ERROR'
        });
    }
});
router.post('/market-environment', async (req, res) => {
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
        logger_1.logger.info('Market environment recorded', { date: environmentData.date });
        res.json({
            success: true,
            message: 'Market environment data recorded successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Market environment recording error:', error);
        res.status(500).json({
            error: 'Failed to record market environment',
            code: 'MARKET_ENVIRONMENT_ERROR'
        });
    }
});
router.post('/backtests', async (req, res) => {
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
        logger_1.logger.info('Backtest result saved', { backtestId, testName: backtestData.testName });
        res.status(201).json({
            success: true,
            backtestId,
            message: 'Backtest result saved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Backtest save error:', error);
        res.status(500).json({
            error: 'Failed to save backtest result',
            code: 'BACKTEST_SAVE_ERROR'
        });
    }
});
router.get('/backtests', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const backtests = await performanceService.getRecentBacktests(limit);
        res.json({
            success: true,
            data: backtests
        });
    }
    catch (error) {
        logger_1.logger.error('Backtests fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch backtest results',
            code: 'BACKTESTS_FETCH_ERROR'
        });
    }
});
router.get('/phase-progress', async (req, res) => {
    try {
        const phaseSummary = await performanceService.getCurrentPhaseSummary();
        const phase1Targets = {
            winRate: { min: 70, max: 75 },
            profitFactor: { min: 1.6, max: 2.0 },
            maxDrawdown: { max: 20 },
            monthlyReturn: { min: 8, max: 12 }
        };
        const achievements = {
            winRateProgress: Math.min(100, (phaseSummary.avgWinRate / 70) * 100),
            targetAchievement: phaseSummary.daysAboveTarget / Math.max(1, phaseSummary.totalDaysActive) * 100,
            dataCollectionDays: phaseSummary.totalDaysActive,
            phase1Complete: phaseSummary.totalDaysActive >= 90 && phaseSummary.avgWinRate >= 70
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
    }
    catch (error) {
        logger_1.logger.error('Phase progress error:', error);
        res.status(500).json({
            error: 'Failed to fetch phase progress',
            code: 'PHASE_PROGRESS_ERROR'
        });
    }
});
//# sourceMappingURL=performance.js.map
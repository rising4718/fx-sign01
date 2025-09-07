export interface TradeRecord {
    symbol: string;
    entryTime: Date;
    exitTime?: Date;
    direction: 'LONG' | 'SHORT';
    boxHigh: number;
    boxLow: number;
    boxWidthPips: number;
    entrySession: 'EUROPE' | 'NY_EARLY';
    entryPrice: number;
    entryMethod?: 'RETEST' | 'DIRECT_BREAK';
    exitPrice?: number;
    exitReason?: 'TP_HIT' | 'SL_HIT' | 'TIME_STOP' | 'MANUAL';
    positionSize: number;
    stopLoss: number;
    takeProfit?: number;
    pnlPips?: number;
    pnlAmount?: number;
    riskRewardRatio?: number;
    atrD1?: number;
    spreadAtEntry?: number;
    volatilityRegime?: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface DailyPerformance {
    date: string;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    grossProfit: number;
    grossLoss: number;
    netProfit: number;
    profitFactor?: number;
    maxDrawdown?: number;
    maxDrawdownPercent?: number;
    sharpeRatio?: number;
}
export interface MarketEnvironment {
    date: string;
    atrD1Usdjpy?: number;
    atrD1Eurusd?: number;
    dailyRangeUsdjpy?: number;
    dailyRangeEurusd?: number;
    tokyoSessionRange?: number;
    europeSessionRange?: number;
    nySessionRange?: number;
    vixValue?: number;
    dxyClose?: number;
    nikkeiChangePercent?: number;
    spxChangePercent?: number;
    majorNewsEvents?: string[];
    economicCalendarImpact?: 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE';
}
export interface BacktestResult {
    testName: string;
    startDate: string;
    endDate: string;
    strategyVersion: string;
    parameters: Record<string, any>;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    netProfit: number;
    profitFactor?: number;
    maxDrawdown?: number;
    maxDrawdownPercent?: number;
    sharpeRatio?: number;
    sortinoRatio?: number;
    monthlyReturns?: number[];
    dailyEquityCurve?: Array<{
        date: string;
        equity: number;
    }>;
    notes?: string;
}
export declare class PerformanceTrackingService {
    private pool;
    constructor(databaseUrl: string);
    recordTrade(trade: TradeRecord): Promise<number>;
    updateTradeExit(tradeId: number, exitPrice: number, exitReason: TradeRecord['exitReason'], pnlPips?: number, pnlAmount?: number): Promise<void>;
    getDailyPerformance(startDate: string, endDate: string): Promise<DailyPerformance[]>;
    getCurrentPhaseSummary(): Promise<{
        phase: string;
        totalDaysActive: number;
        avgWinRate: number;
        avgDailyProfit: number;
        worstDrawdown: number;
        avgSharpeRatio: number;
        daysAboveTarget: number;
    }>;
    recordMarketEnvironment(environment: MarketEnvironment): Promise<void>;
    saveBacktestResult(result: BacktestResult): Promise<number>;
    getRecentBacktests(limit?: number): Promise<BacktestResult[]>;
    getPerformanceStats(days?: number): Promise<{
        totalTrades: number;
        winRate: number;
        avgDailyReturn: number;
        maxDrawdown: number;
        sharpeRatio: number;
        profitFactor: number;
        bestDay: number;
        worstDay: number;
        consecutiveWinStreak: number;
        consecutiveLossStreak: number;
    }>;
    close(): Promise<void>;
}
//# sourceMappingURL=performanceTrackingService.d.ts.map
import { TORBSignal } from '../types';
interface VirtualTrade {
    id: string;
    signal: TORBSignal;
    entryTime: Date;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    status: 'OPEN' | 'CLOSED' | 'STOPPED';
    exitTime?: Date;
    exitPrice?: number;
    exitReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TIME_STOP' | 'MANUAL';
    pnlPips?: number;
    pnlAmount?: number;
    maxHours: number;
}
export declare class AutoTradingService {
    private torbAnalysis;
    private performanceTracking;
    private fxDataService;
    private websocket;
    private activeTrades;
    private recentBreakouts;
    private isRunning;
    private monitoringInterval?;
    private readonly RISK_PER_TRADE;
    private readonly MAX_CONSECUTIVE_LOSSES;
    private readonly DAILY_DRAWDOWN_LIMIT;
    private readonly MAX_POSITIONS;
    private readonly MAX_TRADE_HOURS;
    constructor();
    startAutoTrading(symbol?: string): Promise<void>;
    stopAutoTrading(): void;
    private processTokyoBoxStrategy;
    private executeVirtualTrade;
    private monitorActiveTrades;
    private closeVirtualTrade;
    private calculateRSI;
    private getCurrentSession;
    private isValidTradingTime;
    private passesRiskChecks;
    getActiveTradesCount(): number;
    getActiveTrades(): VirtualTrade[];
}
export {};
//# sourceMappingURL=autoTradingService.d.ts.map
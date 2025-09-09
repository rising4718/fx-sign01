import { TORBRange, TORBSignal, CandleData } from '../types';
export declare class TORBAnalysisService {
    private fxDataService;
    private activeSignals;
    private torbRanges;
    constructor();
    private getJSTTime;
    private isTokyoTradingTime;
    private isTokyoBoxTime;
    private isBreakoutMonitoringTime;
    calculateTokyoBoxRange(symbol: string, date: string): Promise<TORBRange | null>;
    private calculateATRFilter;
    private validateATRFilter;
    private validateBoxWidth;
    getTORBRange(symbol: string, date: string): Promise<TORBRange | null>;
    checkBreakoutConditions(symbol: string, range: TORBRange, currentPrice: number, rsi: number, recentCandles: CandleData[]): Promise<TORBSignal | null>;
    checkRetestEntry(symbol: string, breakoutSignal: TORBSignal, current5mCandles: CandleData[]): Promise<TORBSignal | null>;
    getCurrentSignals(symbol: string): Promise<TORBSignal[]>;
    getTORBAnalysis(symbol: string): Promise<any>;
    calculateTORB(symbol: string, date: string): Promise<any>;
    getTORBHistory(symbol: string, days: number, limit: number): Promise<any>;
    getActiveSignalsCount(): number;
    clearOldSignals(): void;
}
//# sourceMappingURL=torbAnalysisService.d.ts.map
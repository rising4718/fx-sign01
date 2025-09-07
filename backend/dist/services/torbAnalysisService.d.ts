import { TORBRange, TORBSignal } from '../types';
export declare class TORBAnalysisService {
    private fxDataService;
    private activeSignals;
    private torbRanges;
    constructor();
    private getJSTTime;
    private isTokyoTradingTime;
    private isTORBRangeTime;
    private isTORBBreakoutTime;
    calculateTORBRange(symbol: string, date: string): Promise<TORBRange | null>;
    getTORBRange(symbol: string, date: string): Promise<TORBRange | null>;
    private checkBreakoutConditions;
    getCurrentSignals(symbol: string): Promise<TORBSignal[]>;
    getTORBAnalysis(symbol: string): Promise<any>;
    calculateTORB(symbol: string, date: string): Promise<any>;
    getTORBHistory(symbol: string, days: number, limit: number): Promise<any>;
    getActiveSignalsCount(): number;
    clearOldSignals(): void;
}
//# sourceMappingURL=torbAnalysisService.d.ts.map
import { Pool } from 'pg';
export interface PriceHistoryRecord {
    id?: number;
    symbol: string;
    bid: number;
    ask: number;
    spread: number;
    timestamp: Date;
    source: string;
}
export interface CandleDataRecord {
    id?: number;
    symbol: string;
    timeframe: '5m' | '15m';
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    closePrice: number;
    volume?: number;
    candleStart: Date;
    candleEnd: Date;
    source: string;
}
export interface APIStatsRecord {
    id?: number;
    date: Date;
    endpoint: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgResponseTimeMs: number;
    cacheHits: number;
    cacheMisses: number;
    dataPointsCollected: number;
}
export declare class HistoricalDataModel {
    private pool;
    constructor(pool: Pool);
    savePriceHistory(record: PriceHistoryRecord): Promise<number>;
    savePriceHistoryBatch(records: PriceHistoryRecord[]): Promise<number[]>;
    saveCandleData(record: CandleDataRecord): Promise<number>;
    getCandleData(symbol: string, timeframe: '5m' | '15m', limit?: number, before?: Date): Promise<CandleDataRecord[]>;
    getRecentPriceHistory(symbol: string, minutes?: number): Promise<PriceHistoryRecord[]>;
    updateAPIStats(stats: Partial<APIStatsRecord>): Promise<void>;
    cleanupOldData(retentionDays?: number): Promise<void>;
    getDatabaseStats(): Promise<{
        priceHistoryCount: number;
        candleDataCount: number;
        apiStatsCount: number;
        oldestPriceRecord: Date | null;
        newestPriceRecord: Date | null;
    }>;
}
//# sourceMappingURL=HistoricalData.d.ts.map
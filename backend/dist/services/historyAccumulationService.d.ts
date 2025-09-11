import { Pool } from 'pg';
export declare class HistoryAccumulationService {
    private pool;
    private fxDataService;
    private historicalDataModel;
    private priceCollectionJob;
    private candleCollectionJob;
    private cleanupJob;
    private isCollectingPrices;
    private isCollectingCandles;
    constructor(pool: Pool);
    start(): void;
    stop(): void;
    private collectCurrentPrices;
    private collectCandleData;
    private performCleanup;
    backfillHistoricalData(symbol: string, timeframe: '5m' | '15m', hours?: number): Promise<void>;
    getStatus(): {
        isRunning: boolean;
        isCollectingPrices: boolean;
        isCollectingCandles: boolean;
        nextPriceCollection: string | null;
        nextCandleCollection: string | null;
        nextCleanup: string | null;
    };
}
//# sourceMappingURL=historyAccumulationService.d.ts.map
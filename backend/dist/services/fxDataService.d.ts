import { FXPrice, CandleData } from '../types';
export declare class FXDataService {
    private gmoBaseURL;
    private alphaVantageBaseURL;
    private alphaVantageApiKey;
    private lastGMORequest;
    private lastAlphaVantageRequest;
    private cache;
    private readonly CACHE_DURATION;
    constructor();
    private isRateLimited;
    private getCachedData;
    private setCacheData;
    private fetchFromGMO;
    private fetchFromAlphaVantage;
    getCurrentPrice(symbol?: string): Promise<FXPrice>;
    getHistoricalData(symbol: string, timeframe: string, limit: number): Promise<CandleData[]>;
    getAPIStatus(): Promise<any>;
}
//# sourceMappingURL=fxDataService.d.ts.map
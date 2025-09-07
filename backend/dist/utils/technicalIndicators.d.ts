import { CandleData } from '../types';
export declare function calculateATR(candles: CandleData[], period?: number): number;
export declare function calculateRSI(prices: number[], period?: number): number;
export declare function findSwingLevels(candles: CandleData[], lookback?: number): {
    swingHigh: number | null;
    swingLow: number | null;
};
export declare function getCurrentSession(date?: Date): {
    name: 'tokyo' | 'london' | 'ny_early' | 'off';
    multiplier: number;
};
export declare function calculateMACDHistogram(prices: number[], fastPeriod?: number, slowPeriod?: number): number;
export declare function priceToPips(priceChange: number, symbol?: string): number;
export declare function pipsToPrice(pips: number, symbol?: string): number;
//# sourceMappingURL=technicalIndicators.d.ts.map
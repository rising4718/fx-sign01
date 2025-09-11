export interface FXPrice {
    symbol: string;
    bid: number;
    ask: number;
    spread: number;
    timestamp: Date;
    source: 'gmo' | 'alphavantage' | 'mock' | 'intelligent-generation';
}
export interface CandleData {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}
export interface TORBRange {
    startTime: Date;
    endTime: Date;
    high: number;
    low: number;
    range: number;
}
export interface TORBSignal {
    id: string;
    timestamp: Date;
    type: 'LONG' | 'SHORT';
    entryPrice: number;
    targetPrice: number;
    stopLoss: number;
    range: TORBRange;
    rsi: number;
    confidence: number;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    atr?: number;
    session?: 'tokyo' | 'london' | 'ny_early' | 'off';
    riskRewardRatio?: number;
}
export interface GMOTickerResponse {
    status: number;
    data: {
        symbol: string;
        timestamp: string;
        bid: string;
        ask: string;
        high: string;
        low: string;
        last: string;
    }[];
}
export interface AlphaVantageResponse {
    'Realtime Currency Exchange Rate': {
        '1. From_Currency Code': string;
        '2. From_Currency Name': string;
        '3. To_Currency Code': string;
        '4. To_Currency Name': string;
        '5. Exchange Rate': string;
        '6. Last Refreshed': string;
        '7. Time Zone': string;
        '8. Bid Price': string;
        '9. Ask Price': string;
    };
    'Error Message'?: string;
}
export interface WSMessage {
    type: 'PRICE_UPDATE' | 'TORB_SIGNAL' | 'CONNECTION_STATUS' | 'ERROR' | 'PONG' | 'SUBSCRIPTION_CONFIRMED';
    data: any;
    timestamp: Date;
}
export interface WSClient {
    id: string;
    ws: any;
    isAlive: boolean;
    lastPing: Date;
}
export interface APIConfig {
    gmo: {
        baseURL: string;
        endpoints: {
            ticker: string;
        };
        rateLimit: number;
    };
    alphavantage: {
        baseURL: string;
        apiKey: string;
        rateLimit: number;
    };
}
export declare class APIError extends Error {
    code: string;
    status?: number;
    source: string;
    constructor(message: string, code: string, status?: number, source?: string);
}
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
}
//# sourceMappingURL=index.d.ts.map
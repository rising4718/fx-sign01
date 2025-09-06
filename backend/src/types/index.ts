// FX Data Types
export interface FXPrice {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: Date;
  source: 'gmo' | 'alphavantage' | 'mock';
}

export interface CandleData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// TORB Analysis Types
export interface TORBRange {
  startTime: Date;
  endTime: Date;
  high: number;
  low: number;
  range: number; // in pips
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
  confidence: number; // 0-1
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

// API Response Types
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

// WebSocket Types
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

// Configuration Types
export interface APIConfig {
  gmo: {
    baseURL: string;
    endpoints: {
      ticker: string;
    };
    rateLimit: number; // requests per second
  };
  alphavantage: {
    baseURL: string;
    apiKey: string;
    rateLimit: number; // requests per minute
  };
}

// Error Types
export class APIError extends Error {
  code: string;
  status?: number;
  source: string;

  constructor(message: string, code: string, status?: number, source: string = 'unknown') {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.source = source;
  }
}

// Database Types (for future PostgreSQL integration)
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
import type { FXApiResponse, MarketData, CurrencyPair } from '../types';
import type { CandlestickData } from 'lightweight-charts';
import { CURRENCY_PAIRS } from '../constants/currencyPairs';

// Backend API設定
const BACKEND_API_BASE_URL = 'http://localhost:3002/api/v1';
const BACKEND_WS_URL = 'ws://localhost:3002/ws';
const DEFAULT_SYMBOL: CurrencyPair = 'USDJPY';

// Backend API レスポンス型
interface BackendApiResponse {
  success: boolean;
  data: any;
  timestamp: string;
  meta?: any;
}

// Backend FXPrice型
interface BackendFXPrice {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: string;
  source: 'gmo' | 'alphavantage' | 'mock';
}

// Backend CandleData型
interface BackendCandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// FX APIサービスクラス（Backend統合版）
export class FxApiService {
  private static instance: FxApiService;
  private lastUpdateTime: number = 0;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 1000; // 1秒キャッシュ（Backend側で1秒更新）
  private websocket: WebSocket | null = null;
  private wsReconnectTimeout: number | null = null;

  private constructor() {}

  public static getInstance(): FxApiService {
    if (!FxApiService.instance) {
      FxApiService.instance = new FxApiService();
    }
    return FxApiService.instance;
  }

  // Backend APIへのリクエスト共通処理
  private async makeBackendRequest(endpoint: string, params?: URLSearchParams): Promise<BackendApiResponse> {
    try {
      const url = params ? 
        `${BACKEND_API_BASE_URL}${endpoint}?${params.toString()}` : 
        `${BACKEND_API_BASE_URL}${endpoint}`;

      console.log(`Backend API Request: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // CORS設定
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Backend API Error: ${response.status} - ${response.statusText}`);
      }

      const data: BackendApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error(`Backend API returned error: ${JSON.stringify(data)}`);
      }

      console.log('Backend API Response received successfully');
      return data;

    } catch (error) {
      console.error('Backend API request failed:', error);
      throw error;
    }
  }

  // リアルタイム価格取得（Backend統合）
  async getCurrentPrice(symbol: CurrencyPair = DEFAULT_SYMBOL): Promise<MarketData> {
    console.log(`Backend API取得試行中: ${symbol}`);
    
    try {
      const cacheKey = `current_${symbol}`;
      const now = Date.now();

      // キャッシュチェック（1秒キャッシュ）
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (now - cached.timestamp < this.CACHE_DURATION) {
          console.log('キャッシュからデータを返却');
          return cached.data;
        }
      }

      // Backend APIから価格取得
      const params = new URLSearchParams({
        symbol: this.convertSymbolToBackend(symbol)
      });

      const response = await this.makeBackendRequest('/fx/ticker', params);
      const backendPrice: BackendFXPrice = response.data;
      
      // フロントエンド形式に変換
      const marketData = this.convertBackendPriceToMarketData(backendPrice, symbol);

      // キャッシュに保存
      this.cache.set(cacheKey, {
        data: marketData,
        timestamp: now
      });

      console.log(`Backend APIからデータ取得成功: ${marketData.price} (${backendPrice.source})`);
      return marketData;

    } catch (error) {
      console.error('Backend API接続失敗、フォールバック使用:', error);
      
      // フォールバック: モックデータを返す
      return this.getMockCurrentPrice(symbol);
    }
  }

  // 複数通貨ペアの価格を一括取得
  async getMultiplePrices(symbols: CurrencyPair[]): Promise<Map<CurrencyPair, MarketData>> {
    const results = new Map<CurrencyPair, MarketData>();
    
    // 並列処理で全通貨ペアの価格を取得
    const promises = symbols.map(async (symbol) => {
      try {
        const marketData = await this.getCurrentPrice(symbol);
        results.set(symbol, marketData);
      } catch (error) {
        console.error(`Failed to get price for ${symbol}:`, error);
        // エラーの場合はモックデータを使用
        const mockData = await this.getMockCurrentPrice(symbol);
        results.set(symbol, mockData);
      }
    });

    await Promise.all(promises);
    return results;
  }

  // 履歴データ取得（Backend統合）
  async getHistoricalData(
    symbol: CurrencyPair = DEFAULT_SYMBOL,
    interval: string = '15m',
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      console.log(`Backend Historical data requested for ${symbol}, interval: ${interval}, limit: ${limit}`);
      
      const params = new URLSearchParams({
        symbol: this.convertSymbolToBackend(symbol),
        timeframe: interval,
        limit: limit.toString()
      });

      const response = await this.makeBackendRequest('/fx/historical', params);
      const backendCandles: BackendCandleData[] = response.data;
      
      // フロントエンド形式に変換
      const candlestickData = backendCandles.map(candle => this.convertBackendCandleData(candle));
      
      console.log(`Backend Historical data received: ${candlestickData.length} candles`);
      return candlestickData;

    } catch (error) {
      console.error('Backend Historical Data Error:', error);
      return this.generateRealisticMockData(symbol, limit);
    }
  }

  // WebSocket接続（Backend統合）
  connectRealTimeUpdates(callback: (data: MarketData) => void): void {
    console.log('WebSocket接続を開始...');
    
    try {
      this.websocket = new WebSocket(BACKEND_WS_URL);
      
      this.websocket.onopen = () => {
        console.log('WebSocket接続成功');
        
        // 価格更新の購読
        this.websocket?.send(JSON.stringify({
          type: 'SUBSCRIBE_PRICE',
          data: { symbol: 'USD/JPY' }
        }));
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message.type);
          
          switch (message.type) {
            case 'PRICE_UPDATE':
              const backendPrice: BackendFXPrice = message.data;
              const marketData = this.convertBackendPriceToMarketData(backendPrice, 'USDJPY');
              callback(marketData);
              break;
            case 'CONNECTION_STATUS':
              console.log('WebSocket status:', message.data);
              break;
            case 'ERROR':
              console.error('WebSocket error:', message.data);
              break;
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket接続が閉じられました。再接続を試行します...');
        this.scheduleWebSocketReconnect(callback);
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('WebSocket接続失敗、ポーリングにフォールバック:', error);
      this.startPollingFallback(callback);
    }
  }

  // WebSocket再接続
  private scheduleWebSocketReconnect(callback: (data: MarketData) => void): void {
    if (this.wsReconnectTimeout) {
      clearTimeout(this.wsReconnectTimeout);
    }
    
    this.wsReconnectTimeout = setTimeout(() => {
      console.log('WebSocket再接続試行中...');
      this.connectRealTimeUpdates(callback);
    }, 5000); // 5秒後に再接続
  }

  // ポーリングフォールバック
  private startPollingFallback(callback: (data: MarketData) => void): void {
    console.log('ポーリングフォールバック開始（1秒間隔）');
    
    const interval = setInterval(async () => {
      try {
        const marketData = await this.getCurrentPrice();
        callback(marketData);
      } catch (error) {
        console.error('Polling update error:', error);
      }
    }, 1000); // 1秒ごと（Backend更新頻度に合わせる）

    // クリーンアップ用
    (window as any).__fxApiPollingInterval = interval;
  }

  disconnectRealTimeUpdates(): void {
    // WebSocket切断
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    // 再接続タイマー停止
    if (this.wsReconnectTimeout) {
      clearTimeout(this.wsReconnectTimeout);
      this.wsReconnectTimeout = null;
    }
    
    // ポーリング停止
    if ((window as any).__fxApiPollingInterval) {
      clearInterval((window as any).__fxApiPollingInterval);
      (window as any).__fxApiPollingInterval = null;
    }
    
    console.log('リアルタイム更新を停止しました');
  }

  // Backend形式への変換
  private convertSymbolToBackend(symbol: CurrencyPair): string {
    // フロントエンド形式 'USDJPY' → Backend形式 'USD/JPY'
    switch (symbol) {
      case 'USDJPY': return 'USD/JPY';
      case 'EURUSD': return 'EUR/USD';
      case 'GBPUSD': return 'GBP/USD';
      case 'AUDUSD': return 'AUD/USD';
      default: return 'USD/JPY';
    }
  }

  // Backend価格データをフロントエンド形式に変換
  private convertBackendPriceToMarketData(backendPrice: BackendFXPrice, symbol: CurrencyPair): MarketData {
    // 前回価格と比較して変化を計算
    const cacheKey = `previous_${symbol}`;
    const previousPrice = this.cache.get(cacheKey)?.price || backendPrice.ask;
    const change = backendPrice.ask - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

    // 現在価格をキャッシュに保存（変化計算用）
    this.cache.set(cacheKey, { price: backendPrice.ask });

    const pairInfo = CURRENCY_PAIRS[symbol];
    
    return {
      symbol,
      price: Number(backendPrice.ask.toFixed(pairInfo.decimalPlaces)),
      timestamp: backendPrice.timestamp,
      change: Number(change.toFixed(pairInfo.decimalPlaces)),
      changePercent: Number(changePercent.toFixed(2))
    };
  }

  // BackendキャンドルデータをLightweightCharts形式に変換
  private convertBackendCandleData(backendCandle: BackendCandleData): CandlestickData {
    return {
      time: Math.floor(new Date(backendCandle.timestamp).getTime() / 1000) as any,
      open: backendCandle.open,
      high: backendCandle.high,
      low: backendCandle.low,
      close: backendCandle.close,
    };
  }

  // モックデータ生成（フォールバック用）
  private async getMockCurrentPrice(symbol: CurrencyPair): Promise<MarketData> {
    const cacheKey = `mock_${symbol}`;
    const now = Date.now();
    
    // 通貨ペア別の基準価格設定
    const pairInfo = CURRENCY_PAIRS[symbol];
    let basePrice: number;
    
    switch (symbol) {
      case 'USDJPY':
        basePrice = 150.0;
        break;
      case 'EURUSD':
        basePrice = 1.0800;
        break;
      case 'GBPUSD':
        basePrice = 1.2600;
        break;
      case 'AUDUSD':
        basePrice = 0.6700;
        break;
      default:
        basePrice = 1.0000;
    }
    
    let trend = 0;
    
    // 前回のモックデータがあれば継続的な価格変動を生成
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      basePrice = cached.data.price;
      
      // 時間による価格変動パターン
      const hour = new Date().getHours();
      if (hour >= 9 && hour <= 11) {
        // 東京時間: より活発な動き
        trend = (Math.random() - 0.5) * 0.003;
      } else if (hour >= 16 && hour <= 18) {
        // ロンドン時間: 中程度の動き
        trend = (Math.random() - 0.5) * 0.002;
      } else {
        // その他: 小さな動き
        trend = (Math.random() - 0.5) * 0.001;
      }
    }
    
    const volatility = 0.001;
    const randomChange = trend + (Math.random() - 0.5) * volatility;
    const newPrice = basePrice + randomChange;
    
    // 通貨ペア別の価格制限
    let limitedPrice: number;
    switch (symbol) {
      case 'USDJPY':
        limitedPrice = Math.max(145.0, Math.min(155.0, newPrice));
        break;
      case 'EURUSD':
        limitedPrice = Math.max(1.0500, Math.min(1.1200, newPrice));
        break;
      case 'GBPUSD':
        limitedPrice = Math.max(1.2000, Math.min(1.3200, newPrice));
        break;
      case 'AUDUSD':
        limitedPrice = Math.max(0.6200, Math.min(0.7200, newPrice));
        break;
      default:
        limitedPrice = newPrice;
    }
    
    const change = limitedPrice - basePrice;
    const changePercent = (change / basePrice) * 100;

    const marketData: MarketData = {
      symbol,
      price: Number(limitedPrice.toFixed(pairInfo.decimalPlaces)),
      timestamp: new Date().toISOString(),
      change: Number(change.toFixed(pairInfo.decimalPlaces)),
      changePercent: Number(changePercent.toFixed(2))
    };

    // モックデータもキャッシュに保存
    this.cache.set(cacheKey, {
      data: marketData,
      timestamp: now
    });

    console.log(`フォールバックモックデータ生成: ${marketData.price} (変化: ${change.toFixed(3)})`);
    return marketData;
  }

  // リアルなモックデータ生成（フォールバック用）
  private generateRealisticMockData(symbol: CurrencyPair, count: number): CandlestickData[] {
    const data: CandlestickData[] = [];
    const pairInfo = CURRENCY_PAIRS[symbol];
    
    // 通貨ペア別の基準価格設定
    let basePrice: number;
    switch (symbol) {
      case 'USDJPY':
        basePrice = 150.0;
        break;
      case 'EURUSD':
        basePrice = 1.0800;
        break;
      case 'GBPUSD':
        basePrice = 1.2600;
        break;
      case 'AUDUSD':
        basePrice = 0.6700;
        break;
      default:
        basePrice = 1.0000;
    }
    
    const now = new Date();
    
    // 通貨ペア別の取引開始時刻設定
    const sessionTimes = pairInfo.sessionTimes;
    const currentHour = now.getUTCHours(); // UTC時間を使用
    
    let startTime: Date;
    if (currentHour >= sessionTimes.rangeStartHour) {
      // 今日のセッション開始時刻から
      startTime = new Date(now);
      startTime.setUTCHours(sessionTimes.rangeStartHour, sessionTimes.rangeStartMinute, 0, 0);
    } else {
      // 前日のセッション開始時刻から
      startTime = new Date(now);
      startTime.setUTCDate(startTime.getUTCDate() - 1);
      startTime.setUTCHours(sessionTimes.rangeStartHour, sessionTimes.rangeStartMinute, 0, 0);
    }

    let currentPrice = basePrice;
    
    for (let i = 0; i < count; i++) {
      const time = new Date(startTime.getTime() + i * 15 * 60 * 1000); // 15分間隔
      
      // 東京時間（9:00-11:00）での特別な動き
      const tokyoOffset = 9 * 60 * 60 * 1000; // UTC+9
      const tokyoHour = new Date(time.getTime() + tokyoOffset).getHours();
      const tokyoMinute = new Date(time.getTime() + tokyoOffset).getMinutes();
      
      let volatility = 0.001; // 基本ボラティリティ
      let trend = 0;
      
      // 東京時間の動きを模擬
      if (tokyoHour >= 9 && tokyoHour < 11) {
        volatility *= 1.5; // 東京時間は活発
        
        // 9:00-9:45 レンジ形成
        if (tokyoHour === 9 && tokyoMinute < 45) {
          volatility *= 0.8; // レンジ内での動き
          trend = 0;
        }
        // 9:45以降 ブレイクアウト可能性
        else if (tokyoHour === 9 && tokyoMinute >= 45) {
          if (Math.random() > 0.7) {
            trend = (Math.random() > 0.5 ? 1 : -1) * 0.002; // ブレイクアウト
          }
        }
      }

      const open = currentPrice;
      const change = trend + (Math.random() - 0.5) * volatility;
      const close = open + change;
      
      // 高値・安値の計算
      const range = Math.abs(change) * (1 + Math.random());
      const high = Math.max(open, close) + range * Math.random() * 0.5;
      const low = Math.min(open, close) - range * Math.random() * 0.5;
      
      data.push({
        time: Math.floor(time.getTime() / 1000) as any,
        open: Number(open.toFixed(pairInfo.decimalPlaces)),
        high: Number(high.toFixed(pairInfo.decimalPlaces)),
        low: Number(low.toFixed(pairInfo.decimalPlaces)),
        close: Number(close.toFixed(pairInfo.decimalPlaces)),
      });
      
      currentPrice = close;
    }

    return data;
  }
}

// シングルトンインスタンスのエクスポート
export const fxApiService = FxApiService.getInstance();
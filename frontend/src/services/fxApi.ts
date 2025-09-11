import type { FXApiResponse, MarketData, CurrencyPair } from '../types';
import type { CandlestickData } from 'lightweight-charts';
import { CURRENCY_PAIRS } from '../constants/currencyPairs';
import { cacheService } from './cacheService';

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
  private readonly CACHE_DURATION = 500; // 🚀 Phase 4: 500ms高速キャッシュ（プロ仕様）
  private websocket: WebSocket | null = null;
  private wsReconnectTimeout: number | null = null;
  private performanceMetrics = {
    requestCount: 0,
    averageLatency: 0,
    successRate: 100
  };

  private constructor() {}

  public static getInstance(): FxApiService {
    if (!FxApiService.instance) {
      FxApiService.instance = new FxApiService();
    }
    return FxApiService.instance;
  }

  // 🚀 Phase 4: パフォーマンス監視機能
  private trackPerformance(startTime: number, success: boolean) {
    const latency = Date.now() - startTime;
    this.performanceMetrics.requestCount++;
    
    // 移動平均でレイテンシ計算
    this.performanceMetrics.averageLatency = 
      (this.performanceMetrics.averageLatency * 0.9) + (latency * 0.1);
    
    // 成功率計算
    if (success) {
      this.performanceMetrics.successRate = 
        (this.performanceMetrics.successRate * 0.95) + (100 * 0.05);
    } else {
      this.performanceMetrics.successRate = 
        (this.performanceMetrics.successRate * 0.95) + (0 * 0.05);
    }

    if (latency > 100) {
      console.warn(`⚠️ [Phase 4] 高レイテンシ検出: ${latency}ms`);
    }
  }

  // Backend APIへのリクエスト共通処理（パフォーマンス最適化）
  private async makeBackendRequest(endpoint: string, params?: URLSearchParams): Promise<BackendApiResponse> {
    const startTime = Date.now();
    
    try {
      const url = params ? 
        `${BACKEND_API_BASE_URL}${endpoint}?${params.toString()}` : 
        `${BACKEND_API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        this.trackPerformance(startTime, false);
        throw new Error(`Backend API Error: ${response.status} - ${response.statusText}`);
      }

      this.trackPerformance(startTime, true);

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

  // リアルタイム価格取得（キャッシュ統合版）
  async getCurrentPrice(symbol: CurrencyPair = DEFAULT_SYMBOL): Promise<MarketData> {
    console.log(`💰 [Price API] リアルタイム価格取得開始: ${symbol}`);
    
    try {
      // 1. 高性能キャッシュから取得試行
      const cachedData = await cacheService.getCachedCurrentPrice(symbol);
      if (cachedData) {
        console.log(`🚀 [Price Cache Hit] キャッシュからデータ返却: ${symbol}`);
        return cachedData;
      }

      // 2. Backend APIから価格取得
      const params = new URLSearchParams({
        symbol: this.convertSymbolToBackend(symbol)
      });

      const response = await this.makeBackendRequest('/fx/ticker', params);
      const backendPrice: BackendFXPrice = response.data;
      
      // 3. フロントエンド形式に変換
      const marketData = this.convertBackendPriceToMarketData(backendPrice, symbol);

      // 4. 高性能キャッシュに保存
      await cacheService.cacheCurrentPrice(symbol, marketData);

      console.log(`✅ [Price API] Backend APIからデータ取得・キャッシュ保存完了: ${marketData.price} (${backendPrice.source})`);
      return marketData;

    } catch (error) {
      console.error('❌ [Price API] GMO Backend API接続失敗:', error);
      throw new Error(`GMOコインAPIから価格データを取得できませんでした: ${error}`);
    }
  }

  // 複数通貨ペアの価格を一括取得
  async getMultiplePrices(symbols: CurrencyPair[]): Promise<Map<CurrencyPair, MarketData>> {
    const results = new Map<CurrencyPair, MarketData>();
    
    // 並列処理で全通貨ペアの価格を取得
    const promises = symbols.map(async (symbol) => {
      const marketData = await this.getCurrentPrice(symbol);
      results.set(symbol, marketData);
    });

    await Promise.all(promises);
    return results;
  }

  // 履歴データ取得（インテリジェントキャッシュ統合版）
  async getHistoricalData(
    symbol: CurrencyPair = DEFAULT_SYMBOL,
    interval: string = '15m',
    limit: number = 100
  ): Promise<CandlestickData[]> {
    const timeframe = interval as '5m' | '15m';
    console.log(`📊 [Candle API] 履歴データ取得開始: ${symbol}, ${timeframe}, limit: ${limit}`);
    
    try {
      // 1. キャッシュから取得試行
      const cachedCandles = await cacheService.getCachedCandleData(symbol, timeframe);
      
      // 2. 差分更新が必要か確認
      const shouldFetchNew = await cacheService.shouldFetchNewCandles(symbol, timeframe);
      
      if (cachedCandles && !shouldFetchNew) {
        console.log(`🚀 [Candle Cache Hit] キャッシュからデータ返却: ${symbol} ${timeframe} (${cachedCandles.length}本)`);
        return cachedCandles.slice(-limit); // 指定の本数に制限
      }

      // 3. Backend APIから履歴データ取得
      console.log(`🔄 [Candle API] Backend APIから新データ取得: ${symbol} ${timeframe}`);
      const params = new URLSearchParams({
        symbol: this.convertSymbolToBackend(symbol),
        timeframe: interval,
        limit: limit.toString()
      });

      const response = await this.makeBackendRequest('/fx/historical', params);
      const backendCandles: BackendCandleData[] = response.data;
      
      console.log(`🔍 [Candle API] Raw backend data sample:`, backendCandles.slice(0, 3));
      
      // 4. フロントエンド形式に変換
      const candlestickData = backendCandles.map((candle, index) => {
        const converted = this.convertBackendCandleData(candle);
        if (index < 3) {
          const timeValue = typeof converted.time === 'number' ? converted.time : Date.now() / 1000;
          const displayTime = new Date(timeValue * 1000);
          console.log(`🔄 [Candle API ${index}] Backend: ${candle.timestamp} → Unix: ${timeValue} → Display: ${displayTime.getHours().toString().padStart(2, '0')}:${displayTime.getMinutes().toString().padStart(2, '0')}`);
        }
        return converted;
      });

      // 5. キャッシュに保存
      if (candlestickData.length > 0) {
        await cacheService.cacheCandleData(symbol, timeframe, candlestickData);
        console.log(`✅ [Candle Cache] データ保存完了: ${symbol} ${timeframe} (${candlestickData.length}本)`);
      }
      
      console.log(`✅ [Candle API] Backend履歴データ取得完了: ${candlestickData.length} candles`);
      return candlestickData;

    } catch (error) {
      // エラー時にキャッシュからフォールバック
      const cachedCandles = await cacheService.getCachedCandleData(symbol, timeframe);
      if (cachedCandles) {
        console.warn(`⚠️ [Candle Fallback] APIエラーのためキャッシュデータ使用: ${symbol} ${timeframe}`);
        return cachedCandles.slice(-limit);
      }
      
      console.error('❌ [Candle API] GMO Backend API履歴データ取得失敗:', error);
      throw new Error(`GMOコインAPIから履歴データを取得できませんでした: ${error}`);
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
      console.error('GMO WebSocket接続失敗:', error);
      throw new Error(`GMOコインWebSocket接続に失敗しました: ${error}`);
    }
  }

  // WebSocket再接続
  private scheduleWebSocketReconnect(callback: (data: MarketData) => void): void {
    if (this.wsReconnectTimeout) {
      clearTimeout(this.wsReconnectTimeout);
    }
    
    this.wsReconnectTimeout = window.setTimeout(() => {
      console.log('WebSocket再接続試行中...');
      this.connectRealTimeUpdates(callback);
    }, 5000); // 5秒後に再接続
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

  // 🚀 Phase 4: リアルタイムパフォーマンス監視API
  getRealtimePerformance() {
    return {
      ...this.performanceMetrics,
      timestamp: Date.now(),
      status: this.performanceMetrics.averageLatency < 100 ? 'excellent' : 
              this.performanceMetrics.averageLatency < 200 ? 'good' : 
              this.performanceMetrics.averageLatency < 500 ? 'fair' : 'poor'
    };
  }

  // パフォーマンス関連API
  async getPerformanceSummary(days: number = 30): Promise<any> {
    try {
      const params = new URLSearchParams({ days: days.toString() });
      const response = await this.makeBackendRequest('/performance/summary', params);
      return response;
    } catch (error) {
      console.error('Performance summary fetch error:', error);
      throw error;
    }
  }

  async getPerformanceDaily(days: number = 30): Promise<any> {
    try {
      const params = new URLSearchParams({ days: days.toString() });
      const response = await this.makeBackendRequest('/performance/daily', params);
      return response;
    } catch (error) {
      console.error('Performance daily fetch error:', error);
      throw error;
    }
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
      bid: Number(backendPrice.bid.toFixed(pairInfo.decimalPlaces)),
      ask: Number(backendPrice.ask.toFixed(pairInfo.decimalPlaces)),
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

}

// シングルトンインスタンスのエクスポート
export const fxApiService = FxApiService.getInstance();
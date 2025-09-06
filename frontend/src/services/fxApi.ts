import type { OHLCData, FXApiResponse, MarketData, CurrencyPair } from '../types';
import type { CandlestickData } from 'lightweight-charts';
import { CURRENCY_PAIRS } from '../constants/currencyPairs';

// FX API設定
const FX_API_BASE_URL = 'https://api.freeforexapi.com/v1';
const DEFAULT_SYMBOL: CurrencyPair = 'USDJPY';

// FreeForexAPI レスポンス型
interface FreeForexApiResponse {
  rates: {
    [key: string]: {
      rate: number;
      timestamp: number;
    };
  };
}

// FX APIサービスクラス
export class FxApiService {
  private static instance: FxApiService;
  private lastUpdateTime: number = 0;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 60000; // 1分間キャッシュ

  private constructor() {}

  public static getInstance(): FxApiService {
    if (!FxApiService.instance) {
      FxApiService.instance = new FxApiService();
    }
    return FxApiService.instance;
  }

  // リアルタイム価格取得（複数通貨ペア対応）
  async getCurrentPrice(symbol: CurrencyPair = DEFAULT_SYMBOL): Promise<MarketData> {
    console.log(`API取得試行中: ${symbol}`);
    
    try {
      const cacheKey = `current_${symbol}`;
      const now = Date.now();

      // キャッシュチェック
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (now - cached.timestamp < this.CACHE_DURATION) {
          console.log('キャッシュからデータを返却');
          return cached.data;
        }
      }

      console.log('外部APIからデータ取得試行中...');
      
      // FreeForexAPIは制限が厳しいため、すぐにモックに切り替え
      throw new Error('外部API使用を一時停止（モックデータを使用）');

      /* 
      // 実際のAPI呼び出し（必要に応じて有効化）
      const response = await fetch(`${FX_API_BASE_URL}/latest?base=USD&symbols=JPY`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data: FreeForexApiResponse = await response.json();
      
      if (!data.rates || !data.rates.USDJPY) {
        throw new Error('Invalid API response format');
      }

      const rate = data.rates.USDJPY;
      const price = 1 / rate.rate; // USD/JPY レートに変換
      
      // 前回の価格と比較して変化を計算
      const previousPrice = this.cache.get(cacheKey)?.data?.price || price;
      const change = price - previousPrice;
      const changePercent = (change / previousPrice) * 100;

      const marketData: MarketData = {
        symbol,
        price: Number(price.toFixed(3)),
        timestamp: new Date(rate.timestamp * 1000).toISOString(),
        change: Number(change.toFixed(3)),
        changePercent: Number(changePercent.toFixed(2))
      };

      // キャッシュに保存
      this.cache.set(cacheKey, {
        data: marketData,
        timestamp: now
      });

      console.log('外部APIからデータ取得成功');
      return marketData;
      */

    } catch (error) {
      console.log('外部API使用不可、モックデータを使用:', error.message);
      
      // フォールバック: リアルなモックデータを返す
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

  // 履歴データ取得（モック実装）
  async getHistoricalData(
    symbol: CurrencyPair = DEFAULT_SYMBOL,
    interval: string = '15m',
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      // 実際のAPIではhistorical dataは有料プランが必要な場合が多い
      // ここではモックデータを返す
      console.log(`Historical data requested for ${symbol}, interval: ${interval}, limit: ${limit}`);
      
      return this.generateRealisticMockData(symbol, limit);

    } catch (error) {
      console.error('Historical Data Error:', error);
      return this.generateRealisticMockData(symbol, limit);
    }
  }

  // モックデータ生成（現在価格ベース）
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

    console.log(`モックデータ生成: ${marketData.price} (変化: ${change.toFixed(3)})`);
    return marketData;
  }

  // リアルなモックデータ生成
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

  // WebSocket接続（将来の拡張用）
  private websocket: WebSocket | null = null;
  
  connectRealTimeUpdates(callback: (data: MarketData) => void): void {
    // 現時点ではポーリングで実装
    const interval = setInterval(async () => {
      try {
        const marketData = await this.getCurrentPrice();
        callback(marketData);
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    }, 30000); // 30秒ごと

    // クリーンアップ用
    (window as any).__fxApiPollingInterval = interval;
  }

  disconnectRealTimeUpdates(): void {
    if ((window as any).__fxApiPollingInterval) {
      clearInterval((window as any).__fxApiPollingInterval);
      (window as any).__fxApiPollingInterval = null;
    }
  }
}

// シングルトンインスタンスのエクスポート
export const fxApiService = FxApiService.getInstance();
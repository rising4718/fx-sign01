import type { CandlestickData } from 'lightweight-charts';
import type { CurrencyPair, MarketData } from '../types';

// キャッシュエントリー型定義
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

interface CandleDataCache {
  symbol: CurrencyPair;
  timeframe: '5m' | '15m';
  candles: CandlestickData[];
  lastUpdated: number;
  nextExpectedCandle: number; // 次のローソク足の期待時刻
}

// キャッシュ設定
const CACHE_CONFIG = {
  // TTL設定（ミリ秒）
  PRICE_TTL: 2000,        // 価格: 2秒
  CANDLES_5M_TTL: 300000, // 5分足: 5分
  CANDLES_15M_TTL: 900000, // 15分足: 15分
  USER_SETTINGS_TTL: 86400000, // ユーザー設定: 24時間
  
  // キャッシュ容量制限
  MAX_CANDLES_PER_SYMBOL: 1000,
  MAX_PRICE_HISTORY: 100,
  
  // バージョン管理
  CACHE_VERSION: '3.0.0',
  
  // IndexedDB設定
  DB_NAME: 'FxSignCache',
  DB_VERSION: 1,
  STORES: {
    CANDLES: 'candleData',
    PRICES: 'priceData',
    SETTINGS: 'userSettings'
  }
} as const;

/**
 * 高性能キャッシュサービス
 * - localStorage: 軽量データ（設定、認証）
 * - IndexedDB: 大容量データ（チャートデータ）
 * - sessionStorage: セッション固有データ
 * - Memory Cache: 超高速アクセス
 */
export class CacheService {
  private static instance: CacheService;
  private memoryCache = new Map<string, CacheEntry<any>>();
  private dbConnection: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * 初期化（IndexedDB接続）
   */
  private async initDB(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.DB_VERSION);
      
      request.onerror = () => {
        console.error('IndexedDB初期化エラー:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.dbConnection = request.result;
        console.log('✅ IndexedDB初期化成功');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // キャンドルデータストア
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.CANDLES)) {
          const candleStore = db.createObjectStore(CACHE_CONFIG.STORES.CANDLES, { keyPath: 'key' });
          candleStore.createIndex('symbol', 'symbol', { unique: false });
          candleStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // 価格データストア
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.PRICES)) {
          const priceStore = db.createObjectStore(CACHE_CONFIG.STORES.PRICES, { keyPath: 'key' });
          priceStore.createIndex('symbol', 'symbol', { unique: false });
        }
        
        // ユーザー設定ストア
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.SETTINGS)) {
          db.createObjectStore(CACHE_CONFIG.STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  // =============================================================================
  // 💰 価格データキャッシュ
  // =============================================================================

  /**
   * 現在価格をキャッシュに保存
   */
  async cacheCurrentPrice(symbol: CurrencyPair, marketData: MarketData): Promise<void> {
    const key = `price_${symbol}`;
    const entry: CacheEntry<MarketData> = {
      data: marketData,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.PRICE_TTL,
      version: CACHE_CONFIG.CACHE_VERSION
    };

    // メモリキャッシュに保存（高速アクセス用）
    this.memoryCache.set(key, entry);

    // localStorageに最新価格を保存（永続化）
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('localStorage保存エラー:', error);
    }
  }

  /**
   * キャッシュから現在価格を取得
   */
  async getCachedCurrentPrice(symbol: CurrencyPair): Promise<MarketData | null> {
    const key = `price_${symbol}`;
    
    // 1. メモリキャッシュから取得（最速）
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      console.log(`💨 Memory cache hit: ${symbol} price`);
      return memoryEntry.data;
    }

    // 2. localStorageから取得
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const entry: CacheEntry<MarketData> = JSON.parse(cached);
        if (this.isValidEntry(entry)) {
          // メモリキャッシュに復元
          this.memoryCache.set(key, entry);
          console.log(`💾 LocalStorage cache hit: ${symbol} price`);
          return entry.data;
        }
      }
    } catch (error) {
      console.warn('localStorage読み込みエラー:', error);
    }

    return null;
  }

  // =============================================================================
  // 📊 チャートデータキャッシュ（高度な時間管理）
  // =============================================================================

  /**
   * キャンドルデータをキャッシュに保存
   */
  async cacheCandleData(
    symbol: CurrencyPair, 
    timeframe: '5m' | '15m', 
    candles: CandlestickData[]
  ): Promise<void> {
    await this.initDB();
    if (!this.dbConnection) return;

    const key = `candles_${symbol}_${timeframe}`;
    const now = Date.now();
    const intervalMs = timeframe === '5m' ? 300000 : 900000; // 5分 or 15分
    
    const cacheData: CandleDataCache = {
      symbol,
      timeframe,
      candles: candles.slice(-CACHE_CONFIG.MAX_CANDLES_PER_SYMBOL), // 最新1000本に制限
      lastUpdated: now,
      nextExpectedCandle: this.calculateNextCandleTime(candles, intervalMs)
    };

    try {
      const transaction = this.dbConnection.transaction([CACHE_CONFIG.STORES.CANDLES], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.STORES.CANDLES);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          key,
          symbol,
          timeframe,
          data: cacheData,
          timestamp: now,
          version: CACHE_CONFIG.CACHE_VERSION
        });
        
        request.onsuccess = () => {
          console.log(`💾 Cached ${candles.length} candles for ${symbol} ${timeframe}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      console.error('IndexedDBキャンドルデータ保存エラー:', error);
    }
  }

  /**
   * キャッシュからキャンドルデータを取得
   */
  async getCachedCandleData(
    symbol: CurrencyPair, 
    timeframe: '5m' | '15m'
  ): Promise<CandlestickData[] | null> {
    await this.initDB();
    if (!this.dbConnection) return null;

    const key = `candles_${symbol}_${timeframe}`;
    
    try {
      const transaction = this.dbConnection.transaction([CACHE_CONFIG.STORES.CANDLES], 'readonly');
      const store = transaction.objectStore(CACHE_CONFIG.STORES.CANDLES);
      
      return new Promise<CandlestickData[] | null>((resolve, reject) => {
        const request = store.get(key);
        
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          const cacheData: CandleDataCache = result.data;
          const now = Date.now();
          
          // TTL確認
          const ttl = timeframe === '5m' ? CACHE_CONFIG.CANDLES_5M_TTL : CACHE_CONFIG.CANDLES_15M_TTL;
          if (now - cacheData.lastUpdated > ttl) {
            console.log(`⏰ Cache expired for ${symbol} ${timeframe}`);
            resolve(null);
            return;
          }

          console.log(`💾 Cache hit: ${symbol} ${timeframe} (${cacheData.candles.length} candles)`);
          resolve(cacheData.candles);
        };
        
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      console.error('IndexedDBキャンドルデータ取得エラー:', error);
      return null;
    }
  }

  /**
   * 差分更新の必要性を判定
   */
  async shouldFetchNewCandles(
    symbol: CurrencyPair, 
    timeframe: '5m' | '15m'
  ): Promise<boolean> {
    const cachedData = await this.getCachedCandleData(symbol, timeframe);
    if (!cachedData || cachedData.length === 0) {
      return true; // キャッシュなし → 全取得
    }

    const now = Date.now();
    const intervalMs = timeframe === '5m' ? 300000 : 900000;
    const lastCandle = cachedData[cachedData.length - 1];
    const lastCandleTime = typeof lastCandle.time === 'number' 
      ? lastCandle.time * 1000
      : typeof lastCandle.time === 'string'
      ? new Date(lastCandle.time).getTime()
      : new Date().getTime();
    
    // 次のローソク足の時間を過ぎているか確認
    const nextExpectedTime = this.alignToInterval(lastCandleTime + intervalMs, intervalMs);
    
    return now >= nextExpectedTime;
  }

  // =============================================================================
  // ⚙️ ユーザー設定キャッシュ
  // =============================================================================

  /**
   * ユーザー設定をキャッシュに保存
   */
  async cacheUserSettings(settings: Record<string, any>): Promise<void> {
    const entry: CacheEntry<Record<string, any>> = {
      data: settings,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.USER_SETTINGS_TTL,
      version: CACHE_CONFIG.CACHE_VERSION
    };

    try {
      localStorage.setItem('user_settings', JSON.stringify(entry));
    } catch (error) {
      console.warn('ユーザー設定保存エラー:', error);
    }
  }

  /**
   * キャッシュからユーザー設定を取得
   */
  async getCachedUserSettings(): Promise<Record<string, any> | null> {
    try {
      const cached = localStorage.getItem('user_settings');
      if (cached) {
        const entry: CacheEntry<Record<string, any>> = JSON.parse(cached);
        if (this.isValidEntry(entry)) {
          return entry.data;
        }
      }
    } catch (error) {
      console.warn('ユーザー設定取得エラー:', error);
    }
    return null;
  }

  // =============================================================================
  // 🧹 キャッシュ管理・ユーティリティ
  // =============================================================================

  /**
   * キャッシュエントリーの有効性を確認
   */
  private isValidEntry<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    return now < entry.expiresAt && entry.version === CACHE_CONFIG.CACHE_VERSION;
  }

  /**
   * 次のローソク足完成時刻を計算
   */
  private calculateNextCandleTime(candles: CandlestickData[], intervalMs: number): number {
    if (candles.length === 0) return Date.now() + intervalMs;
    
    const lastCandle = candles[candles.length - 1];
    const lastTime = typeof lastCandle.time === 'number' 
      ? lastCandle.time * 1000
      : typeof lastCandle.time === 'string'
      ? new Date(lastCandle.time).getTime()
      : new Date().getTime();
    
    return this.alignToInterval(lastTime + intervalMs, intervalMs);
  }

  /**
   * 時間を指定間隔に合わせる（5分・15分境界に調整）
   */
  private alignToInterval(timestamp: number, intervalMs: number): number {
    return Math.ceil(timestamp / intervalMs) * intervalMs;
  }

  /**
   * 期限切れキャッシュをクリーンアップ
   */
  async cleanupExpiredCache(): Promise<void> {
    const now = Date.now();
    
    // メモリキャッシュクリーンアップ
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }

    // localStorageクリーンアップ
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('price_')) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '{}');
          if (now >= entry.expiresAt) {
            keysToRemove.push(key);
          }
        } catch (error) {
          keysToRemove.push(key); // 破損データも削除
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`🧹 Cleaned up ${keysToRemove.length} expired cache entries`);
  }

  /**
   * 全キャッシュをクリア
   */
  async clearAllCache(): Promise<void> {
    // メモリキャッシュクリア
    this.memoryCache.clear();
    
    // localStorageキャッシュクリア
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('price_') || key === 'user_settings')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // IndexedDBクリア
    if (this.dbConnection) {
      try {
        const stores = [CACHE_CONFIG.STORES.CANDLES, CACHE_CONFIG.STORES.PRICES, CACHE_CONFIG.STORES.SETTINGS];
        const transaction = this.dbConnection.transaction(stores, 'readwrite');
        
        for (const storeName of stores) {
          const store = transaction.objectStore(storeName);
          store.clear();
        }
        
        console.log('🗑️ All cache cleared');
      } catch (error) {
        console.error('キャッシュクリアエラー:', error);
      }
    }
  }

  /**
   * キャッシュ統計情報を取得
   */
  async getCacheStats(): Promise<{
    memoryEntries: number;
    localStorageUsage: number;
    indexedDBSize: number;
  }> {
    const memoryEntries = this.memoryCache.size;
    
    // localStorageサイズ計算
    let localStorageUsage = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('price_') || key === 'user_settings')) {
        const value = localStorage.getItem(key);
        localStorageUsage += (key.length + (value?.length || 0)) * 2; // UTF-16
      }
    }
    
    // IndexedDBサイズは概算（正確な計算は複雑）
    const indexedDBSize = 0; // TODO: 必要に応じて実装
    
    return {
      memoryEntries,
      localStorageUsage: Math.round(localStorageUsage / 1024), // KB
      indexedDBSize
    };
  }
}

// シングルトンインスタンス
export const cacheService = CacheService.getInstance();
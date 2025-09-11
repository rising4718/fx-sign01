import cron from 'node-cron';
import { Pool } from 'pg';
import { FXDataService } from './fxDataService';
import { HistoricalDataModel, PriceHistoryRecord, CandleDataRecord, APIStatsRecord } from '../models/HistoricalData';
import { getWebSocketService } from './websocketService';
import { logger } from '../utils/logger';

/**
 * Phase2: 履歴データ蓄積サービス
 * - GMO APIから定期的にデータ取得
 * - データベースに効率的に保存
 * - パフォーマンス統計収集
 */
export class HistoryAccumulationService {
  private fxDataService: FXDataService;
  private historicalDataModel: HistoricalDataModel;
  private priceCollectionJob: cron.ScheduledTask | null = null;
  private candleCollectionJob: cron.ScheduledTask | null = null;
  private cleanupJob: cron.ScheduledTask | null = null;
  private isCollectingPrices = false;
  private isCollectingCandles = false;

  constructor(private pool: Pool) {
    this.fxDataService = new FXDataService();
    this.historicalDataModel = new HistoricalDataModel(pool);
  }

  /**
   * サービス開始
   */
  public start(): void {
    logger.info('🚀 [History Service] Starting data accumulation service...');

    // 価格データ収集（30秒ごと）
    this.priceCollectionJob = cron.schedule('*/30 * * * * *', async () => {
      if (!this.isCollectingPrices) {
        await this.collectCurrentPrices();
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Tokyo'
    });

    // キャンドルデータ収集（5分ごと）
    this.candleCollectionJob = cron.schedule('*/5 * * * *', async () => {
      if (!this.isCollectingCandles) {
        await this.collectCandleData();
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Tokyo'
    });

    // 古いデータクリーンアップ（毎日午前2時）
    this.cleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.performCleanup();
    }, {
      scheduled: true,
      timezone: 'Asia/Tokyo'
    });

    logger.info('✅ [History Service] All scheduled jobs started');
  }

  /**
   * サービス停止
   */
  public stop(): void {
    logger.info('⏹️ [History Service] Stopping data accumulation service...');
    
    if (this.priceCollectionJob) {
      this.priceCollectionJob.stop();
      this.priceCollectionJob = null;
    }

    if (this.candleCollectionJob) {
      this.candleCollectionJob.stop();
      this.candleCollectionJob = null;
    }

    if (this.cleanupJob) {
      this.cleanupJob.stop();
      this.cleanupJob = null;
    }

    logger.info('✅ [History Service] All scheduled jobs stopped');
  }

  /**
   * 現在価格収集
   */
  private async collectCurrentPrices(): Promise<void> {
    this.isCollectingPrices = true;
    const startTime = Date.now();

    try {
      const symbols = ['USD/JPY', 'EUR/USD', 'GBP/USD', 'AUD/USD'];
      const promises = symbols.map(async (symbol) => {
        try {
          const startRequest = Date.now();
          const priceData = await this.fxDataService.getCurrentPrice(symbol);
          const responseTime = Date.now() - startRequest;

          // データベースに保存
          const record: PriceHistoryRecord = {
            symbol: symbol.replace('/', ''),
            bid: priceData.bid,
            ask: priceData.ask,
            spread: priceData.spread,
            timestamp: priceData.timestamp,
            source: priceData.source
          };

          await this.historicalDataModel.savePriceHistory(record);

          // WebSocket経由でリアルタイム配信
          try {
            const wsService = getWebSocketService();
            wsService.broadcastPriceUpdate({
              symbol: priceData.symbol,
              bid: priceData.bid,
              ask: priceData.ask,
              spread: priceData.spread,
              timestamp: priceData.timestamp,
              source: priceData.source
            });
            logger.debug(`📡 [History Service] Price broadcasted via WebSocket: ${symbol}`);
          } catch (wsError) {
            logger.warn(`⚠️ [History Service] WebSocket broadcast failed for ${symbol}:`, wsError);
          }

          // API統計更新
          await this.historicalDataModel.updateAPIStats({
            endpoint: 'fx/ticker',
            totalCalls: 1,
            successfulCalls: 1,
            failedCalls: 0,
            avgResponseTimeMs: responseTime,
            cacheHits: responseTime < 50 ? 1 : 0, // 50ms以下はキャッシュとみなす
            cacheMisses: responseTime >= 50 ? 1 : 0,
            dataPointsCollected: 1
          });

          return { symbol, success: true, responseTime };
        } catch (error: unknown) {
          logger.error(`❌ [History Service] Failed to collect price for ${symbol}:`, error);
          
          // エラー統計更新
          await this.historicalDataModel.updateAPIStats({
            endpoint: 'fx/ticker',
            totalCalls: 1,
            successfulCalls: 0,
            failedCalls: 1,
            avgResponseTimeMs: 0,
            cacheHits: 0,
            cacheMisses: 1,
            dataPointsCollected: 0
          });

          return { symbol, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      const totalTime = Date.now() - startTime;

      logger.info(`💰 [History Service] Price collection completed: ${successful}/${symbols.length} symbols in ${totalTime}ms`);

    } catch (error) {
      logger.error('❌ [History Service] Price collection failed:', error);
    } finally {
      this.isCollectingPrices = false;
    }
  }

  /**
   * キャンドルデータ収集
   */
  private async collectCandleData(): Promise<void> {
    this.isCollectingCandles = true;
    const startTime = Date.now();

    try {
      const symbols = ['USD/JPY', 'EUR/USD'];
      const timeframes: ('5m' | '15m')[] = ['5m', '15m'];

      for (const symbol of symbols) {
        for (const timeframe of timeframes) {
          try {
            const startRequest = Date.now();
            const candleData = await this.fxDataService.getHistoricalData(symbol, timeframe, 1);
            const responseTime = Date.now() - startRequest;

            if (candleData.length > 0) {
              const candle = candleData[0];
              const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 : 15 * 60 * 1000;
              
              const record: CandleDataRecord = {
                symbol: symbol.replace('/', ''),
                timeframe,
                openPrice: candle.open,
                highPrice: candle.high,
                lowPrice: candle.low,
                closePrice: candle.close,
                volume: candle.volume || 0,
                candleStart: candle.timestamp,
                candleEnd: new Date(candle.timestamp.getTime() + intervalMs),
                source: 'gmo'
              };

              await this.historicalDataModel.saveCandleData(record);

              // API統計更新
              await this.historicalDataModel.updateAPIStats({
                endpoint: 'fx/historical',
                totalCalls: 1,
                successfulCalls: 1,
                failedCalls: 0,
                avgResponseTimeMs: responseTime,
                cacheHits: 0,
                cacheMisses: 1,
                dataPointsCollected: 1
              });

              logger.debug(`📊 [History Service] Candle saved: ${symbol} ${timeframe} at ${candle.timestamp}`);
            }

          } catch (error) {
            logger.error(`❌ [History Service] Failed to collect candle data for ${symbol} ${timeframe}:`, error);
            
            // エラー統計更新
            await this.historicalDataModel.updateAPIStats({
              endpoint: 'fx/historical',
              totalCalls: 1,
              successfulCalls: 0,
              failedCalls: 1,
              avgResponseTimeMs: 0,
              cacheHits: 0,
              cacheMisses: 1,
              dataPointsCollected: 0
            });
          }
        }
      }

      const totalTime = Date.now() - startTime;
      logger.info(`📊 [History Service] Candle collection completed in ${totalTime}ms`);

    } catch (error) {
      logger.error('❌ [History Service] Candle collection failed:', error);
    } finally {
      this.isCollectingCandles = false;
    }
  }

  /**
   * クリーンアップ処理
   */
  private async performCleanup(): Promise<void> {
    logger.info('🧹 [History Service] Starting daily cleanup...');
    
    try {
      // 30日より古いデータを削除
      await this.historicalDataModel.cleanupOldData(30);
      
      // データベース統計取得・ログ出力
      const stats = await this.historicalDataModel.getDatabaseStats();
      logger.info(`📊 [History Service] Database stats:`, {
        priceRecords: stats.priceHistoryCount,
        candleRecords: stats.candleDataCount,
        apiStatsRecords: stats.apiStatsCount,
        oldestRecord: stats.oldestPriceRecord,
        newestRecord: stats.newestPriceRecord
      });

      logger.info('✅ [History Service] Daily cleanup completed');
    } catch (error) {
      logger.error('❌ [History Service] Cleanup failed:', error);
    }
  }

  /**
   * 手動バックフィル（過去データ補完）
   */
  public async backfillHistoricalData(
    symbol: string,
    timeframe: '5m' | '15m',
    hours: number = 24
  ): Promise<void> {
    logger.info(`🔄 [History Service] Starting backfill for ${symbol} ${timeframe} (${hours}h)`);

    try {
      const limit = timeframe === '5m' ? hours * 12 : hours * 4; // 5分足: 12/h, 15分足: 4/h
      const candleData = await this.fxDataService.getHistoricalData(symbol, timeframe, limit);

      let saved = 0;
      for (const candle of candleData) {
        try {
          const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 : 15 * 60 * 1000;
          
          const record: CandleDataRecord = {
            symbol: symbol.replace('/', ''),
            timeframe,
            openPrice: candle.open,
            highPrice: candle.high,
            lowPrice: candle.low,
            closePrice: candle.close,
            volume: candle.volume || 0,
            candleStart: candle.timestamp,
            candleEnd: new Date(candle.timestamp.getTime() + intervalMs),
            source: 'gmo'
          };

          await this.historicalDataModel.saveCandleData(record);
          saved++;
        } catch (error: unknown) {
          // UNIQUEエラーは無視（既存データ）
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (!errorMessage.includes('duplicate key')) {
            logger.warn(`⚠️ [History Service] Failed to save candle at ${candle.timestamp}:`, errorMessage);
          }
        }
      }

      logger.info(`✅ [History Service] Backfill completed: ${saved}/${candleData.length} candles saved`);
    } catch (error) {
      logger.error(`❌ [History Service] Backfill failed for ${symbol} ${timeframe}:`, error);
      throw error;
    }
  }

  /**
   * サービス状態取得
   */
  public getStatus(): {
    isRunning: boolean;
    isCollectingPrices: boolean;
    isCollectingCandles: boolean;
    nextPriceCollection: string | null;
    nextCandleCollection: string | null;
    nextCleanup: string | null;
  } {
    return {
      isRunning: this.priceCollectionJob !== null,
      isCollectingPrices: this.isCollectingPrices,
      isCollectingCandles: this.isCollectingCandles,
      nextPriceCollection: this.priceCollectionJob ? 'Every 30 seconds' : null,
      nextCandleCollection: this.candleCollectionJob ? 'Every 5 minutes' : null,
      nextCleanup: this.cleanupJob ? 'Daily at 02:00 JST' : null
    };
  }
}
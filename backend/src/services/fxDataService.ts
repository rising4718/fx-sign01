import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { FXPrice, CandleData, GMOTickerResponse, AlphaVantageResponse, APIError } from '../types';

export class FXDataService {
  private gmoBaseURL: string;
  private alphaVantageBaseURL: string;
  private alphaVantageApiKey: string;
  private lastGMORequest: number = 0;
  private lastAlphaVantageRequest: number = 0;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 1000; // 1 second cache for 1-second updates

  constructor() {
    this.gmoBaseURL = process.env.GMO_API_BASE_URL || 'https://forex-api.coin.z.com/public/v1';
    this.alphaVantageBaseURL = process.env.ALPHAVANTAGE_BASE_URL || 'https://www.alphavantage.co/query';
    this.alphaVantageApiKey = process.env.ALPHAVANTAGE_API_KEY || 'demo';
  }

  private isRateLimited(lastRequest: number, limitPerSecond: number): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;
    const minInterval = 1000 / limitPerSecond; // milliseconds between requests
    return timeSinceLastRequest < minInterval;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCacheData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async fetchFromGMO(endpoint: string): Promise<any> {
    const cacheKey = `gmo_${endpoint}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      logger.debug('Returning cached GMO data');
      return cached;
    }

    // Rate limiting: 1 request per second
    if (this.isRateLimited(this.lastGMORequest, 1)) {
      const waitTime = 1000 - (Date.now() - this.lastGMORequest);
      logger.debug(`GMO API rate limited, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    try {
      const url = `${this.gmoBaseURL}${endpoint}`;
      logger.debug(`Fetching from GMO API: ${url}`);
      
      const response: AxiosResponse<GMOTickerResponse> = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'FX-Sign-Tool/1.0.0'
        }
      });

      this.lastGMORequest = Date.now();

      if (response.data.status !== 0) {
        throw new APIError(`GMO API error: status ${response.data.status}`, 'GMO_API_ERROR', response.status || 500, 'gmo');
      }

      this.setCacheData(cacheKey, response.data);
      logger.debug('GMO API response received and cached');
      return response.data;

    } catch (error: any) {
      logger.error('GMO API request failed:', error.message);
      
      if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw new APIError('GMO API connection failed', 'GMO_CONNECTION_ERROR', 503, 'gmo');
      }
      
      throw new APIError(`GMO API request failed: ${error.message}`, 'GMO_REQUEST_ERROR', error.response?.status || 500, 'gmo');
    }
  }

  private async fetchFromAlphaVantage(params: any): Promise<any> {
    const cacheKey = `alphavantage_${JSON.stringify(params)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      logger.debug('Returning cached Alpha Vantage data');
      return cached;
    }

    // Rate limiting: 5 requests per minute
    if (this.isRateLimited(this.lastAlphaVantageRequest, 5/60)) {
      const waitTime = 12000 - (Date.now() - this.lastAlphaVantageRequest); // 12 seconds between requests
      logger.debug(`Alpha Vantage API rate limited, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    try {
      const queryParams = new URLSearchParams({
        ...params,
        apikey: this.alphaVantageApiKey
      });

      const url = `${this.alphaVantageBaseURL}?${queryParams}`;
      logger.debug(`Fetching from Alpha Vantage API: ${url}`);
      
      const response: AxiosResponse<AlphaVantageResponse> = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'FX-Sign-Tool/1.0.0'
        }
      });

      this.lastAlphaVantageRequest = Date.now();

      if (!response.data || response.data['Error Message']) {
        throw new APIError(`Alpha Vantage API error: ${response.data['Error Message'] || 'Unknown error'}`, 'ALPHAVANTAGE_API_ERROR', response.status || 500, 'alphavantage');
      }

      this.setCacheData(cacheKey, response.data);
      logger.debug('Alpha Vantage API response received and cached');
      return response.data;

    } catch (error: any) {
      logger.error('Alpha Vantage API request failed:', error.message);
      
      if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw new APIError('Alpha Vantage API connection failed', 'ALPHAVANTAGE_CONNECTION_ERROR', 503, 'alphavantage');
      }
      
      throw new APIError(`Alpha Vantage API request failed: ${error.message}`, 'ALPHAVANTAGE_REQUEST_ERROR', error.response?.status || 500, 'alphavantage');
    }
  }

  private generateMockPrice(symbol: string = 'USD/JPY'): FXPrice {
    // Generate realistic USD/JPY price around 150.00 with small random variations
    const basePrice = 150.0;
    const variation = (Math.random() - 0.5) * 0.5; // ±0.25 variation
    const ask = basePrice + variation;
    const spread = 0.02 + Math.random() * 0.03; // 2-5 pip spread
    const bid = ask - spread;

    return {
      symbol,
      bid: parseFloat(bid.toFixed(3)),
      ask: parseFloat(ask.toFixed(3)),
      spread: parseFloat(spread.toFixed(3)),
      timestamp: new Date(),
      source: 'mock'
    };
  }

  public async getCurrentPrice(symbol: string = 'USD/JPY'): Promise<FXPrice> {
    logger.debug(`Fetching current price for ${symbol}`);

    // Try GMO API first
    try {
      const gmoData = await this.fetchFromGMO('/ticker');
      
      // Find USD/JPY data in response
      const usdJpyData = gmoData.data.find((item: any) => item.symbol === 'USD_JPY');
      
      if (usdJpyData) {
        const priceData: FXPrice = {
          symbol: 'USD/JPY',
          bid: parseFloat(usdJpyData.bid),
          ask: parseFloat(usdJpyData.ask),
          spread: parseFloat(usdJpyData.ask) - parseFloat(usdJpyData.bid),
          timestamp: new Date(usdJpyData.timestamp),
          source: 'gmo'
        };

        logger.info(`Current price from GMO: ${symbol} - Bid: ${priceData.bid}, Ask: ${priceData.ask}`);
        return priceData;
      }
    } catch (error) {
      logger.warn('GMO API failed, trying Alpha Vantage fallback:', error);
    }

    // Try Alpha Vantage fallback
    try {
      const alphaVantageData = await this.fetchFromAlphaVantage({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: 'USD',
        to_currency: 'JPY'
      });

      const exchangeRate = alphaVantageData['Realtime Currency Exchange Rate'];
      if (exchangeRate) {
        const rate = parseFloat(exchangeRate['5. Exchange Rate']);
        const bid = parseFloat(exchangeRate['8. Bid Price']);
        const ask = parseFloat(exchangeRate['9. Ask Price']);

        const priceData: FXPrice = {
          symbol: 'USD/JPY',
          bid: bid || rate - 0.02,
          ask: ask || rate + 0.02,
          spread: ask && bid ? ask - bid : 0.04,
          timestamp: new Date(exchangeRate['6. Last Refreshed']),
          source: 'alphavantage'
        };

        logger.info(`Current price from Alpha Vantage: ${symbol} - Bid: ${priceData.bid}, Ask: ${priceData.ask}`);
        return priceData;
      }
    } catch (error) {
      logger.warn('Alpha Vantage API failed, using mock data:', error);
    }

    // Fallback to mock data
    const mockPrice = this.generateMockPrice(symbol);
    logger.info(`Using mock price data: ${symbol} - Bid: ${mockPrice.bid}, Ask: ${mockPrice.ask}`);
    return mockPrice;
  }

  public async getHistoricalData(symbol: string, timeframe: string, limit: number): Promise<CandleData[]> {
    logger.debug(`Fetching historical data for ${symbol}, timeframe: ${timeframe}, limit: ${limit}`);

    // For now, generate mock historical data
    // In Phase 2, this would fetch from database or external API
    const data: CandleData[] = [];
    const now = new Date();
    const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 : 15 * 60 * 1000;

    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * intervalMs));
      const basePrice = 150.0 + (Math.random() - 0.5) * 2;
      const variation = Math.random() * 0.5;
      
      const open = basePrice;
      const close = basePrice + (Math.random() - 0.5) * 0.3;
      const high = Math.max(open, close) + Math.random() * 0.2;
      const low = Math.min(open, close) - Math.random() * 0.2;

      data.push({
        timestamp,
        open: parseFloat(open.toFixed(3)),
        high: parseFloat(high.toFixed(3)),
        low: parseFloat(low.toFixed(3)),
        close: parseFloat(close.toFixed(3)),
        volume: Math.floor(Math.random() * 1000000)
      });
    }

    logger.info(`Generated ${data.length} historical candles for ${symbol}`);
    return data;
  }

  public async getAPIStatus(): Promise<any> {
    const status = {
      gmo: { available: false, latency: null as number | null, lastCheck: new Date() },
      alphavantage: { available: false, latency: null as number | null, lastCheck: new Date() },
      fallback: { active: false, reason: null as string | null }
    };

    // Test GMO API
    try {
      const start = Date.now();
      await this.fetchFromGMO('/ticker');
      status.gmo.available = true;
      status.gmo.latency = Date.now() - start;
      logger.debug(`GMO API status: Available, latency: ${status.gmo.latency}ms`);
    } catch (error) {
      logger.debug('GMO API status: Unavailable');
      status.fallback.active = true;
      status.fallback.reason = 'GMO API unavailable';
    }

    // Test Alpha Vantage API
    try {
      const start = Date.now();
      await this.fetchFromAlphaVantage({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: 'USD',
        to_currency: 'JPY'
      });
      status.alphavantage.available = true;
      status.alphavantage.latency = Date.now() - start;
      logger.debug(`Alpha Vantage API status: Available, latency: ${status.alphavantage.latency}ms`);
    } catch (error) {
      logger.debug('Alpha Vantage API status: Unavailable');
    }

    return status;
  }
}
/**
 * 現実的な取引シミュレーション
 * GMOコインの実際の取引条件を考慮した損益計算
 * 作成日: 2025-09-09
 */

export interface TradingAccount {
  balance: number;           // 口座残高（円）
  leverage: 1 | 10 | 25;    // レバレッジ（GMOコイン対応）
  marginRequirement: number; // 必要証拠金率（％）
  riskPercent: number;      // 1取引あたりのリスク（％）
  currency: 'JPY';          // 口座通貨
}

export interface CurrencyPairConfig {
  symbol: string;
  spread: number;           // スプレッド（pips）
  commission: number;       // 手数料（円/取引）
  pipValue: number;         // 1pipの価値（円/1万通貨）
  minLotSize: number;       // 最小取引単位（万通貨）
  maxLotSize: number;       // 最大取引単位（万通貨）
  marginRate: number;       // 証拠金率（％）
}

// GMOコインの実際の取引条件
export const GMO_CURRENCY_PAIRS: Record<string, CurrencyPairConfig> = {
  'USD/JPY': {
    symbol: 'USD/JPY',
    spread: 0.2,              // 0.2pips
    commission: 0,            // 手数料無料
    pipValue: 100,            // 1万通貨で1pip=100円
    minLotSize: 0.1,          // 1000通貨から
    maxLotSize: 100,          // 100万通貨まで
    marginRate: 4.0           // 証拠金率4%
  },
  'EUR/USD': {
    symbol: 'EUR/USD',
    spread: 0.3,
    commission: 0,
    pipValue: 150,            // 概算（USD/JPYレート考慮）
    minLotSize: 0.1,
    maxLotSize: 100,
    marginRate: 4.0
  },
  'GBP/JPY': {
    symbol: 'GBP/JPY',
    spread: 0.7,
    commission: 0,
    pipValue: 100,
    minLotSize: 0.1,
    maxLotSize: 100,
    marginRate: 4.0
  },
  'AUD/JPY': {
    symbol: 'AUD/JPY',
    spread: 0.6,
    commission: 0,
    pipValue: 100,
    minLotSize: 0.1,
    maxLotSize: 100,
    marginRate: 4.0
  }
};

export interface TradeParameters {
  symbol: string;
  direction: 'buy' | 'sell';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  torbRangeWidth: number;    // TORBレンジ幅（pips）
}

export interface TradeResult {
  positionSize: number;      // ポジションサイズ（万通貨）
  requiredMargin: number;    // 必要証拠金（円）
  maxRisk: number;           // 最大リスク（円）
  spreadCost: number;        // スプレッドコスト（円）
  pnl: number;               // 損益（円）
  pnlPips: number;           // 損益（pips）
  marginUsageRate: number;   // 証拠金使用率（％）
  riskRewardRatio: number;   // リスクリワード比率
  isValidTrade: boolean;     // 取引可能かどうか
  errorMessage?: string;     // エラーメッセージ
}

/**
 * リアルな取引シミュレーション
 */
export class TradingSimulator {
  private account: TradingAccount;
  private currencyConfig: Record<string, CurrencyPairConfig>;

  constructor(account: TradingAccount) {
    this.account = account;
    this.currencyConfig = GMO_CURRENCY_PAIRS;
  }

  /**
   * アカウント設定を更新
   */
  updateAccount(account: Partial<TradingAccount>) {
    this.account = { ...this.account, ...account };
  }

  /**
   * 取引シミュレーション実行
   */
  simulateTrade(params: TradeParameters, exitPrice: number): TradeResult {
    const config = this.currencyConfig[params.symbol];
    if (!config) {
      return this.createErrorResult('サポートされていない通貨ペアです');
    }

    try {
      // 1. ポジションサイズ計算
      const positionSize = this.calculatePositionSize(params, config);
      
      // 2. 必要証拠金計算
      const requiredMargin = this.calculateRequiredMargin(positionSize, params.entryPrice, config);
      
      // 3. 証拠金使用率チェック
      const marginUsageRate = (requiredMargin / this.account.balance) * 100;
      if (marginUsageRate > 95) { // 安全マージン5%
        return this.createErrorResult('証拠金不足のため取引できません');
      }

      // 4. スプレッドコスト計算
      const spreadCost = this.calculateSpreadCost(positionSize, config);

      // 5. 損益計算
      const pnlData = this.calculatePnL(params, exitPrice, positionSize, config);

      // 6. リスクリワード比率計算
      const riskRewardRatio = this.calculateRiskRewardRatio(params);

      return {
        positionSize,
        requiredMargin,
        maxRisk: Math.abs(this.calculatePnL(params, params.stopLoss, positionSize, config).pnl),
        spreadCost,
        pnl: pnlData.pnl - spreadCost, // スプレッドコストを差し引き
        pnlPips: pnlData.pnlPips,
        marginUsageRate,
        riskRewardRatio,
        isValidTrade: true
      };

    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : '取引計算エラー');
    }
  }

  /**
   * 適切なポジションサイズを計算（固定フラクショナル法）
   */
  private calculatePositionSize(params: TradeParameters, config: CurrencyPairConfig): number {
    const riskAmount = this.account.balance * (this.account.riskPercent / 100);
    const stopLossPips = Math.abs(params.entryPrice - params.stopLoss) * 10000; // pips変換
    
    if (stopLossPips <= 0) {
      throw new Error('ストップロス設定が不正です');
    }

    const positionSize = riskAmount / (stopLossPips * config.pipValue);
    
    // 最小・最大ロットサイズでクランプ
    const clampedSize = Math.max(
      config.minLotSize,
      Math.min(config.maxLotSize, positionSize)
    );

    // 0.1万通貨単位で丸め
    return Math.floor(clampedSize * 10) / 10;
  }

  /**
   * 必要証拠金計算
   */
  private calculateRequiredMargin(positionSize: number, entryPrice: number, config: CurrencyPairConfig): number {
    const notionalValue = positionSize * 10000 * entryPrice; // 想定元本（円）
    return (notionalValue * config.marginRate) / (100 * this.account.leverage);
  }

  /**
   * スプレッドコスト計算
   */
  private calculateSpreadCost(positionSize: number, config: CurrencyPairConfig): number {
    return positionSize * config.spread * config.pipValue;
  }

  /**
   * 損益計算（スプレッド除く）
   */
  private calculatePnL(params: TradeParameters, exitPrice: number, positionSize: number, config: CurrencyPairConfig) {
    const priceDiff = params.direction === 'buy' 
      ? exitPrice - params.entryPrice
      : params.entryPrice - exitPrice;
    
    const pnlPips = priceDiff * 10000;
    const pnl = pnlPips * config.pipValue * positionSize;

    return { pnl, pnlPips };
  }

  /**
   * リスクリワード比率計算
   */
  private calculateRiskRewardRatio(params: TradeParameters): number {
    const riskPips = Math.abs(params.entryPrice - params.stopLoss) * 10000;
    const rewardPips = Math.abs(params.takeProfit - params.entryPrice) * 10000;
    
    return riskPips > 0 ? rewardPips / riskPips : 0;
  }

  /**
   * エラー結果作成
   */
  private createErrorResult(message: string): TradeResult {
    return {
      positionSize: 0,
      requiredMargin: 0,
      maxRisk: 0,
      spreadCost: 0,
      pnl: 0,
      pnlPips: 0,
      marginUsageRate: 0,
      riskRewardRatio: 0,
      isValidTrade: false,
      errorMessage: message
    };
  }

  /**
   * アカウント情報取得
   */
  getAccountInfo() {
    return { ...this.account };
  }

  /**
   * 通貨ペア設定取得
   */
  getCurrencyConfig(symbol: string) {
    return this.currencyConfig[symbol];
  }

  /**
   * 利用可能証拠金計算
   */
  getAvailableMargin() {
    return this.account.balance; // 簡略化（実際は既存ポジション分を差し引く）
  }

  /**
   * 推奨ポジションサイズ取得（リスク管理込み）
   */
  getRecommendedPositionSize(symbol: string, entryPrice: number, stopLoss: number): number {
    const config = this.currencyConfig[symbol];
    if (!config) return 0;

    const params: TradeParameters = {
      symbol,
      direction: 'buy', // 方向は計算に影響しない
      entryPrice,
      stopLoss,
      takeProfit: entryPrice, // ダミー値
      torbRangeWidth: 0
    };

    return this.calculatePositionSize(params, config);
  }
}

/**
 * デフォルトアカウント設定（GMOコイン準拠）
 */
export const createDefaultAccount = (balance: number = 100000): TradingAccount => ({
  balance,
  leverage: 25,              // 最大レバレッジ
  marginRequirement: 4.0,    // 4%
  riskPercent: 2.0,          // 1取引2%リスク
  currency: 'JPY'
});

/**
 * パフォーマンス統計計算
 */
export interface PerformanceStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
}

export const calculatePerformanceStats = (trades: TradeResult[]): PerformanceStats => {
  const completedTrades = trades.filter(t => t.isValidTrade);
  const winningTrades = completedTrades.filter(t => t.pnl > 0);
  const losingTrades = completedTrades.filter(t => t.pnl < 0);

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const netProfit = grossProfit - grossLoss;

  return {
    totalTrades: completedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
    grossProfit,
    grossLoss,
    netProfit,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
    avgWin: winningTrades.length > 0 ? grossProfit / winningTrades.length : 0,
    avgLoss: losingTrades.length > 0 ? grossLoss / losingTrades.length : 0,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0,
    maxConsecutiveWins: calculateMaxConsecutive(completedTrades, true),
    maxConsecutiveLosses: calculateMaxConsecutive(completedTrades, false),
    maxDrawdown: 0, // 要実装
    maxDrawdownPercent: 0, // 要実装
    sharpeRatio: 0 // 要実装
  };
};

const calculateMaxConsecutive = (trades: TradeResult[], isWin: boolean): number => {
  let maxConsecutive = 0;
  let currentConsecutive = 0;

  for (const trade of trades) {
    const isTradeWin = trade.pnl > 0;
    if (isTradeWin === isWin) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }

  return maxConsecutive;
};
/**
 * Performance Tracking Service
 * Phase 1: データ収集・分析基盤
 * 作成日: 2025-09-07
 */

import { Pool } from 'pg';

export interface TradeRecord {
  symbol: string;
  entryTime: Date;
  exitTime?: Date;
  direction: 'LONG' | 'SHORT';
  
  // 東京ボックス情報
  boxHigh: number;
  boxLow: number;
  boxWidthPips: number;
  
  // エントリー情報
  entrySession: 'EUROPE' | 'NY_EARLY';
  entryPrice: number;
  entryMethod?: 'RETEST' | 'DIRECT_BREAK';
  
  // エグジット情報
  exitPrice?: number;
  exitReason?: 'TP_HIT' | 'SL_HIT' | 'TIME_STOP' | 'MANUAL';
  
  // リスク管理
  positionSize: number;
  stopLoss: number;
  takeProfit?: number;
  pnlPips?: number;
  pnlAmount?: number;
  riskRewardRatio?: number;
  
  // マーケット環境
  atrD1?: number;
  spreadAtEntry?: number;
  volatilityRegime?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DailyPerformance {
  date: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor?: number;
  maxDrawdown?: number;
  maxDrawdownPercent?: number;
  sharpeRatio?: number;
}

export interface MarketEnvironment {
  date: string;
  atrD1Usdjpy?: number;
  atrD1Eurusd?: number;
  dailyRangeUsdjpy?: number;
  dailyRangeEurusd?: number;
  tokyoSessionRange?: number;
  europeSessionRange?: number;
  nySessionRange?: number;
  
  // Phase 2 準備
  vixValue?: number;
  dxyClose?: number;
  nikkeiChangePercent?: number;
  spxChangePercent?: number;
  
  majorNewsEvents?: string[];
  economicCalendarImpact?: 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE';
}

export interface BacktestResult {
  testName: string;
  startDate: string;
  endDate: string;
  strategyVersion: string;
  parameters: Record<string, any>;
  
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  netProfit: number;
  profitFactor?: number;
  maxDrawdown?: number;
  maxDrawdownPercent?: number;
  sharpeRatio?: number;
  sortinoRatio?: number;
  
  monthlyReturns?: number[];
  dailyEquityCurve?: Array<{date: string, equity: number}>;
  
  notes?: string;
}

export class PerformanceTrackingService {
  private pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  // === Trade Recording ===
  
  async recordTrade(trade: TradeRecord): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO trade_records (
          symbol, entry_time, exit_time, direction,
          box_high, box_low, box_width_pips,
          entry_session, entry_price, entry_method,
          exit_price, exit_reason,
          position_size, stop_loss, take_profit,
          pnl_pips, pnl_amount, risk_reward_ratio,
          atr_d1, spread_at_entry, volatility_regime
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING id
      `, [
        trade.symbol,
        trade.entryTime,
        trade.exitTime,
        trade.direction,
        trade.boxHigh,
        trade.boxLow,
        trade.boxWidthPips,
        trade.entrySession,
        trade.entryPrice,
        trade.entryMethod,
        trade.exitPrice,
        trade.exitReason,
        trade.positionSize,
        trade.stopLoss,
        trade.takeProfit,
        trade.pnlPips,
        trade.pnlAmount,
        trade.riskRewardRatio,
        trade.atrD1,
        trade.spreadAtEntry,
        trade.volatilityRegime
      ]);
      
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async updateTradeExit(
    tradeId: number, 
    exitPrice: number, 
    exitReason: TradeRecord['exitReason'],
    pnlPips?: number,
    pnlAmount?: number
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE trade_records 
        SET exit_time = NOW(), exit_price = $2, exit_reason = $3,
            pnl_pips = $4, pnl_amount = $5
        WHERE id = $1
      `, [tradeId, exitPrice, exitReason, pnlPips, pnlAmount]);
    } finally {
      client.release();
    }
  }

  // === Performance Analysis ===
  
  async getDailyPerformance(startDate: string, endDate: string): Promise<DailyPerformance[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          date,
          total_trades,
          winning_trades,
          losing_trades,
          win_rate,
          gross_profit,
          gross_loss,
          net_profit,
          profit_factor,
          max_drawdown,
          max_drawdown_percent,
          sharpe_ratio
        FROM daily_performance
        WHERE date BETWEEN $1 AND $2
        ORDER BY date DESC
      `, [startDate, endDate]);
      
      return result.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        totalTrades: row.total_trades,
        winningTrades: row.winning_trades,
        losingTrades: row.losing_trades,
        winRate: parseFloat(row.win_rate || '0'),
        grossProfit: parseFloat(row.gross_profit || '0'),
        grossLoss: parseFloat(row.gross_loss || '0'),
        netProfit: parseFloat(row.net_profit || '0'),
        profitFactor: row.profit_factor ? parseFloat(row.profit_factor) : undefined,
        maxDrawdown: row.max_drawdown ? parseFloat(row.max_drawdown) : undefined,
        maxDrawdownPercent: row.max_drawdown_percent ? parseFloat(row.max_drawdown_percent) : undefined,
        sharpeRatio: row.sharpe_ratio ? parseFloat(row.sharpe_ratio) : undefined
      }));
    } finally {
      client.release();
    }
  }

  async getCurrentPhaseSummary(): Promise<{
    phase: string;
    totalDaysActive: number;
    avgWinRate: number;
    avgDailyProfit: number;
    worstDrawdown: number;
    avgSharpeRatio: number;
    daysAboveTarget: number;
  }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM current_phase_summary
      `);
      
      const row = result.rows[0];
      return {
        phase: row.phase,
        totalDaysActive: parseInt(row.total_days_active || '0'),
        avgWinRate: parseFloat(row.avg_win_rate || '0'),
        avgDailyProfit: parseFloat(row.avg_daily_profit || '0'),
        worstDrawdown: parseFloat(row.worst_drawdown || '0'),
        avgSharpeRatio: parseFloat(row.avg_sharpe_ratio || '0'),
        daysAboveTarget: parseInt(row.days_above_target || '0')
      };
    } finally {
      client.release();
    }
  }

  // === Market Environment Data ===
  
  async recordMarketEnvironment(environment: MarketEnvironment): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO market_environment (
          date, atr_d1_usdjpy, atr_d1_eurusd, 
          daily_range_usdjpy, daily_range_eurusd,
          tokyo_session_range, europe_session_range, ny_session_range,
          vix_value, dxy_close, nikkei_change_percent, spx_change_percent,
          major_news_events, economic_calendar_impact
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) ON CONFLICT (date) DO UPDATE SET
          atr_d1_usdjpy = EXCLUDED.atr_d1_usdjpy,
          atr_d1_eurusd = EXCLUDED.atr_d1_eurusd,
          daily_range_usdjpy = EXCLUDED.daily_range_usdjpy,
          daily_range_eurusd = EXCLUDED.daily_range_eurusd,
          tokyo_session_range = EXCLUDED.tokyo_session_range,
          europe_session_range = EXCLUDED.europe_session_range,
          ny_session_range = EXCLUDED.ny_session_range,
          vix_value = EXCLUDED.vix_value,
          dxy_close = EXCLUDED.dxy_close,
          nikkei_change_percent = EXCLUDED.nikkei_change_percent,
          spx_change_percent = EXCLUDED.spx_change_percent,
          major_news_events = EXCLUDED.major_news_events,
          economic_calendar_impact = EXCLUDED.economic_calendar_impact
      `, [
        environment.date,
        environment.atrD1Usdjpy,
        environment.atrD1Eurusd,
        environment.dailyRangeUsdjpy,
        environment.dailyRangeEurusd,
        environment.tokyoSessionRange,
        environment.europeSessionRange,
        environment.nySessionRange,
        environment.vixValue,
        environment.dxyClose,
        environment.nikkeiChangePercent,
        environment.spxChangePercent,
        environment.majorNewsEvents,
        environment.economicCalendarImpact
      ]);
    } finally {
      client.release();
    }
  }

  // === Backtesting ===
  
  async saveBacktestResult(result: BacktestResult): Promise<number> {
    const client = await this.pool.connect();
    try {
      const backtest = await client.query(`
        INSERT INTO backtest_results (
          test_name, start_date, end_date, strategy_version, parameters,
          total_trades, winning_trades, losing_trades, win_rate,
          net_profit, profit_factor, max_drawdown, max_drawdown_percent,
          sharpe_ratio, sortino_ratio, monthly_returns, daily_equity_curve, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING id
      `, [
        result.testName,
        result.startDate,
        result.endDate,
        result.strategyVersion,
        JSON.stringify(result.parameters),
        result.totalTrades,
        result.winningTrades,
        result.losingTrades,
        result.winRate,
        result.netProfit,
        result.profitFactor,
        result.maxDrawdown,
        result.maxDrawdownPercent,
        result.sharpeRatio,
        result.sortinoRatio,
        result.monthlyReturns ? JSON.stringify(result.monthlyReturns) : null,
        result.dailyEquityCurve ? JSON.stringify(result.dailyEquityCurve) : null,
        result.notes
      ]);
      
      return backtest.rows[0].id;
    } finally {
      client.release();
    }
  }

  async getRecentBacktests(limit: number = 10): Promise<BacktestResult[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM backtest_results 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit]);
      
      return result.rows.map(row => ({
        testName: row.test_name,
        startDate: row.start_date.toISOString().split('T')[0],
        endDate: row.end_date.toISOString().split('T')[0],
        strategyVersion: row.strategy_version,
        parameters: row.parameters,
        totalTrades: row.total_trades,
        winningTrades: row.winning_trades,
        losingTrades: row.losing_trades,
        winRate: parseFloat(row.win_rate),
        netProfit: parseFloat(row.net_profit),
        profitFactor: row.profit_factor ? parseFloat(row.profit_factor) : undefined,
        maxDrawdown: row.max_drawdown ? parseFloat(row.max_drawdown) : undefined,
        maxDrawdownPercent: row.max_drawdown_percent ? parseFloat(row.max_drawdown_percent) : undefined,
        sharpeRatio: row.sharpe_ratio ? parseFloat(row.sharpe_ratio) : undefined,
        sortinoRatio: row.sortino_ratio ? parseFloat(row.sortino_ratio) : undefined,
        monthlyReturns: row.monthly_returns ? row.monthly_returns : undefined,
        dailyEquityCurve: row.daily_equity_curve ? row.daily_equity_curve : undefined,
        notes: row.notes
      }));
    } finally {
      client.release();
    }
  }

  // === 統計・分析機能 ===
  
  async getPerformanceStats(days: number = 30): Promise<{
    totalTrades: number;
    winRate: number;
    avgDailyReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    bestDay: number;
    worstDay: number;
    consecutiveWinStreak: number;
    consecutiveLossStreak: number;
  }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          SUM(total_trades) as total_trades,
          AVG(win_rate) as avg_win_rate,
          AVG(net_profit) as avg_daily_return,
          MAX(max_drawdown_percent) as max_drawdown,
          AVG(sharpe_ratio) as avg_sharpe_ratio,
          CASE 
            WHEN SUM(ABS(gross_loss)) > 0 
            THEN SUM(gross_profit) / SUM(ABS(gross_loss))
            ELSE NULL 
          END as profit_factor,
          MAX(net_profit) as best_day,
          MIN(net_profit) as worst_day,
          MAX(max_consecutive_wins) as max_consecutive_wins,
          MAX(max_consecutive_losses) as max_consecutive_losses
        FROM daily_performance 
        WHERE date >= CURRENT_DATE - INTERVAL '%d days'
      `, [days]);
      
      const row = result.rows[0];
      return {
        totalTrades: parseInt(row.total_trades || '0'),
        winRate: parseFloat(row.avg_win_rate || '0'),
        avgDailyReturn: parseFloat(row.avg_daily_return || '0'),
        maxDrawdown: parseFloat(row.max_drawdown || '0'),
        sharpeRatio: parseFloat(row.avg_sharpe_ratio || '0'),
        profitFactor: parseFloat(row.profit_factor || '0'),
        bestDay: parseFloat(row.best_day || '0'),
        worstDay: parseFloat(row.worst_day || '0'),
        consecutiveWinStreak: parseInt(row.max_consecutive_wins || '0'),
        consecutiveLossStreak: parseInt(row.max_consecutive_losses || '0')
      };
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
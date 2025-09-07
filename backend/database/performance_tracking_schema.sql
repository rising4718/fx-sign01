-- Performance Tracking Database Schema
-- Phase 1: 基盤データ収集システム
-- 作成日: 2025-09-07

-- Daily Performance Table: 日次パフォーマンス記録
CREATE TABLE daily_performance (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    
    -- 基本取引データ
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    
    -- 勝率・損益
    win_rate DECIMAL(5,2), -- 勝率 (0.00-100.00)
    gross_profit DECIMAL(15,4) DEFAULT 0,
    gross_loss DECIMAL(15,4) DEFAULT 0,
    net_profit DECIMAL(15,4) DEFAULT 0,
    profit_factor DECIMAL(8,4), -- 利益率 (gross_profit / abs(gross_loss))
    
    -- リスク指標
    max_drawdown DECIMAL(10,4) DEFAULT 0,
    max_drawdown_percent DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4),
    
    -- 連勝・連敗
    max_consecutive_wins INTEGER DEFAULT 0,
    max_consecutive_losses INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0, -- 現在の連勝(+)・連敗(-)
    
    -- Phase 2/3 拡張用
    additional_metrics JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade Records Table: 個別取引記録
CREATE TABLE trade_records (
    id SERIAL PRIMARY KEY,
    
    -- 基本情報
    symbol VARCHAR(10) NOT NULL DEFAULT 'USDJPY',
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    direction VARCHAR(5) CHECK (direction IN ('LONG', 'SHORT')),
    
    -- 東京ボックス情報
    box_start_time TIME NOT NULL DEFAULT '09:00',
    box_end_time TIME NOT NULL DEFAULT '11:00',
    box_high DECIMAL(10,5) NOT NULL,
    box_low DECIMAL(10,5) NOT NULL,
    box_width_pips DECIMAL(6,2) NOT NULL,
    
    -- エントリー詳細
    entry_session VARCHAR(20) CHECK (entry_session IN ('EUROPE', 'NY_EARLY')),
    entry_price DECIMAL(10,5) NOT NULL,
    entry_method VARCHAR(20) DEFAULT 'RETEST', -- RETEST, DIRECT_BREAK
    
    -- エグジット詳細
    exit_price DECIMAL(10,5),
    exit_reason VARCHAR(30) CHECK (exit_reason IN ('TP_HIT', 'SL_HIT', 'TIME_STOP', 'MANUAL')),
    
    -- 損益・リスク
    position_size DECIMAL(12,4) NOT NULL,
    stop_loss DECIMAL(10,5) NOT NULL,
    take_profit DECIMAL(10,5),
    pnl_pips DECIMAL(8,2),
    pnl_amount DECIMAL(15,4),
    risk_reward_ratio DECIMAL(6,3),
    
    -- マーケット環境 (Phase 1収集開始)
    atr_d1 DECIMAL(8,4), -- 日足ATR
    spread_at_entry DECIMAL(4,2),
    volatility_regime VARCHAR(20), -- LOW, MEDIUM, HIGH
    
    -- Phase 2/3 拡張用フィールド
    technical_indicators JSONB DEFAULT '{}',
    market_conditions JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Environment Table: 市場環境データ
CREATE TABLE market_environment (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    
    -- 基本ボラティリティ指標
    atr_d1_usdjpy DECIMAL(8,4),
    atr_d1_eurusd DECIMAL(8,4),
    daily_range_usdjpy DECIMAL(8,4),
    daily_range_eurusd DECIMAL(8,4),
    
    -- セッション別特性
    tokyo_session_range DECIMAL(8,4),
    europe_session_range DECIMAL(8,4),
    ny_session_range DECIMAL(8,4),
    
    -- 相関・外部指標 (Phase 2準備)
    vix_value DECIMAL(6,2),
    dxy_close DECIMAL(8,4),
    nikkei_change_percent DECIMAL(5,2),
    spx_change_percent DECIMAL(5,2),
    
    -- 経済指標・ニュース影響
    major_news_events TEXT[],
    economic_calendar_impact VARCHAR(10) CHECK (economic_calendar_impact IN ('LOW', 'MEDIUM', 'HIGH', 'NONE')),
    
    -- Phase 3 AI拡張用
    news_sentiment_score DECIMAL(4,2), -- -1.00 to +1.00
    ai_risk_assessment JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date)
);

-- Strategy Performance Metrics: 戦略別パフォーマンス
CREATE TABLE strategy_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    strategy_version VARCHAR(10) DEFAULT 'v1.2.0',
    
    -- Phase別性能追跡
    phase VARCHAR(10) DEFAULT 'Phase1' CHECK (phase IN ('Phase1', 'Phase2', 'Phase3')),
    
    -- 環境別成績 (Phase 2以降で活用)
    trending_market_winrate DECIMAL(5,2),
    ranging_market_winrate DECIMAL(5,2),
    high_vol_winrate DECIMAL(5,2),
    low_vol_winrate DECIMAL(5,2),
    
    -- セッション別成績
    europe_session_winrate DECIMAL(5,2),
    ny_session_winrate DECIMAL(5,2),
    
    -- 改善指標
    strategy_confidence_score DECIMAL(5,2), -- 0-100
    recommendation VARCHAR(50), -- 'CONTINUE', 'ADJUST_PARAMS', 'PAUSE'
    
    -- メタデータ
    total_samples INTEGER DEFAULT 0,
    data_quality_score DECIMAL(4,2) DEFAULT 100.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, strategy_version)
);

-- Backtest Results Table: バックテスト結果
CREATE TABLE backtest_results (
    id SERIAL PRIMARY KEY,
    
    -- バックテスト設定
    test_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    strategy_version VARCHAR(10) DEFAULT 'v1.2.0',
    parameters JSONB NOT NULL, -- 戦略パラメータ
    
    -- 結果サマリー
    total_trades INTEGER NOT NULL,
    winning_trades INTEGER NOT NULL,
    losing_trades INTEGER NOT NULL,
    win_rate DECIMAL(5,2) NOT NULL,
    
    -- 損益指標
    net_profit DECIMAL(15,4) NOT NULL,
    profit_factor DECIMAL(8,4),
    max_drawdown DECIMAL(10,4),
    max_drawdown_percent DECIMAL(5,2),
    sharpe_ratio DECIMAL(8,4),
    sortino_ratio DECIMAL(8,4),
    
    -- リスク指標
    var_95 DECIMAL(10,4), -- Value at Risk 95%
    expected_shortfall DECIMAL(10,4),
    max_consecutive_losses INTEGER,
    
    -- 追加メトリクス
    monthly_returns JSONB, -- 月次リターン配列
    daily_equity_curve JSONB, -- 日次資産曲線
    trade_distribution JSONB, -- 取引分布統計
    
    -- メタデータ
    execution_time_ms INTEGER,
    data_points_used INTEGER,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_daily_performance_date ON daily_performance(date DESC);
CREATE INDEX idx_trade_records_date ON trade_records(entry_time DESC);
CREATE INDEX idx_trade_records_symbol ON trade_records(symbol);
CREATE INDEX idx_market_environment_date ON market_environment(date DESC);
CREATE INDEX idx_strategy_metrics_date_version ON strategy_metrics(date DESC, strategy_version);
CREATE INDEX idx_backtest_results_created ON backtest_results(created_at DESC);

-- Performance tracking functions
CREATE OR REPLACE FUNCTION update_daily_performance() 
RETURNS TRIGGER AS $$
BEGIN
    -- 日次パフォーマンスを自動更新
    INSERT INTO daily_performance (
        date, total_trades, winning_trades, losing_trades,
        win_rate, gross_profit, gross_loss, net_profit
    )
    SELECT 
        DATE(entry_time),
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE pnl_amount > 0) as winning_trades,
        COUNT(*) FILTER (WHERE pnl_amount < 0) as losing_trades,
        ROUND(
            100.0 * COUNT(*) FILTER (WHERE pnl_amount > 0) / COUNT(*), 
            2
        ) as win_rate,
        COALESCE(SUM(pnl_amount) FILTER (WHERE pnl_amount > 0), 0) as gross_profit,
        COALESCE(SUM(pnl_amount) FILTER (WHERE pnl_amount < 0), 0) as gross_loss,
        COALESCE(SUM(pnl_amount), 0) as net_profit
    FROM trade_records 
    WHERE DATE(entry_time) = DATE(NEW.entry_time)
    ON CONFLICT (date) DO UPDATE SET
        total_trades = EXCLUDED.total_trades,
        winning_trades = EXCLUDED.winning_trades,
        losing_trades = EXCLUDED.losing_trades,
        win_rate = EXCLUDED.win_rate,
        gross_profit = EXCLUDED.gross_profit,
        gross_loss = EXCLUDED.gross_loss,
        net_profit = EXCLUDED.net_profit,
        updated_at = NOW();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic daily performance updates
CREATE TRIGGER trigger_update_daily_performance
    AFTER INSERT OR UPDATE OR DELETE ON trade_records
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_performance();

-- View: Current Phase Performance Summary
CREATE VIEW current_phase_summary AS
SELECT 
    'Phase1' as phase,
    COUNT(*) as total_days_active,
    AVG(win_rate) as avg_win_rate,
    AVG(net_profit) as avg_daily_profit,
    MAX(max_drawdown_percent) as worst_drawdown,
    AVG(sharpe_ratio) as avg_sharpe_ratio,
    COUNT(*) FILTER (WHERE win_rate >= 70) as days_above_target
FROM daily_performance 
WHERE created_at >= '2025-09-07'::date;

COMMENT ON TABLE daily_performance IS 'Phase 1: 日次パフォーマンス追跡';
COMMENT ON TABLE trade_records IS 'Phase 1: 全取引の詳細記録';  
COMMENT ON TABLE market_environment IS 'Phase 1-2: マーケット環境データ収集';
COMMENT ON TABLE strategy_metrics IS 'Phase 2-3: 戦略メトリクス追跡';
COMMENT ON TABLE backtest_results IS 'Phase 1-3: バックテスト結果保存';
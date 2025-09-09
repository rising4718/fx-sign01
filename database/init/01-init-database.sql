-- FX Sign Tool Database Initialization
-- 作成日: 2025-09-09
-- 用途: 開発・本番共通のDB初期化スクリプト

-- User Authentication Tables
-- ========================================

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'pro')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- ユーザーセッション/リフレッシュトークンテーブル
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Performance Tracking Tables
-- ========================================

-- 取引記録テーブル
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    
    -- ボックス情報
    box_high DECIMAL(10, 5) NOT NULL,
    box_low DECIMAL(10, 5) NOT NULL,
    box_width_pips DECIMAL(8, 2) NOT NULL,
    
    -- エントリー情報
    entry_session VARCHAR(20) NOT NULL,
    entry_price DECIMAL(10, 5) NOT NULL,
    entry_method VARCHAR(50),
    
    -- エグジット情報
    exit_price DECIMAL(10, 5),
    exit_reason VARCHAR(100),
    
    -- ポジション情報
    position_size DECIMAL(12, 2) NOT NULL,
    stop_loss DECIMAL(10, 5) NOT NULL,
    take_profit DECIMAL(10, 5),
    
    -- PnL情報
    pnl_pips DECIMAL(8, 2),
    pnl_amount DECIMAL(12, 2),
    risk_reward_ratio DECIMAL(6, 2),
    
    -- 市場環境データ
    atr_d1 DECIMAL(8, 5),
    spread_at_entry DECIMAL(6, 2),
    volatility_regime VARCHAR(20),
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 市場環境テーブル
CREATE TABLE IF NOT EXISTS market_environment (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    
    -- ATR データ
    atr_d1_usdjpy DECIMAL(8, 5),
    atr_d1_eurusd DECIMAL(8, 5),
    
    -- セッション別レンジデータ
    daily_range_usdjpy DECIMAL(8, 2),
    daily_range_eurusd DECIMAL(8, 2),
    tokyo_session_range DECIMAL(8, 2),
    europe_session_range DECIMAL(8, 2),
    ny_session_range DECIMAL(8, 2),
    
    -- 市場指標
    vix_value DECIMAL(6, 2),
    dxy_close DECIMAL(8, 3),
    nikkei_change_percent DECIMAL(6, 2),
    spx_change_percent DECIMAL(6, 2),
    
    -- ファンダメンタル情報
    major_news_events TEXT[],
    economic_calendar_impact VARCHAR(20),
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- バックテスト結果テーブル
CREATE TABLE IF NOT EXISTS backtest_results (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    strategy_version VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    
    -- 基本統計
    total_trades INTEGER NOT NULL,
    winning_trades INTEGER NOT NULL,
    losing_trades INTEGER NOT NULL,
    win_rate DECIMAL(5, 2) NOT NULL,
    net_profit DECIMAL(15, 2) NOT NULL,
    
    -- リスク指標
    profit_factor DECIMAL(8, 3),
    max_drawdown DECIMAL(15, 2),
    max_drawdown_percent DECIMAL(6, 2),
    sharpe_ratio DECIMAL(8, 4),
    sortino_ratio DECIMAL(8, 4),
    
    -- 詳細データ (JSON)
    monthly_returns JSONB,
    daily_equity_curve JSONB,
    notes TEXT,
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
-- ========================================

-- 取引テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_exit_time ON trades(exit_time);
CREATE INDEX IF NOT EXISTS idx_trades_entry_session ON trades(entry_session);
CREATE INDEX IF NOT EXISTS idx_trades_direction ON trades(direction);

-- 市場環境テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_market_environment_date ON market_environment(date);

-- バックテストテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_backtest_results_test_name ON backtest_results(test_name);
CREATE INDEX IF NOT EXISTS idx_backtest_results_start_date ON backtest_results(start_date);
CREATE INDEX IF NOT EXISTS idx_backtest_results_strategy_version ON backtest_results(strategy_version);

-- 開発用サンプルデータ投入
-- ========================================

-- サンプル取引データ (Phase 1 パフォーマンス用)
INSERT INTO trades (
    symbol, entry_time, exit_time, direction,
    box_high, box_low, box_width_pips,
    entry_session, entry_price, entry_method,
    exit_price, exit_reason,
    position_size, stop_loss, take_profit,
    pnl_pips, pnl_amount, risk_reward_ratio,
    atr_d1, spread_at_entry, volatility_regime
) VALUES 
-- 勝ちトレード例
('USDJPY', '2025-09-01 09:15:00+09:00', '2025-09-01 10:30:00+09:00', 'LONG',
 150.50, 149.80, 70, 'Tokyo', 150.05, 'Box breakout',
 150.35, 'Take profit', 10000, 149.70, 150.40,
 30, 300, 2.1, 0.65, 1.2, 'Normal'),

('USDJPY', '2025-09-02 09:45:00+09:00', '2025-09-02 11:15:00+09:00', 'SHORT',
 151.20, 150.60, 60, 'Tokyo', 150.85, 'Box breakdown',
 150.65, 'Take profit', 10000, 151.15, 150.55,
 20, 200, 1.8, 0.58, 1.1, 'Normal'),

-- 負けトレード例  
('USDJPY', '2025-09-03 09:30:00+09:00', '2025-09-03 09:45:00+09:00', 'LONG',
 149.90, 149.40, 50, 'Tokyo', 149.75, 'Box breakout',
 149.50, 'Stop loss', 10000, 149.45, 150.10,
 -25, -250, -1.0, 0.72, 1.3, 'High')

ON CONFLICT DO NOTHING;

-- サンプル市場環境データ
INSERT INTO market_environment (
    date, atr_d1_usdjpy, atr_d1_eurusd,
    daily_range_usdjpy, daily_range_eurusd,
    tokyo_session_range, europe_session_range, ny_session_range,
    vix_value, dxy_close, nikkei_change_percent, spx_change_percent,
    major_news_events, economic_calendar_impact
) VALUES
('2025-09-01', 0.65, 0.0082, 85, 95, 45, 65, 75, 18.5, 103.2, 1.2, 0.8, 
 ARRAY['BOJ Minutes'], 'Medium'),
('2025-09-02', 0.58, 0.0078, 70, 88, 40, 58, 68, 17.8, 103.0, -0.5, 0.3,
 ARRAY['ECB Speech'], 'Low'),
('2025-09-03', 0.72, 0.0095, 95, 105, 55, 78, 85, 21.2, 103.8, 2.1, -0.2,
 ARRAY['US Employment Data'], 'High')

ON CONFLICT (date) DO NOTHING;

-- サンプルバックテストデータ
INSERT INTO backtest_results (
    test_name, start_date, end_date, strategy_version, parameters,
    total_trades, winning_trades, losing_trades, win_rate, net_profit,
    profit_factor, max_drawdown, max_drawdown_percent, sharpe_ratio, sortino_ratio,
    monthly_returns, daily_equity_curve, notes
) VALUES
('Tokyo Box Strategy v1.0', '2025-08-01', '2025-08-31', 'v1.0.0',
 '{"boxWidthMin": 40, "boxWidthMax": 80, "sessionFilter": "Tokyo"}',
 120, 85, 35, 70.83, 4250,
 1.85, -850, -8.5, 1.42, 1.68,
 '{"2025-08": 4250}',
 '{"2025-08-31": 14250}',
 'Initial backtest on August data. Good performance in trending markets.')

ON CONFLICT DO NOTHING;

-- 統計情報更新
ANALYZE trades;
ANALYZE market_environment;
ANALYZE backtest_results;

-- 権限設定
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fxuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fxuser;
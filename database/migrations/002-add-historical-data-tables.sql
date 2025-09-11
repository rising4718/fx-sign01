-- Phase2: 履歴データ保存テーブル追加
-- 作成日: 2025-01-27
-- 用途: GMO API履歴データの蓄積と配信最適化

-- 価格履歴テーブル（1秒ごとのティック）
CREATE TABLE IF NOT EXISTS price_history (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    bid DECIMAL(10, 5) NOT NULL,
    ask DECIMAL(10, 5) NOT NULL,
    spread DECIMAL(6, 2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(20) DEFAULT 'gmo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- キャンドルデータテーブル（5分・15分足）
CREATE TABLE IF NOT EXISTS candle_data (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    timeframe VARCHAR(5) NOT NULL CHECK (timeframe IN ('5m', '15m')),
    open_price DECIMAL(10, 5) NOT NULL,
    high_price DECIMAL(10, 5) NOT NULL,
    low_price DECIMAL(10, 5) NOT NULL,
    close_price DECIMAL(10, 5) NOT NULL,
    volume DECIMAL(15, 2) DEFAULT 0,
    candle_start TIMESTAMP WITH TIME ZONE NOT NULL,
    candle_end TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(20) DEFAULT 'gmo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, timeframe, candle_start)
);

-- API呼び出し統計テーブル
CREATE TABLE IF NOT EXISTS api_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    data_points_collected INTEGER DEFAULT 0,
    UNIQUE(date, endpoint)
);

-- システムメトリクステーブル
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    memory_usage_mb INTEGER,
    cpu_usage_percent DECIMAL(5, 2),
    active_connections INTEGER,
    cache_size_kb INTEGER,
    db_connections INTEGER,
    response_time_avg_ms INTEGER
);

-- インデックス作成（パフォーマンス最適化）
-- ========================================

-- 価格履歴テーブル
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_timestamp ON price_history(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol);

-- キャンドルデータテーブル
CREATE INDEX IF NOT EXISTS idx_candle_data_symbol_timeframe_start ON candle_data(symbol, timeframe, candle_start DESC);
CREATE INDEX IF NOT EXISTS idx_candle_data_timestamp ON candle_data(candle_start DESC);
CREATE INDEX IF NOT EXISTS idx_candle_data_symbol_timeframe ON candle_data(symbol, timeframe);

-- API統計テーブル
CREATE INDEX IF NOT EXISTS idx_api_stats_date_endpoint ON api_stats(date DESC, endpoint);
CREATE INDEX IF NOT EXISTS idx_api_stats_date ON api_stats(date DESC);

-- システムメトリクス
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);

-- パーティショニング設定（大容量データ対応）
-- ========================================

-- 価格履歴テーブルを日付でパーティション（将来拡張用）
-- 注: PostgreSQL 10+でパーティショニング対応
-- CREATE TABLE price_history_2025_01 PARTITION OF price_history
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 権限設定
-- ========================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fxuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fxuser;

-- 統計情報更新
ANALYZE price_history;
ANALYZE candle_data;
ANALYZE api_stats;
ANALYZE system_metrics;
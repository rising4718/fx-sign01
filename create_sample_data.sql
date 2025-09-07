-- Sample Data for Phase 1 Testing
-- 作成日: 2025-09-07

-- First, create the performance tracking tables
\i backend/database/performance_tracking_schema.sql

-- Insert sample daily performance data
INSERT INTO daily_performance (
  date, total_trades, winning_trades, losing_trades, win_rate, 
  gross_profit, gross_loss, net_profit, profit_factor, max_drawdown_percent
) VALUES 
  ('2025-09-01', 5, 4, 1, 80.00, 1200, -200, 1000, 6.00, 2.5),
  ('2025-09-02', 3, 2, 1, 66.67, 800, -300, 500, 2.67, 3.1),
  ('2025-09-03', 4, 3, 1, 75.00, 900, -150, 750, 6.00, 1.8),
  ('2025-09-04', 6, 4, 2, 66.67, 1100, -400, 700, 2.75, 4.2),
  ('2025-09-05', 2, 2, 0, 100.00, 600, 0, 600, NULL, 0.0),
  ('2025-09-06', 4, 3, 1, 75.00, 950, -250, 700, 3.80, 2.8),
  ('2025-09-07', 3, 2, 1, 66.67, 700, -200, 500, 3.50, 2.1)
ON CONFLICT (date) DO NOTHING;

-- Insert sample trade records
INSERT INTO trade_records (
  symbol, entry_time, exit_time, direction, box_high, box_low, box_width_pips,
  entry_session, entry_price, entry_method, exit_price, exit_reason,
  position_size, stop_loss, take_profit, pnl_pips, pnl_amount, risk_reward_ratio,
  atr_d1, spread_at_entry, volatility_regime
) VALUES 
  -- 2025-09-01 trades
  ('USDJPY', '2025-09-01 16:15:00', '2025-09-01 17:30:00', 'LONG', 149.50, 149.10, 40, 
   'EUROPE', 149.52, 'RETEST', 149.82, 'TP_HIT', 10000, 149.05, 149.82, 30, 300, 1.88, 
   0.85, 1.5, 'MEDIUM'),
  
  ('USDJPY', '2025-09-01 21:45:00', '2025-09-01 22:15:00', 'SHORT', 149.60, 149.20, 40,
   'NY_EARLY', 149.58, 'RETEST', 149.28, 'TP_HIT', 10000, 149.65, 149.28, 30, 300, 1.40,
   0.85, 1.2, 'MEDIUM'),
   
  ('USDJPY', '2025-09-01 16:30:00', '2025-09-01 18:00:00', 'LONG', 149.55, 149.15, 40,
   'EUROPE', 149.57, 'RETEST', 149.72, 'TP_HIT', 15000, 149.10, 149.72, 15, 225, 1.07,
   0.85, 1.8, 'MEDIUM'),
   
  ('USDJPY', '2025-09-01 22:00:00', '2025-09-01 23:30:00', 'LONG', 149.45, 149.05, 40,
   'NY_EARLY', 149.47, 'RETEST', 149.77, 'TP_HIT', 12000, 149.00, 149.77, 30, 360, 1.60,
   0.85, 1.4, 'MEDIUM'),
   
  ('USDJPY', '2025-09-01 17:15:00', '2025-09-01 17:45:00', 'SHORT', 149.50, 149.10, 40,
   'EUROPE', 149.48, 'RETEST', 149.13, 'SL_HIT', 8000, 149.55, 149.13, -7, -56, 5.00,
   0.85, 1.3, 'MEDIUM'),
   
  -- 2025-09-02 trades  
  ('USDJPY', '2025-09-02 16:20:00', '2025-09-02 17:45:00', 'LONG', 150.00, 149.70, 30,
   'EUROPE', 150.02, 'RETEST', 150.17, 'TP_HIT', 12000, 149.65, 150.17, 15, 180, 1.67,
   0.78, 1.6, 'LOW'),
   
  ('USDJPY', '2025-09-02 21:30:00', '2025-09-02 22:00:00', 'SHORT', 150.10, 149.80, 30,
   'NY_EARLY', 150.08, 'RETEST', 149.93, 'TP_HIT', 14000, 150.15, 149.93, 15, 210, 2.14,
   0.78, 1.4, 'LOW'),
   
  ('USDJPY', '2025-09-02 16:45:00', '2025-09-02 17:15:00', 'LONG', 150.00, 149.70, 30,
   'EUROPE', 150.02, 'RETEST', 149.67, 'SL_HIT', 10000, 149.65, 150.02, -35, -350, 1.06,
   0.78, 1.7, 'LOW'),
   
  -- 2025-09-03 trades
  ('USDJPY', '2025-09-03 16:10:00', '2025-09-03 17:20:00', 'LONG', 149.80, 149.40, 40,
   'EUROPE', 149.82, 'RETEST', 150.07, 'TP_HIT', 11000, 149.35, 150.07, 25, 275, 1.79,
   0.88, 1.5, 'MEDIUM'),
   
  ('USDJPY', '2025-09-03 21:40:00', '2025-09-03 22:30:00', 'SHORT', 149.90, 149.50, 40,
   'NY_EARLY', 149.88, 'RETEST', 149.63, 'TP_HIT', 13000, 149.95, 149.63, 25, 325, 1.40,
   0.88, 1.3, 'MEDIUM'),
   
  ('USDJPY', '2025-09-03 16:35:00', '2025-09-03 18:00:00', 'LONG', 149.85, 149.45, 40,
   'EUROPE', 149.87, 'RETEST', 150.02, 'TP_HIT', 9000, 149.40, 150.02, 15, 135, 1.07,
   0.88, 1.8, 'MEDIUM'),
   
  ('USDJPY', '2025-09-03 17:00:00', '2025-09-03 17:20:00', 'SHORT', 149.80, 149.40, 40,
   'EUROPE', 149.78, 'RETEST', 149.43, 'SL_HIT', 7000, 149.85, 149.43, -7, -49, 5.00,
   0.88, 1.6, 'MEDIUM');

-- Insert sample market environment data
INSERT INTO market_environment (
  date, atr_d1_usdjpy, atr_d1_eurusd, daily_range_usdjpy, daily_range_eurusd,
  tokyo_session_range, europe_session_range, ny_session_range,
  vix_value, dxy_close, economic_calendar_impact
) VALUES 
  ('2025-09-01', 0.85, 0.0067, 0.92, 0.0071, 0.40, 0.52, 0.48, 18.5, 103.25, 'LOW'),
  ('2025-09-02', 0.78, 0.0061, 0.83, 0.0065, 0.30, 0.45, 0.42, 17.8, 103.15, 'NONE'),
  ('2025-09-03', 0.88, 0.0069, 0.95, 0.0073, 0.40, 0.58, 0.51, 19.2, 103.45, 'MEDIUM'),
  ('2025-09-04', 0.92, 0.0071, 1.05, 0.0078, 0.45, 0.62, 0.55, 20.1, 103.60, 'HIGH'),
  ('2025-09-05', 0.76, 0.0058, 0.79, 0.0062, 0.35, 0.38, 0.40, 16.9, 103.05, 'NONE'),
  ('2025-09-06', 0.81, 0.0064, 0.87, 0.0068, 0.38, 0.48, 0.44, 18.0, 103.30, 'LOW'),
  ('2025-09-07', 0.79, 0.0062, 0.84, 0.0066, 0.36, 0.46, 0.43, 17.5, 103.20, 'NONE')
ON CONFLICT (date) DO NOTHING;

-- Insert sample backtest result
INSERT INTO backtest_results (
  test_name, start_date, end_date, strategy_version, parameters,
  total_trades, winning_trades, losing_trades, win_rate,
  net_profit, profit_factor, max_drawdown, max_drawdown_percent,
  sharpe_ratio, sortino_ratio, notes
) VALUES (
  'Phase 1 Initial Backtest',
  '2023-01-01', '2025-08-31', 'v1.2.0',
  '{"box_min_width": 30, "box_max_width": 55, "atr_min": 70, "atr_max": 150, "risk_per_trade": 2}',
  245, 178, 67, 72.65,
  125000, 2.18, -18500, -12.3,
  1.45, 2.01,
  'Initial validation of TORB strategy with 2.5 years of historical data'
);

-- Update strategy metrics
INSERT INTO strategy_metrics (
  date, strategy_version, phase, 
  europe_session_winrate, ny_session_winrate,
  strategy_confidence_score, total_samples, recommendation
) VALUES 
  ('2025-09-07', 'v1.2.0', 'Phase1', 75.0, 68.5, 72.5, 27, 'CONTINUE')
ON CONFLICT (date, strategy_version) DO NOTHING;

-- Show summary
SELECT 'Sample data created successfully!' as message;
SELECT 
  'Performance Summary:' as section,
  COUNT(*) as days_with_data,
  AVG(win_rate) as avg_win_rate,
  SUM(net_profit) as total_profit
FROM daily_performance;

SELECT 
  'Trade Records:' as section,
  COUNT(*) as total_trades,
  COUNT(*) FILTER (WHERE pnl_amount > 0) as winning_trades,
  ROUND(100.0 * COUNT(*) FILTER (WHERE pnl_amount > 0) / COUNT(*), 2) as win_rate_pct
FROM trade_records;
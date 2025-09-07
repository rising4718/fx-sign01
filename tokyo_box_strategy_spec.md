# 東京ボックス・ブレイクアウト戦略 取引ルール仕様 v1.1

## 0. グローバル設定
```yaml
timezone: "Asia/Tokyo"
symbols: ["USDJPY", "EURUSD"]   # 初期はUSDJPY推奨
session:
  box:
    start: "09:00"
    end: "11:00"
trade:
  allowed_days: ["Tue","Wed","Thu","Fri"]   # 月曜除外、金曜はNY前半まで
  allowed_windows:
    - ["16:00","18:00"]     # 欧州初動
    - ["21:30","23:00"]     # NY序盤
holiday:
  skip: true
```

---

## 1. 事前フィルター

### ATRフィルター（日足）
```yaml
atr:
  timeframe: "1D"
  period: 14
  min_pips: 70
  max_pips: 150
```
- 範囲外の日は取引しない。

### ボックス幅
```yaml
box:
  min_width_pips: 30
  max_width_pips: 55
  dynamic_max: true   # ATRが高めなら70まで許容
```

### 指標回避
```yaml
news:
  skip_windows:
    high:  [-60, +90]   # 雇用統計・FOMC・CPI
    medium:[-30, +30]   # GDP・小売・ISM
    low:   [-15, +15]   # PMIなど
```

---

## 2. ブレイク判定（15分足）
```yaml
break:
  buffer_pips: 1.5
  real_body_only: true
```
- 上抜け: `close ≥ box_high + buffer`  
- 下抜け: `close ≤ box_low - buffer`  
- ヒゲ抜けは無効。

---

## 3. エントリー（5分足リテスト型）
```yaml
entry:
  method: "retest"
  retest_timeout_min: 30
  max_slippage_pips: 0.5
```
- 条件：ブレイク成立後、5分足でリテスト＆反発確認。  
- 上昇ブレイク → box高値付近で押し反発 → ロング  
- 下降ブレイク → box安値付近で戻り反発 → ショート  

---

## 4. 損切り・利確・時間切れ
```yaml
sl:
  mode: "structure_primary_atr_fallback"
  structure: "recent_swing_hl_lh"      # 直近5分足スイング
  atr_fallback:
    multiplier: 1.5                    # 1.5 × ATR(14,5m)
    min_distance: 15                   # 最小15pips確保
    max_distance: 60                   # 最大60pips制限
  buffer_pips: 1.5

tp:
  session_based:
    tokyo: 1.5R                        # 東京時間 9:00-15:00 JST
    london: 2.5R                       # ロンドン時間 16:00-24:00 JST  
    ny_early: 2.0R                     # NY序盤 22:00-02:00 JST
  partial:
    enable: true
    size: 0.5
    at_R: 1.0                          # 全セッション共通
  trail:
    enable: true

time_stop:
  enable: true
  max_hours_open: 4
```
- **SL優先順位**: 構造レベル → ATR基準 → 最小/最大制限  
- **TP**: セッション別利確目標 + 1Rでの部分利確  
- **時間切れ**: 4時間で未達ならクローズ  

---

## 5. リスク管理
```yaml
risk:
  per_trade_pct: 0.02   # 2%（少額期は2～3%まで）
  max_consecutive_losses: 3
  daily_drawdown_pct: -0.05
  max_positions: 1
```

---

## 6. 取引フロー
1. ATR判定（日足） → 範囲外なら **NoTrade**  
2. ボックス幅判定 → 範囲外なら **NoTrade**  
3. 曜日・時間チェック → 逸脱なら **NoTrade**  
4. 指標チェック → ウィンドウ内なら **NoEntry**  
5. 15分足ブレイク成立 → **Signal**  
6. 5分足リテスト確認 → **Entry**  
7. SL/TP設定、部分利確・トレール実行  
8. 時間切れ or ニュース直前 → 強制クローズ可  
9. 連敗・日次DDに達したら当日停止  

---

## 7. ログ仕様（最低限）
```yaml
log:
  fields:
    - date
    - symbol
    - box_high
    - box_low
    - box_width_pips
    - atr_d1
    - spread_at_entry
    - slippage_at_entry
    - break_time_15m
    - side
    - entry_time_5m
    - entry_price
    - sl
    - tp1
    - tp2
    - exit_time
    - exit_price
    - pnl_pips
    - pnl_jpy
    - reason_exit
```

---

## 8. モメンタムフィルター（Phase 2実装）
```yaml
momentum:
  rsi:
    period: 14
    timeframe: "5m"
    long_threshold: 45      # RSI >= 45 (ニュートラル以上)
    short_threshold: 55     # RSI <= 55 (ニュートラル以下)
  
  macd_histogram:
    enable: true
    direction_match: true   # ゼロライン方向一致確認のみ
    
volume_proxy:               # GMO API制限による代替指標
  tick_frequency: "1分間ティック数"
  spread_tightness: "bid-ask縮小率" 
  price_momentum: "直近3本の値幅合計"
```

---

## 9. 表示・UI仕様
```yaml
chart_layout:
  dual_chart:
    main: 
      timeframe: "15m"
      candles: 20           # 過去19本 + 現在1本
      width_ratio: 0.7      # 画面の70%
    detail:
      timeframe: "5m" 
      candles: 12           # 直近1時間分
      width_ratio: 0.3      # 画面の30%
      focus: "retest_area"  # リテスト確認用

overlays:
  tokyo_box:
    - range_lines         # ボックス高値/安値
    - breakout_arrows     # ブレイク矢印（15分足）
    - retest_markers      # リテスト成功マーク（5分足）
  
  risk_levels:
    - atr_sl_tp_lines     # ATR基準SL/TP
    - structure_levels    # 直近スウィング
    - session_targets     # セッション別利確目標
```

---

## 10. 可変パラメータ（調整レンジ）
- ATR範囲: 50〜90 / 140〜200  
- ボックス幅: 25〜40 / 50〜70  
- break buffer: 0.5〜3.0 pips  
- retest timeout: 10〜60分  
- ATR multiplier: 1.2〜1.8 (SL距離)
- TP最終R: 1.5〜2.8 (セッション別)
- risk per trade: 0.5〜3%  
- time stop: 2〜6時間  

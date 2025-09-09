# FX Sign Database Schema Documentation

**Generated:** 2025-09-09  
**Database:** PostgreSQL 15  
**Environment:** Development & Production

## Overview

The FX Sign Tool database consists of 5 main tables managing user authentication, trading performance tracking, market analysis, and backtesting results.

## Database Connection

```
Host: localhost (dev) / 46.250.250.63 (prod)
Port: 5432
Database: fx_sign_db
User: fxuser
```

## Tables

### 1. users - ユーザー認証システム

**Purpose:** User account management, authentication, and profile information

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, NOT NULL | nextval('users_id_seq') | ユーザーID |
| email | varchar(255) | UNIQUE, NOT NULL | - | メールアドレス |
| password_hash | varchar(255) | NOT NULL | - | ハッシュ化パスワード |
| display_name | varchar(100) | NOT NULL | - | 表示名 |
| plan_type | varchar(20) | CHECK | 'free' | プランタイプ (free/basic/pro) |
| is_email_verified | boolean | - | false | メール認証状態 |
| email_verification_token | varchar(255) | - | null | メール認証トークン |
| password_reset_token | varchar(255) | - | null | パスワードリセットトークン |
| password_reset_expires | timestamptz | - | null | リセットトークン期限 |
| created_at | timestamptz | - | now() | 作成日時 |
| updated_at | timestamptz | - | now() | 更新日時 |
| last_login | timestamptz | - | null | 最終ログイン |

**Indexes:**
- `users_pkey` PRIMARY KEY (id)
- `users_email_key` UNIQUE (email)

**Check Constraints:**
- `users_plan_type_check` plan_type IN ('free', 'basic', 'pro')

### 2. user_sessions - ユーザーセッション管理

**Purpose:** Refresh token management and session tracking

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, NOT NULL | nextval('user_sessions_id_seq') | セッションID |
| user_id | integer | FOREIGN KEY | - | ユーザーID (users.id) |
| refresh_token | varchar(500) | NOT NULL | - | リフレッシュトークン |
| expires_at | timestamptz | NOT NULL | - | トークン期限 |
| created_at | timestamptz | - | now() | 作成日時 |
| user_agent | text | - | null | ユーザーエージェント |
| ip_address | inet | - | null | IPアドレス |

**Indexes:**
- `user_sessions_pkey` PRIMARY KEY (id)

**Foreign Keys:**
- `user_sessions_user_id_fkey` REFERENCES users(id) ON DELETE CASCADE

### 3. trades - 取引記録テーブル

**Purpose:** Tokyo Box Strategy trading records and performance tracking

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, NOT NULL | nextval('trades_id_seq') | 取引ID |
| symbol | varchar(10) | NOT NULL | - | 通貨ペア (USDJPY等) |
| entry_time | timestamptz | NOT NULL | - | エントリー時刻 |
| exit_time | timestamptz | - | null | エグジット時刻 |
| direction | varchar(10) | NOT NULL, CHECK | - | 売買方向 (LONG/SHORT) |
| box_high | numeric(10,5) | NOT NULL | - | ボックス高値 |
| box_low | numeric(10,5) | NOT NULL | - | ボックス安値 |
| box_width_pips | numeric(8,2) | NOT NULL | - | ボックス幅 (pips) |
| entry_session | varchar(20) | NOT NULL | - | エントリーセッション |
| entry_price | numeric(10,5) | NOT NULL | - | エントリー価格 |
| entry_method | varchar(50) | - | null | エントリー手法 |
| exit_price | numeric(10,5) | - | null | エグジット価格 |
| exit_reason | varchar(100) | - | null | エグジット理由 |
| position_size | numeric(12,2) | NOT NULL | - | ポジションサイズ |
| stop_loss | numeric(10,5) | NOT NULL | - | ストップロス |
| take_profit | numeric(10,5) | - | null | テイクプロフィット |
| pnl_pips | numeric(8,2) | - | null | 損益 (pips) |
| pnl_amount | numeric(12,2) | - | null | 損益金額 |
| risk_reward_ratio | numeric(6,2) | - | null | リスクリワード比率 |
| atr_d1 | numeric(8,5) | - | null | 日足ATR |
| spread_at_entry | numeric(6,2) | - | null | エントリー時スプレッド |
| volatility_regime | varchar(20) | - | null | ボラティリティ体制 |
| created_at | timestamptz | - | now() | 作成日時 |
| updated_at | timestamptz | - | now() | 更新日時 |

**Indexes:**
- `trades_pkey` PRIMARY KEY (id)
- `idx_trades_symbol` (symbol)
- `idx_trades_entry_time` (entry_time)
- `idx_trades_exit_time` (exit_time) 
- `idx_trades_entry_session` (entry_session)
- `idx_trades_direction` (direction)

**Check Constraints:**
- `trades_direction_check` direction IN ('LONG', 'SHORT')

### 4. market_environment - マーケット環境データ

**Purpose:** Daily market conditions and economic indicators

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, NOT NULL | nextval('market_environment_id_seq') | 環境ID |
| date | date | UNIQUE, NOT NULL | - | 日付 |
| atr_d1_usdjpy | numeric(8,5) | - | null | USDJPY日足ATR |
| atr_d1_eurusd | numeric(8,5) | - | null | EURUSD日足ATR |
| daily_range_usdjpy | numeric(8,2) | - | null | USDJPY日足レンジ |
| daily_range_eurusd | numeric(8,2) | - | null | EURUSD日足レンジ |
| tokyo_session_range | numeric(8,2) | - | null | 東京セッションレンジ |
| europe_session_range | numeric(8,2) | - | null | 欧州セッションレンジ |
| ny_session_range | numeric(8,2) | - | null | NY セッションレンジ |
| vix_value | numeric(6,2) | - | null | VIX値 |
| dxy_close | numeric(8,3) | - | null | ドルインデックス終値 |
| nikkei_change_percent | numeric(6,2) | - | null | 日経平均変化率 |
| spx_change_percent | numeric(6,2) | - | null | S&P500変化率 |
| major_news_events | text[] | - | null | 重要ニュースイベント |
| economic_calendar_impact | varchar(20) | - | null | 経済カレンダー影響度 |
| created_at | timestamptz | - | now() | 作成日時 |

**Indexes:**
- `market_environment_pkey` PRIMARY KEY (id)
- `market_environment_date_key` UNIQUE (date)
- `idx_market_environment_date` (date)

### 5. backtest_results - バックテスト結果

**Purpose:** Strategy backtesting performance results storage

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, NOT NULL | nextval('backtest_results_id_seq') | 結果ID |
| test_name | varchar(255) | NOT NULL | - | テスト名 |
| start_date | date | NOT NULL | - | テスト開始日 |
| end_date | date | NOT NULL | - | テスト終了日 |
| strategy_version | varchar(100) | NOT NULL | - | 戦略バージョン |
| parameters | jsonb | NOT NULL | - | パラメータ設定 |
| total_trades | integer | NOT NULL | - | 総取引数 |
| winning_trades | integer | NOT NULL | - | 勝ちトレード数 |
| losing_trades | integer | NOT NULL | - | 負けトレード数 |
| win_rate | numeric(5,2) | NOT NULL | - | 勝率 (%) |
| net_profit | numeric(15,2) | NOT NULL | - | 純利益 |
| profit_factor | numeric(8,3) | - | null | プロフィットファクター |
| max_drawdown | numeric(15,2) | - | null | 最大ドローダウン |
| max_drawdown_percent | numeric(6,2) | - | null | 最大ドローダウン (%) |
| sharpe_ratio | numeric(8,4) | - | null | シャープレシオ |
| sortino_ratio | numeric(8,4) | - | null | ソルティノレシオ |
| monthly_returns | jsonb | - | null | 月間リターン |
| daily_equity_curve | jsonb | - | null | 日次資産曲線 |
| notes | text | - | null | 備考 |
| created_at | timestamptz | - | now() | 作成日時 |

**Indexes:**
- `backtest_results_pkey` PRIMARY KEY (id)
- `idx_backtest_results_test_name` (test_name)
- `idx_backtest_results_start_date` (start_date)
- `idx_backtest_results_strategy_version` (strategy_version)

## Relationships

### ER Diagram
```
users (1) ──── (N) user_sessions
```

## Data Types Used

- `integer` - Auto-incrementing IDs
- `varchar(N)` - Variable length strings
- `text` - Unlimited text
- `timestamptz` - Timezone-aware timestamps
- `date` - Date values
- `numeric(p,s)` - Precise decimal numbers
- `boolean` - True/false values
- `jsonb` - Binary JSON data
- `text[]` - Array of text values
- `inet` - IP address storage

## Migration Strategy

Current status: **Prisma Migration System** (✅ Implemented)

**Completed Prisma Implementation:**
1. ✅ Prisma CLI and Client installed and configured
2. ✅ Schema generated from existing database with type-safe enums
3. ✅ Baseline migration created (`20250909092145_initial_schema`)
4. ✅ Prisma Client integrated in application code
5. ✅ All raw SQL queries replaced with type-safe Prisma queries

## Sample Data

**Users:** 1 test user (test2@example.com)  
**Trades:** 0 records (clean database after migration)  
**Market Environment:** Empty (ready for data)  
**Backtest Results:** Empty (ready for data)  
**User Sessions:** Active session data

## Migration Implementation Status

1. ✅ **Schema Documentation** - This document
2. ✅ **Prisma Integration** - Installed and configured with TypeScript
3. ✅ **Migration Generation** - Initial migration `20250909092145_initial_schema` created
4. ✅ **Code Migration** - All auth services migrated to Prisma Client
5. ✅ **Testing** - Registration and login verified working with Prisma

## Available Prisma Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Push schema changes without migration (development)
npx prisma db push
```

---

**Last Updated:** 2025-09-09  
**Generated by:** Claude Code Analysis  
**Status:** Prisma Migration System Implemented ✅
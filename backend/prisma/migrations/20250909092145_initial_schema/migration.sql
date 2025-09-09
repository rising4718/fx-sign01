-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('free', 'basic', 'pro');

-- CreateEnum
CREATE TYPE "public"."TradeDirection" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "public"."ExitReason" AS ENUM ('Take profit', 'Stop loss', 'TIME_STOP', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."EntryMethod" AS ENUM ('Box breakdown', 'Box breakout', 'RETEST', 'DIRECT_BREAK');

-- CreateEnum
CREATE TYPE "public"."EntrySession" AS ENUM ('Tokyo', 'EUROPE', 'NY_EARLY');

-- CreateEnum
CREATE TYPE "public"."VolatilityRegime" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "public"."backtest_results" (
    "id" SERIAL NOT NULL,
    "test_name" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "strategy_version" VARCHAR(100) NOT NULL,
    "parameters" JSONB NOT NULL,
    "total_trades" INTEGER NOT NULL,
    "winning_trades" INTEGER NOT NULL,
    "losing_trades" INTEGER NOT NULL,
    "win_rate" DECIMAL(5,2) NOT NULL,
    "net_profit" DECIMAL(15,2) NOT NULL,
    "profit_factor" DECIMAL(8,3),
    "max_drawdown" DECIMAL(15,2),
    "max_drawdown_percent" DECIMAL(6,2),
    "sharpe_ratio" DECIMAL(8,4),
    "sortino_ratio" DECIMAL(8,4),
    "monthly_returns" JSONB,
    "daily_equity_curve" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backtest_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."market_environment" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "atr_d1_usdjpy" DECIMAL(8,5),
    "atr_d1_eurusd" DECIMAL(8,5),
    "daily_range_usdjpy" DECIMAL(8,2),
    "daily_range_eurusd" DECIMAL(8,2),
    "tokyo_session_range" DECIMAL(8,2),
    "europe_session_range" DECIMAL(8,2),
    "ny_session_range" DECIMAL(8,2),
    "vix_value" DECIMAL(6,2),
    "dxy_close" DECIMAL(8,3),
    "nikkei_change_percent" DECIMAL(6,2),
    "spx_change_percent" DECIMAL(6,2),
    "major_news_events" TEXT[],
    "economic_calendar_impact" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_environment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trades" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "entry_time" TIMESTAMPTZ(6) NOT NULL,
    "exit_time" TIMESTAMPTZ(6),
    "direction" "public"."TradeDirection" NOT NULL,
    "box_high" DECIMAL(10,5) NOT NULL,
    "box_low" DECIMAL(10,5) NOT NULL,
    "box_width_pips" DECIMAL(8,2) NOT NULL,
    "entry_session" "public"."EntrySession" NOT NULL,
    "entry_price" DECIMAL(10,5) NOT NULL,
    "entry_method" "public"."EntryMethod",
    "exit_price" DECIMAL(10,5),
    "exit_reason" "public"."ExitReason",
    "position_size" DECIMAL(12,2) NOT NULL,
    "stop_loss" DECIMAL(10,5) NOT NULL,
    "take_profit" DECIMAL(10,5),
    "pnl_pips" DECIMAL(8,2),
    "pnl_amount" DECIMAL(12,2),
    "risk_reward_ratio" DECIMAL(6,2),
    "atr_d1" DECIMAL(8,5),
    "spread_at_entry" DECIMAL(6,2),
    "volatility_regime" "public"."VolatilityRegime",
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "refresh_token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_address" INET,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "plan_type" "public"."PlanType" NOT NULL DEFAULT 'free',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" VARCHAR(255),
    "password_reset_token" VARCHAR(255),
    "password_reset_expires" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_backtest_results_start_date" ON "public"."backtest_results"("start_date");

-- CreateIndex
CREATE INDEX "idx_backtest_results_strategy_version" ON "public"."backtest_results"("strategy_version");

-- CreateIndex
CREATE INDEX "idx_backtest_results_test_name" ON "public"."backtest_results"("test_name");

-- CreateIndex
CREATE UNIQUE INDEX "market_environment_date_key" ON "public"."market_environment"("date");

-- CreateIndex
CREATE INDEX "idx_market_environment_date" ON "public"."market_environment"("date");

-- CreateIndex
CREATE INDEX "idx_trades_direction" ON "public"."trades"("direction");

-- CreateIndex
CREATE INDEX "idx_trades_entry_session" ON "public"."trades"("entry_session");

-- CreateIndex
CREATE INDEX "idx_trades_entry_time" ON "public"."trades"("entry_time");

-- CreateIndex
CREATE INDEX "idx_trades_exit_time" ON "public"."trades"("exit_time");

-- CreateIndex
CREATE INDEX "idx_trades_symbol" ON "public"."trades"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

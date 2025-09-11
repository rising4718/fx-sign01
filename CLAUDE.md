# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

FX Pattern Analyzer - USD/JPYデイトレード用の高度なパターン分析ツールで、Tokyo Opening Range Breakout（TORB）戦略に特化したWebアプリケーション。

### アーキテクチャ構成

- **Backend**: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL + WebSocket
- **Frontend**: React + TypeScript + Vite + Ant Design + Lightweight Charts
- **Database**: PostgreSQL（開発：Docker / 本番：Contabo VPS）
- **External APIs**: GMO Coin WebSocket + OANDA REST API + Alpha Vantage
- **Deployment**: GitHub Actions + PM2 + Nginx Reverse Proxy

### ディレクトリ構造
```
├── backend/          # Node.js Express API server
│   ├── src/         
│   │   ├── services/    # fxDataService, historyAccumulationService
│   │   ├── routes/      # API endpoints + WebSocket handlers
│   │   ├── models/      # Prisma database models
│   │   └── server.ts    # Express server entry point
│   └── prisma/          # Database schema and migrations
├── frontend/         # React + Vite application  
│   ├── src/
│   │   ├── components/  # DualChart, TradingPage
│   │   ├── hooks/       # useMultiCurrencyData, useWebSocket
│   │   ├── services/    # fxApi, cacheService, websocketService
│   │   └── pages/       # Main application pages
└── database/         # Migration scripts and SQL files
```

### 重要な技術的特徴

- **Real-time Data**: WebSocket + キャッシュシステムで1秒間隔価格更新
- **TORB Strategy**: Tokyo Box (9:00-11:00 JST) ブレイクアウト戦略実装
- **Performance**: フロントエンドキャッシュ + バックエンドDB履歴蓄積の二層構造
- **Data Sources**: GMO Coin（リアルタイム） + OANDA（バックフィル） + Alpha Vantage（補完）

## 🚀 デプロイメント

### GitHub Actions自動デプロイ (推奨)
- `git push origin main` - mainブランチへのプッシュで自動デプロイ実行
- デプロイ監視: https://github.com/rising4718/fx-sign01/actions

### ⚠️ **必須デプロイルール**: ワークフロー検証・失敗修正の徹底
**デプロイ後は必ずワークフロー結果を確認し、失敗時は修正を繰り返し成功まで継続すること**

```bash
# 1. プッシュ後のワークフロー確認
gh run list --repo rising4718/fx-sign01 --limit 1

# 2. 失敗時の詳細確認
gh run view [RUN_ID] --repo rising4718/fx-sign01

# 3. 失敗ログの確認
gh run view [RUN_ID] --log-failed --repo rising4718/fx-sign01

# 4. エラー修正後、再度プッシュ
git add . && git commit -m "fix: [エラー内容]" && git push origin main

# 5. 成功まで 1-4 を繰り返す
```

**デプロイ完了基準**: 
- ✅ GitHub Actions: `completed success`
- ✅ ヘルスチェック: `curl -f https://fxbuybuy.site/api/health`

### 手動デプロイ (緊急時のみ)
- SSH接続: `ssh root@46.250.250.63`
- デプロイスクリプト: `cd /var/www/fx-sign01 && ./deploy.sh`

### ヘルスチェック
- `curl https://fxbuybuy.site/api/health`

## 🔧 品質チェック

### Backend
- `cd backend && npm run lint` - ESLint実行
- `cd backend && npm run build` - TypeScript コンパイル
- `cd backend && npm test` - テスト実行

### Frontend  
- `cd frontend && npm run lint` - ESLint実行
- `cd frontend && npm run build` - Vite ビルド
- `cd frontend && npm test -- --run` - Vitest実行

## 🗃️ データベース管理 (Prisma)

### マイグレーション
- `cd backend && npx prisma migrate dev --name migration_name` - 新規マイグレーション作成
- `cd backend && npx prisma migrate deploy` - 本番環境マイグレーション実行
- `cd backend && npx prisma migrate reset` - 開発環境DB完全リセット

### スキーマ管理
- `cd backend && npx prisma generate` - Prisma Client再生成
- `cd backend && npx prisma db push` - スキーマをDBに直接プッシュ（開発用）
- `cd backend && npx prisma studio` - データベースGUI起動

### データベース確認
- `cd backend && npx prisma db seed` - シードデータ投入
- `cd backend && npx prisma format` - スキーマファイルフォーマット

## 🐳 Docker環境 (推奨)

### PostgreSQL起動
- `docker-compose up -d postgres` - PostgreSQLコンテナ起動
- **URL**: postgresql://fxuser:fxpass123@localhost:5432/fx_sign_db
- **管理GUI**: `docker-compose --profile tools up -d pgadmin` → http://localhost:8080

### 環境確認
- `docker-compose ps` - コンテナ状態確認
- `PGPASSWORD=fxpass123 psql -h localhost -U fxuser -d fx_sign_db -c "SELECT 1;"` - DB接続テスト

## 💻 開発サーバー

### Backend開発サーバー
- `cd backend && NODE_ENV=development npm run dev` - **NODE_ENV必須**
- ポート: http://localhost:3002
- **前提**: PostgreSQLコンテナ起動済み

### Frontend開発サーバー
- `cd frontend && npm run dev` - 自動でdevelopmentモード
- ポート: http://localhost:5173

### ⚠️ 重要事項
- **PostgreSQL**: Docker Composeで起動必須
- **Backend起動時**: `NODE_ENV=development` 必須
- **ポート競合チェック**: `lsof -i :3002` `lsof -i :5173`
- **プロセス確認**: 起動前に既存プロセスを確認すること

## 💰 リアルタイム価格更新デバッグ

### コンソール監視コマンド
```bash
# ブラウザ開発者ツールで以下のログを確認
🔄 setInterval実行中    # 1秒間隔実行確認
✅ 現在価格取得成功     # API成功
💰 価格表示更新        # 価格変動詳細
📈 チャートデータ更新   # チャート同期
🎲 フォールバック価格   # API失敗時
```

### UI監視方法
- **デバッグタブ**: 取引画面の「🐛 デバッグ情報」タブ
- **価格更新状況**: API成功率・更新回数・最終更新時刻
- **⚠️ 重要**: モックデータ使用は絶対禁止・実価格のみ使用

### トラブルシューティング
- **価格が更新されない**: ブラウザコンソールで setInterval ログ確認
- **API失敗が多い**: フォールバック率が50%超の場合は要調査
- **チャート未更新**: 📈 ログとデータ本数を確認

## 📊 PM2管理

- `ssh root@46.250.250.63 'pm2 status'` - プロセス状態確認
- `ssh root@46.250.250.63 'pm2 logs fx-sign-backend'` - ログ確認  
- `ssh root@46.250.250.63 'pm2 reload fx-sign-backend'` - ゼロダウンタイム再起動
- `ssh root@46.250.250.63 'pm2 monit'` - リアルタイム監視

## 🐛 トラブルシューティング

### ESLint設定確認
- Backend: `ls backend/.eslintrc.js`
- Frontend: `cat frontend/eslint.config.js`

### TypeScriptエラー対処
- `process.env` → `import.meta.env.MODE` (Frontend)
- void関数で早期return回避 (Backend)

### ブランチ確認
- `ssh root@46.250.250.63 'cd /var/www/fx-sign01 && git branch'`

## 🚨 Claude厳守ルール（必須遵守）

### 開発手順の鉄則
- **ローカル環境で完全動作させてからデプロイ**すること
- **エラーや問題は根本原因を解決**する（回避策や代替手段は禁止）
- **通常の開発手順を厳守**: ローカル開発 → テスト → デプロイ
- **本番環境のデータベースに開発中はアクセス禁止**

### 問題解決アプローチ
- **エラー発生時は必ず根本原因を特定・修正**する
- **回避策や一時的な解決策は提案禁止**
- **開発バイパス機能は開発時のみ使用、本番機能は必ず修正**
- **"動かない → 代替案"ではなく"動かない → 根本修正"**

### 質問対応
- **質問されたとき**（質問といわれたとき、末尾が？の時、相談されたような文面の時）
- **まずは回答のみ**して**必ず許可を得てから実行**すること

### サーバー管理
- **開発環境でむやみにnpm run devをしない**
- **起動状態を確認**して**停止しているときのみ**サーバーを起動する
- **VITEを導入**しているので**再起動の必要はない**

### データベース管理
- **開発環境は必ずローカルDocker PostgreSQLを使用**
- **本番DBと開発DBは完全分離**
- **環境変数でDB接続先を正しく設定**

### デプロイメント
- **デプロイする際はデプロイドキュメントを確認の上行う**こと
- **デプロイ前に必ずローカルで完全動作確認**

## 📋 注意事項

- **推奨**: GitHub Actionsによる自動デプロイを使用
- **品質**: 全プッシュ前にlint・buildチェック実行
- **環境変数**: Backend開発時はNODE_ENV=development必須
- **ポート管理**: 開発サーバー起動前にプロセス確認
- **監視**: デプロイ後は必ずヘルスチェック確認

---

**最終更新**: 2025-09-09  
**プロジェクト**: FX Pattern Analyzer v2.4.0 - Tokyo Box Strategy Implementation
- 回答は必ず日本語で
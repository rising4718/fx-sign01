# FX Pattern Analyzer - 統合運用ガイド

**最終更新**: 2025-09-11  
**バージョン**: v4.0 Unified Edition  
**ステータス**: Production Ready

---

## 📋 目次

1. [本番環境概要](#本番環境概要)
2. [開発環境セットアップ](#開発環境セットアップ)
3. [デプロイメント](#デプロイメント)
4. [運用・監視](#運用監視)
5. [トラブルシューティング](#トラブルシューティング)
6. [セキュリティ運用](#セキュリティ運用)
7. [データベース運用](#データベース運用)
8. [バックアップ・復旧](#バックアップ復旧)

---

## 本番環境概要

### 🌐 サービス情報
```yaml
production_url: "https://fxbuybuy.site"
status: "Production Ready"
ssl: "Cloudflare Origin Certificate (15年有効)"
uptime: "99.9%+ 目標"
security_level: "Full (strict)"
```

### 🖥️ VPS構成
```yaml
provider: "Contabo Cloud VPS 20"
specifications:
  cpu: "6vCPU"
  ram: "12GB"
  storage: "100GB NVMe"
  traffic: "32TB/月"
  region: "東京（アジア）"
cost: "€11.3/月 (€7.0 + €4.3 東京追加料金)"

server_details:
  ip: "46.250.250.63"
  os: "Ubuntu 24.04 LTS (Noble Numbat)"
  support: "2029年4月まで"
  user: "root"
```

### 🛠️ ソフトウェアスタック
```yaml
runtime:
  nodejs: "22.x LTS (Jod)"
  support: "2027年4月まで"
  
frontend:
  framework: "React 19"
  language: "TypeScript"
  ui_library: "Ant Design"
  charts: "TradingView Lightweight Charts v5.0.8"
  build_tool: "Vite"
  
backend:
  framework: "Express.js"
  language: "TypeScript"
  websocket: "Socket.io"
  orm: "Prisma"
  
infrastructure:
  web_server: "Nginx (リバースプロキシ)"
  process_manager: "PM2"
  database: "PostgreSQL 16"
  ssl: "Cloudflare Origin Certificate"
```

---

## 開発環境セットアップ

### 💻 必要なソフトウェア
```bash
# Node.js環境
- Node.js 22.x LTS
- npm 10.x
- Git

# データベース
- Docker & Docker Compose (推奨)
- PostgreSQL 16 (ローカル)
```

### 🏗️ プロジェクト構成
```
fx-sign01/
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # UIコンポーネント
│   │   ├── pages/          # ページコンポーネント
│   │   ├── services/       # API・キャッシュサービス
│   │   ├── hooks/          # カスタムhook
│   │   └── utils/          # ユーティリティ
│   └── package.json
├── backend/                # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/         # APIルート
│   │   ├── services/       # ビジネスロジック
│   │   ├── models/         # データモデル
│   │   └── types/          # TypeScript型定義
│   └── package.json
├── database/               # データベース関連
│   ├── migrations/         # マイグレーションファイル
│   └── seeds/             # シードデータ
├── .github/workflows/     # GitHub Actions CI/CD
└── docs-archive/          # 旧ドキュメント
```

### 🐳 Docker環境セットアップ
```bash
# PostgreSQL起動（推奨）
docker-compose up -d postgres

# 接続確認
PGPASSWORD=fxpass123 psql -h localhost -U fxuser -d fx_sign_db -c "SELECT 1;"

# 管理GUI（オプション）
docker-compose --profile tools up -d pgadmin
# アクセス: http://localhost:8080
```

### 🚀 開発サーバー起動

#### Frontend開発サーバー
```bash
cd frontend
npm install
npm run dev

# アクセス: http://localhost:5173
# 特徴: 
# - 自動リロード有効
# - Vite Hot Module Replacement
```

#### Backend開発サーバー
```bash
cd backend
npm install
NODE_ENV=development npm run dev

# アクセス: http://localhost:3002
# 特徴:
# - ホットリロード有効 (Nodemon)
# - NODE_ENV=development必須
```

### 🧪 品質チェック
```bash
# Lint実行
cd frontend && npm run lint
cd backend && npm run lint

# TypeScriptチェック
cd frontend && npm run build
cd backend && npm run build

# テスト実行
cd frontend && npm test
cd backend && npm test
```

---

## デプロイメント

### 🎯 GitHub Actions自動デプロイ（推奨）

#### デプロイトリガー
```bash
# メインブランチにプッシュで自動デプロイ
git add .
git commit -m "feat: 新機能実装"
git push origin main

# デプロイ監視
gh run list --repo rising4718/fx-sign01 --limit 1
```

#### ⚠️ 必須デプロイルール
**デプロイ後は必ずワークフロー結果を確認し、失敗時は修正を繰り返し成功まで継続すること**

```bash
# 1. ワークフロー確認
gh run list --repo rising4718/fx-sign01 --limit 1

# 2. 失敗時の詳細確認
gh run view [RUN_ID] --repo rising4718/fx-sign01

# 3. 失敗ログの確認
gh run view [RUN_ID] --log-failed --repo rising4718/fx-sign01

# 4. エラー修正後、再度プッシュ
git add . && git commit -m "fix: [エラー内容]" && git push origin main

# 5. 成功まで 1-4 を繰り返す
```

#### デプロイ完了基準
```yaml
github_actions: "completed success"
health_check: "curl -f https://fxbuybuy.site/api/health"
ssl_check: "https://fxbuybuy.site アクセス正常"
websocket_check: "リアルタイム価格更新確認"
```

### 🔧 手動デプロイ（緊急時のみ）
```bash
# VPS接続
ssh root@46.250.250.63

# デプロイスクリプト実行
cd /var/www/fx-sign01
./deploy.sh

# サービス確認
pm2 status
pm2 logs fx-sign-backend
```

### ✅ デプロイ前チェックリスト
```bash
# ローカルテスト
npm run lint && npm run build    # Frontend
npm run lint && npm run build    # Backend
npm test                         # テスト実行

# 環境変数確認
grep NODE_ENV .env              # production設定確認
grep DATABASE_URL .env          # DB接続先確認

# ブランチ確認
git branch                      # mainブランチ確認
git status                      # コミット状況確認
```

---

## 運用・監視

### 📊 サービス監視

#### ヘルスチェック
```bash
# API正常性確認
curl https://fxbuybuy.site/api/health

# レスポンス例
{
  "status": "ok",
  "timestamp": "2025-09-11T12:00:00Z",
  "database": "connected",
  "version": "v2.4.0"
}
```

#### PM2プロセス管理
```bash
# リモートプロセス状態確認
ssh root@46.250.250.63 'pm2 status'

# ログ確認
ssh root@46.250.250.63 'pm2 logs fx-sign-backend'

# リアルタイム監視
ssh root@46.250.250.63 'pm2 monit'

# ゼロダウンタイム再起動
ssh root@46.250.250.63 'pm2 reload fx-sign-backend'
```

#### システムリソース監視
```bash
# CPU・メモリ使用率
ssh root@46.250.250.63 'top'

# ディスク使用量
ssh root@46.250.250.63 'df -h'

# ネットワーク接続
ssh root@46.250.250.63 'netstat -tulpn | grep :3002'
```

### 📈 パフォーマンス監視

#### 応答時間監視
```bash
# API応答時間測定
time curl -s https://fxbuybuy.site/api/health

# WebSocket接続テスト
wscat -c wss://fxbuybuy.site/socket.io/
```

#### データベースパフォーマンス
```bash
# DB接続確認
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db -c "SELECT 1;"

# 実行時間の長いクエリ確認
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"
```

---

## トラブルシューティング

### 🐛 一般的な問題と解決策

#### ポート競合エラー
```bash
# 使用中のポートを確認
lsof -i :3002  # Backend
lsof -i :5173  # Frontend

# プロセス終了
kill -9 <PID>

# 注意: 開発サーバー起動前に必ず既存プロセス確認
```

#### TypeScriptエラー
```bash
# Backend: "Not all code paths return a value"
# 対処: void関数では早期returnではなくif-elseを使用

# Frontend: "Cannot find name 'process'"
# 対処: process.env.NODE_ENV → import.meta.env.MODE を使用
```

#### 環境変数エラー
```bash
# Backend: NODE_ENV=development必須
cd backend && NODE_ENV=development npm run dev

# Frontend: Vite環境変数確認
cd frontend && npm run dev  # 自動でdevelopmentモード
```

### 🚨 本番環境トラブル

#### サービス停止時の対応
```bash
# 1. サービス状態確認
ssh root@46.250.250.63 'pm2 status'

# 2. ログ確認
ssh root@46.250.250.63 'pm2 logs fx-sign-backend --lines 50'

# 3. サービス再起動
ssh root@46.250.250.63 'pm2 restart fx-sign-backend'

# 4. 失敗時は再起動
ssh root@46.250.250.63 'pm2 delete fx-sign-backend && pm2 start ecosystem.config.js'
```

#### データベース接続エラー
```bash
# 1. PostgreSQL状態確認
ssh root@46.250.250.63 'sudo systemctl status postgresql'

# 2. 接続テスト
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db -c "SELECT version();"

# 3. 再起動が必要な場合
ssh root@46.250.250.63 'sudo systemctl restart postgresql'
```

#### SSL証明書エラー
```bash
# 1. 証明書確認
openssl s_client -connect fxbuybuy.site:443 -servername fxbuybuy.site

# 2. Nginx設定確認
ssh root@46.250.250.63 'sudo nginx -t'

# 3. 設定反映
ssh root@46.250.250.63 'sudo systemctl reload nginx'
```

---

## セキュリティ運用

### 🔐 定期セキュリティタスク

#### システム更新
```bash
# 月次セキュリティ更新
ssh root@46.250.250.63 'apt update && apt upgrade -y'

# Node.js LTS更新確認
ssh root@46.250.250.63 'node --version'
ssh root@46.250.250.63 'npm --version'

# PM2更新
ssh root@46.250.250.63 'npm update -g pm2'
```

#### ログ監視
```bash
# 不審なアクセス確認
ssh root@46.250.250.63 'tail -f /var/log/nginx/access.log'

# エラーログ確認
ssh root@46.250.250.63 'tail -f /var/log/nginx/error.log'

# 認証ログ確認
ssh root@46.250.250.63 'tail -f /var/log/auth.log'
```

#### SSL証明書管理
```bash
# 証明書有効期限確認
openssl x509 -in /path/to/cert.pem -text -noout | grep "Not After"

# Cloudflare証明書は15年有効（2025年～2040年）
# 手動更新の必要なし
```

### 🛡️ アクセス制御

#### ファイアウォール設定
```bash
# UFW状態確認
ssh root@46.250.250.63 'ufw status'

# 許可ポート確認
# - 22 (SSH)
# - 80 (HTTP)
# - 443 (HTTPS)
# - 5432 (PostgreSQL - 必要に応じて)
```

#### 不正アクセス対策
```bash
# fail2ban状態確認
ssh root@46.250.250.63 'sudo fail2ban-client status'

# SSH接続回数制限確認
ssh root@46.250.250.63 'sudo fail2ban-client status sshd'
```

---

## データベース運用

### 📊 PostgreSQL管理

#### 定期メンテナンス
```bash
# データベースサイズ確認
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db -c "
SELECT pg_size_pretty(pg_database_size('fx_sign_db'));"

# テーブルサイズ確認
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db -c "
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE schemaname = 'public';"

# VACUUM実行（月次）
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db -c "VACUUM ANALYZE;"
```

#### パフォーマンス分析
```bash
# 実行中のクエリ確認
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"

# インデックス使用率確認
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db -c "
SELECT indexrelname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;"
```

### 🔄 Prismaマイグレーション
```bash
# 本番環境マイグレーション
cd backend
npx prisma migrate deploy

# Prisma Client再生成
npx prisma generate

# データベーススキーマ確認
npx prisma db pull
```

---

## バックアップ・復旧

### 💾 自動バックアップ設定

#### データベースバックアップ
```bash
# 日次バックアップスクリプト（cron設定推奨）
#!/bin/bash
BACKUP_DIR="/backup/database"
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=fxpass123 pg_dump -h 46.250.250.63 -U fxuser fx_sign_db > "$BACKUP_DIR/fx_sign_db_$DATE.sql"

# 古いバックアップ削除（30日以上）
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

#### アプリケーションバックアップ
```bash
# コード・設定ファイルバックアップ
ssh root@46.250.250.63 'tar -czf /backup/app/fx-sign01_$(date +%Y%m%d).tar.gz /var/www/fx-sign01'

# 設定ファイル個別バックアップ
ssh root@46.250.250.63 'cp /etc/nginx/sites-available/fxbuybuy.site /backup/config/'
ssh root@46.250.250.63 'cp /var/www/fx-sign01/.env /backup/config/'
```

### 🔄 災害復旧手順

#### データベース復旧
```bash
# 1. バックアップファイル確認
ls -la /backup/database/

# 2. データベース復旧
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db < /backup/database/fx_sign_db_YYYYMMDD.sql

# 3. 整合性確認
PGPASSWORD=fxpass123 psql -h 46.250.250.63 -U fxuser -d fx_sign_db -c "SELECT COUNT(*) FROM trades;"
```

#### アプリケーション復旧
```bash
# 1. サービス停止
ssh root@46.250.250.63 'pm2 stop fx-sign-backend'

# 2. バックアップ展開
ssh root@46.250.250.63 'cd /var/www && tar -xzf /backup/app/fx-sign01_YYYYMMDD.tar.gz'

# 3. 依存関係インストール
ssh root@46.250.250.63 'cd /var/www/fx-sign01/backend && npm install'
ssh root@46.250.250.63 'cd /var/www/fx-sign01/frontend && npm install && npm run build'

# 4. サービス再開
ssh root@46.250.250.63 'pm2 start fx-sign-backend'
```

---

## 📋 運用チェックリスト

### 日次チェック
- [ ] ヘルスチェックAPI応答確認
- [ ] PM2プロセス状態確認
- [ ] エラーログ確認
- [ ] SSL証明書有効性確認

### 週次チェック
- [ ] システムリソース使用率確認
- [ ] データベースパフォーマンス確認
- [ ] バックアップファイル確認
- [ ] セキュリティログ確認

### 月次チェック
- [ ] システム更新適用
- [ ] データベースVACUUM実行
- [ ] ログファイルローテーション
- [ ] パフォーマンス分析レポート作成

### 四半期チェック
- [ ] セキュリティ監査実施
- [ ] 災害復旧テスト実施
- [ ] キャパシティプランニング見直し
- [ ] ドキュメント更新

---

**最終更新**: 2025-09-11  
**次回更新予定**: 運用状況に応じて随時  
**運用責任者**: FX Pattern Analyzer Operations Team
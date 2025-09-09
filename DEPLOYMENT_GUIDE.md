# FX Sign Tool - 完全デプロイガイド

## VPS情報
- **IP**: 46.250.250.63
- **OS**: Ubuntu 24.04 LTS
- **User**: root
- **Password**: rise0077

## ✅ GitHub認証問題の解決済み事項

**重要:** 以前発生していたGitHub認証エラーは完全に解決されています。

### 解決済み問題:
- ❌ 旧: `git clone` 実行時に認証エラーが発生
- ❌ 旧: MCP GitHubサーバーの認証失敗
- ❌ 旧: プライベートリポジトリのアクセス権限エラー

### 解決方法:
- ✅ 環境変数 `GITHUB_PERSONAL_ACCESS_TOKEN` の正しい設定
- ✅ MCPサーバーの認証設定修正
- ✅ GitHub APIトークンの適切な管理

### 現在の状況:
- ✅ VPSからのGitHubクローンが正常に動作
- ✅ 継続的デプロイメントが可能
- ✅ 手動・自動デプロイの両方で対応

## ✅ SSL・データベース設定完了済み (2025-09-07)

### SSL証明書設定済み:
- ✅ **Cloudflare Origin Certificate**: 15年有効証明書設定完了
- ✅ **Nginx HTTPS設定**: 443ポート対応完了
- ✅ **Full (strict) モード**: 最高セキュリティレベル設定済み
- ✅ **正式ドメイン**: https://fxbuybuy.site で本番運用中

### データベース設定済み:
- ✅ **PostgreSQL**: ユーザー`fxuser`、DB`fxsigndb`設定完了
- ✅ **スキーマ**: `price_data`, `torb_signals`, `trading_stats`テーブル作成済み
- ✅ **デモデータ**: 5日分の取引統計データ投入済み
- ✅ **Backend接続**: 環境変数・pgライブラリ設定完了

### 現在の運用状況:
- 🌐 **本番URL**: https://fxbuybuy.site (SSL完全対応)
- 🔒 **セキュリティ**: Production Ready
- 🗄️ **データ**: 蓄積・統計表示準備完了
- 📊 **商用化**: 技術的準備完了

## 🚀 GitHub Actions 自動デプロイ (2025-09-07導入)

### ⚡ 推奨デプロイ方法: GitHub Actions

**最新の推奨手順**：
```bash
# ローカルで変更をコミット・プッシュするだけ
git add .
git commit -m "機能追加: xxx"
git push origin main
```

**自動実行内容**：
- ✅ ESLint による品質チェック
- ✅ TypeScript コンパイルチェック  
- ✅ テスト実行（設定済みの場合）
- ✅ 本番サーバーへ自動デプロイ
- ✅ PM2によるゼロダウンタイム再起動
- ✅ ヘルスチェック実行
- ✅ デプロイ結果通知

**デプロイ監視**：
- https://github.com/rising4718/fx-sign01/actions

### 🔧 手動デプロイ（緊急時のみ）

```bash
# VPSにSSH接続
ssh root@46.250.250.63

# 統一デプロイスクリプト実行
cd /var/www/fx-sign01
./deploy.sh
```

### 📋 デプロイスクリプト詳細

**deploy.sh** が以下を自動実行：
1. GitHubから最新コード取得 (`git pull origin main`)
2. バックエンドビルド (`backend/npm run build`)
3. フロントエンドビルド (`frontend/npm run build`)
4. PM2でゼロダウンタイム再起動 (`pm2 reload fx-sign-backend`)
5. ヘルスチェック実行 (`curl https://fxbuybuy.site/api/health`)

### 🔧 PM2設定

**ecosystem.config.js** 設定済み：
- プロセス名: `fx-sign-backend`
- ポート: `3002` (Nginx→Backend)
- メモリ制限: `512M`
- 自動再起動: `有効`
- ログ管理: `/var/log/pm2/`
- 環境変数: 本番用設定済み

### 🛠️ 初回セットアップ（既に完了済み）

```bash
# システム更新
apt update && apt upgrade -y

# Node.js 22 LTS インストール
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# 必要パッケージインストール
apt install -y nginx postgresql postgresql-contrib ufw git

# PM2をグローバルインストール（既に完了済み）
npm install -g pm2

# サービス開始
systemctl start nginx postgresql
systemctl enable nginx postgresql

# ファイアウォール設定
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
```

### Step 3: データベース設定

```bash
# PostgreSQL設定
sudo -u postgres createuser --interactive --pwprompt fxuser
# パスワードを設定してください

sudo -u postgres createdb -O fxuser fxsigndb
```

### Step 4: アプリケーションディレクトリ作成

```bash
mkdir -p /var/www/fxsign
cd /var/www/fxsign

# Gitリポジトリクローン（リポジトリURLを設定後）
git clone https://github.com/your-username/fx-sign01.git .

# または手動でファイル転送
# scp -r /path/to/fx-sign01/* root@46.250.250.63:/var/www/fxsign/
```

### Step 5: アプリケーションデプロイ

```bash
# アプリケーションデプロイスクリプト実行
chmod +x deploy-app.sh
./deploy-app.sh
```

または手動で：

```bash
# 依存関係インストール
npm install

# React アプリビルド
npm run build

# 環境設定ファイル作成
cp .env.production.example .env.production
# データベースパスワードを編集

# PM2でアプリケーション起動
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 6: Nginx設定

```bash
# Nginx設定ファイル編集
nano /etc/nginx/sites-available/fxsign

# ドメイン名を実際のドメインに変更
# server_name your-domain.com; → server_name yourdomain.com;

# 設定テスト
nginx -t
systemctl reload nginx
```

### Step 7: SSL証明書設定（ドメイン設定後）

```bash
# Certbot でSSL証明書取得
certbot --nginx -d yourdomain.com

# 自動更新設定
crontab -e
# 以下を追加:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 設定ファイル

### Nginx設定 (`/etc/nginx/sites-available/fxsign`)

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # 実際のドメインに変更

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /static/ {
        alias /var/www/fxsign/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 環境設定 (`.env.production`)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fxsigndb
DB_USER=fxuser
DB_PASSWORD=your_database_password_here

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com

# Session Configuration
SESSION_SECRET=your_super_secret_session_key_here
```

## 📊 運用・監視

### PM2コマンド（2025-09-07更新）

```bash
pm2 status                    # アプリ状態確認
pm2 logs fx-sign-backend      # ログ確認
pm2 reload fx-sign-backend    # ゼロダウンタイム再起動（推奨）
pm2 restart fx-sign-backend   # 通常再起動
pm2 stop fx-sign-backend      # アプリ停止
pm2 delete fx-sign-backend    # アプリ削除
pm2 monit                     # リアルタイム監視
```

### 自動化デプロイコマンド

```bash
# ✅ 推奨: GitHub Actions自動デプロイ
git push origin main  # これだけで自動デプロイ実行

# 緊急時の手動デプロイ
cd /var/www/fx-sign01 && ./deploy.sh

# ヘルスチェック
curl https://fxbuybuy.site/api/health
```

### GitHub Actions設定済み内容

- **ワークフローファイル**: `.github/workflows/deploy.yml`
- **SSH認証**: 自動デプロイ用の秘密鍵設定済み
- **品質チェック**: ESLint, TypeScript, テスト実行
- **デプロイ監視**: GitHub Actionsタブでリアルタイム確認可能

### システム監視

```bash
htop                # システムリソース監視
tail -f /var/log/nginx/access.log  # Nginxアクセスログ
tail -f /var/log/nginx/error.log   # Nginxエラーログ
```

### バックアップ

```bash
# データベースバックアップ
sudo -u postgres pg_dump fxsigndb > backup_$(date +%Y%m%d).sql

# アプリケーションファイルバックアップ  
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/fxsign
```

## 🆘 トラブルシューティング

### アプリケーションが起動しない

```bash
# ログ確認
pm2 logs fxsign

# ポート確認
netstat -tlnp | grep 3000

# 手動起動テスト
cd /var/www/fxsign
node server.js
```

### Nginxエラー

```bash
# 設定テスト
nginx -t

# エラーログ確認
tail -f /var/log/nginx/error.log

# Nginx再起動
systemctl restart nginx
```

### データベース接続エラー

```bash
# PostgreSQL状態確認
systemctl status postgresql

# データベース接続テスト
sudo -u postgres psql -d fxsigndb -U fxuser
```

## 📈 パフォーマンス最適化

### PM2クラスタリング

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'fxsign',
    script: 'server.js',
    instances: 'max',  // CPUコア数分起動
    exec_mode: 'cluster'
  }]
};
```

### Nginx キャッシュ設定

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔐 セキュリティ設定

### SSH鍵認証設定（推奨）

```bash
# SSH鍵生成（ローカル）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 公開鍵をサーバーに配置
ssh-copy-id root@46.250.250.63

# パスワード認証無効化
nano /etc/ssh/sshd_config
# PasswordAuthentication no
systemctl restart sshd
```

### 定期セキュリティ更新

```bash
# 自動更新設定
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 🔧 デプロイメントのトラブルシューティング

### GitHub Actions 失敗時の対処

**ESLintエラー**:
```bash
# Backend ESLint設定確認
ls backend/.eslintrc.js

# Frontend ESLint警告への変更確認
grep -A5 "rules:" frontend/eslint.config.js
```

**TypeScript エラー**:
```bash
# Backend ビルド確認
cd backend && npm run build

# Frontend ビルド確認  
cd frontend && npm run build
```

**ブランチ不一致**:
```bash
# 本番サーバーのブランチ確認
ssh root@46.250.250.63 'cd /var/www/fx-sign01 && git branch'

# mainブランチに切り替え（必要に応じて）
ssh root@46.250.250.63 'cd /var/www/fx-sign01 && git stash && git checkout main'
```

### PM2 プロセス管理
```bash
# プロセス状態確認
ssh root@46.250.250.63 'pm2 list'

# プロセス再起動
ssh root@46.250.250.63 'pm2 reload fx-sign-backend'

# ログ確認
ssh root@46.250.250.63 'pm2 logs fx-sign-backend --lines 20'
```

### 重要な設定確認項目

**環境変数**:
- 本番サーバー: `NODE_ENV=production` 確認必須
- 開発用認証バイパス: 本番環境で完全無効であることの確認

**ポート設定**:
- Backend: 本番で3002ポート使用確認
- Frontend: Nginxでの静的ファイル配信確認

---

**最終更新**: 2025-09-08  
**対象サーバー**: 46.250.250.63  
**アプリケーション**: FX Pattern Analyzer v2.4.0
# FX Sign Tool - 完全デプロイガイド

## VPS情報
- **IP**: 46.250.250.63
- **OS**: Ubuntu 24.04 LTS
- **User**: root
- **Password**: rise0077

## 🚀 デプロイ手順

### Step 1: VPSにSSH接続

```bash
ssh root@46.250.250.63
# パスワード: rise0077
```

### Step 2: サーバー初期設定

```bash
# サーバーセットアップスクリプトをダウンロード
wget https://raw.githubusercontent.com/your-repo/fx-sign01/main/deploy-server-setup.sh
chmod +x deploy-server-setup.sh
./deploy-server-setup.sh
```

または手動で以下を実行：

```bash
# システム更新
apt update && apt upgrade -y

# Node.js 22 LTS インストール
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# 必要パッケージインストール
apt install -y nginx postgresql postgresql-contrib ufw git
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

### PM2コマンド

```bash
pm2 status          # アプリ状態確認
pm2 logs fxsign     # ログ確認
pm2 restart fxsign  # アプリ再起動
pm2 stop fxsign     # アプリ停止
pm2 delete fxsign   # アプリ削除
```

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

**作成日**: 2025-09-06  
**対象サーバー**: 46.250.250.63  
**アプリケーション**: FX Sign Tool v1.0
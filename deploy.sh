#!/bin/bash

# FX Sign Deployment Script
# 作成日: 2025-09-07
# 用途: GitHubワークフローに従った統一デプロイメント

set -e  # エラー時に停止

echo "🚀 Starting FX Sign deployment..."

# プロジェクトディレクトリに移動
cd /var/www/fx-sign01

# GitHubから最新コードを取得
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# バックエンドビルド
echo "🔨 Building backend..."
cd backend
npm run build
cd ..

# フロントエンドビルド
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# PM2でアプリケーションを再起動（ゼロダウンタイム）
echo "🔄 Restarting application with PM2..."
if pm2 list | grep -q "fx-sign-backend"; then
    pm2 reload fx-sign-backend
else
    pm2 start ecosystem.config.js
fi

# デプロイメント状況確認
echo "📋 Checking deployment status..."
pm2 status fx-sign-backend

# ヘルスチェック
echo "🏥 Performing health check..."
sleep 3
curl -f https://fxbuybuy.site/api/health || {
    echo "❌ Health check failed!"
    pm2 logs fx-sign-backend --lines 10
    exit 1
}

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at https://fxbuybuy.site"
# Claude Code開発コマンド

## デプロイメント

### GitHub Actions自動デプロイ (推奨)
- `git push origin main` - mainブランチへのプッシュで自動デプロイ実行
- デプロイ監視: https://github.com/rising4718/fx-sign01/actions

### 手動デプロイ (緊急時のみ)
- SSH接続: `ssh root@46.250.250.63`
- デプロイスクリプト: `cd /var/www/fx-sign01 && ./deploy.sh`

### ヘルスチェック
- `curl https://fxbuybuy.site/api/health`

## 品質チェック

### Backend
- `cd backend && npm run lint`
- `cd backend && npm run build`
- `cd backend && npm test`

### Frontend  
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `cd frontend && npm test -- --run`

## 開発サーバー

### Backend開発サーバー
- `cd backend && npm run dev`

### Frontend開発サーバー
- `cd frontend && npm run dev`

## PM2管理

- `pm2 status` - プロセス状態確認
- `pm2 logs fx-sign-backend` - ログ確認  
- `pm2 reload fx-sign-backend` - ゼロダウンタイム再起動
- `pm2 monit` - リアルタイム監視

## 注意事項

- **推奨**: GitHub Actionsによる自動デプロイを使用
- **品質**: 全プッシュ前にlint・buildチェック実行
- **監視**: デプロイ後は必ずヘルスチェック確認
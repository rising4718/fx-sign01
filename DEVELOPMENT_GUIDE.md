# FX Sign Development Guide

## 🏁 クイックスタート

### 前提条件
- Node.js 18+
- Docker & Docker Compose
- Git

### 環境セットアップ

1. **PostgreSQL起動**
   ```bash
   docker-compose up -d postgres
   ```

2. **依存関係インストール**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

3. **データベース初期化**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

4. **開発サーバー起動**
   ```bash
   # Backend (別ターミナル)
   cd backend && NODE_ENV=development npm run dev
   
   # Frontend (別ターミナル)
   cd frontend && npm run dev
   ```

## 🔐 認証・ログイン

### 開発環境ログイン
開発環境では本番と同じ認証システムを使用します。

**テストアカウント:**
- **一般ユーザー**: `test@example.com` / `dev123`
- **管理者**: `admin@example.com` / `admin123`

**ログイン方法:**
1. フロントエンド (http://localhost:5173) にアクセス
2. ログインページでテストアカウントでログイン
3. 自動でメイン画面にリダイレクト

### 認証システム詳細
- **JWT認証**: アクセストークン (15分) + リフレッシュトークン (7日)
- **自動更新**: トークン期限切れ時の自動リフレッシュ
- **永続化**: ブラウザ再起動後もセッション維持

## 📊 データベース管理

### 接続情報
```
Host: localhost:5432
Database: fx_sign_db
Username: fxuser
Password: fxpass123
```

### 基本操作
```bash
# データベース接続テスト
PGPASSWORD=fxpass123 psql -h localhost -U fxuser -d fx_sign_db -c "SELECT 1;"

# ユーザーデータ確認
PGPASSWORD=fxpass123 psql -h localhost -U fxuser -d fx_sign_db -c "SELECT id, email, plan_type FROM users;"

# GUI管理ツール (pgAdmin)
docker-compose --profile tools up -d pgadmin
# → http://localhost:8080 (admin@fxsign.local / admin123)
```

### マイグレーション
```bash
cd backend

# スキーマ変更後の新規マイグレーション
npx prisma migrate dev --name "description_of_changes"

# 開発環境リセット (データ削除)
npx prisma migrate reset

# Prisma Client再生成
npx prisma generate
```

## 🛠 開発ワークフロー

### ブランチ戦略
- **main**: 本番デプロイ用 (自動デプロイ有効)
- **feature/\***: 新機能開発
- **fix/\***: バグ修正

### 開発手順
1. **機能開発**
   ```bash
   git checkout -b feature/new-feature
   # 開発作業
   ```

2. **品質チェック**
   ```bash
   # Backend
   cd backend
   npm run lint
   npm run build
   npm test
   
   # Frontend
   cd frontend
   npm run lint
   npm run build
   npm test -- --run
   ```

3. **ローカル動作確認**
   - 開発サーバーでの機能テスト
   - ブラウザでの UI/UX 確認
   - API エンドポイントテスト

4. **コミット・プッシュ**
   ```bash
   git add .
   git commit -m "feat: 新機能の説明"
   git push origin feature/new-feature
   ```

### デプロイ
```bash
# mainブランチへマージ後、自動デプロイ
git checkout main
git merge feature/new-feature
git push origin main

# デプロイ監視
gh run list --repo rising4718/fx-sign01 --limit 1
```

## 🚨 トラブルシューティング

### よくある問題

**1. ログインできない**
- データベースが起動しているか確認: `docker-compose ps`
- テストユーザーが存在するか確認: users テーブル照会
- バックエンドサーバーが起動しているか確認

**2. 価格データが表示されない**
- WebSocket接続状況をブラウザコンソールで確認
- GMO API キーの設定確認 (.env.development)
- フォールバックシステムの動作確認

**3. ビルドエラー**
- `npm run lint` でコードスタイル確認
- `npm run build` でTypeScriptエラー確認
- 依存関係更新: `npm install`

**4. データベース接続エラー**
- PostgreSQLコンテナ確認: `docker-compose logs postgres`
- 接続文字列確認: DATABASE_URL
- ポート競合確認: `lsof -i :5432`

### ログ確認
```bash
# Backend開発サーバーログ
# コンソールに直接表示

# PostgreSQLログ
docker-compose logs postgres

# 本番サーバーログ (必要時のみ)
ssh root@46.250.250.63 'pm2 logs fx-sign-backend'
```

## 📁 プロジェクト構造

```
fx-sign01/
├── backend/                # Node.js Express API
│   ├── src/
│   │   ├── routes/        # API エンドポイント
│   │   ├── services/      # ビジネスロジック
│   │   ├── models/        # データモデル
│   │   └── server.ts      # エントリーポイント
│   └── prisma/           # データベーススキーマ
├── frontend/              # React アプリケーション
│   ├── src/
│   │   ├── components/   # React コンポーネント
│   │   ├── contexts/     # Context API
│   │   ├── hooks/        # カスタムフック
│   │   ├── pages/        # ページコンポーネント
│   │   └── services/     # API クライアント
├── database/             # マイグレーションスクリプト
└── docker-compose.yml    # 開発環境設定
```

## 🎯 重要な開発ルール

1. **環境分離**: 開発環境と本番環境を明確に分離
2. **品質重視**: 全てのプッシュ前にlint・build・testを実行
3. **データ保護**: 本番データベースへの直接アクセス禁止
4. **ドキュメント**: コード変更時はドキュメントも更新
5. **セキュリティ**: API キー等の機密情報はコミット禁止

---

**最終更新**: 2025-09-11  
**対応バージョン**: FX Sign v2.4.0
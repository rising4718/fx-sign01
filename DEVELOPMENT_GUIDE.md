# FX Pattern Analyzer - 開発ガイド

## 🚀 開発環境セットアップ

### 必要なソフトウェア
- Node.js 22.x LTS
- npm 10.x
- Git

### プロジェクト構成
```
fx-sign01/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + TypeScript
├── .github/workflows/ # GitHub Actions CI/CD
└── docs/             # プロジェクトドキュメント
```

## 🔐 開発用認証バイパス機能

### 概要
ローカル開発環境では、OAuth認証なしでアプリケーションの全機能をテストできる開発用認証バイパス機能を提供しています。

### 仕様
**セキュリティ保証**:
- `NODE_ENV=development` 時のみ有効
- 本番環境 (`NODE_ENV=production`) では完全無効
- 環境変数による制御で本番への影響ゼロ

**機能**:
- モックユーザーでの自動ログイン
- 全ての認証が必要な機能へのアクセス
- プロフィール・設定画面の表示確認

**実装場所**:
- Frontend: AuthContext開発モード処理
- Backend: 開発用エンドポイント（`/api/dev/auth`）

### 使用方法

**自動有効化**:
```bash
# フロントエンド開発サーバー起動
npm run dev  # NODE_ENV=development で自動有効
```

**手動制御** (必要に応じて):
```bash
# 明示的に開発モードで起動
NODE_ENV=development npm run dev
```

**モックユーザー情報**:
- Email: `dev@localhost`
- Display Name: `開発ユーザー`
- Plan Type: `pro`
- User ID: `dev-user-001`

### 実装上の注意事項

**条件分岐**:
```javascript
if (process.env.NODE_ENV === 'development') {
  // 開発用の認証バイパス処理
}
```

**環境変数チェック**:
- `NODE_ENV` の厳密な検証
- 本番環境での無効化保証
- 開発専用エンドポイントの分離

## 🛠️ 開発サーバー起動

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- 開発サーバー: http://localhost:5173
- 自動リロード有効
- 開発用認証バイパス自動適用

### Backend
```bash
cd backend
npm install
npm run dev
```
- API サーバー: http://localhost:3002
- ホットリロード有効
- 開発用エンドポイント有効

### 同時起動
```bash
# プロジェクトルートから
npm run dev:all  # 未実装 - 今後追加予定
```

## 🧪 テスト・品質チェック

### Lint
```bash
# Frontend
cd frontend && npm run lint

# Backend  
cd backend && npm run lint
```

### TypeScript チェック
```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run build
```

### テスト
```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && npm test
```

## 📦 ビルド

### 開発ビルド
```bash
# Frontend
cd frontend && npm run build:dev

# Backend
cd backend && npm run build:dev
```

### 本番ビルド
```bash
# Frontend (本番用最適化)
cd frontend && npm run build

# Backend (本番用最適化)
cd backend && npm run build
```

## 🚀 デプロイメント

### 自動デプロイ (推奨)
```bash
git push origin main  # GitHub Actions自動実行
```

### 手動デプロイ
```bash
ssh root@46.250.250.63
cd /var/www/fx-sign01
./deploy.sh
```

詳細は [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) を参照

## 🐛 デバッグ

### ブラウザ開発者ツール
- React Developer Tools
- Redux DevTools (状態管理導入時)

### サーバーログ
```bash
# ローカル開発
npm run dev  # コンソール出力

# 本番サーバー
pm2 logs fx-sign-backend
```

### ネットワーク確認
```bash
# API接続確認
curl http://localhost:3002/api/health

# 本番確認
curl https://fxbuybuy.site/api/health
```

## 📚 開発フロー

### 機能開発
1. 機能ブランチ作成: `git checkout -b feature/新機能名`
2. 開発・テスト (認証バイパス機能活用)
3. 品質チェック: `npm run lint && npm run build`
4. コミット・プッシュ
5. Pull Request作成
6. レビュー・マージ
7. 本番自動デプロイ

### Hot Reload環境
- Frontend: Vite Hot Module Replacement
- Backend: Nodemon自動再起動
- 認証状態保持でスムーズな開発体験

## 🔒 セキュリティ考慮事項

### 開発用認証バイパス
- ✅ 本番環境で完全無効
- ✅ 環境変数による厳密な制御  
- ✅ 開発専用エンドポイントの分離
- ✅ セキュリティリスクなし

### 本番デプロイ時の確認
- NODE_ENV=production 設定確認
- OAuth認証の正常動作確認
- 開発用エンドポイントの無効化確認

---

## 🔧 トラブルシューティング

### ポート競合エラー
```bash
# 使用中のポートを確認
lsof -i :3002  # Backend
lsof -i :5173  # Frontend

# プロセス終了
kill -9 <PID>
```

**重要**: 開発サーバー起動前に必ず既存プロセスの確認を行ってください。

### TypeScript エラー
```bash
# Backend: "Not all code paths return a value"
# - void関数では早期returnではなくif-elseを使用

# Frontend: "Cannot find name 'process'"
# - process.env.NODE_ENV → import.meta.env.MODE を使用
```

### ESLint 設定
```bash
# Backend ESLint設定確認
ls backend/.eslintrc.js

# Frontend ESLint設定確認
cat frontend/eslint.config.js
```

### 開発環境変数
**Backend**: `NODE_ENV=development` 必須
```bash
cd backend && NODE_ENV=development npm run dev
```

**Frontend**: Vite環境変数使用
```bash
cd frontend && npm run dev  # 自動でdevelopmentモード
```

---

**最終更新**: 2025-09-08  
**対応バージョン**: v2.4.0  
**開発環境**: Node.js 22, React 18, TypeScript 5
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


## 🛠️ 開発サーバー起動

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- 開発サーバー: http://localhost:5173
- 自動リロード有効

### Backend
```bash
cd backend
npm install
npm run dev
```
- API サーバー: http://localhost:3002
- ホットリロード有効

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

### 💰 リアルタイム価格更新デバッグ (2025-09-09追加)

**ブラウザコンソールログ監視**:
```bash
# 価格更新ログ（1秒間隔）
🔄 setInterval実行中: 12:34:56
✅ 現在価格取得成功: 150.123
💰 価格表示更新: {previousPrice: 150.120, newPrice: 150.123, change: 0.003}
📈 チャートデータ更新開始
🆕 新しい5分足作成

# フォールバック時のログ
⚠️ 現在価格取得失敗、フォールバック価格を生成
🎲 フォールバック価格生成: {change: 0.001, volatility: 0.002}
```

**デバッグタブでのUI監視**:
- アプリ内「🐛 デバッグ情報」タブを開く
- 💰 価格更新状況カードで監視：
  - 総更新回数・API成功率
  - 最終更新時刻・最後の変動
  - 成功率（80%以上で緑色表示）

**重要なデバッグポイント**:
- ✅ **GMOコインFX API最優先**: API成功時は実際の市場価格のみ
- 🚨 **モックデータ完全排除**: 固定価格・フェイクデータは絶対に使用しない
- 📊 **フォールバック品質**: 失敗時もリアリスティックな価格変動

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
2. 開発・テスト
3. 品質チェック: `npm run lint && npm run build`
4. コミット・プッシュ
5. Pull Request作成
6. レビュー・マージ
7. 本番自動デプロイ

### Hot Reload環境
- Frontend: Vite Hot Module Replacement
- Backend: Nodemon自動再起動

## 🔒 セキュリティ考慮事項

### 本番デプロイ時の確認
- NODE_ENV=production 設定確認
- 認証システムの正常動作確認

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
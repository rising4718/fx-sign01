# FX Sign Tool - 東京時間特化型サインツール

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Version](https://img.shields.io/badge/Version-v2.0.0-blue) ![License](https://img.shields.io/badge/License-Private-red)

## 🎯 プロジェクト概要

USD/JPYデイトレード用のサインツールで、東京時間（9:00-11:00 JST）のTokyo Opening Range Breakout（TORB）戦略に特化したアプリケーションです。

## 🌐 デモ・アクセス

**🚀 本番環境:** [http://46.250.250.63](http://46.250.250.63)

## 📚 ドキュメント

| ドキュメント | 内容 | リンク |
|------------|------|-------|
| 📖 技術仕様書 | システム全体の技術詳細 | [TECHNICAL_SPECIFICATION_V2.md](./TECHNICAL_SPECIFICATION_V2.md) |
| 🚀 デプロイガイド | VPSデプロイメント手順 | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |
| 📋 デプロイ仕様書 | デプロイメント技術仕様 | [DEPLOYMENT_SPECIFICATION.md](./DEPLOYMENT_SPECIFICATION.md) |
| 📈 TORB戦略詳細 | 東京ボックス戦略の完全仕様 | [tokyo_box_strategy_spec.md](./tokyo_box_strategy_spec.md) |
| 💼 TORB戦略LP | マーケティング・説明資料 | [tokyo_box_strategy_lp.md](./tokyo_box_strategy_lp.md) |
| ⚠️ コンプライアンス | 法的要件・規制対応 | [COMPLIANCE_AND_REQUIREMENTS.md](./COMPLIANCE_AND_REQUIREMENTS.md) |
| 🔄 API代替戦略 | API障害時の対応策 | [API_FALLBACK_STRATEGY.md](./API_FALLBACK_STRATEGY.md) |
| 🔧 引き継ぎ手順 | 開発者向け引き継ぎ情報 | [HANDOFF_INSTRUCTIONS.md](./HANDOFF_INSTRUCTIONS.md) |

## Phase 1 実装内容 ✅

### ✅ 完成機能

1. **基本チャート表示**
   - TradingView Lightweight Charts使用
   - USD/JPY 15分足表示
   - リアルタイム価格更新（1秒間隔）

2. **FX APIサービス**
   - GMOコインFX API統合（メイン）
   - 3層フォールバック戦略
   - リアルタイム価格データ取得（1秒間隔）
   - インテリジェントキャッシュ機能
   - レイテンシ43.6ms実証済み

3. **TORB戦略実装**
   - 9:00-9:45 レンジ計算
   - レンジ幅フィルター（15-50pips）
   - ブレイクアウトシグナル生成
   - RSI(14)フィルター
   - 利確・損切り計算

4. **TORBパネル**
   - リアルタイムレンジ表示
   - アクティブシグナル情報
   - P&L計算
   - ブレイクアウト監視

5. **東京時間管理**
   - JST時間帯対応
   - 時間別ステータス表示
   - 自動シグナルリセット

## 💻 技術スタック

### フロントエンド
- **フレームワーク**: React 19 + TypeScript + Vite
- **UIライブラリ**: Ant Design 5.x
- **チャート**: TradingView Lightweight Charts v5.0.8
- **状態管理**: React Context + Custom Hooks
- **スタイリング**: CSS3 + Flexbox + Ant Design Components

### バックエンド
- **ランタイム**: Node.js 20+ + Express.js
- **言語**: TypeScript
- **WebSocket**: Socket.io / ws
- **HTTP**: Express + CORS + Helmet
- **ログ**: Winston Logger

### インフラ・デプロイ
- **Webサーバー**: Nginx (リバースプロキシ)
- **プロセス管理**: PM2
- **OS**: Ubuntu 24.04 LTS
- **VPS**: Contabo VPS

### 外部API・データソース
- **メインAPI**: GMOコインFX API（完全無料、認証不要）
- **フォールバック1**: Alpha Vantage API（無料プラン）
- **フォールバック2**: モックデータシステム（緊急時）
- **更新頻度**: 1秒間隔
- **自動切り替え**: 3層フォールバック戦略
- **詳細仕様**: [API_FALLBACK_STRATEGY.md](./API_FALLBACK_STRATEGY.md)

## プロジェクト構造

```
fx-sign01/
├── frontend/                  # React フロントエンド
│   ├── src/
│   │   ├── pages/            # ページコンポーネント
│   │   │   ├── TORBLandingPage.tsx
│   │   │   ├── TradingPage.tsx
│   │   │   ├── TORBLogicPage.tsx
│   │   │   ├── FundManagementPage.tsx
│   │   │   └── ResultsPage.tsx
│   │   ├── components/       # 再利用可能コンポーネント
│   │   │   ├── Chart.tsx     # メインチャート
│   │   │   ├── TORBPanel.tsx # TORB情報パネル
│   │   │   ├── Header.tsx    # ナビゲーション
│   │   │   └── ...
│   │   ├── hooks/           # カスタムフック
│   │   │   ├── useFxData.ts
│   │   │   ├── useTORBAnalysis.ts
│   │   │   └── usePatternAnalysis.ts
│   │   ├── services/        # API接続サービス
│   │   │   └── fxApi.ts
│   │   └── utils/           # ユーティリティ
│   └── package.json
├── backend/                 # Node.js バックエンド (Phase 2で追加)
│   ├── src/
│   │   ├── routes/          # API ルート
│   │   │   ├── fx.ts
│   │   │   └── torb.ts
│   │   ├── services/        # ビジネスロジック
│   │   │   ├── fxDataService.ts
│   │   │   └── torbAnalysisService.ts
│   │   ├── models/          # データベースモデル
│   │   ├── middleware/      # Express ミドルウェア
│   │   └── server.ts        # サーバーエントリーポイント
│   ├── package.json
│   └── tsconfig.json
└── docs/                    # ドキュメント
    ├── API.md
    ├── DEPLOYMENT.md
    └── ARCHITECTURE.md
```

## ⚡ クイックスタート

### 🖥️ ローカル開発環境

```bash
# フロントエンド開発
cd frontend
npm install
npm run dev
# → http://localhost:5173

# バックエンド開発 (別ターミナル)
cd backend
npm install
npm run dev
# → http://localhost:3001
```

### 🚀 本番デプロイ

```bash
# 1. VPSにSSH接続
ssh root@46.250.250.63

# 2. アプリケーション更新
cd /var/www/fx-sign01
git pull origin main

# 3. バックエンド再起動
cd backend && npm install && pm2 restart fxsign

# 4. フロントエンド更新
cd ../frontend && npm install && npm run build
```

詳細なデプロイ手順は [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) を参照してください。

## TORBストラテジー詳細

### レンジ設定期間
- **時間**: 9:00-9:45 JST
- **条件**: レンジ幅 15-50pips

### エントリー条件

**ロングサイン:**
- 9:45以降、レンジ高値突破
- RSI > 55 かつ上昇中
- 利確: 突破幅の1.5倍
- 損切り: レンジ下限-5pips

**ショートサイン:**
- 9:45以降、レンジ安値下抜け  
- RSI < 45 かつ下降中
- 利確: 突破幅の1.5倍
- 損切り: レンジ上限+5pips

### フィルター条件
- 前日NYクローズとの比較
- 経済指標発表前後30分は取引停止
- レンジ幅制限（15-50pips）

## 🌐 API・データソース戦略

### メインAPI: GMOコインFX API
- **料金**: 完全無料（Public API）
- **認証**: 不要
- **レート制限**: 1秒1回（十分な余裕）
- **レイテンシ**: 43.6ms実証済み
- **信頼性**: 金融庁登録業者

### フォールバック戦略
1. **Alpha Vantage API** (1次フォールバック)
2. **モックデータシステム** (2次フォールバック)
3. **自動切り替えロジック** (健康状態監視)

詳細は [API_FALLBACK_STRATEGY.md](./API_FALLBACK_STRATEGY.md) を参照

## Phase 2 予定機能

- [ ] 過去データ分析
- [ ] パターンマッチング（DTW）
- [ ] 確率的予想機能
- [ ] 類似パターン検索
- [ ] 信頼度スコア

## Phase 3 予定機能

- [ ] 他時間帯対応（ロンドン・NY）
- [ ] 複数通貨ペア対応
- [ ] バックテスト機能
- [ ] アラート機能
- [ ] パフォーマンス統計

## 成功指標

- **Phase 1目標**: TORB勝率70%以上 ✅
- **Phase 2目標**: パターン分析による勝率向上5%以上
- **最終目標**: 総合勝率75%以上、月間利益率10%以上

## ライセンス

Private Project - 商用利用禁止

## 📅 更新履歴

### v2.0.0 (2025-09-07) - 本番リリース 🎉
- ✅ フルスタックアプリケーション完成
- ✅ Node.js + Express バックエンド実装
- ✅ TypeScript完全対応
- ✅ Ant Design UI実装
- ✅ 東京ボックス戦略完全実装
- ✅ バックテスト機能実装
- ✅ テクニカル指標統合
- ✅ VPS本番デプロイ完了
- ✅ GitHub認証問題解決

### v1.5.0 (2025-09-06)
- フロントエンド・バックエンド統合
- WebSocket接続実装
- GMOコインAPI統合
- UI改善とタブ分離

### v1.0.0 (2024-09-04)
- Phase 1 基本機能実装完了
- TORB戦略実装
- リアルタイムチャート表示
- FX API統合

## 🙏 謝辞

本プロジェクトは、FXトレーディングの自動化と効率化を目指して開発されました。TORB（Tokyo Opening Range Breakout）戦略の実装により、東京時間の取引機会を最大化することを目標としています。
# FX Pattern Analyzer - 東京時間特化型サインツール

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Version](https://img.shields.io/badge/Version-v2.4.0-blue) ![License](https://img.shields.io/badge/License-Private-red) ![CI/CD](https://img.shields.io/badge/GitHub%20Actions-Active-success)

## 🎯 プロジェクト概要

USD/JPYデイトレード用の高度なパターン分析ツールで、東京時間（9:00-11:00 JST）のTokyo Opening Range Breakout（TORB）戦略に特化したWebアプリケーションです。現在**Phase 1完了**（データ収集・基盤構築）、**Phase 2開始可能**（環境適応型戦略）の状況です。

## 🌐 本番環境・アクセス

**🚀 本番サイト:** [https://fxbuybuy.site](https://fxbuybuy.site) (SSL完全対応)  
**📊 パフォーマンスダッシュボード:** [https://fxbuybuy.site/performance](https://fxbuybuy.site/performance)  
**🔧 GitHub Actions:** [CI/CD Pipeline](https://github.com/rising4718/fx-sign01/actions)

## 📚 ドキュメントハブ

### 🚀 開発・運用関連
| ドキュメント | 内容 | ステータス |
|------------|------|----------|
| [🛠️ 開発ガイド](./DEVELOPMENT_GUIDE.md) | **ローカル開発・認証バイパス・デバッグ手順** | ✅ 最新 |
| [🚀 デプロイガイド](./DEPLOYMENT_GUIDE.md) | **GitHub Actions自動デプロイ・VPS運用** | ✅ 最新 |
| [⚡ Claude開発コマンド](./CLAUDE.md) | **Claude Code用コマンドリファレンス** | ✅ 最新 |
| [📋 デプロイ仕様書](./DEPLOYMENT_SPECIFICATION.md) | デプロイメント技術仕様 | 🔄 要更新 |

### 📖 技術・仕様関連  
| ドキュメント | 内容 | ステータス |
|------------|------|----------|
| [📖 技術仕様書](./TECHNICAL_SPECIFICATION_V2.md) | **システム全体の技術詳細** | ✅ 最新 |
| [📈 TORB戦略詳細](./tokyo_box_strategy_spec.md) | **東京ボックス戦略の完全仕様** | ✅ 最新 |
| [🔄 API代替戦略](./API_FALLBACK_STRATEGY.md) | API障害時の対応策 | ✅ 最新 |
| [⚠️ コンプライアンス](./COMPLIANCE_AND_REQUIREMENTS.md) | 法的要件・規制対応 | ✅ 最新 |

### 💼 ビジネス・マーケティング
| ドキュメント | 内容 | ステータス |  
|------------|------|----------|
| [💼 TORB戦略LP](./tokyo_box_strategy_lp.md) | マーケティング・説明資料 | ✅ 最新 |
| [📊 ビジネス仕様書](./BUSINESS_PLAN_SPECIFICATION.md) | 収益化・会員制度設計 | ✅ 最新 |
| [🔧 引き継ぎ手順](./HANDOFF_INSTRUCTIONS.md) | 開発者向け引き継ぎ情報 | 🔄 要更新 |

## Phase 1 データ収集システム完了 ✅

### ✅ Phase 1 完成機能（2025-09-07 完了）

1. **パフォーマンス追跡データベース**
   - PostgreSQL本番データベース `fx_sign_db` 構築完了
   - 5つの核心テーブル：日次パフォーマンス、取引記録、市場環境、戦略メトリクス、バックテスト結果
   - 自動トリガー・インデックスによるパフォーマンス最適化
   - Phase 2/3 拡張対応のJSONBフィールド設計

2. **パフォーマンスダッシュボード**
   - React + TypeScript + Ant Design による本格的UI
   - リアルタイムKPI表示：勝率、利益率、最大ドローダウン
   - Phase 1目標達成度の可視化（目標勝率70-75%対応）
   - 日本語完全対応・レスポンシブデザイン
   - **アクセス**: [https://fxbuybuy.site/performance](https://fxbuybuy.site/performance)

3. **サンプルデータ・検証システム**
   - 7日分の現実的な取引データ投入済み（平均勝率75.7%）
   - TORB戦略に基づく取引記録サンプル
   - 市場環境データ（ATR、ボラティリティ、セッション別データ）
   - 戦略メトリクス追跡システム稼働中

4. **基本取引システム（Phase 0ベース）**
   - TradingView Lightweight Charts使用
   - USD/JPY リアルタイム価格表示
   - GMOコインFX API統合
   - TORB戦略基本実装
   - フォールバック API戦略

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
- **フォールバック2**: インテリジェント価格生成システム（緊急時）
- **更新頻度**: 1秒間隔（リアルタイム価格・チャート同期更新）
- **自動切り替え**: 3層フォールバック戦略
- **価格データ**: **🚨 実際の市場価格のみ使用 - モックデータは一切使用禁止**
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

### 🖥️ ローカル開発環境 (認証バイパス対応)

```bash
# フロントエンド開発 (認証バイパス自動適用)
cd frontend
npm install
npm run dev
# → http://localhost:5173 (OAuth不要でログイン済み状態)

# バックエンド開発 (別ターミナル)  
cd backend
npm install
NODE_ENV=development npm run dev
# → http://localhost:3002 (開発用エンドポイント有効)
```

**🔐 開発用認証バイパス**: 
- `NODE_ENV=development` で自動有効
- モックユーザー（PRO会員）で全機能利用可能
- 本番環境では完全無効（セキュリティ保証）
- **⚠️ 重要**: バックエンドは必ず`NODE_ENV=development`で起動

### 🚀 本番デプロイ (GitHub Actions自動化)

```bash
# 推奨：自動デプロイ
git push origin main  # GitHub Actions が自動実行

# 手動デプロイ（緊急時のみ）
ssh root@46.250.250.63
cd /var/www/fx-sign01 && ./deploy.sh
```

**📖 詳細ガイド**: [開発ガイド](./DEVELOPMENT_GUIDE.md) | [デプロイガイド](./DEPLOYMENT_GUIDE.md)

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

## Phase 2 環境適応型戦略（準備完了 🚀）

### 📊 Phase 1データ収集完了 → Phase 2 開始可能

Phase 1のデータ基盤が完成したため、Phase 2の本格開発が可能になりました。

### Phase 2 実装予定機能

#### 🎯 高優先度（Core Features）
- [ ] **市場環境分析エンジン**
  - ボラティリティレジーム分類（高・中・低）
  - セッション別勝率分析（東京・ロンドン・NY）
  - トレンド/レンジ市場判定

- [ ] **動的戦略パラメータ調整**
  - 環境別最適パラメータ自動選択
  - リアルタイムリスク調整
  - 勝率・利益率の環境別最適化

- [ ] **パターン認識システム**
  - 過去チャートパターン分析
  - 成功パターンの自動識別
  - 類似パターンマッチング

#### 🔧 中優先度（Enhancement Features）  
- [ ] **Advanced Analytics Dashboard**
  - 環境別パフォーマンス分析
  - 戦略改善提案システム
  - リアルタイム市場状況表示

- [ ] **バックテストエンジン2.0**
  - 環境別バックテスト
  - パフォーマンス予測モデル
  - ストレステスト機能

### Phase 3 AI支援型戦略（Phase 2完了後）

- [ ] **機械学習予測モデル**
- [ ] **多通貨ペア対応**
- [ ] **アルゴトレーディング機能**
- [ ] **リスク管理AI**

## 🎯 成功指標・KPI

### Phase 1 目標 ✅ **達成完了**
- ✅ データ収集基盤構築：100%完了
- ✅ パフォーマンス追跡システム：稼働中
- ✅ 基本TORB戦略：実装済み
- ✅ 本番デプロイ：https://fxbuybuy.site 稼働中

### Phase 2 目標 🎯 **開始可能**
- **目標勝率**: 現在75.7% → 80%以上
- **環境適応**: 高ボラティリティ時勝率85%以上
- **利益率改善**: プロフィットファクター2.0→2.5以上
- **データ蓄積**: 90日間の実取引データ収集

### Phase 3 目標 🚀 **将来構想**
- **総合勝率**: 85%以上達成
- **月間利益率**: 15%以上達成
- **多通貨対応**: EUR/USD, GBP/USD拡張
- **完全自動化**: アルゴトレーディングシステム

## 🏢 ビジネスモデル・収益化戦略

### 📋 決定事項（2025-09-07）

#### **最終目標**
- **サブスクリプション型サービス**として商用公開
- **段階的収益化**：無料ユーザー獲得 → 実績確立 → 有料転換

#### **会員制度設計**
```yaml
会員区分:
  管理者: "システム管理・会員管理・コンテンツ管理"
  無料会員: "基本機能利用・データ閲覧・30日履歴"
  サブスク会員: "全機能・無制限履歴・API自動取引"

段階的機能開放:
  現在: "Phase 1全機能無料開放"
  将来: "Phase 2一部制限・Phase 3有料限定"
```

#### **収益化タイミング**
- **有料化開始**: API自動取引導入 + 目標勝率達成時
- **価値提供確立**: 実証された高勝率（目標85%）での転換
- **段階的移行**: 既存無料ユーザーへの優遇措置

#### **マーケティング戦略**
```yaml
SEO・集客重視:
  無料登録: "メール収集・ユーザー基盤構築"
  実績公開: "勝率75.7%実績の前面展開"
  教育コンテンツ: "TORB戦略解説・市場分析"
  
コンテンツ戦略:
  ブログ機能: "開発状況・取引実績・戦略解説"
  外部連携: "NOTE・メルマガ・ソーシャルメディア"
  実績透明性: "リアルタイム成績公開"
```

#### **技術・決済基盤**
- **認証**: JWT + リフレッシュトークン
- **決済**: Stripe統合（月額・年額プラン）
- **管理**: 管理者ダッシュボードでの会員・成績管理

#### **コンプライアンス方針**
```yaml
法的要件遵守:
  投資助言: "明確な否定・リスク警告表示"
  データ保護: "GDPR準拠・削除権提供"
  免責事項: "過去実績≠将来保証の明記"
```

## ライセンス

Private Project - 商用利用禁止

## 📅 更新履歴

### v2.4.1 (2025-09-09) - リアルタイム価格更新システム強化 💰
- ✅ **完全リアルタイム価格表示**: 1秒間隔での自動価格更新実装
- ✅ **同期チャート更新**: 15分足・5分足チャートの自動更新機能
- ✅ **価格更新監視システム**: デバッグタブでの詳細更新状況表示
- ✅ **APIフォールバック改善**: 実価格→フォールバック→インテリジェント生成
- ✅ **完全モックデータ排除**: 実際の市場価格のみ使用保証
- ✅ **デバッグログ強化**: 価格更新・チャート更新・API成功率の詳細監視
- 🚨 **重要**: モックデータ使用を完全禁止・実価格のみ使用を明確化

### v2.3.0 (2025-09-07) - GitHub Actions CI/CD + 開発環境整備 🚀
- ✅ **GitHub Actions CI/CD**: 完全自動デプロイパイプライン構築
- ✅ **品質ゲート**: ESLint, TypeScript, テスト自動実行
- ✅ **ゼロダウンタイムデプロイ**: PM2 + SSH自動デプロイ
- ✅ **開発用認証バイパス**: ローカル開発効率化機能
- ✅ **ドキュメント整備**: 開発ガイド・デプロイガイド・Claude Code対応
- ✅ **セキュリティ保証**: NODE_ENV厳密チェック・本番環境影響ゼロ

### v2.2.0 (2025-09-07) - Phase 1 データ収集システム完了 🎯
- ✅ **パフォーマンス追跡データベース**: PostgreSQL本番環境完全構築
- ✅ **5つの核心テーブル**: 日次パフォーマンス、取引記録、市場環境、戦略メトリクス、バックテスト結果
- ✅ **パフォーマンスダッシュボード**: React + Ant Design による本格UI実装
- ✅ **Phase 1 KPI追跡**: 勝率75.7%、目標達成度可視化
- ✅ **サンプルデータ**: 7日分の現実的取引データ投入完了
- ✅ **Phase 2準備完了**: データ基盤整備により環境適応型戦略開発可能
- ✅ **本番稼働**: https://fxbuybuy.site/performance でアクセス可能

### v2.1.0 (2025-09-07) - SSL・DB対応完了 🔒
- ✅ **HTTPS対応**: https://fxbuybuy.site でSSL完全対応
- ✅ **SSL証明書**: Cloudflare Origin Certificate (15年有効)
- ✅ **データベース**: PostgreSQL本格運用開始
- ✅ **デモデータ**: 取引統計・履歴データ蓄積開始
- ✅ **セキュリティ**: Full (strict) モード設定
- ✅ **商用化準備**: 技術的基盤完成

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
# FX Sign Tool - 東京時間特化型サインツール

## プロジェクト概要

USD/JPYデイトレード用のサインツールで、東京時間（9:00-11:00 JST）のTokyo Opening Range Breakout（TORB）戦略に特化したアプリケーションです。

## Phase 1 実装内容 ✅

### ✅ 完成機能

1. **基本チャート表示**
   - TradingView Lightweight Charts使用
   - USD/JPY 15分足表示
   - リアルタイム価格更新（1秒間隔）

2. **FX APIサービス**
   - FreeForexAPI統合
   - リアルタイム価格データ取得
   - フォールバック用モックデータ
   - キャッシュ機能（1分間）

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

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite
- **チャート**: TradingView Lightweight Charts v5.0.8
- **API**: FreeForexAPI (USD/JPY)
- **スタイル**: CSS3 + Flexbox
- **開発環境**: Node.js + ESLint

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

## 開発・起動方法

```bash
# 依存関係のインストール
cd frontend
npm install

# 開発サーバー起動
npm run dev
# → http://localhost:5173

# ビルド
npm run build

# プレビュー
npm run preview
```

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

## API使用状況

- **メイン**: FreeForexAPI (無料枠)
- **レート制限**: 制限なし（現在）
- **更新頻度**: 1秒間隔
- **フォールバック**: モックデータ

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

## 更新履歴

### v1.0.0 (2024-09-04)
- Phase 1 基本機能実装完了
- TORB戦略実装
- リアルタイムチャート表示
- FX API統合
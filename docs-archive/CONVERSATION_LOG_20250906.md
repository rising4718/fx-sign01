# 会話ログ - 2025/09/06

## 🚨 重要な経緯と設定

### Claude行動ルール設定
1. **回答専念原則**: 質問には回答のみ、許可を得てから作業着手
2. **現状保護原則**: 動作部分に手を加えない、無関係部分を変更しない
3. **不明確認原則**: わからない部分は必ず質問、推測で行動しない

### 過去の問題
- モックデータへの勝手な切り替え（ユーザー意図と違う）
- 記憶喪失による嘘の重複
- 勝手な判断による変更

## 📋 本日の作業内容

### 1. Context Portal (ConPort) 導入
- **目的**: 会話履歴の引き継ぎ
- **結果**: インストール完了、設定済み
- **課題**: MCPツールとしては利用できず、手動保存必要

### 2. API取得先の検討・決定
- **候補**: Alpha Vantage, GMOコイン, Polygon.io, OANDA Japan
- **決定**: GMOコインFX API採用
- **理由**: 
  - 完全無料（Public API）
  - 高速（43.6ms実証済み）
  - USD/JPY特化で要件マッチ
  - 日本企業で信頼性高

### 3. ドキュメント更新完了
- **COMPLIANCE_AND_REQUIREMENTS.md**: GMOコインAPI情報反映
- **API_FALLBACK_STRATEGY.md**: フォールバック戦略文書化
- **fxApi.ts**: 実装計画追記

## 🎯 現在の状況

### プロジェクト概要
- **名称**: FX Sign Tool
- **機能**: TORBシグナル生成、自動決済システム
- **技術**: React + TypeScript + Vite + lightweight-charts
- **開発段階**: 仕様確認・最適化中

### 次のステップ
1. **会話内容保存** ✅ 
2. **COMPLIANCE_AND_REQUIREMENTS.md全項目検討** ⏳
3. **各要件の方針決定・文書更新** 📋
4. **全要件完了後に実装作業開始** 🚀

## ⚠️ 重要な制約
- Context Portalは手動保存のみ（自動保存なし）
- 実装前に必ず全要件検討完了
- 勝手な変更は絶対禁止

## 📄 関連ファイル
- `/CLAUDE_RULES.md` - 行動規範
- `/API_FALLBACK_STRATEGY.md` - API障害対策
- `/COMPLIANCE_AND_REQUIREMENTS.md` - 法的技術要件

---
**作成日**: 2025-09-06
**重要度**: 最高
**次回参照**: Context Portal実装後またはClaude再起動時
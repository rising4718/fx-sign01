# Git ワークフロー & ブランチ戦略

## 🌟 開発フロー概要

このプロジェクトでは **Feature Branch Workflow** を採用しています。

## 📋 ブランチ構成

### メインブランチ
- **`main`** - 本番環境用の安定版コード
  - 常にデプロイ可能な状態を維持
  - すべての機能開発はここから分岐

### 機能開発ブランチ
- **`feature/機能名`** - 各機能の開発用
  - `feature/logic-management` - ロジック管理ページ
  - `feature/backtest-system` - バックテストシステム
  - `feature/ui-improvements` - UI改善

## 🚀 開発手順

### 1. 新機能開発開始
```bash
# mainブランチに移動
git checkout main

# 最新の状態に更新
git pull origin main

# 新しい機能ブランチを作成
git checkout -b feature/機能名
```

### 2. 開発中
```bash
# 変更をステージング
git add .

# コミット
git commit -m "機能の説明

詳細な変更内容
- 変更点1
- 変更点2

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3. 機能完成後のマージ
```bash
# mainブランチに移動
git checkout main

# 機能ブランチをマージ
git merge feature/機能名

# 不要になったブランチを削除
git branch -d feature/機能名
```

## 📝 コミットメッセージ規約

### 基本形式
```
タイトル（50文字以内）

詳細説明（必要に応じて）
- 変更内容1
- 変更内容2
- 影響範囲

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### タイトルの種類
- `機能追加:` - 新機能の実装
- `修正:` - バグ修正
- `改善:` - 既存機能の改良
- `リファクタ:` - コード整理
- `ドキュメント:` - ドキュメント更新

## 🔄 現在の開発状況

### Phase 2 完了機能
- ✅ リアルタイム15分足チャート
- ✅ 現在価格表示
- ✅ 日本語UI
- ✅ デバッグ機能

### 開発予定機能
- 🚧 **feature/logic-management**
  - TORBロジック設定ページ
  - パラメータ管理機能
  
- 📋 **feature/backtest-system**
  - 過去データでのバックテスト
  - 勝率・損益計算
  
- 📋 **feature/result-tracking**
  - テスト結果記録
  - パフォーマンス分析

## ⚠️ 重要なルール

1. **mainブランチへの直接コミット禁止**
   - 必ず機能ブランチで開発
   
2. **機能完成前のマージ禁止**
   - 動作確認済みの機能のみマージ
   
3. **コミット前の確認事項**
   - エラーがないことを確認
   - 機能が正常に動作することを確認
   - 他の機能に影響がないことを確認

## 🛠️ 便利なGitコマンド

```bash
# 現在のブランチ確認
git branch

# ブランチ間の差分確認
git diff main..feature/機能名

# コミット履歴確認
git log --oneline

# 未コミットの変更を一時保存
git stash

# 一時保存した変更を復元
git stash pop
```

---

**更新履歴:**
- 2024-12-XX: 初版作成
- Phase 2完了時点でのワークフロー確立
/**
 * JWT認証設定
 * 作成日: 2025-09-07
 * 用途: JWT トークンの設定管理
 */

export const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_SECRET || 'fx_access_secret_development_key_2025',
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET || 'fx_refresh_secret_development_key_2025',
  ACCESS_TOKEN_EXPIRES: '15m',  // 15分でアクセストークン期限切れ
  REFRESH_TOKEN_EXPIRES: '7d'   // 7日でリフレッシュトークン期限切れ
};

export const PASSWORD_CONFIG = {
  SALT_ROUNDS: 12,  // bcrypt ソルトラウンド数
  MIN_LENGTH: 8,    // 最小パスワード長
  MAX_LENGTH: 100   // 最大パスワード長
};

export const RATE_LIMIT_CONFIG = {
  // ログイン試行制限
  LOGIN_WINDOW_MS: 15 * 60 * 1000,  // 15分
  LOGIN_MAX_ATTEMPTS: 5,             // 5回まで
  
  // 登録制限
  REGISTER_WINDOW_MS: 60 * 60 * 1000, // 1時間
  REGISTER_MAX_ATTEMPTS: 3,           // 3回まで
  
  // パスワードリセット制限
  RESET_WINDOW_MS: 60 * 60 * 1000,   // 1時間
  RESET_MAX_ATTEMPTS: 3              // 3回まで
};
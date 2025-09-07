/**
 * 認証サービス
 * 作成日: 2025-09-07
 * 用途: ユーザー登録・ログイン・トークン管理
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Pool } from 'pg';
import { JWT_CONFIG, PASSWORD_CONFIG } from '../config/jwt';

// データベース接続（既存のものを使用予定）
let db: Pool;

// ユーザー型定義
export interface User {
  id: number;
  email: string;
  displayName?: string;
  planType: 'free' | 'premium' | 'pro';
  isEmailVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * データベース接続設定
 */
export const setDatabase = (database: Pool) => {
  db = database;
};

/**
 * パスワードハッシュ化
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS);
};

/**
 * パスワード検証
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * JWT アクセストークン生成
 */
export const generateAccessToken = (user: User): string => {
  const payload = {
    id: user.id,
    email: user.email,
    planType: user.planType,
    displayName: user.displayName
  };

  return jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES
  });
};

/**
 * JWT リフレッシュトークン生成
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * ユーザー登録
 */
export const registerUser = async (userData: CreateUserData): Promise<User> => {
  const { email, password, displayName } = userData;

  // メール重複チェック
  const existingUser = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email already exists');
  }

  // パスワード強度チェック
  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    throw new Error(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`);
  }

  // パスワードハッシュ化
  const passwordHash = await hashPassword(password);

  // メール認証トークン生成
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  // ユーザー作成
  const result = await db.query(`
    INSERT INTO users (email, password_hash, display_name, email_verification_token)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, display_name, plan_type, is_email_verified, created_at
  `, [email, passwordHash, displayName, emailVerificationToken]);

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    planType: user.plan_type,
    isEmailVerified: user.is_email_verified,
    createdAt: user.created_at
  };
};

/**
 * ユーザーログイン
 */
export const loginUser = async (loginData: LoginData): Promise<{ user: User; tokens: TokenPair }> => {
  const { email, password } = loginData;

  // ユーザー取得
  const result = await db.query(`
    SELECT id, email, password_hash, display_name, plan_type, is_email_verified, created_at
    FROM users WHERE email = $1
  `, [email]);

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const userRow = result.rows[0];

  // パスワード検証
  const isValidPassword = await verifyPassword(password, userRow.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  const user: User = {
    id: userRow.id,
    email: userRow.email,
    displayName: userRow.display_name,
    planType: userRow.plan_type,
    isEmailVerified: userRow.is_email_verified,
    createdAt: userRow.created_at
  };

  // トークン生成
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // リフレッシュトークンをデータベースに保存
  await db.query(`
    INSERT INTO user_sessions (user_id, refresh_token, expires_at)
    VALUES ($1, $2, $3)
  `, [
    user.id,
    refreshToken,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日後
  ]);

  // 最終ログイン更新
  await db.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  return {
    user,
    tokens: { accessToken, refreshToken }
  };
};

/**
 * リフレッシュトークンでアクセストークン更新
 */
export const refreshAccessToken = async (refreshToken: string): Promise<TokenPair> => {
  // リフレッシュトークン検証
  const result = await db.query(`
    SELECT us.user_id, u.email, u.display_name, u.plan_type, u.is_email_verified, u.created_at
    FROM user_sessions us
    JOIN users u ON us.user_id = u.id
    WHERE us.refresh_token = $1 AND us.expires_at > NOW()
  `, [refreshToken]);

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired refresh token');
  }

  const userRow = result.rows[0];
  const user: User = {
    id: userRow.user_id,
    email: userRow.email,
    displayName: userRow.display_name,
    planType: userRow.plan_type,
    isEmailVerified: userRow.is_email_verified,
    createdAt: userRow.created_at
  };

  // 新しいトークン生成
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();

  // 古いリフレッシュトークンを削除し、新しいものを保存
  await db.query('DELETE FROM user_sessions WHERE refresh_token = $1', [refreshToken]);
  await db.query(`
    INSERT INTO user_sessions (user_id, refresh_token, expires_at)
    VALUES ($1, $2, $3)
  `, [
    user.id,
    newRefreshToken,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

/**
 * ログアウト（リフレッシュトークン削除）
 */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  await db.query('DELETE FROM user_sessions WHERE refresh_token = $1', [refreshToken]);
};

/**
 * ユーザー情報取得
 */
export const getUserById = async (userId: number): Promise<User | null> => {
  const result = await db.query(`
    SELECT id, email, display_name, plan_type, is_email_verified, created_at, last_login
    FROM users WHERE id = $1
  `, [userId]);

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    planType: user.plan_type,
    isEmailVerified: user.is_email_verified,
    createdAt: user.created_at,
    lastLogin: user.last_login
  };
};
/**
 * 認証サービス
 * 作成日: 2025-09-07
 * 用途: ユーザー登録・ログイン・トークン管理
 */

import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_CONFIG, PASSWORD_CONFIG } from '../config/jwt';
import { prisma } from '../lib/prisma';
import { PlanType } from '../generated/prisma';

// ユーザー型定義
export interface User {
  id: number;
  email: string;
  displayName: string;
  planType: PlanType;
  isEmailVerified: boolean;
  createdAt: Date;
  lastLogin: Date | null;
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

export interface AuthResult {
  user: User;
  tokens: TokenPair;
}

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
    expiresIn: '15m' 
  });
};

/**
 * JWT リフレッシュトークン生成
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * アクセストークンとリフレッシュトークンのペア生成
 * リフレッシュトークンはデータベースに保存される
 */
export const generateTokens = async (user: User): Promise<TokenPair> => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // リフレッシュトークンをデータベースに保存
  await prisma.user_sessions.create({
    data: {
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日後
    }
  });

  return {
    accessToken,
    refreshToken
  };
};

/**
 * ユーザー登録
 */
export const registerUser = async (userData: CreateUserData): Promise<AuthResult> => {
  const { email, password, displayName } = userData;

  // メール重複チェック
  const existingUser = await prisma.users.findUnique({
    where: { email }
  });

  if (existingUser) {
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
  const user = await prisma.users.create({
    data: {
      email,
      password_hash: passwordHash,
      display_name: displayName || email.split('@')[0], // displayNameがない場合はemailから生成
      email_verification_token: emailVerificationToken
    }
  });

  const userObj: User = {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    planType: user.plan_type,
    isEmailVerified: user.is_email_verified,
    createdAt: user.created_at,
    lastLogin: user.last_login
  };

  // トークン生成
  const tokens = await generateTokens(userObj);

  return {
    user: userObj,
    tokens
  };
};

/**
 * ユーザーログイン
 */
export const loginUser = async (loginData: LoginData): Promise<AuthResult> => {
  const { email, password } = loginData;

  // ユーザー取得
  const user = await prisma.users.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // パスワード検証
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  const userObj: User = {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    planType: user.plan_type,
    isEmailVerified: user.is_email_verified,
    createdAt: user.created_at,
    lastLogin: user.last_login
  };

  // トークン生成
  const accessToken = generateAccessToken(userObj);
  const refreshToken = generateRefreshToken();

  // リフレッシュトークンをデータベースに保存
  await prisma.user_sessions.create({
    data: {
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日後
    }
  });

  // 最終ログイン更新
  await prisma.users.update({
    where: { id: user.id },
    data: { last_login: new Date() }
  });

  return {
    user: userObj,
    tokens: { accessToken, refreshToken }
  };
};

/**
 * リフレッシュトークンでアクセストークン更新
 */
export const refreshAccessToken = async (refreshToken: string): Promise<TokenPair> => {
  // リフレッシュトークン検証
  const session = await prisma.user_sessions.findFirst({
    where: {
      refresh_token: refreshToken,
      expires_at: {
        gt: new Date()
      }
    },
    include: {
      users: true
    }
  });

  if (!session || !session.users) {
    throw new Error('Invalid or expired refresh token');
  }

  const user: User = {
    id: session.users.id,
    email: session.users.email,
    displayName: session.users.display_name,
    planType: session.users.plan_type,
    isEmailVerified: session.users.is_email_verified,
    createdAt: session.users.created_at,
    lastLogin: session.users.last_login
  };

  // 新しいトークン生成
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();

  // 古いリフレッシュトークンを削除し、新しいものを保存
  await prisma.user_sessions.deleteMany({
    where: { refresh_token: refreshToken }
  });
  
  await prisma.user_sessions.create({
    data: {
      user_id: user.id,
      refresh_token: newRefreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

/**
 * ログアウト（リフレッシュトークン削除）
 */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  await prisma.user_sessions.deleteMany({
    where: { refresh_token: refreshToken }
  });
};

/**
 * ユーザー情報取得
 */
export const getUserById = async (userId: number): Promise<User | null> => {
  const user = await prisma.users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return null;
  }

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
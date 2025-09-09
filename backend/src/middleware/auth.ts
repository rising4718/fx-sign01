/**
 * JWT認証ミドルウェア
 * 作成日: 2025-09-07
 * 用途: Express.js用認証ミドルウェア
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWT_CONFIG } from '../config/jwt';

// ユーザー情報を含むRequestインターフェース
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    planType: 'free' | 'basic' | 'pro';
    displayName?: string;
  };
  headers: any;
  body: any;
}

// JWT トークンの型定義
interface JWTPayload {
  id: number;
  email: string;
  planType: 'free' | 'basic' | 'pro';
  displayName?: string;
  iat: number;
  exp: number;
}

/**
 * JWT トークン認証ミドルウェア
 * Authorization: Bearer <token> ヘッダーからトークンを取得し検証
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN' 
      });
      return;
    }

    jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          res.status(401).json({ 
            error: 'Access token expired',
            code: 'TOKEN_EXPIRED' 
          });
          return;
        }
        res.status(403).json({ 
          error: 'Invalid access token',
          code: 'INVALID_TOKEN' 
        });
        return;
      }

      const payload = decoded as JWTPayload;
      req.user = {
        id: payload.id,
        email: payload.email,
        planType: payload.planType,
        displayName: payload.displayName
      };

      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'AUTH_ERROR' 
    });
    return;
  }
};

/**
 * プラン別アクセス制御ミドルウェア
 * 指定されたプラン以上のユーザーのみアクセス許可
 */
export const requirePlan = (requiredPlan: 'free' | 'basic' | 'pro') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED' 
      });
      return;
    }

    const planHierarchy = { 'free': 0, 'basic': 1, 'pro': 2 };
    const userLevel = planHierarchy[req.user.planType];
    const requiredLevel = planHierarchy[requiredPlan];

    if (userLevel < requiredLevel) {
      res.status(403).json({ 
        error: `${requiredPlan} plan required`,
        code: 'INSUFFICIENT_PLAN',
        userPlan: req.user.planType,
        requiredPlan 
      });
      return;
    }

    next();
  };
};

/**
 * オプション認証ミドルウェア
 * トークンがあれば認証、なければ匿名ユーザーとして通す
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = undefined;
      return next();
    }

    jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (!err) {
        const payload = decoded as JWTPayload;
        req.user = {
          id: payload.id,
          email: payload.email,
          planType: payload.planType,
          displayName: payload.displayName
        };
      }
      next();
    });
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};
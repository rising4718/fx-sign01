/**
 * 認証API ルート
 * 作成日: 2025-09-07
 * 用途: ユーザー認証・登録・プロフィール管理API
 */

import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { 
  registerUser, 
  loginUser, 
  refreshAccessToken, 
  logoutUser, 
  getUserById 
} from '../services/authService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { RATE_LIMIT_CONFIG } from '../config/jwt';

const router = express.Router();

// レート制限設定
const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.LOGIN_WINDOW_MS,
  max: RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS,
  message: { 
    error: 'Too many login attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.REGISTER_WINDOW_MS,
  max: RATE_LIMIT_CONFIG.REGISTER_MAX_ATTEMPTS,
  message: { 
    error: 'Too many registration attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED' 
  }
});

// バリデーションルール
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be 8-100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase, uppercase and number'),
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Display name must be 1-100 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

/**
 * POST /api/auth/register
 * ユーザー登録
 */
router.post('/register', registerLimiter, registerValidation, async (req: Request, res: Response) => {
  try {
    // バリデーション結果チェック
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { email, password, displayName } = req.body;

    // ユーザー登録
    const user = await registerUser({
      email,
      password,
      displayName
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        planType: user.planType,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message === 'Email already exists') {
      return res.status(409).json({
        error: 'Email already exists',
        code: 'EMAIL_EXISTS'
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * POST /api/auth/login
 * ユーザーログイン
 */
router.post('/login', loginLimiter, loginValidation, async (req: Request, res: Response) => {
  try {
    // バリデーション結果チェック
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // ログイン処理
    const { user, tokens } = await loginUser({ email, password });

    // HTTPOnly Cookie でリフレッシュトークンを送信
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7日
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        planType: user.planType,
        isEmailVerified: user.isEmailVerified
      },
      accessToken: tokens.accessToken
    });

  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * POST /api/auth/refresh
 * アクセストークンの更新
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // トークン更新
    const tokens = await refreshAccessToken(refreshToken);

    // 新しいリフレッシュトークンをCookieに設定
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken
    });

  } catch (error: any) {
    console.error('Token refresh error:', error);
    
    // 無効なリフレッシュトークンの場合、Cookieをクリア
    res.clearCookie('refreshToken');
    
    return res.status(401).json({
      error: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

/**
 * POST /api/auth/logout
 * ログアウト
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // リフレッシュトークンをデータベースから削除
      await logoutUser(refreshToken);
    }

    // Cookieクリア
    res.clearCookie('refreshToken');

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // エラーでもCookieはクリア
    res.clearCookie('refreshToken');
    
    res.json({
      message: 'Logout completed'
    });
  }
});

/**
 * GET /api/auth/profile
 * プロフィール取得（認証必要）
 */
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // 最新のユーザー情報を取得
    const user = await getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        planType: user.planType,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'PROFILE_ERROR'
    });
  }
});

/**
 * PUT /api/auth/profile
 * プロフィール更新（認証必要）
 */
router.put('/profile', authenticateToken, [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Display name must be 1-100 characters')
], async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // バリデーション結果チェック
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { displayName } = req.body;

    // TODO: プロフィール更新のデータベース処理
    // 現在は displayName のみ対応

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...req.user,
        displayName
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

export default router;
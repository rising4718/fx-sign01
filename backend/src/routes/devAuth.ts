import express from 'express';

const router = express.Router();

// 開発環境チェックミドルウェア
const isDevelopmentOnly = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (process.env.NODE_ENV !== 'development') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  next();
};

// 開発用モックユーザーデータ
const mockUser = {
  id: 999,
  email: 'dev@localhost',
  displayName: '開発ユーザー',
  planType: 'pro' as const,
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString()
};

// 開発用認証エンドポイント
router.post('/login', isDevelopmentOnly, (req, res) => {
  console.log('🔧 Development auth bypass activated');
  
  // モックトークン生成（実際のJWTではなく開発用の固定値）
  const mockAccessToken = 'dev_access_token_' + Date.now();
  const mockRefreshToken = 'dev_refresh_token_' + Date.now();

  res.json({
    success: true,
    user: mockUser,
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
    message: '開発モード: 認証をバイパスしました'
  });
});

// 開発用プロフィール取得エンドポイント
router.get('/profile', isDevelopmentOnly, (req, res) => {
  // Authorization headerのチェック（開発用トークンの簡易チェック）
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer dev_access_token_')) {
    res.json({
      success: true,
      user: mockUser
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// 開発用リフレッシュエンドポイント
router.post('/refresh', isDevelopmentOnly, (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken && refreshToken.startsWith('dev_refresh_token_')) {
    const newAccessToken = 'dev_access_token_' + Date.now();
    const newRefreshToken = 'dev_refresh_token_' + Date.now();
    
    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } else {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
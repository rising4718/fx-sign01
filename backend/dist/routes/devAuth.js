"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const isDevelopmentOnly = (req, res, next) => {
    if (process.env.NODE_ENV !== 'development') {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    next();
};
const mockUser = {
    id: 999,
    email: 'dev@localhost',
    displayName: '開発ユーザー',
    planType: 'pro',
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
};
router.post('/login', isDevelopmentOnly, (req, res) => {
    console.log('🔧 Development auth bypass activated');
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
router.get('/profile', isDevelopmentOnly, (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer dev_access_token_')) {
        res.json({
            success: true,
            user: mockUser
        });
    }
    else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});
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
    }
    else {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});
exports.default = router;
//# sourceMappingURL=devAuth.js.map
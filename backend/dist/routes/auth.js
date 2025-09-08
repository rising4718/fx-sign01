"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_validator_1 = require("express-validator");
const authService_1 = require("../services/authService");
const auth_1 = require("../middleware/auth");
const jwt_1 = require("../config/jwt");
const router = express_1.default.Router();
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: jwt_1.RATE_LIMIT_CONFIG.LOGIN_WINDOW_MS,
    max: jwt_1.RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS,
    message: {
        error: 'Too many login attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});
const registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: jwt_1.RATE_LIMIT_CONFIG.REGISTER_WINDOW_MS,
    max: jwt_1.RATE_LIMIT_CONFIG.REGISTER_MAX_ATTEMPTS,
    message: {
        error: 'Too many registration attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    }
});
const registerValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8, max: 100 })
        .withMessage('パスワードは8～100文字で入力してください'),
    (0, express_validator_1.body)('displayName')
        .optional()
        .isLength({ min: 1, max: 100 })
        .trim()
        .withMessage('Display name must be 1-100 characters')
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
];
router.post('/register', registerLimiter, registerValidation, async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            const errorMessages = errors.array().map(err => err.msg).join(', ');
            res.status(400).json({
                error: errorMessages,
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
            return;
        }
        const { email, password, displayName } = req.body;
        const { user, tokens } = await (0, authService_1.registerUser)({
            email,
            password,
            displayName
        });
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                planType: user.planType,
                isEmailVerified: user.isEmailVerified
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
        return;
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error.message === 'Email already exists') {
            res.status(409).json({
                error: 'Email already exists',
                code: 'EMAIL_EXISTS'
            });
            return;
        }
        res.status(500).json({
            error: 'Registration failed',
            code: 'REGISTRATION_ERROR'
        });
        return;
    }
});
router.post('/login', loginLimiter, loginValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg).join(', ');
            res.status(400).json({
                error: errorMessages,
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
            return;
        }
        const { email, password } = req.body;
        const { user, tokens } = await (0, authService_1.loginUser)({ email, password });
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
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
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
        return;
    }
    catch (error) {
        console.error('Login error:', error);
        if (error.message === 'Invalid email or password') {
            res.status(401).json({
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
            return;
        }
        res.status(500).json({
            error: 'Login failed',
            code: 'LOGIN_ERROR'
        });
        return;
    }
});
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            res.status(401).json({
                error: 'Refresh token required',
                code: 'NO_REFRESH_TOKEN'
            });
            return;
        }
        const tokens = await (0, authService_1.refreshAccessToken)(refreshToken);
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({
            message: 'Token refreshed successfully',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
        return;
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.clearCookie('refreshToken');
        res.status(401).json({
            error: 'Invalid or expired refresh token',
            code: 'INVALID_REFRESH_TOKEN'
        });
        return;
    }
});
router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await (0, authService_1.logoutUser)(refreshToken);
        }
        res.clearCookie('refreshToken');
        res.json({
            message: 'Logout successful'
        });
        return;
    }
    catch (error) {
        console.error('Logout error:', error);
        res.clearCookie('refreshToken');
        res.json({
            message: 'Logout completed'
        });
        return;
    }
});
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
            return;
        }
        const user = await (0, authService_1.getUserById)(req.user.id);
        if (!user) {
            res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
            return;
        }
        res.json({
            message: 'Profile fetched successfully',
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
        return;
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch profile',
            code: 'PROFILE_ERROR'
        });
        return;
    }
});
router.put('/profile', auth_1.authenticateToken, [
    (0, express_validator_1.body)('displayName')
        .optional()
        .isLength({ min: 1, max: 100 })
        .trim()
        .withMessage('Display name must be 1-100 characters')
], async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg).join(', ');
            res.status(400).json({
                error: errorMessages,
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
            return;
        }
        const { displayName } = req.body;
        res.json({
            message: 'Profile updated successfully',
            user: {
                ...req.user,
                displayName
            }
        });
        return;
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            code: 'PROFILE_UPDATE_ERROR'
        });
        return;
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map
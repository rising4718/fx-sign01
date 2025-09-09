"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = exports.generateTokens = exports.generateRefreshToken = exports.generateAccessToken = exports.verifyPassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const jwt_1 = require("../config/jwt");
const prisma_1 = require("../lib/prisma");
const hashPassword = async (password) => {
    return bcrypt_1.default.hash(password, jwt_1.PASSWORD_CONFIG.SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
const verifyPassword = async (password, hash) => {
    return bcrypt_1.default.compare(password, hash);
};
exports.verifyPassword = verifyPassword;
const generateAccessToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        planType: user.planType,
        displayName: user.displayName
    };
    return jsonwebtoken_1.default.sign(payload, jwt_1.JWT_CONFIG.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(64).toString('hex');
};
exports.generateRefreshToken = generateRefreshToken;
const generateTokens = async (user) => {
    const accessToken = (0, exports.generateAccessToken)(user);
    const refreshToken = (0, exports.generateRefreshToken)();
    await prisma_1.prisma.user_sessions.create({
        data: {
            user_id: user.id,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });
    return {
        accessToken,
        refreshToken
    };
};
exports.generateTokens = generateTokens;
const registerUser = async (userData) => {
    const { email, password, displayName } = userData;
    const existingUser = await prisma_1.prisma.users.findUnique({
        where: { email }
    });
    if (existingUser) {
        throw new Error('Email already exists');
    }
    if (password.length < jwt_1.PASSWORD_CONFIG.MIN_LENGTH) {
        throw new Error(`Password must be at least ${jwt_1.PASSWORD_CONFIG.MIN_LENGTH} characters`);
    }
    const passwordHash = await (0, exports.hashPassword)(password);
    const emailVerificationToken = crypto_1.default.randomBytes(32).toString('hex');
    const user = await prisma_1.prisma.users.create({
        data: {
            email,
            password_hash: passwordHash,
            display_name: displayName || email.split('@')[0],
            email_verification_token: emailVerificationToken
        }
    });
    const userObj = {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        planType: user.plan_type,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login
    };
    const tokens = await (0, exports.generateTokens)(userObj);
    return {
        user: userObj,
        tokens
    };
};
exports.registerUser = registerUser;
const loginUser = async (loginData) => {
    const { email, password } = loginData;
    const user = await prisma_1.prisma.users.findUnique({
        where: { email }
    });
    if (!user) {
        throw new Error('Invalid email or password');
    }
    const isValidPassword = await (0, exports.verifyPassword)(password, user.password_hash);
    if (!isValidPassword) {
        throw new Error('Invalid email or password');
    }
    const userObj = {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        planType: user.plan_type,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login
    };
    const accessToken = (0, exports.generateAccessToken)(userObj);
    const refreshToken = (0, exports.generateRefreshToken)();
    await prisma_1.prisma.user_sessions.create({
        data: {
            user_id: user.id,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });
    await prisma_1.prisma.users.update({
        where: { id: user.id },
        data: { last_login: new Date() }
    });
    return {
        user: userObj,
        tokens: { accessToken, refreshToken }
    };
};
exports.loginUser = loginUser;
const refreshAccessToken = async (refreshToken) => {
    const session = await prisma_1.prisma.user_sessions.findFirst({
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
    const user = {
        id: session.users.id,
        email: session.users.email,
        displayName: session.users.display_name,
        planType: session.users.plan_type,
        isEmailVerified: session.users.is_email_verified,
        createdAt: session.users.created_at,
        lastLogin: session.users.last_login
    };
    const newAccessToken = (0, exports.generateAccessToken)(user);
    const newRefreshToken = (0, exports.generateRefreshToken)();
    await prisma_1.prisma.user_sessions.deleteMany({
        where: { refresh_token: refreshToken }
    });
    await prisma_1.prisma.user_sessions.create({
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
exports.refreshAccessToken = refreshAccessToken;
const logoutUser = async (refreshToken) => {
    await prisma_1.prisma.user_sessions.deleteMany({
        where: { refresh_token: refreshToken }
    });
};
exports.logoutUser = logoutUser;
const getUserById = async (userId) => {
    const user = await prisma_1.prisma.users.findUnique({
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
exports.getUserById = getUserById;
//# sourceMappingURL=authService.js.map
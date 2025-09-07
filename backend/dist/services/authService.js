"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = exports.generateTokens = exports.generateRefreshToken = exports.generateAccessToken = exports.verifyPassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const pg_1 = require("pg");
const jwt_1 = require("../config/jwt");
let db = null;
const getDb = () => {
    if (!db) {
        console.log('Initializing DB connection with config:', {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'fx_sign_db',
            user: process.env.DB_USER || 'fxuser',
        });
        db = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'fx_sign_db',
            user: process.env.DB_USER || 'fxuser',
            password: process.env.DB_PASSWORD || 'fxpass123',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }
    return db;
};
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
    await getDb().query(`
    INSERT INTO user_sessions (user_id, refresh_token, expires_at)
    VALUES ($1, $2, $3)
  `, [
        user.id,
        refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ]);
    return {
        accessToken,
        refreshToken
    };
};
exports.generateTokens = generateTokens;
const registerUser = async (userData) => {
    const { email, password, displayName } = userData;
    const existingUser = await getDb().query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
        throw new Error('Email already exists');
    }
    if (password.length < jwt_1.PASSWORD_CONFIG.MIN_LENGTH) {
        throw new Error(`Password must be at least ${jwt_1.PASSWORD_CONFIG.MIN_LENGTH} characters`);
    }
    const passwordHash = await (0, exports.hashPassword)(password);
    const emailVerificationToken = crypto_1.default.randomBytes(32).toString('hex');
    const result = await getDb().query(`
    INSERT INTO users (email, password_hash, display_name, email_verification_token)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, display_name, plan_type, is_email_verified, created_at
  `, [email, passwordHash, displayName, emailVerificationToken]);
    const user = result.rows[0];
    const userObj = {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        planType: user.plan_type,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at
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
    const result = await getDb().query(`
    SELECT id, email, password_hash, display_name, plan_type, is_email_verified, created_at
    FROM users WHERE email = $1
  `, [email]);
    if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
    }
    const userRow = result.rows[0];
    const isValidPassword = await (0, exports.verifyPassword)(password, userRow.password_hash);
    if (!isValidPassword) {
        throw new Error('Invalid email or password');
    }
    const user = {
        id: userRow.id,
        email: userRow.email,
        displayName: userRow.display_name,
        planType: userRow.plan_type,
        isEmailVerified: userRow.is_email_verified,
        createdAt: userRow.created_at
    };
    const accessToken = (0, exports.generateAccessToken)(user);
    const refreshToken = (0, exports.generateRefreshToken)();
    await getDb().query(`
    INSERT INTO user_sessions (user_id, refresh_token, expires_at)
    VALUES ($1, $2, $3)
  `, [
        user.id,
        refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ]);
    await getDb().query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    return {
        user,
        tokens: { accessToken, refreshToken }
    };
};
exports.loginUser = loginUser;
const refreshAccessToken = async (refreshToken) => {
    const result = await getDb().query(`
    SELECT us.user_id, u.email, u.display_name, u.plan_type, u.is_email_verified, u.created_at
    FROM user_sessions us
    JOIN users u ON us.user_id = u.id
    WHERE us.refresh_token = $1 AND us.expires_at > NOW()
  `, [refreshToken]);
    if (result.rows.length === 0) {
        throw new Error('Invalid or expired refresh token');
    }
    const userRow = result.rows[0];
    const user = {
        id: userRow.user_id,
        email: userRow.email,
        displayName: userRow.display_name,
        planType: userRow.plan_type,
        isEmailVerified: userRow.is_email_verified,
        createdAt: userRow.created_at
    };
    const newAccessToken = (0, exports.generateAccessToken)(user);
    const newRefreshToken = (0, exports.generateRefreshToken)();
    await getDb().query('DELETE FROM user_sessions WHERE refresh_token = $1', [refreshToken]);
    await getDb().query(`
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
exports.refreshAccessToken = refreshAccessToken;
const logoutUser = async (refreshToken) => {
    await getDb().query('DELETE FROM user_sessions WHERE refresh_token = $1', [refreshToken]);
};
exports.logoutUser = logoutUser;
const getUserById = async (userId) => {
    const result = await getDb().query(`
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
exports.getUserById = getUserById;
//# sourceMappingURL=authService.js.map
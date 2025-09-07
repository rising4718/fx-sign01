"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_CONFIG = exports.PASSWORD_CONFIG = exports.JWT_CONFIG = void 0;
exports.JWT_CONFIG = {
    ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_SECRET || 'fx_access_secret_development_key_2025',
    REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET || 'fx_refresh_secret_development_key_2025',
    ACCESS_TOKEN_EXPIRES: '15m',
    REFRESH_TOKEN_EXPIRES: '7d'
};
exports.PASSWORD_CONFIG = {
    SALT_ROUNDS: 12,
    MIN_LENGTH: 8,
    MAX_LENGTH: 100
};
exports.RATE_LIMIT_CONFIG = {
    LOGIN_WINDOW_MS: 15 * 60 * 1000,
    LOGIN_MAX_ATTEMPTS: 5,
    REGISTER_WINDOW_MS: 60 * 60 * 1000,
    REGISTER_MAX_ATTEMPTS: 3,
    RESET_WINDOW_MS: 60 * 60 * 1000,
    RESET_MAX_ATTEMPTS: 3
};
//# sourceMappingURL=jwt.js.map
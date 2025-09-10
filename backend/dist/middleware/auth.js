"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requirePlan = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                error: 'Access token required',
                code: 'NO_TOKEN'
            });
            return;
        }
        jsonwebtoken_1.default.verify(token, jwt_1.JWT_CONFIG.ACCESS_TOKEN_SECRET, (err, decoded) => {
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
            const payload = decoded;
            req.user = {
                id: payload.id,
                email: payload.email,
                planType: payload.planType,
                displayName: payload.displayName
            };
            next();
        });
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'AUTH_ERROR'
        });
        return;
    }
};
exports.authenticateToken = authenticateToken;
const requirePlan = (requiredPlan) => {
    return (req, res, next) => {
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
exports.requirePlan = requirePlan;
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            req.user = undefined;
            return next();
        }
        jsonwebtoken_1.default.verify(token, jwt_1.JWT_CONFIG.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (!err) {
                const payload = decoded;
                req.user = {
                    id: payload.id,
                    email: payload.email,
                    planType: payload.planType,
                    displayName: payload.displayName
                };
            }
            next();
        });
    }
    catch (error) {
        console.error('Optional auth middleware error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map
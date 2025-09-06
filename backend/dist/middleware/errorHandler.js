"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const errorHandler = (error, req, res, next) => {
    logger_1.logger.error(`Error on ${req.method} ${req.path}:`, {
        message: error.message,
        stack: error.stack,
        body: req.body,
        query: req.query,
        params: req.params
    });
    if (error instanceof types_1.APIError || 'status' in error) {
        const apiError = error;
        return res.status(apiError.status || 500).json({
            error: {
                message: apiError.message,
                code: apiError.code,
                source: apiError.source,
                timestamp: new Date().toISOString()
            }
        });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: {
                message: 'Validation Error',
                details: error.message,
                timestamp: new Date().toISOString()
            }
        });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: {
                message: 'Invalid token',
                timestamp: new Date().toISOString()
            }
        });
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: {
                message: 'Token expired',
                timestamp: new Date().toISOString()
            }
        });
    }
    return res.status(500).json({
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : error.message,
            timestamp: new Date().toISOString()
        }
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map
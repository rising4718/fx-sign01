import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { APIError } from '../types';

export const errorHandler = (
  error: Error | APIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error(`Error on ${req.method} ${req.path}:`, {
    message: error.message,
    stack: error.stack,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Handle different error types
  if (error instanceof APIError || 'status' in error) {
    const apiError = error as APIError;
    return res.status(apiError.status || 500).json({
      error: {
        message: apiError.message,
        code: apiError.code,
        source: apiError.source,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Validation Error',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Handle JWT errors
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

  // Default server error
  return res.status(500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      timestamp: new Date().toISOString()
    }
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
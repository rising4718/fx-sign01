import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from 'ws';

import { fxRoutes } from './routes/fx';
import { torbRoutes } from './routes/torb';
import { performanceRoutes } from './routes/performance';
import { autoTradingRoutes } from './routes/autoTrading';
import authRoutes from './routes/auth';
import devAuthRoutes from './routes/devAuth';
import { setupWebSocket } from './services/websocketService';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv.config({ path: envFile });


const app = express();

// Trust proxy for Nginx reverse proxy
app.set('trust proxy', 1);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',  // Additional port for dev environment
    'http://localhost:5175'   // Additional port for dev environment
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    service: 'FX Sign Backend API',
    version: '1.0.1',
    deployment: 'PM2 Unified Deployment System'
  });
});

// API routes
app.use('/api/v1/fx', fxRoutes);
app.use('/api/v1/torb', torbRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/auto-trading', autoTradingRoutes);
app.use('/api/auth', authRoutes);

// Development-only auth routes
if (process.env.NODE_ENV === 'development') {
  app.use('/api/dev/auth', devAuthRoutes);
  logger.info('🔧 Development auth bypass routes enabled');
}

// Setup WebSocket service
setupWebSocket(wss);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
  logger.info(`🚀 FX Sign Backend Server started`);
  logger.info(`📍 Server running on http://${HOST}:${PORT}`);
  logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 WebSocket Server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
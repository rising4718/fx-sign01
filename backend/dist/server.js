"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const ws_1 = require("ws");
const pg_1 = require("pg");
const fx_1 = require("./routes/fx");
const torb_1 = require("./routes/torb");
const performance_1 = require("./routes/performance");
const autoTrading_1 = require("./routes/autoTrading");
const auth_1 = __importDefault(require("./routes/auth"));
const devAuth_1 = __importDefault(require("./routes/devAuth"));
const history_1 = require("./routes/history");
const websocketService_1 = require("./services/websocketService");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const historyAccumulationService_1 = require("./services/historyAccumulationService");
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv_1.default.config({ path: envFile });
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
const pool = new pg_1.Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'fx_sign_db',
    user: process.env.DATABASE_USER || 'fxuser',
    password: process.env.DATABASE_PASSWORD || 'fxpass123',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
let historyService = null;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
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
app.use('/api/v1/fx', fx_1.fxRoutes);
app.use('/api/v1/torb', torb_1.torbRoutes);
app.use('/api/v1/performance', performance_1.performanceRoutes);
app.use('/api/v1/auto-trading', autoTrading_1.autoTradingRoutes);
app.use('/api/auth', auth_1.default);
if (process.env.NODE_ENV === 'development') {
    app.use('/api/dev/auth', devAuth_1.default);
    logger_1.logger.info('🔧 Development auth bypass routes enabled');
}
const historyRoutes = (0, history_1.createHistoryRoutes)(pool, () => historyService);
app.use('/api/v1/history', historyRoutes);
(0, websocketService_1.setupWebSocket)(wss);
app.use(errorHandler_1.errorHandler);
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || 'localhost';
server.listen(PORT, HOST, async () => {
    logger_1.logger.info(`🚀 FX Sign Backend Server started`);
    logger_1.logger.info(`📍 Server running on http://${HOST}:${PORT}`);
    logger_1.logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.logger.info(`🌐 WebSocket Server ready for connections`);
    try {
        historyService = new historyAccumulationService_1.HistoryAccumulationService(pool);
        historyService.start();
        logger_1.logger.info(`📊 [Phase2] History accumulation service started`);
    }
    catch (error) {
        logger_1.logger.error(`❌ [Phase2] Failed to start history service:`, error);
    }
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    if (historyService) {
        historyService.stop();
        logger_1.logger.info('📊 [Phase2] History accumulation service stopped');
    }
    pool.end().then(() => {
        logger_1.logger.info('🗄️ Database connection pool closed');
    });
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    if (historyService) {
        historyService.stop();
        logger_1.logger.info('📊 [Phase2] History accumulation service stopped');
    }
    pool.end().then(() => {
        logger_1.logger.info('🗄️ Database connection pool closed');
    });
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=server.js.map
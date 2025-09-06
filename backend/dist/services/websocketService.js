"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebSocketService = exports.setupWebSocket = void 0;
const ws_1 = require("ws");
const uuid_1 = require("../utils/uuid");
const logger_1 = require("../utils/logger");
class WebSocketService {
    constructor(wss) {
        this.clients = new Map();
        this.heartbeatInterval = null;
        this.wss = wss;
        this.setupWebSocketServer();
        this.startHeartbeat();
    }
    setupWebSocketServer() {
        this.wss.on('connection', (ws, request) => {
            const clientId = (0, uuid_1.uuidv4)();
            const clientInfo = {
                id: clientId,
                ws,
                isAlive: true,
                lastPing: new Date()
            };
            this.clients.set(clientId, clientInfo);
            logger_1.logger.info(`WebSocket client connected: ${clientId}`, {
                totalClients: this.clients.size,
                clientIP: request.socket.remoteAddress
            });
            this.sendToClient(clientId, {
                type: 'CONNECTION_STATUS',
                data: {
                    status: 'connected',
                    clientId,
                    message: 'Welcome to FX Sign WebSocket Server'
                },
                timestamp: new Date()
            });
            ws.on('message', (data) => {
                this.handleClientMessage(clientId, data);
            });
            ws.on('pong', () => {
                const client = this.clients.get(clientId);
                if (client) {
                    client.isAlive = true;
                    client.lastPing = new Date();
                }
            });
            ws.on('close', (code, reason) => {
                logger_1.logger.info(`WebSocket client disconnected: ${clientId}`, {
                    code,
                    reason: reason.toString(),
                    totalClients: this.clients.size - 1
                });
                this.clients.delete(clientId);
            });
            ws.on('error', (error) => {
                logger_1.logger.error(`WebSocket error for client ${clientId}:`, error);
                this.clients.delete(clientId);
            });
        });
        this.wss.on('error', (error) => {
            logger_1.logger.error('WebSocket server error:', error);
        });
    }
    handleClientMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            logger_1.logger.debug(`Message from client ${clientId}:`, message);
            switch (message.type) {
                case 'SUBSCRIBE_PRICE':
                    this.handlePriceSubscription(clientId, message.data);
                    break;
                case 'SUBSCRIBE_SIGNALS':
                    this.handleSignalSubscription(clientId, message.data);
                    break;
                case 'PING':
                    this.sendToClient(clientId, {
                        type: 'PONG',
                        data: { timestamp: new Date() },
                        timestamp: new Date()
                    });
                    break;
                default:
                    logger_1.logger.warn(`Unknown message type from client ${clientId}:`, message.type);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error parsing message from client ${clientId}:`, error);
            this.sendToClient(clientId, {
                type: 'ERROR',
                data: { message: 'Invalid message format' },
                timestamp: new Date()
            });
        }
    }
    handlePriceSubscription(clientId, data) {
        const symbol = data.symbol || 'USD/JPY';
        logger_1.logger.info(`Client ${clientId} subscribed to price updates for ${symbol}`);
        this.sendToClient(clientId, {
            type: 'SUBSCRIPTION_CONFIRMED',
            data: {
                type: 'price',
                symbol,
                message: `Subscribed to ${symbol} price updates`
            },
            timestamp: new Date()
        });
    }
    handleSignalSubscription(clientId, data) {
        const symbol = data.symbol || 'USD/JPY';
        logger_1.logger.info(`Client ${clientId} subscribed to TORB signals for ${symbol}`);
        this.sendToClient(clientId, {
            type: 'SUBSCRIPTION_CONFIRMED',
            data: {
                type: 'signals',
                symbol,
                message: `Subscribed to ${symbol} TORB signals`
            },
            timestamp: new Date()
        });
    }
    startHeartbeat() {
        const interval = parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000');
        this.heartbeatInterval = setInterval(() => {
            this.clients.forEach((client, clientId) => {
                if (!client.isAlive) {
                    logger_1.logger.debug(`Removing inactive client: ${clientId}`);
                    client.ws.terminate();
                    this.clients.delete(clientId);
                    return;
                }
                client.isAlive = false;
                client.ws.ping();
            });
            logger_1.logger.debug(`WebSocket heartbeat sent to ${this.clients.size} clients`);
        }, interval);
    }
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === ws_1.WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            }
            catch (error) {
                logger_1.logger.error(`Error sending message to client ${clientId}:`, error);
                this.clients.delete(clientId);
            }
        }
    }
    broadcast(message) {
        const activeClients = Array.from(this.clients.entries()).filter(([, client]) => client.ws.readyState === ws_1.WebSocket.OPEN);
        logger_1.logger.debug(`Broadcasting message to ${activeClients.length} clients:`, message.type);
        activeClients.forEach(([clientId, client]) => {
            try {
                client.ws.send(JSON.stringify(message));
            }
            catch (error) {
                logger_1.logger.error(`Error broadcasting to client ${clientId}:`, error);
                this.clients.delete(clientId);
            }
        });
    }
    broadcastPriceUpdate(priceData) {
        this.broadcast({
            type: 'PRICE_UPDATE',
            data: priceData,
            timestamp: new Date()
        });
    }
    broadcastTORBSignal(signal) {
        this.broadcast({
            type: 'TORB_SIGNAL',
            data: signal,
            timestamp: new Date()
        });
    }
    getConnectedClientsCount() {
        return this.clients.size;
    }
    getClientsList() {
        return Array.from(this.clients.entries()).map(([id, client]) => ({
            id,
            connected: client.lastPing,
            isAlive: client.isAlive
        }));
    }
    close() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.clients.forEach((client) => {
            client.ws.close();
        });
        this.clients.clear();
        logger_1.logger.info('WebSocket service closed');
    }
}
let wsService;
const setupWebSocket = (wss) => {
    wsService = new WebSocketService(wss);
    logger_1.logger.info('WebSocket service initialized');
};
exports.setupWebSocket = setupWebSocket;
const getWebSocketService = () => {
    if (!wsService) {
        throw new Error('WebSocket service not initialized');
    }
    return wsService;
};
exports.getWebSocketService = getWebSocketService;
//# sourceMappingURL=websocketService.js.map
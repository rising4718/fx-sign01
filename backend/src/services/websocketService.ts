import { WebSocketServer, WebSocket } from 'ws';
import { uuidv4 } from '../utils/uuid';
import { logger } from '../utils/logger';
import { WSClient, WSMessage, FXPrice, TORBSignal } from '../types';

class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = uuidv4();
      const clientInfo = {
        id: clientId,
        ws,
        isAlive: true,
        lastPing: new Date()
      };

      this.clients.set(clientId, clientInfo);
      
      logger.info(`WebSocket client connected: ${clientId}`, {
        totalClients: this.clients.size,
        clientIP: request.socket.remoteAddress
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'CONNECTION_STATUS',
        data: {
          status: 'connected',
          clientId,
          message: 'Welcome to FX Sign WebSocket Server'
        },
        timestamp: new Date()
      });

      // Handle incoming messages
      ws.on('message', (data) => {
        this.handleClientMessage(clientId, data);
      });

      // Handle pong responses
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.isAlive = true;
          client.lastPing = new Date();
        }
      });

      // Handle client disconnect
      ws.on('close', (code, reason) => {
        logger.info(`WebSocket client disconnected: ${clientId}`, {
          code,
          reason: reason.toString(),
          totalClients: this.clients.size - 1
        });
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });
  }

  private handleClientMessage(clientId: string, data: any) {
    try {
      const message = JSON.parse(data.toString());
      logger.debug(`Message from client ${clientId}:`, message);

      // Handle different message types
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
          logger.warn(`Unknown message type from client ${clientId}:`, message.type);
      }
    } catch (error) {
      logger.error(`Error parsing message from client ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'ERROR',
        data: { message: 'Invalid message format' },
        timestamp: new Date()
      });
    }
  }

  private handlePriceSubscription(clientId: string, data: any) {
    const symbol = data.symbol || 'USD/JPY';
    logger.info(`Client ${clientId} subscribed to price updates for ${symbol}`);
    
    // Send confirmation
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

  private handleSignalSubscription(clientId: string, data: any) {
    const symbol = data.symbol || 'USD/JPY';
    logger.info(`Client ${clientId} subscribed to TORB signals for ${symbol}`);
    
    // Send confirmation
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

  private startHeartbeat() {
    const interval = parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000');
    
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          logger.debug(`Removing inactive client: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });

      logger.debug(`WebSocket heartbeat sent to ${this.clients.size} clients`);
    }, interval);
  }

  public sendToClient(clientId: string, message: WSMessage) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Error sending message to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  public broadcast(message: WSMessage) {
    const activeClients = Array.from(this.clients.entries()).filter(
      ([, client]) => client.ws.readyState === WebSocket.OPEN
    );

    logger.debug(`Broadcasting message to ${activeClients.length} clients:`, message.type);

    activeClients.forEach(([clientId, client]) => {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Error broadcasting to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    });
  }

  public broadcastPriceUpdate(priceData: FXPrice) {
    this.broadcast({
      type: 'PRICE_UPDATE',
      data: priceData,
      timestamp: new Date()
    });
  }

  public broadcastTORBSignal(signal: TORBSignal) {
    this.broadcast({
      type: 'TORB_SIGNAL',
      data: signal,
      timestamp: new Date()
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public getClientsList(): { id: string; connected: Date; isAlive: boolean }[] {
    return Array.from(this.clients.entries()).map(([id, client]) => ({
      id,
      connected: client.lastPing,
      isAlive: client.isAlive
    }));
  }

  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });

    this.clients.clear();
    logger.info('WebSocket service closed');
  }
}

let wsService: WebSocketService;

export const setupWebSocket = (wss: WebSocketServer) => {
  wsService = new WebSocketService(wss);
  logger.info('WebSocket service initialized');
};

export const getWebSocketService = (): WebSocketService => {
  if (!wsService) {
    throw new Error('WebSocket service not initialized');
  }
  return wsService;
};
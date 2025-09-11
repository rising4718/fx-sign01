import { logger } from '../utils/logger';

export interface WSMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export interface FXPrice {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: Date;
  source: string;
}

export interface TORBSignal {
  symbol: string;
  signal: 'BUY' | 'SELL';
  confidence: number;
  timestamp: Date;
}

type MessageHandler = (data: any) => void;

/**
 * Phase3: WebSocketクライアントサービス
 * - リアルタイム価格データ受信
 * - TORBシグナル受信
 * - 接続状態管理
 * - 自動再接続
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageHandlers = new Map<string, MessageHandler[]>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 環境に応じてWebSocketサーバーURLを設定
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.MODE === 'development' 
      ? 'localhost:3002' 
      : window.location.host;
    this.url = `${protocol}//${host}`;
    
    logger.info(`🔌 [WS Client] Initializing WebSocket connection to ${this.url}`);
  }

  /**
   * WebSocket接続開始
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        logger.debug('🔌 [WS Client] Already connected');
        resolve();
        return;
      }

      if (this.isConnecting) {
        logger.debug('🔌 [WS Client] Connection already in progress');
        return;
      }

      this.isConnecting = true;
      logger.info(`🔌 [WS Client] Connecting to ${this.url}...`);

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          logger.info('✅ [WS Client] Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          logger.warn(`⚠️ [WS Client] Connection closed:`, {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnecting = false;
          this.stopHeartbeat();
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error('❌ [WS Client] Connection error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        logger.error('❌ [WS Client] Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * WebSocket接続終了
   */
  public disconnect(): void {
    logger.info('⏹️ [WS Client] Disconnecting...');
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * 価格データ購読
   */
  public subscribeToPrices(symbol: string = 'USD/JPY'): void {
    this.sendMessage({
      type: 'SUBSCRIBE_PRICE',
      data: { symbol },
      timestamp: new Date()
    });
  }

  /**
   * TORBシグナル購読
   */
  public subscribeToSignals(symbol: string = 'USD/JPY'): void {
    this.sendMessage({
      type: 'SUBSCRIBE_SIGNALS', 
      data: { symbol },
      timestamp: new Date()
    });
  }

  /**
   * メッセージハンドラー登録
   */
  public onMessage(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * メッセージハンドラー削除
   */
  public offMessage(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 接続状態取得
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 接続状態詳細取得
   */
  public getConnectionState(): {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
    url: string;
  } {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      url: this.url
    };
  }

  /**
   * メッセージ送信
   */
  private sendMessage(message: WSMessage): void {
    if (!this.isConnected()) {
      logger.warn('⚠️ [WS Client] Cannot send message - not connected');
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
      logger.debug(`📤 [WS Client] Message sent:`, message.type);
    } catch (error) {
      logger.error('❌ [WS Client] Failed to send message:', error);
    }
  }

  /**
   * 受信メッセージ処理
   */
  private handleMessage(data: string): void {
    try {
      const message: WSMessage = JSON.parse(data);
      logger.debug(`📥 [WS Client] Message received:`, message.type);

      // 接続確認メッセージ
      if (message.type === 'CONNECTION_STATUS') {
        logger.info(`✅ [WS Client] Connection status:`, message.data);
        return;
      }

      // PONG応答
      if (message.type === 'PONG') {
        logger.debug('🏓 [WS Client] Pong received');
        return;
      }

      // 購読確認
      if (message.type === 'SUBSCRIPTION_CONFIRMED') {
        logger.info(`✅ [WS Client] Subscription confirmed:`, message.data);
        return;
      }

      // 登録されたハンドラーに通知
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            logger.error(`❌ [WS Client] Handler error for ${message.type}:`, error);
          }
        });
      } else {
        logger.debug(`🤷 [WS Client] No handlers for message type: ${message.type}`);
      }

    } catch (error) {
      logger.error('❌ [WS Client] Failed to parse message:', error);
    }
  }

  /**
   * ハートビート開始
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: 'PING',
          data: { timestamp: new Date() },
          timestamp: new Date()
        });
      }
    }, 30000); // 30秒間隔
  }

  /**
   * ハートビート停止
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 再接続スケジュール
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`🔄 [WS Client] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch((error) => {
          logger.error(`❌ [WS Client] Reconnect attempt ${this.reconnectAttempts} failed:`, error);
        });
      } else {
        logger.error('❌ [WS Client] Max reconnect attempts reached. Giving up.');
      }
    }, delay);
  }
}

// シングルトンインスタンス
let wsService: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!wsService) {
    wsService = new WebSocketService();
  }
  return wsService;
};

export const initializeWebSocket = async (): Promise<WebSocketService> => {
  const service = getWebSocketService();
  await service.connect();
  return service;
};
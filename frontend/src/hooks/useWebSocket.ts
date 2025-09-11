import { useState, useEffect, useCallback, useRef } from 'react';
import { getWebSocketService, FXPrice, TORBSignal, WebSocketService } from '../services/websocketService';
import { logger } from '../utils/logger';

export interface WebSocketConnectionState {
  connected: boolean;
  connecting: boolean;
  reconnectAttempts: number;
  url: string;
}

export interface UseWebSocketReturn {
  connectionState: WebSocketConnectionState;
  latestPrice: FXPrice | null;
  latestSignal: TORBSignal | null;
  priceHistory: FXPrice[];
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToPrices: (symbol?: string) => void;
  subscribeToSignals: (symbol?: string) => void;
}

/**
 * Phase3: WebSocket接続・データ受信フック
 * - リアルタイム価格データ管理
 * - TORBシグナル管理
 * - 接続状態管理
 * - 価格履歴保持
 */
export const useWebSocket = (autoConnect: boolean = true): UseWebSocketReturn => {
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
    url: ''
  });

  const [latestPrice, setLatestPrice] = useState<FXPrice | null>(null);
  const [latestSignal, setLatestSignal] = useState<TORBSignal | null>(null);
  const [priceHistory, setPriceHistory] = useState<FXPrice[]>([]);

  const wsServiceRef = useRef<WebSocketService | null>(null);

  // 価格データハンドラー
  const handlePriceUpdate = useCallback((priceData: FXPrice) => {
    logger.debug('📊 [useWebSocket] Price update received:', priceData);
    
    setLatestPrice(priceData);
    
    // 価格履歴更新（最大100件保持）
    setPriceHistory(prev => {
      const newHistory = [priceData, ...prev];
      return newHistory.slice(0, 100);
    });
  }, []);

  // TORBシグナルハンドラー
  const handleTORBSignal = useCallback((signalData: TORBSignal) => {
    logger.info('🚨 [useWebSocket] TORB signal received:', signalData);
    setLatestSignal(signalData);
  }, []);

  // 接続状態更新
  const updateConnectionState = useCallback(() => {
    if (wsServiceRef.current) {
      const state = wsServiceRef.current.getConnectionState();
      setConnectionState(state);
    }
  }, []);

  // 接続処理
  const connect = useCallback(async () => {
    try {
      if (!wsServiceRef.current) {
        wsServiceRef.current = getWebSocketService();
      }

      setConnectionState(prev => ({ ...prev, connecting: true }));
      
      await wsServiceRef.current.connect();
      
      // メッセージハンドラー登録
      wsServiceRef.current.onMessage('PRICE_UPDATE', handlePriceUpdate);
      wsServiceRef.current.onMessage('TORB_SIGNAL', handleTORBSignal);
      
      updateConnectionState();
      
      logger.info('✅ [useWebSocket] WebSocket connected and handlers registered');
    } catch (error) {
      logger.error('❌ [useWebSocket] Failed to connect:', error);
      updateConnectionState();
    }
  }, [handlePriceUpdate, handleTORBSignal, updateConnectionState]);

  // 切断処理
  const disconnect = useCallback(() => {
    if (wsServiceRef.current) {
      // ハンドラー削除
      wsServiceRef.current.offMessage('PRICE_UPDATE', handlePriceUpdate);
      wsServiceRef.current.offMessage('TORB_SIGNAL', handleTORBSignal);
      
      wsServiceRef.current.disconnect();
      updateConnectionState();
      
      logger.info('⏹️ [useWebSocket] WebSocket disconnected');
    }
  }, [handlePriceUpdate, handleTORBSignal, updateConnectionState]);

  // 価格購読
  const subscribeToPrices = useCallback((symbol: string = 'USD/JPY') => {
    if (wsServiceRef.current && wsServiceRef.current.isConnected()) {
      wsServiceRef.current.subscribeToPrices(symbol);
      logger.info(`📊 [useWebSocket] Subscribed to prices for ${symbol}`);
    } else {
      logger.warn('⚠️ [useWebSocket] Cannot subscribe to prices - not connected');
    }
  }, []);

  // シグナル購読
  const subscribeToSignals = useCallback((symbol: string = 'USD/JPY') => {
    if (wsServiceRef.current && wsServiceRef.current.isConnected()) {
      wsServiceRef.current.subscribeToSignals(symbol);
      logger.info(`🚨 [useWebSocket] Subscribed to signals for ${symbol}`);
    } else {
      logger.warn('⚠️ [useWebSocket] Cannot subscribe to signals - not connected');
    }
  }, []);

  // 初期化・クリーンアップ
  useEffect(() => {
    if (autoConnect) {
      connect().catch((error) => {
        logger.error('❌ [useWebSocket] Auto-connect failed:', error);
      });
    }

    // 定期的な接続状態更新
    const statusInterval = setInterval(updateConnectionState, 5000);

    return () => {
      clearInterval(statusInterval);
      disconnect();
    };
  }, [autoConnect, connect, disconnect, updateConnectionState]);

  return {
    connectionState,
    latestPrice,
    latestSignal,
    priceHistory,
    connect,
    disconnect,
    subscribeToPrices,
    subscribeToSignals
  };
};
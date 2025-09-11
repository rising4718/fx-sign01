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

  // 初期化・クリーンアップ（依存関係最適化）
  useEffect(() => {
    // React StrictModeでの二重実行を防ぐ
    if (!autoConnect) return;

    let mounted = true;
    let statusInterval: number | null = null;
    let connectionInitialized = false;

    const initConnection = async () => {
      if (!mounted || connectionInitialized) return;
      
      // 接続初期化フラグを立てる
      connectionInitialized = true;

      try {
        if (!wsServiceRef.current) {
          wsServiceRef.current = getWebSocketService();
        }

        // 既に接続している場合はスキップ
        if (wsServiceRef.current.isConnected()) {
          const state = wsServiceRef.current.getConnectionState();
          setConnectionState(state);
          
          // ハンドラーが未登録の場合のみ登録
          wsServiceRef.current.onMessage('PRICE_UPDATE', handlePriceUpdate);
          wsServiceRef.current.onMessage('TORB_SIGNAL', handleTORBSignal);
          return;
        }

        setConnectionState(prev => ({ ...prev, connecting: true }));
        
        await wsServiceRef.current.connect();
        
        if (!mounted) return;

        // メッセージハンドラー登録
        wsServiceRef.current.onMessage('PRICE_UPDATE', handlePriceUpdate);
        wsServiceRef.current.onMessage('TORB_SIGNAL', handleTORBSignal);
        
        // 接続状態更新
        if (wsServiceRef.current) {
          const state = wsServiceRef.current.getConnectionState();
          setConnectionState(state);
        }
        
        logger.info('✅ [useWebSocket] WebSocket connected and handlers registered');

        // 定期的な接続状態更新を開始
        statusInterval = window.setInterval(() => {
          if (mounted && wsServiceRef.current) {
            const state = wsServiceRef.current.getConnectionState();
            setConnectionState(state);
          }
        }, 5000);

      } catch (error) {
        if (mounted) {
          logger.error('❌ [useWebSocket] Auto-connect failed:', error);
          if (wsServiceRef.current) {
            const state = wsServiceRef.current.getConnectionState();
            setConnectionState(state);
          }
        }
        // エラー時は初期化フラグをリセット
        connectionInitialized = false;
      }
    };

    // 少し遅延させて実行（React StrictModeの二重実行対策）
    const timeoutId = setTimeout(initConnection, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      
      if (statusInterval) {
        clearInterval(statusInterval);
      }
      
      // クリーンアップ時はハンドラーのみ削除、接続は維持
      if (wsServiceRef.current && import.meta.env.MODE !== 'development') {
        // 本番環境でのみ切断
        wsServiceRef.current.offMessage('PRICE_UPDATE', handlePriceUpdate);
        wsServiceRef.current.offMessage('TORB_SIGNAL', handleTORBSignal);
        wsServiceRef.current.disconnect();
        logger.info('⏹️ [useWebSocket] WebSocket disconnected in cleanup');
      }
    };
  }, [autoConnect]); // 依存関係を autoConnect のみに限定

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
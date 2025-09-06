import { WebSocketServer } from 'ws';
import { WSMessage, FXPrice, TORBSignal } from '../types';
declare class WebSocketService {
    private wss;
    private clients;
    private heartbeatInterval;
    constructor(wss: WebSocketServer);
    private setupWebSocketServer;
    private handleClientMessage;
    private handlePriceSubscription;
    private handleSignalSubscription;
    private startHeartbeat;
    sendToClient(clientId: string, message: WSMessage): void;
    broadcast(message: WSMessage): void;
    broadcastPriceUpdate(priceData: FXPrice): void;
    broadcastTORBSignal(signal: TORBSignal): void;
    getConnectedClientsCount(): number;
    getClientsList(): {
        id: string;
        connected: Date;
        isAlive: boolean;
    }[];
    close(): void;
}
export declare const setupWebSocket: (wss: WebSocketServer) => void;
export declare const getWebSocketService: () => WebSocketService;
export {};
//# sourceMappingURL=websocketService.d.ts.map
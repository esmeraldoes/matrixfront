// src/services/websocket.ts
import { v4 as uuidv4 } from 'uuid';

export interface WebSocketMessage {
  type: string;
  data: any;
  id?: string;
  timestamp: number;
}

interface PendingMessage {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timeout: NodeJS.Timeout;
}


export abstract class EnhancedWebSocketService {
  protected ws: WebSocket | null = null;
  protected reconnectAttempts = 0;
  protected maxReconnectAttempts = 10;
  protected baseReconnectInterval = 3000;
  protected messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  protected pendingMessages: Map<string, PendingMessage> = new Map();
  protected heartbeatInterval: number | null = null;
  protected connectionTimeout: number | null = null;
  protected isExplicitlyClosed = false;
  protected messageQueue: WebSocketMessage[] = [];
  protected connectionMetrics = {
    totalMessages: 0,
    failedMessages: 0,
    avgLatency: 0,
    lastLatency: 0
  };

  public isConnected = false;

  constructor(
    protected url: string,
    public onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void,
    protected messageTimeout = 10000,
    protected heartbeatIntervalMs = 30000
  ) {}

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isExplicitlyClosed = false;
      this.onStatusChange?.('connecting');
      
      // Set connection timeout
      this.connectionTimeout = window.setTimeout(() => {
        if (!this.isConnected) {
          this.handleConnectionFailure('Connection timeout', reject);
        }
      }, 10000);

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.handleConnectionSuccess(resolve);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          this.handleDisconnection(event, reject);
        };

        this.ws.onerror = (error) => {
          this.handleError(error, reject);
        };
      } catch (error) {
        this.handleConnectionFailure('Connection error', reject, error);
      }
    });
  }

  protected handleConnectionSuccess(resolve: () => void): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    console.log('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.onStatusChange?.('connected');
    this.startHeartbeat();
    this.flushMessageQueue();
    resolve();
  }

  protected handleConnectionFailure(reason: string, reject: (reason: any) => void, error?: any): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    console.error(`${reason}:`, error);
    this.isConnected = false;
    this.onStatusChange?.('disconnected');
    this.handleReconnection();
    reject(new Error(reason));
  }

  protected handleDisconnection(event: CloseEvent, reject: (reason: any) => void): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.isConnected = false;
    this.onStatusChange?.('disconnected');
    this.stopHeartbeat();
    
    if (!this.isExplicitlyClosed) {
      this.handleReconnection();
    }
    
    // Reject all pending messages
    this.pendingMessages.forEach((pending, _id) => {
      pending.reject(new Error(`Connection closed: ${event.reason || 'Unknown reason'}`));
      clearTimeout(pending.timeout);
    });
    this.pendingMessages.clear();
    
    reject(new Error('WebSocket connection closed'));
  }

  protected handleError(error: Event, reject: (reason: any) => void): void {
    console.error('WebSocket error:', error);
    reject(error);
  }

  protected handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isExplicitlyClosed) {
      const baseDelay = Math.min(
        this.baseReconnectInterval * Math.pow(1.5, this.reconnectAttempts),
        30000 // Max 30 seconds
      );
      const jitter = Math.random() * 1000; // Add jitter
      const delay = baseDelay + jitter;
      
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect().catch(console.error);
      }, delay);
    }
  }

  protected handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      const receivedAt = Date.now();

      // Handle connection restoration
      if (message.type === 'reconnect') {
        this.handleReconnection();
        return;
      }
      
      
      // Calculate latency for response messages
      if (message.id && this.pendingMessages.has(message.id)) {
        this.connectionMetrics.lastLatency = receivedAt - message.timestamp;
        this.connectionMetrics.avgLatency = 
          (this.connectionMetrics.avgLatency * this.connectionMetrics.totalMessages + this.connectionMetrics.lastLatency) / 
          (this.connectionMetrics.totalMessages + 1);
      }
      
      this.connectionMetrics.totalMessages++;
      
      // Handle response messages
      if (message.id && this.pendingMessages.has(message.id)) {
        const { resolve, timeout } = this.pendingMessages.get(message.id)!;
        clearTimeout(timeout);
        resolve(message.data);
        this.pendingMessages.delete(message.id);
      }

       let handlerData = message.data;
      if (handlerData === undefined) {
        const { id, timestamp, ...rest } = message;
        handlerData = rest;
      }
      
      // Dispatch to handlers
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => handler(message.data));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
      this.connectionMetrics.failedMessages++;
    }
  }

  protected startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage('ping', {}).catch(() => {
          console.warn('Heartbeat failed, reconnecting...');
          this.handleReconnection();
        });
      }
    }, this.heartbeatIntervalMs);
  }

  protected stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  protected flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()!;
      this.ws!.send(JSON.stringify(message));
    }
  }

  public async sendMessage(type: string, data: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        // Queue message if not connected
        const messageId = uuidv4();
        const message: WebSocketMessage = {
          type,
          data,
          id: messageId,
          timestamp: Date.now()
        };
        
        this.messageQueue.push(message);
        reject(new Error('WebSocket is not connected, message queued'));
        return;
      }

      const messageId = uuidv4();
      const message: WebSocketMessage = {
        type,
        data,
        id: messageId,
        timestamp: Date.now()
      };

      const timeout = setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error(`Timeout waiting for response to ${type}`));
        }
      }, this.messageTimeout);

      this.pendingMessages.set(messageId, { resolve, reject, timeout });

      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.pendingMessages.delete(messageId);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  public onMessage(type: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
    
    // Return unsubscribe function
    return () => this.offMessage(type, handler);
  }

  public offMessage(type: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      this.messageHandlers.set(type, handlers.filter(h => h !== handler));
    }
  }

  

  public getMetrics() {
    return { ...this.connectionMetrics };
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.pendingMessages.clear();
  }
}

/**
 * Trading WebSocket Service
 */
export class TradingWebSocketService extends EnhancedWebSocketService {
  private subscriptions: Set<string> = new Set();

  constructor(
    accountId: string,
    token: string,
    onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void
  ) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/trading/accounts/${accountId}/updates/?token=${token}`;
    
    super(wsUrl, onStatusChange);
  }

  public subscribe(channels: string[]): void {
    channels.forEach(channel => this.subscriptions.add(channel));
    
    if (this.isConnected) {
      this.sendMessage('subscribe', { channels }).catch(error => {
        console.error('Failed to subscribe:', error);
      });
    }
  }

  public unsubscribe(channels: string[]): void {
    channels.forEach(channel => this.subscriptions.delete(channel));
    
    if (this.isConnected) {
      this.sendMessage('unsubscribe', { channels }).catch(error => {
        console.error('Failed to unsubscribe:', error);
      });
    }
  }

  protected handleConnectionSuccess(resolve: () => void): void {
    super.handleConnectionSuccess(resolve);
    this.resubscribe();
  }

  private resubscribe(): void {
    if (this.subscriptions.size > 0) {
      this.subscribe(Array.from(this.subscriptions));
    }
  }
}

/**
 * Market Data WebSocket Service
 */
export class MarketDataWebSocketService extends EnhancedWebSocketService {
  private subscriptions: Map<string, Set<string>> = new Map(); // symbol -> dataTypes

  constructor(
    onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void
  ) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/market-data/`;
    
    super(wsUrl, onStatusChange);
  }

  public subscribe(symbol: string, dataType: 'quotes' | 'trades' | 'bars' | 'orderbook'): void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol)!.add(dataType);
    
    if (this.isConnected) {
      this.sendSubscriptionMessage('subscribe', symbol, dataType);
    }
  }

  public unsubscribe(symbol: string, dataType: 'quotes' | 'trades' | 'bars' | 'orderbook'): void {
    if (this.subscriptions.has(symbol)) {
      const dataTypes = this.subscriptions.get(symbol)!;
      dataTypes.delete(dataType);
      
      if (dataTypes.size === 0) {
        this.subscriptions.delete(symbol);
      }
      
      if (this.isConnected) {
        this.sendSubscriptionMessage('unsubscribe', symbol, dataType);
      }
    }
  }

  private sendSubscriptionMessage(action: 'subscribe' | 'unsubscribe', symbol: string, dataType: string): void {
    this.sendMessage(action, {
      symbols: [symbol],
      data_type: dataType
    }).catch(error => {
      console.error(`Failed to ${action}:`, error);
    });
  }

  protected handleConnectionSuccess(resolve: () => void): void {
    super.handleConnectionSuccess(resolve);
    this.resubscribe();
  }

  private resubscribe(): void {
    this.subscriptions.forEach((dataTypes, symbol) => {
      dataTypes.forEach(dataType => {
        this.sendSubscriptionMessage('subscribe', symbol, dataType);
      });
    });
  }
}


















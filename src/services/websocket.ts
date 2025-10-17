// src/services/websocket.ts
import { v4 as uuidv4 } from 'uuid';
import { useTradingStore } from '@/store/tradingStore';

export interface WebSocketMessage {
  data: any;
  type: string;
  data_type: any;
  id?: string;
  timestamp: number;
}

export class MarketDataWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 3000;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private subscriptions: Map<string, Set<'quotes' | 'trades' | 'bars' | 'orderbook'>> = new Map();
  public isConnected = false;
  private currentSymbol: string | null = null;

  constructor(
    public onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void
  ) {}

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isConnected = false;
      this.onStatusChange?.('connecting');

      const wsUrl = "ws://localhost:8000/ws/market-data/";

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onStatusChange?.('connected');

          this.resubscribe();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing Market Data WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.onStatusChange?.('disconnected');
          this.handleReconnection();
        };

        this.ws.onerror = (error) => {
          console.error('Market Data WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  public switchSymbol(newSymbol: string): void {
    console.log(`🔄 Switching symbol from ${this.currentSymbol} to ${newSymbol}`);
    
    if (this.currentSymbol) {
      this.unsubscribe(this.currentSymbol, 'bars');
      this.unsubscribe(this.currentSymbol, 'quotes');
      this.unsubscribe(this.currentSymbol, 'trades');
    }
    
    this.currentSymbol = newSymbol;
    this.subscribe(newSymbol, 'bars');
    this.subscribe(newSymbol, 'quotes');
    this.subscribe(newSymbol, 'trades');
    
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const baseDelay = Math.min(
        this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
        30000
      );
      const jitter = Math.random() * 1000;
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(console.error);
      }, baseDelay + jitter);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    
    if (message.type === 'market_data') {
      const dataType = message.data_type;
      const marketData = message.data;
      
      if (dataType === 'bars') {
        const d = marketData;
        console.log(`📊 REAL-TIME BAR - ${d.symbol} - O:${d.open} H:${d.high} L:${d.low} C:${d.close} V:${d.volume} T:${new Date(d.timestamp).toLocaleTimeString()}`);
      } else if (dataType === 'quotes') {
        const d = marketData;
        console.log(`💬 REAL-TIME QUOTE - ${d.symbol} - Bid:${d.bid_price} Ask:${d.ask_price}`);
      } else if (dataType === 'trades') {
        const d = marketData;
        console.log(`💰 REAL-TIME TRADE - ${d.symbol} - Price:${d.price} Size:${d.size}`);
      }
      
      // Get the store to update real-time data
      const store = useTradingStore.getState();
      
      if (dataType === 'bars') {
        // Update bars in store for real-time candle formation
        console.log('🔄 Calling store.updateBars with:', marketData);
        store.updateBars(marketData.symbol, marketData);
      } else if (dataType === 'quotes') {
        // Update quotes in store
        store.updateQuote(marketData.symbol, marketData);
      } else if (dataType === 'trades') {
        // Update trades in store
        store.updateTrades(marketData.symbol, marketData);
      }
      
      // Call registered handlers
      const handlers = this.messageHandlers.get(dataType);
      if (handlers) {
        console.log(`📢 Calling ${handlers.length} handlers for ${dataType}`);
        handlers.forEach(h => h(marketData));
      }
    }

    const typeHandlers = this.messageHandlers.get(message.type);
    if (typeHandlers) typeHandlers.forEach(h => h(message.data ?? message));

    const wildcardHandlers = this.messageHandlers.get('*');
    if (wildcardHandlers) wildcardHandlers.forEach(h => h(message));
  }

  private resubscribe() {
    this.subscriptions.forEach((dataTypes, symbol) => {
      this.sendSubscriptionMessage('subscribe', symbol, Array.from(dataTypes));
    });
  }

  public onMessage(type: string | "*", handler: (data: any) => void): () => void {
    const key = type === "*" ? "*" : type;
    if (!this.messageHandlers.has(key)) this.messageHandlers.set(key, []);
    this.messageHandlers.get(key)!.push(handler);
    
    console.log(`✅ Registered handler for ${key}, total handlers: ${this.messageHandlers.get(key)!.length}`);
    
    return () => {
      const handlers = this.messageHandlers.get(key);
      if (handlers) this.messageHandlers.set(key, handlers.filter(h => h !== handler));
    };
  }

  public offMessage(type: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) this.messageHandlers.set(type, handlers.filter(h => h !== handler));
  }

  public subscribe(symbol: string, dataType: 'quotes' | 'trades' | 'bars'): void {
    if (!this.subscriptions.has(symbol)) this.subscriptions.set(symbol, new Set());
    const dataTypes = this.subscriptions.get(symbol)!;
    dataTypes.add(dataType);

    if (this.isConnected) {
      console.log(`📡 Subscribing to ${symbol} for ${dataType}`);
      this.sendSubscriptionMessage('subscribe', symbol, [dataType]);
    }
  }

  public unsubscribe(symbol: string, dataType: 'quotes' | 'trades' | 'bars' | 'orderbook'): void {
    if (this.subscriptions.has(symbol)) {
      const dataTypes = this.subscriptions.get(symbol)!;
      dataTypes.delete(dataType);
      if (dataTypes.size === 0) this.subscriptions.delete(symbol);
    }

    if (this.isConnected) {
      console.log(`📡 Unsubscribing from ${symbol} for ${dataType}`);
      this.sendSubscriptionMessage('unsubscribe', symbol, [dataType]);
    }
  }

  private sendSubscriptionMessage(action: 'subscribe' | 'unsubscribe', symbol: string, dataTypes: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        action,
        symbols: [symbol],
        data_types: dataTypes
      };
      console.log('📤 Sending subscription message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not open, cannot send subscription');
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.messageHandlers.clear();
  }

  public getCurrentSymbol(): string | null {
    return this.currentSymbol;
  }
}



export class TradingWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 3000;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private pendingMessages: Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }> = new Map();
  public isConnected = false;
  private heartbeatInterval: number | null = null;
  private subscriptions: Set<string> = new Set();

  constructor(
    private accountId: string,
    private token: string,
    public onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void
  ) {}

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.onStatusChange?.('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/trading/accounts/${this.accountId}/updates/?token=${this.token}`;
      
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onStatusChange?.('connected');
          this.startHeartbeat();
          this.resubscribe();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing Trading WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.onStatusChange?.('disconnected');
          this.stopHeartbeat();
          this.handleReconnection();
        };

        this.ws.onerror = (error) => {
          console.error('Trading WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const baseDelay = Math.min(
        this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
        30000 
      );
      const jitter = Math.random() * 1000;
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(console.error);
      }, baseDelay + jitter);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.id && this.pendingMessages.has(message.id)) {
      const { resolve } = this.pendingMessages.get(message.id)!;
      resolve(message.data);
      this.pendingMessages.delete(message.id);
    }

    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }



  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage('ping', {});
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private resubscribe() {
    if (this.subscriptions.size > 0) {
      this.subscribe(Array.from(this.subscriptions));
    }
  }

  public async sendMessage(type: string, data: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const messageId = uuidv4();
      const message: WebSocketMessage = {
        type,
        data,
        id: messageId,
        timestamp: Date.now(),
        data_type: undefined
      };

      this.pendingMessages.set(messageId, { resolve, reject });

      try {
        this.ws.send(JSON.stringify(message));
        
        setTimeout(() => {
          if (this.pendingMessages.has(messageId)) {
            this.pendingMessages.delete(messageId);
            reject(new Error(`Timeout waiting for response to ${type}`));
          }
        }, 10000);
      } catch (error) {
        this.pendingMessages.delete(messageId);
        reject(error);
      }
    });
  }

  // public onMessage(type: string, handler: (data: any) => void): void {
  //   if (!this.messageHandlers.has(type)) {
  //     this.messageHandlers.set(type, []);
  //   }
  //   this.messageHandlers.get(type)!.push(handler);
  // }


    public onMessage(type: string | "*", handler: (data: any) => void): () => void {
    const key = type === "*" ? "*" : type;

    if (!this.messageHandlers.has(key)) {
      this.messageHandlers.set(key, []);
    }
    this.messageHandlers.get(key)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(key);
      if (handlers) {
        this.messageHandlers.set(key, handlers.filter(h => h !== handler));
      }
    };
  }






  public offMessage(type: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      this.messageHandlers.set(type, handlers.filter(h => h !== handler));
    }
  }

  public subscribe(channels: string[]): void {
    channels.forEach(channel => this.subscriptions.add(channel));
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        channels
      }));
    }
  }

  public unsubscribe(channels: string[]): void {
    channels.forEach(channel => this.subscriptions.delete(channel));
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        channels
      }));
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.pendingMessages.clear();
  }
}




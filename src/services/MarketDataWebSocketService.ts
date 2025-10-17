// src/services/websocket/FixedMarketDataWebSocketService.ts
export interface WebSocketMessage {
  data: any;
  type: string;
  data_type: any;
  id?: string;
  timestamp: number;
}

export class FixedMarketDataWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectInterval = 1000;
  private isIntentionalClose = false;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private subscriptions: Map<string, Set<'quotes' | 'trades' | 'bars' | 'orderbook'>> = new Map();
  public isConnected = false;
  private currentSymbol: string | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(
    public onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void
  ) {}

  public async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isIntentionalClose = false;
      this.onStatusChange?.('connecting');

      const wsUrl = "ws://localhost:8000/ws/market-data/";

      try {
        this.ws = new WebSocket(wsUrl);

        const connectTimeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
          this.handleReconnection();
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
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
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.onStatusChange?.('disconnected');
          
          if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.handleReconnection();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          this.isConnected = false;
          this.onStatusChange?.('disconnected');
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnection() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(this.baseReconnectInterval * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        console.error('Reconnection attempt failed:', error);
      });
    }, delay);
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.type === 'market_data') {
      const dataType = message.data_type;
      const marketData = message.data;
      
      const handlers = this.messageHandlers.get(dataType);
      if (handlers) {
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
    
    return () => {
      const handlers = this.messageHandlers.get(key);
      if (handlers) this.messageHandlers.set(key, handlers.filter(h => h !== handler));
    };
  }

  public subscribe(symbol: string, dataType: 'quotes' | 'trades' | 'bars'): void {
    if (!this.subscriptions.has(symbol)) this.subscriptions.set(symbol, new Set());
    const dataTypes = this.subscriptions.get(symbol)!;
    dataTypes.add(dataType);

    if (this.isConnected) {
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
      this.ws.send(JSON.stringify(message));
    }
  }

  public switchSymbol(newSymbol: string): void {
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

  public getCurrentSymbol(): string | null {
    return this.currentSymbol;
  }

  public disconnect(): void {
    this.isIntentionalClose = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.subscriptions.clear();
    this.messageHandlers.clear();
    this.reconnectAttempts = 0;
    this.currentSymbol = null;
  }
}

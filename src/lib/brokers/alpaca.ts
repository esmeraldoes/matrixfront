import { BrokerConfig, AlpacaApi, TradeUpdate, QuoteUpdate, BrokerType } from './types';

class PaperTradingBroker implements AlpacaApi {
  private connected: boolean = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getAccountBalance(): Promise<number> {
    return 100000; // Mock paper trading balance
  }

  async placeMarketOrder(
    symbol: string,
    quantity: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<string> {
    return `paper-order-${Date.now()}`;
  }

  async closePosition(positionId: string): Promise<boolean> {
    return true;
  }

  async subscribeToTrades(
    symbol: string,
    callback: (trade: TradeUpdate) => void
  ): Promise<void> {
    // Mock trade updates
    setInterval(() => {
      callback({
        symbol,
        price: Math.random() * 100,
        size: Math.floor(Math.random() * 100),
        timestamp: new Date(),
      });
    }, 5000);
  }

  async subscribeToQuotes(
    symbol: string,
    callback: (quote: QuoteUpdate) => void
  ): Promise<void> {
    // Mock quote updates
    setInterval(() => {
      const basePrice = Math.random() * 100;
      callback({
        symbol,
        bidPrice: basePrice - 0.01,
        askPrice: basePrice + 0.01,
        bidSize: Math.floor(Math.random() * 100),
        askSize: Math.floor(Math.random() * 100),
        timestamp: new Date(),
      });
    }, 5000);
  }
}

export class AlpacaBroker implements AlpacaApi {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;

  constructor(config: BrokerConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    // Use paper trading by default
    this.baseUrl = 'https://paper-api.alpaca.markets';
    this.wsUrl = 'wss://paper-api.alpaca.markets/stream';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'APCA-API-KEY-ID': this.apiKey,
        'APCA-API-SECRET-KEY': this.secretKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({
          action: 'authenticate',
          data: {
            key_id: this.apiKey,
            secret_key: this.secretKey,
          },
        }));
        resolve();
      };

      this.ws.onerror = (error) => {
        reject(error);
      };

      this.ws.onclose = () => {
        setTimeout(() => this.connect(), 5000); // Reconnect after 5 seconds
      };
    });
  }

  async disconnect(): Promise<void> {
    this.ws?.close();
  }

  async getAccountBalance(): Promise<number> {
    const account = await this.makeRequest('/v2/account');
    return parseFloat(account.equity);
  }

  async placeMarketOrder(
    symbol: string,
    quantity: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<string> {
    // Place the main market order
    const order = await this.makeRequest('/v2/orders', {
      method: 'POST',
      body: JSON.stringify({
        symbol,
        qty: Math.abs(quantity),
        side: quantity > 0 ? 'buy' : 'sell',
        type: 'market',
        time_in_force: 'gtc',
      }),
    });

    // If stop loss is specified, create a stop loss order
    if (stopLoss) {
      await this.makeRequest('/v2/orders', {
        method: 'POST',
        body: JSON.stringify({
          symbol,
          qty: Math.abs(quantity),
          side: quantity > 0 ? 'sell' : 'buy',
          type: 'stop',
          time_in_force: 'gtc',
          stop_price: stopLoss,
        }),
      });
    }

    // If take profit is specified, create a take profit order
    if (takeProfit) {
      await this.makeRequest('/v2/orders', {
        method: 'POST',
        body: JSON.stringify({
          symbol,
          qty: Math.abs(quantity),
          side: quantity > 0 ? 'sell' : 'buy',
          type: 'limit',
          time_in_force: 'gtc',
          limit_price: takeProfit,
        }),
      });
    }

    return order.id;
  }

  async closePosition(positionId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/v2/positions/${positionId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error closing position:', error);
      return false;
    }
  }

  async subscribeToTrades(
    symbol: string,
    callback: (trade: TradeUpdate) => void
  ): Promise<void> {
    if (!this.ws) throw new Error('WebSocket not connected');

    this.ws.send(JSON.stringify({
      action: 'subscribe',
      data: {
        trades: [symbol],
      },
    }));

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.stream === 'trade_updates') {
        callback({
          symbol: data.data.symbol,
          price: parseFloat(data.data.price),
          size: parseInt(data.data.size),
          timestamp: new Date(data.data.timestamp),
        });
      }
    };
  }

  async subscribeToQuotes(
    symbol: string,
    callback: (quote: QuoteUpdate) => void
  ): Promise<void> {
    if (!this.ws) throw new Error('WebSocket not connected');

    this.ws.send(JSON.stringify({
      action: 'subscribe',
      data: {
        quotes: [symbol],
      },
    }));

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.stream === 'quote_updates') {
        callback({
          symbol: data.data.symbol,
          bidPrice: parseFloat(data.data.bid_price),
          askPrice: parseFloat(data.data.ask_price),
          bidSize: parseInt(data.data.bid_size),
          askSize: parseInt(data.data.ask_size),
          timestamp: new Date(data.data.timestamp),
        });
      }
    };
  }
}

export function createBrokerApi(
  id: string,
  type: BrokerType,
  config: BrokerConfig
): AlpacaApi {
  switch (type) {
    case 'ALPACA':
      return new AlpacaBroker(config);
    case 'PAPER':
      return new PaperTradingBroker();
    case 'INTERACTIVE':
      throw new Error('Interactive Brokers integration not yet implemented');
    default:
      throw new Error(`Unsupported broker type: ${type}`);
  }
}
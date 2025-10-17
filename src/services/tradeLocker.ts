import { create } from 'zustand';

interface TradeLockerCredentials {
  apiKey: string;
  apiSecret: string;
}

interface TradeLockerState {
  isConnected: boolean;
  credentials: TradeLockerCredentials | null;
  setCredentials: (credentials: TradeLockerCredentials) => void;
  disconnect: () => void;
}

export const useTradeLocker = create<TradeLockerState>((set) => ({
  isConnected: false,
  credentials: null,
  setCredentials: (credentials) => set({ credentials, isConnected: true }),
  disconnect: () => set({ credentials: null, isConnected: false }),
}));

class TradeLockerService {
  private static instance: TradeLockerService;
  private baseUrl = 'https://tradelocker.com/api';
  private headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  private constructor() {}

  public static getInstance(): TradeLockerService {
    if (!TradeLockerService.instance) {
      TradeLockerService.instance = new TradeLockerService();
    }
    return TradeLockerService.instance;
  }

  public async connect(credentials: TradeLockerCredentials): Promise<void> {
    try {
      this.headers['X-API-Key'] = credentials.apiKey;
      this.headers['X-API-Secret'] = credentials.apiSecret;

      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        method: 'POST',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error('Failed to connect to TradeLocker API');
      }

      useTradeLocker.getState().setCredentials(credentials);
    } catch (error) {
      console.error('TradeLocker connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (!useTradeLocker.getState().isConnected) return;

      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: this.headers,
      });

      useTradeLocker.getState().disconnect();
    } catch (error) {
      console.error('TradeLocker disconnect error:', error);
      throw error;
    }
  }

  public async getAccountInfo(): Promise<any> {
    if (!useTradeLocker.getState().isConnected) {
      throw new Error('Not connected to TradeLocker API');
    }

    const response = await fetch(`${this.baseUrl}/account`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch account information');
    }

    return response.json();
  }

  public async getPositions(): Promise<any[]> {
    if (!useTradeLocker.getState().isConnected) {
      throw new Error('Not connected to TradeLocker API');
    }

    const response = await fetch(`${this.baseUrl}/positions`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch positions');
    }

    return response.json();
  }

  public async placeOrder(order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    type: 'MARKET' | 'LIMIT';
    price?: number;
  }): Promise<any> {
    if (!useTradeLocker.getState().isConnected) {
      throw new Error('Not connected to TradeLocker API');
    }

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error('Failed to place order');
    }

    return response.json();
  }

  public async getOrders(status?: 'OPEN' | 'CLOSED' | 'CANCELLED'): Promise<any[]> {
    if (!useTradeLocker.getState().isConnected) {
      throw new Error('Not connected to TradeLocker API');
    }

    const url = status 
      ? `${this.baseUrl}/orders?status=${status}`
      : `${this.baseUrl}/orders`;

    const response = await fetch(url, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  }

  public async cancelOrder(orderId: string): Promise<void> {
    if (!useTradeLocker.getState().isConnected) {
      throw new Error('Not connected to TradeLocker API');
    }

    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }
  }
}

export const tradeLockerService = TradeLockerService.getInstance();
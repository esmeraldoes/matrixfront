import { create } from 'zustand';
import { useAuth } from '../contexts/AuthContext';

interface WebhookEndpoint {
  id: string;
  url: string;
  name: string;
  createdAt: Date;
  isActive: boolean;
  lastUsed?: Date;
  lastStatus?: 'success' | 'failed';
}

interface TradingSignal {
  ticker: string;
  action: 'BUY' | 'SELL';
  orderType: 'market' | 'limit';
  takeProfit: {
    percent: number;
  };
  stopLoss: {
    percent: number;
  };
}

interface WebhookStore {
  endpoints: WebhookEndpoint[];
  addEndpoint: (endpoint: Omit<WebhookEndpoint, 'id' | 'createdAt'>) => void;
  updateEndpoint: (id: string, updates: Partial<WebhookEndpoint>) => void;
  deleteEndpoint: (id: string) => void;
  validateSignal: (signal: any) => signal is TradingSignal;
}

export const useWebhookStore = create<WebhookStore>((set) => ({
  endpoints: [],
  addEndpoint: (endpoint) =>
    set((state) => ({
      endpoints: [
        ...state.endpoints,
        {
          ...endpoint,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        },
      ],
    })),
  updateEndpoint: (id, updates) =>
    set((state) => ({
      endpoints: state.endpoints.map((endpoint) =>
        endpoint.id === id ? { ...endpoint, ...updates } : endpoint
      ),
    })),
  deleteEndpoint: (id) =>
    set((state) => ({
      endpoints: state.endpoints.filter((endpoint) => endpoint.id !== id),
    })),
  validateSignal: (signal: any): signal is TradingSignal => {
    if (!signal || typeof signal !== 'object') return false;

    // Required fields validation
    const requiredFields = ['ticker', 'action', 'orderType', 'takeProfit', 'stopLoss'];
    if (!requiredFields.every((field) => field in signal)) return false;

    // Type validations
    if (typeof signal.ticker !== 'string' || signal.ticker.trim() === '') return false;
    if (!['BUY', 'SELL'].includes(signal.action)) return false;
    if (!['market', 'limit'].includes(signal.orderType)) return false;

    // Nested object validations
    if (
      !signal.takeProfit ||
      typeof signal.takeProfit.percent !== 'number' ||
      signal.takeProfit.percent <= 0 ||
      signal.takeProfit.percent > 100
    ) {
      return false;
    }

    if (
      !signal.stopLoss ||
      typeof signal.stopLoss.percent !== 'number' ||
      signal.stopLoss.percent <= 0 ||
      signal.stopLoss.percent > 100
    ) {
      return false;
    }

    return true;
  },
}));

export class WebhookManager {
  private static instance: WebhookManager;

  private constructor() {}

  public static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  public async validateWebhookUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Webhook validation error:', error);
      return false;
    }
  }

  public async sendSignal(signal: TradingSignal): Promise<void> {
    const { endpoints } = useWebhookStore.getState();
    const activeEndpoints = endpoints.filter((endpoint) => endpoint.isActive);

    const promises = activeEndpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signal),
        });

        useWebhookStore.getState().updateEndpoint(endpoint.id, {
          lastUsed: new Date(),
          lastStatus: response.ok ? 'success' : 'failed',
        });
      } catch (error) {
        console.error(`Error sending signal to webhook ${endpoint.url}:`, error);
        useWebhookStore.getState().updateEndpoint(endpoint.id, {
          lastUsed: new Date(),
          lastStatus: 'failed',
        });
      }
    });

    await Promise.all(promises);
  }
}

export const webhookManager = WebhookManager.getInstance();
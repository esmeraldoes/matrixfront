import { create } from 'zustand';
import Decimal from 'decimal.js';

interface TradeSignal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  type: 'MARKET';
  stopLoss: Decimal;
  takeProfit: Decimal;
  timestamp: Date;
  status: 'PENDING' | 'EXECUTED' | 'REJECTED';
  metadata?: Record<string, any>;
}

interface WebhookStore {
  signals: TradeSignal[];
  addSignal: (signal: TradeSignal) => void;
  updateSignal: (id: string, updates: Partial<TradeSignal>) => void;
}

export const useWebhookStore = create<WebhookStore>((set) => ({
  signals: [],
  addSignal: (signal) =>
    set((state) => ({
      signals: [...state.signals, signal],
    })),
  updateSignal: (id, updates) =>
    set((state) => ({
      signals: state.signals.map((signal) =>
        signal.id === id ? { ...signal, ...updates } : signal
      ),
    })),
}));

class WebhookHandler {
  private static instance: WebhookHandler;
  private validationRules: Array<(signal: TradeSignal) => boolean>;

  private constructor() {
    this.validationRules = [
      (signal) => !!signal.symbol,
      (signal) => ['BUY', 'SELL'].includes(signal.action),
      (signal) => signal.type === 'MARKET',
      (signal) => new Decimal(signal.stopLoss).isPositive(),
      (signal) => new Decimal(signal.takeProfit).isPositive(),
    ];
  }

  public static getInstance(): WebhookHandler {
    if (!WebhookHandler.instance) {
      WebhookHandler.instance = new WebhookHandler();
    }
    return WebhookHandler.instance;
  }

  public async handleWebhook(payload: any): Promise<void> {
    try {
      const signal: TradeSignal = {
        id: crypto.randomUUID(),
        symbol: payload.symbol,
        action: payload.action,
        type: 'MARKET',
        stopLoss: new Decimal(payload.stop_loss),
        takeProfit: new Decimal(payload.take_profit),
        timestamp: new Date(),
        status: 'PENDING',
        metadata: payload.metadata,
      };

      if (this.validateSignal(signal)) {
        useWebhookStore.getState().addSignal(signal);
        await this.processSignal(signal);
      } else {
        console.error('Invalid trade signal:', payload);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  private validateSignal(signal: TradeSignal): boolean {
    return this.validationRules.every((rule) => rule(signal));
  }

  private async processSignal(signal: TradeSignal): Promise<void> {
    try {
      // Here we would integrate with the broker API
      // For now, we'll just simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      useWebhookStore.getState().updateSignal(signal.id, {
        status: 'EXECUTED',
      });
    } catch (error) {
      useWebhookStore.getState().updateSignal(signal.id, {
        status: 'REJECTED',
      });
      console.error('Error processing signal:', error);
    }
  }
}

export default WebhookHandler;
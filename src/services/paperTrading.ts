import { create } from 'zustand';
import Decimal from 'decimal.js';
import { useMarketDataStore } from './marketData';

interface Portfolio {
  id: string;
  name: string;
  type: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK';
  balance: Decimal;
  createdAt: Date;
}

interface PaperPosition {
  id: string;
  symbol: string;
  entryPrice: Decimal;
  quantity: Decimal;
  stopLoss: Decimal;
  takeProfit: Decimal;
  openTime: Date;
  closeTime?: Date;
  pnl?: Decimal;
  status: 'OPEN' | 'CLOSED';
  portfolioId: string;
}

interface PaperTradingStore {
  positions: PaperPosition[];
  portfolios: Portfolio[];
  balance: Decimal;
  addPosition: (position: PaperPosition) => void;
  updatePosition: (id: string, updates: Partial<PaperPosition>) => void;
  closePosition: (id: string, closePrice: Decimal) => void;
  addPortfolio: (portfolio: Portfolio) => void;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
}

// Initialize with some example portfolios
const initialPortfolios: Portfolio[] = [
  {
    id: 'p1',
    name: 'Conservative Portfolio',
    type: 'LOW_RISK',
    balance: new Decimal(100000),
    createdAt: new Date()
  },
  {
    id: 'p2',
    name: 'Growth Portfolio',
    type: 'MEDIUM_RISK',
    balance: new Decimal(150000),
    createdAt: new Date()
  },
  {
    id: 'p3',
    name: 'Aggressive Portfolio',
    type: 'HIGH_RISK',
    balance: new Decimal(200000),
    createdAt: new Date()
  }
];

export const usePaperTradingStore = create<PaperTradingStore>((set) => ({
  positions: [],
  portfolios: initialPortfolios,
  balance: new Decimal(100000), // Starting with $100,000 paper money
  addPosition: (position) =>
    set((state) => ({
      positions: [...state.positions, position],
      balance: state.balance.minus(position.entryPrice.times(position.quantity)),
    })),
  updatePosition: (id, updates) =>
    set((state) => ({
      positions: state.positions.map((position) =>
        position.id === id ? { ...position, ...updates } : position
      ),
    })),
  closePosition: (id, closePrice) =>
    set((state) => {
      const position = state.positions.find((p) => p.id === id);
      if (!position || position.status === 'CLOSED') return state;

      const pnl = closePrice
        .minus(position.entryPrice)
        .times(position.quantity);

      return {
        positions: state.positions.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'CLOSED',
                closeTime: new Date(),
                pnl,
              }
            : p
        ),
        balance: state.balance.plus(closePrice.times(position.quantity)),
      };
    }),
  addPortfolio: (portfolio) =>
    set((state) => ({
      portfolios: [...state.portfolios, portfolio]
    })),
  updatePortfolio: (id, updates) =>
    set((state) => ({
      portfolios: state.portfolios.map((portfolio) =>
        portfolio.id === id ? { ...portfolio, ...updates } : portfolio
      )
    }))
}));

class PaperTradingService {
  private static instance: PaperTradingService;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPositionChecking();
  }

  public static getInstance(): PaperTradingService {
    if (!PaperTradingService.instance) {
      PaperTradingService.instance = new PaperTradingService();
    }
    return PaperTradingService.instance;
  }

  private startPositionChecking() {
    this.checkInterval = setInterval(() => {
      this.checkPositions();
    }, 1000);
  }

  private checkPositions() {
    const { positions } = usePaperTradingStore.getState();
    const marketData = useMarketDataStore.getState().marketData;

    positions
      .filter((position) => position.status === 'OPEN')
      .forEach((position) => {
        const currentPrice = marketData[position.symbol]?.price;
        if (!currentPrice) return;

        if (
          currentPrice.lte(position.stopLoss) ||
          currentPrice.gte(position.takeProfit)
        ) {
          usePaperTradingStore.getState().closePosition(position.id, currentPrice);
        }
      });
  }

  public createPosition(
    portfolioId: string,
    symbol: string,
    quantity: number,
    stopLoss: number,
    takeProfit: number
  ): string | null {
    try {
      const currentPrice = useMarketDataStore.getState().marketData[symbol]?.price;
      if (!currentPrice) return null;

      const position: PaperPosition = {
        id: crypto.randomUUID(),
        symbol,
        portfolioId,
        entryPrice: currentPrice,
        quantity: new Decimal(quantity),
        stopLoss: new Decimal(stopLoss),
        takeProfit: new Decimal(takeProfit),
        openTime: new Date(),
        status: 'OPEN',
      };

      usePaperTradingStore.getState().addPosition(position);
      return position.id;
    } catch (error) {
      console.error('Error creating paper position:', error);
      return null;
    }
  }

  public closePosition(id: string): boolean {
    try {
      const position = usePaperTradingStore
        .getState()
        .positions.find((p) => p.id === id);
      if (!position || position.status === 'CLOSED') return false;

      const currentPrice = useMarketDataStore
        .getState()
        .marketData[position.symbol]?.price;
      if (!currentPrice) return false;

      usePaperTradingStore.getState().closePosition(id, currentPrice);
      return true;
    } catch (error) {
      console.error('Error closing paper position:', error);
      return false;
    }
  }
}

export default PaperTradingService;
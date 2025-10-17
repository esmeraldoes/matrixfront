// src/services/calculationService.ts
import { useTradingStore } from '@/store/tradingStore';

export interface PositionCalculation {
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  currentValue: number;
}

export interface PortfolioCalculation {
  totalEquity: number;
  totalMarketValue: number;
  cashBalance: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  dailyPL: number;
  dailyPLPercent: number;
}

export class CalculationService {
  private static instance: CalculationService;
  private priceCache: Map<string, number> = new Map();
  private lastCalculationTime: number = 0;
  private calculationInterval: number = 1000; // 1 second

  public static getInstance(): CalculationService {
    if (!CalculationService.instance) {
      CalculationService.instance = new CalculationService();
    }
    return CalculationService.instance;
  }

  public updatePrice(symbol: string, price: number): void {
    this.priceCache.set(symbol, price);
    this.debouncedCalculate();
  }

  public calculatePositionValues(
    position: any, 
    currentPrice?: number
  ): PositionCalculation {
    const symbol = position.symbol;
    const quantity = parseFloat(position.qty || position.quantity);
    const avgEntryPrice = parseFloat(position.avg_entry_price);
    
    // Use provided price or cached price
    const price = currentPrice || this.priceCache.get(symbol) || parseFloat(position.current_price);
    
    const marketValue = quantity * price;
    const unrealizedPL = (price - avgEntryPrice) * quantity;
    const unrealizedPLPercent = ((price / avgEntryPrice) - 1) * 100;

    return {
      marketValue,
      unrealizedPL,
      unrealizedPLPercent,
      currentValue: price
    };
  }

  public calculatePortfolioValues(
    positions: any[],
    accountData: any
  ): PortfolioCalculation {
    const cashBalance = parseFloat(accountData?.cash || 0);
    const priorDayEquity = parseFloat(accountData?.last_equity || accountData?.equity || 0);
    
    let totalMarketValue = 0;
    let totalUnrealizedPL = 0;
    let totalCostBasis = 0;

    positions.forEach(position => {
      const calculation = this.calculatePositionValues(position);
      totalMarketValue += calculation.marketValue;
      totalUnrealizedPL += calculation.unrealizedPL;
      totalCostBasis += parseFloat(position.avg_entry_price) * parseFloat(position.qty || position.quantity);
    });

    const totalEquity = cashBalance + totalMarketValue;
    const totalUnrealizedPLPercent = (totalUnrealizedPL / totalCostBasis) * 100;
    const dailyPL = totalEquity - priorDayEquity;
    const dailyPLPercent = (dailyPL / priorDayEquity) * 100;

    return {
      totalEquity,
      totalMarketValue,
      cashBalance,
      totalUnrealizedPL,
      totalUnrealizedPLPercent,
      dailyPL,
      dailyPLPercent
    };
  }

  private debouncedCalculate = this.debounce(() => {
    this.performCalculations();
  }, 100);

  private debounce(func: Function, wait: number): Function {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  private performCalculations(): void {
    const now = Date.now();
    if (now - this.lastCalculationTime < this.calculationInterval) {
      return;
    }

    this.lastCalculationTime = now;
    
    const store = useTradingStore.getState();
    const { positions, account } = store;

    if (positions.length > 0 && account) {
      // Calculate updated positions with current prices
      const updatedPositions = positions.map(position => {
        const calculation = this.calculatePositionValues(position);
        return {
          ...position,
          market_value: calculation.marketValue.toString(),
          unrealized_pl: calculation.unrealizedPL.toString(),
          unrealized_plpc: calculation.unrealizedPLPercent.toString(),
          current_price: calculation.currentValue.toString()
        };
      });

      // Calculate portfolio summary
      const portfolioCalculation = this.calculatePortfolioValues(positions, account);
      
      // Update store with calculated values
      store.updatePositions(updatedPositions);
      store.updateAccount({
        ...account,
        equity: portfolioCalculation.totalEquity,
        portfolio_value: portfolioCalculation.totalMarketValue,
        cash: portfolioCalculation.cashBalance,
        day_profit_loss: portfolioCalculation.dailyPL,
        day_profit_loss_pct: portfolioCalculation.dailyPLPercent
      });
    }
  }
}

export const calculationService = CalculationService.getInstance();
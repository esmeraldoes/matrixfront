import { create } from 'zustand';
import Decimal from 'decimal.js';

interface RiskSettings {
  maxPositionSize: Decimal;
  maxDrawdown: Decimal;
  defaultRiskPerTrade: Decimal;
  maxDailyLoss: Decimal;
  maxOpenPositions: number;
}

interface RiskStore {
  settings: RiskSettings;
  updateSettings: (updates: Partial<RiskSettings>) => void;
  dailyPnL: Decimal;
  updateDailyPnL: (pnl: Decimal) => void;
}

const DEFAULT_SETTINGS: RiskSettings = {
  maxPositionSize: new Decimal(5000), // $5,000 max position size
  maxDrawdown: new Decimal(0.1), // 10% max drawdown
  defaultRiskPerTrade: new Decimal(0.01), // 1% risk per trade
  maxDailyLoss: new Decimal(0.02), // 2% max daily loss
  maxOpenPositions: 5,
};

export const useRiskStore = create<RiskStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),
  dailyPnL: new Decimal(0),
  updateDailyPnL: (pnl) =>
    set((state) => ({
      dailyPnL: state.dailyPnL.plus(pnl),
    })),
}));

export class RiskCalculator {
  public calculatePositionSize(
    riskAmount: Decimal,
    currentPrice: Decimal,
    stopLoss: Decimal
  ): Decimal {
    const riskPerShare = currentPrice.minus(stopLoss).abs();
    if (riskPerShare.isZero()) {
      throw new Error('Invalid stop loss - same as current price');
    }

    let quantity = riskAmount.dividedBy(riskPerShare);

    // Round down to ensure we don't exceed risk amount
    quantity = quantity.floor();

    const { maxPositionSize } = useRiskStore.getState().settings;
    const totalPositionSize = quantity.times(currentPrice);

    if (totalPositionSize.greaterThan(maxPositionSize)) {
      quantity = maxPositionSize.dividedBy(currentPrice).floor();
    }

    return quantity;
  }

  public validateTrade(
    accountBalance: Decimal,
    riskAmount: Decimal,
    currentPositions: number
  ): { valid: boolean; reason?: string } {
    const { settings, dailyPnL } = useRiskStore.getState();

    // Check daily loss limit
    if (dailyPnL.lessThan(accountBalance.negated().times(settings.maxDailyLoss))) {
      return {
        valid: false,
        reason: 'Daily loss limit reached',
      };
    }

    // Check risk per trade
    const maxRiskPerTrade = accountBalance.times(settings.defaultRiskPerTrade);
    if (riskAmount.greaterThan(maxRiskPerTrade)) {
      return {
        valid: false,
        reason: 'Risk amount exceeds maximum risk per trade',
      };
    }

    // Check max open positions
    if (currentPositions >= settings.maxOpenPositions) {
      return {
        valid: false,
        reason: 'Maximum number of open positions reached',
      };
    }

    return { valid: true };
  }

  public calculateTakeProfit(
    entryPrice: Decimal,
    stopLoss: Decimal,
    riskRewardRatio: number = 2
  ): Decimal {
    const risk = entryPrice.minus(stopLoss).abs();
    const reward = risk.times(riskRewardRatio);
    return entryPrice.plus(reward);
  }

  public shouldCloseAllPositions(accountBalance: Decimal): boolean {
    const { settings, dailyPnL } = useRiskStore.getState();
    
    // Close all positions if daily loss limit is reached
    if (dailyPnL.lessThan(accountBalance.negated().times(settings.maxDailyLoss))) {
      return true;
    }

    // Close all positions if max drawdown is reached
    const drawdown = dailyPnL.dividedBy(accountBalance).abs();
    if (drawdown.greaterThan(settings.maxDrawdown)) {
      return true;
    }

    return false;
  }
}
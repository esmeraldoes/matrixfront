// src/hooks/usePortfolios.ts
export interface Portfolio {
  id: number;
  name: string;
  description: string;
  strategy_type: string;
  risk_level: number;
  duration: string;
  min_investment: number;
  expected_return_min: number;
  expected_return_max: number;
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  volatility: number;
  win_rate: number;
  annual_management_fee: number;
  rebalance_frequency: string;
  is_active: boolean;
  is_public: boolean;
  is_accepting_subscribers: boolean;
  total_subscribers: number;
  total_aum: number;
  created_by_name: string;
  is_subscribed: boolean;
  assets: PortfolioAsset[];
  created_at: string;
  updated_at: string;
  
  // Frontend-only computed properties
  type?: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK';
  account?: {
    type: 'PAPER' | 'LIVE';
    name: string;
  };
  riskSettings?: {
    maxPositionSize: number;
    maxDrawdown: number;
    defaultStopLoss: number;
    defaultTakeProfit: number;
    maxDailyLoss: number;
    maxOpenPositions: number;
  };
  positions?: any[];
  performance?: {
    dailyPnL: number;
    totalPnL: number;
    winRate: number;
    drawdown: number;
  };
  allocation?: {
    forex: number;
    crypto: number;
    stocks: number;
    commodities: number;
  };
  status?: 'active' | 'paused' | 'cancelled' | 'completed';
  subscriptionData?: any;
}

export interface PortfolioAsset {
  id: number;
  symbol: string;
  name: string;
  asset_class: string;
  allocation: number;
  is_core_holding: boolean;
}

export interface PortfolioSubscription {
  id: number;
  portfolio: number;
  portfolio_name: string;
  portfolio_risk_level: number;
  trading_account: number | null;
  account_nickname: string | null;
  allocation_amount: number;
  leverage_multiplier: number;
  auto_rebalance: boolean;
  custom_risk_adjustment: number | null;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  current_value: number;
  total_profit_loss: number;
  subscription_return: number;
  subscribed_at: string;
  last_rebalanced: string | null;
  paused_at: string | null;
  cancelled_at: string | null;
  portfolio_assets?: {
    forex: number;
    crypto: number;
    stocks: number;
    commodities: number;
  };
}
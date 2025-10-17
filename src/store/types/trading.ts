//  trading types
export interface TradeEvent {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: Date;
  orderType: string;
  status: string;
}

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Trade {
  symbol: string;
  price: number;
  size: number;
  timestamp: string;
  exchange: string;
  conditions: string[];
  tape?: string;
}

export interface Position {
  asset_class: string;
  asset_id: string;
  asset_marginable: boolean;
  avg_entry_price: string;
  avg_entry_swap_rate: string | null;
  change_today: string;
  cost_basis: string;
  current_price: string;
  exchange: string;
  lastday_price: string;
  market_value: string;
  qty: string;
  qty_available: string;
  side: string;
  swap_rate: string | null;
  symbol: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  usd: string | null;
}

export interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  order_type: string;
  qty: string;
  filled_qty: string;
  limit_price: string | null;
  stop_price: string | null;
  status: string;
  created_at: string;
  time_in_force: string;
}


export interface OrderRequest {
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop" | "trailing_stop_limit";
  time_in_force: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price?: number;
  stop_price?: number;
  trail_price?: number;
  trail_percent?: number;
}


export interface OrderReplaceRequest {
  qty?: number;
  time_in_force?: string;
  limit_price?: number;
  stop_price?: number;
  trail?: number;
  client_order_id?: string;
}

export interface Quote {
  symbol: string;
  bid_price: number;
  bid_size: number;
  ask_price: number;
  ask_size: number;
  timestamp: string;
}

export interface AccountSnapshot {
  equity: string;
  cash: string;
  buying_power: string;
  day_profit_loss: number;
  day_profit_loss_pct: string;
  portfolio_value: string;
  long_value: number;
  short_value: number;
  positions_count: number;
  orders_count: number;
  data: Record<string, any>;
  timestamp: string;
  nickname: string | null;
  broker_type: string;
}

export interface PortfolioHistory {
  timestamp: number[];
  equity: number[];
  profit_loss: number[];
  profit_loss_pct: number[];
  base_value: number;
  timeframe: string;
}

export interface MarketTrade {
  id: string;
  symbol: string;
  price: number;
  size: number;
  timestamp: Date;
  exchange: string;
  conditions: string[];
  tape?: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  asset_class: string;
  exchange: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
  min_order_size: number | null;
  min_trade_increment: number | null;
  price_increment: number | null;
  maintenance_margin_requirement: number;
  attributes: string[];
}

export interface MarketClock {
  timestamp: string;
  is_open: boolean;
  next_open: string;
  next_close: string;
}

export interface MarketCalendarDay {
  date: string;
  open: string;
  close: string;
  session_open: string;
  session_close: string;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}





// Portfolio types
export interface Portfolio {
  id: number;
  name: string;
  description: string;
  risk_level: number;
  duration: string;
  min_investment: number;
  expected_return_min: number;
  expected_return_max: number;
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  volatility: number;
  is_active: boolean;
  is_public: boolean;
  created_by_name: string;
  is_subscribed: boolean;
  subscriber_count: number;
  assets: PortfolioAsset[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioAsset {
  id: number;
  symbol: string;
  name: string;
  allocation: number;
  asset_class: string;
}

export interface PortfolioSubscription {
  id: number;
  portfolio: number;
  portfolio_name: string;
  portfolio_risk_level: number;
  trading_account: number;
  account_nickname: string;
  allocation_amount: number;
  leverage_multiplier: number;
  auto_rebalance: boolean;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  current_value: number;
  total_profit_loss: number;
  subscription_return: number;
  subscribed_at: string;
  last_rebalanced: string | null;
  paused_at: string | null;
  cancelled_at: string | null;
}

export interface PortfolioPerformance {
  initial_investment: number;
  current_value: number;
  total_return: number;
  total_profit_loss: number;
  leverage: number;
  status: string;
  subscribed_since: string;
  last_rebalanced: string | null;
  recent_trades: PortfolioTrade[];
}

export interface PortfolioTrade {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  status: string;
  executed_at: string | null;
}


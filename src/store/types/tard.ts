// src/types/trading.ts
export interface Position {
  id: string;
  account: string;
  asset: {
    symbol: string;
    name: string;
    asset_class: string;
    exchange: string;
  };
  quantity: string;
  avg_entry_price: string;
  current_price: string | null;
  market_value: string | null;
  cost_basis: string;
  unrealized_pl: string | null;
  unrealized_plpc: string | null;
  side: string;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_id: string;
  client_order_id: string;
  symbol: string;
  quantity: string;
  filled_quantity: string;
  order_type: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  trail_price: string | null;
  trail_percent: string | null;
  status: string;
  side: string;
  extended_hours: boolean;
  legs: any[];
  created_at: string;
  updated_at: string;
  filled_at: string | null;
  canceled_at: string | null;
  asset: {
    symbol: string;
    name: string;
    asset_class: string;
    exchange: string;
  };
}

export interface Quote {
  symbol: string;
  bid_price: string;
  bid_size: number;
  ask_price: string;
  ask_size: number;
  timestamp: string;
}

export interface AccountSnapshot {
  equity: string;
  cash: string;
  buying_power: string;
  day_profit_loss: string;
  day_profit_loss_pct: string;
  portfolio_value: string;
  long_value: string;
  short_value: string;
  positions_count: number;
  orders_count: number;
  data: Record<string, any>;
  timestamp: string;
}

export interface MarketData {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trade_count?: number;
  vwap?: number;
}

export interface Asset {
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
}

export interface OrderRequest {
  symbol: string;
  qty: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: string;
  stop_price?: string;
  trail_price?: string;
  trail_percent?: string;
  extended_hours?: boolean;
  client_order_id?: string;
  order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
  take_profit?: {
    limit_price: string;
  };
  stop_loss?: {
    stop_price: string;
    limit_price?: string;
  };
}

export interface OrderReplaceRequest {
  qty?: string;
  time_in_force?: string;
  limit_price?: string;
  stop_price?: string;
  trail?: string;
  client_order_id?: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  id?: string;
  timestamp: number;
}
// types/index.ts
export interface Account {
  id: string;
  user: string;
  nickname: string;
  broker_type: 'ALPACA' | 'IBKR';
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sync: string | null;
  credentials?: BrokerCredentials;
}

export interface BrokerCredentials {
  api_key: string;
  secret_key: string;
  paper_trading: boolean;
  is_valid: boolean;
}

export interface Position {
  symbol: string;
  quantity: number;
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  side: 'long' | 'short';
  is_open: boolean;
  asset?: Asset;
}

export interface Order {
  order_id: string;
  client_order_id: string;
  symbol: string;
  quantity: number;
  filled_quantity: number;
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price: number | null;
  stop_price: number | null;
  trail_price: number | null;
  trail_percent: number | null;
  status: 'new' | 'partially_filled' | 'filled' | 'canceled' | 'expired';
  side: 'buy' | 'sell';
  extended_hours: boolean;
  legs: any[];
  created_at: string;
  updated_at: string;
  filled_at: string | null;
  canceled_at: string | null;
  asset?: Asset;
}

export interface Asset {
  symbol: string;
  name: string;
  asset_class: 'stock' | 'option' | 'crypto' | 'future' | 'forex';
  exchange: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
}

export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: string;
}

export interface Watchlist {
  id: string;
  name: string;
  description: string;
  assets: Asset[];
  is_default: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: string;
  message?: string;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
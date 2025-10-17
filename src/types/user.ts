// store/types/auth.ts
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  trading_accounts?: TradingAccount[];
  is_active: boolean;
  date_joined: string;
  last_login: string;
}

export interface TradingAccount {
  id: number;
  user: number;
  broker_connection?: number;
  nickname: string;
  broker_type: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sync?: string;
}

// store/types/trading.ts
export interface PortfolioMetrics {
  portfolio_value: number;
  cash: number;
  buying_power: number;
  daily_pnl: number;
  daily_pnl_percent: number;
  unrealized_pl: number;
  realized_pl: number;
  win_rate: number;
  current_drawdown: number;
  max_drawdown: number;
  volatility: number;
  sharpe_ratio: number;
  positions_count: number;
  timestamp: number;
  last_updated: string;
}

// export interface User {
//   id: number;
//   email: string;
//   username: string;
//   first_name: string;
//   last_name: string;
//   is_staff: boolean;
//   is_active: boolean;
//   is_verified: boolean; // Assuming this field exists and indicates email verification
//   date_joined: string;
//   referral_code?: string; // The user's *own* referral code for sharing
//   referred_by?: number; // ID of the user who referred this user (ForeignKey to User)
//   // phone_number?: string;
//   avatar?: string;
//   // Add any other fields your User model has
//   name?: string;
//   // bio?: string;
//   // location?: string;
//   // website?: string;
//   // phone?: string;
// }


export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
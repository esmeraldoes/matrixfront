// store/types/broker.ts
export interface BrokerConnection {
  id: number;
  user: number;
  name: string;
  broker_type: 'alpaca' | 'alpaca_crypto' | 'ibkr' | 'tradier' | 'tdameritrade' | 'coinbase' | 'binance';
  environment: 'paper' | 'live';
  auth_type: 'api_key' | 'oauth';
  api_key?: string;
  api_secret?: string;
  api_token?: string;
  oauth_access_token?: string;
  oauth_refresh_token?: string;
  oauth_expires_in?: string;
  oauth_client_id?: string;
  base_url?: string;
  account_id?: string;
  trading_account_id: number | null;
  is_active: boolean;
  is_default: boolean;
  status: 'pending' | 'valid' | 'invalid' | 'disabled' | 'rate_limited';
  last_validated?: string;
  last_rate_limit?: string;
  validation_message?: string;
  account_status?: string;
  created_at: string;
  updated_at: string;
  last_used?: string;
  is_valid: boolean;
  is_rate_limited: boolean;
  is_oauth_expired: boolean;
}

export interface BrokerErrorLog {
  id: number;
  connection: number;
  error_category: 'connection' | 'authentication' | 'rate_limit' | 'validation' | 'account' | 'other';
  error_type: string;
  error_message: string;
  endpoint?: string;
  request_data?: any;
  response_data?: any;
  stack_trace?: string;
  created_at: string;
  connection_name?: string;
  broker_type?: string;
}

export interface TestConnectionData {
  broker_type: string;
  environment: string;
  auth_type: string;
  api_key?: string;
  api_secret?: string;
  api_token?: string;
  oauth_access_token?: string;
  oauth_client_id?: string;
  base_url?: string;
  name?: string;
}

export interface ImmediateValidationResult extends ValidationResult {
  created: boolean;
  connection?: BrokerConnection;
}


export interface ValidationResult {
  success: boolean;
  valid: boolean;
  connected: boolean;
  message: string;
  timestamp: string;
  error_type?: string;
  retry_after?: number;
  account_info?: any;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface OAuthState {
  state: string;
  environment: string;
  scope: string;
}


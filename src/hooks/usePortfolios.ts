// src/hooks/usePortfolios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { usePortfolioStore } from '@/store/portfolioStore';

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
  isPaperTrading?: boolean;
}

export interface PortfolioTrade {
  id: number;
  subscription_id: number;
  portfolio_name: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number | null;
  calculated_amount: number;
  executed_price: number | null;
  status: string;
  executed_at: string | null;
  created_at: string;
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

export interface PortfolioFilters {
  risk_level?: number;
  duration?: string;
  strategy_type?: string;
  min_investment?: number;
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

export interface PaperPortfolioSubscription {
  id: number;
  portfolio_name: string;
  portfolio_id: number;
  strategy_type: string;
  risk_level: number;
  initial_investment: number;
  current_value: number;
  profit_loss: number;
  return_percentage: number;
  status: string;
  subscribed_at: string;
  auto_rebalance: boolean;
}

export interface PortfolioBacktest {
  id: number;
  portfolio: number;
  portfolio_name: string;
  name: string;
  description: string;
  initial_capital: number;
  start_date: string;
  end_date: string;
  rebalance_frequency: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  final_portfolio_value: number;
  total_return: number;
  annualized_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  volatility: number;
  created_at: string;
  completed_at: string | null;
  execution_time: string | null;
}

export interface BacktestDayResult {
  id: number;
  backtest: number;
  date: string;
  portfolio_value: number;
  daily_return: number;
  cumulative_return: number;
  drawdown: number;
  asset_values: Record<string, number>;
}

export interface BacktestTrade {
  id: number;
  backtest: number;
  date: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  trade_type: 'initial' | 'rebalance';
}

// Query keys
export const portfolioQueryKeys = {
  all: ['portfolios'] as const,
  lists: () => [...portfolioQueryKeys.all, 'list'] as const,
  list: (filters?: PortfolioFilters) => [...portfolioQueryKeys.lists(), filters] as const,
  details: () => [...portfolioQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...portfolioQueryKeys.details(), id] as const,
  performance: (id: number) => [...portfolioQueryKeys.detail(id), 'performance'] as const,
  subscriptions: () => [...portfolioQueryKeys.all, 'subscriptions'] as const,
  subscription: (id: number) => [...portfolioQueryKeys.subscriptions(), id] as const,
  subscriptionPerformance: (id: number) => [...portfolioQueryKeys.subscription(id), 'performance'] as const,
  trades: (filters?: { subscription_id?: number }) => [...portfolioQueryKeys.all, 'trades', filters] as const,
  backtests: () => [...portfolioQueryKeys.all, 'backtests'] as const,
  backtest: (id: number) => [...portfolioQueryKeys.backtests(), id] as const,
  backtestResults: (id: number) => [...portfolioQueryKeys.backtest(id), 'results'] as const,
  backtestChart: (id: number) => [...portfolioQueryKeys.backtest(id), 'chart'] as const,
  paperSubscriptions: () => [...portfolioQueryKeys.all, 'paper-subscriptions'] as const,
  paperClone: () => [...portfolioQueryKeys.all, 'paper-clone'] as const,
};

// Portfolio hooks
export const usePortfolios = (filters?: PortfolioFilters) => {
  const { setPortfolios } = usePortfolioStore();

  return useQuery({
    queryKey: portfolioQueryKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.risk_level) params.append('risk_level', filters.risk_level.toString());
      if (filters?.duration) params.append('duration', filters.duration);
      if (filters?.strategy_type) params.append('strategy_type', filters.strategy_type);
      if (filters?.min_investment) params.append('min_investment', filters.min_investment.toString());

      const url = `/realtrade/portfolios/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      // Update store
      if (response.data?.results) {
        setPortfolios(response.data.results);
      }
      
      return response.data;
    },
  });
};

export const usePortfolio = (portfolioId: number) => {
  const { setSelectedPortfolio } = usePortfolioStore();

  return useQuery<Portfolio>({
    queryKey: portfolioQueryKeys.detail(portfolioId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolios/${portfolioId}/`);
      
      // Update store
      setSelectedPortfolio(response.data);
      
      return response.data;
    },
    enabled: !!portfolioId,
  });
};

export const usePortfolioPerformance = (portfolioId: number) => {
  return useQuery({
    queryKey: portfolioQueryKeys.performance(portfolioId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolios/${portfolioId}/performance/`);
      return response.data;
    },
    enabled: !!portfolioId,
  });
};

export const usePortfolioSubscriptions = () => {
  const { setSubscriptions } = usePortfolioStore();

  return useQuery({
    queryKey: portfolioQueryKeys.subscriptions(),
    queryFn: async () => {
      const response = await api.get('/realtrade/portfolio-subscriptions/');
      const data = response.data.results || response.data;
      
      // Update store
      setSubscriptions(data);
      
      return data;
    },
  });
};

export const usePortfolioSubscription = (subscriptionId: number) => {
  return useQuery<PortfolioSubscription>({
    queryKey: portfolioQueryKeys.subscription(subscriptionId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolio-subscriptions/${subscriptionId}/`);
      return response.data;
    },
    enabled: !!subscriptionId,
  });
};

export const useSubscribeToPortfolio = () => {
  const queryClient = useQueryClient();
  const { addSubscription } = usePortfolioStore();

  return useMutation({
    mutationFn: async (data: {
      portfolio_id: number;
      trading_account_id?: number;
      allocation_amount: number;
      leverage_multiplier?: number;
    }) => {
      // Validate required fields
      if (!data.portfolio_id || !data.allocation_amount) {
        throw new Error('Portfolio ID and allocation amount are required');
      }

      // Try to get a default trading account if not provided
      let finalTradingAccountId = data.trading_account_id;
      
      if (!finalTradingAccountId) {
        try {
          const accountsResponse = await api.get('/realtrade/trading-accounts/');
          const accounts = accountsResponse.data.results || accountsResponse.data;
          const activeAccount = accounts.find((acc: any) => acc.is_active);
          
          if (activeAccount) {
            finalTradingAccountId = activeAccount.id;
          } else {
            throw new Error('No active trading account found');
          }
        } catch (error) {
          throw new Error('No active trading account found. Please create a trading account first.');
        }
      }

      // Make the subscription request
      const response = await api.post('/realtrade/portfolio-subscriptions/', {
        ...data,
        trading_account_id: finalTradingAccountId
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.lists() });
      
      addSubscription(data);
    },
    onError: (error: any) => {
      console.error('Portfolio subscription failed:', error);
    },
  });
};

export const useRebalancePortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await api.post(`/realtrade/portfolio-subscriptions/${subscriptionId}/rebalance/`);
      return response.data;
    },
    onSuccess: (_data, subscriptionId) => {
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscription(subscriptionId) });
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptionPerformance(subscriptionId) });
    },
  });
};

export const usePortfolioSubscriptionPerformance = (subscriptionId: number) => {
  return useQuery<PortfolioPerformance>({
    queryKey: portfolioQueryKeys.subscriptionPerformance(subscriptionId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolio-subscriptions/${subscriptionId}/performance/`);
      return response.data;
    },
    enabled: !!subscriptionId,
  });
};

export const usePortfolioTrades = (filters?: { subscription_id?: number }) => {
  const { setTrades } = usePortfolioStore();

  return useQuery({
    queryKey: portfolioQueryKeys.trades(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.subscription_id) params.append('subscription_id', filters.subscription_id.toString());

      const url = `/realtrade/portfolio-trades/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      if (response.data?.results) {
        setTrades(response.data.results);
      }
      
      return response.data;
    },
  });
};

export const useManagePortfolioSubscription = () => {
  const queryClient = useQueryClient();
  const { updateSubscription, removeSubscription } = usePortfolioStore();

  return useMutation({
    mutationFn: async ({ subscriptionId, action }: { subscriptionId: number; action: 'pause' | 'resume' | 'cancel' }) => {
      const response = await api.post(`/realtrade/portfolio-subscriptions/${subscriptionId}/${action}/`);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      const { subscriptionId, action } = variables;
      
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscription(subscriptionId) });
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
      
      // Update store
      if (action === 'cancel') {
        removeSubscription(subscriptionId);
      } else {
        updateSubscription(subscriptionId, { status: action === 'pause' ? 'paused' : 'active' });
      }
    },
  });
};

export const useBacktestPortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      portfolio_id: number;
      name: string;
      initial_capital: number;
      start_date: string;
      end_date: string;
      rebalance_frequency: string;
      description?: string;
    }) => {
      const response = await api.post('/realtrade/portfolio-backtests/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.backtests() });
    },
  });
};

export const usePortfolioBacktests = () => {
  return useQuery({
    queryKey: portfolioQueryKeys.backtests(),
    queryFn: async () => {
      const response = await api.get('/realtrade/portfolio-backtests/');
      return response.data;
    },
  });
};

export const usePortfolioBacktest = (backtestId: number) => {
  return useQuery<PortfolioBacktest>({
    queryKey: portfolioQueryKeys.backtest(backtestId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolio-backtests/${backtestId}/`);
      return response.data;
    },
    enabled: !!backtestId,
  });
};

export const useBacktestResults = (backtestId: number) => {
  return useQuery({
    queryKey: portfolioQueryKeys.backtestResults(backtestId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolio-backtests/${backtestId}/results/`);
      return response.data;
    },
    enabled: !!backtestId,
  });
};

export const useBacktestChartData = (backtestId: number) => {
  return useQuery({
    queryKey: portfolioQueryKeys.backtestChart(backtestId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolio-backtests/${backtestId}/chart-data/`);
      return response.data;
    },
    enabled: !!backtestId,
  });
};

export const useCompareBacktests = (backtestIds: number[]) => {
  return useQuery({
    queryKey: [...portfolioQueryKeys.backtests(), 'compare', ...backtestIds],
    queryFn: async () => {
      const params = new URLSearchParams();
      backtestIds.forEach(id => params.append('ids[]', id.toString()));
      const response = await api.get(`/realtrade/portfolio-backtests/compare/?${params.toString()}`);
      return response.data;
    },
    enabled: backtestIds.length > 0,
  });
};

// Paper Trading Hooks
export const usePaperPortfolioSubscriptions = () => {
  return useQuery<PaperPortfolioSubscription[]>({
    queryKey: portfolioQueryKeys.paperSubscriptions(),
    queryFn: async () => {
      const response = await api.get('/paper-trading/portfolios/subscriptions/');
      return response.data;
    },
  });
};

export const useCloneToPaperTrading = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      portfolio_id: number;
      allocation_amount: number;
    }) => {
      const response = await api.post('/paper-trading/portfolios/clone/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.paperSubscriptions() });
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
    },
  });
};

export const useAvailablePaperPortfolios = () => {
  return useQuery({
    queryKey: ['paper-portfolios', 'available'],
    queryFn: async () => {
      const response = await api.get('/paper-trading/portfolios/clone/');
      return response.data;
    },
  });
};






// // src/hooks/usePortfolios.ts
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { api } from '@/services/api';
// import { usePortfolioStore } from '@/store/portfolioStore';





// export interface PaperPortfolioSubscription {
//   id: number;
//   portfolio_name: string;
//   portfolio_id: number;
//   strategy_type: string;
//   risk_level: number;
//   initial_investment: number;
//   current_value: number;
//   profit_loss: number;
//   return_percentage: number;
//   status: string;
//   subscribed_at: string;
//   auto_rebalance: boolean;
// }


// export interface Portfolio {
//   id: number;
//   name: string;
//   description: string;
//   strategy_type: string;
//   risk_level: number;
//   duration: string;
//   min_investment: number;
//   expected_return_min: number;
//   expected_return_max: number;
//   total_return: number;
//   sharpe_ratio: number;
//   max_drawdown: number;
//   volatility: number;
//   win_rate: number;
//   annual_management_fee: number;
//   rebalance_frequency: string;
//   is_active: boolean;
//   is_public: boolean;
//   is_accepting_subscribers: boolean;
//   total_subscribers: number;
//   total_aum: number;
//   created_by_name: string;
//   is_subscribed: boolean;
//   assets: PortfolioAsset[];
//   created_at: string;
//   updated_at: string;
  
//   type?: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK';
//   account?: {
//     type: 'PAPER' | 'LIVE';
//     name: string;
//   };
//   riskSettings?: {
//     maxPositionSize: number;
//     maxDrawdown: number;
//     defaultStopLoss: number;
//     defaultTakeProfit: number;
//     maxDailyLoss: number;
//     maxOpenPositions: number;
//   };
//   positions?: any[];
//   performance?: {
//     dailyPnL: number;
//     totalPnL: number;
//     winRate: number;
//     drawdown: number;
//   };
//   allocation?: {
//     forex: number;
//     crypto: number;
//     stocks: number;
//     commodities: number;
//   };
//   status?: 'active' | 'paused' | 'cancelled' | 'completed';
//   subscriptionData?: any;
// }

// export interface PortfolioTrade {
//   id: number;
//   subscription_id: number;
//   portfolio_name: string;
//   symbol: string;
//   side: 'buy' | 'sell';
//   quantity: number | null;
//   calculated_amount: number;
//   executed_price: number | null;
//   status: string;
//   executed_at: string | null;
//   created_at: string;
// }

// export interface PortfolioAsset {
//   id: number;
//   symbol: string;
//   name: string;
//   asset_class: string;
//   allocation: number;
//   is_core_holding: boolean;
// }

// export interface PortfolioSubscription {
//   id: number;
//   portfolio: number;
//   portfolio_name: string;
//   portfolio_risk_level: number;
//   trading_account: number | null;
//   account_nickname: string | null;
//   allocation_amount: number;
//   leverage_multiplier: number;
//   auto_rebalance: boolean;
//   custom_risk_adjustment: number | null;
//   status: 'active' | 'paused' | 'cancelled' | 'completed';
//   current_value: number;
//   total_profit_loss: number;
//   subscription_return: number;
//   subscribed_at: string;
//   last_rebalanced: string | null;
//   paused_at: string | null;
//   cancelled_at: string | null;
//   portfolio_assets?: {
//     forex: number;
//     crypto: number;
//     stocks: number;
//     commodities: number;
//   };
// }

// export interface PortfolioFilters {
//   risk_level?: number;
//   duration?: string;
//   strategy_type?: string;
//   min_investment?: number;
// }

// export interface PortfolioPerformance {
//   initial_investment: number;
//   current_value: number;
//   total_return: number;
//   total_profit_loss: number;
//   leverage: number;
//   status: string;
//   subscribed_since: string;
//   last_rebalanced: string | null;
//   recent_trades: PortfolioTrade[];
// }



// export interface PortfolioBacktest {
//   id: number;
//   portfolio: number;
//   portfolio_name: string;
//   name: string;
//   description: string;
//   initial_capital: number;
//   start_date: string;
//   end_date: string;
//   rebalance_frequency: string;
//   status: 'pending' | 'running' | 'completed' | 'failed';
//   final_portfolio_value: number;
//   total_return: number;
//   annualized_return: number;
//   sharpe_ratio: number;
//   max_drawdown: number;
//   volatility: number;
//   created_at: string;
//   completed_at: string | null;
//   execution_time: string | null;
// }

// export interface BacktestDayResult {
//   id: number;
//   backtest: number;
//   date: string;
//   portfolio_value: number;
//   daily_return: number;
//   cumulative_return: number;
//   drawdown: number;
//   asset_values: Record<string, number>;
// }

// export interface BacktestTrade {
//   id: number;
//   backtest: number;
//   date: string;
//   symbol: string;
//   side: 'buy' | 'sell';
//   quantity: number;
//   price: number;
//   value: number;
//   trade_type: 'initial' | 'rebalance';
// }



// // Query keys
// export const portfolioQueryKeys = {
//   all: ['portfolios'] as const,
//   lists: () => [...portfolioQueryKeys.all, 'list'] as const,
//   list: (filters?: PortfolioFilters) => [...portfolioQueryKeys.lists(), filters] as const,
//   details: () => [...portfolioQueryKeys.all, 'detail'] as const,
//   detail: (id: number) => [...portfolioQueryKeys.details(), id] as const,
//   performance: (id: number) => [...portfolioQueryKeys.detail(id), 'performance'] as const,
//   subscriptions: () => [...portfolioQueryKeys.all, 'subscriptions'] as const,
//   subscription: (id: number) => [...portfolioQueryKeys.subscriptions(), id] as const,
//   subscriptionPerformance: (id: number) => [...portfolioQueryKeys.subscription(id), 'performance'] as const,
//   trades: (filters?: { subscription_id?: number }) => [...portfolioQueryKeys.all, 'trades', filters] as const,


//   backtests: () => [...portfolioQueryKeys.all, 'backtests'] as const,
//   backtest: (id: number) => [...portfolioQueryKeys.backtests(), id] as const,
//   backtestResults: (id: number) => [...portfolioQueryKeys.backtest(id), 'results'] as const,
//   backtestChart: (id: number) => [...portfolioQueryKeys.backtest(id), 'chart'] as const,

//   paperSubscriptions: () => [...portfolioQueryKeys.all, 'paper-subscriptions'] as const,
//   paperClone: () => [...portfolioQueryKeys.all, 'paper-clone'] as const,

// };

// // Portfolio hooks
// export const usePortfolios = (filters?: PortfolioFilters) => {
//   const { setPortfolios } = usePortfolioStore();

//   return useQuery({
//     queryKey: portfolioQueryKeys.list(filters),
//     queryFn: async () => {
//       const params = new URLSearchParams();
//       if (filters?.risk_level) params.append('risk_level', filters.risk_level.toString());
//       if (filters?.duration) params.append('duration', filters.duration);
//       if (filters?.strategy_type) params.append('strategy_type', filters.strategy_type);
//       if (filters?.min_investment) params.append('min_investment', filters.min_investment.toString());

//       const url = `/realtrade/portfolios/${params.toString() ? `?${params.toString()}` : ''}`;
//       const response = await api.get(url);
      
//       // Update store
//       if (response.data?.results) {
//         setPortfolios(response.data.results);
//       }
      
//       return response.data;
//     },
//   });
// };

// export const usePortfolio = (portfolioId: number) => {
//   const { setSelectedPortfolio } = usePortfolioStore();

//   return useQuery<Portfolio>({
//     queryKey: portfolioQueryKeys.detail(portfolioId),
//     queryFn: async () => {
//       const response = await api.get(`/realtrade/portfolios/${portfolioId}/`);
      
//       // Update store
//       setSelectedPortfolio(response.data);
      
//       return response.data;
//     },
//     enabled: !!portfolioId,
//   });
// };

// export const usePortfolioPerformance = (portfolioId: number) => {
//   return useQuery({
//     queryKey: portfolioQueryKeys.performance(portfolioId),
//     queryFn: async () => {
//       const response = await api.get(`/realtrade/portfolios/${portfolioId}/performance/`);
//       return response.data;
//     },
//     enabled: !!portfolioId,
//   });
// };

// export const usePortfolioSubscriptions = () => {
//   const { setSubscriptions } = usePortfolioStore();

//   return useQuery({
//     queryKey: portfolioQueryKeys.subscriptions(),
//     queryFn: async () => {
//       const response = await api.get('/realtrade/portfolio-subscriptions/');
//       const data = response.data.results || response.data;
      
//       // Update store
//       setSubscriptions(data);
      
//       return data;
//     },
//   });
// };

// export const usePortfolioSubscription = (subscriptionId: number) => {
//   return useQuery<PortfolioSubscription>({
//     queryKey: portfolioQueryKeys.subscription(subscriptionId),
//     queryFn: async () => {
//       const response = await api.get(`/realtrade/portfolio-subscriptions/${subscriptionId}/`);
//       return response.data;
//     },
//     enabled: !!subscriptionId,
//   });
// };


// // hooks/usePortfolios.ts - Updated mutation
// export const useSubscribeToPortfolio = () => {
//   const queryClient = useQueryClient();
//   const { addSubscription } = usePortfolioStore();

//   return useMutation({
//     mutationFn: async (data: {
//       portfolio_id: number;
//       trading_account_id?: number;
//       allocation_amount: number;
//       leverage_multiplier?: number;
//     }) => {
//       // Validate required fields
//       if (!data.portfolio_id || !data.allocation_amount) {
//         throw new Error('Portfolio ID and allocation amount are required');
//       }

//       // Try to get a default trading account if not provided
//       let finalTradingAccountId = data.trading_account_id;
      
//       if (!finalTradingAccountId) {
//         try {
//           const accountsResponse = await api.get('/realtrade/trading-accounts/');
//           const accounts = accountsResponse.data.results || accountsResponse.data;
//           const activeAccount = accounts.find((acc: any) => acc.is_active);
          
//           if (activeAccount) {
//             finalTradingAccountId = activeAccount.id;
//           } else {
//             throw new Error('No active trading account found');
//           }
//         } catch (error) {
//           throw new Error('No active trading account found. Please create a trading account first.');
//         }
//       }

//       // Make the subscription request
//       const response = await api.post('/realtrade/portfolio-subscriptions/', {
//         ...data,
//         trading_account_id: finalTradingAccountId
//       });
      
//       return response.data;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.lists() });
      
//       addSubscription(data);
//     },
//     onError: (error: any) => {
//       console.error('Portfolio subscription failed:', error);
//     },
//   });
// };

// export const useRebalancePortfolio = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (subscriptionId: number) => {
//       const response = await api.post(`/realtrade/portfolio-subscriptions/${subscriptionId}/rebalance/`);
//       return response.data;
//     },
//     onSuccess: (data, subscriptionId) => {
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscription(subscriptionId) });
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptionPerformance(subscriptionId) });
//     },
//   });
// };

// export const usePortfolioSubscriptionPerformance = (subscriptionId: number) => {
//   return useQuery<PortfolioPerformance>({
//     queryKey: portfolioQueryKeys.subscriptionPerformance(subscriptionId),
//     queryFn: async () => {
//       const response = await api.get(`/realtrade/portfolio-subscriptions/${subscriptionId}/performance/`);
//       return response.data;
//     },
//     enabled: !!subscriptionId,
//   });
// };

// export const usePortfolioTrades = (filters?: { subscription_id?: number }) => {
//   const { setTrades } = usePortfolioStore();

//   return useQuery({
//     queryKey: portfolioQueryKeys.trades(filters),
//     queryFn: async () => {
//       const params = new URLSearchParams();
//       if (filters?.subscription_id) params.append('subscription_id', filters.subscription_id.toString());

//       const url = `/realtrade/portfolio-trades/${params.toString() ? `?${params.toString()}` : ''}`;
//       const response = await api.get(url);
      
//       if (response.data?.results) {
//         setTrades(response.data.results);
//       }
      
//       return response.data;
//     },
//   });
// };

// export const useManagePortfolioSubscription = () => {
//   const queryClient = useQueryClient();
//   const { updateSubscription, removeSubscription } = usePortfolioStore();

//   return useMutation({
//     mutationFn: async ({ subscriptionId, action }: { subscriptionId: number; action: 'pause' | 'resume' | 'cancel' }) => {
//       const response = await api.post(`/realtrade/portfolio-subscriptions/${subscriptionId}/${action}/`);
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       const { subscriptionId, action } = variables;
      
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscription(subscriptionId) });
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
      
//       // Update store
//       if (action === 'cancel') {
//         removeSubscription(subscriptionId);
//       } else {
//         updateSubscription(subscriptionId, { status: action === 'pause' ? 'paused' : 'active' });
//       }
//     },
//   });
// };



// export const useBacktestPortfolio = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (data: {
//       portfolio_id: number;
//       name: string;
//       initial_capital: number;
//       start_date: string;
//       end_date: string;
//       rebalance_frequency: string;
//       description?: string;
//     }) => {
//       const response = await api.post('/realtrade/portfolio-backtests/', data);
//       return response.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.backtests() });
//     },
//   });
// };

// export const usePortfolioBacktests = () => {
//   return useQuery({
//     queryKey: portfolioQueryKeys.backtests(),
//     queryFn: async () => {
      
//       const response = await api.get('/realtrade/portfolio-backtests/');

//       return response.data;
//     },
//   });
// };

// export const usePortfolioBacktest = (backtestId: number) => {
//   return useQuery<PortfolioBacktest>({
//     queryKey: portfolioQueryKeys.backtest(backtestId),
//     queryFn: async () => {
//       const response = await api.get(`/realtrade/portfolio-backtests/${backtestId}/`);
//       return response.data;
//     },
//     enabled: !!backtestId,
//   });
// };

// export const useBacktestResults = (backtestId: number) => {
//   return useQuery({
//     queryKey: portfolioQueryKeys.backtestResults(backtestId),
//     queryFn: async () => {
//       const response = await api.get(`/realtrade/portfolio-backtests/${backtestId}/results/`);
//       return response.data;
//     },
//     enabled: !!backtestId,
//   });
// };

// export const useBacktestChartData = (backtestId: number) => {
//   return useQuery({
//     queryKey: portfolioQueryKeys.backtestChart(backtestId),
//     queryFn: async () => {
//       const response = await api.get(`/realtrade/portfolio-backtests/${backtestId}/chart-data/`);
//       return response.data;
//     },
//     enabled: !!backtestId,
//   });
// };

// export const useCompareBacktests = (backtestIds: number[]) => {
//   return useQuery({
//     queryKey: [...portfolioQueryKeys.backtests(), 'compare', ...backtestIds],
//     queryFn: async () => {
//       const params = new URLSearchParams();
//       backtestIds.forEach(id => params.append('ids[]', id.toString()));
//       const response = await api.get(`/realtrade/portfolio-backtests/compare/?${params.toString()}`);
//       return response.data;
//     },
//     enabled: backtestIds.length > 0,
//   });
// };








// // Add paper trading hooks
// export const usePaperPortfolioSubscriptions = () => {
//   return useQuery({
//     queryKey: portfolioQueryKeys.paperSubscriptions(),
//     queryFn: async () => {
//       const response = await api.get('/paper-trading/portfolios/subscriptions/');
//       return response.data;
//     },
//   });
// };

// export const useCloneToPaperTrading = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (data: {
//       portfolio_id: number;
//       allocation_amount: number;
//     }) => {
//       const response = await api.post('/paper-trading/portfolios/clone/', data);
//       return response.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.paperSubscriptions() });
//       queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
//     },
//   });
// };

// export const useAvailablePaperPortfolios = () => {
//   return useQuery({
//     queryKey: ['paper-portfolios', 'available'],
//     queryFn: async () => {
//       const response = await api.get('/paper-trading/portfolios/clone/');
//       return response.data;
//     },
//   });
// };
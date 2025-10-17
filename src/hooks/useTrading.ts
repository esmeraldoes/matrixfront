// src/hooks/useTrading.ts
// import { useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useTradingStore } from '@/store/tradingStore';
import type { AxiosRequestConfig } from 'axios';
import { normalizeBar, type CandleWithVolume } from '@/utils/normalizerBars';
import { calculateDateRange, calculateDynamicLimit } from '@/utils/dataAggregation';
import type { OrderReplaceRequest, OrderRequest, Order, Position, Asset, AccountSnapshot, Portfolio, PortfolioSubscription, PortfolioPerformance } from '@/store/types/trading';


export interface PaginatedPositions {
  count: number;
  next: string | null;
  previous: string | null;
  results: Position[];
}

export interface HistoricalBarsFilters {
  timeframe?: string;
  limit?: number;
  start?: string;
  end?: string;
  loadMore?: boolean;
}

// Query keys
export const tradingQueryKeys = {
  account: (id: string) => ['trading', 'account', id] as const,
  positions: (accountId: string) => ['trading', 'positions', accountId] as const,
  orders: (accountId: string, filters?: any) => 
    ['trading', 'orders', accountId, filters] as const,
  assets: (accountId: string, filters?: any) => 
    ['trading', 'assets', accountId, filters] as const,
  assetSearch: (accountId: string, query: string, assetClass: string) => 
    ['trading', 'assetSearch', accountId, query, assetClass] as const,
  history: (accountId: string, type: 'positions' | 'orders', filters?: any) => 
    ['trading', 'history', accountId, type, filters] as const,
  historicalBars: (symbol: string | null, filters: HistoricalBarsFilters) => 
    ['historicalBars', symbol, filters] as const,
};


export const portfolioQueryKeys = {
  all: ['portfolios'] as const,
  lists: () => [...portfolioQueryKeys.all, 'list'] as const,
  list: (filters: any) => [...portfolioQueryKeys.lists(), filters] as const,
  details: () => [...portfolioQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...portfolioQueryKeys.details(), id] as const,
  subscriptions: () => [...portfolioQueryKeys.all, 'subscriptions'] as const,
  subscription: (id: string) => [...portfolioQueryKeys.subscriptions(), id] as const,
  performance: (id: string) => [...portfolioQueryKeys.detail(id), 'performance'] as const,
  trades: (filters?: any) => [...portfolioQueryKeys.all, 'trades', filters] as const,
};


export const useHistoricalBars = (symbol: string | null, filters: HistoricalBarsFilters = {}) => {
  const {
    loadHistoricalBars,
    prependHistoricalBars,
    setMarketDataLoading,
    setMarketDataError,
    getOldestBarTime,
    // marketData
  } = useTradingStore();

  const { timeframe = "1D", limit = 1000, loadMore = false } = filters;

  return useQuery<CandleWithVolume[]>({
    queryKey: tradingQueryKeys.historicalBars(symbol, filters),
    queryFn: async () => {
      if (!symbol) {
        return [];
      }

      setMarketDataLoading(symbol, true, loadMore);

      try {
        
        let startDate: Date;
        let endDate: Date;

        if (loadMore) {
          const oldestBarTime = getOldestBarTime(symbol);
          if (!oldestBarTime) {
            return [];
          }

          endDate = new Date(oldestBarTime * 1000);
          const { start } = calculateDateRange(timeframe, limit);
          startDate = start;
          
     
        } else {
          const dynamicLimit = calculateDynamicLimit(timeframe, limit);
          const range = calculateDateRange(timeframe, dynamicLimit);
          startDate = range.start;
          endDate = range.end;
          
        }

        const config: AxiosRequestConfig = {
          params: {
            symbol,
            timeframe,
            limit,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        };

        const response = await api.get(`/realtrade/market-data/historical/`, config);
        const bars = response.data || [];
       
        if (!Array.isArray(bars)) {
          throw new Error(`Invalid response format: expected array, got ${typeof bars}`);
        }

        const normalized = bars
          .map((d: any) => normalizeBar(d))
          .filter((c: CandleWithVolume | null): c is CandleWithVolume => c !== null);

        if (loadMore) {
          if (normalized.length > 0) {
            prependHistoricalBars(symbol, normalized);
          }
        } else {
          loadHistoricalBars(symbol, normalized, { 
            hasMore: normalized.length >= limit 
          });
        }

        return normalized;

      } catch (error) {
        setMarketDataError(symbol, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      } finally {
        setMarketDataLoading(symbol, false, loadMore);
      }
    },
    enabled: !!symbol,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useLazyHistoricalBars = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      symbol, 
      timeframe, 
      limit = 500 
    }: { 
      symbol: string; 
      timeframe: string; 
      limit?: number;
    }) => {
      const queryKey = tradingQueryKeys.historicalBars(symbol, { 
        timeframe, 
        limit, 
        loadMore: true 
      });
      
      return queryClient.fetchQuery({
        queryKey,
        queryFn: () => []
      });
    },
    onError: (error, variables) => {
      console.error('Lazy loading failed:', error);
    },
  });
};

export const useChartData = (symbol: string | null, timeframe: string = "1D") => {
  const marketData = useTradingStore(state => 
    symbol ? state.marketData[symbol] : null
  );
  const aggregatedData = useTradingStore(state => 
    symbol ? state.aggregatedMarketData[symbol]?.[timeframe] : null
  );

  const { data: bars = [], isLoading, error, refetch } = useHistoricalBars(symbol, {
    timeframe,
    limit: 1000,
  });

  // Determine which data to use
  const chartData = aggregatedData || bars;

  return {
    data: chartData,
    isLoading: isLoading || (marketData?.isLoading ?? false),
    isLoadingMore: marketData?.isLoadingMore ?? false,
    error: error || marketData?.error,
    hasMore: marketData?.hasMore ?? true,
    refetch,
    barsCount: chartData.length,
  };
};

// Rest of your existing hooks...
export const useTradingAccounts = () => {
  return useQuery({
    queryKey: ['tradingAccounts'],
    queryFn: async () => {
      const response = await api.get('/realtrade/trading-accounts/');
      return response.data;
    },
  });
};

export const useAccount = (accountId: string) => {
  return useQuery<AccountSnapshot>({
    queryKey: tradingQueryKeys.account(accountId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/trading-accounts/${accountId}/detail/`);
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useSyncAccount = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.post(`/realtrade/trading-accounts/${accountId}/sync/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.account(accountId) });
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.positions(accountId) });
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.orders(accountId) });
    },
  });
};

export const usePositions = (accountId: string) => {
  return useQuery<PaginatedPositions>({
    queryKey: tradingQueryKeys.positions(accountId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/trading-accounts/${accountId}/positions/`);
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const usePortfolioHistory = (accountId: string, filters?: any) => {
  return useQuery({
    queryKey: ['portfolioHistory', accountId, filters],
    queryFn: async () => {
      const config: AxiosRequestConfig = {
        params: filters
      };
      
      const response = await api.get(
        `/realtrade/trading-accounts/${accountId}/portfolio-history/`,
        config
      );
      
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useAccountSummary = (accountId: string) => {
  return useQuery({
    queryKey: ['accountSummary', accountId],
    queryFn: async () => {
      const response = await api.get(`/api/accounts/${accountId}/summary/`);
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useClosePosition = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ symbol, data }: { symbol: string; data: any }) => {
      const response = await api.deleteWithBody(
        `/realtrade/trading-accounts/${accountId}/positions/${symbol}/`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.positions(accountId) });
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.account(accountId) });
    },
  });
};

export const useOrders = (accountId: string, filters = {}) => {
  return useQuery<Order[]>({
    queryKey: tradingQueryKeys.orders(accountId, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      const url = `/realtrade/trading-accounts/${accountId}/orders/?${params.toString()}`;
      const response = await api.get(url);

      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      return [];
    },
    enabled: !!accountId,
  });
};

export const useCreateOrder = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: OrderRequest) => {
      const response = await api.post(
        `/realtrade/trading-accounts/${accountId}/orders/`,
        orderData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.orders(accountId) });
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.positions(accountId) });
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.account(accountId) });
    },
  });
};

export function useCancelOrder(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      await api.delete(`/realtrade/trading-accounts/${accountId}/orders/${orderId}/`);
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.orders(accountId) });
    },
  });
}

export const useReplaceOrder = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: OrderReplaceRequest }) => {
      const response = await api.patch(
        `/realtrade/trading-accounts/${accountId}/orders/${orderId}/`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingQueryKeys.orders(accountId) });
    },
  });
};

export const useAssets = (accountId: string, filters: Record<string, any> = {}) => {
  return useQuery<{ count: number; next: string | null; previous: string | null; results: Asset[] }>({
    queryKey: tradingQueryKeys.assets(accountId, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const url = `/realtrade/trading-accounts/${accountId}/assets/?${params.toString()}`;
      const response = await api.get(url);
      
      let assetsData = response.data;
      
      if (assetsData && assetsData.results && assetsData.results.results) {
        assetsData = {
          count: assetsData.results.count,
          next: assetsData.results.next,
          previous: assetsData.results.previous,
          results: assetsData.results.results
        };
      }
      
      if (Array.isArray(assetsData)) {
        return {
          count: assetsData.length,
          next: null,
          previous: null,
          results: assetsData
        };
      }
      
      if (assetsData && typeof assetsData === 'object') {
        return {
          count: assetsData.count || 0,
          next: assetsData.next || null,
          previous: assetsData.previous || null,
          results: assetsData.results || []
        };
      }
      
      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    },
    enabled: !!accountId,
  });
};

export const useAssetSearch = (
  accountId: string,
  query: string,
  assetClass: 'all' | 'us_equity' | 'crypto'
) => {
  const isSearchActive = !!query || assetClass !== 'all';

  return useQuery<{ count: number; next: string | null; previous: string | null; results: Asset[] }>({
    queryKey: tradingQueryKeys.assetSearch(accountId, query, assetClass),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (assetClass !== 'all') params.append('asset_class', assetClass);
      params.append('limit', '20');

      const url = `/realtrade/trading-accounts/${accountId}/assets/search/?${params.toString()}`;
      const response = await api.get(url);
      
      if (response.data && response.data.results) {
        return response.data;
      }
      
      if (Array.isArray(response.data)) {
        return {
          count: response.data.length,
          next: null,
          previous: null,
          results: response.data as Asset[]
        };
      }
      
      return { count: 0, next: null, previous: null, results: [] };
    },
    enabled: !!accountId && isSearchActive,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePositionHistory = (accountId: string, filters = {}) => {
  return useQuery<Position[]>({
    queryKey: tradingQueryKeys.history(accountId, 'positions', filters),
    queryFn: async () => {
      const params = new URLSearchParams({ ...filters, historical: 'true' }).toString();
      const url = `/realtrade/trading-accounts/${accountId}/positions/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useOrderHistory = (accountId: string, filters = {}) => {
  return useQuery<Order[]>({
    queryKey: tradingQueryKeys.history(accountId, 'orders', filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters).toString();
      const url = `/realtrade/trading-accounts/${accountId}/orders/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },
    enabled: !!accountId,
  });
};
















// Portfolio hooks
export const usePortfolios = (filters?: { risk_level?: number; duration?: string; min_investment?: number }) => {
  return useQuery({
    queryKey: portfolioQueryKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.risk_level) params.append('risk_level', filters.risk_level.toString());
      if (filters?.duration) params.append('duration', filters.duration);
      if (filters?.min_investment) params.append('min_investment', filters.min_investment.toString());

      const url = `/realtrade/portfolios/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },
  });
};

export const usePortfolio = (portfolioId: number) => {
  return useQuery<Portfolio>({
    queryKey: portfolioQueryKeys.detail(portfolioId.toString()),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolios/${portfolioId}/`);
      return response.data;
    },
    enabled: !!portfolioId,
  });
};

export const usePortfolioPerformance = (portfolioId: number) => {
  return useQuery({
    queryKey: portfolioQueryKeys.performance(portfolioId.toString()),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolios/${portfolioId}/performance/`);
      return response.data;
    },
    enabled: !!portfolioId,
  });
};

export const usePortfolioSubscriptions = () => {
  return useQuery<PortfolioSubscription[]>({
    queryKey: portfolioQueryKeys.subscriptions(),
    queryFn: async () => {
      const response = await api.get('/realtrade/portfolio-subscriptions/');
      return response.data.results || response.data;
    },
  });
};

export const usePortfolioSubscription = (subscriptionId: number) => {
  return useQuery<PortfolioSubscription>({
    queryKey: portfolioQueryKeys.subscription(subscriptionId.toString()),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolio-subscriptions/${subscriptionId}/`);
      return response.data;
    },
    enabled: !!subscriptionId,
  });
};

export const useSubscribeToPortfolio = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      portfolio_id: number;
      trading_account_id: number;
      allocation_amount: number;
      leverage_multiplier?: number;
    }) => {
      const response = await api.post('/realtrade/portfolio-subscriptions/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.lists() });
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
    onSuccess: (_, subscriptionId) => {
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscription(subscriptionId.toString()) });
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
    },
  });
};

export const usePortfolioSubscriptionPerformance = (subscriptionId: number) => {
  return useQuery<PortfolioPerformance>({
    queryKey: ['portfolio-subscription-performance', subscriptionId],
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolio-subscriptions/${subscriptionId}/performance/`);
      return response.data;
    },
    enabled: !!subscriptionId,
  });
};

export const usePortfolioTrades = (filters?: { subscription_id?: number }) => {
  return useQuery({
    queryKey: portfolioQueryKeys.trades(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.subscription_id) params.append('subscription_id', filters.subscription_id.toString());

      const url = `/realtrade/portfolio-trades/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },
  });
};

export const useManagePortfolioSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subscriptionId, action }: { subscriptionId: number; action: 'pause' | 'resume' | 'cancel' }) => {
      const response = await api.post(`/realtrade/portfolio-subscriptions/${subscriptionId}/${action}/`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscription(variables.subscriptionId.toString()) });
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.subscriptions() });
    },
  });
};

// --- File: useBrokers.ts ---
// hooks/useBrokers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAppDispatch } from '@/store/hooks';
import { showToast } from '@/store/uiSlice';
import type {
  BrokerConnection,
  BrokerErrorLog,
  TestConnectionData,
  ValidationResult,
  PaginatedResponse,
} from '@/store/types/broker';

// Query keys for consistent caching
export const brokerQueryKeys = {
  all: ['brokers'] as const,
  lists: () => [...brokerQueryKeys.all, 'list'] as const,
  list: (filters: any) => [...brokerQueryKeys.lists(), filters] as const,
  details: () => [...brokerQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...brokerQueryKeys.details(), id] as const,
  errors: (id: number) => [...brokerQueryKeys.detail(id), 'errors'] as const,
};

/**
 * Hook to fetch all broker connections for the current user
 */
export const useBrokerConnections = () => {
  return useQuery<BrokerConnection[]>({
    queryKey: brokerQueryKeys.lists(),
    queryFn: async () => {
      const response = await api.get('/brokers/api/connections/');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};


/**
 * Hook to fetch a specific broker connection by ID
 */
export const useBrokerConnection = (id: number) => {
  return useQuery<BrokerConnection>({
    queryKey: brokerQueryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/brokers/api/connections/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to create a new broker connection
 */
export const useCreateBrokerConnection = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (connectionData: Partial<BrokerConnection>) => {
      const response = await api.post('/brokers/api/connections/', connectionData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch the connections list
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
      dispatch(showToast({ message: 'Connection created successfully', type: 'success' }));
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Failed to create connection', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to update an existing broker connection
 */
export const useUpdateBrokerConnection = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BrokerConnection> }) => {
      const response = await api.patch(`/brokers/api/connections/${id}/`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: brokerQueryKeys.detail(id) });
      
      // Snapshot the previous value
      const previousConnection = queryClient.getQueryData<BrokerConnection>(brokerQueryKeys.detail(id));
      
      // Optimistically update to the new value
      if (previousConnection) {
        queryClient.setQueryData<BrokerConnection>(
          brokerQueryKeys.detail(id),
          { ...previousConnection, ...data }
        );
      }
      
      return { previousConnection };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConnection) {
        queryClient.setQueryData(
          brokerQueryKeys.detail(variables.id),
          context.previousConnection
        );
      }
      dispatch(showToast({ 
        message: 'Failed to update connection', 
        type: 'error' 
      }));
    },
    onSuccess: (data, variables) => {
      // Update the cache with the server response
      queryClient.setQueryData(
        brokerQueryKeys.detail(variables.id),
        data
      );
      dispatch(showToast({ 
        message: 'Connection updated successfully', 
        type: 'success' 
      }));
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
    },
  });
};

/**
 * Hook to delete a broker connection
 */
export const useDeleteBrokerConnection = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/brokers/api/connections/${id}/`);
      return id;
    },
    onMutate: async (id: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: brokerQueryKeys.lists() });
      
      // Snapshot the previous value
      const previousConnections = queryClient.getQueryData<BrokerConnection[]>(brokerQueryKeys.lists());
      
      // Optimistically remove the connection
      if (previousConnections) {
        queryClient.setQueryData<BrokerConnection[]>(
          brokerQueryKeys.lists(),
          previousConnections.filter(connection => connection.id !== id)
        );
      }
      
      return { previousConnections };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConnections) {
        queryClient.setQueryData(
          brokerQueryKeys.lists(),
          context.previousConnections
        );
      }
      dispatch(showToast({ 
        message: 'Failed to delete connection', 
        type: 'error' 
      }));
    },
    onSuccess: () => {
      dispatch(showToast({ 
        message: 'Connection deleted successfully', 
        type: 'success' 
      }));
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
    },
  });
};

/**
 * Hook to test broker credentials without saving
 */
export const useTestConnection = () => {
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (testData: TestConnectionData) => {
      const response = await api.post('/brokers/api/connections/test_connection/', testData);
      return response.data;
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Connection test failed', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to validate an existing broker connection
 */
export const useValidateBroker = () => {
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (id: number): Promise<ValidationResult> => {
      const response = await api.post(`/brokers/api/connections/${id}/validate/`);
      return response.data;
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Validation failed', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to set a broker connection as default
 */
export const useSetDefaultBroker = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/brokers/api/connections/${id}/set_default/`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the connections list to refetch with updated default status
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Failed to set default connection', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to fetch error logs for a broker connection
 */
export const useBrokerErrorLogs = (connectionId: number, page: number = 1, pageSize: number = 10) => {
  return useQuery<PaginatedResponse<BrokerErrorLog>>({
    queryKey: [...brokerQueryKeys.errors(connectionId), page, pageSize],
    queryFn: async () => {
      const response = await api.get(
        `/brokers/api/connections/${connectionId}/errors/?page=${page}&page_size=${pageSize}`
      );
      return response.data;
    },
    enabled: !!connectionId,
  });
};

/**
 * Hook to initiate OAuth flow
 */
export const useInitiateOAuth = () => {
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (data: { environment: string; scope?: string }) => {
      const response = await api.post('/brokers/api/connections/initiate_oauth/', data);
      return response.data;
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Failed to initiate OAuth', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to complete OAuth flow
 */
export const useOAuthCallback = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (data: { code: string; state: string; environment: string }) => {
      const response = await api.get(
        `/brokers/api/oauth/callback/?code=${data.code}&state=${data.state}&environment=${data.environment}`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the connections list to include the new OAuth connection
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
      dispatch(showToast({ 
        message: 'OAuth connection established successfully', 
        type: 'success' 
      }));
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'OAuth authentication failed', 
        type: 'error' 
      }));
    },
  });
};

// Helper function for better error handling
export const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value;

  let stringified = '[Unable to stringify the thrown value]';
  try {
    stringified = JSON.stringify(value);
  } catch {}

  return new Error(`This value was thrown as is, not through an Error: ${stringified}`);
};

// --- File: useDebounce.ts ---
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// --- File: useMarketDataWebSocket.ts ---
// src/hooks/useMarketDataWebSocket.ts
import { useEffect, useRef } from "react";
import { useTradingStore } from "@/store/tradingStore";
import { MarketDataWebSocketService } from "@/services/websocket";

export function useMarketDataWebSocket() {
  const symbol = "BTC/USD"; // auto-connect to BTC/USD
  const updateBars = useTradingStore((s) => s.updateBars);
  const updateQuote = useTradingStore((s) => s.updateQuote);
  const updateTrades = useTradingStore((s) => s.updateTrades);

  const wsRef = useRef<MarketDataWebSocketService | null>(null);

  useEffect(() => {
    if (wsRef.current) return; // idempotent

    const wsService = new MarketDataWebSocketService((status) => {
      console.log("[MarketDataWS] status:", status);
      const setConn = useTradingStore.getState().setConnectionStatus;
      if (setConn) {
        const trading = useTradingStore.getState().isTradingConnected;
        setConn(status === "connected", trading);
      }
    });

    wsRef.current = wsService;

    // Bars handler
    const unsubBars = wsService.onMessage("bars", (payload: any) => {
       console.log("BAR payload:", payload);
      if (Array.isArray(payload)) {
        payload.forEach((b) => updateBars(b.symbol, b));
      } else {
        updateBars(payload.symbol, payload);
      }
    });

    // Quotes handler
    const unsubQuotes = wsService.onMessage("quotes", (payload: any) => {
      updateQuote(payload.symbol, payload);
    });

    // Trades handler
    const unsubTrades = wsService.onMessage("trades", (payload: any) => {
      updateTrades(payload.symbol, payload);
    });

    // Connect and subscribe automatically
    wsService.connect()
      .then(() => {
        console.log(`[MarketDataWS] subscribing to ${symbol}`);
        wsService.subscribe(symbol, "bars");
        wsService.subscribe(symbol, "quotes");
        wsService.subscribe(symbol, "trades");
      })
      .catch((err) => console.error("MarketDataWS failed to connect:", err));

    return () => {
      unsubBars();
      unsubQuotes();
      unsubTrades();
      wsService.disconnect();
      wsRef.current = null;
    };
  }, [updateBars, updateQuote, updateTrades]);
}

// --- File: useMarketInfo.ts ---
// src/hooks/useMarketInfo.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import{ type MarketClock, type MarketCalendarDay } from '@/store/tradingStore';
import { useTradingStore } from '@/store/tradingStore';

export const useMarketClock = (accountId: string) => {
  const updateMarketClock = useTradingStore(state => state.updateMarketClock);
  
  return useQuery<MarketClock>({
    queryKey: ['marketClock', accountId],
    queryFn: async () => {
      const response = await api.get(`/realtrade/trading-accounts/${accountId}/clock/`);
      updateMarketClock(response.data); // Update store with new data
      return response.data;
    },
    enabled: !!accountId,
    refetchInterval: 30000,
  });
};

export const useMarketCalendar = (accountId: string, startDate?: string, endDate?: string) => {
  const updateMarketCalendar = useTradingStore(state => state.updateMarketCalendar);
  
  return useQuery<MarketCalendarDay[]>({
    queryKey: ['marketCalendar', accountId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Ensure proper encoding of date parameters
      if (startDate) params.append('start', decodeURIComponent(startDate));
      if (endDate) params.append('end', decodeURIComponent(endDate));
      
      const url = `/realtrade/trading-accounts/${accountId}/calendar/?${params.toString()}`;
      const response = await api.get(url);
      
      // Update store with new data
      updateMarketCalendar(response.data);
      
      return response.data;
    },
    enabled: !!accountId,
  });
};

// --- File: useNotifications.ts ---
// hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type{ Notification, NotificationPreference, NotificationStats, BulkActionPayload } from '@/store/types/notifications';

// Queries
export const useNotifications = (params?: { category?: string; unread_only?: boolean; archived?: boolean }) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.unread_only) searchParams.append('unread_only', 'true');
      if (params?.archived) searchParams.append('archived', 'true');
      
      const response = await api.get(`/notifications/notifications/?${searchParams}`);
      return response.data.results as Notification[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useRecentNotifications = (limit: number = 10) => {
  return useQuery({
    queryKey: ['notifications', 'recent', limit],
    queryFn: async () => {
      const response = await api.get(`/notifications/notifications/recent/?limit=${limit}`);
      return response.data.notifications as Notification[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useNotificationStats = () => {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await api.get('/notifications/notifications/stats/');
      return response.data as NotificationStats;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await api.get('/notifications/preferences/');
      return response.data as NotificationPreference;
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/notifications/unread_count/');
      return response.data.count as number;
    },
    // WebSocket will keep this updated, so we can have a longer stale time
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Mutations
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.post(`/notifications/notifications/${notificationId}/mark_read/`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/notifications/notifications/mark_all_read/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};

export const useBulkAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: BulkActionPayload) => {
      const response = await api.post('/notifications/notifications/bulk_action/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreference>) => {
      const response = await api.patch('/notifications/preferences/', preferences);
      return response.data as NotificationPreference;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences'], data);
    },
  });
};

export const useTestNotification = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/notifications/preferences/test_notification/');
      return response.data;
    },
  });
};

// --- File: useNotificationWebSocket.ts ---
// hooks/useNotificationsWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationsStore } from '@/store/notificationStore';
import type{ Notification, WebSocketMessage } from '@/store/types/notifications';
// import { WebSocketMessage, Notification } from './types/notifications';
// import { useAuthStore } from './store/authStore';

export const useNotificationsWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();
  
  const {
    addNotification,
    markAsRead,
    setUnreadCount,
    setConnectionStatus,
    markAllAsRead,
    archiveNotification
  } = useNotificationsStore();
  
//   const { token, isAuthenticated } = useAuthStore();

  const connect = useCallback(() => {
    // if (!isAuthenticated || !token) {
    //   console.log('Not authenticated, skipping WebSocket connection');
    //   return;
    // }

    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications/`;
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('🔔 Notifications WebSocket connected');
        setConnectionStatus(true);
        
        // Clear any reconnect timeout
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔔 Notifications WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus(false);
        
        // Attempt reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('🔔 Attempting to reconnect WebSocket...');
          connect();
        }, 5000);
      };

      ws.current.onerror = (error) => {
        console.error('🔔 WebSocket error:', error);
        setConnectionStatus(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [token, isAuthenticated, setConnectionStatus]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    if (ws.current) {
      ws.current.close(1000, 'User initiated disconnect');
      ws.current = null;
    }
    
    setConnectionStatus(false);
  }, [setConnectionStatus]);

  const sendMessage = useCallback((action: string, data?: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        action,
        ...data,
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_established':
        console.log('🔔 WebSocket connection established');
        // Request initial data
        sendMessage('get_unread_count');
        sendMessage('get_recent', { limit: 20 });
        break;
        
      case 'notification':
        const notification: Notification = message.data;
        console.log('🔔 New notification received:', notification);
        addNotification(notification);
        
        // Show desktop notification if enabled and browser supports it
        if ('Notification' in window && Notification.permission === 'granted') {
          new window.Notification(notification.title, {
            body: notification.message,
            icon: '/notification-icon.png',
            tag: notification.id
          });
        }
        break;
        
      case 'unread_count':
        setUnreadCount(message.data.count);
        break;
        
      case 'success':
        console.log('🔔 WebSocket action success:', message.action, message.data);
        
        // Invalidate TanStack queries based on action
        if (message.action === 'mark_read' || message.action === 'mark_all_read') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
        }
        break;
        
      case 'error':
        console.error('🔔 WebSocket error:', message.message);
        break;
        
      default:
        console.warn('🔔 Unknown WebSocket message type:', message.type);
    }
  }, [addNotification, setUnreadCount, queryClient, sendMessage]);

  // WebSocket actions
  const markNotificationAsRead = useCallback((notificationId: string) => {
    sendMessage('mark_read', { notification_id: notificationId });
  }, [sendMessage]);

  const markAllNotificationsAsRead = useCallback(() => {
    sendMessage('mark_all_read');
  }, [sendMessage]);

  const archiveNotification = useCallback((notificationId: string) => {
    sendMessage('archive', { notification_id: notificationId });
  }, [sendMessage]);

  const getUnreadCount = useCallback(() => {
    sendMessage('get_unread_count');
  }, [sendMessage]);

  const getRecentNotifications = useCallback((limit: number = 20) => {
    sendMessage('get_recent', { limit });
  }, [sendMessage]);

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    isConnected: useNotificationsStore(state => state.isConnected),
    markNotificationAsRead,
    markAllNotificationsAsRead,
    archiveNotification,
    getUnreadCount,
    getRecentNotifications,
    sendPing: () => sendMessage('ping')
  };
};


// --- File: usePortfolios.ts ---
// src/hooks/usePortfolios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { usePortfolioStore } from '@/store/portfolioStore';


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
  
  // Frontend-only computed properties (optional)
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



// Add to existing interfaces
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


// hooks/usePortfolios.ts - Updated mutation
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
      
      // Update store
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
    onSuccess: (data, subscriptionId) => {
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
      
      // Update store
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
    onSuccess: (data, variables) => {
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
      console.log("BACK h TEST: ", response )
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

      console.log("BACK TEST: ", response )

      return response.data;
    },
  });
};

export const usePortfolioBacktest = (backtestId: number) => {
  return useQuery<PortfolioBacktest>({
    queryKey: portfolioQueryKeys.backtest(backtestId),
    queryFn: async () => {
      const response = await api.get(`/realtrade/portfolio-backtests/${backtestId}/`);
      console.log("BACK TEST ID: ", response )
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
      console.log("BACK TEST RESULTS: ", response )
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
      console.log("BACK TEST CHART: ", response )
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
      console.log("BACK TEST compare: ", response )
      return response.data;
    },
    enabled: backtestIds.length > 0,
  });
};

// --- File: useTrading.ts ---
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
        console.log("❌ useHistoricalBars: No symbol provided");
        return [];
      }

      // Set loading state
      setMarketDataLoading(symbol, true, loadMore);

      try {
        console.log("🚀 useHistoricalBars: Fetching data", { 
          symbol, 
          timeframe, 
          limit, 
          loadMore 
        });

        let startDate: Date;
        let endDate: Date;

        if (loadMore) {
          // Lazy loading: fetch older data before current oldest bar
          const oldestBarTime = getOldestBarTime(symbol);
          if (!oldestBarTime) {
            console.log("📭 No existing bars found for lazy loading");
            return [];
          }

          endDate = new Date(oldestBarTime * 1000);
          const { start } = calculateDateRange(timeframe, limit);
          startDate = start;
          
          console.log("📥 Lazy loading older data:", {
            before: endDate.toISOString(),
            start: startDate.toISOString(),
            timeframe,
            limit
          });
        } else {
          // Initial load: use dynamic date range based on timeframe and limit
          const dynamicLimit = calculateDynamicLimit(timeframe, limit);
          const range = calculateDateRange(timeframe, dynamicLimit);
          startDate = range.start;
          endDate = range.end;
          
          console.log("📥 Initial load with dynamic range:", {
            timeframe,
            limit,
            dynamicLimit,
            start: startDate.toISOString(),
            end: endDate.toISOString()
          });
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

        console.log("📈 API Response:", {
          symbol,
          timeframe,
          loadMore,
          requested: limit,
          received: bars.length,
          dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`
        });

        if (!Array.isArray(bars)) {
          throw new Error(`Invalid response format: expected array, got ${typeof bars}`);
        }

        const normalized = bars
          .map((d: any) => normalizeBar(d))
          .filter((c: CandleWithVolume | null): c is CandleWithVolume => c !== null);

        console.log("✅ Normalized bars:", {
          original: bars.length,
          normalized: normalized.length,
          symbol,
          timeframe
        });

        // Store data based on load type
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
        console.error("❌ useHistoricalBars error:", error);
        setMarketDataError(symbol, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      } finally {
        setMarketDataLoading(symbol, false, loadMore);
      }
    },
    enabled: !!symbol,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Lazy loading mutation
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
      
      // Trigger the query
      return queryClient.fetchQuery({
        queryKey,
        queryFn: () => [] // Actual logic is in useHistoricalBars
      });
    },
    onError: (error, variables) => {
      console.error('Lazy loading failed:', error);
    },
  });
};

// Enhanced hook for chart data with real-time updates
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


// --- File: useTradingWebSocket.ts ---
import { useEffect, useRef, useCallback } from 'react';
import { useTradingStore } from '@/store/tradingStore';
import { TradingWebSocketService } from '@/services/websocket';
import {type TradeEvent } from '@/store/types/trading';
import { getCookie } from '@/utils/cookies';

export const useTradingWebSocket = (accountId: string) => {
  const accessToken = getCookie('access_token');

  const wsServiceRef = useRef<TradingWebSocketService | null>(null);
  
  const { 
    updateAccount, 
    updatePositions, 
    updateOrders, 
    addTradeEvent,
    setConnectionStatus 
  } = useTradingStore();
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!accessToken || !accountId) return;
    
    const wsService = new TradingWebSocketService(
      accountId,
      accessToken,
      (status) => {
        setConnectionStatus(status === 'connected', false);
      }
    );
    
    wsServiceRef.current = wsService;
    
    // Set up message handlers
    const unsubscribeAccount = wsService.onMessage('account_update', (data) => {
      updateAccount(data);
    });
    
    const unsubscribePositions = wsService.onMessage('position_update', (data) => {
      updatePositions(data);
    });
    
    const unsubscribeOrders = wsService.onMessage('order_update', (data) => {
      updateOrders(data);
      addTradeEvent({
        type: 'order_update',
        symbol: data.symbol,
        message: `Order ${data.order_id} updated to ${data.status}`,
        timestamp: new Date(),
      } as TradeEvent);
    });
    
    const unsubscribePortfolio = wsService.onMessage('portfolio_summary', (data) => {
      // Update portfolio summary in store
      useTradingStore.getState().updatePortfolioSummary(data);
    });
    
    const unsubscribeErrors = wsService.onMessage('error', (data) => {
      addTradeEvent({
        type: 'error',
        message: data.message,
        timestamp: new Date(),
      } as TradeEvent);
    });
    
    // Connect to WebSocket
    wsService.connect().catch(error => {
      console.error('Failed to connect to trading WebSocket:', error);
      addTradeEvent({
        type: 'error',
        message: 'Failed to connect to trading updates',
        timestamp: new Date(),
      } as TradeEvent);
    });
    
    // Subscribe to all channels
    wsService.subscribe(['account', 'positions', 'orders', 'portfolio']);
    
    return () => {
      unsubscribeAccount();
      unsubscribePositions();
      unsubscribeOrders();
      unsubscribePortfolio();
      unsubscribeErrors();
      wsService.disconnect();
    };
  }, [accessToken, accountId, updateAccount, updatePositions, updateOrders, addTradeEvent, setConnectionStatus]);
  
  // Function to manually subscribe/unsubscribe to channels
  const subscribe = useCallback((channels: string[]) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.subscribe(channels);
    }
  }, []);
  
  const unsubscribe = useCallback((channels: string[]) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.unsubscribe(channels);
    }
  }, []);
  
  const sendMessage = useCallback((type: string, data: any = {}) => {
    if (wsServiceRef.current) {
      return wsServiceRef.current.sendMessage(type, data);
    }
    return Promise.reject(new Error('WebSocket not connected'));
  }, []);
  
  return {
    subscribe,
    unsubscribe,
    sendMessage,
    isConnected: wsServiceRef.current?.isConnected || false
  };
};

// --- File: useWatchList.ts ---
// src/hooks/useWatchlist.ts
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { api } from '@/services/api';

export interface Watchlist {
  id: number;
  name: string;
  symbols: string[];
  created_at: string;
  updated_at: string;
  trading_account: number;
}

export interface CreateWatchlistRequest {
  name: string;
  symbols?: string[];
}

export interface UpdateWatchlistRequest {
  name?: string;
  symbols?: string[];
}

export const useWatchlists = (accountId: string) => {
  return useQuery<Watchlist[]>({
    queryKey: ['watchlists', accountId],
    queryFn: async () => {
      const response = await api.get(`/realtrade/watchlists/`, {
        params: { trading_account: accountId }
      });
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useWatchlist = (watchlistId: number) => {
  return useQuery<Watchlist>({
    queryKey: ['watchlist', watchlistId],
    queryFn: async () => {
      const response = await api.get(`/realtrade/watchlists/${watchlistId}/`);
      return response.data;
    },
    enabled: !!watchlistId,
  });
};

export const useCreateWatchlist = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateWatchlistRequest) => {
      const response = await api.post('/realtrade/watchlists/', {
        ...data,
        trading_account: accountId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists', accountId] });
    },
  });
};

export const useUpdateWatchlist = (watchlistId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateWatchlistRequest) => {
      const response = await api.patch(`/realtrade/watchlists/${watchlistId}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', watchlistId] });
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });
};

export const useDeleteWatchlist = (watchlistId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/realtrade/watchlists/${watchlistId}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });
};


type AddToWatchlistMutationVariables = {
  watchlistId: number;
  symbol: string;
};

export const useAddToWatchlist = (options?: UseMutationOptions<any, unknown, AddToWatchlistMutationVariables>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ watchlistId, symbol }) => {
      const response = await api.post(`/realtrade/watchlists/${watchlistId}/add_asset/`, {
        symbol
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', variables.watchlistId] });
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
    ...options
  });
};

type RemoveFromWatchlistMutationVariables = {
  watchlistId: number;
  symbol: string;
};

export const useRemoveFromWatchlist = (options?: UseMutationOptions<any, unknown, RemoveFromWatchlistMutationVariables>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ watchlistId, symbol }) => {
      const response = await api.post(`/realtrade/watchlists/${watchlistId}/remove_asset/`, {
        symbol
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', variables.watchlistId] });
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
    ...options
  });
};

// --- File: useWindowSize.ts ---
// src/hooks/useWindowSize.ts
import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}



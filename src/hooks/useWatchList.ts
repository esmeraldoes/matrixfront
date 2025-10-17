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

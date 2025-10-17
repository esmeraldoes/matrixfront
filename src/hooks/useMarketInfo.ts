// src/hooks/useMarketInfo.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type{ MarketCalendarDay } from '@/store/types/trading';
import type{ MarketClock } from '@/store/types/trading';

import { useTradingStore } from '@/store/tradingStore';




export const useMarketClock = (accountId: string) => {
  const updateMarketClock = useTradingStore(state => state.updateMarketClock);
  
  return useQuery<MarketClock>({
    queryKey: ['marketClock', accountId],
    queryFn: async () => {
      const response = await api.get(`/realtrade/trading-accounts/${accountId}/clock/`);
      updateMarketClock(response.data);
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
      
      if (startDate) params.append('start', decodeURIComponent(startDate));
      if (endDate) params.append('end', decodeURIComponent(endDate));
      
      const url = `/realtrade/trading-accounts/${accountId}/calendar/?${params.toString()}`;
      const response = await api.get(url);
      
      updateMarketCalendar(response.data);
      
      return response.data;
    },
    enabled: !!accountId,
  });
};


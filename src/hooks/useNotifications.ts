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
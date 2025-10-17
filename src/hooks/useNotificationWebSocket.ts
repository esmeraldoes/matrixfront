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

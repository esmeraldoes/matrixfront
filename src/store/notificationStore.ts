// stores/notificationsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type{ Notification, NotificationStats, NotificationPreference } from './types/notifications';

interface NotificationsState {
  // State
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreference | null;
  stats: NotificationStats | null;
  isConnected: boolean;
  isLoading: boolean;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  setUnreadCount: (count: number) => void;
  setPreferences: (preferences: NotificationPreference) => void;
  setStats: (stats: NotificationStats) => void;
  setConnectionStatus: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  // Derived state
  unreadNotifications: Notification[];
  recentNotifications: Notification[];
}

export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      preferences: null,
      stats: null,
      isConnected: false,
      isLoading: false,

      // Actions
      setNotifications: (notifications) => set({ notifications }),
      
      addNotification: (notification) => {
        const { notifications } = get();
        const updatedNotifications = [notification, ...notifications].slice(0, 50); // Keep only recent 50
        
        set({ 
          notifications: updatedNotifications,
          unreadCount: notification.is_read ? get().unreadCount : get().unreadCount + 1
        });
      },

      markAsRead: (notificationId) => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        );
        
        const newUnreadCount = updatedNotifications.filter(n => !n.is_read).length;
        
        set({ 
          notifications: updatedNotifications,
          unreadCount: newUnreadCount
        });
      },

      markAllAsRead: () => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(notif => ({
          ...notif,
          is_read: true
        }));
        
        set({ 
          notifications: updatedNotifications,
          unreadCount: 0
        });
      },

      archiveNotification: (notificationId) => {
        const { notifications } = get();
        const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
        const newUnreadCount = updatedNotifications.filter(n => !n.is_read).length;
        
        set({ 
          notifications: updatedNotifications,
          unreadCount: newUnreadCount
        });
      },

      removeNotification: (notificationId) => {
        const { notifications } = get();
        const notification = notifications.find(n => n.id === notificationId);
        const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
        const newUnreadCount = notification?.is_read ? get().unreadCount : Math.max(0, get().unreadCount - 1);
        
        set({ 
          notifications: updatedNotifications,
          unreadCount: newUnreadCount
        });
      },

      setUnreadCount: (unreadCount) => set({ unreadCount }),
      setPreferences: (preferences) => set({ preferences }),
      setStats: (stats) => set({ stats }),
      setConnectionStatus: (isConnected) => set({ isConnected }),
      setLoading: (isLoading) => set({ isLoading }),

      // Derived state
      unreadNotifications: () => get().notifications.filter(n => !n.is_read),
      recentNotifications: () => get().notifications.slice(0, 10), // Last 10 notifications
    }),
    {
      name: 'notifications-store',
    }
  )
);
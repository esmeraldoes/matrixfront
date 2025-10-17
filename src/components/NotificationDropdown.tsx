// components/NotificationDropdown.tsx
import React from 'react';
import { Loader2, BellOff, CheckCircle2, Settings } from 'lucide-react';
import { type Notification } from '@/store/types/notifications';
import { NotificationItem } from './NotificationItem';
import { useMarkAllAsRead } from '../hooks/useNotifications';
import { useNotificationsWebSocket } from '@/hooks/useNotificationWebSocket';


interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isLoading,
  unreadCount,
  onClose,
}) => {
  const { markAllNotificationsAsRead } = useNotificationsWebSocket();
  const markAllAsReadMutation = useMarkAllAsRead();

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
    markAllNotificationsAsRead();
  };

  const handleViewAll = () => {
    onClose();
    window.location.href = '/notifications';
  };

  const handleSettings = () => {
    onClose();
    window.location.href = '/notifications/settings';
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark all read
            </button>
          )}
          <button
            onClick={handleSettings}
            className="text-gray-500 hover:text-gray-700"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <BellOff className="h-12 w-12 mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleViewAll}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};
// components/NotificationItem.tsx
import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import type{ Notification } from '@/store/types/notifications';
import { useNotificationsWebSocket } from '@/hooks/useNotificationWebSocket';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
}) => {
  const { markNotificationAsRead, archiveNotification } = useNotificationsWebSocket();

  const handleClick = () => {
    if (!notification.is_read) {
      markNotificationAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    
    onClose();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    archiveNotification(notification.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300';
      case 'high': return 'bg-orange-100 border-orange-300';
      case 'medium': return 'bg-blue-100 border-blue-300';
      case 'low': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-l-4 ${
        getPriorityColor(notification.priority)
      } ${!notification.is_read ? 'bg-blue-50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <span className="text-lg">{notification.icon}</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium truncate ${
              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {new Date(notification.created_at).toLocaleTimeString()}
              </span>
              
              {notification.is_actionable && (
                <span className="flex items-center text-xs text-blue-600">
                  {notification.action_text}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
          {!notification.is_read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
          )}
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
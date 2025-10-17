// components/NotificationBell.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { useNotificationsStore } from '@/store/notificationStore';
import { useNotificationsWebSocket } from '@/hooks/useNotificationWebSocket';
import { useUnreadCount, useRecentNotifications } from '../hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { unreadCount } = useNotificationsStore();
  const { isConnected } = useNotificationsWebSocket();
  const { data: unreadCountData, isLoading } = useUnreadCount();
  const { data: recentNotifications, isLoading: isLoadingRecent } = useRecentNotifications(10);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayCount = unreadCountData || unreadCount;
  const hasUnread = displayCount > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
        aria-label="Notifications"
      >
        {hasUnread ? (
          <BellRing className="h-6 w-6 text-blue-600" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {/* Unread Badge */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-500 text-xs font-bold text-white">
              {displayCount > 99 ? '99+' : displayCount}
            </span>
          </span>
        )}
        
        {/* Connection Status Dot */}
        <span
          className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationDropdown
          notifications={recentNotifications || []}
          isLoading={isLoadingRecent}
          unreadCount={displayCount}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
// types/notifications.ts
export interface Notification {
  id: string;
  type: string;
  category: 'payment' | 'affiliate' | 'security' | 'system' | 'marketing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data: Record<string, any>;
  icon: string;
  color: string;
  is_read: boolean;
  is_delivered: boolean;
  is_archived: boolean;
  is_actionable: boolean;
  action_url?: string;
  action_text?: string;
  created_at: string;
  is_new: boolean;
}

export interface NotificationPreference {
  id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  websocket_enabled: boolean;
  payment_notifications: boolean;
  commission_notifications: boolean;
  payout_notifications: boolean;
  tier_notifications: boolean;
  security_notifications: boolean;
  system_notifications: boolean;
  marketing_notifications: boolean;
  sound_enabled: boolean;
  desktop_notifications: boolean;
  unread_badge: boolean;
  websocket_connected: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface WebSocketMessage {
  type: 'notification' | 'unread_count' | 'connection_established' | 'success' | 'error';
  action?: string;
  data: any;
  message_id?: string;
}

export interface MarkAsReadPayload {
  notification_id: string;
}

export interface BulkActionPayload {
  action: 'mark_read' | 'archive' | 'delete';
  notification_ids: string[];
}
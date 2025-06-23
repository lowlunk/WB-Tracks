import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface StoredNotification {
  id: string;
  type: 'low_stock' | 'system' | 'activity';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  seen: boolean;
  componentNumber?: string;
  location?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  lowStockAlerts: boolean;
  systemAlerts: boolean;
  activityAlerts: boolean;
  lowStockThreshold: number;
  showToasts: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    lowStockAlerts: true,
    systemAlerts: true,
    activityAlerts: true,
    lowStockThreshold: 5,
    showToasts: true
  });
  const { toast } = useToast();

  // Load notifications and settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('wb-tracks-notifications');
    if (stored) {
      try {
        const parsedNotifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error('Failed to parse stored notifications:', error);
      }
    }

    const storedSettings = localStorage.getItem('wb-tracks-notification-settings');
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (error) {
        console.error('Failed to parse stored settings:', error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wb-tracks-notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wb-tracks-notification-settings', JSON.stringify(settings));
  }, [settings]);

  const addNotification = (notification: Omit<StoredNotification, 'id' | 'timestamp' | 'seen'>) => {
    const newNotification: StoredNotification = {
      ...notification,
      id: `${notification.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      seen: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification for new notifications if enabled and notifications are enabled
    if (settings?.enabled && settings?.showToasts) {
      toast({
        title: notification.title,
        description: notification.description,
        variant: notification.severity === 'critical' ? 'destructive' : 'default',
      });
    }

    return newNotification.id;
  };

  const markAsSeen = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, seen: true } : n
      )
    );
  };

  const markAllAsSeen = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, seen: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
  };

  // Get counts
  const unreadCount = notifications.filter(n => !n.seen).length;
  const totalCount = notifications.length;

  return {
    notifications,
    settings,
    unreadCount,
    totalCount,
    addNotification,
    markAsSeen,
    markAllAsSeen,
    removeNotification,
    clearAllNotifications,
    updateSettings,
  };
}
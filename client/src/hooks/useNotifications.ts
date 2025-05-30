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

export function useNotifications() {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const { toast } = useToast();

  // Load notifications from localStorage on mount
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
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wb-tracks-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification: Omit<StoredNotification, 'id' | 'timestamp' | 'seen'>) => {
    const newNotification: StoredNotification = {
      ...notification,
      id: `${notification.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      seen: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification for new notifications
    toast({
      title: notification.title,
      description: notification.description,
      variant: notification.severity === 'critical' ? 'destructive' : 'default',
    });

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

  // Get counts
  const unreadCount = notifications.filter(n => !n.seen).length;
  const totalCount = notifications.length;

  return {
    notifications,
    unreadCount,
    totalCount,
    addNotification,
    markAsSeen,
    markAllAsSeen,
    removeNotification,
    clearAllNotifications,
  };
}
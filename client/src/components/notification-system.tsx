import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, X, AlertTriangle, Package, TrendingDown } from "lucide-react";

interface NotificationSystemProps {
  className?: string;
}

interface Notification {
  id: string;
  type: 'low_stock' | 'transfer' | 'system';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  componentNumber?: string;
  location?: string;
  acknowledged?: boolean;
}

export default function NotificationSystem({ className = "" }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isConnected } = useWebSocket();

  // Fetch low stock alerts
  const { data: lowStockItems } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Convert low stock items to notifications
  useEffect(() => {
    if (lowStockItems && Array.isArray(lowStockItems)) {
      const lowStockNotifications: Notification[] = lowStockItems.map((item: any) => ({
        id: `low-stock-${item.component.id}-${item.location.id}`,
        type: 'low_stock' as const,
        title: 'Low Stock Alert',
        description: `${item.component.componentNumber} in ${item.location.name} has ${item.quantity} units remaining`,
        severity: item.quantity === 0 ? 'critical' as const : 'warning' as const,
        timestamp: new Date(),
        componentNumber: item.component.componentNumber,
        location: item.location.name,
        acknowledged: false
      }));

      // Update notifications, avoiding duplicates
      setNotifications(prev => {
        const existingIds = new Set(prev.filter(n => n.type !== 'low_stock').map(n => n.id));
        const newNotifications = lowStockNotifications.filter(n => !existingIds.has(n.id));
        return [...prev.filter(n => n.type !== 'low_stock'), ...lowStockNotifications];
      });
    }
  }, [lowStockItems]);

  // Listen for real-time WebSocket updates
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'INVENTORY_UPDATED') {
          // Create notification for inventory changes
          const notification: Notification = {
            id: `transfer-${Date.now()}`,
            type: 'transfer',
            title: 'Inventory Updated',
            description: 'Items have been transferred between locations',
            severity: 'info',
            timestamp: new Date(),
            acknowledged: false
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 20)); // Keep last 20 notifications
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    if (isConnected) {
      window.addEventListener('message', handleWebSocketMessage);
      return () => window.removeEventListener('message', handleWebSocketMessage);
    }
  }, [isConnected]);

  const acknowledgeNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, acknowledged: true } : n)
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unacknowledgedCount = notifications.filter(n => !n.acknowledged).length;
  const criticalCount = notifications.filter(n => n.severity === 'critical' && !n.acknowledged).length;

  const getNotificationIcon = (type: string, severity: string) => {
    if (type === 'low_stock') {
      return severity === 'critical' ? 
        <AlertTriangle className="h-4 w-4 text-red-500" /> : 
        <TrendingDown className="h-4 w-4 text-yellow-500" />;
    }
    if (type === 'transfer') {
      return <Package className="h-4 w-4 text-blue-500" />;
    }
    return <Bell className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unacknowledgedCount > 0 && (
          <Badge 
            variant={criticalCount > 0 ? "destructive" : "secondary"}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <Card className="absolute right-0 top-12 w-80 max-w-[90vw] z-50 shadow-lg">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {unacknowledgedCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {unacknowledgedCount} new notification{unacknowledgedCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-b-0 ${
                      notification.acknowledged ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type, notification.severity)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        {!notification.acknowledged && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => acknowledgeNotification(notification.id)}
                            className="text-xs h-6 px-2"
                          >
                            Ack
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeNotification(notification.id)}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50 dark:bg-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotifications([])}
                  className="w-full text-sm"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
          <Alert variant="destructive" className="shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {criticalCount} critical stock alert{criticalCount !== 1 ? 's' : ''} require immediate attention
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

interface DismissedAlert {
  id: string;
  dismissedAt: number;
  componentId: number;
  locationId: number;
  quantity: number;
  reason?: string;
}

export default function AlertBanner() {
  // Disabled per user preference - no banner popups
  return null;
  const [dismissedAlerts, setDismissedAlerts] = useState<Map<string, DismissedAlert>>(new Map());
  const { settings } = useNotifications();

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dismissedLowStockAlerts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const alertMap = new Map<string, DismissedAlert>();
        
        // Convert array back to Map and clean expired dismissals (older than 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        parsed.forEach((alert: DismissedAlert) => {
          if (alert.dismissedAt > sevenDaysAgo) {
            alertMap.set(alert.id, alert);
          }
        });
        
        setDismissedAlerts(alertMap);
      } catch (error) {
        console.warn('Failed to load dismissed alerts:', error);
      }
    }
  }, []);

  // Save dismissed alerts to localStorage
  useEffect(() => {
    const alertArray = Array.from(dismissedAlerts.values());
    localStorage.setItem('dismissedLowStockAlerts', JSON.stringify(alertArray));
  }, [dismissedAlerts]);

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000,
  });

  // Only show critical alerts (out of stock items)
  const criticalAlerts = lowStockItems
    .filter((item: any) => item.quantity === 0)
    .filter((item: any) => !dismissedAlerts.has(`critical-${item.component.id}-${item.location.id}`));

  const dismissAllCritical = () => {
    const alertIds = criticalAlerts.map((item: any) => `critical-${item.component.id}-${item.location.id}`);
    setDismissedAlerts(prev => new Set([...prev, ...alertIds]));
  };

  // Don't show alerts if notifications are disabled in settings
  if (criticalAlerts.length === 0 || !settings?.enabled) {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Alert variant="destructive" className="shadow-lg border-red-500 bg-red-50 dark:bg-red-950">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {criticalAlerts.length} critical stock alert{criticalAlerts.length !== 1 ? 's' : ''} - items out of stock
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissAllCritical}
            className="text-red-700 hover:bg-red-100 ml-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
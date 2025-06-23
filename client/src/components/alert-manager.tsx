import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertTriangle, Package, CheckCircle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

interface AlertItem {
  id: string;
  type: 'low_stock' | 'critical_stock' | 'system';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  componentNumber?: string;
  location?: string;
  quantity?: number;
  minStock?: number;
  dismissed?: boolean;
  timestamp: Date;
}

interface AlertManagerProps {
  className?: string;
}

export default function AlertManager({ className = "" }: AlertManagerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showAlerts, setShowAlerts] = useState(false);
  const { settings } = useNotifications();

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dismissedAlerts');
    if (saved) {
      setDismissedAlerts(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save dismissed alerts to localStorage
  useEffect(() => {
    if (dismissedAlerts.size > 0) {
      localStorage.setItem('dismissedAlerts', JSON.stringify(Array.from(dismissedAlerts)));
    }
  }, [dismissedAlerts]);

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000,
  });

  // Convert low stock items to alerts
  const alerts: AlertItem[] = lowStockItems
    .filter((item: any) => !dismissedAlerts.has(`low-stock-${item.component.id}-${item.location.id}`))
    .map((item: any) => ({
      id: `low-stock-${item.component.id}-${item.location.id}`,
      type: item.quantity === 0 ? 'critical_stock' : 'low_stock',
      title: item.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
      description: `${item.component.componentNumber} in ${item.location.name} has ${item.quantity} units remaining`,
      severity: item.quantity === 0 ? 'critical' : 'warning',
      componentNumber: item.component.componentNumber,
      location: item.location.name,
      quantity: item.quantity,
      minStock: item.minStockLevel,
      timestamp: new Date()
    }));

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const dismissAllAlerts = () => {
    const allIds = alerts.map(alert => alert.id);
    setDismissedAlerts(prev => new Set([...prev, ...allIds]));
    setShowAlerts(false);
  };

  const clearDismissedAlerts = () => {
    setDismissedAlerts(new Set());
    localStorage.removeItem('dismissedAlerts');
  };

  // Disabled per user preference - no banner popups
  const showCriticalBanner = false;

  return (
    <div className={className}>
      {/* Critical Alert Banner disabled per user preference - no banner popups */}

      {/* Alert Details Modal disabled per user preference - use dedicated /low-stock page instead */}
    </div>
  );
}
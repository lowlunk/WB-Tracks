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

      {/* Alert Details Modal */}
      {showAlerts && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Inventory Alerts</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearDismissedAlerts}>
                      Reset Dismissed
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAlerts(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>No active alerts</p>
                    <p className="text-sm">All inventory levels are within normal ranges</p>
                  </div>
                ) : (
                  <>
                    {/* Critical Alerts */}
                    {criticalAlerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-red-800 dark:text-red-200">{alert.title}</p>
                              <p className="text-sm text-red-700 dark:text-red-300">{alert.description}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                                  {alert.componentNumber}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                                  {alert.location}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissAlert(alert.id)}
                              className="text-red-700 hover:bg-red-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Warning Alerts */}
                    {warningAlerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                        <Package className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-orange-800 dark:text-orange-200">{alert.title}</p>
                              <p className="text-sm text-orange-700 dark:text-orange-300">{alert.description}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                  {alert.componentNumber}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                  {alert.location}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                  Min: {alert.minStock}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissAlert(alert.id)}
                              className="text-orange-700 hover:bg-orange-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {alerts.length > 0 && (
                <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={dismissAllAlerts}
                    className="w-full"
                  >
                    Dismiss All Alerts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
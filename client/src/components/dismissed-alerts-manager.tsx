import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, RotateCcw } from "lucide-react";

interface DismissedAlert {
  id: string;
  dismissedAt: number;
  componentId: number;
  locationId: number;
  quantity: number;
  reason?: string;
}

export default function DismissedAlertsManager() {
  const [dismissedAlerts, setDismissedAlerts] = useState<DismissedAlert[]>([]);

  useEffect(() => {
    loadDismissedAlerts();
  }, []);

  const loadDismissedAlerts = () => {
    const saved = localStorage.getItem('dismissedLowStockAlerts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDismissedAlerts(parsed || []);
      } catch (error) {
        console.warn('Failed to load dismissed alerts:', error);
      }
    }
  };

  const clearExpiredAlerts = () => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const validAlerts = dismissedAlerts.filter(alert => alert.dismissedAt > sevenDaysAgo);
    
    localStorage.setItem('dismissedLowStockAlerts', JSON.stringify(validAlerts));
    setDismissedAlerts(validAlerts);
  };

  const undismissAlert = (alertId: string) => {
    const updatedAlerts = dismissedAlerts.filter(alert => alert.id !== alertId);
    localStorage.setItem('dismissedLowStockAlerts', JSON.stringify(updatedAlerts));
    setDismissedAlerts(updatedAlerts);
  };

  const clearAllDismissedAlerts = () => {
    localStorage.setItem('dismissedLowStockAlerts', JSON.stringify([]));
    setDismissedAlerts([]);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getExpiryStatus = (timestamp: number) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    
    if (timestamp < sevenDaysAgo) return 'expired';
    if (timestamp < threeDaysAgo) return 'expiring-soon';
    return 'active';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Dismissed Alerts Manager
        </CardTitle>
        <CardDescription>
          Manage and review dismissed low stock alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={clearExpiredAlerts}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Expired
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearAllDismissedAlerts}
              disabled={dismissedAlerts.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={loadDismissedAlerts}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {dismissedAlerts.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Showing {dismissedAlerts.length} dismissed alerts
              </div>
              {dismissedAlerts.map((alert) => {
                const expiryStatus = getExpiryStatus(alert.dismissedAt);
                return (
                  <div 
                    key={alert.id} 
                    className={`p-3 border rounded-lg ${
                      expiryStatus === 'expired' ? 'bg-red-50 border-red-200' :
                      expiryStatus === 'expiring-soon' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-gray-200 px-1 rounded">{alert.id}</code>
                          <Badge 
                            variant={
                              expiryStatus === 'expired' ? 'destructive' :
                              expiryStatus === 'expiring-soon' ? 'secondary' :
                              'outline'
                            }
                          >
                            {expiryStatus === 'expired' ? 'Expired' :
                             expiryStatus === 'expiring-soon' ? 'Expires Soon' :
                             'Active'}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div><strong>Component ID:</strong> {alert.componentId}</div>
                          <div><strong>Location ID:</strong> {alert.locationId}</div>
                          <div><strong>Quantity at dismissal:</strong> {alert.quantity}</div>
                          <div><strong>Dismissed:</strong> {formatDate(alert.dismissedAt)} ({getTimeAgo(alert.dismissedAt)})</div>
                          {alert.reason && (
                            <div><strong>Reason:</strong> {alert.reason}</div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => undismissAlert(alert.id)}
                        className="ml-2"
                        title="Restore this alert (it will appear again if conditions are met)"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Dismissed Alerts</h3>
              <p>
                Dismissed alerts will appear here for review and management.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
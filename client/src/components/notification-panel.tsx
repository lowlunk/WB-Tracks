import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package2, X } from "lucide-react";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
    refetchInterval: 30000,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20" onClick={onClose}>
      <div 
        className="absolute top-16 right-4 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">Low Stock Alerts</span>
                <Badge variant="destructive" className="text-xs">
                  {lowStockItems.length}
                </Badge>
              </div>
              
              {lowStockItems.slice(0, 5).map((item: any) => (
                <Card key={`${item.component.id}-${item.location.id}`} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.component.componentNumber}</p>
                      <p className="text-xs text-muted-foreground">{item.component.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.location.name}: {item.quantity} remaining
                      </p>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                </Card>
              ))}
              
              {lowStockItems.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{lowStockItems.length - 5} more alerts
                </p>
              )}
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package2 className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">Recent Activity</span>
              </div>
              
              {recentActivity.slice(0, 3).map((activity: any) => (
                <Card key={activity.id} className="p-3">
                  <div className="text-xs">
                    <p className="font-medium">{activity.component.componentNumber}</p>
                    <p className="text-muted-foreground">
                      {activity.transactionType === 'transfer' && 
                        `Transferred ${activity.quantity} from ${activity.fromLocation?.name} to ${activity.toLocation?.name}`
                      }
                      {activity.transactionType === 'add' && 
                        `Added ${activity.quantity} to ${activity.toLocation?.name}`
                      }
                      {activity.transactionType === 'consume' && 
                        `Consumed ${activity.quantity} from ${activity.fromLocation?.name}`
                      }
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {lowStockItems.length === 0 && recentActivity.length === 0 && (
            <div className="text-center py-8">
              <Package2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
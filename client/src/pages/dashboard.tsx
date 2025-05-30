import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import InventoryCard from "@/components/inventory-card";
import ComponentTable from "@/components/component-table";
import BarcodeScanner from "@/components/barcode-scanner";
import TransferModal from "@/components/transfer-modal";
import FloatingActionButton from "@/components/floating-action-button";
import AddComponentDialog from "@/components/add-component-dialog";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  Package, 
  Warehouse, 
  Factory, 
  AlertTriangle, 
  QrCode, 
  ArrowRightLeft, 
  Plus,
  TrendingUp,
  Activity
} from "lucide-react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddComponent, setShowAddComponent] = useState(false);

  // Connect to WebSocket for real-time updates
  useWebSocket();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  const { data: components, isLoading: componentsLoading } = useQuery({
    queryKey: ["/api/components", searchQuery],
    queryFn: ({ queryKey }) => {
      const [url, search] = queryKey;
      return fetch(search ? `${url}?search=${encodeURIComponent(search)}` : url, {
        credentials: "include",
      }).then(res => res.json());
    },
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
  });

  if (statsLoading) {
    return (
      <div className="wb-container py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 wb-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="wb-container py-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="wb-card border-l-4 border-l-[hsl(var(--wb-primary))]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Components</p>
                <p className="text-3xl font-bold text-[hsl(var(--wb-on-surface))]">
                  {stats?.totalComponents || 0}
                </p>
              </div>
              <div className="p-3 bg-[hsl(var(--wb-primary))]/10 rounded-full">
                <Package className="h-6 w-6 text-[hsl(var(--wb-primary))]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="wb-card border-l-4 border-l-[hsl(var(--wb-secondary))]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Main Inventory</p>
                <p className="text-3xl font-bold text-[hsl(var(--wb-on-surface))]">
                  {stats?.mainInventoryTotal || 0}
                </p>
              </div>
              <div className="p-3 bg-[hsl(var(--wb-secondary))]/10 rounded-full">
                <Warehouse className="h-6 w-6 text-[hsl(var(--wb-secondary))]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="wb-card border-l-4 border-l-[hsl(var(--wb-accent))]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Line Inventory</p>
                <p className="text-3xl font-bold text-[hsl(var(--wb-on-surface))]">
                  {stats?.lineInventoryTotal || 0}
                </p>
              </div>
              <div className="p-3 bg-[hsl(var(--wb-accent))]/10 rounded-full">
                <Factory className="h-6 w-6 text-[hsl(var(--wb-accent))]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="wb-card border-l-4 border-l-[hsl(var(--wb-error))]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
                <p className="text-3xl font-bold text-[hsl(var(--wb-on-surface))]">
                  {stats?.lowStockAlerts || 0}
                </p>
              </div>
              <div className="p-3 bg-[hsl(var(--wb-error))]/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-[hsl(var(--wb-error))]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="wb-card mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setShowScanner(true)}
              className="wb-btn-primary wb-touch-target min-h-[120px] flex-col gap-3"
            >
              <QrCode className="h-8 w-8" />
              <span className="text-lg font-medium">Scan Barcode</span>
            </Button>

            <Button
              onClick={() => setShowTransferModal(true)}
              className="wb-btn-secondary wb-touch-target min-h-[120px] flex-col gap-3"
            >
              <ArrowRightLeft className="h-8 w-8" />
              <span className="text-lg font-medium">Transfer Items</span>
            </Button>

            <Button
              variant="outline"
              className="wb-touch-target min-h-[120px] flex-col gap-3 border-[hsl(var(--wb-accent))] text-[hsl(var(--wb-accent))] hover:bg-[hsl(var(--wb-accent))]/10"
            >
              <Plus className="h-8 w-8" />
              <span className="text-lg font-medium">Add New Item</span>
            </Button>

            <Button
              variant="outline"
              className="wb-touch-target min-h-[120px] flex-col gap-3"
            >
              <Activity className="h-8 w-8" />
              <span className="text-lg font-medium">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <InventoryCard
          title="Main Inventory"
          description="Central storage area"
          icon={Warehouse}
          locationId={1}
          type="main"
          onTransfer={() => setShowTransferModal(true)}
        />

        <InventoryCard
          title="Line Inventory"
          description="Production line stock"
          icon={Factory}
          locationId={2}
          type="line"
          onTransfer={() => setShowTransferModal(true)}
        />
      </div>

      {/* Recent Activity */}
      <Card className="wb-card mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" className="text-[hsl(var(--wb-primary))]">
              View All Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 wb-skeleton" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity?.slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.transactionType === 'transfer' ? 'bg-blue-100 dark:bg-blue-900' :
                    activity.transactionType === 'add' ? 'bg-green-100 dark:bg-green-900' :
                    'bg-red-100 dark:bg-red-900'
                  }`}>
                    {activity.transactionType === 'transfer' && <ArrowRightLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    {activity.transactionType === 'add' && <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {activity.transactionType === 'remove' && <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium capitalize">
                        {activity.transactionType} {activity.transactionType === 'transfer' ? 'Items' : activity.transactionType === 'add' ? 'to Inventory' : 'from Inventory'}
                      </span>
                      <Badge variant="secondary" className="wb-badge-success">
                        Completed
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.component.componentNumber} - {activity.component.description} ({activity.quantity} units)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Database */}
      <Card className="wb-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-xl font-semibold">Component Database</CardTitle>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Input
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="wb-input w-full sm:w-80"
                />
              </div>
              <Button 
                onClick={() => setShowAddComponent(true)}
                className="wb-btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ComponentTable
            components={components || []}
            isLoading={componentsLoading}
            onEdit={(component) => console.log('Edit:', component)}
            onTransfer={() => setShowTransferModal(true)}
            onViewDetails={(component) => console.log('View details:', component)}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={(result) => {
            console.log('Scanned:', result);
            setShowScanner(false);
          }}
        />
      )}

      {showTransferModal && (
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onTransfer={(transfer) => {
            console.log('Transfer:', transfer);
            setShowTransferModal(false);
          }}
        />
      )}

      {showAddComponent && (
        <AddComponentDialog
          isOpen={showAddComponent}
          onClose={() => setShowAddComponent(false)}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onScan={() => setShowScanner(true)}
        onTransfer={() => setShowTransferModal(true)}
        onAddItem={() => setShowAddComponent(true)}
      />
    </div>
  );
}

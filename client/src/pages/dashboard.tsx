import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BarcodeScanner from "@/components/barcode-scanner";
import TransferModal from "@/components/transfer-modal";
import ConsumeModal from "@/components/consume-modal";
import AddComponentDialog from "@/components/add-component-dialog";
import AddInventoryDialog from "@/components/add-inventory-dialog";
import ComponentDetailModal from "@/components/component-detail-modal";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  QrCode,
  ArrowRightLeft,
  Plus,
  Activity,
  Package,
  Warehouse,
  Search,
  AlertTriangle,
  Download,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock
} from "lucide-react";

export default function Dashboard() {
  // Helper function to get activity icons
  const getActivityIcon = (transactionType: string) => {
    switch (transactionType) {
      case 'add':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'remove':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case 'consume':
        return <Zap className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [showConsumedInventory, setShowConsumedInventory] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [viewingComponent, setViewingComponent] = useState<any>(null);

  // Connect to WebSocket for real-time updates
  useWebSocket();

  // Data queries
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: components } = useQuery({
    queryKey: ["/api/components"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000,
  });

  const { data: consumedTransactions } = useQuery({
    queryKey: ["/api/transactions/consumed"],
    enabled: showConsumedInventory,
  });

  // Handle Generate Report functionality
  const handleGenerateReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      components: components?.length || 0,
      mainInventoryTotal: dashboardStats?.mainInventoryTotal || 0,
      lineInventoryTotal: dashboardStats?.lineInventoryTotal || 0,
      lowStockItems: lowStockItems?.length || 0,
      recentActivity: recentActivity?.slice(0, 10) || []
    };

    const csvContent = [
      'WB-Tracks Inventory Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Summary:',
      `Total Components,${reportData.components}`,
      `Main Inventory Total,${reportData.mainInventoryTotal}`,
      `Line Inventory Total,${reportData.lineInventoryTotal}`,
      `Low Stock Alerts,${reportData.lowStockItems}`,
      '',
      'Recent Activity:',
      'Type,Component,Quantity,Location,Date',
      ...reportData.recentActivity.map((activity: any) => 
        `${activity.transactionType},${activity.component?.componentNumber || 'N/A'},${activity.quantity},${activity.fromLocation?.name || activity.toLocation?.name || 'N/A'},${new Date(activity.createdAt).toLocaleString()}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wb-tracks-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleScanResult = (result: any) => {
    console.log("Scanned:", result);
    setShowScanner(false);
  };

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

  const lowStockAlerts = lowStockItems?.length || 0;

  return (
    <div className="wb-container wb-mobile-safe p-2 sm:p-4 pb-20 lg:pb-4 space-y-4 sm:space-y-6">
      {/* Low Stock Alerts */}
      {lowStockAlerts > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>{lowStockAlerts}</strong> items are running low on stock in both Main and Line inventory locations.
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2 text-orange-700 hover:text-orange-900"
              onClick={() => setShowConsumedInventory(true)}
            >
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="wb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Components</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalComponents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active in system
            </p>
          </CardContent>
        </Card>

        <Card className="wb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main Inventory</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.mainInventoryTotal || 0}</div>
            <p className="text-xs text-muted-foreground">
              Items in main storage
            </p>
          </CardContent>
        </Card>

        <Card className="wb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Line Inventory</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.lineInventoryTotal || 0}</div>
            <p className="text-xs text-muted-foreground">
              Items on production line
            </p>
          </CardContent>
        </Card>

        <Card className="wb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Items need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="wb-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
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
              onClick={() => setShowConsumeModal(true)}
              className="wb-touch-target min-h-[120px] flex-col gap-3 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Zap className="h-8 w-8" />
              <span className="text-lg font-medium">Consume Items</span>
            </Button>

            <Button
              onClick={handleGenerateReport}
              variant="outline"
              className="wb-touch-target min-h-[120px] flex-col gap-3"
            >
              <Download className="h-8 w-8" />
              <span className="text-lg font-medium">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="wb-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Component
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowAddComponent(true)}
              className="wb-btn-accent w-full wb-touch-target"
            >
              Add Component
            </Button>
          </CardContent>
        </Card>

        <Card className="wb-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Consumed Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowConsumedInventory(true)}
              variant="outline"
              className="w-full wb-touch-target"
            >
              View Consumed Items
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="wb-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <Button 
              variant="ghost" 
              className="text-[hsl(var(--wb-primary))]"
              onClick={() => setShowConsumedInventory(true)}
            >
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
                <Card 
                  key={activity.id} 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setViewingComponent({ id: activity.componentId })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.transactionType)}
                      <div>
                        <p className="font-medium text-sm">
                          {activity.component?.componentNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.component?.description} - {activity.quantity} units
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.quantity}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consumed Inventory Modal */}
      {showConsumedInventory && (
        <Card className="fixed inset-4 z-50 overflow-auto bg-white dark:bg-gray-900 shadow-2xl rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Consumed Inventory Tracking
            </CardTitle>
            <Button
              variant="ghost"
              onClick={() => setShowConsumedInventory(false)}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Today's Consumption</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {consumedTransactions?.filter((t: any) => 
                        new Date(t.createdAt).toDateString() === new Date().toDateString()
                      ).length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {consumedTransactions?.filter((t: any) => {
                        const date = new Date(t.createdAt);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return date >= weekAgo;
                      }).length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Consumed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {consumedTransactions?.length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {consumedTransactions?.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{transaction.component?.componentNumber}</p>
                        <p className="text-sm text-muted-foreground">{transaction.component?.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{transaction.quantity} units</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanResult}
      />

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransfer={() => {}}
      />

      <ConsumeModal
        isOpen={showConsumeModal}
        onClose={() => setShowConsumeModal(false)}
      />

      <AddComponentDialog
        isOpen={showAddComponent}
        onClose={() => setShowAddComponent(false)}
      />

      <AddInventoryDialog
        isOpen={showAddInventory}
        onClose={() => setShowAddInventory(false)}
      />

      {viewingComponent && (
        <ComponentDetailModal
          isOpen={!!viewingComponent}
          onClose={() => setViewingComponent(null)}
          componentId={viewingComponent.id}
        />
      )}
    </div>
  );
}
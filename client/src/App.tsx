import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { AlertTriangle, Package, TrendingDown, Bell, X } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import MainInventory from "@/pages/main-inventory";
import LineInventory from "@/pages/line-inventory";
import Inventory from "@/pages/inventory";
import AdminDashboard from "@/pages/admin";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import BarcodeScanner from "@/components/barcode-scanner";
import NotificationSystem from "@/components/notification-system";
import OnboardingTour from "@/components/onboarding-tour";

// Enhanced notification content component with dismissible banner
function NotificationContent() {
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const { data: lowStockItems } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000,
  });

  const { notifications, addNotification } = useNotifications();
  
  // Convert low stock items to notifications (only if not already added)
  useEffect(() => {
    if (lowStockItems && Array.isArray(lowStockItems)) {
      lowStockItems.forEach((item: any) => {
        const notificationId = `low-stock-${item.component.id}-${item.location.id}`;
        
        // Only add notification if it doesn't already exist
        if (!notifications.some(n => n.id === notificationId)) {
          addNotification({
            type: 'low_stock',
            title: 'Low Stock Alert',
            description: `${item.component.componentNumber} in ${item.location.name} has ${item.quantity} units remaining`,
            severity: item.quantity === 0 ? 'critical' : 'warning',
            componentNumber: item.component.componentNumber,
            location: item.location.name
          });
        }
      });
    }
  }, [lowStockItems, notifications, addNotification]);

  // Show dismissible banner for critical low stock items
  const criticalItems = lowStockItems?.filter((item: any) => item.quantity === 0) || [];
  const warningItems = lowStockItems?.filter((item: any) => item.quantity > 0 && item.quantity <= 5) || [];

  const dismissBanner = (bannerId: string) => {
    setDismissedBanners(prev => new Set(prev).add(bannerId));
  };

  if (notifications.length === 0 && criticalItems.length === 0 && warningItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No notifications at this time</p>
        <p className="text-sm">You'll see low stock alerts and system updates here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical Items Banner */}
      {criticalItems.length > 0 && !dismissedBanners.has('critical-banner') && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div className="flex-1">
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Critical: {criticalItems.length} item(s) out of stock</strong>
              <div className="mt-1 text-sm">
                {criticalItems.slice(0, 3).map((item: any, index: number) => (
                  <div key={index}>
                    {item.component.componentNumber} at {item.location.name}
                  </div>
                ))}
                {criticalItems.length > 3 && (
                  <div className="text-xs text-red-600">
                    ...and {criticalItems.length - 3} more
                  </div>
                )}
              </div>
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissBanner('critical-banner')}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Warning Items Banner */}
      {warningItems.length > 0 && !dismissedBanners.has('warning-banner') && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <TrendingDown className="h-4 w-4 text-yellow-600" />
          <div className="flex-1">
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Warning: {warningItems.length} item(s) running low</strong>
              <div className="mt-1 text-sm">
                {warningItems.slice(0, 3).map((item: any, index: number) => (
                  <div key={index}>
                    {item.component.componentNumber} at {item.location.name} ({item.quantity} left)
                  </div>
                ))}
                {warningItems.length > 3 && (
                  <div className="text-xs text-yellow-600">
                    ...and {warningItems.length - 3} more
                  </div>
                )}
              </div>
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissBanner('warning-banner')}
            className="text-yellow-600 hover:text-yellow-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Regular Notifications */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border ${
              notification.severity === 'critical'
                ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Package className={`h-5 w-5 mt-0.5 ${
                  notification.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <div>
                  <h4 className={`font-medium ${
                    notification.severity === 'critical' 
                      ? 'text-red-800 dark:text-red-200' 
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {notification.title}
                  </h4>
                  <p className={`text-sm ${
                    notification.severity === 'critical' 
                      ? 'text-red-700 dark:text-red-300' 
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {notification.description}
                  </p>
                  <p className={`text-xs mt-1 ${
                    notification.severity === 'critical' 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  const { shouldShowTour, completeTour } = useOnboarding();
  const { theme } = useTheme();

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading WB-Tracks...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification Banner Area */}
      {location !== '/login' && location !== '/register' && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <NotificationContent />
          </div>
        </div>
      )}

      <main className="flex flex-col min-h-screen">
        {location !== '/login' && location !== '/register' && (
          <Header />
        )}
        
        <div className="flex-1 pb-16 md:pb-0">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/main-inventory" component={MainInventory} />
            <Route path="/line-inventory" component={LineInventory} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>

        {location !== '/login' && location !== '/register' && (
          <BottomNavigation />
        )}
      </main>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(result) => {
          console.log('Scanned:', result);
          setShowScanner(false);
        }}
      />

      <NotificationSystem />

      <OnboardingTour
        isOpen={shouldShowTour}
        onClose={completeTour}
        mode="complete"
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
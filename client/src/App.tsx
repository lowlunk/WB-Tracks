import { Switch, Route, useLocation } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
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
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Package, TrendingDown, Bell, X } from "lucide-react";
import { useNotifications, type StoredNotification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

// Enhanced notification content component with persistent storage
function NotificationContent() {
  const { data: lowStockItems } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000,
  });

  const { notifications, addNotification, markAsSeen, removeNotification, markAllAsSeen } = useNotifications();
  
  // Convert low stock items to notifications
  if (lowStockItems && Array.isArray(lowStockItems)) {
    lowStockItems.forEach((item: any) => {
      notifications.push({
        id: `low-stock-${item.component.id}-${item.location.id}`,
        type: 'low_stock',
        title: 'Low Stock Alert',
        description: `${item.component.componentNumber} in ${item.location.name} has ${item.quantity} units remaining`,
        severity: item.quantity === 0 ? 'critical' : 'warning',
        timestamp: new Date(),
        componentNumber: item.component.componentNumber,
        location: item.location.name,
      });
    });
  }

  if (notifications.length === 0) {
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
      {notifications.map((notification: any) => (
        <Alert key={notification.id} variant={notification.severity === 'critical' ? 'destructive' : 'default'}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === 'low_stock' ? (
                notification.severity === 'critical' ? 
                  <AlertTriangle className="h-4 w-4 text-red-500" /> : 
                  <TrendingDown className="h-4 w-4 text-yellow-500" />
              ) : (
                <Package className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{notification.title}</h4>
              <AlertDescription className="mt-1">
                {notification.description}
              </AlertDescription>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
                {notification.componentNumber && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    #{notification.componentNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { showTour, completeTour, startTour } = useOnboarding();

  const handleScanClick = () => {
    setShowScanner(true);
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
  };

  const handleSettingsClick = () => {
    setLocation("/settings");
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading WB-Tracks...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Authenticated users see the main app
  return (
    <div className="min-h-screen bg-[hsl(var(--wb-background))]">
      <Header 
        onScanClick={handleScanClick}
        onNotificationClick={handleNotificationClick}
        onSettingsClick={handleSettingsClick}
      />
      <main className="pb-16 lg:pb-0">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/main-inventory" component={MainInventory} />
          <Route path="/line-inventory" component={LineInventory} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/settings" component={Settings} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation />

      {/* Global Modals */}
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

      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 p-4">
          <div className="bg-[hsl(var(--wb-surface))] rounded-lg max-w-4xl w-full max-h-[70vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[hsl(var(--wb-on-surface))]">Notifications</h2>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <NotificationContent />
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tour */}
      <OnboardingTour 
        isOpen={showTour} 
        onClose={completeTour} 
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

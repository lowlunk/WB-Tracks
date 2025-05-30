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

  // Show dismissible banner for critical low stock items
  const criticalItems = Array.isArray(lowStockItems) ? lowStockItems.filter((item: any) => item.quantity === 0) : [];
  const warningItems = Array.isArray(lowStockItems) ? lowStockItems.filter((item: any) => item.quantity > 0 && item.quantity <= 5) : [];

  const dismissBanner = (bannerId: string) => {
    setDismissedBanners(prev => new Set(prev).add(bannerId));
  };

  // Early return if no low stock items to display
  if (!Array.isArray(lowStockItems) || lowStockItems.length === 0 || (criticalItems.length === 0 && warningItems.length === 0)) {
    return null; // No notification content to show
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


    </div>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  const { showTour, completeTour } = useOnboarding();
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
        isOpen={showTour}
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
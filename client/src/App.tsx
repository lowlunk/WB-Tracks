import { Switch, Route, useLocation, Link } from "wouter";
import { useState, useEffect, Suspense, lazy } from "react";
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
import { ErrorBoundary, useErrorHandler } from "@/components/error-boundary";
import { AlertTriangle, Package, TrendingDown, Bell, X } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import MainInventory from "@/pages/main-inventory";
import LineInventory from "@/pages/line-inventory";
import Inventory from "@/pages/inventory";
import AlertBanner from "@/components/alert-banner";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import BarcodeScanner from "@/components/barcode-scanner";

import OnboardingTour from "@/components/onboarding-tour";

// Enhanced notification content component with dismissible banner
// Removed NotificationContent function - no banner popups per user preference

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  // Handle unhandled promise rejections
  useErrorHandler();

  // Debug logging
  console.log('Auth State:', { user, isLoading, isAuthenticated, location });

  // Only redirect if we're certain about authentication state
  useEffect(() => {
    if (!isLoading && isAuthenticated && (location === '/login' || location === '/register')) {
      console.log('Redirecting authenticated user to dashboard');
      navigate('/');
    }
  }, [isAuthenticated, isLoading, location, navigate]);

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

  // No login screen - auto-login handles authentication

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification Banner Area */}
      {location !== '/login' && location !== '/register' && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-2">
            {/* Removed NotificationContent - no banner popups per user preference */}
          </div>
        </div>
      )}

      <main className="flex flex-col min-h-screen">
        {location !== '/login' && location !== '/register' && (
          <Header 
            onScanClick={() => setShowScanner(true)}
            onNotificationClick={() => {}}
            onSettingsClick={() => navigate('/settings')}
          />
        )}

        <div className="flex-1 pb-16 md:pb-0">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/main-inventory" component={MainInventory} />
            <Route path="/line-inventory" component={LineInventory} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/low-stock">
              {() => {
                const LowStockPage = lazy(() => import("@/pages/low-stock"));
                return (
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  }>
                    <LowStockPage />
                  </Suspense>
                );
              }}
            </Route>
            <Route path="/admin">
              {() => {
                const AdminEnhanced = lazy(() => import("@/pages/admin-new"));
                const DatabaseOptimizer = lazy(() => import("@/pages/database-optimizer"));
                return (
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  }>
                    <AdminEnhanced />
                  </Suspense>
                );
              }}
            </Route>
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
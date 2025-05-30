import { Switch, Route, useLocation } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import MainInventory from "@/pages/main-inventory";
import LineInventory from "@/pages/line-inventory";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import BarcodeScanner from "@/components/barcode-scanner";
import NotificationSystem from "@/components/notification-system";

function Router() {
  const [, setLocation] = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleScanClick = () => {
    setShowScanner(true);
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
  };

  const handleSettingsClick = () => {
    setLocation("/settings");
  };

  // For now, let's bypass authentication to get the core system working
  // Users can still access all features without login
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
              <NotificationSystem />
            </div>
          </div>
        </div>
      )}
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

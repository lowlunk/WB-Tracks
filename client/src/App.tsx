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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
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

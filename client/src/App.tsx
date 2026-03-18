import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import SwitchesPage from "@/pages/switches";
import SwitchDetailPage from "@/pages/switch-detail";
import OfficesPage from "@/pages/offices";
import WifiAPsPage from "@/pages/wifi-aps";
import RaspberryPisPage from "@/pages/raspberry-pis";
import ServerRackPage from "@/pages/server-rack";
import CamerasPage from "@/pages/cameras";
import NvrsPage from "@/pages/nvrs";
import PunchClocksPage from "@/pages/punch-clocks";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/switches" component={SwitchesPage} />
      <Route path="/switches/:id" component={SwitchDetailPage} />
      <Route path="/offices" component={OfficesPage} />
      <Route path="/wifi-aps" component={WifiAPsPage} />
      <Route path="/raspberry-pis" component={RaspberryPisPage} />
      <Route path="/server-rack" component={ServerRackPage} />
      <Route path="/cameras" component={CamerasPage} />
      <Route path="/nvrs" component={NvrsPage} />
      <Route path="/punch-clocks" component={PunchClocksPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router hook={useHashLocation}>
            <SidebarProvider style={sidebarStyle as React.CSSProperties}>
              <div className="flex h-screen w-full overflow-hidden">
                <AppSidebar />
                <div className="flex flex-col flex-1 min-w-0">
                  <header className="flex items-center gap-2 p-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                  </header>
                  <main className="flex-1 overflow-y-auto">
                    <AppRouter />

                  </main>
                </div>
              </div>
            </SidebarProvider>
          </Router>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Bell, 
  Settings, 
  Wifi,
  QrCode,
  Shield
} from "lucide-react";

interface HeaderProps {
  onScanClick?: () => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
}

export default function Header({ onScanClick, onNotificationClick, onSettingsClick }: HeaderProps) {
  const [location] = useLocation();
  const [isOnline] = useState(true); // In a real app, this would check actual network status
  
  // Get notification count from low stock items
  const { data: lowStockItems } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000,
  });
  
  const notificationCount = lowStockItems?.length || 0;

  return (
    <header className="bg-[hsl(var(--wb-surface))] shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50" data-tour="header">
      <div className="wb-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[hsl(var(--wb-primary))] rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--wb-on-surface))]">WB-Tracks</h1>
              <span className="text-xs text-muted-foreground hidden sm:block">
                Production Inventory System
              </span>
            </div>
          </Link>

          {/* Navigation for larger screens */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link href="/">
              <Button 
                variant={location === "/" ? "default" : "ghost"}
                className={location === "/" ? "wb-btn-primary" : ""}
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/main-inventory">
              <Button 
                variant={location === "/main-inventory" ? "default" : "ghost"}
                className={location === "/main-inventory" ? "wb-btn-secondary" : ""}
              >
                Main Inventory
              </Button>
            </Link>
            <Link href="/line-inventory">
              <Button 
                variant={location === "/line-inventory" ? "default" : "ghost"}
                className={location === "/line-inventory" ? "wb-btn-accent" : ""}
              >
                Line Inventory
              </Button>
            </Link>
            <Link href="/inventory">
              <Button 
                variant={location === "/inventory" ? "default" : "ghost"}
                className={location === "/inventory" ? "wb-btn-secondary" : ""}
              >
                Inventory
              </Button>
            </Link>
            <Link href="/admin">
              <Button 
                variant={location === "/admin" ? "default" : "ghost"}
                className={`${location === "/admin" ? "wb-btn-primary" : ""} flex items-center gap-1`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Network status indicator */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="hidden sm:inline">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Notifications */}
            <Button 
              onClick={onNotificationClick}
              variant="ghost" 
              size="icon" 
              className="relative wb-focus-visible"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            {/* Scan button */}
            <Button 
              onClick={onScanClick}
              className="wb-btn-primary wb-focus-visible"
              title="Scan Barcode"
            >
              <QrCode className="h-5 w-5" />
              <span className="hidden sm:ml-2 sm:inline">Scan</span>
            </Button>

            {/* Settings */}
            <Button 
              onClick={onSettingsClick}
              variant="ghost" 
              size="icon" 
              className="wb-focus-visible"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
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
  const { settings } = useNotifications();
  const { user } = useAuth();
  
  // Get notification count from low stock items
  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000,
  });
  
  // Only show notification count if notifications are enabled
  const notificationCount = settings?.enabled ? (Array.isArray(lowStockItems) ? lowStockItems.length : 0) : 0;
  


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
            {user?.role === 'admin' && (
              <Link href="/admin/users">
                <Button 
                  variant={location.startsWith("/admin") ? "default" : "ghost"}
                  className={`${location.startsWith("/admin") ? "wb-btn-primary" : ""} flex items-center gap-1`}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
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

            {/* Notification bell removed per user preference */}

            {/* Admin QR Code Management */}
            {user?.role === 'admin' && (
              <Link href="/bulk-barcode-generation" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Bulk Barcode Generation">
                <QrCode className="h-5 w-5 text-orange-500" />
              </Link>
            )}

            {/* Scan button */}
            <Button 
              onClick={onScanClick}
              className="wb-btn-primary wb-focus-visible"
              title="Scan Barcode"
              data-tour="scan-button"
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

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Bell, 
  Settings, 
  Wifi,
  QrCode
} from "lucide-react";

interface HeaderProps {
  onScanClick?: () => void;
}

export default function Header({ onScanClick }: HeaderProps) {
  const [location] = useLocation();
  const [isOnline] = useState(true); // In a real app, this would check actual network status

  return (
    <header className="bg-[hsl(var(--wb-surface))] shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
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
              variant="ghost" 
              size="icon" 
              className="relative wb-focus-visible"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
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

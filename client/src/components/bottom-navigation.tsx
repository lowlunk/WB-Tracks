import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Warehouse, 
  Factory, 
  Package,
  Shield,
  BarChart3 
} from "lucide-react";

export default function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Dashboard",
      active: location === "/",
    },
    {
      href: "/main-inventory",
      icon: Warehouse,
      label: "Main",
      active: location === "/main-inventory",
    },
    {
      href: "/line-inventory",
      icon: Factory,
      label: "Line",
      active: location === "/line-inventory",
    },
    {
      href: "/inventory",
      icon: Package,
      label: "Inventory",
      active: location === "/inventory",
    },
    {
      href: "/admin",
      icon: Shield,
      label: "Admin",
      active: location === "/admin",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[hsl(var(--wb-surface))] border-t border-gray-200 dark:border-gray-700 lg:hidden z-40 wb-production-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`h-full rounded-none flex flex-col items-center justify-center space-y-1 wb-touch-target ${
                  item.active 
                    ? 'text-[hsl(var(--wb-primary))] bg-[hsl(var(--wb-primary))]/10' 
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

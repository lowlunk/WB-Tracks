import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  ArrowRight, 
  AlertTriangle,
  LucideIcon,
  ArrowRightLeft,
  ArrowLeft
} from "lucide-react";

interface InventoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  locationId: number;
  type: "main" | "line";
  onTransfer?: () => void;
}

export default function InventoryCard({ 
  title, 
  description, 
  icon: Icon, 
  locationId, 
  type,
  onTransfer 
}: InventoryCardProps) {
  const { data: inventory, isLoading } = useQuery({
    queryKey: [`/api/inventory?locationId=${locationId}`],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const lowStockItems = inventory?.filter((item: any) => 
    item.quantity <= item.minStockLevel
  ) || [];

  const totalItems = type === "main" ? stats?.mainInventoryTotal : stats?.lineInventoryTotal;
  const uniqueComponents = inventory?.length || 0;

  const colorClasses = {
    main: {
      bg: "bg-[hsl(var(--wb-secondary))]/10",
      text: "text-[hsl(var(--wb-secondary))]",
      button: "wb-btn-secondary",
    },
    line: {
      bg: "bg-[hsl(var(--wb-accent))]/10",
      text: "text-[hsl(var(--wb-accent))]",
      button: "wb-btn-accent",
    },
  };

  const colors = colorClasses[type];

  return (
    <Card className="wb-card overflow-hidden">
      <CardHeader className="border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${colors.text}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Link href={type === "main" ? "/main-inventory" : "/line-inventory"}>
            <Button 
              variant="ghost" 
              className={`${colors.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 wb-skeleton" />
              <Skeleton className="h-16 wb-skeleton" />
            </div>
            <Skeleton className="h-20 wb-skeleton" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[hsl(var(--wb-on-surface))]">
                  {totalItems || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {uniqueComponents}
                </div>
                <div className="text-sm text-muted-foreground">Components</div>
              </div>
            </div>

            {/* Low Stock Alerts or Quick Actions */}
            {type === "main" && lowStockItems.length > 0 ? (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Low Stock Alerts
                  </span>
                </div>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 2).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs text-orange-700 dark:text-orange-300">
                      <span className="truncate pr-2">
                        {item.component.componentNumber} - {item.component.description.slice(0, 30)}...
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.quantity} left
                      </Badge>
                    </div>
                  ))}
                  {lowStockItems.length > 2 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      +{lowStockItems.length - 2} more items
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={onTransfer}
                  className={`w-full ${colors.button} wb-touch-target`}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  {type === "main" ? "Transfer to Line" : "Transfer from Main"}
                </Button>
                {type === "line" && (
                  <Button
                    onClick={onTransfer}
                    variant="outline"
                    className="w-full wb-touch-target border-gray-300 dark:border-gray-600"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return to Main
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

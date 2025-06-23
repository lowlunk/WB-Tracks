import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Package, Search, RefreshCw, ArrowLeft, MapPin, BarChart3, Eye, ArrowRightLeft } from "lucide-react";
import { useLocation } from "wouter";

interface LowStockItem {
  id: number;
  componentId: number;
  locationId: number;
  quantity: number;
  minStockLevel: number;
  component: {
    id: number;
    componentNumber: string;
    description: string;
    category: string;
    supplier: string;
    unitPrice: number;
  };
  location: {
    id: number;
    name: string;
    facilityId: number;
  };
}

export default function LowStockPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selectedComponent, setSelectedComponent] = useState<LowStockItem | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: lowStockItems = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    refetchInterval: 30000,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Filter items based on search and filters
  const filteredItems = lowStockItems.filter((item: LowStockItem) => {
    const matchesSearch = !searchQuery || 
      item.component.componentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.component.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.component.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = locationFilter === "all" || 
      item.location.id.toString() === locationFilter;

    const matchesSeverity = severityFilter === "all" ||
      (severityFilter === "critical" && item.quantity === 0) ||
      (severityFilter === "warning" && item.quantity > 0 && item.quantity <= item.minStockLevel);

    return matchesSearch && matchesLocation && matchesSeverity;
  });

  // Categorize items
  const criticalItems = filteredItems.filter((item: LowStockItem) => item.quantity === 0);
  const warningItems = filteredItems.filter((item: LowStockItem) => item.quantity > 0 && item.quantity <= item.minStockLevel);

  const getStockStatus = (item: LowStockItem) => {
    if (item.quantity === 0) return { label: "OUT OF STOCK", variant: "destructive" as const, priority: "critical" };
    if (item.quantity <= item.minStockLevel) return { label: "LOW STOCK", variant: "secondary" as const, priority: "warning" };
    return { label: "IN STOCK", variant: "default" as const, priority: "normal" };
  };

  const getStockPercentage = (item: LowStockItem) => {
    if (item.minStockLevel === 0) return 0;
    return Math.max(0, Math.min(100, (item.quantity / (item.minStockLevel * 2)) * 100));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              Low Stock Management
            </h1>
            <p className="text-muted-foreground">Monitor and manage inventory items that need restocking</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Critical Items</p>
                <p className="text-2xl font-bold text-red-600">{criticalItems.length}</p>
                <p className="text-xs text-muted-foreground">Out of stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Warning Items</p>
                <p className="text-2xl font-bold text-yellow-600">{warningItems.length}</p>
                <p className="text-xs text-muted-foreground">Low stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{filteredItems.length}</p>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Locations</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(filteredItems.map(item => item.location.id)).size}
                </p>
                <p className="text-xs text-muted-foreground">Affected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search low stock items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by part number, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location: any) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="critical">Critical (Out of Stock)</SelectItem>
                  <SelectItem value="warning">Warning (Low Stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setLocationFilter("all");
                  setSeverityFilter("all");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items ({filteredItems.length})</CardTitle>
          <CardDescription>
            Items that are out of stock or running low on inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item: LowStockItem) => {
                const status = getStockStatus(item);
                const stockPercentage = getStockPercentage(item);
                
                return (
                  <div key={`${item.componentId}-${item.locationId}`} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                          <Badge variant="outline">
                            {item.location.name}
                          </Badge>
                          {item.component.category && (
                            <Badge variant="secondary">
                              {item.component.category}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">
                          {item.component.componentNumber}
                        </h3>
                        
                        {item.component.description && (
                          <p className="text-muted-foreground mb-2">
                            {item.component.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Current Stock:</span>
                            <div className={`text-lg font-bold ${item.quantity === 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {item.quantity}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Min Level:</span>
                            <div className="text-lg font-bold text-gray-600">
                              {item.minStockLevel}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Location:</span>
                            <div className="text-lg font-bold text-purple-600">
                              {item.location.name}
                            </div>
                          </div>
                          {item.component.supplier && (
                            <div>
                              <span className="font-medium">Supplier:</span>
                              <div className="text-lg font-bold text-green-600">
                                {item.component.supplier}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Stock Level Visual */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Stock Level</span>
                            <span>{item.quantity} / {item.minStockLevel * 2} (recommended)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                stockPercentage === 0 ? 'bg-red-500' :
                                stockPercentage < 50 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.max(5, stockPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedComponent(item);
                            setShowDetailsModal(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedComponent(item);
                            setShowTransferModal(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Transfer Stock
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Low Stock Items</h3>
              <p className="text-muted-foreground">
                {searchQuery || locationFilter !== "all" || severityFilter !== "all" 
                  ? "No items match your current filters." 
                  : "All items are adequately stocked!"
                }
              </p>
              {(searchQuery || locationFilter !== "all" || severityFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setLocationFilter("all");
                    setSeverityFilter("all");
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Details Modal */}
      {selectedComponent && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Component Details
              </DialogTitle>
              <DialogDescription>
                Detailed information for {selectedComponent.component.componentNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Component Number</label>
                  <p className="text-lg font-semibold">{selectedComponent.component.componentNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-lg">{selectedComponent.component.category || 'General'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-lg">{selectedComponent.component.description || 'No description available'}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                  <p className={`text-2xl font-bold ${selectedComponent.quantity === 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {selectedComponent.quantity}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Min Stock Level</label>
                  <p className="text-2xl font-bold text-gray-600">{selectedComponent.minStockLevel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-2xl font-bold text-purple-600">{selectedComponent.location.name}</p>
                </div>
              </div>
              
              {selectedComponent.component.supplier && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                  <p className="text-lg">{selectedComponent.component.supplier}</p>
                </div>
              )}
              
              {selectedComponent.component.unitPrice && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unit Price</label>
                  <p className="text-lg font-semibold">
                    ${(() => {
                      try {
                        const price = typeof selectedComponent.component.unitPrice === 'number' 
                          ? selectedComponent.component.unitPrice 
                          : parseFloat(selectedComponent.component.unitPrice.toString());
                        return isNaN(price) ? '0.00' : price.toFixed(2);
                      } catch {
                        return '0.00';
                      }
                    })()}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Transfer Modal */}
      {selectedComponent && (
        <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Transfer Stock
              </DialogTitle>
              <DialogDescription>
                Transfer {selectedComponent.component.componentNumber} from {selectedComponent.location.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Current Stock:</strong> {selectedComponent.quantity} units in {selectedComponent.location.name}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  <strong>Min Level:</strong> {selectedComponent.minStockLevel} units
                </p>
              </div>
              
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Transfer Feature Coming Soon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Stock transfer functionality is currently being developed. 
                  Please use the main inventory page for manual transfers.
                </p>
                <Button 
                  onClick={() => navigate('/inventory')}
                  className="mr-2"
                >
                  Go to Inventory
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowTransferModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
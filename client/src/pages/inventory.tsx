import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ComponentTable from "@/components/component-table";
import ComponentEditModal from "@/components/component-edit-modal";
import TransferModal from "@/components/transfer-modal";
import AddComponentDialog from "@/components/add-component-dialog";
import AddInventoryDialog from "@/components/add-inventory-dialog";
import BarcodeLabelPrinter from "@/components/barcode-label-printer";
import FloatingActionButton from "@/components/floating-action-button";
import BarcodeScanner from "@/components/barcode-scanner";
import { 
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Building2,
  Plus
} from "lucide-react";
import type { 
  Component, 
  InventoryItemWithDetails,
  InventoryLocation,
  Facility
} from "@shared/schema";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [transferComponent, setTransferComponent] = useState<Component | null>(null);
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printComponent, setPrintComponent] = useState<Component | undefined>();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Fetch all data
  const { data: components = [], isLoading: componentsLoading } = useQuery({
    queryKey: ["/api/components"],
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ["/api/facilities"],
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
  });

  const isLoading = componentsLoading || inventoryLoading;

  // Filter components based on search and facility/location
  const filteredComponents = components?.filter((component: Component) => {
    const matchesSearch = component.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         component.componentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedFacility === "all" && selectedLocation === "all") return true;

    // Find inventory items for this component
    const componentInventory = inventory?.filter((item: InventoryItemWithDetails) => 
      item.componentId === component.id
    );

    if (!componentInventory?.length) return false;

    if (selectedFacility !== "all") {
      const facilityLocations = locations?.filter((loc: InventoryLocation) => 
        loc.facilityId === parseInt(selectedFacility)
      );
      const facilityLocationIds = facilityLocations?.map((loc: InventoryLocation) => loc.id);
      
      const hasInventoryInFacility = componentInventory.some((item: InventoryItemWithDetails) =>
        facilityLocationIds?.includes(item.locationId)
      );

      if (!hasInventoryInFacility) return false;
    }

    if (selectedLocation !== "all") {
      const hasInventoryInLocation = componentInventory.some((item: InventoryItemWithDetails) =>
        item.locationId === parseInt(selectedLocation)
      );

      if (!hasInventoryInLocation) return false;
    }

    return true;
  }) || [];

  // Calculate inventory totals for each component
  const componentsWithInventory = filteredComponents.map((component: Component) => {
    const componentInventory = inventory?.filter((item: InventoryItemWithDetails) => 
      item.componentId === component.id
    ) || [];

    const mainStock = componentInventory
      .filter((item: InventoryItemWithDetails) => item.location?.name === "Main Inventory")
      .reduce((sum, item) => sum + item.quantity, 0);

    const lineStock = componentInventory
      .filter((item: InventoryItemWithDetails) => item.location?.name === "Line Inventory")
      .reduce((sum, item) => sum + item.quantity, 0);

    return {
      ...component,
      mainStock,
      lineStock,
    };
  });

  const handleScanResult = (result: any) => {
    if (result?.text) {
      setSearchQuery(result.text);
    }
    setIsScannerOpen(false);
  };

  const handlePrintLabel = (component?: Component) => {
    setPrintComponent(component);
    setIsPrintDialogOpen(true);
  };

  const handleTransfer = (component: Component) => {
    setTransferComponent(component);
  };

  return (
    <div className="container mx-auto p-4 pb-20 lg:pb-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive view of all inventory across facilities
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddComponentOpen(true)} className="wb-focus-visible">
            <Plus className="h-4 w-4 mr-2" />
            Add Component
          </Button>
          <Button onClick={() => setIsAddInventoryOpen(true)} variant="outline" className="wb-focus-visible">
            <Package className="h-4 w-4 mr-2" />
            Add Inventory
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Components</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{components?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory?.reduce((sum: number, item: InventoryItemWithDetails) => sum + item.quantity, 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 wb-focus-visible"
              />
            </div>

            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger className="wb-focus-visible">
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities?.map((facility: Facility) => (
                  <SelectItem key={facility.id} value={facility.id.toString()}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="wb-focus-visible">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations
                  ?.filter((location: InventoryLocation) => 
                    selectedFacility === "all" || location.facilityId === parseInt(selectedFacility)
                  )
                  ?.map((location: InventoryLocation) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      {lowStockItems?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems?.slice(0, 6).map((item: InventoryItemWithDetails) => (
                <div key={`${item.componentId}-${item.locationId}`} className="p-3 border rounded-lg">
                  <div className="font-medium">{item.component?.description}</div>
                  <div className="text-sm text-muted-foreground">{item.component?.componentNumber}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">{item.location?.name}</span>
                    <Badge variant="destructive">{item.quantity} left</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Components</CardTitle>
            <Badge variant="outline">
              {filteredComponents.length} of {components?.length || 0} components
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ComponentTable
            components={componentsWithInventory}
            isLoading={isLoading}
            showLocationFilter={false}
            onEdit={setEditingComponent}
            onTransfer={handleTransfer}
            onViewDetails={setEditingComponent}
          />
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <FloatingActionButton
        onScan={() => setIsScannerOpen(true)}
        onTransfer={() => setTransferComponent(null)}
        onAddItem={() => setIsAddComponentOpen(true)}
        onPrintLabel={() => handlePrintLabel()}
      />

      {/* Modals and Dialogs */}
      {editingComponent && (
        <ComponentEditModal
          isOpen={!!editingComponent}
          onClose={() => setEditingComponent(null)}
          componentId={editingComponent.id}
        />
      )}

      {transferComponent !== null && (
        <TransferModal
          isOpen={transferComponent !== null}
          onClose={() => setTransferComponent(null)}
          preSelectedComponent={transferComponent || undefined}
        />
      )}

      <AddComponentDialog
        isOpen={isAddComponentOpen}
        onClose={() => setIsAddComponentOpen(false)}
      />

      <AddInventoryDialog
        isOpen={isAddInventoryOpen}
        onClose={() => setIsAddInventoryOpen(false)}
      />

      <BarcodeLabelPrinter
        isOpen={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
        component={printComponent}
      />

      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanResult}
      />
    </div>
  );
}
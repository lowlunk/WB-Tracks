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
import Code39Scanner from "@/components/code39-scanner";
import ConsumedComponentsModal from "@/components/consumed-components-modal";
import InventoryImportDialog from "@/components/inventory-import-dialog";
import { 
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Building2,
  Plus,
  Upload
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
  const [viewingComponent, setViewingComponent] = useState<Component | null>(null);
  const [transferComponent, setTransferComponent] = useState<Component | null>(null);
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printComponent, setPrintComponent] = useState<Component | undefined>();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showConsumedComponents, setShowConsumedComponents] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

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

  // Fetch consumed components
  const { data: consumedTransactions = [], isLoading: consumedLoading } = useQuery({
    queryKey: ["/api/transactions/consumed"],
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
    <div className="wb-container wb-mobile-safe p-2 sm:p-4 pb-20 lg:pb-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowImportDialog(true)} variant="outline" className="wb-focus-visible">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setIsAddComponentOpen(true)} className="wb-focus-visible">
            <Plus className="h-4 w-4 mr-2" />
            Add Component
          </Button>
          <Button onClick={() => setIsAddInventoryOpen(true)} variant="outline" className="wb-focus-visible">
            <Package className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setShowConsumedComponents(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consumed Components</p>
                <p className="text-2xl font-bold">{consumedTransactions?.length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">
                  {inventory?.reduce((sum: number, item: InventoryItemWithDetails) => sum + item.quantity, 0) || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {lowStockItems?.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Facilities</p>
                <p className="text-2xl font-bold">{facilities?.length || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components by number, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 wb-focus-visible"
          />
        </div>

        <div className="flex gap-2">
          <Select value={selectedFacility} onValueChange={setSelectedFacility}>
            <SelectTrigger className="wb-focus-visible w-48">
              <SelectValue placeholder="All Facilities" />
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
            <SelectTrigger className="wb-focus-visible w-48">
              <SelectValue placeholder="All Locations" />
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
      </div>

      {/* Component Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Component Inventory</CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {componentsWithInventory.length} components
              </Badge>
              <div className="flex gap-2">
                <Button onClick={() => setIsScannerOpen(true)} variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-1" />
                  Scan
                </Button>
                <Button onClick={() => handlePrintLabel()} variant="outline" size="sm">
                  Print Labels
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ComponentTable
            components={componentsWithInventory}
            isLoading={isLoading}
            showLocationFilter={false}
            onEdit={setEditingComponent}
            onTransfer={handleTransfer}
            onViewDetails={setViewingComponent}
          />
        </CardContent>
      </Card>

      {/* Modals and Dialogs */}
      {editingComponent && (
        <ComponentEditModal
          isOpen={!!editingComponent}
          onClose={() => setEditingComponent(null)}
          componentId={editingComponent.id}
        />
      )}

      {viewingComponent && (
        <ComponentEditModal
          isOpen={!!viewingComponent}
          onClose={() => setViewingComponent(null)}
          componentId={viewingComponent.id}
          readOnly={true}
        />
      )}

      {transferComponent !== null && (
        <TransferModal
          isOpen={transferComponent !== null}
          onClose={() => setTransferComponent(null)}
          onTransfer={() => {}}
          defaultComponentId={transferComponent?.id}
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

      <Code39Scanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanResult}
      />

      <ConsumedComponentsModal
        isOpen={showConsumedComponents}
        onClose={() => setShowConsumedComponents(false)}
        consumedTransactions={consumedTransactions}
        isLoading={consumedLoading}
      />

      <InventoryImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
      />
    </div>
  );
}
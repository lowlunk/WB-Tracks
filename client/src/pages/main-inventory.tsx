import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ComponentTable from "@/components/component-table";
import TransferModal from "@/components/transfer-modal";
import AddComponentDialog from "@/components/add-component-dialog";
import { Warehouse, Search, Plus, ArrowRightLeft } from "lucide-react";

export default function MainInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedComponentForTransfer, setSelectedComponentForTransfer] = useState<any>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["/api/inventory?locationId=1"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Transform inventory data for component table
  const components = inventory?.map((item: any) => ({
    ...item.component,
    mainStock: item.quantity,
    lineStock: 0, // We'll need to fetch this separately or modify the API
  })) || [];

  return (
    <div className="wb-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[hsl(var(--wb-secondary))]/10 rounded-xl flex items-center justify-center">
            <Warehouse className="h-6 w-6 text-[hsl(var(--wb-secondary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--wb-on-surface))]">Main Inventory</h1>
            <p className="text-muted-foreground">Central storage area (150 feet from production line)</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowTransferModal(true)}
            className="wb-btn-primary"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Items
          </Button>
          <Button 
            onClick={() => setShowAddComponent(true)}
            className="wb-btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Items
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="wb-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--wb-on-surface))] mb-1">
                {stats?.mainInventoryTotal || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
          </CardContent>
        </Card>

        <Card className="wb-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--wb-secondary))] mb-1">
                {inventory?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Unique Components</div>
            </div>
          </CardContent>
        </Card>

        <Card className="wb-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--wb-error))] mb-1">
                {inventory?.filter((item: any) => item.quantity <= item.minStockLevel).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Low Stock Items</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="wb-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-xl font-semibold">Inventory Items</CardTitle>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="wb-input pl-10 w-full sm:w-80"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 wb-skeleton" />
              ))}
            </div>
          ) : (
            <ComponentTable
              components={components.filter((comp: any) => 
                !searchQuery || 
                comp.componentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                comp.description.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              isLoading={false}
              showLocationFilter={false}
              onEdit={(component) => console.log('Edit:', component)}
              onTransfer={(component) => {
                setSelectedComponentForTransfer(component);
                setShowTransferModal(true);
              }}
              onViewDetails={(component) => console.log('View details:', component)}
            />
          )}
        </CardContent>
      </Card>

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onTransfer={(transfer) => {
            console.log('Transfer:', transfer);
            setShowTransferModal(false);
            setSelectedComponentForTransfer(null);
          }}
          defaultFromLocation={1}
          defaultComponentId={selectedComponentForTransfer?.id}
        />
      )}

      {/* Add Component Dialog */}
      {showAddComponent && (
        <AddComponentDialog
          isOpen={showAddComponent}
          onClose={() => setShowAddComponent(false)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ComponentTable from "@/components/component-table";
import TransferModal from "@/components/transfer-modal";
import ConsumeModal from "@/components/consume-modal";
import { Factory, Search, Plus, ArrowRightLeft, ArrowLeft, MinusCircle } from "lucide-react";

export default function LineInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [selectedComponentForTransfer, setSelectedComponentForTransfer] = useState<any>(null);
  const [selectedComponentForConsume, setSelectedComponentForConsume] = useState<any>(null);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["/api/inventory?locationId=2"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Transform inventory data for component table
  const components = inventory?.map((item: any) => ({
    ...item.component,
    mainStock: 0, // We'll need to fetch this separately or modify the API
    lineStock: item.quantity,
  })) || [];

  return (
    <div className="wb-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[hsl(var(--wb-accent))]/10 rounded-xl flex items-center justify-center">
            <Factory className="h-6 w-6 text-[hsl(var(--wb-accent))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--wb-on-surface))]">Line Inventory</h1>
            <p className="text-muted-foreground">Production line stock</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowTransferModal(true)}
            variant="outline"
            className="border-[hsl(var(--wb-primary))] text-[hsl(var(--wb-primary))] hover:bg-[hsl(var(--wb-primary))]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Main
          </Button>
          <Button 
            onClick={() => setShowTransferModal(true)}
            className="wb-btn-primary"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer from Main
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="wb-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--wb-on-surface))] mb-1">
                {stats?.lineInventoryTotal || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
          </CardContent>
        </Card>

        <Card className="wb-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--wb-accent))] mb-1">
                {inventory?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Unique Components</div>
            </div>
          </CardContent>
        </Card>

        <Card className="wb-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--wb-secondary))] mb-1">
                {inventory?.filter((item: any) => item.quantity > 0).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Available Components</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="wb-card mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              onClick={() => setShowTransferModal(true)}
              className="wb-btn-primary wb-touch-target h-20 flex-col gap-2"
            >
              <ArrowRightLeft className="h-6 w-6" />
              <span>Transfer from Main</span>
            </Button>
            <Button
              onClick={() => setShowTransferModal(true)}
              variant="outline"
              className="wb-touch-target h-20 flex-col gap-2 border-[hsl(var(--wb-primary))] text-[hsl(var(--wb-primary))] hover:bg-[hsl(var(--wb-primary))]/10"
            >
              <ArrowLeft className="h-6 w-6" />
              <span>Return to Main</span>
            </Button>
            <Button
              onClick={() => setShowConsumeModal(true)}
              variant="outline"
              className="wb-touch-target h-20 flex-col gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-950"
            >
              <MinusCircle className="h-6 w-6" />
              <span>Consume for Production</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="wb-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-xl font-semibold">Line Inventory Items</CardTitle>
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
          ) : inventory?.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No items in line inventory
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Transfer items from main inventory to get started.
              </p>
              <Button 
                onClick={() => setShowTransferModal(true)}
                className="wb-btn-primary"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer from Main
              </Button>
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
          defaultToLocation={2}
          defaultComponentId={selectedComponentForTransfer?.id}
        />
      )}

      {/* Consume Modal */}
      <ConsumeModal
        isOpen={showConsumeModal}
        onClose={() => {
          setShowConsumeModal(false);
          setSelectedComponentForConsume(null);
        }}
        preSelectedComponent={selectedComponentForConsume}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Package, 
  ArrowRightLeft, 
  Plus, 
  Minus, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Building2,
  Barcode,
  Eye,
  Edit,
  History
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Component, InventoryItem, Location, Transaction } from "@shared/schema";

interface ComponentDetailProps {
  componentId: string;
}

export default function ComponentDetail({ componentId }: ComponentDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromLocationId: "",
    toLocationId: "",
    quantity: "",
    notes: ""
  });

  // Fetch component details
  const { data: component, isLoading: componentLoading } = useQuery({
    queryKey: [`/api/components/${componentId}`],
  });

  // Fetch inventory items for this component
  const { data: inventoryItems, isLoading: inventoryLoading } = useQuery({
    queryKey: [`/api/inventory/component/${componentId}`],
  });

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Fetch recent transactions for this component
  const { data: transactions } = useQuery({
    queryKey: [`/api/transactions/component/${componentId}`],
  });

  const transferMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/inventory/transfer`, {
        method: "POST",
        body: JSON.stringify({
          componentId: parseInt(componentId),
          fromLocationId: parseInt(data.fromLocationId),
          toLocationId: parseInt(data.toLocationId),
          quantity: parseInt(data.quantity),
          notes: data.notes
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Transfer Complete",
        description: "Inventory transferred successfully"
      });
      setShowTransferDialog(false);
      setTransferForm({ fromLocationId: "", toLocationId: "", quantity: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: [`/api/inventory/component/${componentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/component/${componentId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleTransfer = () => {
    if (!transferForm.fromLocationId || !transferForm.toLocationId || !transferForm.quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (transferForm.fromLocationId === transferForm.toLocationId) {
      toast({
        title: "Invalid Transfer",
        description: "Source and destination locations must be different",
        variant: "destructive"
      });
      return;
    }

    transferMutation.mutate(transferForm);
  };

  if (componentLoading || inventoryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Package className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Component Not Found</h3>
          <p className="text-gray-500 dark:text-gray-400">The requested component could not be found.</p>
        </div>
        <Button onClick={() => setLocation("/inventory")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>
      </div>
    );
  }

  const totalStock = (inventoryItems as InventoryItem[] || []).reduce((sum, item) => sum + item.quantity, 0);
  const locationStocks = (inventoryItems as InventoryItem[] || []).reduce((acc, item) => {
    const location = (locations as Location[] || []).find(l => l.id === item.locationId);
    if (location) {
      acc[location.name] = (acc[location.name] || 0) + item.quantity;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/inventory")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {component.componentNumber}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{component.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={component.isActive ? "default" : "secondary"}>
            {component.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline">
            Total: {totalStock} units
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="transactions">History</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Component Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Component Number</Label>
                    <p className="font-medium">{component.componentNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{component.category || "General"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Supplier</Label>
                    <p className="font-medium">{component.supplier || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Unit Price</Label>
                    <p className="font-medium">
                      {component.unitPrice ? `$${component.unitPrice.toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                  {component.plateNumber && (
                    <div>
                      <Label className="text-muted-foreground">Plate Number</Label>
                      <p className="font-medium">{component.plateNumber}</p>
                    </div>
                  )}
                  {component.barcode && (
                    <div>
                      <Label className="text-muted-foreground">Barcode</Label>
                      <p className="font-medium flex items-center">
                        <Barcode className="h-4 w-4 mr-2" />
                        {component.barcode}
                      </p>
                    </div>
                  )}
                </div>
                {component.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="text-sm">{component.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Stock Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{totalStock}</span>
                    <span className="text-muted-foreground">Total Units</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(locationStocks).map(([location, quantity]) => (
                      <div key={location} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{location}</span>
                        <span className="font-medium">{quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Inventory by Location</h3>
            <Button onClick={() => setShowTransferDialog(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer Stock
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(inventoryItems as InventoryItem[] || []).map((item) => {
              const location = (locations as Location[] || []).find(l => l.id === item.locationId);
              return (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{location?.name}</CardTitle>
                    <CardDescription className="text-xs">{location?.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">{item.quantity}</span>
                      <span className="text-sm text-muted-foreground">units</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <h3 className="text-lg font-medium">Recent Activity</h3>
          
          <div className="space-y-4">
            {(transactions as Transaction[] || []).slice(0, 10).map((transaction) => {
              const fromLocation = (locations as Location[] || []).find(l => l.id === transaction.fromLocationId);
              const toLocation = (locations as Location[] || []).find(l => l.id === transaction.toLocationId);
              
              return (
                <Card key={transaction.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                          {transaction.transactionType === 'transfer' && <ArrowRightLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          {transaction.transactionType === 'add' && <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />}
                          {transaction.transactionType === 'remove' && <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />}
                          {transaction.transactionType === 'consume' && <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{transaction.transactionType}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.transactionType === 'transfer' 
                              ? `${fromLocation?.name} → ${toLocation?.name}`
                              : (transaction.fromLocationId ? fromLocation?.name : toLocation?.name)
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{transaction.quantity} units</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {transaction.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{transaction.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <h3 className="text-lg font-medium">Quick Actions</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              size="lg" 
              onClick={() => setShowTransferDialog(true)}
              className="h-20 flex-col space-y-2"
            >
              <ArrowRightLeft className="h-6 w-6" />
              <span>Transfer Stock</span>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              disabled
              className="h-20 flex-col space-y-2"
            >
              <ShoppingCart className="h-6 w-6" />
              <span>Add to Order</span>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Stock</DialogTitle>
            <DialogDescription>
              Move inventory for {component.componentNumber} between locations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromLocation">From Location</Label>
                <Select 
                  value={transferForm.fromLocationId} 
                  onValueChange={(value) => setTransferForm(prev => ({ ...prev, fromLocationId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {(locations as Location[] || []).map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="toLocation">To Location</Label>
                <Select 
                  value={transferForm.toLocationId} 
                  onValueChange={(value) => setTransferForm(prev => ({ ...prev, toLocationId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {(locations as Location[] || []).map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={transferForm.quantity}
                onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter quantity to transfer"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={transferForm.notes}
                onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this transfer"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTransfer}
              disabled={transferMutation.isPending}
            >
              {transferMutation.isPending ? "Transferring..." : "Transfer Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
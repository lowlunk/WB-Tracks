import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Factory, Package, Zap } from "lucide-react";
import type { Component, InventoryLocation } from "@shared/schema";

interface ConsumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedComponent?: Component;
}

export default function ConsumeModal({ isOpen, onClose, preSelectedComponent }: ConsumeModalProps) {
  const [selectedComponentId, setSelectedComponentId] = useState<string>(
    preSelectedComponent?.id.toString() || ""
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [notes, setNotes] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all components
  const { data: components = [] } = useQuery({
    queryKey: ["/api/components"],
  });

  // Fetch locations (filter to Line locations for production)
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Filter to Line/Production locations
  const lineLocations = locations?.filter((location: InventoryLocation) => 
    location.name.toLowerCase().includes("line") || 
    location.name.toLowerCase().includes("production")
  ) || [];

  // Fetch inventory for selected location to show available quantities
  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory", selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return [];
      const response = await fetch(`/api/inventory?locationId=${selectedLocationId}`);
      return response.json();
    },
    enabled: !!selectedLocationId,
  });

  const consumeMutation = useMutation({
    mutationFn: async (consumeData: {
      componentId: number;
      locationId: number;
      quantity: number;
      notes?: string;
    }) => {
      const response = await fetch("/api/transactions/consume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(consumeData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to consume items");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Items consumed for production successfully",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // Reset form and close
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to consume items",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedComponentId || !selectedLocationId || !quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    consumeMutation.mutate({
      componentId: parseInt(selectedComponentId),
      locationId: parseInt(selectedLocationId),
      quantity: quantityNum,
      notes: notes || "Used in production",
    });
  };

  const handleClose = () => {
    setSelectedComponentId(preSelectedComponent?.id.toString() || "");
    setSelectedLocationId("");
    setQuantity("1");
    setNotes("");
    onClose();
  };

  // Get available quantity for selected component and location
  const selectedInventoryItem = inventory?.find(
    (item: any) => item.componentId === parseInt(selectedComponentId)
  );
  const availableQuantity = selectedInventoryItem?.quantity || 0;

  const selectedComponent = components?.find(
    (comp: Component) => comp.id === parseInt(selectedComponentId)
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Consume for Production
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Component Selection */}
          <div className="space-y-2">
            <Label htmlFor="component">Component *</Label>
            <Select value={selectedComponentId} onValueChange={setSelectedComponentId}>
              <SelectTrigger className="wb-focus-visible">
                <SelectValue placeholder="Select component to consume">
                  {selectedComponent && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{selectedComponent.componentNumber}</span>
                      <span className="text-muted-foreground">- {selectedComponent.description}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {components?.map((component: Component) => (
                  <SelectItem key={component.id} value={component.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{component.componentNumber}</span>
                      <span className="text-muted-foreground">- {component.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label htmlFor="location">Production Location *</Label>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger className="wb-focus-visible">
                <SelectValue placeholder="Select production location" />
              </SelectTrigger>
              <SelectContent>
                {lineLocations.map((location: InventoryLocation) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4" />
                      {location.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Available Quantity Display */}
          {selectedComponentId && selectedLocationId && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Available Quantity:</span>
                <span className={`text-sm font-bold ${
                  availableQuantity > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {availableQuantity} units
                </span>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Consume *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={availableQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="wb-focus-visible"
            />
            {availableQuantity > 0 && parseInt(quantity) > availableQuantity && (
              <p className="text-sm text-red-600">
                Quantity cannot exceed available stock ({availableQuantity})
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Production Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Used for Order #12345, Mold A production"
              className="wb-focus-visible"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={consumeMutation.isPending}
              className="wb-focus-visible"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                consumeMutation.isPending ||
                !selectedComponentId ||
                !selectedLocationId ||
                !quantity ||
                parseInt(quantity) <= 0 ||
                parseInt(quantity) > availableQuantity
              }
              className="wb-btn-destructive wb-focus-visible"
            >
              {consumeMutation.isPending ? (
                "Consuming..."
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Consume for Production
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
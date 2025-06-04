import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowRightLeft, 
  X, 
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (transfer: any) => void;
  defaultFromLocation?: number;
  defaultToLocation?: number;
  defaultComponentId?: number;
}

export default function TransferModal({ 
  isOpen, 
  onClose, 
  onTransfer,
  defaultFromLocation,
  defaultToLocation,
  defaultComponentId
}: TransferModalProps) {
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [fromLocationId, setFromLocationId] = useState<string>("");
  const [toLocationId, setToLocationId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState<number>(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch components and locations
  const { data: components } = useQuery({
    queryKey: ["/api/components"],
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
  });

  const { data: facilities } = useQuery({
    queryKey: ["/api/facilities"],
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
  });

  // Set default values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultFromLocation) {
        setFromLocationId(defaultFromLocation.toString());
      }
      if (defaultToLocation) {
        setToLocationId(defaultToLocation.toString());
      }
      if (defaultComponentId) {
        setSelectedComponentId(defaultComponentId.toString());
      }
    }
  }, [isOpen, defaultFromLocation, defaultToLocation, defaultComponentId]);

  // Update available quantity when component or location changes
  useEffect(() => {
    if (selectedComponentId && fromLocationId && inventory) {
      const inventoryItem = inventory.find((item: any) => 
        item.componentId === parseInt(selectedComponentId) && 
        item.locationId === parseInt(fromLocationId)
      );
      setAvailableQuantity(inventoryItem?.quantity || 0);

      // Reset quantity if it exceeds available
      if (quantity > (inventoryItem?.quantity || 0)) {
        setQuantity(1);
      }
    } else {
      setAvailableQuantity(0);
    }
  }, [selectedComponentId, fromLocationId, inventory, quantity]);

  const transferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await apiRequest("/api/transactions/transfer", "POST", transferData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer Successful",
        description: `Successfully transferred ${quantity} units`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      onTransfer(data);
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer items",
        variant: "destructive",
      });
    },
  });

  const handleTransfer = () => {
    if (!selectedComponentId || !fromLocationId || !toLocationId) {
      toast({
        title: "Missing Information",
        description: "Please select component and locations",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0 || quantity > availableQuantity) {
      toast({
        title: "Invalid Quantity",
        description: `Quantity must be between 1 and ${availableQuantity}`,
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      componentId: parseInt(selectedComponentId),
      fromLocationId: parseInt(fromLocationId),
      toLocationId: parseInt(toLocationId),
      quantity,
      notes: notes.trim() || undefined,
    });
  };

  const handleClose = () => {
    setSelectedComponentId("");
    setFromLocationId("");
    setToLocationId("");
    setQuantity(1);
    setNotes("");
    setAvailableQuantity(0);
    onClose();
  };

  const selectedComponent = components?.find((comp: any) => comp.id === parseInt(selectedComponentId));
  const fromLocation = locations?.find((loc: any) => loc.id === parseInt(fromLocationId));
  const toLocation = locations?.find((loc: any) => loc.id === parseInt(toLocationId));

  const canTransfer = selectedComponentId && fromLocationId && toLocationId && 
                     quantity > 0 && quantity <= availableQuantity &&
                     fromLocationId !== toLocationId;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Items
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Component Selection */}
          <div className="space-y-2">
            <Label htmlFor="component-select" className="text-sm font-medium">
              Component
            </Label>
            <Select value={selectedComponentId} onValueChange={setSelectedComponentId}>
              <SelectTrigger id="component-select" className="wb-input">
                <SelectValue placeholder="Select a component..." />
              </SelectTrigger>
              <SelectContent>
                {components?.map((component: any) => (
                  <SelectItem key={component.id} value={component.id.toString()}>
                    {component.componentNumber} - {component.description.slice(0, 50)}
                    {component.description.length > 50 ? "..." : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-location" className="text-sm font-medium">
                From
              </Label>
              <Select value={fromLocationId} onValueChange={setFromLocationId}>
                <SelectTrigger id="from-location" className="wb-input">
                  <SelectValue placeholder="From location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location: any) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-location" className="text-sm font-medium">
                To
              </Label>
              <Select value={toLocationId} onValueChange={setToLocationId}>
                <SelectTrigger id="to-location" className="wb-input">
                  <SelectValue placeholder="To location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.filter((loc: any) => loc.id.toString() !== fromLocationId)
                    .map((location: any) => {
                      const facility = facilities?.find((f: any) => f.id === location.facilityId);
                      return (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name} {facility ? `(${facility.name})` : ''}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </Label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="wb-touch-target"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableQuantity}
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(availableQuantity, value)));
                }}
                className="wb-input text-center flex-1"
              />

              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(availableQuantity, quantity + 1))}
                disabled={quantity >= availableQuantity}
                className="wb-touch-target"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {selectedComponentId && fromLocationId && (
              <p className="text-xs text-muted-foreground">
                Available: {availableQuantity} units
                {availableQuantity === 0 && (
                  <span className="text-red-600 dark:text-red-400 ml-2">
                    ⚠️ No stock available at source location
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this transfer..."
              className="wb-input resize-none"
              rows={3}
            />
          </div>

          {/* Transfer Summary */}
          {canTransfer && selectedComponent && fromLocation && toLocation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Transfer Summary
                </span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>
                  <strong>{quantity}</strong> units of{" "}
                  <strong>{selectedComponent.componentNumber}</strong>
                </p>
                <p>
                  From <strong>{fromLocation.name}</strong> to{" "}
                  <strong>{toLocation.name}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Error States */}
          {fromLocationId === toLocationId && fromLocationId && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-200">
                  Source and destination locations cannot be the same
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 wb-touch-target"
              disabled={transferMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!canTransfer || transferMutation.isPending}
              className="flex-1 wb-btn-primary wb-touch-target"
            >
              {transferMutation.isPending ? "Transferring..." : "Transfer Items"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
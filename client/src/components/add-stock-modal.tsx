import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Package, MapPin } from "lucide-react";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: number;
  componentNumber?: string;
}

export default function AddStockModal({ 
  isOpen, 
  onClose, 
  componentId,
  componentNumber 
}: AddStockModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    locationId: "",
    quantity: "",
    notes: "",
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
    enabled: isOpen,
  });

  // Fetch current inventory for this component
  const { data: currentInventory = [] } = useQuery({
    queryKey: ["/api/inventory", "component", componentId],
    enabled: isOpen && !!componentId,
  });

  // Add stock mutation
  const addStockMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/transactions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId,
          locationId: parseInt(data.locationId),
          quantity: parseInt(data.quantity),
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add stock");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock Added",
        description: `Successfully added ${formData.quantity} units to inventory`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/components", componentId] });
      
      // Reset form and close
      setFormData({ locationId: "", quantity: "", notes: "" });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.locationId || !formData.quantity) {
      toast({
        title: "Missing Information",
        description: "Please select a location and enter quantity",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    addStockMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get current stock for selected location
  const selectedLocationStock = currentInventory.find(
    (item: any) => item.locationId === parseInt(formData.locationId)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Stock</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Component Info */}
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{componentNumber}</p>
                  <p className="text-sm text-gray-500">Component ID: {componentId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label htmlFor="location">Select Location</Label>
            <Select
              value={formData.locationId}
              onValueChange={(value) => handleChange("locationId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose inventory location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location: any) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{location.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Stock Display */}
          {formData.locationId && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Current Stock
                  </span>
                  <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {selectedLocationStock?.quantity || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Add any notes about this stock addition..."
              rows={3}
            />
          </div>

          {/* Preview of New Total */}
          {formData.locationId && formData.quantity && parseInt(formData.quantity) > 0 && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    New Total
                  </span>
                  <span className="text-lg font-bold text-green-900 dark:text-green-100">
                    {(selectedLocationStock?.quantity || 0) + parseInt(formData.quantity)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addStockMutation.isPending || !formData.locationId || !formData.quantity}
              className="flex-1"
            >
              {addStockMutation.isPending ? "Adding..." : "Add Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
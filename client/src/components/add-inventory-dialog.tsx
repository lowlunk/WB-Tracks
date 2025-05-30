import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus } from "lucide-react";

interface AddInventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInventoryDialog({ isOpen, onClose }: AddInventoryDialogProps) {
  const [formData, setFormData] = useState({
    componentId: "",
    locationId: "",
    quantity: 1,
    notes: ""
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch components and locations
  const { data: components = [] } = useQuery({
    queryKey: ["/api/components"],
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  const addInventoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/transactions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add inventory");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      
      toast({
        title: "Success",
        description: `Added ${formData.quantity} items to inventory`,
      });
      
      onClose();
      setFormData({
        componentId: "",
        locationId: "",
        quantity: 1,
        notes: ""
      });
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
    
    if (!formData.componentId || !formData.locationId || formData.quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addInventoryMutation.mutate({
      componentId: parseInt(formData.componentId),
      locationId: parseInt(formData.locationId),
      quantity: formData.quantity,
      notes: formData.notes
    });
  };

  const selectedComponent = components.find((c: any) => c.id === parseInt(formData.componentId));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add New Inventory
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="component">Component *</Label>
            <Select 
              value={formData.componentId} 
              onValueChange={(value) => setFormData({ ...formData, componentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select component" />
              </SelectTrigger>
              <SelectContent>
                {components.map((component: any) => (
                  <SelectItem key={component.id} value={component.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{component.componentNumber}</span>
                      <span className="text-xs text-gray-500 truncate">
                        {component.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Select 
              value={formData.locationId} 
              onValueChange={(value) => setFormData({ ...formData, locationId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location: any) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., New shipment from supplier..."
            />
          </div>

          {selectedComponent && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium">{selectedComponent.componentNumber}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {selectedComponent.description}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addInventoryMutation.isPending}
              className="flex-1"
            >
              {addInventoryMutation.isPending ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Inventory
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
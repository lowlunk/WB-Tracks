import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus } from "lucide-react";

interface AddComponentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddComponentDialog({ isOpen, onClose }: AddComponentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    componentNumber: "",
    description: "",
    category: "",
    supplier: "",
    unitPrice: "",
    notes: "",
  });

  // Create component mutation
  const createComponentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create component");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      toast({
        title: "Success",
        description: "Component created successfully",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create component",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.componentNumber || !formData.description) {
      toast({
        title: "Error",
        description: "Component number and description are required",
        variant: "destructive",
      });
      return;
    }

    createComponentMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClose = () => {
    setFormData({
      componentNumber: "",
      description: "",
      plateNumber: "",
      category: "",
      supplier: "",
      unitPrice: "",
      notes: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Add New Component
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="componentNumber">Component Number *</Label>
              <Input
                id="componentNumber"
                name="componentNumber"
                value={formData.componentNumber}
                onChange={handleChange}
                placeholder="e.g., 217520"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Electronics"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter component description"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g., Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price ($)</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this component"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createComponentMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              {createComponentMutation.isPending ? "Creating..." : "Create Component"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
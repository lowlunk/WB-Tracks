import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Package, QrCode } from "lucide-react";
import QRCodeGenerator from "@/components/qr-code-generator";

interface Component {
  id: number;
  componentNumber: string;
  description: string;
  category?: string;
  supplier?: string;
  unitPrice?: number;
  notes?: string;
  mainStock?: number;
  lineStock?: number;
}

interface ComponentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  component: Component;
}

export default function ComponentEditDialog({ isOpen, onClose, component }: ComponentEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    componentNumber: component.componentNumber || "",
    description: component.description || "",
    category: component.category || "",
    supplier: component.supplier || "",
    unitPrice: component.unitPrice?.toString() || "",
    notes: component.notes || "",
    mainStock: component.mainStock?.toString() || "0",
    lineStock: component.lineStock?.toString() || "0",
  });

  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    setFormData({
      componentNumber: component.componentNumber || "",
      description: component.description || "",
      category: component.category || "",
      supplier: component.supplier || "",
      unitPrice: component.unitPrice?.toString() || "",
      notes: component.notes || "",
      mainStock: component.mainStock?.toString() || "0",
      lineStock: component.lineStock?.toString() || "0",
    });
  }, [component]);

  // Update component mutation
  const updateComponentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/components/${component.id}`, {
        method: "PUT",
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
        throw new Error(error.message || "Failed to update component");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      toast({
        title: "Success",
        description: "Component updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update component",
        variant: "destructive",
      });
    },
  });

  // Update stock levels
  const updateStockMutation = useMutation({
    mutationFn: async (stockData: { mainStock: number; lineStock: number }) => {
      // Update main inventory
      if (stockData.mainStock !== (component.mainStock || 0)) {
        await fetch(`/api/inventory/${component.id}/1`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: stockData.mainStock }),
        });
      }
      
      // Update line inventory  
      if (stockData.lineStock !== (component.lineStock || 0)) {
        await fetch(`/api/inventory/${component.id}/2`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: stockData.lineStock }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Stock levels updated successfully",
      });
    },
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch(`/api/components/${component.id}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload photo");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPhotos(prev => [...prev, data.imageUrl]);
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update component details
    await updateComponentMutation.mutateAsync(formData);
    
    // Update stock levels
    await updateStockMutation.mutateAsync({
      mainStock: parseInt(formData.mainStock) || 0,
      lineStock: parseInt(formData.lineStock) || 0,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Edit Component: {component.componentNumber}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Component Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Component Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="componentNumber">Component Number</Label>
                <Input
                  id="componentNumber"
                  name="componentNumber"
                  value={formData.componentNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ($)</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            {/* Stock Management & Photos */}
            <div className="space-y-4">
              {/* Stock Levels */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mainStock">Main Inventory</Label>
                    <Input
                      id="mainStock"
                      name="mainStock"
                      type="number"
                      min="0"
                      value={formData.mainStock}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lineStock">Line Inventory</Label>
                    <Input
                      id="lineStock"
                      name="lineStock"
                      type="number"
                      min="0"
                      value={formData.lineStock}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Photo Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Photos</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhotoMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Component photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {photos.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No photos uploaded</p>
                      <p className="text-sm">Click "Upload Photo" to add images</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={updateComponentMutation.isPending || updateStockMutation.isPending}
            >
              {updateComponentMutation.isPending || updateStockMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Star } from "lucide-react";
import type { Component, ComponentPhoto } from "@shared/schema";

interface ComponentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: number;
}

export default function ComponentEditModal({ isOpen, onClose, componentId }: ComponentEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    componentNumber: "",
    description: "",
    category: "",
    supplier: "",
    unitPrice: "",
    notes: "",
  });

  // Fetch component data
  const { data: component, isLoading } = useQuery({
    queryKey: ["/api/components", componentId],
    enabled: isOpen && !!componentId,
  });

  // Update form data when component data is loaded
  useEffect(() => {
    if (component) {
      setFormData({
        componentNumber: (component as any).componentNumber || "",
        description: (component as any).description || "",
        category: (component as any).category || "",
        supplier: (component as any).supplier || "",
        unitPrice: (component as any).unitPrice?.toString() || "",
        notes: (component as any).notes || "",
      });
    }
  }, [component]);

  // Fetch component photos
  const { data: photos = [] } = useQuery({
    queryKey: ["/api/components", componentId, "photos"],
    enabled: isOpen && !!componentId,
  });

  // Update component mutation
  const updateComponentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/components/${componentId}`, {
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

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch(`/api/components/${componentId}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload photo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components", componentId, "photos"] });
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

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/components/${componentId}/photos/${photoId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete photo");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components", componentId, "photos"] });
      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
    },
  });

  // Set primary photo mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/components/${componentId}/photos/${photoId}/primary`, {
        method: "PUT",
      });
      if (!response.ok) {
        throw new Error("Failed to set primary photo");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components", componentId, "photos"] });
      toast({
        title: "Success",
        description: "Primary photo updated",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateComponentMutation.mutate(formData);
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

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">Loading component...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Component: {component?.componentNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Component Details Form */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
            </form>
          </div>

          {/* Photo Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
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
            
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {photos.map((photo: ComponentPhoto) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Component photo"}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={photo.isPrimary ? "default" : "secondary"}
                        onClick={() => setPrimaryMutation.mutate(photo.id)}
                        disabled={setPrimaryMutation.isPending}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePhotoMutation.mutate(photo.id)}
                        disabled={deletePhotoMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                      Primary
                    </div>
                  )}
                  
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 rounded-b-lg text-sm">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
              
              {photos.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No photos uploaded yet</p>
                  <p className="text-sm">Click "Upload Photo" to add images</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={updateComponentMutation.isPending}
          >
            {updateComponentMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
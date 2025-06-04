import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Camera, 
  Upload, 
  X, 
  Star, 
  History, 
  MapPin, 
  Truck, 
  Minus,
  Plus,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface ComponentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: number;
  onEdit?: () => void;
}

export default function ComponentDetailModal({ 
  isOpen, 
  onClose, 
  componentId,
  onEdit 
}: ComponentDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch component data
  const { data: component, isLoading: componentLoading } = useQuery({
    queryKey: ["/api/components", componentId],
    enabled: isOpen && !!componentId,
  });

  // Fetch component photos
  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ["/api/components", componentId, "photos"],
    enabled: isOpen && !!componentId,
  });

  // Fetch inventory data for this component
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory", "component", componentId],
    enabled: isOpen && !!componentId,
  });

  // Fetch recent transactions for this component
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions", "component", componentId],
    enabled: isOpen && !!componentId,
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/components/${componentId}/photos`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload photo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components", componentId, "photos"] });
      toast({
        title: "Photo uploaded successfully",
        description: "The photo has been added to the component.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/components/${componentId}/photos/${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components", componentId, "photos"] });
      toast({
        title: "Photo deleted",
        description: "The photo has been removed.",
      });
    },
  });

  // Set primary photo mutation
  const setPrimaryPhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/components/${componentId}/photos/${photoId}/primary`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Failed to set primary photo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components", componentId, "photos"] });
      toast({
        title: "Primary photo updated",
        description: "The primary photo has been set.",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      uploadPhotoMutation.mutate(file);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <Truck className="h-4 w-4" />;
      case 'consume':
        return <Minus className="h-4 w-4" />;
      case 'add':
        return <Plus className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'text-blue-600';
      case 'consume':
        return 'text-red-600';
      case 'add':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (componentLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!component) return null;

  const comp = component as any;
  const totalMainStock = inventoryItems
    .filter((item: any) => item.location?.name === "Main Inventory")
    .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    
  const totalLineStock = inventoryItems
    .filter((item: any) => item.location?.name === "Line Inventory")
    .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>{comp.componentNumber}</span>
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center space-x-1"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Component Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Component Number</Label>
                    <p className="text-lg font-semibold">{comp.componentNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Plate Number</Label>
                    <p className="text-lg">{comp.plateNumber || 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-lg">{comp.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    <p>{comp.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Supplier</Label>
                    <p>{comp.supplier || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Unit Price</Label>
                    <p>{comp.unitPrice ? `$${comp.unitPrice}` : 'Not specified'}</p>
                  </div>
                </div>

                {comp.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Notes</Label>
                    <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{comp.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Main Inventory</p>
                      <p className="text-2xl font-bold">{totalMainStock}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Line Inventory</p>
                      <p className="text-2xl font-bold">{totalLineStock}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Locations</CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No inventory found for this component</p>
                ) : (
                  <div className="space-y-3">
                    {inventoryItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{item.location?.name}</p>
                            <p className="text-sm text-gray-500">{item.location?.description}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {item.quantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Component Photos</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhotoMutation.isPending}
                    className="flex items-center space-x-1"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {photosLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No photos yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Upload photos to help identify this component.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo: any) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.imageUrl}
                          alt="Component photo"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPrimaryPhotoMutation.mutate(photo.id)}
                            disabled={photo.isPrimary}
                            className="text-xs"
                          >
                            {photo.isPrimary ? <Star className="h-3 w-3 fill-current" /> : <Star className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deletePhotoMutation.mutate(photo.id)}
                            className="text-xs"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {photo.isPrimary && (
                          <div className="absolute top-2 left-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent activity found</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)} bg-current bg-opacity-10`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium capitalize">{transaction.type}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Quantity: {transaction.quantity}
                            {transaction.fromLocation && ` from ${transaction.fromLocation.name}`}
                            {transaction.toLocation && ` to ${transaction.toLocation.name}`}
                          </p>
                          {transaction.notes && (
                            <p className="text-xs text-gray-500 mt-1">{transaction.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
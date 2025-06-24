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
  Edit,
  Maximize2,
  ZoomIn
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
  const [expandedPhoto, setExpandedPhoto] = useState<any>(null);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

  // Fetch component data
  const { data: component, isLoading: componentLoading } = useQuery({
    queryKey: ["/api/components", componentId],
    queryFn: async () => {
      const response = await fetch(`/api/components/${componentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch component');
      }
      return response.json();
    },
    enabled: isOpen && !!componentId,
  });

  // Fetch component photos
  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ["/api/components", componentId, "photos"],
    queryFn: async () => {
      const response = await fetch(`/api/components/${componentId}/photos`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      const data = await response.json();
      console.log('Photos data:', data, 'Length:', data.length, 'Type:', typeof data);
      // Force empty array if no valid photos
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }
      return data;
    },
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
        const errorText = await response.text();
        let errorMessage = 'Failed to upload photo';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components", componentId, "photos"] });
      toast({
        title: "Photo uploaded successfully",
        description: "The photo has been added to the component.",
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message.includes('fs') ? 'Photo upload is temporarily unavailable. Please try again later.' : error.message,
        variant: "destructive",
      });
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
  const inventoryItemsArray = Array.isArray(inventoryItems) ? inventoryItems : [];

  // Calculate stock levels for this specific component only
  const totalMainStock = inventoryItemsArray
    .filter((item: any) => item.componentId === componentId && item.location?.name === "Main Inventory")
    .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const totalLineStock = inventoryItemsArray
    .filter((item: any) => item.componentId === componentId && item.location?.name === "Line Inventory")
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
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
                <div className="flex items-center justify-between">
                  <CardTitle>Current Stock Levels</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddStockModalOpen(true)}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Stock</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Stock Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Main Inventory</p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalMainStock}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-300">Central storage area</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">Line Inventory</p>
                              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalLineStock}</p>
                              <p className="text-xs text-green-600 dark:text-green-300">Production line stock</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Total Stock */}
                    <Card className="border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Stock</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalMainStock + totalLineStock}</p>
                          </div>
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed Breakdown - Only show if there are actual inventory items */}
                    {inventoryItemsArray.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Detailed Breakdown</h4>
                        <div className="space-y-2">
                          {inventoryItemsArray
                            .filter((item: any) => item.componentId === componentId)
                            .map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border">
                              <div className="flex items-center space-x-3">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="font-medium text-sm">{item.location?.name || 'Unknown Location'}</p>
                                  <p className="text-xs text-gray-500">{item.location?.description || 'No description'}</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="font-semibold">
                                {item.quantity || 0}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {inventoryItemsArray.length === 0 && (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No Stock Available
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          This component doesn't have any stock in inventory yet.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddStockModalOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Initial Stock
                        </Button>
                      </div>
                    )}
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
                ) : !Array.isArray(photos) || photos.length === 0 ? (
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
                    {photos.filter((photo: any) => photo && photo.id).map((photo: any) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.imageUrl}
                          alt="Component photo"
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setExpandedPhoto(photo)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPhoto(photo);
                            }}
                            className="text-xs"
                          >
                            <ZoomIn className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryPhotoMutation.mutate(photo.id);
                            }}
                            disabled={photo.isPrimary}
                            className="text-xs"
                          >
                            {photo.isPrimary ? <Star className="h-3 w-3 fill-current" /> : <Star className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePhotoMutation.mutate(photo.id);
                            }}
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
                ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent activity found</p>
                ) : (
                  <div className="space-y-3">
                    {(transactions as any[]).map((transaction: any) => (
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
      
      {/* Photo Expansion Modal */}
      {expandedPhoto && (
        <Dialog open={!!expandedPhoto} onOpenChange={() => setExpandedPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <div className="relative">
              <img
                src={expandedPhoto.imageUrl}
                alt="Expanded component photo"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPrimaryPhotoMutation.mutate(expandedPhoto.id)}
                  disabled={expandedPhoto.isPrimary}
                  className="bg-white/90 hover:bg-white"
                >
                  {expandedPhoto.isPrimary ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                  {expandedPhoto.isPrimary ? "Primary" : "Set as Primary"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedPhoto(null)}
                  className="bg-white/90 hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {expandedPhoto.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                  <p className="text-sm">{expandedPhoto.caption}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
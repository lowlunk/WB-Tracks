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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  FileUp, 
  Download, 
  Plus, 
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Users,
  ClipboardList,
  BarChart3,
  Calendar,
  Upload
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Code39Scanner from "@/components/code39-scanner";

interface ShiftPickingItem {
  id: number;
  shiftPickingId: number;
  inventoryCode: string;
  partDescription: string;
  quantityRequired: number;
  quantityPicked: number;
  transferTime: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  pickedBy: number | null;
  notes: string | null;
  componentId: number | null;
  component?: {
    id: number;
    componentNumber: string;
    description: string;
    barcode: string;
  };
}

interface ShiftPicking {
  id: number;
  shiftNumber: 1 | 2 | 3;
  shiftDate: string;
  status: 'draft' | 'active' | 'completed';
  createdBy: number;
  assignedTo: number | null;
  completedAt: string | null;
  totalItems: number;
  completedItems: number;
  items: ShiftPickingItem[];
}

export default function ShiftPicking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedShift, setSelectedShift] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingItem, setEditingItem] = useState<ShiftPickingItem | null>(null);
  
  const [newPickingForm, setNewPickingForm] = useState({
    shiftNumber: 1 as 1 | 2 | 3,
    shiftDate: new Date().toISOString().split('T')[0],
    assignedTo: ""
  });

  const [newItemForm, setNewItemForm] = useState({
    inventoryCode: "",
    partDescription: "",
    quantityRequired: "",
    notes: ""
  });

  const [importFile, setImportFile] = useState<File | null>(null);

  // Fetch shift picking data
  const { data: shiftPickings, isLoading } = useQuery({
    queryKey: [`/api/shift-picking/${selectedDate}/${selectedShift}`],
  });

  // Fetch all shift pickings for overview
  const { data: allShiftPickings } = useQuery({
    queryKey: [`/api/shift-picking/overview/${selectedDate}`],
  });

  // Fetch users for assignment
  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Create shift picking mutation
  const createShiftPickingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/shift-picking", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Shift Picking Created",
        description: "New shift picking worksheet has been created"
      });
      setShowCreateDialog(false);
      setNewPickingForm({ shiftNumber: 1, shiftDate: new Date().toISOString().split('T')[0], assignedTo: "" });
      queryClient.invalidateQueries({ queryKey: [`/api/shift-picking/${selectedDate}/${selectedShift}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/shift-picking/overview/${selectedDate}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async ({ shiftPickingId, item }: { shiftPickingId: number, item: any }) => {
      return await apiRequest(`/api/shift-picking/${shiftPickingId}/items`, {
        method: "POST",
        body: JSON.stringify(item)
      });
    },
    onSuccess: () => {
      toast({
        title: "Item Added",
        description: "Component added to picking list"
      });
      setShowAddItemDialog(false);
      setNewItemForm({ inventoryCode: "", partDescription: "", quantityRequired: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: [`/api/shift-picking/${selectedDate}/${selectedShift}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update item status mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: number, updates: any }) => {
      return await apiRequest(`/api/shift-picking/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      toast({
        title: "Item Updated",
        description: "Picking item has been updated"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/shift-picking/${selectedDate}/${selectedShift}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Import worksheet mutation
  const importWorksheetMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await fetch("/api/shift-picking/import", {
        method: "POST",
        body: formData
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Worksheet Imported",
        description: "Components have been imported from worksheet"
      });
      setShowImportDialog(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: [`/api/shift-picking/${selectedDate}/${selectedShift}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/shift-picking/overview/${selectedDate}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateShiftPicking = () => {
    createShiftPickingMutation.mutate({
      ...newPickingForm,
      assignedTo: newPickingForm.assignedTo ? parseInt(newPickingForm.assignedTo) : null
    });
  };

  const handleAddItem = () => {
    if (!shiftPickings?.id) return;
    
    addItemMutation.mutate({
      shiftPickingId: shiftPickings.id,
      item: {
        ...newItemForm,
        quantityRequired: parseInt(newItemForm.quantityRequired)
      }
    });
  };

  const handleMarkCompleted = (itemId: number) => {
    updateItemMutation.mutate({
      itemId,
      updates: {
        status: 'completed',
        quantityPicked: null, // Will use quantityRequired
        transferTime: new Date().toISOString()
      }
    });
  };

  const handleImportWorksheet = () => {
    if (!importFile) return;
    
    const formData = new FormData();
    formData.append('worksheet', importFile);
    formData.append('shiftNumber', selectedShift.toString());
    formData.append('shiftDate', selectedDate);
    
    importWorksheetMutation.mutate(formData);
  };

  const handleBarcodeScanned = (component: any) => {
    setNewItemForm(prev => ({
      ...prev,
      inventoryCode: component.componentNumber,
      partDescription: component.description
    }));
    setShowScanner(false);
  };

  const getShiftStatus = (shift: ShiftPicking) => {
    if (shift.status === 'completed') return 'completed';
    if (shift.completedItems === 0) return 'not_started';
    if (shift.completedItems === shift.totalItems) return 'completed';
    return 'in_progress';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Component Traceability Forms
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Digital shift-based picking worksheets for main-to-line inventory transfers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowImportDialog(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            Import Worksheet
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Shift Picking
          </Button>
        </div>
      </div>

      {/* Date and Shift Selector */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label>Shift</Label>
          <div className="flex space-x-2 mt-1">
            {[1, 2, 3].map((shift) => (
              <Button
                key={shift}
                variant={selectedShift === shift ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedShift(shift as 1 | 2 | 3)}
              >
                Shift {shift}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Shift</TabsTrigger>
          <TabsTrigger value="overview">Daily Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Current Shift Tab */}
        <TabsContent value="current" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !shiftPickings ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <ClipboardList className="h-16 w-16 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      No Picking List for Shift {selectedShift}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Create a new shift picking list or import from worksheet
                    </p>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                    <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                      <FileUp className="h-4 w-4 mr-2" />
                      Import Worksheet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Shift Info Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Shift {shiftPickings.shiftNumber} - {new Date(shiftPickings.shiftDate).toLocaleDateString()}
                      </CardTitle>
                      <CardDescription>
                        {shiftPickings.completedItems} of {shiftPickings.totalItems} items completed
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(getShiftStatus(shiftPickings))}>
                        {getShiftStatus(shiftPickings).replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Button size="sm" onClick={() => setShowAddItemDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Picking Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Picking List</CardTitle>
                  <CardDescription>
                    Components to transfer from Main Inventory to Line Inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inventory Code</TableHead>
                        <TableHead>Part Description</TableHead>
                        <TableHead>Qty Required</TableHead>
                        <TableHead>Transfer Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shiftPickings.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.inventoryCode}
                          </TableCell>
                          <TableCell>{item.partDescription}</TableCell>
                          <TableCell>{item.quantityRequired}</TableCell>
                          <TableCell>
                            {item.transferTime 
                              ? new Date(item.transferTime).toLocaleTimeString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {item.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkCompleted(item.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Daily Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((shift) => {
              const shiftData = (allShiftPickings as ShiftPicking[] || []).find(s => s.shiftNumber === shift);
              return (
                <Card key={shift}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Shift {shift}</span>
                      <Badge className={getStatusColor(shiftData ? getShiftStatus(shiftData) : 'pending')}>
                        {shiftData ? getShiftStatus(shiftData).replace('_', ' ').toUpperCase() : 'NOT CREATED'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {shiftData ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Items:</span>
                          <span className="font-medium">{shiftData.totalItems}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Completed:</span>
                          <span className="font-medium">{shiftData.completedItems}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Progress:</span>
                          <span className="font-medium">
                            {shiftData.totalItems > 0 ? Math.round((shiftData.completedItems / shiftData.totalItems) * 100) : 0}%
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-3"
                          onClick={() => {
                            setSelectedShift(shift as 1 | 2 | 3);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <p className="text-sm text-muted-foreground">No picking list created</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedShift(shift as 1 | 2 | 3);
                            setShowCreateDialog(true);
                          }}
                        >
                          Create
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Shift Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics and reporting features will be available in future updates.
                Track completion rates, average transfer times, and productivity metrics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Shift Picking Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shift Picking</DialogTitle>
            <DialogDescription>
              Create a new component traceability form for shift-based picking
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shiftNumber">Shift Number</Label>
                <Select 
                  value={newPickingForm.shiftNumber.toString()} 
                  onValueChange={(value) => setNewPickingForm(prev => ({ ...prev, shiftNumber: parseInt(value) as 1 | 2 | 3 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Shift 1</SelectItem>
                    <SelectItem value="2">Shift 2</SelectItem>
                    <SelectItem value="3">Shift 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="shiftDate">Shift Date</Label>
                <Input
                  id="shiftDate"
                  type="date"
                  value={newPickingForm.shiftDate}
                  onChange={(e) => setNewPickingForm(prev => ({ ...prev, shiftDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="assignedTo">Assign To (Optional)</Label>
              <Select 
                value={newPickingForm.assignedTo} 
                onValueChange={(value) => setNewPickingForm(prev => ({ ...prev, assignedTo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select picker" />
                </SelectTrigger>
                <SelectContent>
                  {(users as any[] || []).map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateShiftPicking}
              disabled={createShiftPickingMutation.isPending}
            >
              {createShiftPickingMutation.isPending ? "Creating..." : "Create Shift Picking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Worksheet Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Component Worksheet</DialogTitle>
            <DialogDescription>
              Upload an Excel or CSV worksheet with columns: Inventory Code, Part Description, Transfer Time
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="worksheetFile">Worksheet File</Label>
              <Input
                id="worksheetFile"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Expected Format:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Inventory Code:</strong> Component part number (e.g., 217520)</li>
                <li>• <strong>Part Description:</strong> Component description</li>
                <li>• <strong>Transfer Time:</strong> Optional - when to transfer (or leave blank)</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportWorksheet}
              disabled={!importFile || importWorksheetMutation.isPending}
            >
              {importWorksheetMutation.isPending ? "Importing..." : "Import Worksheet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Picking Item</DialogTitle>
            <DialogDescription>
              Add a component to the current shift picking list
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="inventoryCode">Inventory Code</Label>
              <div className="flex gap-2">
                <Input
                  id="inventoryCode"
                  value={newItemForm.inventoryCode}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, inventoryCode: e.target.value }))}
                  placeholder="Component part number"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScanner(true)}
                  className="px-3"
                >
                  Scan
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="partDescription">Part Description</Label>
              <Input
                id="partDescription"
                value={newItemForm.partDescription}
                onChange={(e) => setNewItemForm(prev => ({ ...prev, partDescription: e.target.value }))}
                placeholder="Component description"
              />
            </div>
            
            <div>
              <Label htmlFor="quantityRequired">Quantity Required</Label>
              <Input
                id="quantityRequired"
                type="number"
                value={newItemForm.quantityRequired}
                onChange={(e) => setNewItemForm(prev => ({ ...prev, quantityRequired: e.target.value }))}
                placeholder="Enter quantity needed"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={newItemForm.notes}
                onChange={(e) => setNewItemForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddItem}
              disabled={!newItemForm.inventoryCode || !newItemForm.quantityRequired || addItemMutation.isPending}
            >
              {addItemMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      {showScanner && (
        <Code39Scanner
          onResult={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
          navigateOnScan={false}
        />
      )}
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Code39Scanner from "@/components/code39-scanner";
import { apiRequest } from "@/lib/queryClient";
import {
  ListOrdered,
  Plus,
  Search,
  Calendar,
  User,
  Package,
  QrCode,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRightLeft,
  Download,
  Upload,
  Edit,
  Eye
} from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  targetDate?: string;
  completedAt?: string;
  createdBy: number;
  assignedTo?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
  createdByUser?: { firstName: string; lastName: string; username: string };
  assignedToUser?: { firstName: string; lastName: string; username: string };
}

interface OrderItem {
  id: number;
  orderId: number;
  componentId: number;
  quantityRequested: number;
  quantityPicked: number;
  fromLocationId?: number;
  toLocationId?: number;
  status: string;
  notes?: string;
  pickedAt?: string;
  transferredAt?: string;
  component?: {
    id: number;
    componentNumber: string;
    description: string;
  };
  fromLocation?: { name: string };
  toLocation?: { name: string };
}

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTargetOrder, setScanTargetOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newOrder, setNewOrder] = useState({
    title: "",
    description: "",
    priority: "normal",
    targetDate: "",
    notes: "",
  });

  const [newItem, setNewItem] = useState({
    componentId: null as number | null,
    quantityRequested: 1,
    fromLocationId: null as number | null,
    toLocationId: null as number | null,
    notes: "",
  });

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Fetch locations for dropdowns
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowCreateDialog(false);
      setNewOrder({
        title: "",
        description: "",
        priority: "normal",
        targetDate: "",
        notes: "",
      });
      toast({
        title: "Order Created",
        description: "New order has been created successfully.",
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

  // Add item to order mutation
  const addItemMutation = useMutation({
    mutationFn: async ({ orderId, item }: { orderId: number; item: any }) => {
      return await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowItemDialog(false);
      setNewItem({
        componentId: null,
        quantityRequested: 1,
        fromLocationId: null,
        toLocationId: null,
        notes: "",
      });
      toast({
        title: "Item Added",
        description: "Component added to order successfully.",
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

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status Updated",
        description: "Order status updated successfully.",
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

  const filteredOrders = (orders as Order[]).filter((order: Order) => {
    const matchesSearch = 
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "normal": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "urgent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const handleScanForOrder = (order: Order) => {
    setScanTargetOrder(order);
    setShowScanner(true);
  };

  const handleBarcodeScanned = (component: any) => {
    if (scanTargetOrder) {
      // Auto-add scanned component to the order
      const warehouseLocation = (locations as any[]).find((loc: any) => 
        loc.name.toLowerCase().includes('warehouse') || loc.name.toLowerCase().includes('main')
      );
      const insertLocation = (locations as any[]).find((loc: any) => 
        loc.name.toLowerCase().includes('insert') || loc.name.toLowerCase().includes('line')
      );

      addItemMutation.mutate({
        orderId: scanTargetOrder.id,
        item: {
          componentId: component.id,
          quantityRequested: 1,
          fromLocationId: warehouseLocation?.id || null,
          toLocationId: insertLocation?.id || null,
          notes: `Scanned: ${component.componentNumber}`,
        },
      });
      setScanTargetOrder(null);
    }
  };

  const handleCreateOrder = () => {
    createOrderMutation.mutate(newOrder);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground">
            Daily pick lists and warehouse-to-insert transfers
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="wb-btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order: Order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{order.title}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>#{order.orderNumber}</span>
                  <Badge className={getPriorityColor(order.priority)} variant="outline">
                    {order.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {order.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{order.orderItems?.length || 0} items</span>
                  </div>
                  {order.targetDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(order.targetDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScanForOrder(order)}
                    className="flex-1"
                  >
                    <QrCode className="h-3 w-3 mr-1" />
                    Scan
                  </Button>
                </div>

                {order.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "in_progress" })}
                    className="w-full"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Start Order
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <ListOrdered className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedStatus !== "all" 
                ? "Try adjusting your filters" 
                : "Create your first order to get started"}
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="wb-btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Order Title</Label>
              <Input
                id="title"
                value={newOrder.title}
                onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })}
                placeholder="Daily transfer list..."
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newOrder.description}
                onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                placeholder="Components needed for insert line..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newOrder.priority} onValueChange={(value) => setNewOrder({ ...newOrder, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newOrder.targetDate}
                  onChange={(e) => setNewOrder({ ...newOrder, targetDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newOrder.notes}
                onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={!newOrder.title.trim() || createOrderMutation.isPending}
              className="wb-btn-primary"
            >
              {createOrderMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5" />
                {selectedOrder.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order #:</span> {selectedOrder.orderNumber}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Priority:</span>{" "}
                  <Badge className={getPriorityColor(selectedOrder.priority)}>
                    {selectedOrder.priority}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Items:</span> {selectedOrder.orderItems?.length || 0}
                </div>
              </div>

              {selectedOrder.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{selectedOrder.description}</p>
                </div>
              )}

              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Order Items</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedOrder.orderItems.map((item: OrderItem) => (
                      <div key={item.id} className="border rounded p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {item.component?.componentNumber} - {item.component?.description}
                          </span>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Requested: {item.quantityRequested}</span>
                          <span>Picked: {item.quantityPicked}</span>
                        </div>
                        {item.fromLocation && (
                          <div className="text-xs text-muted-foreground mt-1">
                            From: {item.fromLocation.name} → To: {item.toLocation?.name || 'Not set'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleScanForOrder(selectedOrder)}
                  className="flex-1"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan to Add Components
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Scanner Modal */}
      <Code39Scanner
        isOpen={showScanner}
        onClose={() => {
          setShowScanner(false);
          setScanTargetOrder(null);
        }}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
}
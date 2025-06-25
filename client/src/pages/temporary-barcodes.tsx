import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QrCode, Plus, Trash2, Clock, Eye, Copy, RefreshCw, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import QRCode from "qrcode";

const createBarcodeSchema = z.object({
  componentId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  purpose: z.enum(['testing', 'training', 'demo']),
  description: z.string().optional(),
  expirationHours: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(168))
});

type CreateBarcodeFormData = z.infer<typeof createBarcodeSchema>;

interface TemporaryBarcode {
  id: number;
  barcode: string;
  componentId?: number;
  purpose: string;
  description?: string;
  createdBy: number;
  expiresAt: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface Component {
  id: number;
  componentNumber: string;
  description: string;
}

export default function TemporaryBarcodesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState<TemporaryBarcode | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch temporary barcodes
  const { data: barcodes = [], isLoading } = useQuery({
    queryKey: ["/api/barcodes/temporary"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch components for linking
  const { data: components = [] } = useQuery<Component[]>({
    queryKey: ["/api/components"],
  });

  // Create barcode mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateBarcodeFormData) => {
      const response = await fetch("/api/barcodes/temporary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/barcodes/temporary"] });
      setCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Temporary barcode created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create temporary barcode",
        variant: "destructive",
      });
    },
  });

  // Delete barcode mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/barcodes/temporary/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/barcodes/temporary"] });
      toast({
        title: "Success",
        description: "Temporary barcode deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete temporary barcode",
        variant: "destructive",
      });
    },
  });

  // Cleanup expired barcodes mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/barcodes/temporary/cleanup", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/barcodes/temporary"] });
      toast({
        title: "Success",
        description: `Cleaned up ${data.deletedCount} expired barcodes`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cleanup expired barcodes",
        variant: "destructive",
      });
    },
  });

  const form = useForm<CreateBarcodeFormData>({
    resolver: zodResolver(createBarcodeSchema),
    defaultValues: {
      purpose: 'testing',
      expirationHours: '24',
    },
  });

  const onSubmit = (data: CreateBarcodeFormData) => {
    // Convert "none" back to undefined for the API
    const submitData = {
      ...data,
      componentId: data.componentId === "none" ? undefined : data.componentId
    };
    createMutation.mutate(submitData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Barcode copied to clipboard",
    });
  };

  const generateQRCode = async (barcode: string) => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(barcode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const printBarcode = async (barcode: TemporaryBarcode) => {
    try {
      const qrCodeDataURL = await generateQRCode(barcode.barcode);
      if (!qrCodeDataURL) {
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Please allow popups to print barcodes",
          variant: "destructive",
        });
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barcode - ${barcode.barcode}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                margin: 20px;
                background: white;
              }
              .barcode-container {
                display: inline-block;
                border: 2px solid #ddd;
                padding: 20px;
                margin: 10px;
                background: white;
              }
              .barcode-text {
                font-size: 18px;
                font-weight: bold;
                margin: 10px 0;
                letter-spacing: 2px;
              }
              .barcode-info {
                font-size: 12px;
                color: #666;
                margin: 5px 0;
              }
              .qr-code {
                margin: 10px 0;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="barcode-info">Purpose: ${barcode.purpose.toUpperCase()}</div>
              <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code" />
              <div class="barcode-text">${barcode.barcode}</div>
              <div class="barcode-info">Expires: ${format(new Date(barcode.expiresAt), 'MMM d, HH:mm')}</div>
              ${barcode.description ? `<div class="barcode-info">${barcode.description}</div>` : ''}
            </div>
            <div class="no-print" style="margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin-left: 10px;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate printable barcode",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = async (barcode: TemporaryBarcode) => {
    try {
      const qrCodeDataURL = await generateQRCode(barcode.barcode);
      if (!qrCodeDataURL) {
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
        return;
      }

      const link = document.createElement('a');
      link.download = `barcode-${barcode.barcode}.png`;
      link.href = qrCodeDataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Downloaded",
        description: "QR code downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const getStatusBadge = (barcode: TemporaryBarcode) => {
    if (isExpired(barcode.expiresAt)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (barcode.isActive) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getPurposeBadge = (purpose: string) => {
    const variants = {
      testing: "default" as const,
      training: "secondary" as const,
      demo: "outline" as const,
    };
    return <Badge variant={variants[purpose as keyof typeof variants] || "default"}>{purpose}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <QrCode className="h-8 w-8" />
            Temporary Barcodes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate and manage temporary barcodes for testing purposes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => cleanupMutation.mutate()}
            variant="outline"
            disabled={cleanupMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Cleanup Expired
          </Button>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Barcode
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Temporary Barcode</DialogTitle>
                <DialogDescription>
                  Generate a temporary barcode for testing, training, or demo purposes
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="testing">Testing</SelectItem>
                            <SelectItem value="training">Training</SelectItem>
                            <SelectItem value="demo">Demo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="componentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Component (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select component..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No component</SelectItem>
                            {components.map((component) => (
                              <SelectItem key={component.id} value={component.id.toString()}>
                                {component.componentNumber} - {component.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe the purpose of this barcode..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expirationHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expires In (Hours)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Hour</SelectItem>
                            <SelectItem value="4">4 Hours</SelectItem>
                            <SelectItem value="8">8 Hours</SelectItem>
                            <SelectItem value="24">24 Hours</SelectItem>
                            <SelectItem value="72">3 Days</SelectItem>
                            <SelectItem value="168">1 Week</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Barcode"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barcodes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Temporary Barcodes</CardTitle>
          <CardDescription>
            Manage temporary barcodes for testing and training purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : barcodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No temporary barcodes found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barcodes.map((barcode: TemporaryBarcode) => (
                  <TableRow key={barcode.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                          {barcode.barcode}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(barcode.barcode)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getPurposeBadge(barcode.purpose)}</TableCell>
                    <TableCell>{getStatusBadge(barcode)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {barcode.usageCount} times
                        {barcode.lastUsedAt && (
                          <div className="text-xs text-gray-500">
                            Last: {format(new Date(barcode.lastUsedAt), 'MMM d, HH:mm')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(barcode.expiresAt), 'MMM d, HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedBarcode(barcode)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Temporary Barcode</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this temporary barcode? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(barcode.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Barcode Details Dialog */}
      <Dialog open={!!selectedBarcode} onOpenChange={() => setSelectedBarcode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Barcode Details</DialogTitle>
          </DialogHeader>
          {selectedBarcode && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Barcode</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-lg font-mono">
                    {selectedBarcode.barcode}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(selectedBarcode.barcode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Purpose</label>
                  <div className="mt-1">{getPurposeBadge(selectedBarcode.purpose)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedBarcode)}</div>
                </div>
              </div>

              {selectedBarcode.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedBarcode.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="mt-1">{format(new Date(selectedBarcode.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Expires</label>
                  <p className="mt-1">{format(new Date(selectedBarcode.expiresAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-sm font-medium">Usage Count</label>
                  <p className="mt-1">{selectedBarcode.usageCount} times</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Used</label>
                  <p className="mt-1">
                    {selectedBarcode.lastUsedAt
                      ? format(new Date(selectedBarcode.lastUsedAt), 'MMM d, yyyy HH:mm')
                      : 'Never used'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
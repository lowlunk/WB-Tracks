import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Package,
  TrendingUp,
  DollarSign,
  Clock
} from "lucide-react";

interface InventoryImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IngestionResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    partNumber: string;
    error: string;
  }>;
  summary: {
    newComponents: string[];
    updatedComponents: string[];
    totalValue?: number;
  };
}

export default function InventoryImportDialog({ isOpen, onClose }: InventoryImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [skipZeroQuantity, setSkipZeroQuantity] = useState(true);
  const [importResult, setImportResult] = useState<IngestionResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Create a progress simulation since the actual processing happens on the server
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev; // Don't go past 90% until we get a response
          return prev + Math.random() * 15; // Simulate progress
        });
      }, 500);

      try {
        const response = await fetch('/api/inventory/import', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Import failed');
        }

        const result = await response.json();
        setUploadProgress(100);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (result: IngestionResult) => {
      setImportResult(result);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activity'] });
      
      toast({
        title: "Import Completed",
        description: `Processed ${result.processed} items: ${result.created} created, ${result.updated} updated`,
      });
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import inventory",
        variant: "destructive",
      });
    },
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/inventory/import-template', 'GET');
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'inventory-import-template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Template Downloaded",
        description: "Use this template to format your inventory data",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setImportResult(null);
        setUploadProgress(0);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel (.xlsx, .xls) or CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('skipZeroQuantity', skipZeroQuantity.toString());

    setUploadProgress(5); // Start with a small progress
    importMutation.mutate(formData);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    setUploadProgress(0);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Inventory Data
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="results" disabled={!importResult}>
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Select Inventory File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadTemplateMutation.mutate()}
                    disabled={downloadTemplateMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-sm text-gray-500">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipZero"
                    checked={skipZeroQuantity}
                    onCheckedChange={setSkipZeroQuantity}
                  />
                  <Label htmlFor="skipZero" className="text-sm">
                    Skip items with zero quantity
                  </Label>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing inventory file...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-muted-foreground">
                      Reading file, creating components, and updating inventory
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Import Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Import Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p className="font-medium">Supported file formats:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Excel files (.xlsx, .xls)</li>
                    <li>CSV files (.csv)</li>
                  </ul>
                  
                  <p className="font-medium mt-4">Required columns:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Part Number</strong> - Component identifier (required)</li>
                    <li><strong>Quantity</strong> - Current stock quantity (required)</li>
                  </ul>
                  
                  <p className="font-medium mt-4">Optional columns:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Description - Component description</li>
                    <li>Category - Component category</li>
                    <li>Supplier - Supplier name</li>
                    <li>Unit Price - Cost per unit</li>
                    <li>Notes - Additional information</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || importMutation.isPending}
                className="flex items-center gap-2"
              >
                {importMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Processing {Math.round(uploadProgress)}%
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Inventory
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {importResult && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Processed</p>
                          <p className="text-2xl font-bold">{importResult.processed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium">Updated</p>
                          <p className="text-2xl font-bold text-orange-600">{importResult.updated}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-sm font-medium">Errors</p>
                          <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Success/Error Status */}
                <Alert className={importResult.success ? "border-green-200 bg-green-50 dark:bg-green-950" : "border-red-200 bg-red-50 dark:bg-red-950"}>
                  {importResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={importResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
                    {importResult.success ? (
                      <>Import completed successfully! {importResult.skipped > 0 && `${importResult.skipped} items were skipped.`}</>
                    ) : (
                      <>Import completed with errors. {importResult.errors.length} items failed to process.</>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Total Value */}
                {importResult.summary.totalValue && importResult.summary.totalValue > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Total Inventory Value</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(importResult.summary.totalValue)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* New Components */}
                {importResult.summary.newComponents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">New Components Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {importResult.summary.newComponents.slice(0, 20).map((partNumber) => (
                          <Badge key={partNumber} variant="outline" className="text-xs">
                            {partNumber}
                          </Badge>
                        ))}
                        {importResult.summary.newComponents.length > 20 && (
                          <Badge variant="secondary" className="text-xs">
                            +{importResult.summary.newComponents.length - 20} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Errors */}
                {importResult.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Import Errors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="p-2 bg-red-50 dark:bg-red-950 rounded text-sm">
                            <div className="font-medium text-red-800 dark:text-red-200">
                              Row {error.row}: {error.partNumber}
                            </div>
                            <div className="text-red-600 dark:text-red-400">
                              {error.error}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, Printer, Package, CheckCircle, Clock, AlertCircle } from "lucide-react";
import QRCode from "qrcode";

interface Component {
  id: number;
  componentNumber: string;
  description: string;
  category: string;
  barcode?: string;
}

interface BarcodeGenerationResult {
  componentId: number;
  componentNumber: string;
  barcode: string;
  qrCodeDataUrl: string;
}

export default function BulkBarcodeGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedComponents, setSelectedComponents] = useState<number[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBarcodes, setGeneratedBarcodes] = useState<BarcodeGenerationResult[]>([]);

  // Fetch components without barcodes
  const { data: componentsWithoutBarcodes = [], isLoading } = useQuery({
    queryKey: ["/api/components/without-barcodes"],
    queryFn: async () => {
      const response = await fetch("/api/components/without-barcodes");
      if (!response.ok) throw new Error("Failed to fetch components");
      return response.json();
    },
  });

  // Bulk barcode generation mutation
  const generateBarcodesMutation = useMutation({
    mutationFn: async (componentIds: number[]) => {
      const response = await fetch("/api/barcodes/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentIds }),
      });
      if (!response.ok) throw new Error("Failed to generate barcodes");
      return response.json();
    },
    onSuccess: async (data) => {
      // Generate QR codes for each component
      const results: BarcodeGenerationResult[] = [];
      
      for (let i = 0; i < data.barcodes.length; i++) {
        const { componentId, componentNumber, barcode } = data.barcodes[i];
        
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(componentNumber, {
            margin: 4,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            width: 200
          } as any);
          
          results.push({
            componentId,
            componentNumber,
            barcode,
            qrCodeDataUrl
          });
        } catch (error) {
          console.error(`Failed to generate QR code for ${componentNumber}:`, error);
        }
        
        setGenerationProgress(((i + 1) / data.barcodes.length) * 100);
      }
      
      setGeneratedBarcodes(results);
      setIsGenerating(false);
      
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      queryClient.invalidateQueries({ queryKey: ["/api/components/without-barcodes"] });
      
      toast({
        title: "Barcodes Generated",
        description: `Successfully generated ${results.length} barcodes`,
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      setGenerationProgress(0);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate barcodes",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedComponents.length === componentsWithoutBarcodes.length) {
      setSelectedComponents([]);
    } else {
      setSelectedComponents(componentsWithoutBarcodes.map((c: Component) => c.id));
    }
  };

  const handleComponentSelect = (componentId: number) => {
    setSelectedComponents(prev => 
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  const handleGenerateBarcodes = async () => {
    if (selectedComponents.length === 0) {
      toast({
        title: "No Components Selected",
        description: "Please select components to generate barcodes for",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedBarcodes([]);
    generateBarcodesMutation.mutate(selectedComponents);
  };

  const handlePrintLabels = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Component Barcode Labels</title>
          <style>
            @page { size: letter; margin: 0.5in; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .label-sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.1in; }
            .label { 
              width: 2.625in; 
              height: 1in; 
              border: 1px solid #ddd; 
              padding: 0.05in;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
            }
            .qr-code { width: 0.6in; height: 0.6in; margin-bottom: 0.02in; }
            .part-number { font-size: 8pt; font-weight: bold; margin-bottom: 0.01in; }
            .description { font-size: 6pt; color: #666; }
            @media print {
              .no-print { display: none; }
              .label { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <h2>Component Barcode Labels</h2>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
            <button onclick="window.print()">Print Labels</button>
          </div>
          <div class="label-sheet">
            ${generatedBarcodes.map(barcode => `
              <div class="label">
                <img src="${barcode.qrCodeDataUrl}" alt="QR Code" class="qr-code" />
                <div class="part-number">${barcode.componentNumber}</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleDownloadLabels = async () => {
    // Create a canvas to combine all QR codes
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate layout (3 columns, auto rows)
    const labelsPerRow = 3;
    const labelWidth = 252; // 2.625" at 96 DPI
    const labelHeight = 96; // 1" at 96 DPI
    const rows = Math.ceil(generatedBarcodes.length / labelsPerRow);
    
    canvas.width = labelsPerRow * labelWidth;
    canvas.height = rows * labelHeight;
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < generatedBarcodes.length; i++) {
      const barcode = generatedBarcodes[i];
      const row = Math.floor(i / labelsPerRow);
      const col = i % labelsPerRow;
      const x = col * labelWidth;
      const y = row * labelHeight;

      // Load and draw QR code
      const img = new Image();
      img.onload = () => {
        // Draw QR code
        const qrSize = 60;
        const qrX = x + (labelWidth - qrSize) / 2;
        const qrY = y + 10;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // Draw part number
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(barcode.componentNumber, x + labelWidth / 2, y + qrY + qrSize + 15);

        // If this is the last barcode, download the canvas
        if (i === generatedBarcodes.length - 1) {
          setTimeout(() => {
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `component-barcodes-${new Date().toISOString().split('T')[0]}.png`;
                a.click();
                URL.revokeObjectURL(url);
              }
            });
          }, 100);
        }
      };
      img.src = barcode.qrCodeDataUrl;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p>Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Barcode Generation</h1>
          <p className="text-muted-foreground">
            Generate QR codes for components without assigned barcodes
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {componentsWithoutBarcodes.length} components without barcodes
        </Badge>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Generating Barcodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={generationProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {Math.round(generationProgress)}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generated Results */}
      {generatedBarcodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Generation Complete
            </CardTitle>
            <CardDescription>
              Successfully generated {generatedBarcodes.length} QR codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={handlePrintLabels} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print Labels
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownloadLabels}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download as Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Selection */}
      {componentsWithoutBarcodes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">All Components Have Barcodes</h3>
            <p className="text-muted-foreground">
              Every component in the system already has an assigned barcode.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Components Without Barcodes</CardTitle>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedComponents.length === componentsWithoutBarcodes.length 
                    ? "Deselect All" 
                    : "Select All"
                  }
                </Button>
                <Button
                  onClick={handleGenerateBarcodes}
                  disabled={selectedComponents.length === 0 || isGenerating}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  Generate Barcodes ({selectedComponents.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {componentsWithoutBarcodes.map((component: Component) => (
                <div
                  key={component.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Checkbox
                    checked={selectedComponents.includes(component.id)}
                    onCheckedChange={() => handleComponentSelect(component.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{component.componentNumber}</span>
                      {component.category && (
                        <Badge variant="secondary" className="text-xs">
                          {component.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {component.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Each QR code will encode the component's part number</p>
          <p>• Scanning the QR code will look up the component by part number</p>
          <p>• Generated barcodes are automatically assigned to components</p>
          <p>• Print labels and apply them to physical components</p>
          <p>• High error correction ensures reliable scanning</p>
        </CardContent>
      </Card>
    </div>
  );
}
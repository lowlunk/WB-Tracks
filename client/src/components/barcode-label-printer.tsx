import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Download, Eye, Copy, QrCode, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import type { Component } from "@shared/schema";

interface BarcodeLabelPrinterProps {
  isOpen: boolean;
  onClose: () => void;
  component?: Component;
  onPrint?: (labelData: LabelData) => void;
}

interface LabelData {
  componentNumber: string;
  description: string;
  category?: string;
  supplier?: string;
  labelSize: string;
  quantity: number;
  includeQR: boolean;
  includeLogo: boolean;
  barcodeType: string;
  errorCorrectionLevel: string;
  includeDataMatrix: boolean;
  customText: string;
}

const LABEL_SIZES = [
  { value: "30252", label: "Address Label (1.1\" x 3.5\")", width: "252px", height: "79px" },
  { value: "30334", label: "Multi-Purpose (2.25\" x 1.25\")", width: "162px", height: "90px" },
  { value: "30336", label: "File Folder (0.6\" x 3.4\")", width: "245px", height: "43px" },
  { value: "custom", label: "Custom Size", width: "200px", height: "100px" },
];

const BARCODE_TYPES = [
  { value: "qrcode", label: "QR Code (2D)", description: "Most popular 2D code, high capacity", category: "2D" },
  { value: "datamatrix", label: "Data Matrix (2D)", description: "Compact 2D code, industrial standard", category: "2D" },
  { value: "pdf417", label: "PDF417 (2D)", description: "High capacity 2D barcode", category: "2D" },
  { value: "code128", label: "Code 128 (1D)", description: "Most versatile linear barcode", category: "1D" },
  { value: "code39", label: "Code 39 (1D)", description: "Widely supported alphanumeric", category: "1D" },
  { value: "ean13", label: "EAN-13 (1D)", description: "Standard for retail products", category: "1D" },
  { value: "upc", label: "UPC-A (1D)", description: "Common in North America", category: "1D" },
  { value: "code93", label: "Code 93 (1D)", description: "Higher density than Code 39", category: "1D" },
];

export default function BarcodeLabelPrinter({ 
  isOpen, 
  onClose, 
  component,
  onPrint 
}: BarcodeLabelPrinterProps) {
  const [labelData, setLabelData] = useState<LabelData>({
    componentNumber: "",
    description: "",
    category: "",
    supplier: "",
    labelSize: "30252",
    quantity: 1,
    includeQR: true,
    includeLogo: true,
    barcodeType: "qrcode",
    errorCorrectionLevel: "M",
    includeDataMatrix: false,
    customText: "",
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update label data when component changes
  useEffect(() => {
    if (component) {
      setLabelData(prev => ({
        ...prev,
        componentNumber: component.componentNumber || "",
        description: component.description || "",
        category: component.category || "",
        supplier: component.supplier || "",
      }));
    }
  }, [component]);

  const selectedLabelSize = LABEL_SIZES.find(size => size.value === labelData.labelSize);

  const generateBarcode = (text: string) => {
    // Create a simple barcode representation using CSS
    const barcodePattern = text.split('').map((char, index) => {
      const code = char.charCodeAt(0);
      const width = (code % 4) + 1; // Variable width bars
      const isBlack = index % 2 === 0;
      return { width: `${width}px`, background: isBlack ? '#000' : '#fff' };
    });
    
    return barcodePattern;
  };

  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [dataMatrixURL, setDataMatrixURL] = useState<string>('');

  const generateQRCodeURL = async (text: string, errorLevel: string = 'M') => {
    try {
      const dataURL = await QRCode.toDataURL(text, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: errorLevel as any
      });
      return dataURL;
    } catch (error) {
      console.error('QR Code generation failed:', error);
      return '';
    }
  };

  const generateDataMatrix = (text: string) => {
    // Simple Data Matrix representation using a grid pattern
    const size = 12;
    const pattern = [];
    
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        // Create a pattern based on text content and position
        const charSum = text.split('').reduce((sum, char, idx) => sum + char.charCodeAt(0) * (idx + 1), 0);
        const hash = (charSum + i * j + i + j) % 4;
        row.push(hash < 2);
      }
      pattern.push(row);
    }
    
    return pattern;
  };

  // Generate QR code when component data changes
  useEffect(() => {
    if (labelData.componentNumber && labelData.includeQR) {
      const qrData = JSON.stringify({
        type: 'WB_TRACKS_COMPONENT',
        componentNumber: labelData.componentNumber,
        description: labelData.description,
        category: labelData.category,
        supplier: labelData.supplier,
        timestamp: new Date().toISOString()
      });
      
      generateQRCodeURL(qrData, labelData.errorCorrectionLevel).then(setQrCodeDataURL);
    }
  }, [labelData.componentNumber, labelData.description, labelData.includeQR, labelData.errorCorrectionLevel]);

  const handlePrint = () => {
    if (!labelData.componentNumber) {
      toast({
        title: "Error",
        description: "Component number is required",
        variant: "destructive",
      });
      return;
    }

    // Call the print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow popups to print labels",
        variant: "destructive",
      });
      return;
    }

    const printContent = printRef.current?.innerHTML || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${labelData.componentNumber}</title>
          <style>
            @media print {
              @page {
                size: ${selectedLabelSize?.width} ${selectedLabelSize?.height};
                margin: 0;
              }
              body {
                margin: 0;
                padding: 4px;
                font-family: Arial, sans-serif;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            }
            body {
              margin: 0;
              padding: 4px;
              font-family: Arial, sans-serif;
              font-size: 10px;
              line-height: 1.2;
            }
            .label {
              width: 100%;
              height: 100%;
              border: 1px solid #ddd;
              box-sizing: border-box;
              padding: 4px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 2px;
            }
            .logo {
              font-weight: bold;
              font-size: 8px;
              color: #666;
            }
            .component-number {
              font-weight: bold;
              font-size: 12px;
              text-align: center;
              margin: 2px 0;
            }
            .description {
              font-size: 8px;
              text-align: center;
              margin: 1px 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .barcode-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 2px 0;
              min-height: 20px;
            }
            .barcode {
              display: flex;
              align-items: end;
              height: 20px;
            }
            .barcode-bar {
              height: 100%;
              margin: 0;
            }
            .qr-code {
              width: 24px;
              height: 24px;
              display: grid;
              grid-template-columns: repeat(8, 1fr);
              grid-template-rows: repeat(8, 1fr);
              border: 1px solid #000;
            }
            .qr-pixel {
              background: #000;
            }
            .qr-pixel.white {
              background: #fff;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 7px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();

    if (onPrint) {
      onPrint(labelData);
    }

    toast({
      title: "Success",
      description: `Printing ${labelData.quantity} label(s) for ${labelData.componentNumber}`,
    });
  };

  const handleDownload = () => {
    // Create downloadable label data
    const labelContent = {
      ...labelData,
      timestamp: new Date().toISOString(),
      labelSize: selectedLabelSize,
    };

    const dataStr = JSON.stringify(labelContent, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `label-${labelData.componentNumber}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Label template downloaded",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(labelData.componentNumber).then(() => {
      toast({
        title: "Copied",
        description: "Component number copied to clipboard",
      });
    });
  };

  const barcodePattern = generateBarcode(labelData.componentNumber);
  // Note: QR code is handled via qrCodeDataURL state, not qrPattern

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Barcode Label Printer
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="componentNumber">Component Number *</Label>
                <div className="flex gap-2">
                  <Input
                    id="componentNumber"
                    value={labelData.componentNumber}
                    onChange={(e) => setLabelData({ ...labelData, componentNumber: e.target.value })}
                    placeholder="217520"
                    required
                  />
                  <Button size="icon" variant="outline" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={labelData.quantity}
                  onChange={(e) => setLabelData({ ...labelData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={labelData.description}
                onChange={(e) => setLabelData({ ...labelData, description: e.target.value })}
                placeholder="Component description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={labelData.category}
                  onChange={(e) => setLabelData({ ...labelData, category: e.target.value })}
                  placeholder="Electronics"
                />
              </div>
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={labelData.supplier}
                  onChange={(e) => setLabelData({ ...labelData, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="labelSize">Label Size</Label>
              <Select value={labelData.labelSize} onValueChange={(value) => setLabelData({ ...labelData, labelSize: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="barcodeType">Barcode Type</Label>
              <Select value={labelData.barcodeType} onValueChange={(value) => setLabelData({ ...labelData, barcodeType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {BARCODE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-gray-500">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeQR"
                  checked={labelData.includeQR}
                  onChange={(e) => setLabelData({ ...labelData, includeQR: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="includeQR">Include QR Code</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeLogo"
                  checked={labelData.includeLogo}
                  onChange={(e) => setLabelData({ ...labelData, includeLogo: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="includeLogo">Include Logo</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsPreviewMode(!isPreviewMode)} variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Label Preview</h3>
              <span className="text-sm text-muted-foreground">
                {selectedLabelSize?.label}
              </span>
            </div>

            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardContent className="p-4">
                <div className="flex justify-center">
                  <div 
                    ref={printRef}
                    className="bg-white border-2 border-gray-300 shadow-lg"
                    style={{
                      width: selectedLabelSize?.width,
                      height: selectedLabelSize?.height,
                      fontSize: '10px',
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.2',
                    }}
                  >
                    <div className="h-full p-1 flex flex-col justify-between">
                      {/* Header */}
                      <div className="flex justify-between items-center text-[8px]">
                        {labelData.includeLogo && (
                          <div className="font-bold text-gray-600">WB-Tracks</div>
                        )}
                        <div className="text-gray-500">
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>

                      {/* Component Number */}
                      <div className="text-center font-bold text-[12px] my-1">
                        {labelData.componentNumber || "COMPONENT"}
                      </div>

                      {/* Description */}
                      {labelData.description && (
                        <div className="text-center text-[8px] truncate">
                          {labelData.description}
                        </div>
                      )}

                      {/* Barcode and QR Code */}
                      <div className="flex justify-center items-center gap-2 my-1">
                        {/* Barcode */}
                        <div className="flex items-end h-[20px]">
                          {barcodePattern.map((bar, index) => (
                            <div
                              key={index}
                              style={{
                                width: bar.width,
                                height: '100%',
                                backgroundColor: bar.background,
                                borderRight: bar.background === '#fff' ? '1px solid #000' : 'none',
                              }}
                            />
                          ))}
                        </div>

                        {/* QR Code */}
                        {labelData.includeQR && qrCodeDataURL && (
                          <div className="w-[24px] h-[24px] flex items-center justify-center">
                            <img 
                              src={qrCodeDataURL} 
                              alt="QR Code" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center text-[7px] text-gray-600">
                        <div>{labelData.category}</div>
                        <div>{labelData.supplier}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {labelData.quantity > 1 && (
                  <div className="text-center mt-2 text-sm text-muted-foreground">
                    Will print {labelData.quantity} identical labels
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
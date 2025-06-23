import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QrCode, Download, Printer, Grid, Square } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  componentNumber: string;
  description: string;
}

const QR_CODE_FORMATS = [
  { value: "component", label: "Component ID Only", description: "Just the component number" },
  { value: "json", label: "Full Component Data", description: "Component number, description, and metadata" },
  { value: "url", label: "Web Link", description: "Link to component in system" },
];

const QR_ERROR_LEVELS = [
  { value: "L", label: "Low (7%)", description: "Fastest generation" },
  { value: "M", label: "Medium (15%)", description: "Balanced" },
  { value: "Q", label: "Quartile (25%)", description: "Good for damaged labels" },
  { value: "H", label: "High (30%)", description: "Maximum reliability" },
];

const generateQRCodeDataURL = async (
  text: string, 
  errorCorrectionLevel: string = "M",
  size: number = 200
): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: errorCorrectionLevel as any
    });
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return '';
  }
};

export default function QRCodeGenerator({ isOpen, onClose, componentNumber, description }: QRCodeGeneratorProps) {
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>('');
  const [format, setFormat] = useState('component');
  const [errorLevel, setErrorLevel] = useState('M');
  const [size, setSize] = useState(200);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      let qrData: string;
      
      switch (format) {
        case 'component':
          qrData = componentNumber;
          break;
        case 'json':
          qrData = JSON.stringify({
            type: 'WB_TRACKS_COMPONENT',
            componentNumber,
            description,
            timestamp: new Date().toISOString(),
            version: '1.0'
          });
          break;
        case 'url':
          qrData = `${window.location.origin}/components/${componentNumber}`;
          break;
        default:
          qrData = componentNumber;
      }
      
      const dataURL = await generateQRCodeDataURL(qrData, errorLevel, size);
      setQRCodeDataURL(dataURL);
    } catch (error) {
      console.error('QR Code generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return;
    
    const link = document.createElement('a');
    link.download = `qr_${componentNumber}.png`;
    link.href = qrCodeDataURL;
    link.click();
  };

  const printQRCode = () => {
    if (!qrCodeDataURL) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${componentNumber}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              font-family: Arial, sans-serif; 
              margin: 20px;
            }
            .qr-container {
              text-align: center;
              page-break-inside: avoid;
            }
            img { 
              max-width: 300px; 
              margin: 20px 0;
            }
            .component-info {
              margin-bottom: 20px;
            }
            .component-number {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .component-description {
              font-size: 14px;
              color: #666;
              max-width: 300px;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="component-info">
              <div class="component-number">${componentNumber}</div>
              <div class="component-description">${description}</div>
            </div>
            <img src="${qrCodeDataURL}" alt="QR Code for ${componentNumber}" />
            <p>Scan this QR code to access component information in WB-Tracks</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  // Generate QR code when dialog opens or settings change
  useEffect(() => {
    if (isOpen && componentNumber) {
      generateQRCode();
    }
  }, [isOpen, componentNumber, format, errorLevel, size]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Advanced QR Code Generator - {componentNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Component Info */}
          <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="font-medium text-lg">{componentNumber}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</div>
          </div>

          {/* QR Code Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QR_CODE_FORMATS.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      <div>
                        <div className="font-medium">{fmt.label}</div>
                        <div className="text-xs text-gray-500">{fmt.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Error Correction</Label>
              <Select value={errorLevel} onValueChange={setErrorLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QR_ERROR_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-xs text-gray-500">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Size: {size}px</Label>
            <input
              type="range"
              min="100"
              max="400"
              step="50"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>
          
          {/* QR Code Display */}
          <div className="text-center">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm text-gray-600">Generating QR code...</p>
              </div>
            ) : qrCodeDataURL ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <img 
                    src={qrCodeDataURL} 
                    alt={`QR Code for ${componentNumber}`}
                    className="rounded"
                    style={{ width: `${Math.min(size, 300)}px`, height: `${Math.min(size, 300)}px` }}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadQRCode}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={printQRCode}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Label
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateQRCode}
                    disabled={isGenerating}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <Button onClick={generateQRCode} disabled={isGenerating}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>QR codes can be scanned with any barcode scanner or mobile device camera.</p>
            <p>Higher error correction levels work better on damaged or dirty labels.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
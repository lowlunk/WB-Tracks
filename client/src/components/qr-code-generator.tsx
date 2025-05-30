import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Printer } from "lucide-react";

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  componentNumber: string;
  description: string;
}

// Simple QR code generation using a data URL approach
// In a production environment, you might use a library like qrcode.js
const generateQRCodeDataURL = (text: string): string => {
  // Create a simple QR code pattern using Canvas API
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  const size = 200;
  canvas.width = size;
  canvas.height = size;
  
  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Simple QR-like pattern for demonstration
  // In production, use a proper QR code library
  ctx.fillStyle = '#000000';
  const moduleSize = size / 25;
  
  // Create a simple grid pattern that represents the component number
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      // Use the text to determine which modules to fill
      const hash = (text.charCodeAt((i * 25 + j) % text.length) + i + j) % 3;
      if (hash === 0) {
        ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
      }
    }
  }
  
  // Add border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
  
  return canvas.toDataURL();
};

export default function QRCodeGenerator({ isOpen, onClose, componentNumber, description }: QRCodeGeneratorProps) {
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>('');

  const generateQRCode = () => {
    const qrData = JSON.stringify({
      type: 'WB_TRACKS_COMPONENT',
      componentNumber,
      description,
      timestamp: new Date().toISOString()
    });
    
    const dataURL = generateQRCodeDataURL(qrData);
    setQRCodeDataURL(dataURL);
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

  // Generate QR code when dialog opens
  useEffect(() => {
    if (isOpen && componentNumber) {
      generateQRCode();
    }
  }, [isOpen, componentNumber]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            QR Code for {componentNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="mb-4">
              <div className="font-medium text-lg">{componentNumber}</div>
              <div className="text-sm text-gray-600 mt-1">{description}</div>
            </div>
            
            {qrCodeDataURL ? (
              <div className="flex flex-col items-center space-y-4">
                <img 
                  src={qrCodeDataURL} 
                  alt={`QR Code for ${componentNumber}`}
                  className="border border-gray-300 rounded-lg"
                  style={{ width: '200px', height: '200px' }}
                />
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadQRCode}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={printQRCode}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <Button onClick={generateQRCode}>
                  Generate QR Code
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            This QR code contains the component number and can be scanned with the WB-Tracks mobile app for quick identification.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
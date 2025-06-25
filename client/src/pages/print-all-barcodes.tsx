import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";

interface Component {
  id: number;
  componentNumber: string;
  description: string;
  barcode?: string;
}

export default function PrintAllBarcodes() {
  const [qrCodes, setQrCodes] = useState<Array<{ componentNumber: string; qrCodeDataUrl: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  // Fetch all components with barcodes
  const { data: components = [] } = useQuery({
    queryKey: ["/api/components"],
    queryFn: async () => {
      const response = await fetch("/api/components");
      if (!response.ok) throw new Error("Failed to fetch components");
      return response.json();
    },
  });

  useEffect(() => {
    const generateQRCodes = async () => {
      if (components.length === 0) return;

      const results: Array<{ componentNumber: string; qrCodeDataUrl: string }> = [];
      
      for (const component of components) {
        if (component.barcode) {
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(component.barcode, {
              margin: 4,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              },
              width: 200
            } as any);
            
            results.push({
              componentNumber: component.componentNumber,
              qrCodeDataUrl
            });
          } catch (error) {
            console.error(`Failed to generate QR code for ${component.componentNumber}:`, error);
          }
        }
      }
      
      setQrCodes(results);
      setIsGenerating(false);
      
      // Auto-print after generation
      setTimeout(() => {
        window.print();
      }, 1000);
    };

    generateQRCodes();
  }, [components]);

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Generating QR codes for printing...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @page { 
          size: letter; 
          margin: 0.5in; 
        }
        
        @media screen {
          .print-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
        }
        
        @media print {
          .print-controls { 
            display: none; 
          }
          
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
          }
          
          .label-sheet { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 0.1in; 
          }
          
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
            box-sizing: border-box;
          }
          
          .qr-code { 
            width: 0.6in; 
            height: 0.6in; 
            margin-bottom: 0.02in; 
          }
          
          .part-number { 
            font-size: 8pt; 
            font-weight: bold; 
            margin-bottom: 0.01in; 
          }
        }
        
        /* Screen styles */
        @media screen {
          .label-sheet { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 8px; 
            padding: 20px;
          }
          
          .label { 
            width: 200px; 
            height: 96px; 
            border: 1px solid #ddd; 
            padding: 4px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
          }
          
          .qr-code { 
            width: 60px; 
            height: 60px; 
            margin-bottom: 4px; 
          }
          
          .part-number { 
            font-size: 10px; 
            font-weight: bold; 
          }
        }
      `}</style>

      <div className="print-controls">
        <button 
          onClick={() => window.print()}
          style={{ 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          Print Labels
        </button>
        <button 
          onClick={() => window.close()}
          style={{ 
            background: '#6b7280', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px', pageBreakAfter: 'avoid' }}>
        <h2>Component Barcode Labels</h2>
        <p>Generated: {new Date().toLocaleDateString()} | Total Labels: {qrCodes.length}</p>
      </div>

      <div className="label-sheet">
        {qrCodes.map((item, index) => (
          <div key={index} className="label">
            <img src={item.qrCodeDataUrl} alt="QR Code" className="qr-code" />
            <div className="part-number">{item.componentNumber}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
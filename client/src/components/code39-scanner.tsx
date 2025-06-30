import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  X, 
  Play, 
  Keyboard, 
  CheckCircle,
  AlertTriangle,
  Package,
  QrCode,
  Flashlight,
  FlashlightOff
} from "lucide-react";
import Quagga from "@ericblade/quagga2";

interface Code39ScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (result: any) => void;
  navigateOnScan?: boolean; // New prop to control navigation behavior
}

export default function Code39Scanner({ isOpen, onClose, onScan, navigateOnScan = false }: Code39ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedComponent, setScannedComponent] = useState<any>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current) return;

    try {
      setIsScanning(true);
      
      await Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          }
        },
        decoder: {
          readers: ["code_39_reader"] // Focused on CODE39 only
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        frequency: 5, // Slower frequency for better CODE39 detection
        debug: false
      });

      Quagga.start();
      
      Quagga.onDetected((result: any) => {
        const code = result.codeResult.code;
        console.log('CODE39 detected:', {
          code: code,
          format: result.codeResult.format,
          confidence: result.codeResult.confidence || 0
        });
        
        // Accept CODE39 reads - Brother P-touch labels should be reliable
        console.log('CODE39 confidence:', result.codeResult.confidence);
        handleBarcodeDetected(code);
        stopScanner();
      });

      Quagga.onProcessed((result: any) => {
        // Optional: Handle processing feedback
        if (result && result.codeResult) {
          console.log('Processing code:', result.codeResult.code);
        }
      });

    } catch (error) {
      console.error('Failed to start CODE39 scanner:', error);
      toast({
        title: "Scanner Error",
        description: "Failed to start camera. Please check permissions and try manual entry.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    setIsScanning(false);
    try {
      Quagga.stop();
    } catch (error) {
      console.warn('Error stopping scanner:', error);
    }
  };

  const handleBarcodeDetected = (barcode: string) => {
    if (barcode && barcode.trim()) {
      console.log('Processing detected barcode:', barcode);
      lookupMutation.mutate(barcode.trim());
    }
  };

  const lookupMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await fetch("/api/barcode/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ barcode }),
      });
      if (!response.ok) {
        throw new Error(`Component not found`);
      }
      return response.json();
    },
    onSuccess: (component: any) => {
      setScannedComponent(component);
      stopScanner();
      
      if (navigateOnScan) {
        // Navigate directly to component page for inventory operations
        toast({
          title: "Opening Component",
          description: `${component.componentNumber} - ${component.description}`,
        });
        handleClose();
        setLocation(`/components/${component.id}`);
      } else {
        toast({
          title: "Component Found",
          description: `Found ${component.componentNumber} - ${component.description}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Component Not Found",
        description: "No component found with this barcode. Try manual entry or check the code.",
        variant: "destructive",
      });
      setManualEntry(true);
    }
  });

  const handleManualLookup = () => {
    if (barcodeInput.trim()) {
      lookupMutation.mutate(barcodeInput.trim());
    }
  };

  const handleUseComponent = () => {
    if (scannedComponent) {
      if (navigateOnScan) {
        // Navigate to component page
        setLocation(`/components/${scannedComponent.id}`);
        handleClose();
      } else if (onScan) {
        // Use existing callback for other purposes
        onScan(scannedComponent);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    setIsScanning(false);
    setManualEntry(false);
    setBarcodeInput("");
    setScannedComponent(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan CODE39 Barcode
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="wb-focus-visible"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Camera Preview or Manual Entry */}
          {!manualEntry && !scannedComponent ? (
            <>
              <div 
                ref={scannerRef}
                className="relative bg-gray-900 dark:bg-gray-800 rounded-lg overflow-hidden" 
                style={{ aspectRatio: '4/3', minHeight: '300px' }}
              >
                {!isScanning && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-4">
                    <Camera className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-center mb-2 text-sm">
                      Position CODE39 barcode within camera view
                    </p>
                    <p className="text-center mb-4 text-xs opacity-75">
                      Optimized for Brother P-touch labels
                    </p>
                    <Button
                      onClick={startScanner}
                      className="wb-btn-primary w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start CODE39 Scanner
                    </Button>
                  </div>
                )}
                
                {isScanning && (
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopScanner}
                      className="bg-black/50 hover:bg-black/70 text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setManualEntry(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </>
          ) : manualEntry && !scannedComponent ? (
            /* Manual Entry Mode */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode-input">Enter Barcode Manually</Label>
                <Input
                  id="barcode-input"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="e.g., 217520"
                  className="wb-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualLookup();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleManualLookup}
                  className="wb-btn-primary flex-1"
                  disabled={!barcodeInput.trim() || lookupMutation.isPending}
                >
                  {lookupMutation.isPending ? "Looking up..." : "Look Up Component"}
                </Button>
                <Button
                  onClick={() => setManualEntry(false)}
                  variant="outline"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
                </Button>
              </div>
            </div>
          ) : (
            /* Component Found */
            scannedComponent && (
              <div className="space-y-4">
                <Card className="wb-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {scannedComponent.componentNumber}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {scannedComponent.description}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary" className="text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            Component
                          </Badge>
                          {scannedComponent.category && (
                            <Badge variant="outline" className="text-xs">
                              {scannedComponent.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUseComponent}
                    className="wb-btn-primary flex-1"
                  >
                    Use Component
                  </Button>
                  <Button
                    onClick={() => {
                      setScannedComponent(null);
                      setManualEntry(false);
                    }}
                    variant="outline"
                  >
                    Scan Again
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
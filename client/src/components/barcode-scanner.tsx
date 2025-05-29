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
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, 
  X, 
  Play, 
  Keyboard, 
  CheckCircle,
  AlertTriangle,
  Package
} from "lucide-react";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: any) => void;
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedComponent, setScannedComponent] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const lookupMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await apiRequest("POST", "/api/barcode/lookup", { barcode });
      return response.json();
    },
    onSuccess: (component) => {
      setScannedComponent(component);
      stopCamera();
      toast({
        title: "Component Found",
        description: `Found ${component.componentNumber} - ${component.description}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Component Not Found",
        description: error.message || "The scanned barcode was not found in the database.",
        variant: "destructive",
      });
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions or use manual entry.",
        variant: "destructive",
      });
      setManualEntry(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualLookup = () => {
    if (barcodeInput.trim()) {
      lookupMutation.mutate(barcodeInput.trim());
    }
  };

  const handleUseComponent = () => {
    if (scannedComponent) {
      onScan(scannedComponent);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setIsScanning(false);
    setManualEntry(false);
    setBarcodeInput("");
    setScannedComponent(null);
    onClose();
  };

  // Cleanup camera when component unmounts or modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Simulate barcode detection (in a real app, this would use a barcode scanning library)
  useEffect(() => {
    if (isScanning && videoRef.current) {
      // In a production app, you would integrate with a barcode scanning library like:
      // - @zxing/library
      // - quagga2
      // - html5-qrcode
      
      // For now, we'll simulate with a click handler
      const handleVideoClick = () => {
        // Simulate finding a barcode - in reality this would be automatic
        const simulatedBarcode = "217520"; // This would come from the scanning library
        lookupMutation.mutate(simulatedBarcode);
      };

      videoRef.current.addEventListener('click', handleVideoClick);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('click', handleVideoClick);
        }
      };
    }
  }, [isScanning, lookupMutation]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan Barcode
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
              <div className="relative bg-gray-900 dark:bg-gray-800 rounded-lg overflow-hidden aspect-square">
                {isScanning ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    onClick={() => {
                      // In a real app, this would be handled by the barcode scanning library
                      toast({
                        title: "Scanning...",
                        description: "Position the barcode in the center of the frame",
                      });
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-75" />
                      <p className="text-lg font-medium mb-2">Camera Preview</p>
                      <p className="text-sm opacity-75">Position barcode in the center</p>
                    </div>
                  </div>
                )}
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-75" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {!isScanning ? (
                  <Button
                    onClick={startCamera}
                    className="w-full wb-btn-primary wb-touch-target"
                    disabled={lookupMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full wb-touch-target"
                  >
                    Stop Scanning
                  </Button>
                )}
                
                <Button
                  onClick={() => setManualEntry(true)}
                  variant="outline"
                  className="w-full wb-touch-target"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </>
          ) : manualEntry && !scannedComponent ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="barcode-input" className="text-sm font-medium">
                    Component Number / Barcode
                  </Label>
                  <Input
                    id="barcode-input"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter component number..."
                    className="wb-input mt-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleManualLookup();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setManualEntry(false)}
                  variant="outline"
                  className="flex-1 wb-touch-target"
                >
                  Back to Camera
                </Button>
                <Button
                  onClick={handleManualLookup}
                  disabled={!barcodeInput.trim() || lookupMutation.isPending}
                  className="flex-1 wb-btn-primary wb-touch-target"
                >
                  {lookupMutation.isPending ? "Looking up..." : "Lookup"}
                </Button>
              </div>
            </>
          ) : scannedComponent ? (
            <>
              <Card className="wb-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Component Found!</h3>
                      <p className="text-sm text-muted-foreground">Scanned successfully</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{scannedComponent.componentNumber}</p>
                        <p className="text-sm text-muted-foreground">Component Number</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {scannedComponent.description}
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Badge variant="outline" className="wb-badge-success">
                        Ready to use
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setScannedComponent(null);
                    setManualEntry(false);
                  }}
                  variant="outline"
                  className="flex-1 wb-touch-target"
                >
                  Scan Another
                </Button>
                <Button
                  onClick={handleUseComponent}
                  className="flex-1 wb-btn-primary wb-touch-target"
                >
                  Use Component
                </Button>
              </div>
            </>
          ) : null}

          {/* Loading state */}
          {lookupMutation.isPending && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Looking up component...</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

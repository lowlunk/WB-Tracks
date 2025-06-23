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
  Package,
  QrCode,
  Flashlight,
  FlashlightOff
} from "lucide-react";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/library";

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
  const [hasFlashlight, setHasFlashlight] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize camera devices
  useEffect(() => {
    if (isOpen) {
      initializeCameras();
    }
    return () => {
      cleanup();
    };
  }, [isOpen]);

  const initializeCameras = async () => {
    try {
      // Request permission first to get device labels
      await navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        stream.getTracks().forEach(track => track.stop());
      });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      if (videoDevices.length > 0) {
        // Prefer rear camera if available
        const rearCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(rearCamera?.deviceId || videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Permission Required",
        description: "Please allow camera access to use the barcode scanner",
        variant: "destructive",
      });
    }
  };

  const initializeCodeReader = () => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
      // Support multiple barcode formats including 2D codes
      const hints = new Map();
      hints.set(2, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.PDF_417,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);
      codeReaderRef.current.hints = hints;
    }
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      initializeCodeReader();
      
      if (!videoRef.current || !codeReaderRef.current) {
        console.error('Video element or code reader not available');
        setIsScanning(false);
        return;
      }

      console.log('Starting camera with selected device:', selectedCamera);

      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: selectedCamera ? undefined : { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        }
      };

      console.log('Camera constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      console.log('Camera stream obtained:', stream);

      // Check for flashlight capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      console.log('Camera capabilities:', capabilities);
      setHasFlashlight('torch' in capabilities);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for the video to be ready
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current!.play();
            console.log('Video started playing');
            
            // Start barcode scanning with a small delay
            setTimeout(() => {
              if (codeReaderRef.current && videoRef.current) {
                console.log('Starting barcode detection');
                codeReaderRef.current.decodeFromVideoDevice(
                  selectedCamera || undefined,
                  videoRef.current,
                  (result, error) => {
                    if (result) {
                      console.log('Barcode detected:', result.getText());
                      const barcodeText = result.getText();
                      handleBarcodeDetected(barcodeText);
                    }
                    if (error && !(error.name === 'NotFoundException')) {
                      console.warn('Barcode scanning error:', error);
                    }
                  }
                );
              }
            }, 500);
          } catch (playError) {
            console.error('Video play error:', playError);
            toast({
              title: "Video Error",
              description: "Unable to start video playback",
              variant: "destructive",
            });
            setIsScanning(false);
          }
        };

        videoRef.current.onerror = (error) => {
          console.error('Video element error:', error);
          toast({
            title: "Video Error",
            description: "Video element encountered an error",
            variant: "destructive",
          });
          setIsScanning(false);
        };
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      let errorMessage = "Unable to access camera. Please check permissions.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access denied. Please allow camera permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found. Please connect a camera and try again.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera not supported by this browser.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setFlashlightOn(false);
  };

  const toggleFlashlight = async () => {
    if (!streamRef.current || !hasFlashlight) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      // Use applyConstraints with advanced constraints for torch
      await track.applyConstraints({
        advanced: [{ torch: !flashlightOn } as any]
      });
      setFlashlightOn(!flashlightOn);
    } catch (error) {
      console.error('Flashlight error:', error);
      toast({
        title: "Flashlight Error",
        description: "Unable to control flashlight",
        variant: "destructive",
      });
    }
  };

  const cleanup = () => {
    stopCamera();
    if (codeReaderRef.current) {
      codeReaderRef.current = null;
    }
  };

  const handleBarcodeDetected = (barcode: string) => {
    if (barcode && barcode.trim()) {
      lookupMutation.mutate(barcode.trim());
    }
  };

  const lookupMutation = useMutation({
    mutationFn: async (barcode: string) => {
      return await apiRequest("/api/barcode/lookup", {
        method: "POST",
        body: JSON.stringify({ barcode }),
      });
    },
    onSuccess: (component) => {
      setScannedComponent(component);
      stopCamera();
      toast({
        title: "Component Found",
        description: `Found ${component.componentNumber} - ${component.description}`,
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan Barcode/QR Code
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
              {/* Camera Selection */}
              {availableCameras.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Camera:</Label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                    disabled={isScanning}
                  >
                    {availableCameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative bg-gray-900 dark:bg-gray-800 rounded-lg overflow-hidden aspect-video">
                {isScanning ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-green-400 w-64 h-64 rounded-lg animate-pulse">
                        <div className="w-full h-full border border-green-400 rounded-lg opacity-50"></div>
                      </div>
                    </div>
                    {/* Controls overlay */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      {hasFlashlight && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={toggleFlashlight}
                          className="bg-black/50 hover:bg-black/70 text-white"
                        >
                          {flashlightOn ? (
                            <FlashlightOff className="h-4 w-4" />
                          ) : (
                            <Flashlight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={stopCamera}
                        className="bg-black/50 hover:bg-black/70 text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Scanning indicator */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/70 text-white px-3 py-2 rounded text-sm text-center">
                        <QrCode className="h-4 w-4 inline mr-2" />
                        Scanning for barcodes and QR codes...
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <Camera className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-center mb-4">
                      Position barcode or QR code within camera view
                    </p>
                    <Button
                      onClick={startCamera}
                      className="wb-btn-primary"
                      disabled={availableCameras.length === 0}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setManualEntry(true)}
                  className="w-full"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </>
          ) : null}

          {/* Manual Entry Mode */}
          {manualEntry && !scannedComponent ? (
            <div className="space-y-4">
              <div className="text-center">
                <Keyboard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <h3 className="font-semibold">Enter Barcode Manually</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type or paste the barcode number
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="barcode-input">Barcode/Component Number</Label>
                  <Input
                    id="barcode-input"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter barcode or component number"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleManualLookup();
                      }
                    }}
                    className="text-center font-mono"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleManualLookup}
                    disabled={!barcodeInput.trim() || lookupMutation.isPending}
                    className="flex-1"
                  >
                    {lookupMutation.isPending ? "Searching..." : "Search"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setManualEntry(false)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Scanned Component Display */}
          {scannedComponent ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {scannedComponent.componentNumber}
                      </Badge>
                      <h3 className="font-semibold">{scannedComponent.description}</h3>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {scannedComponent.category && (
                        <div>Category: {scannedComponent.category}</div>
                      )}
                      {scannedComponent.supplier && (
                        <div>Supplier: {scannedComponent.supplier}</div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleUseComponent}
                        className="flex-1"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Use This Component
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setScannedComponent(null);
                          setManualEntry(false);
                        }}
                      >
                        Scan Again
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Error State */}
          {lookupMutation.isError && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-700 dark:text-red-300">
                      Component Not Found
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      No component found with this barcode. Please check the code or try manual entry.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
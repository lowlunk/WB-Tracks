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
      // For mobile devices, we need to be more careful with permissions
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // First, try to enumerate devices without requesting permissions
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // If device labels are empty, we need to request permission first
      if (videoDevices.length === 0 || !videoDevices[0].label) {
        try {
          // For mobile devices, use more specific constraints
          const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const constraints = isMobile ? 
            { video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } } } :
            { video: { facingMode: 'environment' } };
          
          // Request minimal permissions first
          const tempStream = await navigator.mediaDevices.getUserMedia(constraints);
          tempStream.getTracks().forEach(track => track.stop());
          
          // Now enumerate again to get proper labels
          devices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = devices.filter(device => device.kind === 'videoinput');
        } catch (permError) {
          console.warn('Permission denied, using fallback approach:', permError);
          // Still set what we found, even without labels
          setAvailableCameras(videoDevices);
          return;
        }
      }

      setAvailableCameras(videoDevices);
      
      if (videoDevices.length > 0) {
        // For mobile, prefer rear/environment camera
        const rearCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment') ||
          device.label.toLowerCase().includes('camera2') || // Android common naming
          device.label.toLowerCase().includes('0') // Often the rear camera
        );
        setSelectedCamera(rearCamera?.deviceId || videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Required",
        description: "Please enable camera permissions in your browser settings and refresh the page",
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
      console.log('Starting camera - initial setup');
      setIsScanning(true);
      
      // Wait a bit for React state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      initializeCodeReader();
      
      if (!videoRef.current) {
        console.error('Video element not available');
        toast({
          title: "Video Error",
          description: "Video element not ready. Refreshing scanner...",
          variant: "destructive",
        });
        setIsScanning(false);
        // Try to reinitialize
        setTimeout(() => setMode('barcode'), 500);
        return;
      }
      
      if (!codeReaderRef.current) {
        console.error('Code reader not available');
        toast({
          title: "Scanner Error",
          description: "Barcode reader failed to initialize. Try manual entry.",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      console.log('Starting camera with selected device:', selectedCamera);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not available');
        throw new Error('Camera not supported in this browser');
      }
      
      console.log('getUserMedia available, proceeding with camera access...');

      // Enhanced constraints for mobile devices
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: selectedCamera ? undefined : 'environment', // Use exact for mobile
          width: isMobile ? { ideal: 640, max: 1280 } : { ideal: 1280, min: 640 },
          height: isMobile ? { ideal: 480, max: 720 } : { ideal: 720, min: 480 },
          // Additional mobile-specific constraints
          ...(isMobile && {
            frameRate: { ideal: 15, max: 30 }, // Lower framerate for mobile performance
            aspectRatio: { ideal: 4/3 } // Better for mobile cameras
          })
        }
      };

      console.log('Camera constraints:', constraints);

      let stream;
      try {
        console.log('Requesting camera permissions...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        console.log('Camera stream obtained successfully:', {
          id: stream.id,
          active: stream.active,
          tracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().map(track => ({
            id: track.id,
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState
          }))
        });
      } catch (streamError) {
        console.error('Failed to get camera stream:', streamError);
        let errorMessage = "Camera access failed.";
        
        if (streamError.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (streamError.name === 'NotFoundError') {
          errorMessage = "No camera found. Please check camera connection.";
        } else if (streamError.name === 'NotReadableError') {
          errorMessage = "Camera is in use by another app. Please close other camera apps.";
        }
        
        toast({
          title: "Camera Access Failed",
          description: errorMessage,
          variant: "destructive",
        });
        throw streamError;
      }

      // Check for flashlight capability and camera orientation
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      console.log('Camera capabilities:', capabilities);
      setHasFlashlight('torch' in capabilities);
      
      // Log camera info for debugging
      const cameraInfo = availableCameras.find(cam => cam.deviceId === selectedCamera);
      console.log('Selected camera info:', {
        deviceId: selectedCamera,
        label: cameraInfo?.label,
        isFrontFacing: cameraInfo?.label?.toLowerCase().includes('front'),
        isBackFacing: cameraInfo?.label?.toLowerCase().includes('back')
      });

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = streamRef.current;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        
        console.log('Video element setup complete, waiting for metadata...');
        
        // Wait for the video to be ready
        video.onloadedmetadata = async () => {
          try {
            console.log('Video metadata loaded');
            // For mobile devices, ensure video plays correctly
            const video = videoRef.current!;
            video.muted = true; // Required for autoplay on mobile
            video.playsInline = true; // Prevent fullscreen on iOS
            
            console.log('Attempting to play video...');
            
            // Try to play with error handling
            try {
              await video.play();
              console.log('Video started playing successfully', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState,
                paused: video.paused,
                currentTime: video.currentTime
              });
            } catch (playError) {
              console.error('Video play failed:', playError);
              // Try playing again after a short delay
              setTimeout(async () => {
                try {
                  await video.play();
                  console.log('Video play succeeded on retry');
                } catch (retryError) {
                  console.error('Video play failed on retry:', retryError);
                  toast({
                    title: "Video Play Error",
                    description: "Camera video failed to start. Try refreshing the page.",
                    variant: "destructive",
                  });
                }
              }, 500);
            }
            
            // Start barcode scanning with a delay for mobile stability
            setTimeout(() => {
              if (codeReaderRef.current && videoRef.current) {
                console.log('Starting barcode detection on mobile device');
                try {
                  codeReaderRef.current.decodeFromVideoDevice(
                    selectedCamera || undefined,
                    videoRef.current,
                    (result, error) => {
                      if (result) {
                        console.log('Barcode detected:', result.getText());
                        const barcodeText = result.getText();
                        handleBarcodeDetected(barcodeText);
                        stopCamera(); // Stop after successful scan
                      }
                      if (error && !(error.name === 'NotFoundException')) {
                        console.warn('Barcode scanning error:', error);
                      }
                    }
                  );
                } catch (scanError) {
                  console.error('Failed to start barcode scanning:', scanError);
                  toast({
                    title: "Scanner Error",
                    description: "Failed to start barcode detection. Try the manual entry option.",
                    variant: "destructive",
                  });
                }
              }
            }, 1500); // Increased delay for mobile
          } catch (playError) {
            console.error('Video play error:', playError);
            toast({
              title: "Video Error", 
              description: "Unable to start video playback. Try refreshing the page.",
              variant: "destructive",
            });
            setIsScanning(false);
          }
        };

        video.onerror = (error) => {
          console.error('Video element error:', error);
          toast({
            title: "Video Error",
            description: "Camera video failed to load. Try refreshing the page.",
            variant: "destructive",
          });
          setIsScanning(false);
        };
        
        // Add timeout fallback
        setTimeout(() => {
          if (video.readyState === 0) {
            console.error('Video failed to load within timeout');
            toast({
              title: "Camera Timeout",
              description: "Camera took too long to initialize. Try manual entry instead.",
              variant: "destructive",
            });
            setIsScanning(false);
          }
        }, 10000); // 10 second timeout
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      let errorMessage = "Unable to access camera. Please check permissions.";
      let actionText = "For Android: Go to Settings → Apps → Browser → Permissions → Camera and enable it.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access denied. Please allow camera permissions.";
          actionText = "Tap the camera icon in your browser's address bar to allow camera access, then refresh the page.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on this device.";
          actionText = "Please ensure your device has a working camera.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera not supported by this browser.";
          actionText = "Try opening this page in Chrome or another modern browser.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera is already in use by another app.";
          actionText = "Close other camera apps and try again.";
        }
      }
      
      toast({
        title: "Camera Access Required",
        description: `${errorMessage} ${actionText}`,
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

              <div className="relative bg-gray-900 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
                {isScanning ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                      webkit-playsinline="true"
                      style={{
                        // Only mirror front-facing cameras, not rear cameras
                        transform: selectedCamera && availableCameras.find(cam => cam.deviceId === selectedCamera)?.label?.toLowerCase().includes('front') 
                          ? 'scaleX(-1)' 
                          : 'none',
                        maxWidth: '100%',
                        height: 'auto'
                      }}
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
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-4">
                    <Camera className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-center mb-2 text-sm">
                      Position barcode or QR code within camera view
                    </p>
                    <p className="text-center mb-4 text-xs opacity-75">
                      Make sure to allow camera permissions when prompted
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={startCamera}
                        className="wb-btn-primary w-full"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          console.log('Attempting direct camera access...');
                          setSelectedCamera('');
                          await startCamera();
                        }}
                        variant="outline"
                        className="w-full text-sm"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Force Camera Start
                      </Button>
                    </div>
                    {availableCameras.length === 0 && (
                      <div className="text-center text-xs opacity-90 bg-orange-900/70 p-4 rounded-lg border border-orange-600/50 mt-3">
                        <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-300" />
                        <p className="mb-3 font-semibold text-orange-200">Camera Access Issue</p>
                        <div className="space-y-1 text-left text-orange-200">
                          <p className="font-medium text-orange-100">Android Chrome:</p>
                          <p>• Tap camera/lock icon in address bar</p>
                          <p>• Allow camera permissions</p>
                          <p>• Refresh page</p>
                          <p className="font-medium text-orange-100 mt-2">Alternative:</p>
                          <p>• Chrome → Settings → Site Settings → Camera</p>
                          <p>• Find this site and enable camera</p>
                        </div>
                        <div className="mt-3 p-2 bg-blue-900/50 rounded">
                          <p className="text-blue-200 text-xs">Use Manual Entry below if camera doesn't work</p>
                        </div>
                      </div>
                    )}
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
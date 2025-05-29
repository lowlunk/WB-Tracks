/**
 * Barcode Scanner Utility Library
 * 
 * This module provides utilities for barcode scanning functionality.
 * In a production environment, this would integrate with actual barcode scanning libraries
 * such as @zxing/library, quagga2, or html5-qrcode.
 */

export interface ScanResult {
  code: string;
  format: string;
  timestamp: Date;
}

export interface ScannerConfig {
  facingMode: 'user' | 'environment';
  width?: number;
  height?: number;
  formats?: string[];
}

export class BarcodeScanner {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isScanning = false;
  private config: ScannerConfig;

  constructor(config: ScannerConfig = { facingMode: 'environment' }) {
    this.config = {
      facingMode: config.facingMode || 'environment',
      width: config.width || 1280,
      height: config.height || 720,
      formats: config.formats || ['CODE_128', 'CODE_39', 'EAN_13', 'EAN_8', 'QR_CODE'],
    };
  }

  /**
   * Initialize camera and start video stream
   */
  async initializeCamera(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.config.facingMode,
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          frameRate: { ideal: 30 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      
      return new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play()
            .then(() => resolve())
            .catch(reject);
        };
        
        videoElement.onerror = reject;
      });
    } catch (error) {
      throw new Error(`Failed to initialize camera: ${error}`);
    }
  }

  /**
   * Start scanning for barcodes
   * In a real implementation, this would use a barcode scanning library
   */
  startScanning(onScan: (result: ScanResult) => void, onError?: (error: Error) => void): void {
    if (!this.videoElement || !this.stream) {
      throw new Error('Camera not initialized');
    }

    this.isScanning = true;

    // In a production environment, you would initialize the barcode scanning library here
    // For example, with @zxing/library:
    /*
    import { BrowserMultiFormatReader } from '@zxing/library';
    
    const codeReader = new BrowserMultiFormatReader();
    codeReader.decodeFromVideoDevice(undefined, this.videoElement, (result, error) => {
      if (result) {
        onScan({
          code: result.getText(),
          format: result.getBarcodeFormat().toString(),
          timestamp: new Date(),
        });
      }
      if (error && onError) {
        onError(new Error(error.message));
      }
    });
    */

    // For demonstration purposes, we'll simulate scanning
    console.log('Barcode scanning started. In production, this would use a real scanning library.');
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    this.isScanning = false;
    // In production, you would stop the barcode scanning library here
  }

  /**
   * Stop camera and release resources
   */
  stopCamera(): void {
    this.stopScanning();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Check if the browser supports camera access
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Get available camera devices
   */
  static async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    if (!this.isSupported()) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }

  /**
   * Request camera permissions
   */
  static async requestPermissions(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  /**
   * Validate barcode format
   */
  static validateBarcodeFormat(code: string, expectedFormat?: string): boolean {
    if (!code || code.trim().length === 0) {
      return false;
    }

    // Basic validation - in production, you might want more specific validation
    // based on the expected barcode format
    const trimmedCode = code.trim();
    
    // Check for common barcode patterns
    const patterns = {
      'CODE_128': /^[A-Za-z0-9\s\-_.$/+%]+$/,
      'CODE_39': /^[A-Z0-9\s\-.$\/+%]+$/,
      'EAN_13': /^\d{13}$/,
      'EAN_8': /^\d{8}$/,
      'UPC_A': /^\d{12}$/,
      'QR_CODE': /^.+$/, // QR codes can contain any characters
    };

    if (expectedFormat && patterns[expectedFormat as keyof typeof patterns]) {
      return patterns[expectedFormat as keyof typeof patterns].test(trimmedCode);
    }

    // If no specific format expected, check against common patterns
    return Object.values(patterns).some(pattern => pattern.test(trimmedCode));
  }

  /**
   * Parse component number from scanned barcode
   */
  static parseComponentNumber(code: string): string {
    // Remove any non-alphanumeric characters and convert to uppercase
    // This is a basic implementation - you might need more sophisticated parsing
    // based on your barcode format
    return code.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
}

/**
 * Utility functions for barcode processing
 */
export const BarcodeUtils = {
  /**
   * Format barcode for display
   */
  formatForDisplay(code: string): string {
    return code.trim().toUpperCase();
  },

  /**
   * Check if a string looks like a component number
   */
  isValidComponentNumber(code: string): boolean {
    // Basic validation for component numbers (adjust pattern as needed)
    const componentPattern = /^[A-Z0-9]{3,20}$/;
    return componentPattern.test(code.trim().toUpperCase());
  },

  /**
   * Generate QR code data for a component
   */
  generateComponentQRData(componentNumber: string): string {
    return JSON.stringify({
      type: 'component',
      number: componentNumber,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Parse QR code data
   */
  parseQRData(data: string): { type: string; number: string; timestamp?: string } | null {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'component' && parsed.number) {
        return parsed;
      }
    } catch (error) {
      // Not JSON, treat as raw component number
      if (this.isValidComponentNumber(data)) {
        return {
          type: 'component',
          number: data.trim().toUpperCase(),
        };
      }
    }
    return null;
  },
};

export default BarcodeScanner;

# Barcode Management Guide

## Overview

WB-Tracks supports comprehensive barcode management including component barcode assignment and temporary barcode generation for testing and training purposes.

## Component Barcode Assignment

### Assigning Existing Barcodes to Components

1. **Navigate to Component**: Go to inventory and find the component
2. **Edit Component**: Click the edit button to open the component editor
3. **Find Barcode Field**: Scroll to the "Component Barcode" section
4. **Scan Barcode**: Click the scan button (camera icon) next to the barcode field
5. **Camera Scanning**: Use your device camera to scan the existing 2D barcode
6. **Automatic Population**: The scanned code automatically fills the barcode field
7. **Save Changes**: Click "Save Changes" to assign the barcode permanently

### Manual Barcode Entry

If scanning isn't possible, you can manually type the barcode:
1. Click in the "Component Barcode" field
2. Type or paste the barcode string
3. Save the component

### Supported Barcode Types

- QR Codes
- Data Matrix codes
- Aztec codes
- PDF417 codes
- Any 2D barcode format supported by ZXing library

## Temporary Barcode System

### Overview

Temporary barcodes are designed for testing, training, and demonstration purposes. They automatically expire and can be linked to components for realistic testing scenarios.

### Creating Temporary Barcodes

**Admin Access Required**

1. **Access Management**: Click the QR code icon in the header (admin only)
2. **Create Barcode**: Click "Create Barcode" button
3. **Fill Form**:
   - **Purpose**: Select from Testing, Training, Demo, or Receiving
   - **Component**: Optionally link to an existing component
   - **Description**: Add descriptive text for identification
   - **Expiration**: Choose from 1 hour to 1 week
4. **Generate**: Click "Create Barcode" to generate

### Barcode Format

Temporary barcodes follow this format:
```
TMP-[PURPOSE]-[TIMESTAMP]-[RANDOM]
```

Example: `TMP-TESTING-20250625140530-A7B9C`

### Managing Temporary Barcodes

#### Viewing Active Barcodes
- See all active temporary barcodes in the management table
- View usage statistics and expiration times
- Monitor which barcodes have been scanned

#### Printing QR Codes
1. **Print Button**: Click the printer icon next to any barcode
2. **Print Dialog**: A formatted label opens with:
   - Scannable QR code
   - Barcode text
   - Purpose and expiration information
   - Optional description
3. **Print**: Use browser print functionality

#### Downloading QR Codes
1. **Download Button**: Click the download icon
2. **PNG File**: Downloads QR code as PNG image
3. **Filename**: Saved as `barcode-[BARCODE].png`

#### Deleting Barcodes
- Click trash icon to delete individual barcodes
- Confirmation dialog prevents accidental deletion

#### Cleanup Expired Barcodes
- Click "Cleanup Expired" to remove all expired barcodes
- Automatic cleanup helps maintain database performance

## Barcode Lookup Integration

### Scanner Behavior

When scanning any barcode, the system:

1. **Component Barcode**: Looks up components by assigned barcode
2. **Component Number**: Falls back to component number matching
3. **Temporary Barcode**: Checks for active temporary barcodes
4. **Expiration Check**: Validates temporary barcode expiration
5. **Usage Tracking**: Records scan events for temporary barcodes

### API Integration

The barcode lookup API handles all barcode types:
- Regular component barcodes
- Component numbers (fallback)
- Temporary barcodes with expiration validation
- Usage statistics for temporary barcodes

## Best Practices

### Component Barcodes
- Use high-quality 2D barcodes for reliability
- Test barcode scannability before final assignment
- Document barcode assignments for inventory records
- Consider barcode placement for easy scanning access

### Temporary Barcodes
- Use descriptive purposes and descriptions
- Set appropriate expiration times for testing duration
- Print multiple test barcodes for batch testing scenarios
- Clean up expired barcodes regularly
- Link to real components for realistic testing

### Testing Workflows
- Create test barcodes for different workflow scenarios
- Use various expiration times for multi-day testing
- Print professional labels for realistic testing
- Document test scenarios and expected outcomes

## Troubleshooting

### Scanning Issues
- Ensure good lighting conditions
- Clean camera lens
- Hold device steady at appropriate distance
- Try different angles if initial scan fails

### Permission Issues
- Check browser camera permissions
- Allow camera access for barcode scanning
- Refresh page if permissions change

### Temporary Barcode Issues
- Verify admin permissions for barcode management
- Check expiration times for test barcodes
- Ensure temporary barcodes haven't expired
- Contact admin if barcode management unavailable

## Security Considerations

### Access Control
- Temporary barcode management requires admin role
- Regular users can scan but not create test barcodes
- Component barcode assignment available to authorized users

### Data Protection
- Temporary barcodes automatically expire
- Usage tracking for audit purposes
- Regular cleanup prevents data accumulation
- No sensitive data stored in barcode strings
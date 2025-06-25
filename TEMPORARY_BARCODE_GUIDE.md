# Temporary Barcode System Guide

## Overview

The temporary barcode system allows administrators to generate test barcodes for training, testing, and demonstration purposes. These barcodes integrate seamlessly with the existing barcode scanning system and automatically expire after a specified time period.

## Features

### Barcode Format
- **Pattern**: `TMP-[PURPOSE]-[TIMESTAMP]-[RANDOM]`
- **Example**: `TMP-TES-m2k8z1-A4B2`
- **Purpose Codes**: TES (Testing), TRA (Training), DEM (Demo)

### Barcode Types
1. **Standalone Barcodes**: Independent test codes with custom descriptions
2. **Component-Linked Barcodes**: Temporary codes that point to existing components

### Expiration System
- **Automatic Cleanup**: Expired barcodes are automatically removed
- **Configurable Duration**: 1 hour to 1 week (168 hours)
- **Usage Tracking**: Monitors scan count and last usage

## Access and Navigation

### Admin Access Only
- Only users with admin role can create/manage temporary barcodes
- Access via header icon (orange QR code) or direct URL: `/barcodes/temporary`

### Navigation Integration
- Header navigation includes temporary barcode icon for admins
- Icon is visually distinct (orange color) from regular scan button

## Using the System

### Creating Temporary Barcodes

1. **Navigate to Temporary Barcodes page**
   - Click orange QR code icon in header, or
   - Go to `/barcodes/temporary`

2. **Click "Create Barcode" button**

3. **Fill out the form**:
   - **Purpose**: Select Testing, Training, or Demo
   - **Component Link** (Optional): Link to existing component
   - **Description** (Optional): Custom description
   - **Expiration**: Choose from 1 hour to 1 week

4. **Generate and Test**
   - Barcode is immediately available for scanning
   - Copy code to clipboard for manual testing

### Scanning Temporary Barcodes

#### Automatic Detection
- Scanner automatically detects `TMP-` prefix
- Updates usage count on each scan
- Handles expired barcodes gracefully

#### Response Behavior
- **Component-linked**: Returns full component data with temporary flag
- **Standalone**: Returns barcode info with custom description
- **Expired**: Shows appropriate error message

### Management Features

#### Barcode Table
- View all active temporary barcodes
- Status indicators (Active/Expired)
- Usage statistics and last scan time
- Quick actions (View Details, Delete)

#### Cleanup Operations
- Manual cleanup of expired barcodes
- Automatic background cleanup
- Bulk deletion capabilities

## API Integration

### Enhanced Barcode Lookup
```javascript
// POST /api/barcode/lookup
{
  "barcode": "TMP-TES-m2k8z1-A4B2"
}

// Response for temporary barcode
{
  "componentNumber": "TMP-TES-m2k8z1-A4B2",
  "description": "Temporary testing barcode",
  "isTemporary": true,
  "temporaryBarcode": {
    "id": 1,
    "purpose": "testing",
    "usageCount": 3,
    "expiresAt": "2025-06-26T17:30:00.000Z"
  }
}
```

### Management Endpoints
- `GET /api/barcodes/temporary` - List all temporary barcodes
- `POST /api/barcodes/temporary` - Create new temporary barcode
- `DELETE /api/barcodes/temporary/:id` - Delete specific barcode
- `POST /api/barcodes/temporary/cleanup` - Clean expired barcodes

## Testing Scenarios

### Basic Testing
1. **Create Test Barcode**
   ```
   Purpose: Testing
   Description: "Scanner validation test"
   Expiration: 1 hour
   ```

2. **Scan with Mobile Device**
   - Open barcode scanner
   - Scan generated code
   - Verify proper recognition and response

3. **Manual Entry Test**
   - Copy barcode to clipboard
   - Use manual entry in scanner
   - Verify lookup functionality

### Training Scenarios
1. **Component Training**
   ```
   Purpose: Training
   Link to Component: Select existing component
   Description: "Training barcode for component lookup"
   Expiration: 4 hours
   ```

2. **Staff Training**
   - Generate multiple training barcodes
   - Practice scanning procedures
   - Review usage statistics

### Demo Scenarios
1. **Customer Demo**
   ```
   Purpose: Demo
   Description: "Demo barcode for customer presentation"
   Expiration: 24 hours
   ```

2. **Feature Demonstration**
   - Show real-time scanning
   - Demonstrate inventory integration
   - Highlight mobile compatibility

## Best Practices

### Security
- Only admin users can create temporary barcodes
- Automatic expiration prevents long-term accumulation
- Usage tracking for audit purposes

### Performance
- Regular cleanup of expired barcodes
- Efficient database queries with proper indexing
- Minimal impact on production scanning

### Maintenance
- Monitor usage patterns
- Clean expired barcodes regularly
- Review temporary barcode logs

## Troubleshooting

### Common Issues

#### Barcode Not Recognized
1. **Check Format**: Ensure barcode starts with `TMP-`
2. **Verify Expiration**: Check if barcode has expired
3. **Manual Entry**: Try entering code manually

#### Scanner Issues
1. **Camera Permissions**: Verify browser camera access
2. **Mobile Compatibility**: Test on different devices
3. **Network Connection**: Ensure API connectivity

#### Admin Access
1. **User Role**: Verify admin role assignment
2. **Session**: Check if logged in properly
3. **Navigation**: Use direct URL if icon missing

### Error Messages
- `"Temporary barcode not found or expired"` - Barcode invalid or expired
- `"Temporary barcode has expired"` - Barcode past expiration time
- `"Component not found"` - Regular barcode lookup failed

## Integration Notes

### Real-time Updates
- WebSocket integration for live scanning feedback
- Immediate usage count updates
- Real-time expiration checking

### Mobile Optimization
- Full mobile scanner compatibility
- Touch-friendly interface
- Responsive design for all devices

### Database Schema
- Efficient storage with proper indexing
- Automatic cleanup capabilities
- Usage tracking and analytics

## Future Enhancements

### Potential Features
- Bulk barcode generation
- Advanced analytics and reporting
- Custom barcode formats
- Integration with external systems
- QR code generation with embedded data

### Performance Improvements
- Background cleanup jobs
- Caching for frequently accessed codes
- Optimized database queries
# Temporary Barcode System - Live Demonstration

## Step-by-Step Demo Walkthrough

### 1. Access the System (Admin Only)
- You're already logged in as `cbryson` (admin role)
- Look for the **orange QR code icon** in the header next to the regular scan button
- Click it to navigate to `/barcodes/temporary`

### 2. Create Your First Test Barcode
**Click "Create Barcode" button and fill out:**
- **Purpose**: Testing
- **Description**: "My first demo barcode"
- **Expiration**: 24 Hours
- **Component Link**: Leave empty for now
- **Click "Create Barcode"**

**Expected Result**: You'll see a new barcode with format like `TMP-TES-m2k8z1-A4B2`

### 3. Test the Barcode with Scanner
**Using the Mobile Scanner:**
- Click the regular QR code icon in header to open scanner
- Either scan the generated barcode or use manual entry
- Copy the barcode from the table and paste it

**Expected Behavior:**
- Scanner recognizes the `TMP-` prefix
- Shows success message with barcode details
- Usage count increases in the table
- "Last Used" timestamp updates

### 4. Create Component-Linked Barcode
**Create another barcode:**
- **Purpose**: Training
- **Component Link**: Select any existing component
- **Description**: "Training barcode linked to component"
- **Expiration**: 4 Hours

**Test this barcode:**
- When scanned, returns full component data
- Shows `isTemporary: true` flag
- Links to actual inventory information

### 5. Test Expiration Handling
**For quick testing, create a short-lived barcode:**
- **Purpose**: Demo
- **Expiration**: 1 Hour
- **Description**: "Quick expiration test"

**Verify expiration:**
- After expiration, scanning shows "expired" message
- Use "Cleanup Expired" button to remove

## Real-Time Features to Observe

### Barcode Format
- Each barcode follows `TMP-[PURPOSE]-[TIMESTAMP]-[RANDOM]` pattern
- Purpose codes: TES (Testing), TRA (Training), DEM (Demo)
- Timestamp ensures uniqueness
- Random suffix adds security

### Usage Tracking
- **Usage Count**: Increments with each scan
- **Last Used**: Shows exact timestamp
- **Status Badges**: Active/Expired indicators
- **Purpose Badges**: Color-coded by type

### Integration Points
- **Existing Scanner**: Seamlessly handles temporary codes
- **Mobile Compatible**: Works with camera scanning
- **Real-time Updates**: Usage stats update immediately
- **Error Handling**: Clear messages for expired/invalid codes

## Testing Scenarios

### Basic Functionality
1. Create → Scan → Verify tracking
2. Copy to clipboard → Manual entry → Success
3. Multiple scans → Usage count increases

### Mobile Testing
1. Open scanner on mobile device
2. Test camera scanning with generated barcode
3. Verify proper recognition and response

### Admin Management
1. View all temporary barcodes in table
2. Delete unwanted barcodes
3. Cleanup expired barcodes in bulk
4. Monitor usage statistics

### Error Scenarios
1. Scan expired barcode → Clear error message
2. Invalid barcode format → Proper fallback
3. Network issues → Graceful degradation

## Current System State
- Database schema deployed and active
- API endpoints fully functional
- Frontend interface accessible at `/barcodes/temporary`
- Scanner integration working with existing camera system
- Real-time updates via WebSocket connections

## Next Steps for Testing
1. Navigate to the temporary barcode page
2. Create test barcodes with different purposes
3. Test scanning with both camera and manual entry
4. Observe usage tracking and statistics
5. Test expiration and cleanup functionality
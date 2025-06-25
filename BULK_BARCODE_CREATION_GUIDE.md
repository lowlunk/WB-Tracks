# Bulk Barcode Creation for Testing

## Quick Setup for 10 Test Barcodes

### Method 1: Manual Creation (Current)
1. Click "Create Barcode" button
2. Fill form for each barcode:
   - Purpose: Testing
   - Component: Select different components or leave as "No component"
   - Description: "Test barcode #1", "Test barcode #2", etc.
   - Expires: 24 Hours (or longer for extended testing)
3. Repeat 10 times
4. Use Print button (printer icon) for each to generate QR codes

### Method 2: Bulk Creation (Future Enhancement)
Could add a "Create Multiple" feature that:
- Creates X number of barcodes at once
- Links to random components or specific component list
- Generates batch print layout
- Sets consistent expiration times

## Testing Scenarios with 10 Barcodes

### Inventory Receiving Test
- Create 5 barcodes linked to different components
- Print QR codes
- Use scanner to "receive" inventory by scanning codes
- Verify system response and tracking

### Transfer Testing
- Create barcodes for components in Main inventory
- Test transfers from Main to Line locations
- Scan to move items between locations

### Component Lookup Testing
- Mix of linked and unlinked temporary barcodes
- Test scanner response differences
- Verify component data retrieval

## Current Print Functionality
Each barcode now has:
- **Printer icon**: Opens formatted print dialog with QR code
- **Download icon**: Downloads QR code as PNG file
- **Eye icon**: View detailed information
- **Trash icon**: Delete barcode

## Best Practices
1. Use descriptive descriptions for testing scenarios
2. Set appropriate expiration times (24-72 hours for multi-day testing)
3. Link to actual components when testing real workflows
4. Print multiple codes at once for batch testing
5. Keep track of which codes are for which test scenarios
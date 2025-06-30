# WB-Tracks Feature Testing Guide

This guide helps you test all WB-Tracks features to ensure everything works correctly.

## Prerequisites
- System should be running (`npm run dev`)
- Access to the web interface
- Admin login credentials (admin/admin123)

## Authentication Testing

### Login Test
1. Navigate to the application
2. Use credentials: **admin** / **admin123**
3. ✅ Should redirect to dashboard
4. ✅ Navigation menu should show admin options

### User Management Test
1. Click Settings → User Management
2. ✅ Should see 4 users (admin, cbryson, kanucs, prod)
3. ✅ Each user should have proper roles assigned
4. Try creating a new user
5. ✅ User creation form should work

## Component & Inventory Testing

### Component Browsing
1. Go to Inventory page
2. ✅ Should see 167 components listed
3. Search for "217520"
4. ✅ Should find component with description
5. Click on any component
6. ✅ Component details should open

### Barcode Lookup Testing
1. Go to any page with barcode scanner
2. Click "Scan Barcode" or similar button
3. Allow camera access when prompted
4. **For Physical Testing**: Use Brother P-touch labels with CODE39 barcodes
   - Scan labels with component numbers like 217520, 217543, RFID24DIG
   - ✅ Should recognize and lookup components immediately
5. **For Manual Testing**: Use manual barcode entry
   - Enter: 217520
   - ✅ Should find "351X119MM 2OZ BRIGADE 6MCA 0SE"

## Orders System Testing

### Creating Orders
1. Go to Orders page (bottom navigation)
2. Click "Create Order"
3. Fill out:
   - Title: "Daily Pick Order"
   - Description: "Warehouse to Insert Line"
   - Priority: High
4. ✅ Order should be created with auto-generated order number

### Adding Components to Orders
1. Open the created order
2. Click "Add Component" or scan barcode
3. **Barcode Workflow Test**:
   - Scan or enter: 217520
   - Set quantity: 25
   - From Location: Main Inventory
   - To Location: Line Inventory
   - ✅ Component should be added to order
4. Repeat with other components (217543, RFID24DIG)
5. ✅ Order should show all components with quantities

### Order Status Management
1. View order list
2. Update order status (Pending → In Progress → Completed)
3. ✅ Status changes should be saved and visible

## Inventory Operations Testing

### Inventory Transfers
1. Go to Inventory page
2. Find any component with stock
3. Click "Transfer Stock"
4. Set:
   - From: Main Inventory
   - To: Line Inventory  
   - Quantity: 10
5. ✅ Transfer should complete
6. ✅ Inventory quantities should update
7. ✅ Transaction should appear in recent activity

### Stock Level Monitoring
1. Check Dashboard
2. ✅ Should show current inventory totals
3. ✅ Main Inventory: ~167,000 units
4. ✅ Line Inventory: Variable based on transfers
5. ✅ Low Stock Alerts: Should show 0 (all items well-stocked)

## Dashboard & Reporting Testing

### Dashboard Metrics
1. Go to Dashboard
2. ✅ Should show:
   - Total Components: 167
   - Main Inventory Total: ~167,000
   - Line Inventory Total: Variable
   - Low Stock Alerts: 0
3. ✅ Recent Activity should show latest transactions

### Recent Activity
1. Check recent activity section
2. ✅ Should show transfers, orders, and other operations
3. ✅ Each activity should show:
   - Component details
   - Quantities
   - Locations
   - Timestamps

## Mobile Testing

### Mobile Interface
1. Test on mobile device or responsive mode
2. ✅ Bottom navigation should be visible
3. ✅ Barcode scanner should work with mobile camera
4. ✅ All pages should be touch-friendly
5. ✅ Forms should work properly on mobile

### Camera Integration
1. On mobile, test barcode scanning
2. ✅ Camera should activate properly
3. ✅ Should scan CODE39 and QR codes
4. ✅ Should auto-focus and recognize barcodes

## API Testing (Advanced)

### Command Line Testing
```bash
# Login and save session
curl -c cookies.txt -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test component lookup
curl -b cookies.txt -X POST http://localhost:5000/api/barcode/lookup \
  -H "Content-Type: application/json" \
  -d '{"barcode":"217520"}'

# Test order creation
curl -b cookies.txt -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"title":"API Test Order","description":"Testing via API","priority":"medium"}'
```

## Production Workflow Testing

### Daily Picker Workflow
**Scenario**: Warehouse worker creating daily pick list

1. **Morning Setup**
   - Login as warehouse user
   - Go to Orders page
   - Create new order: "Morning Pick - Insert Line"

2. **Component Scanning**
   - Use barcode scanner (camera or manual entry)
   - Scan components needed for production:
     - 217520 (qty: 50)
     - 217543 (qty: 25) 
     - RFID24DIG (qty: 100)
   - Set all transfers from Main → Line Inventory

3. **Order Completion**
   - Review order items
   - Mark order as "In Progress"
   - Process transfers
   - Mark order as "Completed"

4. **Verification**
   - ✅ All components should be in order
   - ✅ Inventory should be updated
   - ✅ Transaction history should be complete

## Troubleshooting Common Issues

### Camera Not Working
- Ensure HTTPS or localhost access
- Grant camera permissions in browser
- Try different browsers (Chrome, Firefox, Safari)
- Check camera is not used by other applications

### Barcode Not Scanning
- Ensure proper lighting
- Try manual barcode entry
- Verify barcode format (CODE39 for Brother labels)
- Check if component exists in database

### Login Issues
- Verify credentials: admin/admin123
- Clear browser cache/cookies
- Check if session expired
- Try incognito/private browser mode

### Performance Issues
- Check network connection
- Verify database connectivity
- Restart server if needed
- Check browser console for errors

## Success Criteria

**All features are working correctly if:**

✅ Authentication works with proper role-based access  
✅ All 167 components are visible and searchable  
✅ Barcode scanning recognizes CODE39 and QR codes  
✅ Orders can be created and managed  
✅ Components can be added to orders via barcode scanning  
✅ Inventory transfers work and update quantities  
✅ Dashboard shows accurate real-time metrics  
✅ Mobile interface is responsive and functional  
✅ Recent activity tracking works  
✅ User management functions properly  

**If any of these fail, refer to the troubleshooting section or check system logs.**
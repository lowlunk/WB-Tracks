
# Quick Test Script for Presentation

## Before Starting
1. Open browser developer tools (F12) to check for errors
2. Make sure you're logged in as admin user
3. Have this checklist open alongside the app

## 5-Minute Critical Path Test

### 1. Dashboard Test (30 seconds)
- Load dashboard → Check stats display → Click Quick Actions buttons → Verify no console errors

### 2. Add Component Test (1 minute)
- Click "Add Component" → Fill form (Component: TEST001, Description: Test Item, Plate: P001) → Upload photo → Save → Verify appears in inventory

### 3. Transfer Test (1 minute) 
- Go to Main Inventory → Find TEST001 → Click Transfer → Select Line Inventory → Transfer 5 units → Verify appears in Line Inventory

### 4. Consume Test (30 seconds)
- Go to Line Inventory → Click "Consume for Production" → Select TEST001 → Consume 2 units → Verify inventory reduces

### 5. Mobile Test (1 minute)
- Press F12 → Click mobile device icon → Navigate through app → Check bottom navigation works

### 6. Admin Test (1 minute)
- Go to Admin tab → Check user management loads → Try creating test user → Verify permissions

### 7. Photo Test (30 seconds)
- Edit any component → Upload additional photo → Set as primary → Verify displays correctly

### 8. Barcode Test (30 seconds)
- Click Scan Barcode → Allow camera access → Show camera interface (don't need to actually scan)

## If Any Test Fails
1. Check browser console for errors
2. Refresh page and retry
3. Check if logged in properly
4. Verify database has sample data

## Demo Flow for Presentation
1. **Start**: "This is WB-Tracks, our inventory management system"
2. **Dashboard**: "Here's our overview with real-time stats"
3. **Add Component**: "Adding new components is simple"
4. **Transfer**: "Moving items between locations"
5. **Mobile**: "Fully responsive for factory floor use"
6. **Admin**: "Complete user and permission management"
7. **Features**: "Barcode scanning, photo management, real-time updates"

## Have Ready for Questions
- Sample data showing realistic component numbers
- Multiple user accounts to show role differences
- Mobile device to demonstrate responsiveness
- Explanation of the Main→Line→Consumption workflow

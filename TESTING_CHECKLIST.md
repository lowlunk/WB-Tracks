
# WB-Tracks Testing Checklist for Presentation

## Pre-Presentation Setup
- [ ] Application is running on port 5000
- [ ] Database is populated with sample data
- [ ] Admin user is available (admin/admin123)
- [ ] No console errors visible

## 1. Login & Authentication
- [ ] Login page loads properly
- [ ] Can login with admin credentials
- [ ] Invalid credentials show error message
- [ ] Dashboard loads after successful login
- [ ] Logout functionality works

## 2. Dashboard Features
- [ ] Dashboard stats display correctly (Total Components, Main Inventory, Line Inventory, Low Stock Alerts)
- [ ] Quick Actions buttons work:
  - [ ] Scan Barcode opens camera scanner
  - [ ] Transfer Items opens transfer modal
  - [ ] Consume Items opens consume modal
  - [ ] Generate Report downloads CSV file
- [ ] Recent Activity section displays transactions
- [ ] Clicking on activity items opens component details
- [ ] Low stock alerts banner appears if applicable
- [ ] Real-time updates via WebSocket work

## 3. Main Inventory Page
- [ ] Page loads without errors
- [ ] Inventory table displays components
- [ ] Search functionality works
- [ ] Filter by facility/location works
- [ ] Component actions work:
  - [ ] Edit component opens modal
  - [ ] Transfer component opens transfer modal
  - [ ] View details shows component info
- [ ] Add Component button works
- [ ] Add Stock button works

## 4. Line Inventory Page
- [ ] Page loads without errors
- [ ] Shows production line specific inventory
- [ ] Transfer from Main button works
- [ ] Return to Main button works
- [ ] Consume for Production button works
- [ ] Empty state displays properly if no items

## 5. Inventory (Combined) Page
- [ ] Shows all inventory locations
- [ ] Facility and location filters work
- [ ] Search across all components works
- [ ] Consumed Components modal opens
- [ ] Statistics cards display correctly

## 6. Component Management
- [ ] Add Component Dialog:
  - [ ] All required fields validate
  - [ ] Component number uniqueness checked
  - [ ] Plate number field works
  - [ ] Photo upload works
  - [ ] Save creates component successfully
- [ ] Edit Component Modal:
  - [ ] Loads existing component data
  - [ ] Can modify all fields
  - [ ] Photo management works (upload, delete, set primary)
  - [ ] Save updates component
- [ ] Component Detail Modal:
  - [ ] Displays all component information
  - [ ] Shows photos properly
  - [ ] Shows inventory levels across locations

## 7. Transfer Operations
- [ ] Transfer Modal:
  - [ ] Source/destination location dropdowns populate
  - [ ] Component selection works
  - [ ] Quantity validation works
  - [ ] Notes field accepts input
  - [ ] Transfer processes successfully
  - [ ] Real-time updates reflect changes

## 8. Consumption Tracking
- [ ] Consume Modal:
  - [ ] Component selection works
  - [ ] Quantity validation (can't exceed available)
  - [ ] Notes field works
  - [ ] Consumption records properly
  - [ ] Updates inventory levels

## 9. Barcode/QR Code Features
- [ ] Barcode Scanner:
  - [ ] Camera permission requested
  - [ ] Camera view displays
  - [ ] Mock scanning works (for demo)
  - [ ] Scanner closes properly
- [ ] Barcode Label Printer:
  - [ ] Component selection works
  - [ ] Label preview generates
  - [ ] Print/download functionality works

## 10. Photo Management
- [ ] Photo Upload:
  - [ ] File selection works
  - [ ] Multiple files can be selected
  - [ ] Upload progress shows
  - [ ] Photos appear in gallery
- [ ] Photo Management:
  - [ ] Set primary photo works
  - [ ] Delete photo works
  - [ ] Photos display properly in component details

## 11. Admin Features (Admin Users Only)
- [ ] Admin page accessible to admin users
- [ ] User Management:
  - [ ] View all users
  - [ ] Create new user
  - [ ] Edit user details
  - [ ] Set user roles
  - [ ] Activate/deactivate users
- [ ] Group Management:
  - [ ] View user groups
  - [ ] Create new groups
  - [ ] Set permissions
  - [ ] Edit group details

## 12. Settings & Configuration
- [ ] Settings page loads
- [ ] User profile information displays
- [ ] Theme toggle (dark/light mode) works
- [ ] Notification settings work
- [ ] Data export functionality works
- [ ] Facility management works
- [ ] Logout button works

## 13. Notifications System
- [ ] Notification bell shows count
- [ ] Notification panel opens
- [ ] Low stock notifications appear
- [ ] Activity notifications work
- [ ] Real-time notification updates

## 14. Mobile Responsiveness
- [ ] Bottom navigation appears on mobile
- [ ] All pages are mobile-friendly
- [ ] Touch interactions work
- [ ] Modals go full-screen on mobile
- [ ] Forms are usable on mobile
- [ ] Tables scroll horizontally on mobile

## 15. Real-time Features
- [ ] WebSocket connects successfully
- [ ] Real-time inventory updates work
- [ ] Live notifications appear
- [ ] Dashboard stats update automatically

## 16. Error Handling
- [ ] Network errors display user-friendly messages
- [ ] Form validation shows appropriate errors
- [ ] 404 pages display for invalid routes
- [ ] Server errors are handled gracefully

## 17. Performance
- [ ] Pages load quickly
- [ ] No visible lag in interactions
- [ ] Images load properly
- [ ] No memory leaks during navigation

## 18. Data Integrity
- [ ] Inventory levels are accurate
- [ ] Transfers update both source and destination
- [ ] Consumption reduces inventory properly
- [ ] Transaction history is complete

## Demo Scenarios to Prepare
1. **Basic Workflow**: Add component → Add inventory → Transfer to line → Consume
2. **Photo Management**: Upload photos → Set primary → View in gallery
3. **Barcode Demo**: Show scanner interface (mock scan if needed)
4. **Admin Functions**: Create user → Set permissions → Manage facilities
5. **Mobile Experience**: Show responsive design on phone/tablet
6. **Real-time Updates**: Show live notifications and updates

## Potential Issues to Watch For
- [ ] Console errors (check browser dev tools)
- [ ] Missing environment variables
- [ ] Database connection issues
- [ ] WebSocket connection problems
- [ ] File upload permission issues
- [ ] Camera access on different devices/browsers

## Presentation Tips
- Have sample data ready
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on mobile device
- Have backup plan for camera/barcode features
- Prepare to explain the business value
- Show both admin and user perspectives

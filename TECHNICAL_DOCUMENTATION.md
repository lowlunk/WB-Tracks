
# WB-Tracks Technical Documentation

## System Overview

WB-Tracks is a comprehensive local inventory management system designed for production facilities. The system enables tracking of components between multiple locations (Main Inventory and Production Line) with real-time updates, barcode scanning capabilities, multi-facility support, and comprehensive photo management.

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Real-time Communication**: WebSocket
- **State Management**: TanStack Query v5
- **Routing**: Wouter
- **Authentication**: Session-based with bcrypt hashing
- **File Upload**: Multer for photo management

### Project Structure
```
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── *-modal.tsx # Modal components
│   │   │   └── *.tsx       # Feature components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   ├── pages/          # Application pages/routes
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Application entry point
├── server/                 # Backend application
│   ├── db.ts               # Database connection setup
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data access layer
│   ├── vite.ts             # Vite development server integration
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema and type definitions
├── uploads/                # File storage directory
│   └── components/         # Component photos
└── package.json            # Dependencies and scripts
```

## Database Schema

### Core Tables

#### Users
- **Purpose**: Store user accounts and authentication data
- **Key Fields**: id, username, email, password_hash, role, group_id, first_name, last_name
- **Relationships**: belongs to user_groups, has many inventory_transactions

#### User Groups
- **Purpose**: Group users for permission management
- **Key Fields**: id, name, description, permissions
- **Relationships**: has many users

#### Components
- **Purpose**: Define inventory items/parts
- **Key Fields**: id, component_number, description, plate_number, category, supplier, unit_price
- **New Features**: plate_number field for additional identification
- **Relationships**: has many inventory_items, component_photos, inventory_transactions

#### Component Photos
- **Purpose**: Store component images
- **Key Fields**: id, component_id, filename, url, is_primary, uploaded_at
- **Features**: Primary photo designation, automatic URL generation
- **Relationships**: belongs to component

#### Facilities
- **Purpose**: Define physical locations (e.g., factories, warehouses)
- **Key Fields**: id, name, code, address, contact_info
- **Relationships**: has many inventory_locations

#### Inventory Locations
- **Purpose**: Specific storage areas within facilities
- **Key Fields**: id, facility_id, name, location_type, is_active
- **Common Types**: "main", "line", "storage", "shipping"
- **Relationships**: belongs to facility, has many inventory_items

#### Inventory Items
- **Purpose**: Track quantity of components at specific locations
- **Key Fields**: id, component_id, location_id, quantity, min_threshold, max_threshold
- **Relationships**: belongs to component and location

#### Inventory Transactions
- **Purpose**: Log all inventory movements and changes
- **Key Fields**: id, transaction_type, component_id, from_location_id, to_location_id, quantity, notes
- **Transaction Types**: "transfer", "add", "remove", "consume", "adjust"
- **Relationships**: belongs to component, from_location, to_location

### Data Relationships
```
Facilities (1:many) Inventory Locations (1:many) Inventory Items (many:1) Components (1:many) Component Photos
User Groups (1:many) Users (1:many) Inventory Transactions
Components (1:many) Component Photos
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/user` - Get current user info

### Components
- `GET /api/components` - List all components
- `POST /api/components` - Create new component
- `GET /api/components/:id` - Get specific component
- `PUT /api/components/:id` - Update component
- `DELETE /api/components/:id` - Delete component
- `GET /api/components/search?q=:query` - Search components

### Component Photos
- `GET /api/components/:id/photos` - Get component photos
- `POST /api/components/:id/photos` - Upload component photo
- `PUT /api/components/:componentId/photos/:photoId/primary` - Set primary photo
- `DELETE /api/components/photos/:photoId` - Delete component photo

### Inventory Management
- `GET /api/inventory` - Get all inventory items with details
- `GET /api/inventory/location/:locationId` - Get inventory for specific location
- `PUT /api/inventory/quantity` - Update inventory quantity
- `POST /api/inventory/transfer` - Transfer items between locations
- `POST /api/inventory/add` - Add items to inventory
- `POST /api/inventory/remove` - Remove items from inventory
- `POST /api/inventory/consume` - Consume items (production use)

### Notifications & Alerts
- `GET /api/inventory/low-stock` - Get low stock alerts
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/transactions/consumed` - Get consumed items history

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity

### Admin Management
- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/users` - Create new user (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/groups` - List user groups (admin only)
- `POST /api/admin/groups` - Create user group (admin only)

### Facilities
- `GET /api/facilities` - List all facilities
- `POST /api/facilities` - Create new facility
- `GET /api/locations` - List all inventory locations
- `POST /api/locations` - Create new location

## Frontend Architecture

### Key Components

#### Pages
- **Dashboard**: Overview with statistics, recent activity, low stock alerts
- **Main Inventory**: Manage main storage area inventory
- **Line Inventory**: Manage production line inventory
- **Inventory**: Combined view of all inventory locations
- **Admin**: User and group management (admin only)
- **Settings**: User preferences and system configuration

#### Core Components
- **Header**: Navigation, notifications, user actions
- **Bottom Navigation**: Mobile-friendly navigation
- **Component Table**: Reusable inventory display with actions
- **Transfer Modal**: Handle inventory transfers between locations
- **Consume Modal**: Record production consumption
- **Component Edit Modal**: Edit component details and manage photos
- **Component Detail Modal**: View component information
- **Barcode Scanner**: Camera-based barcode/QR code scanning
- **Add Component Dialog**: Create new inventory components
- **Notification System**: Real-time alerts and notifications

#### Mobile Optimizations
- **Responsive Dialogs**: Full-screen modals on mobile devices
- **Touch-friendly Interface**: Optimized button sizes and spacing
- **Mobile Navigation**: Bottom navigation bar for easy access
- **Responsive Tables**: Horizontal scrolling for data tables
- **Camera Integration**: Native camera access for barcode scanning

### State Management

#### TanStack Query Keys
```typescript
// Components
["/api/components"]
["/api/components", componentId]
["/api/components", componentId, "photos"]

// Inventory
["/api/inventory"]
["/api/inventory/location", locationId]
["/api/inventory/low-stock"]

// Transactions
["/api/transactions/recent"]
["/api/transactions/consumed"]

// Dashboard
["/api/dashboard/stats"]
["/api/dashboard/recent-activity"]

// Admin
["/api/admin/users"]
["/api/admin/groups"]
```

#### Custom Hooks
- `useAuth()` - Authentication state and actions
- `useUserRole()` - User permission checking
- `useWebSocket()` - Real-time updates
- `useTheme()` - Dark/light mode management
- `useOnboarding()` - First-time user tour
- `useNotifications()` - Alert management
- `useMobile()` - Mobile device detection

## Real-time Features

### WebSocket Implementation
- **Connection**: Automatic connection on app load
- **Reconnection**: Automatic retry on disconnect with exponential backoff
- **Events**: 
  - `inventory-update` - Real-time inventory changes
  - `low-stock-alert` - Immediate low stock notifications
  - `transaction-logged` - New transaction notifications
  - `user-activity` - User action updates

### Live Updates
- Inventory quantities update across all connected clients
- Low stock alerts appear immediately
- Transaction history updates in real-time
- Dashboard statistics refresh automatically
- Real-time notifications system

## Security

### Authentication
- Session-based authentication with secure cookies
- Password hashing using bcrypt with salt rounds
- Session timeout and automatic logout
- Role-based access control (admin, user)

### Authorization
- Route-level protection for admin functions
- Component-level permission checking
- API endpoint authorization middleware
- Input validation and sanitization

### Data Protection
- SQL injection prevention via parameterized queries
- XSS protection through input sanitization
- CSRF protection with session tokens
- Secure HTTP headers
- File upload validation and restrictions

### File Upload Security
- File type validation
- File size limits
- Secure filename generation
- Directory traversal prevention
- Virus scanning integration ready

## Mobile Responsiveness

### Design Principles
- Mobile-first responsive design
- Touch-friendly interface elements
- Optimized for tablets and smartphones
- Progressive Web App capabilities

### Key Features
- Bottom navigation for mobile devices
- Full-screen modals on mobile
- Swipe gestures for actions
- Camera integration for barcode scanning
- Offline capability planning
- Responsive data tables with horizontal scroll

### Mobile-Specific Components
- **Enhanced Barcode Scanner**: Full Android Chrome compatibility with smart orientation
- **Touch-optimized Interface**: Large buttons and controls for easy mobile interaction
- **Responsive Modals**: Full-screen dialogs on mobile with proper navigation
- **Camera Integration**: Native camera access with comprehensive error handling
- **Mobile Navigation**: Bottom navigation bar with touch-friendly interactions
- **Progressive Web App**: Install-to-homescreen with offline capability planning

## Barcode/QR Code Integration

### Enhanced Mobile Scanning
- **Android Chrome Compatibility**: Fixed initialization issues with comprehensive error handling
- **Smart Camera Orientation**: Automatic detection of front/rear cameras with proper mirroring
- **Enhanced Error Recovery**: Multiple fallback mechanisms and Force Camera Start option
- **Mobile-Specific Constraints**: Optimized camera settings for mobile devices
- **Permission Handling**: Step-by-step guidance for Android camera permissions
- **Real-time Detection**: Immediate barcode recognition with automatic camera stop
- **Multiple Format Support**: Code 128, QR codes, and various other barcode types

### Label Printing
- Customizable barcode label generation
- Multiple label sizes and formats
- Include component details, QR codes, logos
- Print-ready PDF generation

## Photo Management System

### Upload Features
- Multiple photo upload for components
- Drag and drop interface
- File type validation (JPEG, PNG, WebP)
- File size limits and optimization
- Automatic thumbnail generation

### Storage Management
- Local file system storage
- Organized directory structure
- Unique filename generation
- Automatic cleanup of orphaned files
- Storage usage monitoring

### Display Features
- Primary photo designation
- Image gallery interface
- Responsive image display
- Lazy loading for performance
- Mobile-optimized viewing

## Deployment Options

### Replit Deployment
- Built-in database and hosting
- Automatic SSL certificates
- Real-time collaboration
- Integrated development environment

### Local Deployment
- Self-contained application
- No internet dependency required
- Local PostgreSQL database
- Internal network access

### Cloud Deployment
- Docker containerization support
- Digital Ocean droplet deployment
- AWS/Azure compatibility
- Environment-based configuration

### Raspberry Pi Deployment
- Local network deployment
- Offline operation capability
- ARM architecture support
- IoT integration ready

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Session
SESSION_SECRET=your-secret-key

# Development
NODE_ENV=development|production
PORT=5000
HOST=0.0.0.0

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5MB
```

### Feature Flags
- Dark mode toggle
- Onboarding tour enable/disable
- Real-time notifications
- Barcode scanning
- Multi-facility support
- Photo management

## Performance Optimization

### Database
- Indexed queries for fast lookups
- Connection pooling
- Query optimization
- Pagination for large datasets
- Database query logging

### Frontend
- Component lazy loading
- Image optimization and lazy loading
- Bundle size optimization
- Caching strategies
- Debounced search inputs
- Virtual scrolling for large lists

### Real-time
- WebSocket connection management
- Selective data broadcasting
- Client-side caching
- Update batching
- Connection pooling

### File Management
- Image compression and optimization
- Efficient file storage organization
- CDN integration ready
- Caching headers for static assets

## Maintenance

### Database Migrations
- Drizzle ORM migration system
- Version-controlled schema changes
- Rollback capabilities
- Data seed scripts

### File System Maintenance
- Orphaned file cleanup
- Storage usage monitoring
- Backup procedures for uploads
- Log rotation

### Monitoring
- Application logs
- Error tracking
- Performance metrics
- User activity logs
- WebSocket connection monitoring

### Backup Strategy
- Regular database backups
- Configuration backups
- File upload backups
- Disaster recovery procedures
- Data export capabilities

## Integration Capabilities

### Power BI Integration
- Data export endpoints
- Scheduled data dumps
- Real-time data feeds
- Custom report formats

### External Systems
- ERP system integration
- Supplier system connections
- Manufacturing execution systems
- Quality management systems
- IoT device integration

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL and PostgreSQL service
2. **Session Issues**: Verify SESSION_SECRET configuration
3. **WebSocket Problems**: Check network connectivity and firewall settings
4. **Barcode Scanning**: Ensure camera permissions and HTTPS
5. **Performance Issues**: Monitor database query performance
6. **File Upload Issues**: Check permissions and disk space
7. **Mobile Issues**: Verify responsive design and touch controls

### Debug Mode
- Console logging levels
- Network request inspection
- Database query logging
- WebSocket message tracing
- File upload debugging

### Mobile Debugging
- Device-specific testing
- Touch event debugging
- Camera permission issues
- Performance on mobile devices
- Network connectivity on mobile

### Support Contacts
- Technical Documentation: This file
- API Reference: See API_REFERENCE.md
- Deployment Guide: See DEPLOYMENT.md
- Raspberry Pi Guide: See RASPBERRY_PI_INSTALLATION_RUNBOOK.md

---

*This documentation covers the core technical aspects of WB-Tracks. For specific implementation details, refer to the codebase and inline comments.*

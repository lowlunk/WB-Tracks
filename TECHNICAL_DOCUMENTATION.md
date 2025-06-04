# WB-Tracks Technical Documentation

## System Overview

WB-Tracks is a comprehensive local inventory management system designed for production facilities. The system enables tracking of components between multiple locations (Main Inventory and Production Line) with real-time updates, barcode scanning capabilities, and multi-facility support.

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

### Project Structure
```
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
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
└── package.json            # Dependencies and scripts
```

## Database Schema

### Core Tables

#### Users
- **Purpose**: Store user accounts and authentication data
- **Key Fields**: id, username, email, password_hash, role, group_id
- **Relationships**: belongs to user_groups, has many inventory_transactions

#### User Groups
- **Purpose**: Group users for permission management
- **Key Fields**: id, name, description, permissions
- **Relationships**: has many users

#### Components
- **Purpose**: Define inventory items/parts
- **Key Fields**: id, component_number, description, category, supplier, unit_price
- **Relationships**: has many inventory_items, component_photos, inventory_transactions

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
Facilities (1:many) Inventory Locations (1:many) Inventory Items (many:1) Components
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
- **Barcode Scanner**: Camera-based barcode/QR code scanning
- **Add Component Dialog**: Create new inventory components

### State Management

#### TanStack Query Keys
```typescript
// Components
["/api/components"]
["/api/components", componentId]

// Inventory
["/api/inventory"]
["/api/inventory/location", locationId]
["/api/inventory/low-stock"]

// Transactions
["/api/transactions/recent"]
["/api/transactions/consumed"]

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

## Real-time Features

### WebSocket Implementation
- **Connection**: Automatic connection on app load
- **Reconnection**: Automatic retry on disconnect
- **Events**: 
  - `inventory-update` - Real-time inventory changes
  - `low-stock-alert` - Immediate low stock notifications
  - `transaction-logged` - New transaction notifications

### Live Updates
- Inventory quantities update across all connected clients
- Low stock alerts appear immediately
- Transaction history updates in real-time
- Dashboard statistics refresh automatically

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

## Mobile Responsiveness

### Design Principles
- Mobile-first responsive design
- Touch-friendly interface elements
- Optimized for tablets and smartphones
- Progressive Web App capabilities

### Key Features
- Bottom navigation for mobile devices
- Swipe gestures for actions
- Camera integration for barcode scanning
- Offline capability planning
- Responsive data tables with horizontal scroll

## Barcode/QR Code Integration

### Scanning Capabilities
- Camera-based scanning via web browser
- Multiple barcode format support (Code 128, QR codes, etc.)
- Real-time scanning feedback
- Automatic component lookup

### Label Printing
- Customizable barcode label generation
- Multiple label sizes and formats
- Include component details, QR codes, logos
- Print-ready PDF generation

## Deployment Options

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

### SaaS Potential
- Multi-tenant architecture ready
- Facility-based data isolation
- User subscription management
- API rate limiting

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Session
SESSION_SECRET=your-secret-key

# Development
NODE_ENV=development|production
PORT=3000
```

### Feature Flags
- Dark mode toggle
- Onboarding tour enable/disable
- Real-time notifications
- Barcode scanning
- Multi-facility support

## Performance Optimization

### Database
- Indexed queries for fast lookups
- Connection pooling
- Query optimization
- Pagination for large datasets

### Frontend
- Component lazy loading
- Image optimization
- Bundle size optimization
- Caching strategies
- Debounced search inputs

### Real-time
- WebSocket connection management
- Selective data broadcasting
- Client-side caching
- Update batching

## Maintenance

### Database Migrations
- Drizzle ORM migration system
- Version-controlled schema changes
- Rollback capabilities
- Data seed scripts

### Monitoring
- Application logs
- Error tracking
- Performance metrics
- User activity logs

### Backup Strategy
- Regular database backups
- Configuration backups
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

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL and PostgreSQL service
2. **Session Issues**: Verify SESSION_SECRET configuration
3. **WebSocket Problems**: Check network connectivity and firewall settings
4. **Barcode Scanning**: Ensure camera permissions and HTTPS
5. **Performance Issues**: Monitor database query performance

### Debug Mode
- Console logging levels
- Network request inspection
- Database query logging
- WebSocket message tracing

### Support Contacts
- Technical Documentation: This file
- API Reference: See API_REFERENCE.md
- Deployment Guide: See DEPLOYMENT.md

---

*This documentation covers the core technical aspects of WB-Tracks. For specific implementation details, refer to the codebase and inline comments.*
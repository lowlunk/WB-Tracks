# WB-Tracks: Advanced Local Inventory Management System

WB-Tracks is a comprehensive inventory management system designed for production facilities, featuring intelligent tracking, user-centric design, and seamless operational workflows.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [System Architecture](#system-architecture)
4. [Getting Started](#getting-started)
5. [User Guide](#user-guide)
6. [Admin Guide](#admin-guide)
7. [API Documentation](#api-documentation)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Overview

WB-Tracks is built to solve the challenge of managing inventory between main storage areas and production lines in manufacturing facilities. The system supports barcode/QR code scanning for efficient tracking and provides real-time visibility into inventory levels across multiple locations.

### Key Benefits

- **Real-time inventory tracking** across multiple facilities and locations
- **Barcode/QR code integration** for fast, accurate inventory operations
- **Mobile-responsive design** for use on tablets and smartphones
- **Multi-facility support** for expanded operations
- **Role-based access control** with admin and user permissions
- **Low stock alerts** with configurable thresholds
- **Comprehensive transaction history** and reporting
- **Dark mode support** for different working environments

## Features

### Core Functionality

#### Inventory Management
- **Dual-location tracking**: Main Inventory and Line Inventory
- **Multi-facility support**: Manage inventory across multiple facilities
- **Real-time stock levels**: Automatic updates across all connected devices
- **Low stock alerts**: Configurable thresholds with visual notifications
- **Component management**: Add, edit, and organize inventory items

#### Transaction Management
- **Transfer items**: Move inventory between locations
- **Consume items**: Track production usage separate from transfers
- **Add inventory**: Increase stock levels for existing or new items
- **Transaction history**: Complete audit trail of all inventory movements

#### User Management
- **Role-based access**: Admin and standard user roles
- **User groups**: Organize users by department or function
- **Authentication**: Secure login with session management
- **Profile management**: User settings and preferences

#### Barcode Integration
- **Barcode scanning**: Camera-based scanning for quick operations
- **Label printing**: Generate barcode labels for components
- **Multiple formats**: Support for various barcode types
- **QR code support**: Enhanced data capacity for complex items

### Advanced Features

#### Notifications
- **Real-time alerts**: Low stock and system notifications
- **Persistent history**: View past notifications and alerts
- **Configurable thresholds**: Set custom low stock levels
- **Visual indicators**: Color-coded alerts by severity

#### Reporting
- **Dashboard analytics**: Overview of inventory status and trends
- **Activity tracking**: Recent transactions and user activity
- **Consumed items report**: Track production consumption patterns
- **Export capabilities**: Data export for external analysis

#### User Experience
- **Responsive design**: Optimized for desktop, tablet, and mobile
- **Dark mode**: Eye-friendly interface for various lighting conditions
- **Onboarding tour**: Interactive walkthrough for new users
- **Keyboard shortcuts**: Efficient navigation for power users

## System Architecture

### Technology Stack

**Frontend:**
- React with TypeScript
- Vite build system
- TailwindCSS for styling
- Radix UI components
- TanStack Query for data management
- Wouter for routing

**Backend:**
- Node.js with Express
- TypeScript
- PostgreSQL database
- Drizzle ORM
- WebSocket for real-time updates
- Session-based authentication

**Additional Technologies:**
- WebRTC for barcode scanning
- SVG generation for barcode labels
- Local storage for user preferences
- Service worker for offline capabilities

### Database Schema

The system uses a normalized PostgreSQL database with the following main entities:

- **Users**: Authentication and profile information
- **User Groups**: Role-based access control
- **Facilities**: Multi-location support
- **Components**: Inventory item definitions
- **Inventory Items**: Stock levels by location
- **Inventory Transactions**: Complete audit trail
- **Sessions**: User authentication management

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Modern web browser with camera support (for barcode scanning)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wb-tracks
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your database connection string
   DATABASE_URL=postgresql://username:password@localhost:5432/wb_tracks
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open http://localhost:5000 in your web browser

### First-Time Setup

1. **Create admin account**: Register the first user (automatically becomes admin)
2. **Configure facilities**: Set up your facility information in Admin > Facilities
3. **Add locations**: Create inventory locations (e.g., "Main Inventory", "Line Inventory")
4. **Import components**: Add your inventory items
5. **Set up user groups**: Create groups for different departments or roles
6. **Configure notifications**: Set low stock thresholds in Settings

## User Guide

### Dashboard

The dashboard provides an overview of your inventory system:

- **Quick Stats**: Total components, inventory levels, low stock alerts
- **Quick Actions**: Fast access to scanning, transfers, and consumption
- **Recent Activity**: Latest transactions and changes
- **Charts**: Visual representation of inventory data

### Inventory Management

#### Viewing Inventory

1. Navigate to **Main Inventory** or **Line Inventory**
2. Use the search bar to find specific components
3. View component details by clicking on any item
4. Check stock levels and location information

#### Adding Components

1. Click **New Component** button
2. Fill in component details:
   - Component number (unique identifier)
   - Description
   - Category and supplier (optional)
   - Unit price and notes (optional)
3. Upload photos if needed
4. Save to create the component

#### Transferring Items

1. Click **Transfer Items** or select component and click **Transfer**
2. Choose source and destination locations
3. Select component and enter quantity
4. Add notes if needed
5. Confirm transfer

#### Consuming Items

1. Navigate to Line Inventory
2. Click **Consume for Production**
3. Select component and enter consumed quantity
4. Add notes describing the usage
5. Confirm consumption

### Barcode Operations

#### Scanning Barcodes

1. Click the **Scan Barcode** button
2. Allow camera access when prompted
3. Point camera at barcode/QR code
4. The system will automatically detect and process the code

#### Printing Labels

1. Select a component from the inventory
2. Click **Print Label** 
3. Configure label settings:
   - Label size
   - Barcode type
   - Include QR code or logo
   - Number of copies
4. Generate and print labels

### Settings

Access personal settings to customize your experience:

- **Theme**: Switch between light and dark modes
- **Notifications**: Configure alert preferences
- **Profile**: Update personal information
- **Tour**: Restart the onboarding walkthrough

## Admin Guide

### User Management

#### Creating Users

1. Navigate to **Admin > Users**
2. Click **Add User**
3. Fill in user details:
   - Username and email
   - Password (temporary)
   - Role (Admin or User)
   - Active status
4. Save to create the user

#### Managing User Groups

1. Go to **Admin > Groups**
2. Create groups for departments or functions
3. Assign permissions to groups
4. Add users to appropriate groups

#### Assigning Users to Groups

1. In the Users tab, find the user
2. Click **Groups** button
3. Select appropriate groups
4. Save changes

### Facility Management

#### Adding Facilities

1. Navigate to **Admin > Facilities**
2. Click **Add Facility**
3. Enter facility details:
   - Name and code
   - Address and contact information
   - Operational settings
4. Save to create facility

#### Managing Locations

1. Within each facility, manage inventory locations
2. Create locations like "Main Storage", "Production Line", "Staging Area"
3. Set location-specific settings and permissions

### System Configuration

#### Low Stock Thresholds

1. Configure global low stock thresholds
2. Set component-specific thresholds as needed
3. Customize notification settings

#### Backup and Maintenance

1. Regular database backups (recommended daily)
2. Monitor system performance
3. Update user permissions as needed
4. Review and archive old transaction data

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user info

### Inventory Endpoints

- `GET /api/components` - List all components
- `POST /api/components` - Create new component
- `PUT /api/components/:id` - Update component
- `DELETE /api/components/:id` - Delete component

- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Add inventory
- `PUT /api/inventory` - Update inventory quantities

### Transaction Endpoints

- `POST /api/transactions/transfer` - Transfer items
- `POST /api/transactions/consume` - Consume items
- `GET /api/transactions/consumed` - Get consumption history

### Admin Endpoints

- `GET /api/admin/users` - List users (admin only)
- `POST /api/admin/users` - Create user (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)

## Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   DATABASE_URL=<production-database-url>
   SESSION_SECRET=<secure-random-string>
   ```

3. **Deploy to your hosting platform**
   - Upload built files
   - Configure database connection
   - Set up reverse proxy (nginx recommended)
   - Configure SSL certificates

### Recommended Hosting

- **Cloud Platforms**: AWS, Google Cloud, Digital Ocean
- **Database**: Managed PostgreSQL service
- **CDN**: CloudFlare for static assets
- **Monitoring**: Application and database monitoring

### Security Considerations

- Use HTTPS in production
- Secure database connections
- Regular security updates
- Strong session secrets
- Regular backups
- Access logging and monitoring

## Troubleshooting

### Common Issues

#### Database Connection Issues
- Verify DATABASE_URL is correct
- Check database server is running
- Ensure network connectivity
- Verify credentials and permissions

#### Authentication Problems
- Clear browser cookies and session data
- Check SESSION_SECRET configuration
- Verify user exists in database
- Check user account is active

#### Barcode Scanning Issues
- Ensure camera permissions are granted
- Check camera hardware functionality
- Verify good lighting conditions
- Clean camera lens
- Try different barcode formats

#### Performance Issues
- Check database query performance
- Monitor memory usage
- Optimize large data operations
- Consider database indexing
- Review network latency

### Getting Help

- Check the console for error messages
- Review server logs for backend issues
- Verify browser compatibility
- Test with different devices/browsers
- Contact system administrator

### Maintenance

#### Regular Tasks
- Database backups (daily recommended)
- System health monitoring
- User access reviews
- Performance optimization
- Security updates

#### Data Management
- Archive old transactions periodically
- Clean up unused components
- Optimize database queries
- Monitor storage usage
- Update indexes as needed

---

## License

This project is proprietary software. All rights reserved.

## Support

For technical support or questions about WB-Tracks, please contact your system administrator or the development team.

# WB-Tracks: Advanced Local Inventory Management System

WB-Tracks is a comprehensive inventory management system designed for production facilities, featuring intelligent tracking, user-centric design, and seamless operational workflows with real-time updates and mobile-optimized interface.

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

WB-Tracks is built to solve the challenge of managing inventory between main storage areas and production lines in manufacturing facilities. The system supports barcode/QR code scanning for efficient tracking and provides real-time visibility into inventory levels across multiple locations with full mobile support.

### Key Benefits

- **Real-time inventory tracking** across multiple facilities and locations
- **Barcode/QR code integration** for fast, accurate inventory operations
- **Mobile-responsive design** optimized for tablets and smartphones
- **Multi-facility support** for expanded operations
- **Role-based access control** with admin and user permissions
- **Low stock alerts** with configurable thresholds
- **Comprehensive transaction history** and reporting
- **Dark mode support** for different working environments
- **Component photo management** with primary image selection
- **Plate number tracking** for enhanced component identification

## Features

### Core Functionality

#### Inventory Management
- **Dual-location tracking**: Main Inventory and Line Inventory
- **Multi-facility support**: Manage inventory across multiple facilities
- **Real-time stock levels**: Automatic updates across all connected devices
- **Low stock alerts**: Configurable thresholds with visual notifications
- **Component management**: Add, edit, and organize inventory items
- **Plate number tracking**: Additional identifier field for components
- **Photo management**: Upload and manage component images

#### Transaction Management
- **Transfer items**: Move inventory between locations
- **Consume items**: Track production usage separate from transfers
- **Add inventory**: Increase stock levels for existing or new items
- **Transaction history**: Complete audit trail of all inventory movements
- **Real-time activity updates**: Live notifications of inventory changes

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

#### Mobile Optimization
- **Touch-optimized interface**: Designed for mobile devices
- **Responsive dialogs**: Full-screen modals on mobile
- **Touch gestures**: Swipe and tap interactions
- **Camera integration**: Native barcode scanning on mobile browsers

#### Notifications
- **Real-time alerts**: Low stock and system notifications
- **WebSocket updates**: Instant notifications across all connected devices
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
- React 18 with TypeScript
- Vite build system
- TailwindCSS for styling
- Radix UI components
- TanStack Query for data management
- Wouter for routing
- WebSocket for real-time updates

**Backend:**
- Node.js with Express
- TypeScript
- PostgreSQL database
- Drizzle ORM
- WebSocket for real-time updates
- Session-based authentication
- Multer for file uploads

**Additional Technologies:**
- WebRTC for barcode scanning
- SVG generation for barcode labels
- Local storage for user preferences
- Real-time notifications system

### Database Schema

The system uses a normalized PostgreSQL database with the following main entities:

- **Users**: Authentication and profile information
- **User Groups**: Role-based access control
- **Facilities**: Multi-location support
- **Components**: Inventory item definitions with plate numbers
- **Component Photos**: Image management for components
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
4. **Import components**: Add your inventory items with photos and plate numbers
5. **Set up user groups**: Create groups for different departments or roles
6. **Configure notifications**: Set low stock thresholds in Settings

## User Guide

### Dashboard

The dashboard provides an overview of your inventory system:

- **Quick Stats**: Total components, inventory levels, low stock alerts
- **Quick Actions**: Fast access to scanning, transfers, and consumption
- **Recent Activity**: Latest transactions and changes with expandable details
- **Charts**: Visual representation of inventory data

### Inventory Management

#### Viewing Inventory

1. Navigate to **Main Inventory** or **Line Inventory**
2. Use the search bar to find specific components
3. View component details by clicking on any item
4. Check stock levels and location information
5. View component photos and plate numbers

#### Adding Components

1. Click **New Component** button
2. Fill in component details:
   - Component number (unique identifier)
   - Description
   - Plate number (additional identifier)
   - Category and supplier (optional)
   - Unit price and notes (optional)
3. Upload photos if needed
4. Set primary photo
5. Save to create the component

#### Managing Component Photos

1. Select a component and click **Edit**
2. Upload multiple photos using the photo section
3. Set one photo as primary for display
4. Delete unwanted photos
5. Photos are stored locally on the server

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

### Mobile Usage

The application is fully optimized for mobile devices:

- **Touch interface**: All controls are touch-friendly
- **Full-screen dialogs**: Modals expand to full screen on mobile
- **Camera scanning**: Native camera access for barcode scanning
- **Responsive tables**: Horizontal scrolling for data tables
- **Bottom navigation**: Easy access to main sections

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

#### Photo Management

1. Monitor photo storage usage
2. Clean up unused photos periodically
3. Set photo upload limits if needed

#### Backup and Maintenance

1. Regular database backups (recommended daily)
2. Monitor system performance
3. Update user permissions as needed
4. Review and archive old transaction data

## API Documentation

For detailed API documentation, see [API_REFERENCE.md](API_REFERENCE.md).

### Key Endpoints

- **Authentication**: `/api/auth/*`
- **Components**: `/api/components/*`
- **Inventory**: `/api/inventory/*`
- **Transactions**: `/api/transactions/*`
- **Photos**: `/api/components/:id/photos/*`
- **Admin**: `/api/admin/*`

## Deployment

For deployment instructions, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - General deployment guide
- [DIGITAL_OCEAN_DEPLOYMENT.md](DIGITAL_OCEAN_DEPLOYMENT.md) - Digital Ocean specific
- [RASPBERRY_PI_INSTALLATION_RUNBOOK.md](RASPBERRY_PI_INSTALLATION_RUNBOOK.md) - Raspberry Pi setup

### Quick Deploy Options

- **Replit**: Direct deployment with built-in database
- **Digital Ocean**: App Platform with managed PostgreSQL
- **Raspberry Pi**: Local network deployment for offline use

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

#### Photo Upload Issues
- Check file size limits
- Verify upload directory permissions
- Ensure sufficient disk space
- Check file format support

#### Mobile Issues
- Ensure responsive design is working
- Check camera permissions for barcode scanning
- Verify touch controls are functional
- Test on different devices and browsers

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
- Photo storage cleanup

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

## Changelog

### Latest Updates
- Added plate number field for components
- Implemented photo management system
- Enhanced mobile responsiveness
- Added real-time notifications
- Improved dashboard activity section
- Optimized touch interface for mobile devices
- Added comprehensive component photo management

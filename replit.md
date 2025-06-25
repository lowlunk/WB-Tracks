# WB-Tracks: Production Inventory Management System

## Overview

WB-Tracks is a comprehensive local inventory management system designed for production facilities. It enables real-time tracking of components between main storage areas and production lines, featuring barcode/QR code scanning, multi-facility support, and mobile-responsive design optimized for factory floor operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and builds
- **UI Components**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query v5 for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket integration for live inventory updates
- **Mobile-First**: Responsive design with PWA capabilities for tablets and smartphones

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with bcrypt password hashing
- **File Handling**: Multer for component photo uploads and management
- **Real-time Communication**: WebSocket server for broadcasting inventory changes
- **API Design**: RESTful API with comprehensive error handling and validation

### Key Technologies
- **TypeScript**: Full type safety across frontend and backend
- **PostgreSQL**: Robust relational database for production workloads
- **Drizzle ORM**: Modern TypeScript ORM with excellent developer experience
- **WebSocket**: Real-time bidirectional communication
- **Session Storage**: PostgreSQL-backed session management for scalability

## Key Components

### Database Schema
- **Users & Authentication**: Role-based access control (admin, manager, user)
- **Components**: Master component catalog with photos and metadata
- **Facilities & Locations**: Multi-facility support with hierarchical locations
- **Inventory Items**: Real-time stock tracking across locations
- **Transactions**: Complete audit trail of all inventory movements
- **User Groups**: Flexible permission management system

### Core Features
1. **Inventory Management**: Dual-location tracking (Main/Line) with low stock alerts
2. **Barcode Integration**: Camera-based scanning with manual entry fallback
3. **Transaction System**: Transfer, consume, add, and remove operations
4. **Photo Management**: Component images with primary photo selection
5. **Real-time Updates**: Live synchronization across all connected devices
6. **Reporting**: CSV exports and comprehensive transaction history

### User Interface
- **Dashboard**: Real-time stats, quick actions, and recent activity
- **Mobile Navigation**: Bottom navigation bar for touch-friendly operation
- **Dark Mode**: System-wide theme switching with persistence
- **Progressive Web App**: Install-to-homescreen capability for mobile devices

## Data Flow

1. **Authentication Flow**: Session-based login with role verification
2. **Inventory Operations**: Real-time updates via WebSocket broadcast
3. **Transaction Processing**: Atomic database operations with full audit trail
4. **Photo Management**: File upload with automatic thumbnail generation
5. **Real-time Sync**: WebSocket events trigger query invalidation and UI updates

## External Dependencies

### Production Dependencies
- **Database**: PostgreSQL 15+ for reliable data storage
- **File Storage**: Local filesystem for component photos (uploads/ directory)
- **Camera Access**: Browser media APIs for barcode scanning
- **Print Support**: Browser print API for label generation

### Development Dependencies
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking and compilation
- **ESBuild**: Fast JavaScript bundler for production builds
- **Drizzle Kit**: Database migration and schema management

## Deployment Strategy

### Environment Requirements
- **Node.js**: Version 18+ for ESM module support
- **PostgreSQL**: Version 15+ with connection pooling
- **File Permissions**: Write access to uploads/ directory
- **Network**: WebSocket support for real-time features

### Supported Platforms
- **Replit**: Primary deployment target with integrated PostgreSQL
- **Digital Ocean**: App Platform with managed database
- **Docker**: Multi-stage containerized deployment
- **Raspberry Pi**: Local installation for on-premises operation

### Configuration
- **Environment Variables**: Database URL, session secrets, and optional settings
- **Database Migrations**: Automatic schema setup via Drizzle
- **Health Checks**: Built-in endpoint for monitoring and load balancing
- **Production Optimization**: Asset bundling, compression, and caching

## Recent Changes
- June 25, 2025: Added scan-to-input barcode assignment feature for components
  - Added barcode field to components database schema
  - Integrated barcode scanner into component edit dialog
  - Allows scanning existing 2D barcodes and assigning them to components
  - Added scan button next to barcode input field with camera integration
  - Updated component update API to handle barcode field
- June 25, 2025: Added QR code generation and printing functionality to temporary barcode system
  - Integrated qrcode library for generating scannable QR codes from temporary barcodes
  - Added print functionality with formatted barcode labels including purpose, expiration, and description
  - Implemented download feature for QR codes as PNG images
  - Enhanced action buttons in barcode table with print and download options
  - Created professional print layout with proper styling for label printing
- June 25, 2025: Implemented comprehensive temporary barcode generation system for testing purposes
  - Added database schema for temporary barcodes with TMP-[PURPOSE]-[TIMESTAMP]-[RANDOM] format
  - Enhanced barcode lookup API to handle temporary barcodes with automatic expiration checking
  - Built admin-only temporary barcode management interface with create, view, and delete functions
  - Integrated with existing barcode scanning system for seamless real-time testing
  - Added automatic usage tracking and cleanup of expired barcodes
  - Created comprehensive testing guide with usage scenarios and troubleshooting
- June 24, 2025: Updated software version to WB-Tracks v1.7.2 in system information display
- June 24, 2025: Removed demo account display from login page and disabled walkthrough system per user preference
  - Cleaned up simple-login.tsx to remove demo account buttons and credentials
  - Disabled onboarding tour system in useOnboarding hook and App.tsx
  - Removed Quick Tour section from settings page
  - Login page now shows clean interface without demo account clutter
- June 24, 2025: Implemented comprehensive user management system for admin accounts
  - Fixed authentication system by removing auto-login and implementing proper login page
  - Created user management interface with role assignment (admin, manager, shipping, prod, user)  
  - Added admin-only user creation, editing, and deletion capabilities
  - Fixed bcrypt import issues and duplicate function implementations in storage
  - Added role-based access control with admin navigation menu
  - Updated database schema to support new user roles
- June 23, 2025: Fixed mobile barcode scanner camera functionality and orientation
  - Resolved Android Chrome camera initialization issues with enhanced error handling
  - Fixed rear camera mirroring - now shows correct orientation for barcode scanning
  - Added Force Camera Start button for devices with camera enumeration issues
  - Enhanced mobile camera constraints and video element setup for better compatibility
- June 23, 2025: Enhanced barcode scanner for Android mobile devices
  - Improved camera permission handling with mobile-specific constraints
  - Added comprehensive error messages and permission guidance for Android users
  - Enhanced mobile camera initialization with better device detection
  - Added visual permission guide directly in scanner interface for mobile users
- June 23, 2025: Fixed low stock management page modal functionality
  - Resolved TypeError with unit price formatting in component details modal
  - Enhanced error handling for price display with proper fallbacks
  - Verified "View Details" and "Transfer Stock" buttons work without 404 errors
  - Both modals now display comprehensive component information properly
- June 23, 2025: Completely removed all banner popups and notification bell per user preference
  - Completely removed all banner popups and notification bell from header
  - Disabled all alert dialogs and empty "View Details" popups
  - Made Low Stock Alerts dashboard card fully clickable, navigating to /low-stock
  - Fixed settings page error by properly importing DismissedAlertsManager
  - Enhanced barcode scanner with better camera permissions and error handling
  - Added barcode lookup API endpoint for component search by part number
  - All alert management now happens through dedicated /low-stock page only
- June 23, 2025: Enhanced low stock alert dismissal system with persistent management
  - Implemented intelligent alert dismissal that persists across page refreshes
  - Added dismissal expiration system (7 days for regular alerts, 24 hours for critical)
  - Created smart re-alerting when stock levels change after dismissal
  - Built individual item dismissal with reasoning tracking
  - Added temporary "snooze" option for 1-hour dismissal
  - Created dismissed alerts manager for reviewing and restoring dismissed alerts
  - Enhanced alert banner with better information and management options
  - Alerts now show both out-of-stock and low-stock items with different handling
- June 23, 2025: Implemented automated database optimization tools
  - Built comprehensive database performance analysis system
  - Created intelligent optimization recommendations with priority levels
  - Added automated execution and scheduling of database optimizations
  - Implemented database health scoring and real-time monitoring
  - Created optimization history tracking with before/after stats
  - Added query performance analysis and slow query detection
  - Built table and index statistics with vacuum and reindex recommendations
  - Integrated optimization tools into admin dashboard
- June 23, 2025: Completed admin dashboard implementation and database connectivity
  - Built comprehensive admin dashboard with real database connectivity 
  - Added user management with create, view, and delete capabilities
  - Implemented system health monitoring with live database status
  - Created maintenance tools for database optimization and cleanup
  - Fixed database connection pooling configuration issues
  - Connected settings import button to existing inventory import feature
  - Real-time system statistics showing actual user and component counts
- June 23, 2025: Fixed notification system and simplified alert management
  - Completely rebuilt notification settings with proper state persistence
  - Removed duplicate notification sections in settings page
  - Fixed alert banner and notification bell to respect user settings
  - Simplified notification system by removing redundant components
  - Settings now properly save and persist across page refreshes
  - Alert banner only shows when notifications are enabled and items are critically low
- June 22, 2025: Added comprehensive inventory ingestion system
  - Created Excel/CSV import functionality for bulk inventory updates
  - Added intelligent header mapping for flexible file formats
  - Implemented automatic component creation for new part numbers
  - Added inventory transaction tracking for all import operations
  - Created download template feature for proper file formatting
- June 22, 2025: Fixed deployment issues and blank page errors
  - Enhanced error boundary and authentication error handling
  - Added production-specific fixes for build compatibility
  - Improved unhandled promise rejection handling
  - Added comprehensive startup validation for production environments

## Changelog
- June 22, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
Alert preferences: No banner popups for low stock alerts. Prefers dismissible notifications with "View Details" and clickable dashboard cards that navigate to dedicated pages.
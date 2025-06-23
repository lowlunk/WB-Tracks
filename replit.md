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
- June 23, 2025: Enhanced alert system and admin dashboard
  - Replaced intrusive notification system with smart alert manager
  - Alerts now persist in localStorage and only show new/critical items
  - Critical alerts (out of stock) show persistent banner, warnings are dismissible
  - Built comprehensive admin dashboard with system statistics and health monitoring
  - Added database health checks, maintenance actions, and activity logs
  - Improved database connection pooling to reduce timeout errors
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
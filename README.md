
# WB-Tracks: Advanced Local Inventory Management System

WB-Tracks is a comprehensive inventory management system designed for production facilities, featuring intelligent tracking, user-centric design, and seamless operational workflows. Built specifically for manufacturing environments where parts move between main storage and production lines.

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

WB-Tracks solves the critical challenge of managing inventory between main storage areas and production lines in manufacturing facilities. The system provides real-time visibility into stock levels, automates transfer tracking, and prevents production delays caused by inventory shortages.

### Key Benefits

- **Real-time inventory tracking** across multiple facilities and locations with instant updates
- **Barcode/QR code integration** for fast, accurate inventory operations that eliminate manual data entry errors
- **Mobile-responsive design** optimized for tablets and smartphones used on factory floors
- **Multi-facility support** for companies with multiple production sites or warehouses
- **Role-based access control** ensuring proper permissions for different user types
- **Low stock alerts** with configurable thresholds to prevent stockouts
- **Comprehensive transaction history** for audit trails and production planning
- **Dark mode support** for different lighting conditions in manufacturing environments

### Real-World Use Cases

**Manufacturing Floor Management:**
- Track component consumption during production runs
- Transfer parts from main warehouse to production lines
- Monitor stock levels to prevent production delays
- Generate pick lists for material handlers

**Quality Control & Auditing:**
- Complete transaction history for regulatory compliance
- Track component batches through production
- Identify consumption patterns for forecasting
- Monitor inventory accuracy across locations

**Multi-Site Operations:**
- Manage inventory across multiple facilities
- Transfer parts between locations
- Standardize inventory processes company-wide
- Generate consolidated reporting

## Features

### Core Functionality

#### Inventory Management
- **Dual-location tracking**: Separate main storage and production line inventories
- **Multi-facility support**: Scale across multiple production sites
- **Real-time stock levels**: Automatic updates visible to all users instantly
- **Low stock alerts**: Prevent stockouts with customizable warning thresholds
- **Component management**: Organize parts with categories, suppliers, and detailed specifications

**Practical Tips:**
- Set low stock thresholds at 20% of typical weekly consumption
- Use component categories to organize parts by production line or product type
- Include supplier information for quick reordering decisions

#### Transaction Management
- **Transfer operations**: Move inventory between main storage and production lines
- **Consumption tracking**: Record actual usage separate from transfers for accurate costing
- **Inventory additions**: Receive new stock with proper documentation
- **Historical tracking**: Complete audit trail of all inventory movements with timestamps

**Best Practices:**
- Always include notes in transactions for future reference
- Use transfers for planned movements, consumption for actual usage
- Review transaction history weekly to identify consumption patterns

#### User Management
- **Role-based access**: Admin and standard user roles with different permissions
- **User groups**: Organize by department (shipping, production, quality control)
- **Secure authentication**: Session-based login with password encryption
- **Activity tracking**: Monitor user actions for security and training

**Security Tips:**
- Change default admin password immediately after installation
- Create separate user accounts for each employee
- Use user groups to manage permissions efficiently
- Regularly review user access and deactivate unused accounts

#### Barcode Integration
- **Camera-based scanning**: Use any device with a camera for inventory operations
- **Label generation**: Create professional barcode labels for components
- **Multiple formats**: Support for Code 128, QR codes, and other standard formats
- **Quick operations**: Scan barcodes to instantly find, transfer, or consume items

**Implementation Tips:**
- Print barcode labels for all frequently used components
- Train users to scan rather than manually enter component numbers
- Use QR codes for components with complex specifications
- Position barcode labels consistently for easy scanning

### Advanced Features

#### Notifications & Alerts
- **Real-time alerts**: Immediate notifications for low stock situations
- **Persistent history**: View and track past notifications
- **Configurable thresholds**: Set custom warning levels for each component
- **Visual indicators**: Color-coded alerts by urgency level

**Configuration Best Practices:**
- Set critical components to alert at higher thresholds
- Configure alerts to notify relevant department supervisors
- Review alert history monthly to adjust thresholds
- Use different alert levels for seasonal or project-specific components

#### Reporting & Analytics
- **Dashboard overview**: Real-time metrics and key performance indicators
- **Consumption patterns**: Track usage trends for forecasting
- **Transaction reports**: Detailed logs for audit and analysis purposes
- **Export capabilities**: Generate reports for external systems or management

**Analytics Tips:**
- Review consumption reports monthly for reorder planning
- Use dashboard metrics to identify trends and inefficiencies
- Export data for integration with ERP or accounting systems
- Track inventory turnover rates by component category

#### User Experience
- **Responsive design**: Seamless experience on desktop, tablet, and mobile devices
- **Dark mode**: Reduce eye strain in various lighting conditions
- **Guided onboarding**: Interactive tour for new users
- **Keyboard shortcuts**: Efficient navigation for power users

**User Training Tips:**
- Complete the onboarding tour with new users
- Practice barcode scanning in good lighting conditions
- Use keyboard shortcuts for frequently performed operations
- Switch to dark mode in low-light manufacturing areas

## System Architecture

### Technology Stack

**Frontend:**
- React with TypeScript for type safety and maintainability
- Vite for fast development and optimized builds
- TailwindCSS for responsive, customizable styling
- Radix UI for accessible, professional components
- TanStack Query for efficient data management and caching
- Wouter for lightweight, fast routing

**Backend:**
- Node.js with Express for robust server functionality
- TypeScript for consistent development experience
- PostgreSQL for reliable, scalable data storage
- Drizzle ORM for type-safe database operations
- WebSocket for real-time updates across all clients
- Session-based authentication for security

**Integration Technologies:**
- WebRTC for camera-based barcode scanning
- SVG generation for professional barcode labels
- Local storage for user preferences and offline capability
- Service worker foundation for future offline features

### Database Schema

The system uses a normalized PostgreSQL database optimized for inventory operations:

**Core Entities:**
- **Users**: Authentication, roles, and user preferences
- **User Groups**: Role-based permission management
- **Facilities**: Physical locations and organizational structure
- **Components**: Part definitions with specifications
- **Inventory Items**: Current stock levels by location
- **Inventory Transactions**: Complete audit trail of all movements

**Performance Optimizations:**
- Indexed queries for fast component lookups
- Foreign key constraints for data integrity
- Transaction logging for complete auditability
- Efficient joins for complex inventory reporting

## Getting Started

### Prerequisites

- **Node.js 18+** for modern JavaScript features and performance
- **PostgreSQL database** for reliable data storage
- **Modern web browser** with camera support for barcode scanning
- **Network connectivity** for multi-device access

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

3. **Configure environment**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your database connection
   DATABASE_URL=postgresql://username:password@localhost:5432/wb_tracks
   SESSION_SECRET=your-secure-random-string-here
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the system**
   Open http://localhost:5000 in your web browser

### Initial Configuration

1. **Create admin account**: First user registration automatically becomes admin
2. **Set up facilities**: Configure your production sites in Admin > Facilities
3. **Define locations**: Create storage areas (Main Inventory, Line Inventory, etc.)
4. **Import components**: Add your inventory items with proper categorization
5. **Configure user groups**: Set up departments with appropriate permissions
6. **Set alert thresholds**: Configure low stock warnings for critical components

**Pro Tips for Setup:**
- Start with one facility and expand gradually
- Import a small test batch of components first
- Set conservative low stock thresholds initially
- Train a few power users before rolling out company-wide

## User Guide

### Dashboard

The dashboard provides immediate visibility into your inventory status:

**Key Metrics:**
- **Total components** across all locations
- **Current inventory levels** by location
- **Low stock alerts** requiring immediate attention
- **Recent activity** showing latest transactions

**Quick Actions:**
- **Barcode scanning** for instant component lookup
- **Transfer operations** between locations
- **Consumption recording** for production tracking
- **Component search** across all locations

**Best Practices:**
- Check dashboard daily for low stock alerts
- Review recent activity to spot unusual patterns
- Use quick actions for common operations
- Monitor metrics trends for inventory planning

### Inventory Operations

#### Viewing Inventory

1. **Navigate to inventory sections**: Main Inventory or Line Inventory
2. **Use search functionality**: Find components by number, description, or category
3. **View detailed information**: Click components for specifications and history
4. **Check stock levels**: Monitor quantities and alert status

**Search Tips:**
- Use partial component numbers for quick finding
- Search by supplier name for vendor-specific items
- Filter by category to focus on specific component types
- Use description keywords for functional searches

#### Adding Components

1. **Access component creation**: Click "New Component" button
2. **Enter component details**:
   - Component number (unique identifier for your system)
   - Detailed description including specifications
   - Category for organization and reporting
   - Supplier information for reordering
   - Unit price for cost tracking
   - Notes for special handling instructions
3. **Upload reference photos**: Visual identification aids
4. **Save and verify**: Confirm component creation

**Component Management Tips:**
- Use consistent numbering schemes across your organization
- Include key specifications in descriptions
- Categorize components by production line or function
- Always include supplier information for critical components

#### Transfer Operations

1. **Initiate transfer**: Click "Transfer Items" or select component and choose transfer
2. **Configure transfer**:
   - Select source location (where items currently are)
   - Choose destination location (where items should go)
   - Specify component and exact quantity
   - Add notes explaining the transfer reason
3. **Execute transfer**: Confirm operation

**Transfer Best Practices:**
- Always verify quantities before confirming transfers
- Include clear notes for audit trail purposes
- Plan transfers during shift changes to minimize disruption
- Use barcode scanning to ensure accuracy

#### Production Consumption

1. **Navigate to Line Inventory**: Access production area inventory
2. **Select consumption option**: Click "Consume for Production"
3. **Record consumption**:
   - Choose component being used
   - Enter exact quantity consumed
   - Add production details (batch number, work order, etc.)
   - Include any quality notes
4. **Confirm consumption**: Complete the transaction

**Consumption Tracking Tips:**
- Record consumption immediately after use
- Include work order or batch numbers in notes
- Track waste separately from normal consumption
- Review consumption patterns weekly for planning

### Barcode Operations

#### Scanning Setup

1. **Camera access**: Grant browser permission when prompted
2. **Lighting conditions**: Ensure adequate lighting for clear scanning
3. **Scanner positioning**: Hold device steady, 6-12 inches from barcode
4. **Format compatibility**: System supports most standard barcode formats

**Scanning Best Practices:**
- Clean camera lens regularly for clear images
- Use good lighting, avoid glare and shadows
- Hold device steady until scan confirmation
- Print high-quality labels for consistent scanning

#### Label Generation

1. **Select component**: Choose item from inventory list
2. **Access printing**: Click "Print Label" option
3. **Configure label settings**:
   - Label size (standard options available)
   - Barcode format (Code 128 recommended)
   - Include QR code for additional data
   - Add company logo if desired
   - Specify number of copies needed
4. **Generate and print**: Create print-ready labels

**Label Printing Tips:**
- Use high-quality label stock for durability
- Print test labels before large batches
- Include component number and description on labels
- Store labels in clean, dry conditions

### Settings & Preferences

#### Personal Preferences
- **Theme selection**: Choose light or dark mode based on work environment
- **Notification settings**: Configure alert preferences
- **Profile management**: Update personal information and password
- **Onboarding**: Restart tutorial for training purposes

#### Notification Configuration
- **Alert frequency**: Set how often to check for low stock
- **Threshold preferences**: Customize warning levels
- **Email notifications**: Configure external alerts (if enabled)
- **Sound alerts**: Enable audio notifications for critical alerts

## Admin Guide

### User Management

#### Creating User Accounts

1. **Access user administration**: Navigate to Admin > Users
2. **Add new user**: Click "Add User" button
3. **Configure user details**:
   - Username (unique identifier for login)
   - Email address for notifications and recovery
   - Temporary password (user should change on first login)
   - Role assignment (Admin or User)
   - Account status (Active/Inactive)
4. **Save configuration**: Create the user account

**User Management Best Practices:**
- Use consistent username conventions (first.last format)
- Require strong passwords for all accounts
- Set up new accounts with temporary passwords
- Regularly review user access and remove unused accounts

#### User Group Management

1. **Create functional groups**: Navigate to Admin > Groups
2. **Define group permissions**:
   - Inventory read/write access
   - Transaction creation rights
   - Consumption recording permissions
   - Administrative capabilities
3. **Assign users**: Add appropriate users to each group
4. **Review regularly**: Update group memberships as roles change

**Group Organization Strategies:**
- Create groups by department (Production, Shipping, QC)
- Set up role-based groups (Supervisors, Operators, Managers)
- Define project-specific groups for temporary assignments
- Regularly audit group memberships for security

### Facility & Location Management

#### Facility Configuration

1. **Access facility management**: Navigate to Admin > Facilities
2. **Create new facilities**: Click "Add Facility"
3. **Enter facility information**:
   - Facility name and identification code
   - Physical address and contact information
   - Operational parameters and settings
   - Active status and configuration
4. **Save facility**: Confirm creation

**Multi-Facility Tips:**
- Use consistent naming conventions across facilities
- Include facility codes in component numbering schemes
- Set up location hierarchies that match physical layouts
- Coordinate inventory policies across all facilities

#### Location Management

1. **Define storage areas**: Create locations within each facility
2. **Common location types**:
   - Main Storage: Primary inventory holding area
   - Production Lines: Active manufacturing areas
   - Staging Areas: Temporary holding locations
   - Shipping/Receiving: Dock areas for incoming/outgoing inventory
3. **Configure location settings**: Set permissions and operational parameters

**Location Setup Best Practices:**
- Mirror physical layout in system organization
- Use clear, descriptive location names
- Set appropriate access permissions for each area
- Include location codes on physical signage

### System Configuration

#### Inventory Thresholds

1. **Global threshold settings**: Set company-wide low stock levels
2. **Component-specific thresholds**: Override global settings for critical items
3. **Alert configuration**: Set notification timing and recipients
4. **Threshold monitoring**: Regular review and adjustment

**Threshold Management Tips:**
- Set critical components to higher alert levels
- Adjust thresholds based on lead times and consumption patterns
- Review and update thresholds quarterly
- Consider seasonal variations in threshold settings

#### Data Management

1. **Database maintenance**: Regular optimization and cleanup
2. **Transaction archiving**: Long-term storage of historical data
3. **User activity monitoring**: Track system usage and performance
4. **Backup procedures**: Regular data protection measures

**Data Retention Guidelines:**
- Archive transactions older than 2 years
- Maintain user activity logs for 6 months
- Backup database daily
- Test restore procedures quarterly

## API Documentation

### Authentication Flow

The API uses session-based authentication for security and simplicity:

```javascript
// Login request
POST /api/auth/login
{
  "username": "user123",
  "password": "securePassword"
}

// Response includes session cookie
{
  "id": 1,
  "username": "user123",
  "role": "admin"
}
```

### Inventory Operations

```javascript
// Get inventory with filters
GET /api/inventory?locationId=1&lowStock=true

// Transfer items between locations
POST /api/transactions/transfer
{
  "componentId": 1,
  "fromLocationId": 1,
  "toLocationId": 2,
  "quantity": 50,
  "notes": "Production transfer for order #12345"
}
```

### Real-time Updates

WebSocket connection provides instant updates:

```javascript
// Connect to WebSocket
ws://localhost:5000/ws

// Receive real-time inventory updates
{
  "type": "inventory:update",
  "data": {
    "componentId": 1,
    "locationId": 1,
    "quantity": 150
  }
}
```

## Deployment

### Production Deployment on Replit

For production deployment, Replit provides a robust hosting solution:

1. **Environment Setup**: Configure production environment variables
2. **Database Configuration**: Set up PostgreSQL database connection
3. **SSL Configuration**: Enable HTTPS for secure access
4. **Performance Optimization**: Configure caching and optimization settings

### Security Configuration

- **Session Security**: Strong session secrets and secure cookie settings
- **Database Security**: Encrypted connections and proper user permissions
- **Network Security**: Firewall configuration and access controls
- **Regular Updates**: Keep dependencies and system components current

### Performance Optimization

- **Database Indexing**: Optimize queries for fast inventory operations
- **Caching Strategy**: Implement appropriate caching for frequently accessed data
- **Connection Pooling**: Manage database connections efficiently
- **Asset Optimization**: Minimize and compress static assets

## Troubleshooting

### Common Issues & Solutions

#### Barcode Scanner Problems
**Symptoms**: Camera not working or poor scan quality
**Solutions**:
- Verify camera permissions in browser settings
- Ensure adequate lighting conditions
- Clean camera lens
- Try different barcode formats
- Test with high-quality printed barcodes

#### Database Connection Issues
**Symptoms**: Application errors or slow performance
**Solutions**:
- Verify DATABASE_URL configuration
- Check PostgreSQL service status
- Monitor connection pool usage
- Review database logs for errors
- Optimize query performance

#### User Access Problems
**Symptoms**: Login failures or permission errors
**Solutions**:
- Verify user credentials and account status
- Check user group memberships
- Review role-based permissions
- Clear browser cache and cookies
- Check session configuration

#### Performance Issues
**Symptoms**: Slow loading or unresponsive interface
**Solutions**:
- Monitor server resource usage
- Check database query performance
- Review network connectivity
- Clear browser cache
- Restart application services

### Diagnostic Tools

```bash
# Check application status
pm2 status
pm2 logs wb-tracks

# Database diagnostics
psql -U username -d wb_tracks -c "SELECT COUNT(*) FROM inventory_transactions;"

# Network connectivity
ping database-server
netstat -tulpn | grep :5000
```

### Maintenance Schedule

**Daily Tasks:**
- Monitor application logs for errors
- Check low stock alerts and address critical items
- Verify backup completion
- Review user activity for unusual patterns

**Weekly Tasks:**
- Database maintenance and optimization
- User access review and cleanup
- Performance monitoring and tuning
- System update review and planning

**Monthly Tasks:**
- Complete security audit
- Database backup verification
- User training and system optimization
- Threshold review and adjustment

## Support & Maintenance

### Getting Help

1. **Documentation Review**: Check this guide and technical documentation
2. **Log Analysis**: Review application and database logs
3. **System Diagnostics**: Run built-in diagnostic tools
4. **Community Resources**: Access user forums and knowledge base

### Continuous Improvement

- **User Feedback**: Regular collection and analysis of user suggestions
- **Performance Monitoring**: Ongoing system optimization
- **Feature Enhancement**: Regular updates and new functionality
- **Training Updates**: Continuous user education and system training

---

## License

This project is proprietary software. All rights reserved.

## Support

For technical support, feature requests, or questions about WB-Tracks, refer to your system administrator or technical support team.

**System Information:**
- Version: Latest
- Documentation Last Updated: Current
- Support Contact: System Administrator

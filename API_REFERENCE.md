
# WB-Tracks API Reference

This document provides comprehensive information about the WB-Tracks REST API endpoints, including practical examples, implementation tips, and best practices for integration.

## Base URL

All API endpoints are relative to your application's base URL:
```
https://your-domain.com/api
```

For local development:
```
http://localhost:5000/api
```

## Authentication

WB-Tracks uses session-based authentication with secure HTTP cookies. All requests must include session cookies for proper authentication.

### Authentication Flow

1. **Login**: Send credentials to `/api/auth/login`
2. **Session Cookie**: Server sets secure session cookie
3. **Authenticated Requests**: Include session cookie automatically
4. **Logout**: Clear session via `/api/auth/logout`

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@wb-tracks.local",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "isActive": true,
  "lastLogin": "2024-01-01T12:00:00Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials",
  "message": "Username or password is incorrect"
}
```

**Implementation Tips:**
- Store session cookies automatically in browsers
- Handle 401 responses by redirecting to login
- Use HTTPS in production for secure cookie transmission
- Implement password strength requirements

#### Logout
```http
POST /api/auth/logout
```

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Best Practices:**
- Clear local user state after logout
- Redirect to login page after successful logout
- Handle logout on session expiration

#### Get Current User
```http
GET /api/auth/user
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@wb-tracks.local",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "isActive": true,
  "createdAt": "2024-01-01T10:00:00Z",
  "lastLogin": "2024-01-01T12:00:00Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Not authenticated"
}
```

## Components

Components represent the parts/items in your inventory system. Each component has a unique identifier and detailed specifications.

### List All Components
```http
GET /api/components
```

**Query Parameters:**
- `search` (string): Search in component number or description
- `category` (string): Filter by component category
- `supplier` (string): Filter by supplier name
- `limit` (number): Limit number of results (default: 100)
- `offset` (number): Pagination offset (default: 0)

**Example Request:**
```http
GET /api/components?search=217520&category=Hardware&limit=50
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "componentNumber": "217520",
    "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
    "category": "Hardware",
    "supplier": "ACME Components",
    "unitPrice": "15.99",
    "notes": "Special handling required - fragile",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T11:00:00Z"
  },
  {
    "id": 2,
    "componentNumber": "ABC123",
    "description": "Steel Bracket Assembly",
    "category": "Mechanical",
    "supplier": "Steel Works Inc",
    "unitPrice": "8.50",
    "notes": "Powder coated finish",
    "createdAt": "2024-01-01T10:15:00Z",
    "updatedAt": "2024-01-01T10:15:00Z"
  }
]
```

**Implementation Tips:**
- Use search parameter for quick component lookup
- Implement client-side caching for frequently accessed components
- Use pagination for large component lists
- Cache component data for offline functionality

### Create Component
```http
POST /api/components
Content-Type: application/json

{
  "componentNumber": "NEW001",
  "description": "New Component Description",
  "category": "Electronics",
  "supplier": "Tech Supplier Co",
  "unitPrice": "25.00",
  "notes": "RoHS compliant component"
}
```

**Validation Rules:**
- `componentNumber`: Required, unique, 1-50 characters
- `description`: Required, 1-500 characters
- `category`: Optional, 1-100 characters
- `supplier`: Optional, 1-100 characters
- `unitPrice`: Optional, decimal string format
- `notes`: Optional, up to 1000 characters

**Success Response (201 Created):**
```json
{
  "id": 156,
  "componentNumber": "NEW001",
  "description": "New Component Description",
  "category": "Electronics",
  "supplier": "Tech Supplier Co",
  "unitPrice": "25.00",
  "notes": "RoHS compliant component",
  "createdAt": "2024-01-01T14:30:00Z",
  "updatedAt": "2024-01-01T14:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "componentNumber",
      "message": "Component number already exists"
    }
  ]
}
```

**Best Practices:**
- Validate component numbers are unique before submission
- Use consistent naming conventions for component numbers
- Include detailed descriptions for better searchability
- Set up component categories for better organization

### Update Component
```http
PUT /api/components/:id
Content-Type: application/json

{
  "componentNumber": "UPD001",
  "description": "Updated Component Description",
  "category": "Electronics",
  "supplier": "New Supplier Co",
  "unitPrice": "27.50",
  "notes": "Updated specifications"
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "componentNumber": "UPD001",
  "description": "Updated Component Description",
  "category": "Electronics",
  "supplier": "New Supplier Co",
  "unitPrice": "27.50",
  "notes": "Updated specifications",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T15:00:00Z"
}
```

### Delete Component
```http
DELETE /api/components/:id
```

**Success Response (200 OK):**
```json
{
  "message": "Component deleted successfully"
}
```

**Error Response (409 Conflict):**
```json
{
  "error": "Cannot delete component with existing inventory",
  "message": "Component has inventory items in one or more locations"
}
```

**Important Notes:**
- Components with existing inventory cannot be deleted
- Consider archiving instead of deleting for audit trail
- Deletion is permanent and cannot be undone

### Search Components
```http
GET /api/components/search?q=search_term
```

**Query Parameters:**
- `q` (string): Search term for component number or description
- `category` (string): Filter by category
- `limit` (number): Maximum results to return

**Example:**
```http
GET /api/components/search?q=brigade&category=Hardware&limit=10
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "componentNumber": "217520",
    "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
    "category": "Hardware",
    "supplier": "ACME Components",
    "unitPrice": "15.99"
  }
]
```

## Inventory Management

Inventory endpoints manage the current stock levels of components across different locations.

### Get Inventory Items
```http
GET /api/inventory
```

**Query Parameters:**
- `locationId` (number): Filter by specific location
- `componentId` (number): Filter by specific component
- `lowStock` (boolean): Show only low stock items
- `includeZero` (boolean): Include items with zero quantity

**Example Request:**
```http
GET /api/inventory?locationId=1&lowStock=true
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "componentId": 1,
    "locationId": 1,
    "quantity": 250,
    "minThreshold": 50,
    "maxThreshold": 500,
    "component": {
      "id": 1,
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
      "category": "Hardware",
      "supplier": "ACME Components"
    },
    "location": {
      "id": 1,
      "name": "Main Inventory",
      "facilityId": 1,
      "facility": {
        "id": 1,
        "name": "KC Foam",
        "code": "WDBG-KCF"
      }
    }
  }
]
```

**Implementation Tips:**
- Use locationId filter for location-specific views
- Implement real-time updates for inventory changes
- Cache inventory data with appropriate TTL
- Use lowStock filter for alert systems

### Get Inventory by Location
```http
GET /api/inventory?locationId=1
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "componentId": 1,
    "locationId": 1,
    "quantity": 250,
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050"
    }
  }
]
```

### Add Inventory
```http
POST /api/inventory
Content-Type: application/json

{
  "componentId": 1,
  "locationId": 1,
  "quantity": 100,
  "notes": "Initial stock from supplier delivery"
}
```

**Validation Rules:**
- `componentId`: Required, must exist
- `locationId`: Required, must exist and be active
- `quantity`: Required, positive number
- `notes`: Optional, descriptive information

**Success Response (201 Created):**
```json
{
  "id": 15,
  "componentId": 1,
  "locationId": 1,
  "quantity": 100,
  "transaction": {
    "id": 45,
    "type": "add",
    "quantity": 100,
    "notes": "Initial stock from supplier delivery",
    "createdAt": "2024-01-01T16:00:00Z"
  }
}
```

**Best Practices:**
- Always include descriptive notes for inventory additions
- Verify component and location exist before adding
- Use batch operations for multiple items
- Implement barcode scanning for accuracy

### Update Inventory Quantity
```http
PUT /api/inventory
Content-Type: application/json

{
  "componentId": 1,
  "locationId": 1,
  "quantity": 150,
  "notes": "Inventory count adjustment"
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "componentId": 1,
  "locationId": 1,
  "quantity": 150,
  "previousQuantity": 250,
  "adjustment": -100,
  "transaction": {
    "id": 46,
    "type": "adjust",
    "quantity": -100,
    "notes": "Inventory count adjustment",
    "createdAt": "2024-01-01T16:15:00Z"
  }
}
```

### Get Low Stock Items
```http
GET /api/inventory/low-stock
```

**Query Parameters:**
- `locationId` (number): Filter by location
- `threshold` (number): Custom threshold override

**Success Response (200 OK):**
```json
[
  {
    "id": 5,
    "componentId": 3,
    "locationId": 2,
    "quantity": 2,
    "minThreshold": 10,
    "alertLevel": "critical",
    "component": {
      "componentNumber": "ABC123",
      "description": "Steel Bracket Assembly",
      "category": "Mechanical"
    },
    "location": {
      "name": "Line Inventory",
      "facilityId": 1
    }
  }
]
```

**Alert Levels:**
- `warning`: 20-50% above threshold
- `low`: 0-20% above threshold  
- `critical`: At or below threshold

## Transactions

Transaction endpoints handle all inventory movements including transfers, consumption, and additions.

### Transfer Items
```http
POST /api/transactions/transfer
Content-Type: application/json

{
  "componentId": 1,
  "fromLocationId": 1,
  "toLocationId": 2,
  "quantity": 50,
  "notes": "Transfer to production line for order #12345"
}
```

**Validation Rules:**
- `componentId`: Required, must exist
- `fromLocationId`: Required, must have sufficient quantity
- `toLocationId`: Required, must be different from source
- `quantity`: Required, positive number, cannot exceed available
- `notes`: Optional but recommended for audit trail

**Success Response (201 Created):**
```json
{
  "id": 25,
  "componentId": 1,
  "fromLocationId": 1,
  "toLocationId": 2,
  "quantity": 50,
  "type": "transfer",
  "notes": "Transfer to production line for order #12345",
  "userId": 3,
  "createdAt": "2024-01-01T17:00:00Z",
  "fromLocation": {
    "name": "Main Inventory"
  },
  "toLocation": {
    "name": "Line Inventory"
  },
  "component": {
    "componentNumber": "217520",
    "description": "3.5X119MM 2QZ BRIGADE 6MCA 050"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Insufficient inventory",
  "message": "Only 30 units available in source location",
  "available": 30,
  "requested": 50
}
```

**Best Practices:**
- Always verify sufficient quantity before transfer
- Include work order or batch numbers in notes
- Use barcode scanning to ensure accuracy
- Implement real-time quantity validation

### Consume Items
```http
POST /api/transactions/consume
Content-Type: application/json

{
  "componentId": 1,
  "locationId": 2,
  "quantity": 10,
  "notes": "Used in production batch #B2024001, work order WO-12345"
}
```

**Success Response (201 Created):**
```json
{
  "id": 26,
  "componentId": 1,
  "fromLocationId": 2,
  "toLocationId": null,
  "quantity": 10,
  "type": "consume",
  "notes": "Used in production batch #B2024001, work order WO-12345",
  "userId": 3,
  "createdAt": "2024-01-01T17:15:00Z",
  "fromLocation": {
    "name": "Line Inventory"
  },
  "component": {
    "componentNumber": "217520",
    "description": "3.5X119MM 2QZ BRIGADE 6MCA 050"
  }
}
```

**Consumption Tracking Tips:**
- Record consumption immediately after use
- Include production batch or work order information
- Track waste separately with appropriate notes
- Review consumption patterns for forecasting

### Get Transaction History
```http
GET /api/transactions
```

**Query Parameters:**
- `componentId` (number): Filter by component
- `locationId` (number): Filter by location (from or to)
- `type` (string): Filter by transaction type (transfer, consume, add, adjust)
- `userId` (number): Filter by user who performed action
- `startDate` (string): ISO date string for date range
- `endDate` (string): ISO date string for date range
- `limit` (number): Limit results (default: 100)
- `offset` (number): Pagination offset

**Example Request:**
```http
GET /api/transactions?type=consume&startDate=2024-01-01&endDate=2024-01-31&limit=50
```

**Success Response (200 OK):**
```json
[
  {
    "id": 26,
    "componentId": 1,
    "fromLocationId": 2,
    "toLocationId": null,
    "quantity": 10,
    "type": "consume",
    "notes": "Used in production batch #B2024001",
    "userId": 3,
    "createdAt": "2024-01-01T17:15:00Z",
    "user": {
      "username": "john.doe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050"
    },
    "fromLocation": {
      "name": "Line Inventory"
    }
  }
]
```

### Get Consumed Items Report
```http
GET /api/transactions/consumed
```

**Query Parameters:**
- `startDate` (string): Start of reporting period
- `endDate` (string): End of reporting period
- `componentId` (number): Specific component filter
- `locationId` (number): Specific location filter

**Success Response (200 OK):**
```json
[
  {
    "id": 26,
    "componentId": 1,
    "quantity": 10,
    "type": "consume",
    "notes": "Used in production batch #B2024001",
    "createdAt": "2024-01-01T17:15:00Z",
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
      "category": "Hardware",
      "unitPrice": "15.99"
    },
    "location": {
      "name": "Line Inventory",
      "facilityId": 1
    },
    "costValue": 159.90
  }
]
```

**Reporting Features:**
- Calculate total consumption cost
- Group by component, location, or time period
- Export data for external analysis
- Track consumption trends and patterns

## Locations

Location endpoints manage the physical storage areas within facilities.

### List All Locations
```http
GET /api/locations
```

**Query Parameters:**
- `facilityId` (number): Filter by specific facility
- `active` (boolean): Filter by active status
- `type` (string): Filter by location type

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "facilityId": 1,
    "name": "Main Inventory",
    "description": "Central storage warehouse",
    "locationType": "main",
    "isActive": true,
    "facility": {
      "id": 1,
      "name": "KC Foam",
      "code": "WDBG-KCF"
    }
  },
  {
    "id": 2,
    "facilityId": 1,
    "name": "Line Inventory",
    "description": "Production line stock",
    "locationType": "line",
    "isActive": true,
    "facility": {
      "id": 1,
      "name": "KC Foam",
      "code": "WDBG-KCF"
    }
  }
]
```

**Location Types:**
- `main`: Primary storage area
- `line`: Production line inventory
- `staging`: Temporary holding area
- `shipping`: Outbound dock area
- `receiving`: Inbound dock area
- `quality`: Quality control holding

### Get Locations by Facility
```http
GET /api/locations?facilityId=1
```

### Create Location
```http
POST /api/locations
Content-Type: application/json

{
  "facilityId": 1,
  "name": "Staging Area B",
  "description": "Secondary staging for large components",
  "locationType": "staging"
}
```

**Success Response (201 Created):**
```json
{
  "id": 5,
  "facilityId": 1,
  "name": "Staging Area B",
  "description": "Secondary staging for large components",
  "locationType": "staging",
  "isActive": true,
  "createdAt": "2024-01-01T18:00:00Z"
}
```

## Facilities

Facility endpoints manage the physical sites and organizational structure.

### List All Facilities
```http
GET /api/facilities
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "KC Foam",
    "code": "WDBG-KCF",
    "address": "123 Industrial Boulevard",
    "city": "Kansas City",
    "state": "MO",
    "postalCode": "64101",
    "country": "USA",
    "contactPhone": "+1-816-555-0123",
    "contactEmail": "kcfoam@company.com",
    "isActive": true,
    "createdAt": "2024-01-01T08:00:00Z"
  }
]
```

### Create Facility
```http
POST /api/facilities
Content-Type: application/json

{
  "name": "New Manufacturing Plant",
  "code": "NMP-001",
  "address": "456 Manufacturing Drive",
  "city": "Springfield",
  "state": "IL",
  "postalCode": "62701",
  "country": "USA",
  "contactPhone": "+1-217-555-0456",
  "contactEmail": "springfield@company.com"
}
```

**Success Response (201 Created):**
```json
{
  "id": 2,
  "name": "New Manufacturing Plant",
  "code": "NMP-001",
  "address": "456 Manufacturing Drive",
  "city": "Springfield",
  "state": "IL",
  "postalCode": "62701",
  "country": "USA",
  "contactPhone": "+1-217-555-0456",
  "contactEmail": "springfield@company.com",
  "isActive": true,
  "createdAt": "2024-01-01T19:00:00Z"
}
```

## Dashboard

Dashboard endpoints provide summary statistics and activity feeds for the overview interface.

### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

**Success Response (200 OK):**
```json
{
  "totalComponents": 155,
  "mainInventoryTotal": 1250,
  "lineInventoryTotal": 350,
  "lowStockAlerts": 2,
  "totalFacilities": 1,
  "totalLocations": 2,
  "todayTransactions": 8,
  "totalInventoryValue": 45230.50,
  "topCategories": [
    {
      "category": "Hardware",
      "count": 85,
      "percentage": 54.8
    },
    {
      "category": "Electronics",
      "count": 45,
      "percentage": 29.0
    }
  ]
}
```

**Metrics Explanation:**
- `totalComponents`: Total number of unique components
- `mainInventoryTotal`: Total quantity in main storage
- `lineInventoryTotal`: Total quantity in production areas
- `lowStockAlerts`: Number of items below threshold
- `totalInventoryValue`: Sum of (quantity × unit price) for all items

### Get Recent Activity
```http
GET /api/dashboard/recent-activity
```

**Query Parameters:**
- `limit` (number): Number of recent activities (default: 10)
- `hours` (number): Look back period in hours (default: 24)

**Success Response (200 OK):**
```json
[
  {
    "id": 26,
    "componentId": 1,
    "fromLocationId": 2,
    "toLocationId": null,
    "quantity": 10,
    "type": "consume",
    "createdAt": "2024-01-01T17:15:00Z",
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050"
    },
    "fromLocation": {
      "name": "Line Inventory"
    },
    "user": {
      "username": "john.doe",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

## Admin Endpoints

*Note: Admin endpoints require admin role permissions*

### User Management

#### List Users
```http
GET /api/admin/users
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@wb-tracks.local",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T08:00:00Z",
    "lastLogin": "2024-01-01T12:00:00Z",
    "groupId": null
  },
  {
    "id": 2,
    "username": "john.doe",
    "email": "john@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T09:00:00Z",
    "lastLogin": "2024-01-01T16:00:00Z",
    "groupId": 1
  }
]
```

#### Create User
```http
POST /api/admin/users
Content-Type: application/json

{
  "username": "jane.smith",
  "email": "jane@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "TempPassword123!",
  "role": "user",
  "isActive": true,
  "groupId": 1
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Success Response (201 Created):**
```json
{
  "id": 4,
  "username": "jane.smith",
  "email": "jane@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "user",
  "isActive": true,
  "groupId": 1,
  "createdAt": "2024-01-01T20:00:00Z"
}
```

#### Update User
```http
PUT /api/admin/users/:id
Content-Type: application/json

{
  "username": "jane.smith.updated",
  "email": "jane.updated@company.com",
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "role": "user",
  "isActive": true,
  "groupId": 2
}
```

#### Delete User
```http
DELETE /api/admin/users/:id
```

**Success Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Response (409 Conflict):**
```json
{
  "error": "Cannot delete user with transaction history",
  "message": "User has performed inventory transactions"
}
```

### Group Management

#### List Groups
```http
GET /api/admin/groups
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Production",
    "description": "Production line workers and supervisors",
    "permissions": [
      "inventory:read",
      "inventory:transfer",
      "inventory:consume",
      "transactions:read"
    ],
    "userCount": 5,
    "createdAt": "2024-01-01T08:30:00Z"
  },
  {
    "id": 2,
    "name": "Shipping",
    "description": "Shipping and receiving department",
    "permissions": [
      "inventory:read",
      "inventory:transfer",
      "inventory:add",
      "transactions:read"
    ],
    "userCount": 3,
    "createdAt": "2024-01-01T08:45:00Z"
  }
]
```

**Permission Types:**
- `inventory:read`: View inventory items
- `inventory:write`: Create/update components
- `inventory:transfer`: Move items between locations
- `inventory:consume`: Record production consumption
- `inventory:add`: Add new inventory
- `transactions:read`: View transaction history
- `admin:users`: Manage user accounts
- `admin:groups`: Manage user groups

#### Create Group
```http
POST /api/admin/groups
Content-Type: application/json

{
  "name": "Quality Control",
  "description": "Quality control inspectors and managers",
  "permissions": [
    "inventory:read",
    "inventory:transfer",
    "transactions:read"
  ]
}
```

### Test Endpoints

#### Test Low Inventory Alert
```http
POST /api/admin/test-low-inventory
```

**Success Response (200 OK):**
```json
{
  "message": "Low inventory alert test sent",
  "alertsSent": 1,
  "timestamp": "2024-01-01T21:00:00Z"
}
```

#### Test Activity Notification
```http
POST /api/admin/test-activity
```

**Success Response (200 OK):**
```json
{
  "message": "Activity notification test sent",
  "timestamp": "2024-01-01T21:05:00Z"
}
```

## File Upload

### Upload Component Photo
```http
POST /api/components/:id/photos
Content-Type: multipart/form-data

file: <image file>
```

**File Requirements:**
- Maximum size: 5MB
- Supported formats: JPEG, PNG, GIF, WebP
- Recommended dimensions: 800x600 or higher

**Success Response (201 Created):**
```json
{
  "id": 1,
  "componentId": 1,
  "filename": "component-217520.jpg",
  "url": "/uploads/components/component-217520.jpg",
  "fileSize": 245760,
  "mimeType": "image/jpeg",
  "isPrimary": false,
  "createdAt": "2024-01-01T21:30:00Z"
}
```

### Delete Component Photo
```http
DELETE /api/components/photos/:photoId
```

### Set Primary Photo
```http
PUT /api/components/:componentId/photos/:photoId/primary
```

**Success Response (200 OK):**
```json
{
  "message": "Primary photo updated successfully",
  "photoId": 1
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and structured error messages.

### 400 Bad Request - Validation Errors
```json
{
  "error": "Validation failed",
  "message": "Request data does not meet requirements",
  "details": [
    {
      "field": "componentNumber",
      "message": "Component number is required",
      "code": "REQUIRED_FIELD"
    },
    {
      "field": "quantity",
      "message": "Quantity must be a positive number",
      "code": "INVALID_VALUE"
    }
  ],
  "timestamp": "2024-01-01T22:00:00Z"
}
```

### 401 Unauthorized - Authentication Required
```json
{
  "error": "Not authenticated",
  "message": "Valid session required to access this resource",
  "timestamp": "2024-01-01T22:00:00Z"
}
```

### 403 Forbidden - Insufficient Permissions
```json
{
  "error": "Insufficient permissions",
  "message": "Admin role required for this operation",
  "requiredRole": "admin",
  "userRole": "user",
  "timestamp": "2024-01-01T22:00:00Z"
}
```

### 404 Not Found - Resource Not Found
```json
{
  "error": "Resource not found",
  "message": "Component with ID 999 does not exist",
  "resourceType": "component",
  "resourceId": 999,
  "timestamp": "2024-01-01T22:00:00Z"
}
```

### 409 Conflict - Business Logic Error
```json
{
  "error": "Insufficient inventory",
  "message": "Cannot transfer 100 items when only 50 are available",
  "details": {
    "requested": 100,
    "available": 50,
    "componentId": 1,
    "locationId": 1
  },
  "timestamp": "2024-01-01T22:00:00Z"
}
```

### 422 Unprocessable Entity - Business Rule Violation
```json
{
  "error": "Business rule violation",
  "message": "Cannot transfer items to the same location",
  "rule": "DIFFERENT_LOCATIONS_REQUIRED",
  "timestamp": "2024-01-01T22:00:00Z"
}
```

### 429 Too Many Requests - Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 60,
  "limit": 100,
  "timeWindow": "1 minute",
  "timestamp": "2024-01-01T22:00:00Z"
}
```

### 500 Internal Server Error - Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "requestId": "req_123456789",
  "timestamp": "2024-01-01T22:00:00Z"
}
```

## Rate Limiting

API requests are subject to rate limiting to ensure system stability and fair usage.

### Rate Limit Headers

All responses include rate limit information in headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1640995200
X-RateLimit-RetryAfter: 60
```

### Rate Limit Configuration

| User Role | Endpoint Type | Limit | Time Window |
|-----------|---------------|-------|-------------|
| Standard  | Authentication | 5 requests | 1 minute |
| Standard  | General API | 100 requests | 1 minute |
| Standard  | Search | 200 requests | 1 minute |
| Admin     | General API | 200 requests | 1 minute |
| Admin     | Admin API | 50 requests | 1 minute |

### Best Practices for Rate Limiting

- **Implement retry logic** with exponential backoff
- **Cache frequently accessed data** to reduce API calls
- **Use efficient filtering** to reduce data transfer
- **Monitor rate limit headers** and adjust request patterns

## WebSocket Events

WB-Tracks supports real-time updates via WebSocket connection at `/ws`.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  console.log('Connected to WB-Tracks WebSocket');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleRealtimeUpdate(message);
};
```

### Events Sent to Client

#### Inventory Update
```json
{
  "type": "inventory:update",
  "data": {
    "componentId": 1,
    "locationId": 1,
    "quantity": 200,
    "previousQuantity": 250,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### Low Stock Alert
```json
{
  "type": "alert:low-stock",
  "data": {
    "componentId": 1,
    "locationId": 2,
    "quantity": 2,
    "threshold": 5,
    "alertLevel": "critical",
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050"
    },
    "timestamp": "2024-01-01T12:05:00Z"
  }
}
```

#### Transaction Created
```json
{
  "type": "transaction:created",
  "data": {
    "id": 25,
    "type": "transfer",
    "componentId": 1,
    "fromLocationId": 1,
    "toLocationId": 2,
    "quantity": 50,
    "userId": 3,
    "timestamp": "2024-01-01T12:10:00Z"
  }
}
```

#### User Activity
```json
{
  "type": "user:activity",
  "data": {
    "userId": 3,
    "action": "login",
    "timestamp": "2024-01-01T12:15:00Z"
  }
}
```

### WebSocket Best Practices

- **Implement reconnection logic** for network interruptions
- **Handle connection state** appropriately in UI
- **Filter events** based on user permissions
- **Throttle UI updates** for high-frequency events

## Integration Examples

### JavaScript/TypeScript Client

```typescript
// API client class
class WBTracksAPI {
  private baseURL = 'http://localhost:5000/api';
  
  async login(username: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  }
  
  async getInventory(filters: InventoryFilters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseURL}/inventory?${params}`, {
      credentials: 'include'
    });
    
    return response.json();
  }
  
  async transferInventory(transfer: TransferRequest) {
    const response = await fetch(`${this.baseURL}/transactions/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transfer)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Transfer failed');
    }
    
    return response.json();
  }
}
```

### React Hook Example

```typescript
// Custom hook for inventory management
function useInventory(locationId?: number) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const params = locationId ? `?locationId=${locationId}` : '';
        const response = await fetch(`/api/inventory${params}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch inventory');
        }
        
        const data = await response.json();
        setInventory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventory();
  }, [locationId]);
  
  return { inventory, loading, error };
}
```

### Python Client Example

```python
import requests
from typing import Dict, List, Optional

class WBTracksAPI:
    def __init__(self, base_url: str = "http://localhost:5000/api"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def login(self, username: str, password: str) -> Dict:
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={"username": username, "password": password}
        )
        response.raise_for_status()
        return response.json()
    
    def get_inventory(self, location_id: Optional[int] = None) -> List[Dict]:
        params = {"locationId": location_id} if location_id else {}
        response = self.session.get(f"{self.base_url}/inventory", params=params)
        response.raise_for_status()
        return response.json()
    
    def transfer_inventory(self, component_id: int, from_location: int, 
                          to_location: int, quantity: int, notes: str = "") -> Dict:
        data = {
            "componentId": component_id,
            "fromLocationId": from_location,
            "toLocationId": to_location,
            "quantity": quantity,
            "notes": notes
        }
        response = self.session.post(f"{self.base_url}/transactions/transfer", json=data)
        response.raise_for_status()
        return response.json()

# Usage example
api = WBTracksAPI()
api.login("admin", "admin123")
inventory = api.get_inventory(location_id=1)
```

This comprehensive API reference provides all the information needed to integrate with the WB-Tracks inventory management system, including practical examples, error handling patterns, and best practices for production use.

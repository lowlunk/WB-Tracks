
# WB-Tracks API Reference

This document provides detailed information about the WB-Tracks REST API endpoints.

## Base URL

All API endpoints are relative to your application's base URL:
```
https://your-domain.com/api
```

## Authentication

WB-Tracks uses session-based authentication. All requests must include cookies for authentication.

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T12:00:00.000Z"
}
```

#### Logout
```http
POST /api/auth/logout
```

#### Get Current User
```http
GET /api/auth/user
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T12:00:00.000Z"
}
```

## Components

### List All Components
```http
GET /api/components
```

**Response:**
```json
[
  {
    "id": 1,
    "componentNumber": "217520",
    "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
    "plateNumber": "PL-001",
    "category": "Hardware",
    "supplier": "Supplier Name",
    "unitPrice": "15.99",
    "notes": "Special handling required",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Component
```http
POST /api/components
Content-Type: application/json

{
  "componentNumber": "string",
  "description": "string",
  "plateNumber": "string",
  "category": "string",
  "supplier": "string",
  "unitPrice": "string",
  "notes": "string"
}
```

### Update Component
```http
PUT /api/components/:id
Content-Type: application/json

{
  "componentNumber": "string",
  "description": "string",
  "plateNumber": "string",
  "category": "string",
  "supplier": "string",
  "unitPrice": "string",
  "notes": "string"
}
```

### Delete Component
```http
DELETE /api/components/:id
```

### Search Components
```http
GET /api/components/search?q=search_term
```

## Component Photos

### Get Component Photos
```http
GET /api/components/:id/photos
```

**Response:**
```json
[
  {
    "id": 1,
    "componentId": 1,
    "filename": "component-1-photo-1.jpg",
    "url": "/uploads/components/component-1-photo-1.jpg",
    "isPrimary": true,
    "uploadedAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### Upload Component Photo
```http
POST /api/components/:id/photos
Content-Type: multipart/form-data

image: <image file>
```

**Response:**
```json
{
  "id": 1,
  "componentId": 1,
  "filename": "component-1-photo-1.jpg",
  "url": "/uploads/components/component-1-photo-1.jpg",
  "isPrimary": false,
  "uploadedAt": "2024-01-01T12:00:00.000Z"
}
```

### Set Primary Photo
```http
PUT /api/components/:componentId/photos/:photoId/primary
```

**Response:**
```json
{
  "message": "Primary photo updated successfully"
}
```

### Delete Component Photo
```http
DELETE /api/components/photos/:photoId
```

**Response:**
```json
{
  "message": "Photo deleted successfully"
}
```

## Inventory

### Get Inventory Items
```http
GET /api/inventory
```

**Query Parameters:**
- `locationId` (optional): Filter by location ID

**Response:**
```json
[
  {
    "id": 1,
    "componentId": 1,
    "locationId": 1,
    "quantity": 250,
    "minThreshold": 10,
    "maxThreshold": 500,
    "component": {
      "id": 1,
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
      "plateNumber": "PL-001"
    },
    "location": {
      "id": 1,
      "name": "Main Inventory",
      "facilityId": 1
    }
  }
]
```

### Get Inventory by Location
```http
GET /api/inventory?locationId=1
```

### Add Inventory
```http
POST /api/inventory
Content-Type: application/json

{
  "componentId": 1,
  "locationId": 1,
  "quantity": 100,
  "notes": "Initial stock"
}
```

### Update Inventory Quantity
```http
PUT /api/inventory
Content-Type: application/json

{
  "componentId": 1,
  "locationId": 1,
  "quantity": 150
}
```

### Get Low Stock Items
```http
GET /api/inventory/low-stock
```

**Response:**
```json
[
  {
    "id": 1,
    "componentId": 1,
    "locationId": 1,
    "quantity": 2,
    "minThreshold": 10,
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
      "plateNumber": "PL-001"
    },
    "location": {
      "name": "Line Inventory"
    }
  }
]
```

## Transactions

### Transfer Items
```http
POST /api/transactions/transfer
Content-Type: application/json

{
  "componentId": 1,
  "fromLocationId": 1,
  "toLocationId": 2,
  "quantity": 50,
  "notes": "Transfer to production line"
}
```

**Response:**
```json
{
  "id": 1,
  "componentId": 1,
  "fromLocationId": 1,
  "toLocationId": 2,
  "quantity": 50,
  "transactionType": "transfer",
  "notes": "Transfer to production line",
  "createdAt": "2024-01-01T12:00:00Z",
  "userId": 1
}
```

### Consume Items
```http
POST /api/transactions/consume
Content-Type: application/json

{
  "componentId": 1,
  "locationId": 2,
  "quantity": 10,
  "notes": "Used in production batch #123"
}
```

### Get Transaction History
```http
GET /api/transactions
```

### Get Recent Transactions
```http
GET /api/transactions/recent
```

**Response:**
```json
[
  {
    "id": 5,
    "componentId": 1,
    "fromLocationId": 1,
    "toLocationId": 2,
    "quantity": 50,
    "transactionType": "transfer",
    "notes": "Transfer to production line",
    "createdAt": "2024-01-01T12:00:00Z",
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
      "plateNumber": "PL-001"
    },
    "fromLocation": {
      "name": "Main Inventory"
    },
    "toLocation": {
      "name": "Line Inventory"
    },
    "user": {
      "username": "admin"
    }
  }
]
```

### Get Consumed Items
```http
GET /api/transactions/consumed
```

**Response:**
```json
[
  {
    "id": 3,
    "componentId": 1,
    "fromLocationId": 2,
    "quantity": 10,
    "transactionType": "consume",
    "notes": "Used in production batch #123",
    "createdAt": "2024-01-01T12:00:00Z",
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
      "plateNumber": "PL-001"
    },
    "fromLocation": {
      "name": "Line Inventory"
    }
  }
]
```

## Locations

### List All Locations
```http
GET /api/locations
```

**Response:**
```json
[
  {
    "id": 1,
    "facilityId": 1,
    "name": "Main Inventory",
    "description": "Central storage area",
    "locationType": "main",
    "isActive": true
  },
  {
    "id": 2,
    "facilityId": 1,
    "name": "Line Inventory",
    "description": "Production line stock",
    "locationType": "line",
    "isActive": true
  }
]
```

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
  "name": "Staging Area",
  "description": "Temporary storage",
  "locationType": "storage"
}
```

## Facilities

### List All Facilities
```http
GET /api/facilities
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "KC Foam",
    "code": "WDBG-KCF",
    "address": "123 Industrial Blvd",
    "city": "Kansas City",
    "state": "MO",
    "country": "USA",
    "contactEmail": "contact@kcfoam.com",
    "contactPhone": "+1-555-0123"
  }
]
```

### Create Facility
```http
POST /api/facilities
Content-Type: application/json

{
  "name": "New Facility",
  "code": "NF-001",
  "address": "456 Manufacturing St",
  "city": "Springfield",
  "state": "IL",
  "country": "USA",
  "contactEmail": "contact@newfacility.com",
  "contactPhone": "+1-555-0456"
}
```

## Dashboard

### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

**Response:**
```json
{
  "totalComponents": 155,
  "mainInventoryTotal": 1250,
  "lineInventoryTotal": 350,
  "lowStockAlerts": 2,
  "totalTransactions": 1024,
  "recentTransactions": 15
}
```

### Get Recent Activity
```http
GET /api/dashboard/recent-activity
```

**Response:**
```json
[
  {
    "id": 5,
    "componentId": 1,
    "fromLocationId": 1,
    "toLocationId": 2,
    "quantity": 50,
    "transactionType": "transfer",
    "createdAt": "2024-01-01T12:00:00Z",
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050",
      "plateNumber": "PL-001"
    },
    "fromLocation": {
      "name": "Main Inventory"
    },
    "toLocation": {
      "name": "Line Inventory"
    },
    "user": {
      "username": "admin"
    }
  }
]
```

## Admin Endpoints

*Note: Admin endpoints require admin role*

### User Management

#### List Users
```http
GET /api/admin/users
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "isActive": true,
    "lastLogin": "2024-01-01T12:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Create User
```http
POST /api/admin/users
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "firstName": "New",
  "lastName": "User",
  "password": "temporary123",
  "role": "user",
  "isActive": true
}
```

#### Update User
```http
PUT /api/admin/users/:id
Content-Type: application/json

{
  "username": "updateduser",
  "email": "updated@example.com",
  "firstName": "Updated",
  "lastName": "User",
  "role": "user",
  "isActive": true
}
```

#### Delete User
```http
DELETE /api/admin/users/:id
```

### Group Management

#### List Groups
```http
GET /api/admin/groups
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Shipping",
    "description": "Shipping department personnel",
    "permissions": ["inventory:read", "transactions:create"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Group
```http
POST /api/admin/groups
Content-Type: application/json

{
  "name": "Production",
  "description": "Production line workers",
  "permissions": ["inventory:read", "transactions:create", "consume:create"]
}
```

### Test Endpoints

#### Test Low Inventory Alert
```http
POST /api/admin/test-low-inventory
```

#### Test Activity Notification
```http
POST /api/admin/test-activity
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "componentNumber",
      "message": "Component number is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 413 Request Entity Too Large
```json
{
  "error": "File too large",
  "message": "Maximum file size is 5MB"
}
```

### 415 Unsupported Media Type
```json
{
  "error": "Unsupported file type",
  "message": "Only JPEG, PNG, and WebP images are supported"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

API requests are subject to rate limiting:
- **Standard users**: 100 requests per minute
- **Admin users**: 200 requests per minute
- **Burst limit**: 10 requests per second
- **File uploads**: 10 uploads per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Events

WB-Tracks supports real-time updates via WebSocket connection at `/ws`:

### Events Sent to Client

#### Inventory Update
```json
{
  "type": "inventory:update",
  "data": {
    "componentId": 1,
    "locationId": 1,
    "quantity": 200,
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
    "component": {
      "componentNumber": "217520",
      "description": "3.5X119MM 2QZ BRIGADE 6MCA 050"
    }
  }
}
```

#### Transaction Created
```json
{
  "type": "transaction:created",
  "data": {
    "id": 5,
    "transactionType": "transfer",
    "componentId": 1,
    "fromLocationId": 1,
    "toLocationId": 2,
    "quantity": 50,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### Photo Updated
```json
{
  "type": "photo:updated",
  "data": {
    "componentId": 1,
    "photoId": 1,
    "action": "uploaded|deleted|primary_set",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## File Upload Specifications

### Supported File Types
- **Images**: JPEG, PNG, WebP
- **Maximum Size**: 5MB per file
- **Maximum Files**: 10 photos per component

### Upload Requirements
- **Content-Type**: `multipart/form-data`
- **Field Name**: `image`
- **File Validation**: Automatic type and size validation
- **Storage**: Local file system with organized directory structure

### Image Processing
- **Automatic Optimization**: Images are optimized for web display
- **Thumbnail Generation**: Ready for future implementation
- **Unique Naming**: Automatic generation of unique filenames
- **URL Generation**: Automatic public URL assignment

## Data Types

### Component
```typescript
interface Component {
  id: number;
  componentNumber: string;
  description: string;
  plateNumber?: string;
  category?: string;
  supplier?: string;
  unitPrice?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ComponentPhoto
```typescript
interface ComponentPhoto {
  id: number;
  componentId: number;
  filename: string;
  url: string;
  isPrimary: boolean;
  uploadedAt: Date;
}
```

### InventoryItem
```typescript
interface InventoryItem {
  id: number;
  componentId: number;
  locationId: number;
  quantity: number;
  minThreshold?: number;
  maxThreshold?: number;
  component: Component;
  location: Location;
}
```

### Transaction
```typescript
interface Transaction {
  id: number;
  componentId: number;
  fromLocationId?: number;
  toLocationId?: number;
  quantity: number;
  transactionType: 'transfer' | 'consume' | 'add' | 'remove' | 'adjust';
  notes?: string;
  createdAt: Date;
  userId: number;
  component?: Component;
  fromLocation?: Location;
  toLocation?: Location;
  user?: User;
}
```

### User
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}
```

This API reference covers all available endpoints in the WB-Tracks system including the new photo management features and enhanced mobile support. For implementation examples and more detailed usage, refer to the main documentation.

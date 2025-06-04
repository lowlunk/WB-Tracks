
# WB-Tracks Technical Documentation

## System Overview

WB-Tracks is a production-grade inventory management system designed specifically for manufacturing environments. It addresses the critical need for real-time inventory tracking between main storage areas and production lines, providing complete visibility and control over component flows.

### Core Design Principles

**Real-time Data Consistency**: All inventory changes are immediately propagated to all connected clients through WebSocket connections, ensuring everyone sees the same data simultaneously.

**Manufacturing-focused Workflow**: The system distinguishes between inventory transfers (planned movements) and consumption (actual production usage), providing accurate costing and planning data.

**Mobile-first Design**: Optimized for tablets and smartphones used on manufacturing floors, with touch-friendly interfaces and camera-based barcode scanning.

**Audit Trail Completeness**: Every inventory movement is logged with timestamps, user information, and contextual notes for regulatory compliance and operational analysis.

## Architecture

### Technology Stack

**Frontend Architecture**:
- **React 18** with concurrent features for improved performance
- **TypeScript** for type safety and development efficiency
- **Vite** for fast development builds and optimized production bundles
- **Tailwind CSS** for utility-first responsive design
- **shadcn/ui** for accessible, customizable component library
- **TanStack Query v5** for server state management and caching
- **Wouter** for lightweight client-side routing

**Backend Architecture**:
- **Express.js** with TypeScript for robust API development
- **PostgreSQL** for ACID compliance and complex queries
- **Drizzle ORM** for type-safe database operations
- **WebSocket** for real-time communication
- **bcrypt** for secure password hashing
- **Session-based authentication** with secure cookie handling

**Development Tools**:
- **ESLint** and **Prettier** for code quality
- **Husky** for pre-commit hooks
- **Vite** for development server with hot reload
- **TypeScript** for compile-time error checking

### Project Structure

```
wb-tracks/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Base UI components (shadcn/ui)
│   │   │   ├── barcode-scanner.tsx     # Camera-based scanning
│   │   │   ├── component-table.tsx     # Inventory display
│   │   │   ├── transfer-modal.tsx      # Transfer operations
│   │   │   └── notification-system.tsx # Real-time alerts
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAuth.ts     # Authentication state
│   │   │   ├── useWebSocket.ts # Real-time connections
│   │   │   └── useNotifications.ts # Alert management
│   │   ├── lib/               # Utility functions
│   │   │   ├── queryClient.ts  # TanStack Query configuration
│   │   │   ├── utils.ts       # Common utilities
│   │   │   └── barcode-scanner.ts # Scanning logic
│   │   ├── pages/             # Application routes
│   │   │   ├── dashboard.tsx   # Main overview
│   │   │   ├── inventory.tsx   # Combined inventory view
│   │   │   ├── main-inventory.tsx # Main storage
│   │   │   ├── line-inventory.tsx # Production areas
│   │   │   ├── admin.tsx      # Administration
│   │   │   └── settings.tsx   # User preferences
│   │   ├── App.tsx            # Main application component
│   │   └── main.tsx           # Application entry point
├── server/                    # Backend Express application
│   ├── db.ts                  # Database connection setup
│   ├── routes.ts              # API endpoint definitions
│   ├── storage.ts             # Data access layer
│   ├── vite.ts                # Development server integration
│   └── index.ts               # Server entry point
├── shared/                    # Shared TypeScript definitions
│   └── schema.ts              # Database schema and types
├── .env.example               # Environment configuration template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── vite.config.ts             # Vite build configuration
```

## Database Design

### Schema Overview

The database uses a normalized design optimized for inventory operations and audit requirements:

```sql
-- Core user management
users (id, username, email, password_hash, role, group_id, created_at, last_login)
user_groups (id, name, description, permissions)

-- Organizational structure
facilities (id, name, code, address, contact_info, created_at)
inventory_locations (id, facility_id, name, location_type, is_active)

-- Inventory items and specifications
components (id, component_number, description, category, supplier, unit_price, notes)
component_photos (id, component_id, filename, url, is_primary)

-- Current inventory state
inventory_items (id, component_id, location_id, quantity, min_threshold, max_threshold)

-- Complete audit trail
inventory_transactions (
  id, transaction_type, component_id, from_location_id, to_location_id,
  quantity, notes, user_id, created_at
)

-- Session management
sessions (sid, sess, expire)
```

### Key Relationships and Constraints

**Hierarchical Organization**:
```sql
Facilities → Inventory Locations → Inventory Items → Components
```

**Transaction Integrity**:
- All inventory changes generate transaction records
- Foreign key constraints ensure data consistency
- Triggers maintain inventory quantity accuracy
- Audit trail preserves complete history

**Performance Optimizations**:
```sql
-- Indexes for fast lookups
CREATE INDEX idx_components_number ON components(component_number);
CREATE INDEX idx_inventory_location_component ON inventory_items(location_id, component_id);
CREATE INDEX idx_transactions_component_date ON inventory_transactions(component_id, created_at);
CREATE INDEX idx_transactions_user ON inventory_transactions(user_id);
```

### Database Configuration for Production

**Connection Pooling**:
```typescript
// Recommended pool settings for production
const poolConfig = {
  max: 20,        // Maximum connections
  min: 5,         // Minimum connections
  idle: 10000,    // Idle timeout (10 seconds)
  acquire: 30000, // Acquisition timeout (30 seconds)
  evict: 1000     // Eviction interval (1 second)
};
```

**Performance Tuning**:
```sql
-- PostgreSQL configuration recommendations
shared_buffers = 256MB          -- 25% of available RAM
effective_cache_size = 1GB      -- 75% of available RAM
work_mem = 4MB                  -- Per-operation memory
maintenance_work_mem = 64MB     -- Maintenance operations
```

## API Design

### RESTful Endpoints

**Authentication & Authorization**:
```typescript
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/user
```

**Component Management**:
```typescript
GET    /api/components              // List with filtering
POST   /api/components              // Create new component
GET    /api/components/:id          // Get specific component
PUT    /api/components/:id          // Update component
DELETE /api/components/:id          // Delete component
GET    /api/components/search       // Search components
```

**Inventory Operations**:
```typescript
GET  /api/inventory                 // Get all inventory items
GET  /api/inventory/location/:id    // Location-specific inventory
PUT  /api/inventory/quantity        // Update quantities
POST /api/inventory/transfer        // Transfer between locations
POST /api/inventory/add             // Add new inventory
POST /api/inventory/consume         // Record consumption
GET  /api/inventory/low-stock       // Get low stock alerts
```

**Transaction History**:
```typescript
GET /api/transactions               // All transactions with filtering
GET /api/transactions/recent        // Recent activity feed
GET /api/transactions/consumed      // Consumption history
GET /api/transactions/component/:id // Component-specific history
```

**Administrative Functions**:
```typescript
GET    /api/admin/users            // User management (admin only)
POST   /api/admin/users            // Create user (admin only)
PUT    /api/admin/users/:id        // Update user (admin only)
DELETE /api/admin/users/:id        // Delete user (admin only)
GET    /api/admin/groups           // Group management (admin only)
POST   /api/admin/groups           // Create group (admin only)
```

### API Response Standards

**Success Response Format**:
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_123456"
  }
}
```

**Error Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "quantity",
        "message": "Must be a positive number"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Rate Limiting & Security

**Rate Limiting Configuration**:
```typescript
const rateLimits = {
  auth: '5 requests per minute',      // Login attempts
  api: '100 requests per minute',     // General API calls
  search: '200 requests per minute',  // Search operations
  admin: '50 requests per minute'     // Administrative functions
};
```

**Security Headers**:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

## Frontend Architecture

### Component Architecture

**Page-level Components**:
Manage application routes and coordinate multiple features:
```typescript
// dashboard.tsx - Main overview page
const Dashboard = () => {
  const { data: stats } = useQuery(['/api/dashboard/stats']);
  const { data: activity } = useQuery(['/api/dashboard/recent-activity']);
  const { data: lowStock } = useQuery(['/api/inventory/low-stock']);
  
  return (
    <div className="dashboard-container">
      <StatsCards stats={stats} />
      <LowStockAlerts alerts={lowStock} />
      <RecentActivity activity={activity} />
    </div>
  );
};
```

**Feature Components**:
Handle specific functionality with proper state management:
```typescript
// transfer-modal.tsx - Inventory transfer operations
const TransferModal = ({ isOpen, onClose, componentId }) => {
  const [formData, setFormData] = useState(initialState);
  const transferMutation = useMutation({
    mutationFn: transferInventory,
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/inventory']);
      onClose();
    }
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <TransferForm
          data={formData}
          onChange={setFormData}
          onSubmit={transferMutation.mutate}
          loading={transferMutation.isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};
```

### State Management Strategy

**Server State with TanStack Query**:
```typescript
// Query key organization
const queryKeys = {
  components: ['/api/components'] as const,
  component: (id: number) => ['/api/components', id] as const,
  inventory: ['/api/inventory'] as const,
  inventoryByLocation: (locationId: number) => 
    ['/api/inventory', 'location', locationId] as const,
  transactions: ['/api/transactions'] as const,
  lowStock: ['/api/inventory/low-stock'] as const
};

// Custom hooks for data fetching
export const useComponents = () => {
  return useQuery({
    queryKey: queryKeys.components,
    queryFn: () => api.get('/api/components'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000    // 10 minutes
  });
};

export const useInventoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      queryClient.invalidateQueries({ queryKey: queryKeys.lowStock });
    }
  });
};
```

**Client State with React Context**:
```typescript
// Auth context for user state
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const login = async (credentials: LoginCredentials) => {
    const response = await api.post('/api/auth/login', credentials);
    setUser(response.data);
    return response.data;
  };
  
  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Real-time Updates

**WebSocket Implementation**:
```typescript
// useWebSocket hook for real-time updates
export const useWebSocket = () => {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/ws');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'inventory:update':
          queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
          break;
        case 'alert:low-stock':
          queryClient.invalidateQueries({ queryKey: queryKeys.lowStock });
          // Show notification
          toast.warning(`Low stock: ${message.data.componentName}`);
          break;
        case 'transaction:created':
          queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
          break;
      }
    };
    
    setSocket(ws);
    return () => ws.close();
  }, [queryClient]);
  
  return socket;
};
```

### Mobile Optimization

**Responsive Design Patterns**:
```typescript
// Mobile-first component design
const ComponentTable = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        {components.map(component => (
          <ComponentCard key={component.id} component={component} />
        ))}
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Component</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {components.map(component => (
          <ComponentRow key={component.id} component={component} />
        ))}
      </TableBody>
    </Table>
  );
};
```

**Touch-friendly Interactions**:
```css
/* Touch target sizing */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

/* Mobile navigation */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 8px;
}

/* Swipe gestures for actions */
.swipe-actions {
  touch-action: pan-x;
  overflow-x: hidden;
}
```

## Barcode Integration

### Camera-based Scanning

**Implementation Details**:
```typescript
// barcode-scanner.ts - Core scanning logic
export class BarcodeScanner {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private stream: MediaStream | null = null;
  
  async startScanning(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Use rear camera
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    
    this.video.srcObject = this.stream;
    this.video.play();
    
    // Start scanning loop
    this.scanFrame();
  }
  
  private scanFrame(): void {
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      const context = this.canvas.getContext('2d');
      context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      const imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const result = this.decodeBarcodeFromImageData(imageData);
      
      if (result) {
        this.onScanResult(result);
        return;
      }
    }
    
    requestAnimationFrame(() => this.scanFrame());
  }
  
  stopScanning(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}
```

**React Component Integration**:
```typescript
// barcode-scanner.tsx - React component
const BarcodeScanner = ({ onScan, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scanner = useRef<BarcodeScanner | null>(null);
  
  const startScanning = async () => {
    try {
      scanner.current = new BarcodeScanner(videoRef.current);
      scanner.current.onScanResult = (result) => {
        onScan(result);
        stopScanning();
      };
      
      await scanner.current.startScanning();
      setIsScanning(true);
    } catch (error) {
      onError(error);
    }
  };
  
  return (
    <div className="barcode-scanner">
      <video ref={videoRef} className="scanner-video" />
      <div className="scanner-overlay">
        <div className="scan-area" />
      </div>
      {!isScanning ? (
        <Button onClick={startScanning}>Start Scanning</Button>
      ) : (
        <Button onClick={stopScanning}>Stop Scanning</Button>
      )}
    </div>
  );
};
```

### Label Generation

**SVG-based Barcode Generation**:
```typescript
// barcode-generator.ts
export const generateBarcode = (data: string, format: BarcodeFormat): string => {
  const barcodeData = encodeBarcodeData(data, format);
  
  const svg = `
    <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
      <g>
        ${barcodeData.bars.map((bar, index) => 
          `<rect x="${index * 2}" y="10" width="${bar.width}" height="60" 
                 fill="${bar.color}" />`
        ).join('')}
        <text x="150" y="85" text-anchor="middle" font-family="monospace" font-size="12">
          ${data}
        </text>
      </g>
    </svg>
  `;
  
  return svg;
};

// Label printing component
const BarcodeLabelPrinter = ({ component, onPrint }) => {
  const [labelConfig, setLabelConfig] = useState({
    format: 'CODE128',
    size: 'standard',
    includeQR: false,
    quantity: 1
  });
  
  const generateLabel = () => {
    const barcode = generateBarcode(component.componentNumber, labelConfig.format);
    const qrCode = labelConfig.includeQR ? 
      generateQRCode(JSON.stringify({
        number: component.componentNumber,
        description: component.description,
        category: component.category
      })) : null;
    
    return createPrintableLabel(barcode, qrCode, component, labelConfig);
  };
  
  return (
    <div className="label-printer">
      <LabelConfiguration config={labelConfig} onChange={setLabelConfig} />
      <LabelPreview label={generateLabel()} />
      <Button onClick={() => onPrint(generateLabel())}>
        Print {labelConfig.quantity} Label{labelConfig.quantity > 1 ? 's' : ''}
      </Button>
    </div>
  );
};
```

## Performance Optimization

### Database Optimization

**Query Optimization Strategies**:
```sql
-- Optimized inventory query with proper joins
SELECT 
  ii.id,
  ii.quantity,
  c.component_number,
  c.description,
  l.name as location_name,
  f.name as facility_name
FROM inventory_items ii
JOIN components c ON ii.component_id = c.id
JOIN inventory_locations l ON ii.location_id = l.id
JOIN facilities f ON l.facility_id = f.id
WHERE ii.quantity < ii.min_threshold
ORDER BY c.component_number;

-- Index for fast low stock queries
CREATE INDEX idx_inventory_low_stock ON inventory_items(quantity, min_threshold) 
WHERE quantity < min_threshold;
```

**Connection Pool Management**:
```typescript
// Database connection optimization
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout connection attempts after 2s
});

// Connection health monitoring
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('Database health check failed:', error);
  }
}, 60000); // Check every minute
```

### Frontend Performance

**Bundle Optimization**:
```typescript
// vite.config.ts - Build optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          query: ['@tanstack/react-query'],
          utils: ['date-fns', 'clsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query']
  }
});
```

**Component Optimization**:
```typescript
// Memoization for expensive computations
const InventoryTable = memo(({ items, filters }) => {
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      return (!filters.location || item.locationId === filters.location) &&
             (!filters.lowStock || item.quantity < item.minThreshold) &&
             (!filters.search || item.component.description.toLowerCase()
               .includes(filters.search.toLowerCase()));
    });
  }, [items, filters]);
  
  return (
    <Table>
      {filteredItems.map(item => (
        <InventoryRow key={item.id} item={item} />
      ))}
    </Table>
  );
});

// Virtual scrolling for large datasets
const VirtualizedInventoryList = ({ items }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={80}
      itemData={items}
    >
      {({ index, style, data }) => (
        <div style={style}>
          <InventoryCard item={data[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### Caching Strategy

**Server-side Caching**:
```typescript
// Redis caching for frequently accessed data
const cache = new Redis(process.env.REDIS_URL);

const getCachedData = async (key: string, fetchFn: () => Promise<any>, ttl = 300) => {
  const cached = await cache.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetchFn();
  await cache.setex(key, ttl, JSON.stringify(data));
  return data;
};

// Cache inventory data with invalidation
app.get('/api/inventory', async (req, res) => {
  const cacheKey = `inventory:${req.query.locationId || 'all'}`;
  
  const data = await getCachedData(cacheKey, async () => {
    return await getInventoryItems(req.query);
  }, 60); // Cache for 1 minute
  
  res.json(data);
});

// Invalidate cache on inventory updates
const invalidateInventoryCache = async () => {
  const keys = await cache.keys('inventory:*');
  if (keys.length > 0) {
    await cache.del(...keys);
  }
};
```

**Client-side Caching**:
```typescript
// TanStack Query caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,      // 10 minutes
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status !== 404;
      }
    },
    mutations: {
      retry: 1
    }
  }
});
```

## Security Implementation

### Authentication & Authorization

**Session Management**:
```typescript
// Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new PgSession({
    pool: db.pool,
    tableName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  }
}));

// Role-based middleware
const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

**Input Validation**:
```typescript
// Zod schemas for input validation
const CreateComponentSchema = z.object({
  componentNumber: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  category: z.string().optional(),
  supplier: z.string().optional(),
  unitPrice: z.string().optional(),
  notes: z.string().optional()
});

const TransferRequestSchema = z.object({
  componentId: z.number().int().positive(),
  fromLocationId: z.number().int().positive(),
  toLocationId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  notes: z.string().optional()
});

// Validation middleware
const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.issues
      });
    }
  };
};
```

### Data Protection

**SQL Injection Prevention**:
```typescript
// Parameterized queries with Drizzle ORM
const getComponentsByCategory = async (category: string) => {
  return await db
    .select()
    .from(components)
    .where(eq(components.category, category)); // Automatically parameterized
};

// Raw query protection (when needed)
const rawQuery = async (userInput: string) => {
  // Validate and sanitize input
  const sanitized = userInput.replace(/[^a-zA-Z0-9\s]/g, '');
  
  return await db.execute(
    sql`SELECT * FROM components WHERE description LIKE ${`%${sanitized}%`}`
  );
};
```

**XSS Prevention**:
```typescript
// Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// Output encoding in React (automatic)
const ComponentDescription = ({ description }) => {
  // React automatically escapes string content
  return <p>{description}</p>;
};

// Manual sanitization when needed
import DOMPurify from 'dompurify';

const SanitizedContent = ({ htmlContent }) => {
  const clean = DOMPurify.sanitize(htmlContent);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
};
```

## Deployment Architecture

### Production Environment Setup

**Environment Configuration**:
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/wb_tracks
SESSION_SECRET=your-secure-session-secret-32-characters
REDIS_URL=redis://localhost:6379
PORT=5000
HOST=0.0.0.0

# Security settings
SECURE_COOKIES=true
TRUST_PROXY=true
RATE_LIMIT_ENABLED=true

# Feature flags
BARCODE_SCANNING_ENABLED=true
WEBSOCKET_ENABLED=true
FILE_UPLOAD_ENABLED=true
```

**Docker Configuration**:
```dockerfile
# Dockerfile for production deployment
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 5000
CMD ["npm", "start"]
```

**Replit Deployment Configuration**:
```yaml
# app.yaml for Replit deployment
name: wb-tracks
services:
- name: web
  source_dir: .
  github:
    repo: your-username/wb-tracks
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_variables:
  - key: NODE_ENV
    value: production
  - key: SESSION_SECRET
    value: your-session-secret
  instance_type: basic
  instance_count: 1
  
databases:
- name: wb-tracks-db
  engine: PG
  version: "14"
  size: basic
  
static_sites:
- name: wb-tracks-assets
  source_dir: dist/assets
  catchall_document: index.html
```

### Monitoring & Logging

**Application Monitoring**:
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);
    
    // Check Redis connection (if used)
    if (cache) {
      await cache.ping();
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`
    );
  });
  
  next();
});
```

**Error Tracking**:
```typescript
// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  
  // Log error details
  console.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.session?.userId,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id
  });
});
```

### Backup & Recovery

**Database Backup Strategy**:
```bash
#!/bin/bash
# backup.sh - Automated database backup script

BACKUP_DIR="/backups"
DB_NAME="wb_tracks"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/wb_tracks_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

**Recovery Procedures**:
```bash
# Database restoration
psql $DATABASE_URL < backup_file.sql

# Application recovery checklist
# 1. Verify database connectivity
# 2. Check environment variables
# 3. Restart application services
# 4. Verify WebSocket connections
# 5. Test barcode scanning functionality
# 6. Validate user authentication
```

## Integration Capabilities

### ERP System Integration

**API Integration Patterns**:
```typescript
// External API adapter
class ERPAdapter {
  constructor(private config: ERPConfig) {}
  
  async syncComponents(): Promise<void> {
    const erpComponents = await this.fetchFromERP('/api/items');
    
    for (const erpItem of erpComponents) {
      const component = await this.mapERPToComponent(erpItem);
      await this.upsertComponent(component);
    }
  }
  
  async pushInventoryUpdates(transactions: Transaction[]): Promise<void> {
    const erpTransactions = transactions.map(this.mapToERPTransaction);
    await this.postToERP('/api/inventory-movements', erpTransactions);
  }
  
  private mapERPToComponent(erpItem: ERPItem): Component {
    return {
      componentNumber: erpItem.item_code,
      description: erpItem.description,
      category: erpItem.category,
      supplier: erpItem.vendor,
      unitPrice: erpItem.standard_rate.toString()
    };
  }
}
```

**Webhook Integration**:
```typescript
// Webhook endpoint for external system notifications
app.post('/api/webhooks/erp', (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'item.created':
      handleNewERPItem(data);
      break;
    case 'item.updated':
      handleUpdatedERPItem(data);
      break;
    case 'purchase_order.received':
      handleNewInventory(data);
      break;
  }
  
  res.json({ status: 'processed' });
});
```

### Reporting & Analytics

**Custom Report Generation**:
```typescript
// Report service for advanced analytics
class ReportService {
  async generateConsumptionReport(params: ReportParams): Promise<ConsumptionReport> {
    const transactions = await this.getConsumptionData(params);
    
    return {
      period: params.period,
      totalConsumption: this.calculateTotalConsumption(transactions),
      topComponents: this.getTopConsumedComponents(transactions),
      trends: this.analyzeTrends(transactions),
      recommendations: this.generateRecommendations(transactions)
    };
  }
  
  async generateInventoryValuation(): Promise<ValuationReport> {
    const inventory = await this.getCurrentInventory();
    
    return {
      totalValue: this.calculateTotalValue(inventory),
      valueByLocation: this.groupByLocation(inventory),
      slowMovingItems: this.identifySlowMovingItems(inventory),
      obsoleteItems: this.identifyObsoleteItems(inventory)
    };
  }
  
  async exportToExcel(reportData: any): Promise<Buffer> {
    // Excel generation logic
    return this.createExcelWorkbook(reportData);
  }
}
```

### Third-party Integrations

**Barcode Service Integration**:
```typescript
// External barcode service adapter
class BarcodeServiceAdapter {
  async generateBarcodes(components: Component[]): Promise<BarcodeResult[]> {
    const requests = components.map(component => ({
      data: component.componentNumber,
      format: 'CODE128',
      width: 300,
      height: 100
    }));
    
    const response = await fetch('/api/external/barcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requests)
    });
    
    return response.json();
  }
}
```

## Maintenance & Operations

### Routine Maintenance Tasks

**Daily Operations**:
```bash
#!/bin/bash
# daily_maintenance.sh

# Check application health
curl -f http://localhost:5000/health || echo "Health check failed"

# Monitor disk space
df -h | awk '$5 > 80 {print "High disk usage: " $0}'

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;" || echo "DB connection failed"

# Backup database
./backup.sh

# Clean up old logs
find /var/log/wb-tracks -name "*.log" -mtime +7 -delete
```

**Weekly Maintenance**:
```sql
-- database_maintenance.sql
-- Vacuum and analyze tables
VACUUM ANALYZE inventory_transactions;
VACUUM ANALYZE inventory_items;
VACUUM ANALYZE components;

-- Update table statistics
ANALYZE;

-- Check for unused indexes
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0;

-- Monitor query performance
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Monthly Reviews**:
```typescript
// Monthly system review checklist
const monthlyReview = {
  performance: [
    'Review slow query logs',
    'Analyze database growth patterns',
    'Check memory usage trends',
    'Monitor API response times'
  ],
  security: [
    'Review user access permissions',
    'Check failed login attempts',
    'Update dependencies for security patches',
    'Verify backup integrity'
  ],
  data: [
    'Clean up old transaction logs',
    'Archive historical data',
    'Verify data consistency',
    'Update inventory thresholds'
  ]
};
```

### Troubleshooting Procedures

**Common Issue Resolution**:
```typescript
// Diagnostic utilities
class DiagnosticTools {
  static async checkDatabaseConnectivity(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error('Database connectivity check failed:', error);
      return false;
    }
  }
  
  static async validateDataIntegrity(): Promise<IntegrityReport> {
    const issues = [];
    
    // Check for orphaned inventory items
    const orphanedItems = await db
      .select()
      .from(inventoryItems)
      .leftJoin(components, eq(inventoryItems.componentId, components.id))
      .where(isNull(components.id));
    
    if (orphanedItems.length > 0) {
      issues.push(`Found ${orphanedItems.length} orphaned inventory items`);
    }
    
    // Check for negative quantities
    const negativeQuantities = await db
      .select()
      .from(inventoryItems)
      .where(lt(inventoryItems.quantity, 0));
    
    if (negativeQuantities.length > 0) {
      issues.push(`Found ${negativeQuantities.length} items with negative quantities`);
    }
    
    return { issues, isHealthy: issues.length === 0 };
  }
  
  static async repairDataInconsistencies(): Promise<void> {
    // Remove orphaned records
    await db
      .delete(inventoryItems)
      .where(notExists(
        db.select().from(components).where(eq(components.id, inventoryItems.componentId))
      ));
    
    // Fix negative quantities
    await db
      .update(inventoryItems)
      .set({ quantity: 0 })
      .where(lt(inventoryItems.quantity, 0));
  }
}
```

### Performance Monitoring

**Real-time Metrics Collection**:
```typescript
// Metrics collection service
class MetricsCollector {
  private metrics = new Map<string, number>();
  
  recordAPICall(endpoint: string, duration: number): void {
    const key = `api.${endpoint}.duration`;
    this.updateMetric(key, duration);
  }
  
  recordDatabaseQuery(query: string, duration: number): void {
    const key = `db.query.duration`;
    this.updateMetric(key, duration);
  }
  
  recordWebSocketConnection(): void {
    this.incrementMetric('websocket.connections');
  }
  
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
  
  private updateMetric(key: string, value: number): void {
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, (current + value) / 2); // Running average
  }
  
  private incrementMetric(key: string): void {
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
  }
}

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  const metrics = metricsCollector.getMetrics();
  res.json({
    ...metrics,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

This technical documentation provides comprehensive coverage of the WB-Tracks system architecture, implementation details, and operational procedures. It serves as a complete reference for developers, administrators, and technical staff responsible for maintaining and extending the system.

import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertComponentSchema, insertFacilitySchema, insertUserGroupSchema, transferItemSchema, insertInventoryTransactionSchema, loginSchema, registerSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import express from "express";

// Session configuration
const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const pgStore = connectPg(session);

// Middleware for checking authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'components');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  // Only use secure cookies for external hosted domains (like replit.app), not for local networks
  const isExternallyHosted = process.env.REPLIT_DOMAINS?.includes('.replit.app') || 
                            process.env.NODE_ENV === 'production';
  
  console.log('Environment check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);
  console.log('isExternallyHosted:', isExternallyHosted);
  console.log('Will use secure cookies:', isExternallyHosted);
  
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'wb-tracks-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production (HTTPS)
      maxAge: sessionTtl,
      sameSite: 'lax',
      domain: undefined, // Let browser handle domain
    },
  }));

  // Initialize default data
  await storage.initializeDefaultData();

  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Get user from database
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // For demo credentials, check hardcoded passwords
      let validPassword = false;
      if ((username === 'admin' && password === 'admin123') || 
          (username === 'user' && password === 'user123')) {
        validPassword = true;
      } else if (user.password) {
        // For other users, check hashed password
        validPassword = await bcrypt.compare(password, user.password);
      }

      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user) {
        return res.status(401).json({ message: "Authentication failed" });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      // Set session and save it explicitly
      console.log('Login - Setting userId in session:', user.id);
      console.log('Login - Session before:', (req as any).session);
      (req as any).session.userId = user.id;
      console.log('Login - Session after setting userId:', (req as any).session);
      
      // Force session save before responding
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log('Login - Session saved successfully');
        console.log('Login - Final session state:', (req as any).session);
        
        res.json({ 
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLogin: new Date().toISOString()
          }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/logout", async (req, res) => {
    try {
      (req as any).session.destroy((err: any) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      console.log("Session check - sessionID:", (req as any).sessionID);
      console.log("Session check - session:", (req as any).session);
      console.log("Session check - userId:", (req as any).session?.userId);
      
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        console.log("No userId in session");
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      
      if (!user || !user.isActive) {
        console.log("User not found or inactive:", user);
        return res.status(401).json({ message: "User not found or inactive" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Set session
      (req.session as any).userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });



  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Dashboard API routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/recent-activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Component API routes
  app.get("/api/components", async (req, res) => {
    try {
      const query = req.query.search as string;
      
      if (query) {
        const components = await storage.searchComponents(query);
        res.json(components);
      } else {
        const components = await storage.getAllComponents();
        res.json(components);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch components" });
    }
  });

  app.get("/api/components/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const component = await storage.getComponent(id);
      
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }
      
      res.json(component);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch component" });
    }
  });

  app.post("/api/components", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const validatedData = insertComponentSchema.parse(req.body);
      const component = await storage.createComponent(validatedData, userId);
      res.status(201).json(component);
    } catch (error) {
      res.status(400).json({ message: "Invalid component data" });
    }
  });

  // Component photo routes
  app.get("/api/components/:id/photos", async (req, res) => {
    try {
      const componentId = parseInt(req.params.id);
      const photos = await storage.getComponentPhotos(componentId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching component photos:", error);
      res.status(500).json({ message: "Failed to fetch component photos" });
    }
  });

  app.post("/api/components/:id/photos", requireAuth, upload.single('image'), async (req, res) => {
    try {
      const componentId = parseInt(req.params.id);
      const userId = (req.session as any).userId;
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = `/uploads/components/${req.file.filename}`;
      const caption = req.body.caption || '';

      const photo = await storage.uploadComponentPhoto({
        componentId,
        imageUrl,
        caption,
        uploadedBy: userId,
      });

      res.json(photo);
    } catch (error) {
      console.error("Error uploading component photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  app.delete("/api/components/:id/photos/:photoId", requireAuth, async (req, res) => {
    try {
      const photoId = parseInt(req.params.photoId);
      await storage.deleteComponentPhoto(photoId);
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting component photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  app.put("/api/components/:id/photos/:photoId/primary", requireAuth, async (req, res) => {
    try {
      const componentId = parseInt(req.params.id);
      const photoId = parseInt(req.params.photoId);
      await storage.setPrimaryPhoto(componentId, photoId);
      res.json({ message: "Primary photo updated successfully" });
    } catch (error) {
      console.error("Error setting primary photo:", error);
      res.status(500).json({ message: "Failed to set primary photo" });
    }
  });

  app.put("/api/components/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertComponentSchema.partial().parse(req.body);
      const component = await storage.updateComponent(id, validatedData);
      res.json(component);
    } catch (error) {
      res.status(400).json({ message: "Failed to update component" });
    }
  });

  app.delete("/api/components/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteComponent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete component" });
    }
  });

  // Facility API routes
  app.get("/api/facilities", async (req, res) => {
    try {
      const facilities = await storage.getAllFacilities();
      res.json(facilities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.get("/api/facilities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const facility = await storage.getFacility(id);
      
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }
      
      res.json(facility);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch facility" });
    }
  });

  app.post("/api/facilities", async (req, res) => {
    try {
      const validatedData = insertFacilitySchema.parse(req.body);
      const facility = await storage.createFacility(validatedData);
      res.status(201).json(facility);
    } catch (error) {
      res.status(400).json({ message: "Invalid facility data" });
    }
  });

  app.put("/api/facilities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFacilitySchema.partial().parse(req.body);
      const facility = await storage.updateFacility(id, validatedData);
      res.json(facility);
    } catch (error) {
      res.status(400).json({ message: "Invalid facility data" });
    }
  });

  app.delete("/api/facilities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFacility(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete facility" });
    }
  });

  // Location API routes
  app.get("/api/locations", async (req, res) => {
    try {
      const facilityId = req.query.facilityId as string;
      
      if (facilityId) {
        const locations = await storage.getLocationsByFacility(parseInt(facilityId));
        res.json(locations);
      } else {
        const locations = await storage.getAllLocations();
        res.json(locations);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // Inventory API routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const locationId = req.query.locationId as string;
      
      if (locationId) {
        const inventory = await storage.getInventoryByLocation(parseInt(locationId));
        res.json(inventory);
      } else {
        const inventory = await storage.getAllInventoryItems();
        res.json(inventory);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.put("/api/inventory/:componentId/:locationId", async (req, res) => {
    try {
      const componentId = parseInt(req.params.componentId);
      const locationId = parseInt(req.params.locationId);
      const { quantity } = req.body;
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const updatedItem = await storage.updateInventoryQuantity(componentId, locationId, quantity);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory" });
    }
  });

  // Transaction API routes
  app.post("/api/transactions/transfer", async (req, res) => {
    try {
      const validatedData = transferItemSchema.parse(req.body);
      const transaction = await storage.transferItems(validatedData);
      
      // Broadcast transfer event via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'INVENTORY_UPDATED',
            data: { transactionId: transaction.id, type: 'transfer' }
          }));
        }
      });
      
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Transfer failed" });
    }
  });

  app.post("/api/transactions/add", async (req, res) => {
    try {
      const { componentId, locationId, quantity, notes } = req.body;
      
      if (!componentId || !locationId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid transaction data" });
      }
      
      const transaction = await storage.addItemsToInventory(componentId, locationId, quantity, notes);
      
      // Broadcast add event via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'INVENTORY_UPDATED',
            data: { transactionId: transaction.id, type: 'add' }
          }));
        }
      });
      
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Add transaction failed" });
    }
  });

  app.post("/api/transactions/consume", async (req, res) => {
    try {
      const { consumeItemSchema } = await import("@shared/schema");
      const validatedData = consumeItemSchema.parse(req.body);
      const transaction = await storage.consumeItems(validatedData);
      
      // Broadcast consume event via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'INVENTORY_UPDATED',
            data: { transactionId: transaction.id, type: 'consume' }
          }));
        }
      });
      
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Consume transaction failed" });
    }
  });

  // Get consumed transactions for tracking
  app.get("/api/transactions/consumed", async (req, res) => {
    try {
      const consumedTransactions = await storage.getConsumedTransactions();
      res.json(consumedTransactions);
    } catch (error) {
      console.error("Error fetching consumed transactions:", error);
      res.status(500).json({ message: "Failed to fetch consumed transactions" });
    }
  });

  app.post("/api/transactions/remove", async (req, res) => {
    try {
      const { componentId, locationId, quantity, notes } = req.body;
      
      if (!componentId || !locationId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid transaction data" });
      }
      
      const transaction = await storage.removeItemsFromInventory(componentId, locationId, quantity, notes);
      
      // Broadcast remove event via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'INVENTORY_UPDATED',
            data: { transactionId: transaction.id, type: 'remove' }
          }));
        }
      });
      
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Remove transaction failed" });
    }
  });

  // Barcode scanning endpoint
  app.post("/api/barcode/lookup", async (req, res) => {
    try {
      const { barcode } = req.body;
      
      if (!barcode) {
        return res.status(400).json({ message: "Barcode is required" });
      }
      
      const component = await storage.getComponentByNumber(barcode);
      
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }
      
      res.json(component);
    } catch (error) {
      res.status(500).json({ message: "Barcode lookup failed" });
    }
  });

  // Data export routes for Power BI integration
  app.get('/api/export/dashboard-data', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      const recentTransactions = await storage.getRecentTransactions(50);
      const lowStockItems = await storage.getLowStockItems();
      const allInventory = await storage.getAllInventoryItems();
      
      const exportData = {
        timestamp: new Date().toISOString(),
        summary: stats,
        inventory: allInventory.map(item => ({
          componentNumber: item.component.componentNumber,
          description: item.component.description,
          location: item.location.name,
          quantity: item.quantity,
          minStockLevel: item.minStockLevel,
          category: item.component.category,
          supplier: item.component.supplier,
          unitPrice: item.component.unitPrice,
          lastUpdated: new Date().toISOString()
        })),
        transactions: recentTransactions.map(tx => ({
          id: tx.id,
          componentNumber: tx.component.componentNumber,
          type: tx.transactionType,
          quantity: tx.quantity,
          fromLocation: tx.fromLocation?.name || null,
          toLocation: tx.toLocation?.name || null,
          timestamp: tx.createdAt,
          notes: tx.notes
        })),
        alerts: lowStockItems.map(item => ({
          componentNumber: item.component.componentNumber,
          description: item.component.description,
          location: item.location.name,
          currentStock: item.quantity,
          minStockLevel: item.minStockLevel,
          urgency: item.quantity === 0 ? 'critical' : 'warning'
        }))
      };
      
      res.json(exportData);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: 'Failed to export data' });
    }
  });

  // CSV export for Power BI
  app.get('/api/export/csv', async (req, res) => {
    try {
      const { type } = req.query;
      let csvData = '';
      
      if (type === 'inventory') {
        const inventory = await storage.getAllInventoryItems();
        csvData = 'Component Number,Description,Location,Quantity,Min Stock Level,Category,Supplier,Unit Price,Last Updated\n';
        inventory.forEach(item => {
          csvData += `"${item.component.componentNumber}","${item.component.description}","${item.location.name}",${item.quantity},${item.minStockLevel},"${item.component.category || ''}","${item.component.supplier || ''}",${item.component.unitPrice || 0},"${new Date().toISOString()}"\n`;
        });
      } else if (type === 'transactions') {
        const transactions = await storage.getRecentTransactions(100);
        csvData = 'ID,Component Number,Type,Quantity,From Location,To Location,Timestamp,Notes\n';
        transactions.forEach(tx => {
          csvData += `${tx.id},"${tx.component.componentNumber}","${tx.transactionType}",${tx.quantity},"${tx.fromLocation?.name || ''}","${tx.toLocation?.name || ''}","${tx.createdAt}","${tx.notes || ''}"\n`;
        });
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ message: 'Failed to export CSV' });
    }
  });

  // Admin routes for user management
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      const { username, email, firstName, lastName, role, isActive, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const userData = {
        username,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        role: role || 'user',
        isActive: isActive !== undefined ? isActive : true,
        password: hashedPassword,
      };

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin routes for group management
  app.get("/api/admin/groups", async (req, res) => {
    try {
      const groups = await storage.getAllUserGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.post("/api/admin/groups", async (req, res) => {
    try {
      const result = insertUserGroupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid group data", details: result.error.errors });
      }

      const group = await storage.createUserGroup(result.data);
      res.json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.put("/api/admin/groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const groupData = req.body;
      
      const updatedGroup = await storage.updateUserGroup(id, groupData);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  // Admin test endpoints
  app.post("/api/admin/test-low-inventory", async (req, res) => {
    try {
      // Get some low stock items for testing
      const lowStockItems = await storage.getLowStockItems();
      
      // Create a test notification
      const testNotification = {
        id: `test-low-${Date.now()}`,
        type: 'low_stock',
        title: 'Test Low Stock Alert',
        message: lowStockItems.length > 0 
          ? `Found ${lowStockItems.length} items with low stock`
          : 'Test notification: Component ABC-123 is running low (2 remaining)',
        severity: lowStockItems.length > 0 ? 'warning' : 'critical',
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      res.json({ 
        success: true, 
        message: 'Test low inventory alert sent',
        notification: testNotification
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to send test notification" });
    }
  });

  app.post("/api/admin/test-activity", async (req, res) => {
    try {
      const testNotification = {
        id: `test-activity-${Date.now()}`,
        type: 'transfer',
        title: 'Test Activity Alert',
        message: 'Test notification: 5 units of Component XYZ-789 transferred from Main to Line',
        severity: 'info',
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      res.json({ 
        success: true, 
        message: 'Test activity alert sent',
        notification: testNotification
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to send test notification" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);

  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'CONNECTED', data: { message: 'Connected to WB-Tracks' } }));
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}

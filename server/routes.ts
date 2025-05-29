import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertComponentSchema, transferItemSchema, insertInventoryTransactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default data
  await storage.initializeDefaultData();

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

  app.post("/api/components", async (req, res) => {
    try {
      const validatedData = insertComponentSchema.parse(req.body);
      const component = await storage.createComponent(validatedData);
      res.status(201).json(component);
    } catch (error) {
      res.status(400).json({ message: "Invalid component data" });
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

  // Location API routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
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

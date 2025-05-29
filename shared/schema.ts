import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"), // 'admin', 'manager', 'user'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const components = pgTable("components", {
  id: serial("id").primaryKey(),
  componentNumber: varchar("component_number", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  category: text("category"),
  supplier: text("supplier"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const inventoryLocations = pgTable("inventory_locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  componentId: integer("component_id").notNull().references(() => components.id),
  locationId: integer("location_id").notNull().references(() => inventoryLocations.id),
  quantity: integer("quantity").notNull().default(0),
  minStockLevel: integer("min_stock_level").default(5),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  componentId: integer("component_id").notNull().references(() => components.id),
  fromLocationId: integer("from_location_id").references(() => inventoryLocations.id),
  toLocationId: integer("to_location_id").references(() => inventoryLocations.id),
  quantity: integer("quantity").notNull(),
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // 'add', 'remove', 'transfer'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// Sessions table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Component photos table
export const componentPhotos = pgTable("component_photos", {
  id: serial("id").primaryKey(),
  componentId: integer("component_id").notNull().references(() => components.id),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  isPrimary: boolean("is_primary").notNull().default(false),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const componentRelations = relations(components, ({ many, one }) => ({
  inventoryItems: many(inventoryItems),
  transactions: many(inventoryTransactions),
  photos: many(componentPhotos),
  createdByUser: one(users, {
    fields: [components.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  updatedByUser: one(users, {
    fields: [components.updatedBy],
    references: [users.id],
    relationName: "updatedBy",
  }),
}));

export const componentPhotoRelations = relations(componentPhotos, ({ one }) => ({
  component: one(components, {
    fields: [componentPhotos.componentId],
    references: [components.id],
  }),
  uploadedByUser: one(users, {
    fields: [componentPhotos.uploadedBy],
    references: [users.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  createdComponents: many(components, { relationName: "createdBy" }),
  updatedComponents: many(components, { relationName: "updatedBy" }),
  transactions: many(inventoryTransactions),
  uploadedPhotos: many(componentPhotos),
}));

export const inventoryLocationRelations = relations(inventoryLocations, ({ many }) => ({
  inventoryItems: many(inventoryItems),
  transactionsFrom: many(inventoryTransactions, { relationName: "fromLocation" }),
  transactionsTo: many(inventoryTransactions, { relationName: "toLocation" }),
}));

export const inventoryItemRelations = relations(inventoryItems, ({ one }) => ({
  component: one(components, {
    fields: [inventoryItems.componentId],
    references: [components.id],
  }),
  location: one(inventoryLocations, {
    fields: [inventoryItems.locationId],
    references: [inventoryLocations.id],
  }),
}));

export const inventoryTransactionRelations = relations(inventoryTransactions, ({ one }) => ({
  component: one(components, {
    fields: [inventoryTransactions.componentId],
    references: [components.id],
  }),
  fromLocation: one(inventoryLocations, {
    fields: [inventoryTransactions.fromLocationId],
    references: [inventoryLocations.id],
    relationName: "fromLocation",
  }),
  toLocation: one(inventoryLocations, {
    fields: [inventoryTransactions.toLocationId],
    references: [inventoryLocations.id],
    relationName: "toLocation",
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertComponentSchema = createInsertSchema(components).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComponentPhotoSchema = createInsertSchema(componentPhotos).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertInventoryLocationSchema = createInsertSchema(inventoryLocations).omit({
  id: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  lastUpdated: true,
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
});

export const transferItemSchema = z.object({
  componentId: z.number(),
  fromLocationId: z.number(),
  toLocationId: z.number(),
  quantity: z.number().min(1),
  notes: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Component = typeof components.$inferSelect;
export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type ComponentPhoto = typeof componentPhotos.$inferSelect;
export type InsertComponentPhoto = z.infer<typeof insertComponentPhotoSchema>;
export type InventoryLocation = typeof inventoryLocations.$inferSelect;
export type InsertInventoryLocation = z.infer<typeof insertInventoryLocationSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type TransferItem = z.infer<typeof transferItemSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export interface InventoryItemWithDetails extends InventoryItem {
  component: Component;
  location: InventoryLocation;
}

export interface ComponentWithInventory extends Component {
  inventoryItems: InventoryItemWithDetails[];
}

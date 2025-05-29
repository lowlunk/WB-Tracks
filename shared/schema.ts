import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const components = pgTable("components", {
  id: serial("id").primaryKey(),
  componentNumber: varchar("component_number", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
});

export const componentRelations = relations(components, ({ many }) => ({
  inventoryItems: many(inventoryItems),
  transactions: many(inventoryTransactions),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertComponentSchema = createInsertSchema(components).omit({
  id: true,
  createdAt: true,
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
export type InventoryLocation = typeof inventoryLocations.$inferSelect;
export type InsertInventoryLocation = z.infer<typeof insertInventoryLocationSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type TransferItem = z.infer<typeof transferItemSchema>;

export interface InventoryItemWithDetails extends InventoryItem {
  component: Component;
  location: InventoryLocation;
}

export interface ComponentWithInventory extends Component {
  inventoryItems: InventoryItemWithDetails[];
}

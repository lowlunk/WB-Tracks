import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal, jsonb, index, unique } from "drizzle-orm/pg-core";
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
  role: text("role").notNull().default("user"), // 'admin', 'manager', 'shipping', 'prod', 'user'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

// User groups table for organizing users
export const userGroups = pgTable("user_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  permissions: text("permissions").array(), // Array of permission strings
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User group memberships
export const userGroupMemberships = pgTable("user_group_memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  groupId: integer("group_id").references(() => userGroups.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const components = pgTable("components", {
  id: serial("id").primaryKey(),
  componentNumber: varchar("component_number", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  plateNumber: varchar("plate_number", { length: 50 }),
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

// Facilities table for multi-facility support
export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(), // Facility code like "MAIN", "WEST", "EAST"
  description: text("description"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 100 }).default("USA"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  managerName: varchar("manager_name", { length: 255 }),
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryLocations = pgTable("inventory_locations", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").references(() => facilities.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  locationType: varchar("location_type", { length: 50 }).default("warehouse"), // warehouse, production, staging, quarantine
  aisle: varchar("aisle", { length: 20 }),
  rack: varchar("rack", { length: 20 }),
  shelf: varchar("shelf", { length: 20 }),
  bin: varchar("bin", { length: 20 }),
  maxCapacity: integer("max_capacity"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Temporary barcodes for testing purposes
export const temporaryBarcodes = pgTable("temporary_barcodes", {
  id: serial("id").primaryKey(),
  barcode: varchar("barcode", { length: 50 }).notNull().unique(),
  componentId: integer("component_id").references(() => components.id),
  purpose: text("purpose").notNull(), // 'testing', 'training', 'demo'
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  groupMemberships: many(userGroupMemberships),
}));

export const userGroupRelations = relations(userGroups, ({ many }) => ({
  memberships: many(userGroupMemberships),
}));

export const userGroupMembershipRelations = relations(userGroupMemberships, ({ one }) => ({
  user: one(users, {
    fields: [userGroupMemberships.userId],
    references: [users.id],
  }),
  group: one(userGroups, {
    fields: [userGroupMemberships.groupId],
    references: [userGroups.id],
  }),
}));

export const temporaryBarcodeRelations = relations(temporaryBarcodes, ({ one }) => ({
  component: one(components, {
    fields: [temporaryBarcodes.componentId],
    references: [components.id],
  }),
  createdBy: one(users, {
    fields: [temporaryBarcodes.createdBy],
    references: [users.id],
  }),
}));

// Facility relations
export const facilityRelations = relations(facilities, ({ many }) => ({
  inventoryLocations: many(inventoryLocations),
}));

export const inventoryLocationRelations = relations(inventoryLocations, ({ many, one }) => ({
  facility: one(facilities, {
    fields: [inventoryLocations.facilityId],
    references: [facilities.id],
  }),
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

export const insertFacilitySchema = createInsertSchema(facilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserGroupSchema = createInsertSchema(userGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserGroupMembershipSchema = createInsertSchema(userGroupMemberships).omit({
  id: true,
  assignedAt: true,
});

export const insertInventoryLocationSchema = createInsertSchema(inventoryLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const consumeItemSchema = z.object({
  componentId: z.number(),
  locationId: z.number(),
  quantity: z.number().min(1),
  notes: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type UserGroup = typeof userGroups.$inferSelect;
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
export type UserGroupMembership = typeof userGroupMemberships.$inferSelect;
export type InsertUserGroupMembership = z.infer<typeof insertUserGroupMembershipSchema>;
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
export type ConsumeItem = z.infer<typeof consumeItemSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export interface InventoryItemWithDetails extends InventoryItem {
  component: Component;
  location: InventoryLocation;
}

export interface ComponentWithInventory extends Component {
  inventoryItems: InventoryItemWithDetails[];
}

import {
  components,
  facilities,
  inventoryLocations,
  inventoryItems,
  inventoryTransactions,
  users,
  userGroups,
  componentPhotos,
  type Component,
  type InsertComponent,
  type Facility,
  type InsertFacility,
  type UserGroup,
  type InsertUserGroup,
  type ComponentPhoto,
  type InsertComponentPhoto,
  type InventoryLocation,
  type InsertInventoryLocation,
  type InventoryItem,
  type InsertInventoryItem,
  type InventoryTransaction,
  type InsertInventoryTransaction,
  type User,
  type InsertUser,
  type TransferItem,
  type ConsumeItem,
  type InventoryItemWithDetails,
  type ComponentWithInventory,
  type LoginData,
  type RegisterData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  loginUser(username: string): Promise<User | undefined>;
  updateLastLogin(id: number): Promise<void>;

  // User group methods
  getAllUserGroups(): Promise<UserGroup[]>;
  getUserGroup(id: number): Promise<UserGroup | undefined>;
  createUserGroup(group: InsertUserGroup): Promise<UserGroup>;
  updateUserGroup(id: number, group: Partial<InsertUserGroup>): Promise<UserGroup>;
  deleteUserGroup(id: number): Promise<void>;

  // Component methods
  getAllComponents(): Promise<Component[]>;
  getComponent(id: number): Promise<Component | undefined>;
  getComponentByNumber(componentNumber: string): Promise<Component | undefined>;
  createComponent(component: InsertComponent, userId?: number): Promise<Component>;
  updateComponent(id: number, component: Partial<InsertComponent>, userId?: number): Promise<Component>;
  deleteComponent(id: number): Promise<void>;

  // Component photo methods
  getComponentPhotos(componentId: number): Promise<ComponentPhoto[]>;
  uploadComponentPhoto(photo: InsertComponentPhoto): Promise<ComponentPhoto>;
  deleteComponentPhoto(id: number): Promise<void>;
  setPrimaryPhoto(componentId: number, photoId: number): Promise<void>;

  // Facility methods
  getAllFacilities(): Promise<Facility[]>;
  getFacility(id: number): Promise<Facility | undefined>;
  getFacilityByCode(code: string): Promise<Facility | undefined>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(id: number, facility: Partial<InsertFacility>): Promise<Facility>;
  deleteFacility(id: number): Promise<void>;

  // Location methods
  getAllLocations(): Promise<InventoryLocation[]>;
  getLocationsByFacility(facilityId: number): Promise<InventoryLocation[]>;
  getLocation(id: number): Promise<InventoryLocation | undefined>;
  createLocation(location: InsertInventoryLocation): Promise<InventoryLocation>;

  // Inventory methods
  getAllInventoryItems(): Promise<InventoryItemWithDetails[]>;
  getInventoryByLocation(locationId: number): Promise<InventoryItemWithDetails[]>;
  getInventoryItem(componentId: number, locationId: number): Promise<InventoryItemWithDetails | undefined>;
  updateInventoryQuantity(componentId: number, locationId: number, quantity: number): Promise<InventoryItem>;

  // Transaction methods
  transferItems(transfer: TransferItem): Promise<InventoryTransaction>;
  addItemsToInventory(componentId: number, locationId: number, quantity: number, notes?: string): Promise<InventoryTransaction>;
  removeItemsFromInventory(componentId: number, locationId: number, quantity: number, notes?: string): Promise<InventoryTransaction>;
  consumeItems(consume: ConsumeItem): Promise<InventoryTransaction>;
  getRecentTransactions(limit?: number): Promise<(InventoryTransaction & { component: Component; fromLocation?: InventoryLocation; toLocation?: InventoryLocation })[]>;
  getConsumedTransactions(): Promise<(InventoryTransaction & { component: Component; location: InventoryLocation })[]>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalComponents: number;
    mainInventoryTotal: number;
    lineInventoryTotal: number;
    lowStockAlerts: number;
  }>;

  // Search and filter
  searchComponents(query: string): Promise<ComponentWithInventory[]>;
  getLowStockItems(): Promise<InventoryItemWithDetails[]>;

  // Initialize default data
  initializeDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async loginUser(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.username, username),
        eq(users.isActive, true)
      ));
    return user || undefined;
  }

  async updateLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // User group methods
  async getAllUserGroups(): Promise<UserGroup[]> {
    return await db.select().from(userGroups);
  }

  async getUserGroup(id: number): Promise<UserGroup | undefined> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.id, id));
    return group;
  }

  async createUserGroup(group: InsertUserGroup): Promise<UserGroup> {
    const [newGroup] = await db.insert(userGroups).values(group).returning();
    return newGroup;
  }

  async updateUserGroup(id: number, group: Partial<InsertUserGroup>): Promise<UserGroup> {
    const [updatedGroup] = await db.update(userGroups)
      .set({ ...group, updatedAt: new Date() })
      .where(eq(userGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteUserGroup(id: number): Promise<void> {
    await db.delete(userGroups).where(eq(userGroups.id, id));
  }

  async getAllComponents(): Promise<Component[]> {
    return await db.select().from(components);
  }

  async getComponent(id: number): Promise<Component | undefined> {
    const [component] = await db.select().from(components).where(eq(components.id, id));
    return component || undefined;
  }

  async getComponentByNumber(componentNumber: string): Promise<Component | undefined> {
    const [component] = await db.select().from(components).where(eq(components.componentNumber, componentNumber));
    return component || undefined;
  }

  async createComponent(component: InsertComponent, userId?: number): Promise<Component> {
    const componentData = {
      ...component,
      createdBy: userId,
      updatedBy: userId,
    };
    const [newComponent] = await db.insert(components).values(componentData).returning();
    return newComponent;
  }

  async updateComponent(id: number, component: Partial<InsertComponent>, userId?: number): Promise<Component> {
    const updateData = {
      ...component,
      updatedBy: userId,
      updatedAt: new Date(),
    };
    const [updatedComponent] = await db
      .update(components)
      .set(updateData)
      .where(eq(components.id, id))
      .returning();
    return updatedComponent;
  }

  // Component photo methods
  async getComponentPhotos(componentId: number): Promise<ComponentPhoto[]> {
    return await db
      .select()
      .from(componentPhotos)
      .where(eq(componentPhotos.componentId, componentId))
      .orderBy(desc(componentPhotos.isPrimary), desc(componentPhotos.createdAt));
  }

  async uploadComponentPhoto(photo: InsertComponentPhoto): Promise<ComponentPhoto> {
    const [newPhoto] = await db.insert(componentPhotos).values(photo).returning();
    return newPhoto;
  }

  async deleteComponentPhoto(id: number): Promise<void> {
    await db.delete(componentPhotos).where(eq(componentPhotos.id, id));
  }

  async setPrimaryPhoto(componentId: number, photoId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Remove primary flag from all photos for this component
      await tx
        .update(componentPhotos)
        .set({ isPrimary: false })
        .where(eq(componentPhotos.componentId, componentId));

      // Set the selected photo as primary
      await tx
        .update(componentPhotos)
        .set({ isPrimary: true })
        .where(eq(componentPhotos.id, photoId));
    });
  }

  async deleteComponent(id: number): Promise<void> {
    await db.delete(components).where(eq(components.id, id));
  }

  // Facility methods
  async getAllFacilities(): Promise<Facility[]> {
    return await db.select().from(facilities);
  }

  async getFacility(id: number): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility || undefined;
  }

  async getFacilityByCode(code: string): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.code, code));
    return facility || undefined;
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const [newFacility] = await db.insert(facilities).values(facility).returning();
    return newFacility;
  }

  async updateFacility(id: number, facility: Partial<InsertFacility>): Promise<Facility> {
    const [updatedFacility] = await db
      .update(facilities)
      .set({ ...facility, updatedAt: new Date() })
      .where(eq(facilities.id, id))
      .returning();
    return updatedFacility;
  }

  async deleteFacility(id: number): Promise<void> {
    await db.delete(facilities).where(eq(facilities.id, id));
  }

  // Location methods
  async getAllLocations(): Promise<InventoryLocation[]> {
    return await db.select().from(inventoryLocations);
  }

  async getLocationsByFacility(facilityId: number): Promise<InventoryLocation[]> {
    return await db.select().from(inventoryLocations).where(eq(inventoryLocations.facilityId, facilityId));
  }

  async getLocation(id: number): Promise<InventoryLocation | undefined> {
    const [location] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, id));
    return location || undefined;
  }

  async createLocation(location: InsertInventoryLocation): Promise<InventoryLocation> {
    const [newLocation] = await db.insert(inventoryLocations).values(location).returning();
    return newLocation;
  }

  async getAllInventoryItems(): Promise<InventoryItemWithDetails[]> {
    return await db
      .select({
        id: inventoryItems.id,
        componentId: inventoryItems.componentId,
        locationId: inventoryItems.locationId,
        quantity: inventoryItems.quantity,
        minStockLevel: inventoryItems.minStockLevel,
        lastUpdated: inventoryItems.lastUpdated,
        component: components,
        location: inventoryLocations,
      })
      .from(inventoryItems)
      .innerJoin(components, eq(inventoryItems.componentId, components.id))
      .innerJoin(inventoryLocations, eq(inventoryItems.locationId, inventoryLocations.id));
  }

  async getInventoryByLocation(locationId: number): Promise<InventoryItemWithDetails[]> {
    return await db
      .select({
        id: inventoryItems.id,
        componentId: inventoryItems.componentId,
        locationId: inventoryItems.locationId,
        quantity: inventoryItems.quantity,
        minStockLevel: inventoryItems.minStockLevel,
        lastUpdated: inventoryItems.lastUpdated,
        component: components,
        location: inventoryLocations,
      })
      .from(inventoryItems)
      .innerJoin(components, eq(inventoryItems.componentId, components.id))
      .innerJoin(inventoryLocations, eq(inventoryItems.locationId, inventoryLocations.id))
      .where(eq(inventoryItems.locationId, locationId));
  }

  async getInventoryItem(componentId: number, locationId: number): Promise<InventoryItemWithDetails | undefined> {
    const [item] = await db
      .select({
        id: inventoryItems.id,
        componentId: inventoryItems.componentId,
        locationId: inventoryItems.locationId,
        quantity: inventoryItems.quantity,
        minStockLevel: inventoryItems.minStockLevel,
        lastUpdated: inventoryItems.lastUpdated,
        component: components,
        location: inventoryLocations,
      })
      .from(inventoryItems)
      .innerJoin(components, eq(inventoryItems.componentId, components.id))
      .innerJoin(inventoryLocations, eq(inventoryItems.locationId, inventoryLocations.id))
      .where(and(eq(inventoryItems.componentId, componentId), eq(inventoryItems.locationId, locationId)));

    return item || undefined;
  }

  async updateInventoryQuantity(componentId: number, locationId: number, quantity: number): Promise<InventoryItem> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ quantity, lastUpdated: new Date() })
      .where(and(eq(inventoryItems.componentId, componentId), eq(inventoryItems.locationId, locationId)))
      .returning();

    if (!updatedItem) {
      // Create new inventory item if it doesn't exist
      const [newItem] = await db
        .insert(inventoryItems)
        .values({ componentId, locationId, quantity })
        .returning();
      return newItem;
    }

    return updatedItem;
  }

  async transferItems(transfer: TransferItem): Promise<InventoryTransaction> {
    return await db.transaction(async (tx) => {
      // Check if source has enough quantity
      const [fromItem] = await tx
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.componentId, transfer.componentId), eq(inventoryItems.locationId, transfer.fromLocationId)));

      if (!fromItem || fromItem.quantity < transfer.quantity) {
        throw new Error("Insufficient quantity in source location");
      }

      // Update source location
      await tx
        .update(inventoryItems)
        .set({ 
          quantity: fromItem.quantity - transfer.quantity,
          lastUpdated: new Date()
        })
        .where(and(eq(inventoryItems.componentId, transfer.componentId), eq(inventoryItems.locationId, transfer.fromLocationId)));

      // Update or create destination location
      const [toItem] = await tx
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.componentId, transfer.componentId), eq(inventoryItems.locationId, transfer.toLocationId)));

      if (toItem) {
        await tx
          .update(inventoryItems)
          .set({ 
            quantity: toItem.quantity + transfer.quantity,
            lastUpdated: new Date()
          })
          .where(and(eq(inventoryItems.componentId, transfer.componentId), eq(inventoryItems.locationId, transfer.toLocationId)));
      } else {
        await tx
          .insert(inventoryItems)
          .values({
            componentId: transfer.componentId,
            locationId: transfer.toLocationId,
            quantity: transfer.quantity,
          });
      }

      // Create transaction record
      const [transaction] = await tx
        .insert(inventoryTransactions)
        .values({
          componentId: transfer.componentId,
          fromLocationId: transfer.fromLocationId,
          toLocationId: transfer.toLocationId,
          quantity: transfer.quantity,
          transactionType: 'transfer',
          notes: transfer.notes,
        })
        .returning();

      return transaction;
    });
  }

  async addItemsToInventory(componentId: number, locationId: number, quantity: number, notes?: string): Promise<InventoryTransaction> {
    return await db.transaction(async (tx) => {
      // Update or create inventory item
      const [existingItem] = await tx
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.componentId, componentId), eq(inventoryItems.locationId, locationId)));

      if (existingItem) {
        await tx
          .update(inventoryItems)
          .set({ 
            quantity: existingItem.quantity + quantity,
            lastUpdated: new Date()
          })
          .where(and(eq(inventoryItems.componentId, componentId), eq(inventoryItems.locationId, locationId)));
      } else {
        await tx
          .insert(inventoryItems)
          .values({
            componentId,
            locationId,
            quantity,
          });
      }

      // Create transaction record
      const [transaction] = await tx
        .insert(inventoryTransactions)
        .values({
          componentId,
          toLocationId: locationId,
          quantity,
          transactionType: 'add',
          notes,
        })
        .returning();

      return transaction;
    });
  }

  async removeItemsFromInventory(componentId: number, locationId: number, quantity: number, notes?: string): Promise<InventoryTransaction> {
    return await db.transaction(async (tx) => {
      // Check current quantity
      const [existingItem] = await tx
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.componentId, componentId), eq(inventoryItems.locationId, locationId)));

      if (!existingItem || existingItem.quantity < quantity) {
        throw new Error("Insufficient quantity to remove");
      }

      // Update inventory item
      await tx
        .update(inventoryItems)
        .set({ 
          quantity: existingItem.quantity - quantity,
          lastUpdated: new Date()
        })
        .where(and(eq(inventoryItems.componentId, componentId), eq(inventoryItems.locationId, locationId)));

      // Create transaction record
      const [transaction] = await tx
        .insert(inventoryTransactions)
        .values({
          componentId,
          fromLocationId: locationId,
          quantity,
          transactionType: 'remove',
          notes,
        })
        .returning();

      return transaction;
    });
  }

  async consumeItems(consume: ConsumeItem): Promise<InventoryTransaction> {
    return await db.transaction(async (tx) => {
      const { componentId, locationId, quantity, notes } = consume;

      // Check current quantity
      const [existingItem] = await tx
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.componentId, componentId), eq(inventoryItems.locationId, locationId)));

      if (!existingItem || existingItem.quantity < quantity) {
        throw new Error("Insufficient quantity to consume");
      }

      // Update inventory item
      await tx
        .update(inventoryItems)
        .set({ 
          quantity: existingItem.quantity - quantity,
          lastUpdated: new Date()
        })
        .where(and(eq(inventoryItems.componentId, componentId), eq(inventoryItems.locationId, locationId)));

      // Create transaction record for consumption (production use)
      const [transaction] = await tx
        .insert(inventoryTransactions)
        .values({
          componentId,
          fromLocationId: locationId,
          quantity,
          transactionType: 'consume',
          notes: notes || 'Used in production',
        })
        .returning();

      return transaction;
    });
  }

  async getRecentTransactions(limit = 10): Promise<(InventoryTransaction & { component: Component; fromLocation?: InventoryLocation; toLocation?: InventoryLocation })[]> {
    const transactions = await db
      .select({
        id: inventoryTransactions.id,
        componentId: inventoryTransactions.componentId,
        fromLocationId: inventoryTransactions.fromLocationId,
        toLocationId: inventoryTransactions.toLocationId,
        quantity: inventoryTransactions.quantity,
        transactionType: inventoryTransactions.transactionType,
        notes: inventoryTransactions.notes,
        createdAt: inventoryTransactions.createdAt,
        createdBy: inventoryTransactions.createdBy,
        component: components,
      })
      .from(inventoryTransactions)
      .innerJoin(components, eq(inventoryTransactions.componentId, components.id))
      .orderBy(desc(inventoryTransactions.createdAt))
      .limit(limit);

    // Get location details for each transaction
    const result = [];
    for (const transaction of transactions) {
      let fromLocation = undefined;
      let toLocation = undefined;

      if (transaction.fromLocationId) {
        [fromLocation] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, transaction.fromLocationId));
      }

      if (transaction.toLocationId) {
        [toLocation] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, transaction.toLocationId));
      }

      result.push({
        ...transaction,
        fromLocation,
        toLocation,
      });
    }

    return result;
  }

  async getConsumedTransactions(): Promise<(InventoryTransaction & { component: Component; location: InventoryLocation })[]> {
    const transactions = await db
      .select({
        id: inventoryTransactions.id,
        componentId: inventoryTransactions.componentId,
        fromLocationId: inventoryTransactions.fromLocationId,
        toLocationId: inventoryTransactions.toLocationId,
        quantity: inventoryTransactions.quantity,
        transactionType: inventoryTransactions.transactionType,
        notes: inventoryTransactions.notes,
        createdAt: inventoryTransactions.createdAt,
        createdBy: inventoryTransactions.createdBy,
        component: components,
        location: inventoryLocations,
      })
      .from(inventoryTransactions)
      .innerJoin(components, eq(inventoryTransactions.componentId, components.id))
      .innerJoin(inventoryLocations, eq(inventoryTransactions.fromLocationId, inventoryLocations.id))
      .where(eq(inventoryTransactions.transactionType, 'consume'))
      .orderBy(desc(inventoryTransactions.createdAt));

    return transactions;
  }

  async getDashboardStats(): Promise<{
    totalComponents: number;
    mainInventoryTotal: number;
    lineInventoryTotal: number;
    lowStockAlerts: number;
  }> {
    const [totalComponents] = await db.select({ count: sql`count(*)` }).from(components);

    const mainLocation = await db.select().from(inventoryLocations).where(eq(inventoryLocations.name, 'Main Inventory'));
    const lineLocation = await db.select().from(inventoryLocations).where(eq(inventoryLocations.name, 'Line Inventory'));

    let mainInventoryTotal = 0;
    let lineInventoryTotal = 0;

    if (mainLocation.length > 0) {
      const [mainTotal] = await db
        .select({ total: sql`coalesce(sum(${inventoryItems.quantity}), 0)` })
        .from(inventoryItems)
        .where(eq(inventoryItems.locationId, mainLocation[0].id));
      mainInventoryTotal = Number(mainTotal.total);
    }

    if (lineLocation.length > 0) {
      const [lineTotal] = await db
        .select({ total: sql`coalesce(sum(${inventoryItems.quantity}), 0)` })
        .from(inventoryItems)
        .where(eq(inventoryItems.locationId, lineLocation[0].id));
      lineInventoryTotal = Number(lineTotal.total);
    }

    const [lowStockCount] = await db
      .select({ count: sql`count(*)` })
      .from(inventoryItems)
      .where(sql`${inventoryItems.quantity} <= ${inventoryItems.minStockLevel}`);

    return {
      totalComponents: Number(totalComponents.count),
      mainInventoryTotal,
      lineInventoryTotal,
      lowStockAlerts: Number(lowStockCount.count),
    };
  }

  async searchComponents(query: string): Promise<ComponentWithInventory[]> {
    const foundComponents = await db
      .select()
      .from(components)
      .where(sql`${components.componentNumber} ilike ${'%' + query + '%'} or ${components.description} ilike ${'%' + query + '%'}`);

    const result = [];
    for (const component of foundComponents) {
      const inventoryItems = await this.getInventoryItemsByComponent(component.id);
      result.push({
        ...component,
        inventoryItems,
      });
    }

    return result;
  }

  private async getInventoryItemsByComponent(componentId: number): Promise<InventoryItemWithDetails[]> {
    return await db
      .select({
        id: inventoryItems.id,
        componentId: inventoryItems.componentId,
        locationId: inventoryItems.locationId,
        quantity: inventoryItems.quantity,
        minStockLevel: inventoryItems.minStockLevel,
        lastUpdated: inventoryItems.lastUpdated,
        component: components,
        location: inventoryLocations,
      })
      .from(inventoryItems)
      .innerJoin(components, eq(inventoryItems.componentId, components.id))
      .innerJoin(inventoryLocations, eq(inventoryItems.locationId, inventoryLocations.id))
      .where(eq(inventoryItems.componentId, componentId));
  }

  async getLowStockItems(): Promise<InventoryItemWithDetails[]> {
    return await db
      .select({
        id: inventoryItems.id,
        componentId: inventoryItems.componentId,
        locationId: inventoryItems.locationId,
        quantity: inventoryItems.quantity,
        minStockLevel: inventoryItems.minStockLevel,
        lastUpdated: inventoryItems.lastUpdated,
        component: components,
        location: inventoryLocations,
      })
      .from(inventoryItems)
      .innerJoin(components, eq(inventoryItems.componentId, components.id))
      .innerJoin(inventoryLocations, eq(inventoryItems.locationId, inventoryLocations.id))
      .where(sql`${inventoryItems.quantity} <= ${inventoryItems.minStockLevel}`);
  }



  async initializeDefaultData(): Promise<void> {
    // Create default facility if it doesn't exist
    const existingFacilities = await db.select().from(facilities);
    let defaultFacility: Facility;

    if (existingFacilities.length === 0) {
      const [facility] = await db.insert(facilities).values({
        name: 'Main Production Facility',
        code: 'MAIN-001',
        description: 'Primary production facility',
        address: 'Production Floor',
      }).returning();
      defaultFacility = facility;
    } else {
      defaultFacility = existingFacilities[0];
    }

    // Handle existing locations without facilityId (migration)
    const locationsWithoutFacility = await db.select().from(inventoryLocations).where(isNull(inventoryLocations.facilityId));
    if (locationsWithoutFacility.length > 0) {
      await db.update(inventoryLocations)
        .set({ facilityId: defaultFacility.id })
        .where(isNull(inventoryLocations.facilityId));
    }

    // Create default locations if they don't exist
    const existingLocations = await db.select().from(inventoryLocations);

    if (existingLocations.length === 0) {
      await db.insert(inventoryLocations).values([
        { 
          name: 'Main Inventory', 
          description: 'Central storage area (150 feet from production line)',
          facilityId: defaultFacility.id,
          locationType: 'storage'
        },
        { 
          name: 'Line Inventory', 
          description: 'Production line stock',
          facilityId: defaultFacility.id,
          locationType: 'production'
        },
      ]);
    }

    // Create components from the uploaded list if they don't exist
    const existingComponents = await db.select().from(components);

    if (existingComponents.length === 0) {
      const componentData = [
        { componentNumber: "217520", description: "351X119MM 2OZ BRIGADE 6MCA 0SE" },
        { componentNumber: "217543", description: "423X517MM 4OZ BRIG W/FELT 23MC" },
        { componentNumber: "217544", description: "281X516MM 4OZ BRIG 16MCA 60RSC" },
        { componentNumber: "217586", description: "707X511MM 2OZ BRIDAGE 35MCA FS" },
        { componentNumber: "217587", description: "701X508MM 2OZ BRIGADE 35MCA T1" },
        { componentNumber: "217671", description: "702X526MM 2OZ BRIGADE 38MCA FS" },
        { componentNumber: "217672", description: "520X695 2OZ BRIGADE 32MCA FSB" },
        { componentNumber: "217685", description: "103X57MM T1XX FSC BOLSTER CLOT" },
        { componentNumber: "217723", description: "700X533MM 2OZ BRIGADE 39MCA FS" },
        { componentNumber: "217746", description: "152X58MM 2OZ BRIGADE 7MCA T1XX" },
        { componentNumber: "217790", description: "152X58MM 2OZ BRIGAGDE 7 MCA T1" },
        { componentNumber: "217817", description: "159X64MM 2OZ BRIGADE 7MCA FSC" },
        { componentNumber: "217821", description: "372X346 4OZ BRIGADE 15MCA 3RSC" },
        { componentNumber: "217823", description: "402X369MM 4OZ BRIGADE 15MCA 3R" },
        { componentNumber: "217824", description: "116X364MM 4OZ BRIG 9MCA 3RSC L" },
        { componentNumber: "217860", description: "448X519MM 4OZ BRIG W/FELT 23MC" },
        { componentNumber: "217861", description: "450X557MM 4OZ BRIG W/FELT 23MC" },
        { componentNumber: "217864", description: "243X94MM 100G FELT 12MCA RH FS" },
        { componentNumber: "217865", description: "243X94MM 100G FELT 12MCA LH FS" },
        { componentNumber: "218047", description: "604X625MM 4OZ BRIGADE LH TESLA" },
        { componentNumber: "218048", description: "604X625MM 4 OZ BRIGADE RH TESL" },
        { componentNumber: "218049", description: "569X618MM 4OZ BRIGADE FC TESLA" },
        { componentNumber: "218207", description: "491X557MM 4OZ BRI W/FELT 26ACA" },
        { componentNumber: "218235", description: "626X499MM 4OZ BRIGADE 43ACA FS" },
        { componentNumber: "218311", description: "140X27X3MM FELT 400G 5ACA T1XX" },
        { componentNumber: "218330", description: "70X35MM 2OZ CLOTH TESLA S/X" },
        { componentNumber: "218367", description: "806X510MM 3OZ SNP 32 ACA TESLA" },
        { componentNumber: "218378", description: "217X364 4OZ SNP MODEL S TESLA" },
        { componentNumber: "218501", description: "565X600MM 4OZ BRIGADE FC MODEL" },
        { componentNumber: "218502", description: "650X710MM 450G 3D CLOTH TESLA" },
        { componentNumber: "218503", description: "450G 3D CLOTH RH FB MODEL MS T" },
        { componentNumber: "218620", description: "3OZ SNP TESLA MODEL Y" },
        { componentNumber: "218621", description: "3OZ SNP TESLA MODEL Y" },
        { componentNumber: "218633", description: "325X289MM 4OZ SNP 11ACA  MODEL" },
        { componentNumber: "219004", description: "556X650MM 4OZ BRI 41ACA 2PIN 2" },
        { componentNumber: "219005", description: "116X102MM 4OZ BRIGADE 6ACA 2RS" },
        { componentNumber: "219006", description: "65X230MM 1200GSM FELT 5ACABOLS" },
        { componentNumber: "219007", description: "97X171MM 4OZ BRIGADE 6ACA 1PIN" },
        { componentNumber: "219008", description: "78X179MM 4OZ BRIGADE 6ACA 1PIN" },
        { componentNumber: "219009", description: "389X80MM 4OZ BRIGADE11ACA 2PIN" },
        { componentNumber: "219010", description: "116X102MM 4OZ BRIGADE 6ACA RH" },
        { componentNumber: "219142", description: "570X685MM 4OZ BRI 34ACA 2RSB T" },
        { componentNumber: "219452", description: "TESLA CLOTH OPAL" },
        { componentNumber: "219453", description: "TESLA CLOTH OPAL" },
        { componentNumber: "222120", description: "120MM APLIX 3D MULTILOOP SEGME" },
        { componentNumber: "222180", description: "180MM APLIX 3D MULTI LOOP SEGM" },
        { componentNumber: "222440", description: "440MM APLIX 3D MULTI LOOP SEGM" },
        { componentNumber: "222480", description: "480MM APLIX 3D MULTI LOOP SEGM" },
        { componentNumber: "235502", description: "2 SEGMENT FLEX MIGG 64MMX15MM" },
        { componentNumber: "235503", description: "3 SEGMENT FLEX MIGG 96MMX15MM" },
        { componentNumber: "240462", description: "260MM SPCW 16GA - RED" },
        { componentNumber: "240627", description: "200MM SPCW BRASIL" },
        { componentNumber: "240671", description: "310MM SPCW 16GA ASTM A227 TAN" },
        { componentNumber: "244652", description: "270MM SPCW" },
        { componentNumber: "248288", description: "379MM FPCW FSC T1XX CADILLAC" },
        { componentNumber: "248360", description: "270MM FPCW 2B2D TESLA" },
        { componentNumber: "248361", description: "200MM FPCW 3B2D TESLA" },
        { componentNumber: "248362", description: "320MM FPCW 4B2D TESLA" },
        { componentNumber: "248363", description: "201MM 6BEND FPCW FSB T1XX" },
        { componentNumber: "248369", description: "178MM 2BEND FPCW FSB T1XX" },
        { componentNumber: "248381", description: "280MM FPCW 2B2D TESLA Y" },
        { componentNumber: "248495", description: "410MM SPCW 16GA" },
        { componentNumber: "248499", description: "270MM FPCW 2B2D TESLA" },
        { componentNumber: "248503", description: "330MM BMW 4MM DIA 8B2D TESLA M" },
        { componentNumber: "249421", description: "268X40MM FPCW T1XX 4MM DIA" },
        { componentNumber: "249560", description: "175MM SPCW" },
        { componentNumber: "249612", description: "327MM FPCW 4B2D MODEL S TESLA" },
        { componentNumber: "249656", description: "239MM FPCW 2B2D U SHAPE MODEL" },
        { componentNumber: "249658", description: "260MM FPCW 2B2D MODEL Y TESLA" },
        { componentNumber: "249659", description: "340MM FPCW 2B2D MODEL Y TESLA" },
        { componentNumber: "249668", description: "280MM FPCW 2B2D RSB TESLA MODE" },
        { componentNumber: "249670", description: "266MM FPCW 4B2D TESLA MODEL S" },
        { componentNumber: "249823", description: "349MM FPCW 4B2D TESLA S RSC" },
        { componentNumber: "249933", description: "135MM FPCW 1B 2RSB T1XX" },
        { componentNumber: "249935", description: "342MM FPCW 5B 2RSB T1XX" },
        { componentNumber: "249936", description: "402MM FPCW 1B 2RSC T1XX" },
        { componentNumber: "251286", description: "1859MM 5DIA T1XX FSC BRDWIRE" },
        { componentNumber: "251298", description: "1878MM 12BEND FSB BMW T1XX BOR" },
        { componentNumber: "251302", description: "554X461MM 5MM DIA T1XX CADILLA" },
        { componentNumber: "251329", description: "431X398MM BW RH TESLA" },
        { componentNumber: "251331", description: "425X425MM BW CUSHION TESLA" },
        { componentNumber: "251394", description: "MS 2R REC BORDER WIRE" },
        { componentNumber: "251395", description: "452X612MM BW 6DIA 2051MM TESLA" },
        { componentNumber: "251414", description: "1776MM BW 5MMDIA 20B 2RSC T1XX" },
        { componentNumber: "253564", description: "1855MM BW 5MM DIA FSB PPV T1XX" },
        { componentNumber: "270131", description: "269MM FORMED POLY COATED 8B2D" },
        { componentNumber: "270132", description: "172MM 4DIA STRAIGHT POLYCOAT W" },
        { componentNumber: "271152", description: "355MM FEEW 2B2D 2MM DIA TESLA" },
        { componentNumber: "303788", description: "280X110X80MM EPP RSB60% T1XX" },
        { componentNumber: "304214", description: "527X546X15MM TOP KIT W PSA TES" },
        { componentNumber: "304267", description: "380X275X8MM UPPER TOPPER W PSA" },
        { componentNumber: "304288", description: "1223X261MM 50KG EPP FRAME TESL" },
        { componentNumber: "304374", description: "380X275X8MM TOPPER W PSA MODEL" },
        { componentNumber: "304375", description: "310X240X10MM TOPPER W PSA MODE" },
        { componentNumber: "304376", description: "240X260X15MM RETICULATED FOAM" },
        { componentNumber: "304377", description: "240X40X10MM RETICULATED FOAM P" },
        { componentNumber: "304723", description: "RSC EPP 45KG TESLA OPAL" },
        { componentNumber: "304766", description: "276X144X15MM TOP PSA AB40-170" },
        { componentNumber: "304767", description: "208X254X15MM TOP PSA AB40-170" },
        { componentNumber: "331942", description: "LEAR TAYLOR CLIP NEW 2018" },
        { componentNumber: "332370", description: "SCREW PINS TESLA" },
        { componentNumber: "332414", description: "552X326MM RH PP CX03-81 905 KG" },
        { componentNumber: "332415", description: "645X355MM LH PP CX03-81 905KG" },
        { componentNumber: "332589", description: "220X340MM PP (SIM 332535) TESL" },
        { componentNumber: "332590", description: "280X495MM PP (SIM 332534) TESL" },
        { componentNumber: "334038", description: "PLASTIC RH PP-GF20 TESLA OPAL" },
        { componentNumber: "334039", description: "PLASTIC LH TESLA OPAL" },
        { componentNumber: "334040", description: "PLASTIC END CAP RH PPGF20 TESL" },
        { componentNumber: "334041", description: "PLASTIC END CAP LH PP GF20 TES" },
        { componentNumber: "392762", description: "60MM MIGG 11" },
        { componentNumber: "393662", description: "272X72MM DIE CUT FSC T1XX CADI" },
        { componentNumber: "393663", description: "100X36MM OB FSB T1XX CADILLAC" },
        { componentNumber: "393671", description: "273X15MM DIECUT VELCRO T1XX" },
        { componentNumber: "393686", description: "27X138MM DIE CUT APLIX  FLEX L" },
        { componentNumber: "393728", description: "100X12MM DIECUT 2RSB T1XX" },
        { componentNumber: "393729", description: "250X12MM DIECUT 2RSC T1XX" },
        { componentNumber: "393730", description: "250X12MM DIECUT RH 2RSC T1XX" },
        { componentNumber: "393794", description: "360MM 2D FLEX APLIX" },
        { componentNumber: "393953", description: "320MM DIE CUT VELCRO INSERT RH" },
        { componentNumber: "393954", description: "320MM DIE CUT VELCRO INSERT LH" },
        { componentNumber: "393955", description: "130MM DIE CUT VELCRO CORNER RH" },
        { componentNumber: "393956", description: "130MM APLIX DIE CUT CORNER LH" },
        { componentNumber: "393957", description: "155MM DIE CUT VELCRO CORNER RH" },
        { componentNumber: "393958", description: "155MM DIE CUT  VELCRO CORNER L" },
        { componentNumber: "393963", description: "100MM APLIX A225 F13 (12MM)" },
        { componentNumber: "393964", description: "180MM APLIX A225 F13 (12MM)" },
        { componentNumber: "393965", description: "260MM APLIX A225 F13 (12MM)" },
        { componentNumber: "393966", description: "310MM APLIX A225 F13 (12MM)" },
        { componentNumber: "399050", description: "50MM MIGG15" },
        { componentNumber: "399060", description: "60X15MM MIGG 15 LOW PROFILE" },
        { componentNumber: "399070", description: "70MM X 15MM MIGG15" },
        { componentNumber: "399080", description: "80X15MM MIGG 15 LOW PROFILE" },
        { componentNumber: "399100", description: "100MM MIGG15 LOW PROFILE" },
        { componentNumber: "399170", description: "170 X 15MM MIGG15 LOW PROFILE" },
        { componentNumber: "399180", description: "180MM MIGG15 LOW PROFILE" },
        { componentNumber: "399190", description: "190X15MM MIGG 15 LOW PROFILE" },
        { componentNumber: "399220", description: "220MM MIGG 15 LOW PROFILE" },
        { componentNumber: "399230", description: "230 X 15MM MIGG15 LOW PROFILE" },
        { componentNumber: "399240", description: "240MM MIGG 15 LOW PROFILE" },
        { componentNumber: "399250", description: "250 X 15MM MIGG15 LOW PROFILE" },
        { componentNumber: "399270", description: "270 X 15MM MIGG15 LOW PROFILE" },
        { componentNumber: "399290", description: "290 X 15MM MIGG15 LOW PROFILE" },
        { componentNumber: "399370", description: "370 X 15MM MIGG15 LOW PROFILE" },
        { componentNumber: "399668", description: "215MM DIECUT VELCRO RH TESLA Y" },
        { componentNumber: "399669", description: "215MM DIECUT VELCRO LH TESLA Y" },
        { componentNumber: "399671", description: "155MM DIE CUT VELCRO RH/LH TES" },
        { componentNumber: "399682", description: "420MM APLIX 2D FLEX" },
        { componentNumber: "399703", description: "96MM APLIX 2D FLEX" },
        { componentNumber: "400060", description: "60MM MG4 12MM WIDE" },
        { componentNumber: "400180", description: "180MM MG4 12MM WIDE" },
        { componentNumber: "400200", description: "200MM MG4 12MM WIDE" },
        { componentNumber: "400220", description: "220MM MG4 12MM WIDE" },
        { componentNumber: "400240", description: "240MM MG4 12MM WIDE" },
        { componentNumber: "400260", description: "260MM MG4 12MM WIDE" },
        { componentNumber: "400320", description: "320MM MG4 12MM WIDE" }
      ];
    }
  }
}

export const storage = new DatabaseStorage();
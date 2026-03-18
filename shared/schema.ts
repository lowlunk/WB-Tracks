import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// ── Switches ───────────────────────────────────────────────
export const switches = pgTable("switches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  model: text("model"),
  ipAddress: text("ip_address"),
  location: text("location"),
  totalPorts: integer("total_ports").notNull().default(24),
  manageable: boolean("manageable").default(false),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertSwitchSchema = createInsertSchema(switches).omit({ id: true });
export type InsertSwitch = z.infer<typeof insertSwitchSchema>;
export type Switch = typeof switches.$inferSelect;

// ── Switch Ports ───────────────────────────────────────────
export const switchPorts = pgTable("switch_ports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  switchId: varchar("switch_id").notNull(),
  portNumber: integer("port_number").notNull(),
  label: text("label"),
  status: text("status").notNull().default("available"),
  vlan: text("vlan"),
  speed: text("speed"),
  connectedTo: text("connected_to"),
  notes: text("notes"),
});

export const insertSwitchPortSchema = createInsertSchema(switchPorts).omit({ id: true });
export type InsertSwitchPort = z.infer<typeof insertSwitchPortSchema>;
export type SwitchPort = typeof switchPorts.$inferSelect;

// ── Offices ────────────────────────────────────────────────
export const offices = pgTable("offices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  building: text("building"),
  floor: text("floor"),
  occupant: text("occupant"),
  department: text("department"),
  notes: text("notes"),
});

export const insertOfficeSchema = createInsertSchema(offices).omit({ id: true });
export type InsertOffice = z.infer<typeof insertOfficeSchema>;
export type Office = typeof offices.$inferSelect;

// ── Port Plates (wall plates in offices) ───────────────────
export const portPlates = pgTable("port_plates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").notNull(),
  plateLabel: text("plate_label").notNull(),
  portCount: integer("port_count").notNull().default(2),
  connectedSwitchId: varchar("connected_switch_id"),
  connectedPorts: text("connected_ports"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertPortPlateSchema = createInsertSchema(portPlates).omit({ id: true });
export type InsertPortPlate = z.infer<typeof insertPortPlateSchema>;
export type PortPlate = typeof portPlates.$inferSelect;

// ── WiFi Access Points ─────────────────────────────────────
export const wifiAPs = pgTable("wifi_aps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  model: text("model"),
  macAddress: text("mac_address"),
  ipAddress: text("ip_address"),
  location: text("location"),
  ssid: text("ssid"),
  band: text("band"),
  connectedSwitchId: varchar("connected_switch_id"),
  connectedPort: text("connected_port"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertWifiAPSchema = createInsertSchema(wifiAPs).omit({ id: true });
export type InsertWifiAP = z.infer<typeof insertWifiAPSchema>;
export type WifiAP = typeof wifiAPs.$inferSelect;

// ── Raspberry Pis ──────────────────────────────────────────
export const raspberryPis = pgTable("raspberry_pis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  model: text("model"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  location: text("location"),
  purpose: text("purpose"),
  osVersion: text("os_version"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertRaspberryPiSchema = createInsertSchema(raspberryPis).omit({ id: true });
export type InsertRaspberryPi = z.infer<typeof insertRaspberryPiSchema>;
export type RaspberryPi = typeof raspberryPis.$inferSelect;

// ── Server Rack ────────────────────────────────────────────
export const rackItems = pgTable("rack_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  model: text("model"),
  rackPosition: integer("rack_position").notNull(),
  rackUnits: integer("rack_units").notNull().default(1),
  ipAddress: text("ip_address"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertRackItemSchema = createInsertSchema(rackItems).omit({ id: true });
export type InsertRackItem = z.infer<typeof insertRackItemSchema>;
export type RackItem = typeof rackItems.$inferSelect;

// ── Cameras ────────────────────────────────────────────────
export const cameras = pgTable("cameras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  model: text("model"),
  ipAddress: text("ip_address"),
  location: text("location"),
  type: text("type"),
  resolution: text("resolution"),
  connectedNvrId: varchar("connected_nvr_id"),
  nvrChannel: integer("nvr_channel"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertCameraSchema = createInsertSchema(cameras).omit({ id: true });
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type Camera = typeof cameras.$inferSelect;

// ── NVRs ───────────────────────────────────────────────────
export const nvrs = pgTable("nvrs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  model: text("model"),
  ipAddress: text("ip_address"),
  location: text("location"),
  totalChannels: integer("total_channels").notNull().default(16),
  storageCapacity: text("storage_capacity"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertNvrSchema = createInsertSchema(nvrs).omit({ id: true });
export type InsertNvr = z.infer<typeof insertNvrSchema>;
export type Nvr = typeof nvrs.$inferSelect;

// ── Punch Clocks ───────────────────────────────────────────
export const punchClocks = pgTable("punch_clocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  model: text("model"),
  serialNumber: text("serial_number"),
  ipAddress: text("ip_address"),
  location: text("location"),
  connectionType: text("connection_type"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertPunchClockSchema = createInsertSchema(punchClocks).omit({ id: true });
export type InsertPunchClock = z.infer<typeof insertPunchClockSchema>;
export type PunchClock = typeof punchClocks.$inferSelect;

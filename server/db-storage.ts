import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  switches, switchPorts, offices, portPlates, wifiAPs,
  raspberryPis, rackItems, cameras, nvrs, punchClocks,
} from "@shared/schema";
import type {
  Switch, InsertSwitch,
  SwitchPort, InsertSwitchPort,
  Office, InsertOffice,
  PortPlate, InsertPortPlate,
  WifiAP, InsertWifiAP,
  RaspberryPi, InsertRaspberryPi,
  RackItem, InsertRackItem,
  Camera, InsertCamera,
  Nvr, InsertNvr,
  PunchClock, InsertPunchClock,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // ── Switches ──────────────────────────────────────────────
  async getSwitches(): Promise<Switch[]> {
    return db.select().from(switches);
  }
  async getSwitch(id: string): Promise<Switch | undefined> {
    const rows = await db.select().from(switches).where(eq(switches.id, id));
    return rows[0];
  }
  async createSwitch(s: InsertSwitch): Promise<Switch> {
    const rows = await db.insert(switches).values(s).returning();
    return rows[0];
  }
  async updateSwitch(id: string, s: Partial<InsertSwitch>): Promise<Switch | undefined> {
    const rows = await db.update(switches).set(s).where(eq(switches.id, id)).returning();
    return rows[0];
  }
  async deleteSwitch(id: string): Promise<boolean> {
    const rows = await db.delete(switches).where(eq(switches.id, id)).returning();
    return rows.length > 0;
  }

  // ── Switch Ports ──────────────────────────────────────────
  async getSwitchPorts(switchId: string): Promise<SwitchPort[]> {
    return db.select().from(switchPorts).where(eq(switchPorts.switchId, switchId));
  }
  async createSwitchPort(p: InsertSwitchPort): Promise<SwitchPort> {
    const rows = await db.insert(switchPorts).values(p).returning();
    return rows[0];
  }
  async updateSwitchPort(id: string, p: Partial<InsertSwitchPort>): Promise<SwitchPort | undefined> {
    const rows = await db.update(switchPorts).set(p).where(eq(switchPorts.id, id)).returning();
    return rows[0];
  }
  async deleteSwitchPort(id: string): Promise<boolean> {
    const rows = await db.delete(switchPorts).where(eq(switchPorts.id, id)).returning();
    return rows.length > 0;
  }

  // ── Offices ───────────────────────────────────────────────
  async getOffices(): Promise<Office[]> {
    return db.select().from(offices);
  }
  async getOffice(id: string): Promise<Office | undefined> {
    const rows = await db.select().from(offices).where(eq(offices.id, id));
    return rows[0];
  }
  async createOffice(o: InsertOffice): Promise<Office> {
    const rows = await db.insert(offices).values(o).returning();
    return rows[0];
  }
  async updateOffice(id: string, o: Partial<InsertOffice>): Promise<Office | undefined> {
    const rows = await db.update(offices).set(o).where(eq(offices.id, id)).returning();
    return rows[0];
  }
  async deleteOffice(id: string): Promise<boolean> {
    const rows = await db.delete(offices).where(eq(offices.id, id)).returning();
    return rows.length > 0;
  }

  // ── Port Plates ───────────────────────────────────────────
  async getPortPlates(officeId?: string): Promise<PortPlate[]> {
    if (officeId) {
      return db.select().from(portPlates).where(eq(portPlates.officeId, officeId));
    }
    return db.select().from(portPlates);
  }
  async createPortPlate(p: InsertPortPlate): Promise<PortPlate> {
    const rows = await db.insert(portPlates).values(p).returning();
    return rows[0];
  }
  async updatePortPlate(id: string, p: Partial<InsertPortPlate>): Promise<PortPlate | undefined> {
    const rows = await db.update(portPlates).set(p).where(eq(portPlates.id, id)).returning();
    return rows[0];
  }
  async deletePortPlate(id: string): Promise<boolean> {
    const rows = await db.delete(portPlates).where(eq(portPlates.id, id)).returning();
    return rows.length > 0;
  }

  // ── WiFi APs ──────────────────────────────────────────────
  async getWifiAPs(): Promise<WifiAP[]> {
    return db.select().from(wifiAPs);
  }
  async createWifiAP(ap: InsertWifiAP): Promise<WifiAP> {
    const rows = await db.insert(wifiAPs).values(ap).returning();
    return rows[0];
  }
  async updateWifiAP(id: string, ap: Partial<InsertWifiAP>): Promise<WifiAP | undefined> {
    const rows = await db.update(wifiAPs).set(ap).where(eq(wifiAPs.id, id)).returning();
    return rows[0];
  }
  async deleteWifiAP(id: string): Promise<boolean> {
    const rows = await db.delete(wifiAPs).where(eq(wifiAPs.id, id)).returning();
    return rows.length > 0;
  }

  // ── Raspberry Pis ─────────────────────────────────────────
  async getRaspberryPis(): Promise<RaspberryPi[]> {
    return db.select().from(raspberryPis);
  }
  async createRaspberryPi(pi: InsertRaspberryPi): Promise<RaspberryPi> {
    const rows = await db.insert(raspberryPis).values(pi).returning();
    return rows[0];
  }
  async updateRaspberryPi(id: string, pi: Partial<InsertRaspberryPi>): Promise<RaspberryPi | undefined> {
    const rows = await db.update(raspberryPis).set(pi).where(eq(raspberryPis.id, id)).returning();
    return rows[0];
  }
  async deleteRaspberryPi(id: string): Promise<boolean> {
    const rows = await db.delete(raspberryPis).where(eq(raspberryPis.id, id)).returning();
    return rows.length > 0;
  }

  // ── Rack Items ────────────────────────────────────────────
  async getRackItems(): Promise<RackItem[]> {
    return db.select().from(rackItems);
  }
  async createRackItem(r: InsertRackItem): Promise<RackItem> {
    const rows = await db.insert(rackItems).values(r).returning();
    return rows[0];
  }
  async updateRackItem(id: string, r: Partial<InsertRackItem>): Promise<RackItem | undefined> {
    const rows = await db.update(rackItems).set(r).where(eq(rackItems.id, id)).returning();
    return rows[0];
  }
  async deleteRackItem(id: string): Promise<boolean> {
    const rows = await db.delete(rackItems).where(eq(rackItems.id, id)).returning();
    return rows.length > 0;
  }

  // ── Cameras ───────────────────────────────────────────────
  async getCameras(): Promise<Camera[]> {
    return db.select().from(cameras);
  }
  async createCamera(c: InsertCamera): Promise<Camera> {
    const rows = await db.insert(cameras).values(c).returning();
    return rows[0];
  }
  async updateCamera(id: string, c: Partial<InsertCamera>): Promise<Camera | undefined> {
    const rows = await db.update(cameras).set(c).where(eq(cameras.id, id)).returning();
    return rows[0];
  }
  async deleteCamera(id: string): Promise<boolean> {
    const rows = await db.delete(cameras).where(eq(cameras.id, id)).returning();
    return rows.length > 0;
  }

  // ── NVRs ──────────────────────────────────────────────────
  async getNvrs(): Promise<Nvr[]> {
    return db.select().from(nvrs);
  }
  async createNvr(n: InsertNvr): Promise<Nvr> {
    const rows = await db.insert(nvrs).values(n).returning();
    return rows[0];
  }
  async updateNvr(id: string, n: Partial<InsertNvr>): Promise<Nvr | undefined> {
    const rows = await db.update(nvrs).set(n).where(eq(nvrs.id, id)).returning();
    return rows[0];
  }
  async deleteNvr(id: string): Promise<boolean> {
    const rows = await db.delete(nvrs).where(eq(nvrs.id, id)).returning();
    return rows.length > 0;
  }

  // ── Punch Clocks ──────────────────────────────────────────
  async getPunchClocks(): Promise<PunchClock[]> {
    return db.select().from(punchClocks);
  }
  async createPunchClock(pc: InsertPunchClock): Promise<PunchClock> {
    const rows = await db.insert(punchClocks).values(pc).returning();
    return rows[0];
  }
  async updatePunchClock(id: string, pc: Partial<InsertPunchClock>): Promise<PunchClock | undefined> {
    const rows = await db.update(punchClocks).set(pc).where(eq(punchClocks.id, id)).returning();
    return rows[0];
  }
  async deletePunchClock(id: string): Promise<boolean> {
    const rows = await db.delete(punchClocks).where(eq(punchClocks.id, id)).returning();
    return rows.length > 0;
  }
}

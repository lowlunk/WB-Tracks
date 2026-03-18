import { randomUUID } from "crypto";
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

export interface IStorage {
  // Switches
  getSwitches(): Promise<Switch[]>;
  getSwitch(id: string): Promise<Switch | undefined>;
  createSwitch(s: InsertSwitch): Promise<Switch>;
  updateSwitch(id: string, s: Partial<InsertSwitch>): Promise<Switch | undefined>;
  deleteSwitch(id: string): Promise<boolean>;

  // Switch Ports
  getSwitchPorts(switchId: string): Promise<SwitchPort[]>;
  createSwitchPort(p: InsertSwitchPort): Promise<SwitchPort>;
  updateSwitchPort(id: string, p: Partial<InsertSwitchPort>): Promise<SwitchPort | undefined>;
  deleteSwitchPort(id: string): Promise<boolean>;

  // Offices
  getOffices(): Promise<Office[]>;
  getOffice(id: string): Promise<Office | undefined>;
  createOffice(o: InsertOffice): Promise<Office>;
  updateOffice(id: string, o: Partial<InsertOffice>): Promise<Office | undefined>;
  deleteOffice(id: string): Promise<boolean>;

  // Port Plates
  getPortPlates(officeId?: string): Promise<PortPlate[]>;
  createPortPlate(p: InsertPortPlate): Promise<PortPlate>;
  updatePortPlate(id: string, p: Partial<InsertPortPlate>): Promise<PortPlate | undefined>;
  deletePortPlate(id: string): Promise<boolean>;

  // WiFi APs
  getWifiAPs(): Promise<WifiAP[]>;
  createWifiAP(ap: InsertWifiAP): Promise<WifiAP>;
  updateWifiAP(id: string, ap: Partial<InsertWifiAP>): Promise<WifiAP | undefined>;
  deleteWifiAP(id: string): Promise<boolean>;

  // Raspberry Pis
  getRaspberryPis(): Promise<RaspberryPi[]>;
  createRaspberryPi(pi: InsertRaspberryPi): Promise<RaspberryPi>;
  updateRaspberryPi(id: string, pi: Partial<InsertRaspberryPi>): Promise<RaspberryPi | undefined>;
  deleteRaspberryPi(id: string): Promise<boolean>;

  // Rack Items
  getRackItems(): Promise<RackItem[]>;
  createRackItem(r: InsertRackItem): Promise<RackItem>;
  updateRackItem(id: string, r: Partial<InsertRackItem>): Promise<RackItem | undefined>;
  deleteRackItem(id: string): Promise<boolean>;

  // Cameras
  getCameras(): Promise<Camera[]>;
  createCamera(c: InsertCamera): Promise<Camera>;
  updateCamera(id: string, c: Partial<InsertCamera>): Promise<Camera | undefined>;
  deleteCamera(id: string): Promise<boolean>;

  // NVRs
  getNvrs(): Promise<Nvr[]>;
  createNvr(n: InsertNvr): Promise<Nvr>;
  updateNvr(id: string, n: Partial<InsertNvr>): Promise<Nvr | undefined>;
  deleteNvr(id: string): Promise<boolean>;

  // Punch Clocks
  getPunchClocks(): Promise<PunchClock[]>;
  createPunchClock(pc: InsertPunchClock): Promise<PunchClock>;
  updatePunchClock(id: string, pc: Partial<InsertPunchClock>): Promise<PunchClock | undefined>;
  deletePunchClock(id: string): Promise<boolean>;
}

// Generic CRUD helper for in-memory maps
function createCrud<T extends { id: string }, I>(map: Map<string, T>) {
  return {
    getAll: async (): Promise<T[]> => Array.from(map.values()),
    get: async (id: string): Promise<T | undefined> => map.get(id),
    create: async (data: I): Promise<T> => {
      const id = randomUUID();
      const item = { ...data, id } as unknown as T;
      map.set(id, item);
      return item;
    },
    update: async (id: string, data: Partial<I>): Promise<T | undefined> => {
      const existing = map.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...data };
      map.set(id, updated);
      return updated;
    },
    remove: async (id: string): Promise<boolean> => map.delete(id),
  };
}

export class MemStorage implements IStorage {
  private switchesMap = new Map<string, Switch>();
  private switchPortsMap = new Map<string, SwitchPort>();
  private officesMap = new Map<string, Office>();
  private portPlatesMap = new Map<string, PortPlate>();
  private wifiAPsMap = new Map<string, WifiAP>();
  private raspberryPisMap = new Map<string, RaspberryPi>();
  private rackItemsMap = new Map<string, RackItem>();
  private camerasMap = new Map<string, Camera>();
  private nvrsMap = new Map<string, Nvr>();
  private punchClocksMap = new Map<string, PunchClock>();

  private switchCrud = createCrud<Switch, InsertSwitch>(this.switchesMap);
  private portCrud = createCrud<SwitchPort, InsertSwitchPort>(this.switchPortsMap);
  private officeCrud = createCrud<Office, InsertOffice>(this.officesMap);
  private plateCrud = createCrud<PortPlate, InsertPortPlate>(this.portPlatesMap);
  private apCrud = createCrud<WifiAP, InsertWifiAP>(this.wifiAPsMap);
  private piCrud = createCrud<RaspberryPi, InsertRaspberryPi>(this.raspberryPisMap);
  private rackCrud = createCrud<RackItem, InsertRackItem>(this.rackItemsMap);
  private cameraCrud = createCrud<Camera, InsertCamera>(this.camerasMap);
  private nvrCrud = createCrud<Nvr, InsertNvr>(this.nvrsMap);
  private punchClockCrud = createCrud<PunchClock, InsertPunchClock>(this.punchClocksMap);

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed some demo switches
    const sw1: Switch = { id: "sw-1", name: "Core Switch 1", model: "Cisco SG350-28", ipAddress: "10.0.1.1", location: "Server Room", totalPorts: 28, manageable: true, status: "active", notes: "Main core switch" };
    const sw2: Switch = { id: "sw-2", name: "Floor 1 Switch", model: "Cisco SG250-26", ipAddress: "10.0.1.2", location: "IDF Closet Floor 1", totalPorts: 26, manageable: true, status: "active", notes: null };
    const sw3: Switch = { id: "sw-3", name: "Floor 2 Switch", model: "Netgear GS324", ipAddress: "10.0.1.3", location: "IDF Closet Floor 2", totalPorts: 24, manageable: false, status: "active", notes: null };
    const sw4: Switch = { id: "sw-4", name: "Lab Switch", model: "TP-Link TL-SG1016", ipAddress: null, location: "Lab", totalPorts: 16, manageable: false, status: "warning", notes: "Losing ports intermittently" };
    [sw1, sw2, sw3, sw4].forEach(s => this.switchesMap.set(s.id, s));

    // Seed some ports for Core Switch 1
    for (let i = 1; i <= 28; i++) {
      const port: SwitchPort = {
        id: `sp-1-${i}`,
        switchId: "sw-1",
        portNumber: i,
        label: i <= 4 ? `Uplink ${i}` : i <= 10 ? `Server ${i - 4}` : null,
        status: i <= 20 ? "in_use" : i <= 24 ? "available" : "reserved",
        vlan: i <= 4 ? "VLAN 1" : i <= 10 ? "VLAN 10" : "VLAN 20",
        speed: i <= 4 ? "1Gbps" : "100Mbps",
        connectedTo: i <= 4 ? `Uplink to ISP/Router Port ${i}` : i <= 10 ? `Server ${i - 4}` : null,
        notes: null,
      };
      this.switchPortsMap.set(port.id, port);
    }

    // Seed offices
    const offices: Office[] = [
      { id: "off-1", name: "Office 101", building: "Main", floor: "1", occupant: "John Smith", department: "Engineering", notes: null },
      { id: "off-2", name: "Office 102", building: "Main", floor: "1", occupant: "Jane Doe", department: "HR", notes: null },
      { id: "off-3", name: "Office 201", building: "Main", floor: "2", occupant: "Bob Wilson", department: "IT", notes: null },
      { id: "off-4", name: "Conference Room A", building: "Main", floor: "1", occupant: null, department: "Shared", notes: "Large conf room" },
      { id: "off-5", name: "Lab", building: "Main", floor: "1", occupant: null, department: "Engineering", notes: null },
    ];
    offices.forEach(o => this.officesMap.set(o.id, o));

    // Seed port plates
    const plates: PortPlate[] = [
      { id: "pp-1", officeId: "off-1", plateLabel: "PP-101A", portCount: 2, connectedSwitchId: "sw-2", connectedPorts: "1,2", status: "active", notes: null },
      { id: "pp-2", officeId: "off-2", plateLabel: "PP-102A", portCount: 2, connectedSwitchId: "sw-2", connectedPorts: "3,4", status: "active", notes: null },
      { id: "pp-3", officeId: "off-3", plateLabel: "PP-201A", portCount: 4, connectedSwitchId: "sw-3", connectedPorts: "1,2,3,4", status: "active", notes: null },
      { id: "pp-4", officeId: "off-4", plateLabel: "PP-CONF-A", portCount: 6, connectedSwitchId: "sw-2", connectedPorts: "5,6,7,8,9,10", status: "active", notes: "Conference room needs all ports" },
    ];
    plates.forEach(p => this.portPlatesMap.set(p.id, p));

    // Seed WiFi APs
    const aps: WifiAP[] = [
      { id: "ap-1", name: "AP-Lobby", model: "Ubiquiti U6-Pro", macAddress: "AA:BB:CC:DD:EE:01", ipAddress: "10.0.2.1", location: "Lobby Ceiling", ssid: "WB-Corp", band: "2.4/5 GHz", connectedSwitchId: "sw-1", connectedPort: "11", status: "active", notes: null },
      { id: "ap-2", name: "AP-Floor1", model: "Ubiquiti U6-Pro", macAddress: "AA:BB:CC:DD:EE:02", ipAddress: "10.0.2.2", location: "Floor 1 Hallway", ssid: "WB-Corp", band: "2.4/5 GHz", connectedSwitchId: "sw-1", connectedPort: "12", status: "active", notes: null },
      { id: "ap-3", name: "AP-Floor2", model: "Ubiquiti U6-LR", macAddress: "AA:BB:CC:DD:EE:03", ipAddress: "10.0.2.3", location: "Floor 2 Open Area", ssid: "WB-Corp", band: "2.4/5/6 GHz", connectedSwitchId: "sw-1", connectedPort: "13", status: "active", notes: "WiFi 6E" },
      { id: "ap-4", name: "AP-Warehouse", model: "Ubiquiti U6-Mesh", macAddress: "AA:BB:CC:DD:EE:04", ipAddress: "10.0.2.4", location: "Warehouse", ssid: "WB-Industrial", band: "2.4/5 GHz", connectedSwitchId: "sw-1", connectedPort: "14", status: "warning", notes: "Weak signal in far corner" },
    ];
    aps.forEach(a => this.wifiAPsMap.set(a.id, a));

    // Seed Raspberry Pis
    const pis: RaspberryPi[] = [
      { id: "pi-1", name: "Pi-Display-Lobby", model: "Raspberry Pi 4B 4GB", ipAddress: "10.0.3.1", macAddress: "DD:EE:FF:00:11:01", location: "Lobby", purpose: "Digital Signage", osVersion: "Raspberry Pi OS Bullseye", status: "active", notes: null },
      { id: "pi-2", name: "Pi-Sensor-Lab", model: "Raspberry Pi 4B 2GB", ipAddress: "10.0.3.2", macAddress: "DD:EE:FF:00:11:02", location: "Lab", purpose: "Temp/Humidity Monitor", osVersion: "Raspberry Pi OS Bullseye", status: "active", notes: "Reports to Grafana" },
      { id: "pi-3", name: "Pi-PiHole", model: "Raspberry Pi 3B+", ipAddress: "10.0.3.3", macAddress: "DD:EE:FF:00:11:03", location: "Server Room", purpose: "Pi-hole DNS", osVersion: "Pi-hole v5.x", status: "active", notes: "Primary DNS" },
    ];
    pis.forEach(p => this.raspberryPisMap.set(p.id, p));

    // Seed Rack Items
    const rackItems: RackItem[] = [
      { id: "ri-1", name: "Patch Panel 1", type: "Patch Panel", model: "48-Port Cat6", rackPosition: 1, rackUnits: 1, ipAddress: null, status: "active", notes: null },
      { id: "ri-2", name: "Core Switch 1", type: "Switch", model: "Cisco SG350-28", rackPosition: 2, rackUnits: 1, ipAddress: "10.0.1.1", status: "active", notes: null },
      { id: "ri-3", name: "UPS Battery", type: "UPS", model: "APC Smart-UPS 1500", rackPosition: 3, rackUnits: 2, ipAddress: null, status: "active", notes: "Battery replaced 2025-01" },
      { id: "ri-4", name: "NVR Unit", type: "NVR", model: "Hikvision DS-7616", rackPosition: 5, rackUnits: 2, ipAddress: "10.0.4.1", status: "active", notes: null },
      { id: "ri-5", name: "File Server", type: "Server", model: "Dell PowerEdge T340", rackPosition: 7, rackUnits: 4, ipAddress: "10.0.5.1", status: "active", notes: "Windows Server 2022" },
      { id: "ri-6", name: "Cable Management", type: "Cable Management", model: "1U Horizontal", rackPosition: 11, rackUnits: 1, ipAddress: null, status: "active", notes: null },
    ];
    rackItems.forEach(r => this.rackItemsMap.set(r.id, r));

    // Seed Cameras
    const cams: Camera[] = [
      { id: "cam-1", name: "CAM-Entrance", model: "Hikvision DS-2CD2143", ipAddress: "10.0.6.1", location: "Main Entrance", type: "Dome", resolution: "4MP", connectedNvrId: "nvr-1", nvrChannel: 1, status: "active", notes: null },
      { id: "cam-2", name: "CAM-Parking-N", model: "Hikvision DS-2CD2T43", ipAddress: "10.0.6.2", location: "Parking Lot North", type: "Bullet", resolution: "4MP", connectedNvrId: "nvr-1", nvrChannel: 2, status: "active", notes: null },
      { id: "cam-3", name: "CAM-Warehouse", model: "Hikvision DS-2CD2143", ipAddress: "10.0.6.3", location: "Warehouse Floor", type: "Dome", resolution: "4MP", connectedNvrId: "nvr-1", nvrChannel: 3, status: "active", notes: null },
      { id: "cam-4", name: "CAM-Lobby", model: "Hikvision DS-2CD2143", ipAddress: "10.0.6.4", location: "Lobby", type: "Dome", resolution: "4MP", connectedNvrId: "nvr-1", nvrChannel: 4, status: "active", notes: null },
      { id: "cam-5", name: "CAM-ServerRoom", model: "Hikvision DS-2CD2143", ipAddress: "10.0.6.5", location: "Server Room", type: "Dome", resolution: "2MP", connectedNvrId: "nvr-1", nvrChannel: 5, status: "offline", notes: "Needs replacement — lens foggy" },
    ];
    cams.forEach(c => this.camerasMap.set(c.id, c));

    // Seed NVRs
    const nvrs: Nvr[] = [
      { id: "nvr-1", name: "NVR-Main", model: "Hikvision DS-7616NI", ipAddress: "10.0.4.1", location: "Server Room", totalChannels: 16, storageCapacity: "8TB", status: "active", notes: "5 of 16 channels used" },
    ];
    nvrs.forEach(n => this.nvrsMap.set(n.id, n));

    // Seed Punch Clocks
    const clocks: PunchClock[] = [
      { id: "pc-1", name: "Clock-MainEntrance", model: "uAttend BN6500", serialNumber: "BN6500-001", ipAddress: "10.0.7.1", location: "Main Entrance", connectionType: "Ethernet", status: "active", notes: null },
      { id: "pc-2", name: "Clock-Warehouse", model: "uAttend BN6500", serialNumber: "BN6500-002", ipAddress: "10.0.7.2", location: "Warehouse Entrance", connectionType: "WiFi", status: "active", notes: null },
      { id: "pc-3", name: "Clock-BackDoor", model: "uAttend CB6500", serialNumber: "CB6500-001", ipAddress: null, location: "Back Door", connectionType: "Cellular", status: "warning", notes: "Intermittent connection" },
    ];
    clocks.forEach(c => this.punchClocksMap.set(c.id, c));
  }

  // Switches
  async getSwitches() { return this.switchCrud.getAll(); }
  async getSwitch(id: string) { return this.switchCrud.get(id); }
  async createSwitch(s: InsertSwitch) { return this.switchCrud.create(s); }
  async updateSwitch(id: string, s: Partial<InsertSwitch>) { return this.switchCrud.update(id, s); }
  async deleteSwitch(id: string) { return this.switchCrud.remove(id); }

  // Switch Ports
  async getSwitchPorts(switchId: string) {
    return Array.from(this.switchPortsMap.values()).filter(p => p.switchId === switchId);
  }
  async createSwitchPort(p: InsertSwitchPort) { return this.portCrud.create(p); }
  async updateSwitchPort(id: string, p: Partial<InsertSwitchPort>) { return this.portCrud.update(id, p); }
  async deleteSwitchPort(id: string) { return this.portCrud.remove(id); }

  // Offices
  async getOffices() { return this.officeCrud.getAll(); }
  async getOffice(id: string) { return this.officeCrud.get(id); }
  async createOffice(o: InsertOffice) { return this.officeCrud.create(o); }
  async updateOffice(id: string, o: Partial<InsertOffice>) { return this.officeCrud.update(id, o); }
  async deleteOffice(id: string) { return this.officeCrud.remove(id); }

  // Port Plates
  async getPortPlates(officeId?: string) {
    const all = await this.plateCrud.getAll();
    return officeId ? all.filter(p => p.officeId === officeId) : all;
  }
  async createPortPlate(p: InsertPortPlate) { return this.plateCrud.create(p); }
  async updatePortPlate(id: string, p: Partial<InsertPortPlate>) { return this.plateCrud.update(id, p); }
  async deletePortPlate(id: string) { return this.plateCrud.remove(id); }

  // WiFi APs
  async getWifiAPs() { return this.apCrud.getAll(); }
  async createWifiAP(ap: InsertWifiAP) { return this.apCrud.create(ap); }
  async updateWifiAP(id: string, ap: Partial<InsertWifiAP>) { return this.apCrud.update(id, ap); }
  async deleteWifiAP(id: string) { return this.apCrud.remove(id); }

  // Raspberry Pis
  async getRaspberryPis() { return this.piCrud.getAll(); }
  async createRaspberryPi(pi: InsertRaspberryPi) { return this.piCrud.create(pi); }
  async updateRaspberryPi(id: string, pi: Partial<InsertRaspberryPi>) { return this.piCrud.update(id, pi); }
  async deleteRaspberryPi(id: string) { return this.piCrud.remove(id); }

  // Rack Items
  async getRackItems() { return this.rackCrud.getAll(); }
  async createRackItem(r: InsertRackItem) { return this.rackCrud.create(r); }
  async updateRackItem(id: string, r: Partial<InsertRackItem>) { return this.rackCrud.update(id, r); }
  async deleteRackItem(id: string) { return this.rackCrud.remove(id); }

  // Cameras
  async getCameras() { return this.cameraCrud.getAll(); }
  async createCamera(c: InsertCamera) { return this.cameraCrud.create(c); }
  async updateCamera(id: string, c: Partial<InsertCamera>) { return this.cameraCrud.update(id, c); }
  async deleteCamera(id: string) { return this.cameraCrud.remove(id); }

  // NVRs
  async getNvrs() { return this.nvrCrud.getAll(); }
  async createNvr(n: InsertNvr) { return this.nvrCrud.create(n); }
  async updateNvr(id: string, n: Partial<InsertNvr>) { return this.nvrCrud.update(id, n); }
  async deleteNvr(id: string) { return this.nvrCrud.remove(id); }

  // Punch Clocks
  async getPunchClocks() { return this.punchClockCrud.getAll(); }
  async createPunchClock(pc: InsertPunchClock) { return this.punchClockCrud.create(pc); }
  async updatePunchClock(id: string, pc: Partial<InsertPunchClock>) { return this.punchClockCrud.update(id, pc); }
  async deletePunchClock(id: string) { return this.punchClockCrud.remove(id); }
}

export const storage = new MemStorage();

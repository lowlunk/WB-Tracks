import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Switches ──────────────────────────────────────────
  app.get("/api/switches", async (_req, res) => {
    res.json(await storage.getSwitches());
  });
  app.get("/api/switches/:id", async (req, res) => {
    const s = await storage.getSwitch(req.params.id);
    s ? res.json(s) : res.status(404).json({ error: "Not found" });
  });
  app.post("/api/switches", async (req, res) => {
    const s = await storage.createSwitch(req.body);
    res.status(201).json(s);
  });
  app.patch("/api/switches/:id", async (req, res) => {
    const s = await storage.updateSwitch(req.params.id, req.body);
    s ? res.json(s) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/switches/:id", async (req, res) => {
    await storage.deleteSwitch(req.params.id);
    res.status(204).end();
  });

  // ── Switch Ports ──────────────────────────────────────
  app.get("/api/switches/:id/ports", async (req, res) => {
    res.json(await storage.getSwitchPorts(req.params.id));
  });
  app.post("/api/switch-ports", async (req, res) => {
    const p = await storage.createSwitchPort(req.body);
    res.status(201).json(p);
  });
  app.patch("/api/switch-ports/:id", async (req, res) => {
    const p = await storage.updateSwitchPort(req.params.id, req.body);
    p ? res.json(p) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/switch-ports/:id", async (req, res) => {
    await storage.deleteSwitchPort(req.params.id);
    res.status(204).end();
  });

  // ── Offices ───────────────────────────────────────────
  app.get("/api/offices", async (_req, res) => {
    res.json(await storage.getOffices());
  });
  app.post("/api/offices", async (req, res) => {
    const o = await storage.createOffice(req.body);
    res.status(201).json(o);
  });
  app.patch("/api/offices/:id", async (req, res) => {
    const o = await storage.updateOffice(req.params.id, req.body);
    o ? res.json(o) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/offices/:id", async (req, res) => {
    await storage.deleteOffice(req.params.id);
    res.status(204).end();
  });

  // ── Port Plates ───────────────────────────────────────
  app.get("/api/port-plates", async (req, res) => {
    const officeId = req.query.officeId as string | undefined;
    res.json(await storage.getPortPlates(officeId));
  });
  app.post("/api/port-plates", async (req, res) => {
    const p = await storage.createPortPlate(req.body);
    res.status(201).json(p);
  });
  app.patch("/api/port-plates/:id", async (req, res) => {
    const p = await storage.updatePortPlate(req.params.id, req.body);
    p ? res.json(p) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/port-plates/:id", async (req, res) => {
    await storage.deletePortPlate(req.params.id);
    res.status(204).end();
  });

  // ── WiFi APs ──────────────────────────────────────────
  app.get("/api/wifi-aps", async (_req, res) => {
    res.json(await storage.getWifiAPs());
  });
  app.post("/api/wifi-aps", async (req, res) => {
    const ap = await storage.createWifiAP(req.body);
    res.status(201).json(ap);
  });
  app.patch("/api/wifi-aps/:id", async (req, res) => {
    const ap = await storage.updateWifiAP(req.params.id, req.body);
    ap ? res.json(ap) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/wifi-aps/:id", async (req, res) => {
    await storage.deleteWifiAP(req.params.id);
    res.status(204).end();
  });

  // ── Raspberry Pis ─────────────────────────────────────
  app.get("/api/raspberry-pis", async (_req, res) => {
    res.json(await storage.getRaspberryPis());
  });
  app.post("/api/raspberry-pis", async (req, res) => {
    const pi = await storage.createRaspberryPi(req.body);
    res.status(201).json(pi);
  });
  app.patch("/api/raspberry-pis/:id", async (req, res) => {
    const pi = await storage.updateRaspberryPi(req.params.id, req.body);
    pi ? res.json(pi) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/raspberry-pis/:id", async (req, res) => {
    await storage.deleteRaspberryPi(req.params.id);
    res.status(204).end();
  });

  // ── Rack Items ────────────────────────────────────────
  app.get("/api/rack-items", async (_req, res) => {
    res.json(await storage.getRackItems());
  });
  app.post("/api/rack-items", async (req, res) => {
    const r = await storage.createRackItem(req.body);
    res.status(201).json(r);
  });
  app.patch("/api/rack-items/:id", async (req, res) => {
    const r = await storage.updateRackItem(req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/rack-items/:id", async (req, res) => {
    await storage.deleteRackItem(req.params.id);
    res.status(204).end();
  });

  // ── Cameras ───────────────────────────────────────────
  app.get("/api/cameras", async (_req, res) => {
    res.json(await storage.getCameras());
  });
  app.post("/api/cameras", async (req, res) => {
    const c = await storage.createCamera(req.body);
    res.status(201).json(c);
  });
  app.patch("/api/cameras/:id", async (req, res) => {
    const c = await storage.updateCamera(req.params.id, req.body);
    c ? res.json(c) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/cameras/:id", async (req, res) => {
    await storage.deleteCamera(req.params.id);
    res.status(204).end();
  });

  // ── NVRs ──────────────────────────────────────────────
  app.get("/api/nvrs", async (_req, res) => {
    res.json(await storage.getNvrs());
  });
  app.post("/api/nvrs", async (req, res) => {
    const n = await storage.createNvr(req.body);
    res.status(201).json(n);
  });
  app.patch("/api/nvrs/:id", async (req, res) => {
    const n = await storage.updateNvr(req.params.id, req.body);
    n ? res.json(n) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/nvrs/:id", async (req, res) => {
    await storage.deleteNvr(req.params.id);
    res.status(204).end();
  });

  // ── Punch Clocks ──────────────────────────────────────
  app.get("/api/punch-clocks", async (_req, res) => {
    res.json(await storage.getPunchClocks());
  });
  app.post("/api/punch-clocks", async (req, res) => {
    const pc = await storage.createPunchClock(req.body);
    res.status(201).json(pc);
  });
  app.patch("/api/punch-clocks/:id", async (req, res) => {
    const pc = await storage.updatePunchClock(req.params.id, req.body);
    pc ? res.json(pc) : res.status(404).json({ error: "Not found" });
  });
  app.delete("/api/punch-clocks/:id", async (req, res) => {
    await storage.deletePunchClock(req.params.id);
    res.status(204).end();
  });

  // ── Dashboard aggregation ─────────────────────────────
  app.get("/api/dashboard", async (_req, res) => {
    const [switches, offices, aps, pis, rackItems, cameras, nvrs, clocks, plates] = await Promise.all([
      storage.getSwitches(),
      storage.getOffices(),
      storage.getWifiAPs(),
      storage.getRaspberryPis(),
      storage.getRackItems(),
      storage.getCameras(),
      storage.getNvrs(),
      storage.getPunchClocks(),
      storage.getPortPlates(),
    ]);

    const allAssets = [
      ...switches.map(s => ({ status: s.status })),
      ...aps.map(a => ({ status: a.status })),
      ...pis.map(p => ({ status: p.status })),
      ...cameras.map(c => ({ status: c.status })),
      ...nvrs.map(n => ({ status: n.status })),
      ...clocks.map(c => ({ status: c.status })),
    ];

    res.json({
      counts: {
        switches: switches.length,
        offices: offices.length,
        wifiAPs: aps.length,
        raspberryPis: pis.length,
        rackItems: rackItems.length,
        cameras: cameras.length,
        nvrs: nvrs.length,
        punchClocks: clocks.length,
        portPlates: plates.length,
      },
      statusBreakdown: {
        active: allAssets.filter(a => a.status === "active").length,
        warning: allAssets.filter(a => a.status === "warning").length,
        offline: allAssets.filter(a => a.status === "offline").length,
      },
      recentIssues: [
        ...switches.filter(s => s.status !== "active").map(s => ({ type: "Switch", name: s.name, status: s.status, notes: s.notes })),
        ...aps.filter(a => a.status !== "active").map(a => ({ type: "WiFi AP", name: a.name, status: a.status, notes: a.notes })),
        ...cameras.filter(c => c.status !== "active").map(c => ({ type: "Camera", name: c.name, status: c.status, notes: c.notes })),
        ...clocks.filter(c => c.status !== "active").map(c => ({ type: "Punch Clock", name: c.name, status: c.status, notes: c.notes })),
      ],
    });
  });

  return httpServer;
}

import { pool } from "./db";

/**
 * Creates all tables if they don't exist (idempotent).
 * Also seeds demo data if tables are empty.
 */
export async function migrateAndSeed() {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS switches (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        model TEXT,
        ip_address TEXT,
        location TEXT,
        total_ports INTEGER NOT NULL DEFAULT 24,
        manageable BOOLEAN DEFAULT false,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS switch_ports (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        switch_id VARCHAR NOT NULL,
        port_number INTEGER NOT NULL,
        label TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        vlan TEXT,
        speed TEXT,
        connected_to TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS offices (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        building TEXT,
        floor TEXT,
        occupant TEXT,
        department TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS port_plates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        office_id VARCHAR NOT NULL,
        plate_label TEXT NOT NULL,
        port_count INTEGER NOT NULL DEFAULT 2,
        connected_switch_id VARCHAR,
        connected_ports TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS wifi_aps (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        model TEXT,
        mac_address TEXT,
        ip_address TEXT,
        location TEXT,
        ssid TEXT,
        band TEXT,
        connected_switch_id VARCHAR,
        connected_port TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS raspberry_pis (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        model TEXT,
        ip_address TEXT,
        mac_address TEXT,
        location TEXT,
        purpose TEXT,
        os_version TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS rack_items (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        model TEXT,
        rack_position INTEGER NOT NULL,
        rack_units INTEGER NOT NULL DEFAULT 1,
        ip_address TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS cameras (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        model TEXT,
        ip_address TEXT,
        location TEXT,
        type TEXT,
        resolution TEXT,
        connected_nvr_id VARCHAR,
        nvr_channel INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS nvrs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        model TEXT,
        ip_address TEXT,
        location TEXT,
        total_channels INTEGER NOT NULL DEFAULT 16,
        storage_capacity TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS punch_clocks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        model TEXT,
        serial_number TEXT,
        ip_address TEXT,
        location TEXT,
        connection_type TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT
      );
    `);

    console.log("[migrate] Tables created/verified.");

    // Seed only if empty
    const { rows } = await client.query("SELECT COUNT(*) AS cnt FROM switches");
    if (parseInt(rows[0].cnt) > 0) {
      console.log("[migrate] Database already has data — skipping seed.");
      return;
    }

    console.log("[migrate] Seeding demo data...");

    // Seed 2 buildings worth of switches
    await client.query(`
      INSERT INTO switches (name, model, ip_address, location, total_ports, manageable, status, notes) VALUES
        ('Core Switch 1', 'Cisco SG350-28', '10.0.1.1', 'Server Room', 28, true, 'active', 'Main core switch'),
        ('Floor 1 Switch', 'Cisco SG250-26P', '10.0.1.2', 'IDF Closet Floor 1', 24, true, 'active', null),
        ('Lab Switch', 'Netgear GS324', '10.0.1.3', 'Lab', 24, false, 'warning', 'Intermittent port issues'),
        ('Building B Core', 'Cisco SG350-28', '10.0.2.1', 'Building B Server Room', 28, true, 'active', null),
        ('Building B Floor', 'TP-Link TL-SG1016', '10.0.2.2', 'Building B IDF', 16, false, 'active', null)
      RETURNING id, name
    `);

    // Get switch IDs
    const switchRows = await client.query("SELECT id, name FROM switches ORDER BY name");
    const coreSwitch1 = switchRows.rows.find(r => r.name === 'Core Switch 1');
    const floor1Switch = switchRows.rows.find(r => r.name === 'Floor 1 Switch');

    // Seed switch ports (10 per switch for brevity)
    if (coreSwitch1) {
      for (let i = 1; i <= 10; i++) {
        await client.query(
          `INSERT INTO switch_ports (switch_id, port_number, label, status, vlan, speed, connected_to) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            coreSwitch1.id, i,
            i <= 2 ? `Uplink ${i}` : null,
            i <= 6 ? 'in_use' : i <= 8 ? 'available' : i === 9 ? 'reserved' : 'faulty',
            i <= 2 ? 'VLAN 1' : 'VLAN 10',
            '1Gbps',
            i <= 2 ? `ISP Router Port ${i}` : null
          ]
        );
      }
    }

    if (floor1Switch) {
      for (let i = 1; i <= 10; i++) {
        await client.query(
          `INSERT INTO switch_ports (switch_id, port_number, label, status, vlan, speed, connected_to) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            floor1Switch.id, i,
            i <= 4 ? `Office Port ${i}` : null,
            i <= 5 ? 'in_use' : i <= 8 ? 'available' : 'reserved',
            'VLAN 20', '100Mbps', null
          ]
        );
      }
    }

    // Seed 2 buildings, 3 rooms
    await client.query(`
      INSERT INTO offices (name, building, floor, occupant, department) VALUES
        ('Office 101', 'Building A', '1', 'John Smith', 'Engineering'),
        ('Office 102', 'Building A', '1', 'Jane Doe', 'IT'),
        ('Conference Room A', 'Building A', '1', null, 'Shared'),
        ('Office 201', 'Building B', '2', 'Bob Wilson', 'Operations'),
        ('Lab', 'Building A', '1', null, 'Engineering')
    `);

    // Get office IDs
    const officeRows = await client.query("SELECT id, name FROM offices");
    const office101 = officeRows.rows.find(r => r.name === 'Office 101');
    const office102 = officeRows.rows.find(r => r.name === 'Office 102');

    // Seed 2 wall plates
    if (office101 && floor1Switch) {
      await client.query(
        `INSERT INTO port_plates (office_id, plate_label, port_count, connected_switch_id, connected_ports, status) VALUES ($1, $2, $3, $4, $5, $6)`,
        [office101.id, 'PP-101A', 2, floor1Switch.id, '1,2', 'active']
      );
    }
    if (office102 && floor1Switch) {
      await client.query(
        `INSERT INTO port_plates (office_id, plate_label, port_count, connected_switch_id, connected_ports, status) VALUES ($1, $2, $3, $4, $5, $6)`,
        [office102.id, 'PP-102A', 2, floor1Switch.id, '3,4', 'active']
      );
    }

    // Seed 2 WiFi APs
    await client.query(`
      INSERT INTO wifi_aps (name, model, mac_address, ip_address, location, ssid, band, status, notes) VALUES
        ('AP-Lobby', 'Ubiquiti U6-Pro', 'AA:BB:CC:DD:EE:01', '10.0.3.1', 'Lobby Ceiling', 'WB-Corp', '2.4/5 GHz', 'active', null),
        ('AP-Floor1', 'Ubiquiti U6-LR', 'AA:BB:CC:DD:EE:02', '10.0.3.2', 'Floor 1 Hallway', 'WB-Corp', '2.4/5 GHz', 'active', null)
    `);

    // Seed 2 cameras
    await client.query(`
      INSERT INTO cameras (name, model, ip_address, location, type, resolution, status, notes) VALUES
        ('CAM-Entrance', 'Hikvision DS-2CD2143', '10.0.6.1', 'Main Entrance', 'Dome', '4MP', 'active', null),
        ('CAM-Parking', 'Hikvision DS-2CD2T43', '10.0.6.2', 'Parking Lot', 'Bullet', '4MP', 'active', null)
    `);

    // Seed NVR
    await client.query(`
      INSERT INTO nvrs (name, model, ip_address, location, total_channels, storage_capacity, status) VALUES
        ('NVR-Main', 'Hikvision DS-7616NI', '10.0.4.1', 'Server Room', 16, '8TB', 'active')
    `);

    // Link cameras to NVR
    const nvrRow = await client.query("SELECT id FROM nvrs LIMIT 1");
    if (nvrRow.rows[0]) {
      const nvrId = nvrRow.rows[0].id;
      const camRows = await client.query("SELECT id FROM cameras ORDER BY name");
      for (let i = 0; i < camRows.rows.length; i++) {
        await client.query(
          "UPDATE cameras SET connected_nvr_id = $1, nvr_channel = $2 WHERE id = $3",
          [nvrId, i + 1, camRows.rows[i].id]
        );
      }
    }

    // Seed punch clocks
    await client.query(`
      INSERT INTO punch_clocks (name, model, serial_number, ip_address, location, connection_type, status) VALUES
        ('Clock-Main', 'uAttend BN6500', 'BN6500-001', '10.0.7.1', 'Main Entrance', 'Ethernet', 'active'),
        ('Clock-Warehouse', 'uAttend BN6500', 'BN6500-002', '10.0.7.2', 'Warehouse', 'WiFi', 'active')
    `);

    // Seed rack items
    await client.query(`
      INSERT INTO rack_items (name, type, model, rack_position, rack_units, ip_address, status) VALUES
        ('Patch Panel 1', 'Patch Panel', '48-Port Cat6', 1, 1, null, 'active'),
        ('Core Switch 1', 'Switch', 'Cisco SG350-28', 2, 1, '10.0.1.1', 'active'),
        ('UPS Battery', 'UPS', 'APC Smart-UPS 1500', 3, 2, null, 'active'),
        ('NVR Unit', 'NVR', 'Hikvision DS-7616', 5, 2, '10.0.4.1', 'active')
    `);

    console.log("[migrate] Demo data seeded successfully.");
  } finally {
    client.release();
  }
}

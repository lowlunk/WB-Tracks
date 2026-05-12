# Changelog

All notable changes to WB Tracks are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-03-18

### Added

- **Dashboard** with health KPIs (Active / Warning / Offline), asset inventory counts, health donut chart, and Attention Needed list
- **Switches** — full CRUD with name, model, IP, location, port count, manageable toggle, status, notes
- **Switch detail page** — visual port map (color-coded by status), port details table, add / edit / delete ports, edit switch metadata
- **Per-port tracking** — label, status (in use / available / reserved / faulty), VLAN, speed, connected device, notes
- **Offices** — full CRUD with building, floor, occupant, department, notes
- **Port plates** — wall plate tracking nested inside offices, mapped to switch and port numbers
- **Server rack** — visual 42U rack diagram with item position, rack units, type, model, IP, status
- **WiFi APs** — model, MAC, IP, SSID, band, uplink switch & port, status
- **Cameras** — model, IP, type (dome / bullet / PTZ), resolution, linked NVR and channel
- **NVRs** — channel count, storage capacity, IP, location
- **Raspberry Pis** — model, IP, MAC, OS version, purpose, location
- **Punch clocks** — model, serial number, IP, location, connection type (Ethernet / WiFi / Cellular)
- **Dark mode** with system-preference detection
- **Hash-based routing** (`useHashLocation`) for iframe / kiosk / reverse-proxy compatibility
- **REST API** for every entity (`/api/switches`, `/api/offices`, etc.) plus `/api/dashboard` aggregation endpoint
- **Search** on every list page
- **Sidebar navigation** grouped by Network / Facility / Devices
- **Seed data** loaded automatically on first boot — dashboard is populated immediately for evaluation
- **Raspberry Pi deployment package** — `pi-deploy-wb-tracks.tar.gz` with prebuilt artifacts for USB transfer

### Technical

- React 18, TypeScript, Vite 7, Tailwind CSS v3, shadcn/ui, Radix primitives
- TanStack Query v5, React Hook Form, Zod validation via drizzle-zod
- Express 5 on Node 20+
- Single-port deployment (frontend + backend on `:5000`)
- esbuild + Vite single-command build (`npm run build`)
- In-memory `IStorage` implementation (Postgres-ready — drop-in replaceable)

### Known limitations

- **In-memory storage** — data resets on server restart. Migrate to Postgres for production persistence (see [DEVELOPMENT.md](DEVELOPMENT.md#persistence))
- **No authentication** — anyone on the LAN can view and edit. SSO / auth is on the roadmap
- **No CSV export** — API returns JSON only

---

## Unreleased

Features in active design or development. See [DEVELOPMENT.md](DEVELOPMENT.md#roadmap) for the full roadmap.

- Postgres persistence with `PgStorage` implementation
- CSV / Excel export per list
- Audit log (who changed what, when)
- Azure AD / Entra single sign-on
- Bulk import from spreadsheets
- Cable runs as a first-class entity
- Maintenance scheduling

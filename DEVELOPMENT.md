# Development Guide

How WB Tracks is built, how to run it locally, and how to extend it.

---

## Prerequisites

- **Node.js 20+** and **npm 10+**
- **Git**
- A modern terminal (macOS Terminal, iTerm, Windows Terminal, etc.)
- Optional but recommended: **VS Code** with the ESLint and Tailwind CSS IntelliSense extensions

---

## Local Setup

```bash
git clone https://github.com/lowlunk/WB-Tracks.git
cd WB-Tracks
npm install
npm run dev
```

Browse to <http://localhost:5000>.

The dev server runs both the Express backend and the Vite dev server on the same port. Edits to client or server files hot-reload automatically.

---

## NPM Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start dev server (tsx + Vite middleware) on port 5000 |
| `npm run build` | Bundle the client (Vite → `dist/public`) and server (esbuild → `dist/index.cjs`) |
| `npm start` | Run the built production server |
| `npm run check` | Run TypeScript in `--noEmit` mode (type check) |
| `npm run db:push` | Push the Drizzle schema to a real Postgres database (only if you've configured `drizzle.config.ts`) |

---

## Architecture

### High-level

```
┌─────────────────────────────────────────────┐
│                Browser (React)              │
│  wouter (hash routing) · TanStack Query     │
│  shadcn/ui · Tailwind · Recharts            │
└─────────────────┬───────────────────────────┘
                  │ fetch /api/*
                  ▼
┌─────────────────────────────────────────────┐
│           Express server (Node 20)          │
│   server/routes.ts · thin route handlers    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      IStorage (server/storage.ts)           │
│   In-memory Map<id, T> with seed data       │
│   (Postgres-ready — swap impl, not API)     │
└─────────────────────────────────────────────┘
```

### Data flow

1. **Schema** is declared once in `shared/schema.ts` using **Drizzle** table builders plus **drizzle-zod** insert schemas. Both client and server import these types — there is no other source of truth.
2. **Storage** lives behind the **`IStorage`** interface in `server/storage.ts`. The default implementation is in-memory (`MemStorage`). Swapping in Postgres only requires implementing the same interface.
3. **Routes** in `server/routes.ts` are intentionally thin — validate with Zod, call storage, return JSON.
4. **Frontend** uses **TanStack Query** keyed on the path (`['/api/switches']`). The default `queryFn` joins the array with `/` to build the URL.
5. **Mutations** go through `apiRequest` from `client/src/lib/queryClient.ts` and **invalidate** the relevant query keys to trigger a refetch.

### Why hash routing?

The app uses `useHashLocation` from `wouter/use-hash-location`. This means URLs look like `http://wbtracks/#/switches` instead of `http://wbtracks/switches`. It eliminates the need to configure server-side fallback for SPA routes and makes it trivial to deploy behind any reverse proxy without rewrite rules.

---

## Project Layout

```
WB-Tracks/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx                    # Router + layout shell
│       ├── main.tsx                   # React entrypoint
│       ├── index.css                  # Tailwind base + design tokens
│       ├── components/
│       │   ├── asset-crud-page.tsx    # Generic CRUD table — reused by WiFi, Pi, Camera, NVR, Punch Clock
│       │   ├── sidebar.tsx
│       │   ├── theme-provider.tsx
│       │   └── ui/                    # shadcn primitives
│       ├── pages/
│       │   ├── dashboard.tsx
│       │   ├── switches.tsx
│       │   ├── switch-detail.tsx
│       │   ├── offices.tsx
│       │   ├── server-rack.tsx
│       │   ├── wifi-aps.tsx
│       │   ├── cameras.tsx
│       │   ├── nvrs.tsx
│       │   ├── raspberry-pis.tsx
│       │   ├── punch-clocks.tsx
│       │   └── not-found.tsx
│       ├── hooks/
│       │   ├── use-toast.ts
│       │   └── use-mobile.tsx
│       └── lib/
│           ├── queryClient.ts         # TanStack Query setup + apiRequest helper
│           └── utils.ts               # cn() helper, formatters
├── server/
│   ├── index.ts                       # Server bootstrap + Vite middleware in dev
│   ├── routes.ts                      # All REST endpoints
│   ├── storage.ts                     # IStorage + MemStorage + seed data
│   ├── static.ts                      # Static file serving in production
│   └── vite.ts                        # Vite SSR middleware for dev
├── shared/
│   └── schema.ts                      # Drizzle tables + Zod insert schemas (THE source of truth)
├── docs/                              # Documentation + screenshots
├── script/
│   └── build.ts                       # esbuild + Vite build pipeline
├── dist/                              # Build output (gitignored)
├── drizzle.config.ts
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Data Model

All ten entity types live in `shared/schema.ts`. Every table follows the same pattern:

```ts
export const switches = pgTable("switches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // ... fields
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertSwitchSchema = createInsertSchema(switches).omit({ id: true });
export type InsertSwitch = z.infer<typeof insertSwitchSchema>;
export type Switch = typeof switches.$inferSelect;
```

### Entities

| Table | Primary fields | Relations |
| --- | --- | --- |
| `switches` | name, model, ipAddress, location, totalPorts, manageable, status | has many `switchPorts` |
| `switchPorts` | switchId, portNumber, label, status, vlan, speed, connectedTo | belongs to switch |
| `offices` | name, building, floor, occupant, department | has many `portPlates` |
| `portPlates` | officeId, plateLabel, portCount, connectedSwitchId, connectedPorts, status | belongs to office, references switch |
| `wifiAPs` | name, model, macAddress, ipAddress, location, ssid, band, connectedSwitchId, connectedPort, status | references switch |
| `raspberryPis` | name, model, ipAddress, macAddress, location, purpose, osVersion, status | — |
| `rackItems` | name, type, model, rackPosition, rackUnits, ipAddress, status | — |
| `cameras` | name, model, ipAddress, location, type, resolution, connectedNvrId, nvrChannel, status | references NVR |
| `nvrs` | name, model, ipAddress, location, totalChannels, storageCapacity, status | has many cameras |
| `punchClocks` | name, model, serialNumber, ipAddress, location, connectionType, status | — |

### Adding a new field

1. Add the column to the table in `shared/schema.ts`
2. The insert schema and types regenerate automatically
3. Update the form in the corresponding page (e.g. `client/src/pages/switches.tsx`) — add the field to `useForm` defaults and add a `<FormField>` for it
4. Update the table column rendering if you want it visible in the list
5. Update the seed data in `server/storage.ts` if you want demo rows to have a value
6. Restart the dev server

No database migration is required while we're on in-memory storage. Once you migrate to Postgres, run `npm run db:push` after schema changes.

---

## API Reference

All endpoints are JSON over HTTP. Base URL: `/api`.

### Conventions

- `GET /api/<entity>` → list
- `GET /api/<entity>/:id` → single (where exposed)
- `POST /api/<entity>` → create — body is the insert schema (no id)
- `PATCH /api/<entity>/:id` → partial update
- `DELETE /api/<entity>/:id` → delete
- Errors return `400` (validation), `404` (not found), or `500` (server)

### Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Aggregated KPI payload (counts + attention items) |
| `GET` | `/api/switches` | List all switches |
| `GET` | `/api/switches/:id` | Single switch |
| `POST` | `/api/switches` | Create |
| `PATCH` | `/api/switches/:id` | Update |
| `DELETE` | `/api/switches/:id` | Delete (cascades to ports) |
| `GET` | `/api/switches/:id/ports` | All ports for a switch |
| `POST` | `/api/switch-ports` | Create port |
| `PATCH` | `/api/switch-ports/:id` | Update port |
| `DELETE` | `/api/switch-ports/:id` | Delete port |
| `GET` | `/api/offices` | List offices (with port plates nested) |
| `POST` | `/api/offices` | Create |
| `PATCH` | `/api/offices/:id` | Update |
| `DELETE` | `/api/offices/:id` | Delete (cascades to plates) |
| `GET` | `/api/port-plates` | All port plates |
| `POST` | `/api/port-plates` | Create |
| `PATCH` | `/api/port-plates/:id` | Update |
| `DELETE` | `/api/port-plates/:id` | Delete |
| `GET` `POST` `PATCH` `DELETE` | `/api/wifi-aps[/:id]` | WiFi AP CRUD |
| `GET` `POST` `PATCH` `DELETE` | `/api/raspberry-pis[/:id]` | Pi CRUD |
| `GET` `POST` `PATCH` `DELETE` | `/api/rack-items[/:id]` | Rack item CRUD |
| `GET` `POST` `PATCH` `DELETE` | `/api/cameras[/:id]` | Camera CRUD |
| `GET` `POST` `PATCH` `DELETE` | `/api/nvrs[/:id]` | NVR CRUD |
| `GET` `POST` `PATCH` `DELETE` | `/api/punch-clocks[/:id]` | Punch clock CRUD |

### Example — create a switch

```bash
curl -X POST http://localhost:5000/api/switches \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Floor 3 Switch",
    "model": "Cisco SG350-28",
    "ipAddress": "10.0.1.4",
    "location": "IDF Closet Floor 3",
    "totalPorts": 28,
    "manageable": true,
    "status": "active"
  }'
```

### Example — fetch the dashboard

```bash
curl http://localhost:5000/api/dashboard | jq .
```

---

## Frontend Patterns

### Querying data

```tsx
import { useQuery } from "@tanstack/react-query";
import type { Switch } from "@shared/schema";

const { data: switches, isLoading } = useQuery<Switch[]>({
  queryKey: ["/api/switches"],
});
```

The default `queryFn` joins the key array with `/` and fetches. No need to write the fetcher.

### Mutating data

```tsx
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const createSwitch = useMutation({
  mutationFn: (data: InsertSwitch) =>
    apiRequest("POST", "/api/switches", data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/switches"] });
    toast({ title: "Switch added" });
  },
});
```

**Always invalidate** the relevant query key after a mutation. Otherwise the UI shows stale data.

### Forms

Use shadcn `Form` + `useForm` + `zodResolver` against the appropriate insert schema:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSwitchSchema } from "@shared/schema";

const form = useForm({
  resolver: zodResolver(insertSwitchSchema),
  defaultValues: {
    name: "",
    totalPorts: 24,
    status: "active",
    manageable: false,
  },
});
```

### Routing

`client/src/App.tsx` wires the routes with hash-based history:

```tsx
<Router hook={useHashLocation}>
  <Switch>
    <Route path="/" component={Dashboard} />
    <Route path="/switches" component={Switches} />
    <Route path="/switches/:id" component={SwitchDetail} />
    {/* ... */}
    <Route component={NotFound} />
  </Switch>
</Router>
```

Use `<Link href="/switches">` — wouter handles the `#/` prefix.

### Toasts

```tsx
import { useToast } from "@/hooks/use-toast";
const { toast } = useToast();
toast({ title: "Saved", description: "Switch updated" });
```

---

## Backend Patterns

### Route handler shape

```ts
app.post("/api/switches", async (req, res) => {
  const parsed = insertSwitchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const created = await storage.createSwitch(parsed.data);
  res.status(201).json(created);
});
```

Always validate with Zod before hitting storage. Keep handlers thin.

### Storage interface

```ts
export interface IStorage {
  listSwitches(): Promise<Switch[]>;
  getSwitch(id: string): Promise<Switch | undefined>;
  createSwitch(data: InsertSwitch): Promise<Switch>;
  updateSwitch(id: string, data: Partial<InsertSwitch>): Promise<Switch | undefined>;
  deleteSwitch(id: string): Promise<boolean>;
  // ... same shape for every entity
}
```

`MemStorage` implements this with `Map<string, T>` and seeds initial data in the constructor.

---

## Persistence

### Current (v1.0): in-memory

`MemStorage` lives in `server/storage.ts`. Data is seeded on every server boot and **lost on restart**. This is intentional for the v1.0 evaluation phase.

### Migrating to Postgres

The schema already uses `pgTable` definitions — Postgres is the intended target. To switch:

1. **Provision Postgres** on the Pi (or a separate host):

   ```bash
   sudo apt install -y postgresql
   sudo -u postgres createuser -P wbtracks   # set password
   sudo -u postgres createdb -O wbtracks wbtracks
   ```

2. **Set the connection string** in production:

   ```bash
   export DATABASE_URL="postgres://wbtracks:PASSWORD@localhost:5432/wbtracks"
   ```

3. **Push the schema:**

   ```bash
   npm run db:push
   ```

4. **Implement `PgStorage`** that wraps Drizzle queries against the same `IStorage` interface. Pattern:

   ```ts
   import { drizzle } from "drizzle-orm/node-postgres";
   import { Pool } from "pg";
   import { switches } from "@shared/schema";
   import { eq } from "drizzle-orm";

   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   const db = drizzle(pool);

   export class PgStorage implements IStorage {
     async listSwitches() {
       return db.select().from(switches);
     }
     async createSwitch(data: InsertSwitch) {
       const [row] = await db.insert(switches).values(data).returning();
       return row;
     }
     // ... and so on
   }
   ```

5. **Swap the export** in `server/storage.ts`:

   ```ts
   export const storage = process.env.DATABASE_URL
     ? new PgStorage()
     : new MemStorage();
   ```

6. **Restart the service.** First boot will be empty — seed manually or via a one-off script.

---

## Build Pipeline

`script/build.ts` runs:

1. **Vite build** → `dist/public/` (HTML, JS, CSS, assets)
2. **esbuild** → `dist/index.cjs` (single-file CJS bundle of the server + bundled deps)

The result is two artifacts: a static frontend bundle and a self-contained Node entrypoint. The server in production serves the static bundle from `dist/public/` (see `server/static.ts`) and exposes `/api/*` from Express.

---

## Coding Conventions

- **TypeScript everywhere.** No `.js` source files outside generated output.
- **Path aliases** — use `@/` for `client/src/`, `@shared/` for `shared/`, `@assets/` for attached assets.
- **No `localStorage` / `sessionStorage` / `cookies`** — sandboxed iframe deployments block them. Use React state or the backend.
- **Always invalidate** the relevant query key after a mutation.
- **`data-testid` attributes** on every interactive element. Pattern: `{action}-{target}` (e.g. `button-add-switch`, `input-name`).
- **shadcn over custom UI.** Need a primitive? Check if shadcn already has one.
- **Lucide icons** for actions. **react-icons/si** for brand logos.
- **Tailwind classes only** — no inline styles unless dynamic. Use `cn()` from `@/lib/utils` to merge conditionally.

---

## Testing

### Automated tests

None at this stage. The codebase is small and the surface is mostly CRUD. If you add complex logic (e.g. port allocation algorithms, VLAN validation), drop in **Vitest** unit tests next to the file:

```bash
npm install -D vitest @vitest/ui
```

### Manual QA — Playwright

For interactive testing during development, use Playwright via the `js_repl` pattern documented in the website-building skill. Each page should be screenshot-tested at desktop (1400x900) and mobile (375x667) widths.

Key flows to manually verify before each release:

- Dashboard loads, KPIs match the inventory list
- Add / Edit / Delete on each entity persists in the UI
- Switch detail page — Add Port, Edit Port, Delete Port
- Office expand — Add Plate, Edit Plate, Delete Plate
- Dark mode toggle
- Hash routing (`/#/switches`) deep-links work

---

## Contributing

### Branch naming

- `feature/<short-name>` — new functionality
- `fix/<short-name>` — bug fix
- `chore/<short-name>` — refactors, docs, tooling

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) loosely:

```
feat: add CSV export to switches page
fix: prevent port deletion when in use by an active port plate
docs: clarify Postgres migration steps
chore: bump react-query to 5.62
```

### Pull request checklist

- [ ] `npm run check` passes (no TS errors)
- [ ] `npm run build` completes
- [ ] Manually QA'd the affected pages
- [ ] Updated relevant docs (README, USER_GUIDE, DEPLOY)
- [ ] Added/updated `data-testid` attributes on new interactive elements
- [ ] Bumped version in `package.json` if this is a release
- [ ] Updated `CHANGELOG.md`

---

## Roadmap

Items on the table, not yet built:

- **Postgres persistence** — see migration steps above
- **CSV / Excel export** for every list page
- **Audit log** — who changed what, when (requires auth first)
- **Authentication** — single sign-on via Azure AD / Entra
- **Bulk import** from existing spreadsheets
- **Cable runs** — a separate entity tying switch port ↔ port plate physically (length, color, certification date)
- **Maintenance scheduling** — "due for firmware update", "calibration in 14 days"
- **REST → GraphQL** — only if relationships get hairy
- **Mobile-native shell** — Capacitor wrapper for tablet kiosks

---

## Troubleshooting (dev)

| Symptom | Fix |
| --- | --- |
| Port 5000 already in use | `lsof -i :5000` then kill the offender |
| HMR not picking up changes | Hard reload the browser; restart `npm run dev` |
| TypeScript red squiggles in VS Code but `npm run check` passes | Restart the TS server: Cmd+Shift+P → "TypeScript: Restart TS server" |
| `Cannot find module '@shared/schema'` | Restart the dev server — Vite needs to re-resolve aliases |
| Form submits but nothing happens | `console.log(form.formState.errors)` to see validation failures |
| Mutation succeeds but UI doesn't update | You forgot `queryClient.invalidateQueries({ queryKey: [...] })` |

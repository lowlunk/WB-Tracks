import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Only create pool if DATABASE_URL is present
const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({ connectionString })
  : null as unknown as Pool;

export const db = connectionString
  ? drizzle(pool, { schema })
  : null as unknown as ReturnType<typeof drizzle>;

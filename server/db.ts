import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced database connection with error handling
const createDatabaseConnection = () => {
  try {
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 10,
      maxUses: 7500,
      allowExitOnIdle: false
    });

    // Test the connection
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    const db = drizzle({ client: pool, schema });
    
    // Test database connectivity on startup
    testDatabaseConnection(pool);
    
    return { pool, db };
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw error;
  }
};

async function testDatabaseConnection(pool: Pool) {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw new Error(`Database connection failed: ${error}`);
  }
}

const { pool, db } = createDatabaseConnection();

export { pool, db };
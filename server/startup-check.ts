import { pool } from './db';

// Comprehensive startup validation
export async function validateStartup(): Promise<void> {
  const checks = [
    checkEnvironmentVariables,
    checkDatabaseConnection,
    checkDatabaseSchema
  ];

  console.log('🔍 Running startup validation checks...');
  
  for (const check of checks) {
    await check();
  }
  
  console.log('✅ All startup checks passed successfully');
}

async function checkEnvironmentVariables(): Promise<void> {
  console.log('📋 Checking environment variables...');
  
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL!;
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  console.log('✓ Environment variables validated');
}

async function checkDatabaseConnection(): Promise<void> {
  console.log('🔌 Testing database connection...');
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    
    console.log('✓ Database connection successful');
    console.log(`  PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
    console.log(`  Server time: ${result.rows[0].current_time}`);
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

async function checkDatabaseSchema(): Promise<void> {
  console.log('📊 Validating database schema...');
  
  try {
    const client = await pool.connect();
    
    // Check if required tables exist
    const requiredTables = [
      'users', 'components', 'facilities', 'inventory_locations', 
      'inventory_items', 'inventory_transactions', 'sessions'
    ];
    
    for (const table of requiredTables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )`,
        [table]
      );
      
      if (!result.rows[0].exists) {
        throw new Error(`Required table '${table}' does not exist`);
      }
    }
    
    client.release();
    console.log('✓ Database schema validated');
  } catch (error: any) {
    console.error('❌ Database schema validation failed:', error.message);
    throw new Error(`Database schema validation failed: ${error.message}`);
  }
}
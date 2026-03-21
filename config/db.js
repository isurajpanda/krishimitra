import pkg from "pg";
const { Pool } = pkg;

const useExternalDB = !!process.env.DATABASE_URL;

const dbConfig = useExternalDB 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: "postgres",
      host: "localhost",
      database: "postgres",
      password: "password",
      port: 5432,
      max: 20, // Increase pool size
      idleTimeoutMillis: 30000,
    };

let pool = new Pool(dbConfig);

// Initialize database
async function initDb() {
  try {
    let finalClient;
    let client = await pool.connect();
    console.log(`[DB] Connected to PostgreSQL (${useExternalDB ? "Railway" : "Local fallback"})`);

    if (!useExternalDB) {
      // Ensure krishimitra database exists locally
      const dbName = "krishimitra";
      const dbCheck = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
      if (dbCheck.rowCount === 0) {
        console.log(`[DB] Creating database "${dbName}"...`);
        await client.query(`CREATE DATABASE ${dbName}`);
      }
      client.release();
      await pool.end();

      // Reconnect to krishimitra
      pool = new Pool({ ...dbConfig, database: dbName });
      finalClient = await pool.connect();
    } else {
      // Railway DB is already created and passed in DATABASE_URL
      finalClient = client;
    }
    
    // FORCED RESET IF SCHEMA IS OLD (Dev phase)
    const checkEmail = await finalClient.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='email'
    `);

    if (checkEmail.rowCount === 0) {
      console.log("[DB] Outdated schema detected. RESETTING tables...");
      await finalClient.query("DROP TABLE IF EXISTS chat_history CASCADE");
      await finalClient.query("DROP TABLE IF EXISTS users CASCADE");
    }

    // Modern Schema
    await finalClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        location VARCHAR(200),
        farm_type VARCHAR(100),
        primary_crops TEXT[],
        preferred_language VARCHAR(50) DEFAULT 'English',
        lat DECIMAL(10, 8),
        lon DECIMAL(11, 8),
        units VARCHAR(10) DEFAULT 'Metric',
        weather_alerts BOOLEAN DEFAULT TRUE,
        pest_warnings BOOLEAN DEFAULT TRUE,
        market_trends BOOLEAN DEFAULT TRUE,
        state VARCHAR(100) DEFAULT 'Maharashtra',
        district VARCHAR(100) DEFAULT 'Pune',
        onboarded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add new columns if they don't exist (for existing DBs)
    const newCols = [
      { name: 'lon', type: 'DOUBLE PRECISION' },
      { name: 'preferred_language', type: "VARCHAR(20) DEFAULT 'English'" },
      { name: 'units', type: "VARCHAR(20) DEFAULT 'Metric'" },
      { name: 'weather_alerts', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'pest_warnings', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'district', type: "VARCHAR(100) DEFAULT 'Pune'" },
      { name: 'state', type: "VARCHAR(100) DEFAULT 'Maharashtra'" },
      { name: 'market_trends', type: 'BOOLEAN DEFAULT FALSE' },
    ];
    for (const col of newCols) {
      try {
        await finalClient.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      } catch (e) { /* column already exists */ }
    }
    await finalClient.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    finalClient.release();
    console.log("[DB] Database and Schema Ready");
  } catch (err) {
    console.error("[DB] Error initializing database:", err.message);
    pool = new Pool(dbConfig);
  }
}

export { pool, initDb };

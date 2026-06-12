const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local", e);
}

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log("=== Creating GIN index on businesses(b_adr) ===");
  try {
    await pool.query("CREATE INDEX IF NOT EXISTS idx_businesses_b_adr_trgm ON businesses USING gin (b_adr gin_trgm_ops)");
    console.log("GIN index on b_adr created successfully.");
  } catch (err) {
    console.error("Index creation failed:", err);
  } finally {
    await pool.end();
  }
}

main();

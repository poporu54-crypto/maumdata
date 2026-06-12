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
  console.log("=== Creating pg_trgm extension and GIN indexes for fast LIKE search ===");
  try {
    // 1. pg_trgm 익스텐션 생성
    await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    console.log("1. pg_trgm extension verified/created.");

    // 2. b_nm(상호명) GIN trgm 인덱스 생성
    console.log("2. Creating GIN index on businesses(b_nm)...");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_businesses_b_nm_trgm ON businesses USING gin (b_nm gin_trgm_ops)");
    console.log("   GIN index on b_nm created.");

    // 3. brand_name(브랜드명) GIN trgm 인덱스 생성
    console.log("3. Creating GIN index on businesses(brand_name)...");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_businesses_brand_name_trgm ON businesses USING gin (brand_name gin_trgm_ops)");
    console.log("   GIN index on brand_name created.");

    // 4. p_nm(대표자명) GIN trgm 인덱스 생성
    console.log("4. Creating GIN index on businesses(p_nm)...");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_businesses_p_nm_trgm ON businesses USING gin (p_nm gin_trgm_ops)");
    console.log("   GIN index on p_nm created.");

    console.log("=== All search indexes successfully created! ===");
  } catch (err) {
    console.error("Index creation failed:", err);
  } finally {
    await pool.end();
  }
}

main();

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
  console.log("=== EXPLAIN ANALYZE searchBusinesses ===");
  const q = '기업';
  const searchWord = `%${q}%`;
  const cleanQ = q.replace(/[^0-9]/g, "");

  try {
    const res = await pool.query(`
      EXPLAIN ANALYZE
      SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name 
      FROM businesses 
      WHERE b_nm LIKE $1 OR p_nm LIKE $1 OR b_adr LIKE $1 OR brand_name LIKE $1 OR b_no = $2
    `, [searchWord, cleanQ || "NOT_A_NUMBER"]);

    res.rows.forEach(r => console.log(r['QUERY PLAN']));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();

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
  try {
    const bNo = '1221166249';
    console.log(`Checking DB for business number: ${bNo}`);
    
    const bizRes = await pool.query("SELECT * FROM businesses WHERE b_no = $1", [bNo]);
    console.log("=== businesses Table Record ===");
    console.log(bizRes.rows);

    const invalidRes = await pool.query("SELECT * FROM invalid_businesses WHERE b_no = $1", [bNo]);
    console.log("=== invalid_businesses Table Record ===");
    console.log(invalidRes.rows);

    const editRes = await pool.query("SELECT * FROM business_edit_requests WHERE b_no = $1", [bNo]);
    console.log("=== business_edit_requests Table Record ===");
    console.log(editRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();

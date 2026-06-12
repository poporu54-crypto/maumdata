const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = (() => {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/POSTGRES_URL=([^\r\n]+)/) || envContent.match(/DATABASE_URL=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
})();

if (!connectionString) {
  console.error("Error: DATABASE_URL or POSTGRES_URL environment variable is missing.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log("Connecting to Neon DB...");
  await client.connect();
  console.log("Connected successfully!");

  console.log("Creating business_bids table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_bids (
      id SERIAL PRIMARY KEY,
      b_no VARCHAR(10) REFERENCES businesses(b_no) ON DELETE CASCADE,
      bid_ntce_no VARCHAR(100) NOT NULL,
      bid_ntce_ord VARCHAR(50) NOT NULL,
      bid_ntce_nm VARCHAR(500) NOT NULL,
      dminstt_nm VARCHAR(255) NOT NULL,
      opng_dt VARCHAR(100) NOT NULL,
      bid_ntce_dt VARCHAR(100) NOT NULL,
      cntrct_cncl_mthd_nm VARCHAR(255) NOT NULL,
      presmpt_prce DOUBLE PRECISION DEFAULT 0,
      detail_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(b_no, bid_ntce_no, bid_ntce_ord)
    );
  `);

  console.log("Creating business_patents table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_patents (
      id SERIAL PRIMARY KEY,
      b_no VARCHAR(10) REFERENCES businesses(b_no) ON DELETE CASCADE,
      application_number VARCHAR(100) NOT NULL,
      invention_title VARCHAR(500) NOT NULL,
      patent_status VARCHAR(100) NOT NULL,
      application_date VARCHAR(50) NOT NULL,
      detail_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(b_no, application_number)
    );
  `);

  console.log("Creating business_disclosures table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_disclosures (
      id SERIAL PRIMARY KEY,
      b_no VARCHAR(10) REFERENCES businesses(b_no) ON DELETE CASCADE,
      rcept_no VARCHAR(100) NOT NULL,
      report_nm VARCHAR(500) NOT NULL,
      flr_nm VARCHAR(255) NOT NULL,
      rcept_dt VARCHAR(50) NOT NULL,
      rm VARCHAR(255),
      detail_url TEXT NOT NULL,
      is_key_disclosure BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(b_no, rcept_no)
    );
  `);

  console.log("Tables created successfully!");
}

main()
  .catch(err => console.error("Migration failed:", err))
  .finally(async () => {
    await client.end();
    process.exit();
  });

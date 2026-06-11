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

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log("Connecting to Neon DB...");
  await client.connect();
  console.log("Connected!");

  console.log("Creating business_edit_requests table if it doesn't exist...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_edit_requests (
      id SERIAL PRIMARY KEY,
      b_no VARCHAR(10) REFERENCES businesses(b_no) ON DELETE CASCADE,
      requester_type VARCHAR(50) NOT NULL,
      requester_email VARCHAR(255) NOT NULL,
      proposed_brand_name VARCHAR(255),
      proposed_homepage VARCHAR(255),
      proposed_description TEXT,
      proposed_timeline JSONB,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Table business_edit_requests created successfully!");

  await client.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await client.end();
});

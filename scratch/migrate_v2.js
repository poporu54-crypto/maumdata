const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// .env.local 파일에서 수동으로 DB 커넥션 스트링 추출
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
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log("Connecting to Neon DB for migration...");
  await client.connect();
  console.log("Connected successfully!");

  console.log("Adding new columns for FTC V2 & NPS V2 details to 'businesses' table if they don't exist...");
  
  const columnsToAdd = [
    { name: 'mail_order_no', type: 'VARCHAR(100)' },
    { name: 'declare_org', type: 'VARCHAR(255)' },
    { name: 'goods_type', type: 'VARCHAR(255)' },
    { name: 'sell_type', type: 'VARCHAR(255)' },
    { name: 'close_date', type: 'VARCHAR(8)' },
    { name: 'rep_email', type: 'VARCHAR(255)' },
    { name: 'zip_cd', type: 'VARCHAR(10)' },
    { name: 'new_acqs_nmps', type: 'INTEGER DEFAULT 0' },
    { name: 'loss_sbscrb_nmps', type: 'INTEGER DEFAULT 0' },
    { name: 'tel_no', type: 'VARCHAR(50)' }
  ];

  for (const col of columnsToAdd) {
    try {
      // 컬럼 존재 여부 체크
      const checkRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='businesses' AND column_name=$1
      `, [col.name]);
      
      if (checkRes.rows.length === 0) {
        console.log(`Adding column '${col.name}'...`);
        await client.query(`ALTER TABLE businesses ADD COLUMN ${col.name} ${col.type};`);
        console.log(`Column '${col.name}' added successfully.`);
      } else {
        console.log(`Column '${col.name}' already exists. Skipping.`);
      }
    } catch (err) {
      console.error(`Failed to add column '${col.name}':`, err);
    }
  }

  console.log("Migration finished successfully!");
}

main()
  .catch(err => {
    console.error("Migration failed:", err);
  })
  .finally(async () => {
    await client.end();
  });

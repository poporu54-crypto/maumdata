const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// .env.local 로딩
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

const bNo = '7295000974';

async function testDb() {
  try {
    const res = await pool.query("SELECT * FROM businesses WHERE b_no = $1", [bNo]);
    console.log("=== DB Record ===");
    console.log(res.rows);
  } catch (err) {
    console.error("DB Error:", err);
  }
}

async function testNts() {
  const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
  const API_URL = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${SERVICE_KEY}`;
  
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        b_no: [bNo],
      })
    });
    const json = await response.json();
    console.log("=== NTS API Response ===");
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("NTS API Error:", err);
  }
}

async function testFtc() {
  const SERVICE_KEY = process.env.FTC_SERVICE_KEY || process.env.DATA_PORTAL_SERVICE_KEY || "";
  const url = `https://apis.data.go.kr/1130000/MllBsDtl_3Service/getMllBsInfoDetail_3?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&brno=${bNo}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      }
    });
    const text = await response.text();
    console.log("=== FTC API Raw Response ===");
    console.log(text);
  } catch (err) {
    console.error("FTC API Error:", err);
  }
}

async function main() {
  await testDb();
  await testNts();
  await testFtc();
  await pool.end();
}

main();

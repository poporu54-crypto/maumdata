const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// .env.local 수동 파싱
let databaseUrl = "";
try {
  const envContent = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    if (line.startsWith("DATABASE_URL=") || line.startsWith("POSTGRES_URL=")) {
      databaseUrl = line.split("=")[1].trim().replace(/['"]/g, "");
    }
  }
} catch (e) {
  console.error("Failed to read .env.local file:", e);
}

if (!databaseUrl) {
  console.error("DATABASE_URL or POSTGRES_URL not found in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const bNo = "1378651839";
  console.log(`Checking ${bNo} in database...`);
  
  // 1. invalid_businesses 테이블 조회
  const invalidRes = await pool.query("SELECT * FROM invalid_businesses WHERE b_no = $1", [bNo]);
  console.log("Invalid businesses result:", invalidRes.rows);

  if (invalidRes.rows.length > 0) {
    // 2. invalid_businesses 테이블에서 삭제
    await pool.query("DELETE FROM invalid_businesses WHERE b_no = $1", [bNo]);
    console.log(`Successfully deleted ${bNo} from invalid_businesses!`);
  } else {
    console.log(`${bNo} was not found in invalid_businesses.`);
  }

  // 3. businesses 테이블에 데이터가 존재하지만 상호 정보 없음 인지 조회
  const bizRes = await pool.query("SELECT b_no, b_nm, data_source FROM businesses WHERE b_no = $1", [bNo]);
  console.log("Businesses table status:", bizRes.rows);

  pool.end();
}

main().catch(err => {
  console.error("Error:", err);
  pool.end();
});

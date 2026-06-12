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

async function getFtcMailOrderInfo(bNo) {
  const SERVICE_KEY = process.env.FTC_SERVICE_KEY || process.env.DATA_PORTAL_SERVICE_KEY || "";
  const url = `https://apis.data.go.kr/1130000/MllBsDtl_3Service/getMllBsInfoDetail_3?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&brno=${bNo}`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    const json = JSON.parse(text);
    
    // 신규 호환 파싱 로직 적용
    const items = json?.items || json?.response?.body?.items?.item || json?.response?.body?.items;
    
    if (items && items.length > 0) {
      const item = items[0];
      return {
        brno: item.brno || bNo,
        cmpNm: item.bzmnNm || "",
        rprsNm: item.rprsvNm || "",
        repAddr: item.lctnAddr || item.lctnRnAddr || "",
        rcptDt: item.dclrDate || "",
        opStateNm: item.operSttusCdNm || item.bzmnRgsSttusSeNm || "정상영업",
      };
    }
  } catch (err) {
    console.error("FTC Error in simulation:", err);
  }
  return null;
}

async function main() {
  const bNo = '1221166249';
  console.log("Starting simulation for 1221166249 info resolution...");
  
  // 1. 기존 DB 확인
  const preRes = await pool.query("SELECT * FROM businesses WHERE b_no = $1", [bNo]);
  console.log("Pre-simulation name in DB:", preRes.rows[0]?.b_nm);

  // 2. 공정위 API 조회
  const ftcInfo = await getFtcMailOrderInfo(bNo);
  if (ftcInfo) {
    console.log("Fetched FTC Info successfully:", ftcInfo.cmpNm, "|", ftcInfo.repAddr);
    
    // 3. DB 업데이트 시뮬레이션
    await pool.query(`
      UPDATE businesses 
      SET b_nm = $1, b_adr = $2, p_nm = $3, b_sector = $4
      WHERE b_no = $5
    `, [ftcInfo.cmpNm, ftcInfo.repAddr, ftcInfo.rprsNm, '전자상거래 소매업 (통신판매업)', bNo]);
    console.log("DB update query simulated!");

    // 4. 업데이트된 결과 확인
    const postRes = await pool.query("SELECT * FROM businesses WHERE b_no = $1", [bNo]);
    console.log("Post-simulation name in DB:", postRes.rows[0]?.b_nm);
    console.log("Post-simulation address in DB:", postRes.rows[0]?.b_adr);
  } else {
    console.log("Could not fetch FTC info in simulation.");
  }
  
  await pool.end();
}

main();

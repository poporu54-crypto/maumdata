const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. .env.local 로드
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

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_PORTAL_SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithTimeout(url, options = {}) {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 조달청 낙찰정보 (최근 180일치) 1회성 수집
async function fetchProcurementBids(bNo, companyNm) {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 180); // 최근 180일
  const formatDateString = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}0000`;
  };
  const bgnDt = formatDateString(past);
  const endDt = formatDateString(today);

  const fetchCategory = async (operation) => {
    const url = `https://apis.data.go.kr/1230000/as/ScsbidInfoService/${operation}?serviceKey=${DATA_PORTAL_SERVICE_KEY}&numOfRows=100&pageNo=1&inqryDiv=1&inqryBgnDt=${bgnDt}&inqryEndDt=${endDt}&type=json`;
    const response = await fetchWithTimeout(url);
    const text = await response.text();
    
    if (text.includes("LIMITED NUMBER OF SERVICE REQUESTS EXCEEDED") || text.includes("Forbidden")) {
      throw new Error("API_LIMIT_EXCEEDED");
    }
    if (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE")) {
      return [];
    }

    try {
      const json = JSON.parse(text);
      const items = json?.response?.body?.items?.item || json?.response?.body?.items;
      if (items) return Array.isArray(items) ? items : [items];
    } catch (pe) {
      // JSON 파싱 에러
    }
    return [];
  };

  try {
    const [listServc, listThng, listConstc] = await Promise.all([
      fetchCategory("getScsbidListSttusServc"),
      fetchCategory("getScsbidListSttusThng"),
      fetchCategory("getScsbidListSttusCnstwk")
    ]);

    const combinedList = [...listServc, ...listThng, ...listConstc];
    const targetNmClean = companyNm.replace(/\(.*?\)/g, "").replace(/주식회사/g, "").replace(/\(주\)/g, "").replace(/\s+/g, "").toLowerCase();
    
    const filteredList = combinedList.filter((item) => {
      const itemBNo = (item.scsbidBprcoNo || "").replace(/[^0-9]/g, "");
      const itemNm = (item.scsbidBprcoNm || "").replace(/\s+/g, "").toLowerCase();
      return (cleanBNo && itemBNo === cleanBNo) || (targetNmClean && itemNm.includes(targetNmClean));
    });

    return filteredList.map((item) => {
      const dateStr = item.bidNtceDate || item.opengDate || "";
      const timeStr = item.bidNtceBgn || item.opengTm || "";
      return {
        bidNtceNo: item.bidNtceNo || "",
        bidNtceOrd: item.bidNtceOrd || "00",
        bidNtceNm: item.bidNtceNm || "",
        dminsttNm: item.dmndInsttNm || item.ntceInsttNm || "",
        opngDt: item.opengDate || "",
        bidNtceDt: dateStr && timeStr ? `${dateStr} ${timeStr}` : (dateStr || "-"),
        cntrctCnclMthdNm: item.cntrctCnclsMthdNm || "제한경쟁",
        presmptPrce: parseFloat(item.scsbidAmt || "0"),
        detailUrl: `https://www.g2b.go.kr:8081/ep/invitation/publishBidInvitationDetail.do?bidno=${item.bidNtceNo}&bidseq=${item.bidNtceOrd}`
      };
    });
  } catch (err) {
    if (err.message === "API_LIMIT_EXCEEDED") throw err;
    console.error(`Bids fetch failed for ${companyNm}:`, err.message);
    return [];
  }
}

async function main() {
  console.log("MaumData Procurement Bids Backfill Task Started...");

  // 1. 조달청 정보 동기화 이력이 없는 핵심 조회 기업 목록 조회 (조회수 높은 순)
  const dbRes = await pool.query(`
    SELECT b_no, b_nm 
    FROM businesses 
    WHERE bids_last_sync_at IS NULL AND view_count > 0
    ORDER BY view_count DESC
  `);

  const targets = dbRes.rows;
  console.log(`Found ${targets.length} active businesses that lack Procurement Bids caching.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const biz = targets[i];
    const bNo = biz.b_no;
    const bNm = biz.b_nm;

    console.log(`\n[${i+1}/${targets.length}] Processing Procurement Bids for ${bNm} (${bNo})...`);

    try {
      await sleep(250); // Throttling

      const bids = await fetchProcurementBids(bNo, bNm);
      
      const dbClient = await pool.connect();
      try {
        await dbClient.query("BEGIN");
        
        // 기존 입찰 데이터 삭제 후 신규 저장
        await dbClient.query("DELETE FROM business_bids WHERE b_no = $1", [bNo]);
        for (const b of bids) {
          await dbClient.query(`
            INSERT INTO business_bids (
              b_no, bid_ntce_no, bid_ntce_ord, bid_ntce_nm, dminstt_nm,
              opng_dt, bid_ntce_dt, cntrct_cncl_mthd_nm, presmpt_prce, detail_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            bNo, b.bidNtceNo, b.bidNtceOrd, b.bidNtceNm, b.dminsttNm,
            b.opngDt, b.bidNtceDt, b.cntrctCnclMthdNm, b.presmptPrce, b.detailUrl
          ]);
        }

        // bids_last_sync_at 타임스탬프 마킹
        await dbClient.query(`
          UPDATE businesses 
          SET bids_last_sync_at = CURRENT_TIMESTAMP
          WHERE b_no = $1
        `, [bNo]);

        await dbClient.query("COMMIT");
        console.log(`   -> SUCCESS: Synced ${bids.length} bids for ${bNm}`);
        successCount++;
      } catch (dbErr) {
        await dbClient.query("ROLLBACK");
        console.error(`   -> DB Transaction FAILED:`, dbErr.message);
        failCount++;
      } finally {
        dbClient.release();
      }
    } catch (err) {
      if (err.message === "API_LIMIT_EXCEEDED") {
        console.warn(`\n[CRITICAL] 공공데이터포털 API 호출 일일 한도를 모두 소진하였습니다.`);
        console.warn(`오늘 조달청 수집 작업은 여기서 조기 중단합니다. (내일 재실행 시 이어서 백필됩니다.)`);
        break;
      } else {
        console.error(`   -> API FAILED to process ${bNm}:`, err.message);
        failCount++;
      }
    }
  }

  console.log("\n==================================================");
  console.log("Procurement Bids Backfill Session Summary:");
  console.log(`- Success Updated: ${successCount} companies`);
  console.log(`- Failed: ${failCount} companies`);
  console.log(`- Remaining companies to fill: ${targets.length - successCount}`);
  console.log("==================================================");
}

main()
  .catch(err => console.error("Backfill failed:", err))
  .finally(async () => {
    await pool.end();
    process.exit();
  });

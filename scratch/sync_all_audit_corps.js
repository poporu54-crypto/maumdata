const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. .env.local 로드
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local", e);
}

const DATABASE_URL = process.env.DATABASE_URL;
const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7"; // DART Open API Key

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[DB Pool Error] Unexpected error on idle client:', err);
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("=== [DART Auto-Crawler] 대한민국 외감/공시대상 기업 자동 등록 배치 가동 ===");
  
  // 1. DART 고유번호 캐시 파일 로드
  const cacheFilePath = path.join(__dirname, '..', 'src/data/dart_codes.json');
  if (!fs.existsSync(cacheFilePath)) {
    console.error("[Error] dart_codes.json 캐시 파일이 없습니다. 메인 사이트를 먼저 빌드하거나 브라우저로 1회 접속하여 캐시를 생성해 주세요.");
    return;
  }

  let data;
  try {
    const content = fs.readFileSync(cacheFilePath, 'utf-8');
    data = JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse dart_codes.json:", err);
    return;
  }

  // 전체 고유번호(corp_code) 고유 목록 추출
  const allCorpCodes = new Set(Object.values(data.byName));
  console.log(`[DART Map] 캐시에서 총 ${allCorpCodes.size}개의 기업 고유번호를 확보했습니다.`);

  // 2. 이미 DB에 등록된 dart_code 목록 조회 (중복 수집 방지)
  const client = await pool.connect();
  client.on('error', (err) => {
    console.error('[DB Client Error] Unexpected error:', err);
  });
  let existingCodes = new Set();
  try {
    const res = await client.query("SELECT dart_code FROM businesses WHERE dart_code IS NOT NULL AND dart_code != ''");
    res.rows.forEach(r => existingCodes.add(r.dart_code));
    console.log(`[DB Scan] 이미 수집된 기업 수: ${existingCodes.size}개`);
  } catch (err) {
    console.error("DB 조회 중 오류 발생:", err);
    client.release();
    return;
  }

  // 3. 미수집 대상 고유번호 리스트 도출
  const targets = [];
  for (const code of allCorpCodes) {
    if (!existingCodes.has(code)) {
      targets.push(code);
    }
  }
  console.log(`[Target Scan] 신규 수집 필요 대상 기업: ${targets.size || targets.length}개`);

  if (targets.length === 0) {
    console.log("수집할 신규 대상이 없습니다. 배치를 종료합니다.");
    client.release();
    return;
  }

  // 4. 일일 수집 한도(예: 8,000건) 지정 및 순회 개시
  const LIMIT = 8000; 
  const currentBatch = targets.slice(0, LIMIT);
  console.log(`[Batch Plan] 금일 수집 목표량: ${currentBatch.length}개 기업 (한도 초과 방지 가드 작동)`);

  let successCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < currentBatch.length; i++) {
    const corpCode = currentBatch[i];
    console.log(`[Progress] (${i + 1}/${currentBatch.length}) Processing DART corp_code: ${corpCode}`);

    // DART API 호출 과부하 방지용 500ms 딜레이 (초당 2건 제한)
    await delay(500);

    const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`HTTP error status: ${response.status}`);
        continue;
      }
      const json = await response.json();

      // 한도 초과 오류 처리 (status 020: 일일 제한 초과)
      if (json.status === "020") {
        console.warn("\n[Warning] OpenDART API 일일 호출 한도(1만건)를 초과했습니다. 배치를 안전하게 조기 종료합니다.");
        break;
      }

      if (json.status !== "000") {
        console.warn(`DART API error for ${corpCode}: ${json.message}`);
        continue;
      }

      const bNo = (json.bizr_no || "").replace(/[^0-9]/g, "");
      const crno = (json.jurir_no || "").replace(/[^0-9]/g, "");
      const corpName = json.corp_name || "";

      if (!bNo || bNo.length !== 10) {
        console.warn(`[Skip] 사업자등록번호가 유효하지 않거나 없는 기업입니다: ${corpName} (bNo: ${json.bizr_no})`);
        invalidCount++;
        continue;
      }

      // businesses 테이블에 수집된 정보를 upsert
      await client.query(`
        INSERT INTO businesses (
          b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_type, 
          corp_no, dart_code, description, credit_rating, industry_rank, 
          data_source, is_sme, listing_status, homepage, main_biz, is_audited, crno, nts_last_sync_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP)
        ON CONFLICT (b_no) DO UPDATE SET
          b_nm = EXCLUDED.b_nm,
          p_nm = EXCLUDED.p_nm,
          start_dt = EXCLUDED.start_dt,
          b_adr = EXCLUDED.b_adr,
          b_sector = EXCLUDED.b_sector,
          b_type = EXCLUDED.b_type,
          corp_no = EXCLUDED.corp_no,
          dart_code = EXCLUDED.dart_code,
          crno = EXCLUDED.crno,
          is_audited = EXCLUDED.is_audited,
          homepage = EXCLUDED.homepage
      `, [
        bNo,                                                                 // 1
        corpName,                                                            // 2
        json.ceo_nm || "-",                                                  // 3
        (json.est_dt || "").replace(/[^0-9]/g, ""),                          // 4
        json.adres || "주소 정보 없음",                                         // 5
        json.induty_code || "기타 서비스업",                                     // 6
        "일반기업",                                                           // 7 (b_type)
        crno,                                                                // 8 (corp_no)
        corpCode,                                                            // 9 (dart_code)
        `${corpName}은(는) 금융감독원 DART 공시 정보가 등록된 대한민국 정식 기업입니다.`, // 10 (description)
        "-",                                                                 // 11 (credit_rating)
        "-",                                                                 // 12 (industry_rank)
        "public",                                                            // 13 (data_source)
        "일반기업",                                                           // 14 (is_sme)
        json.stock_code ? `코스피 상장 (${json.stock_code})` : "비상장",          // 15 (listing_status)
        json.hm_url || "-",                                                  // 16 (homepage)
        json.induty_code || "-",                                             // 17 (main_biz)
        true,                                                                // 18 (is_audited)
        crno                                                                 // 19 (crno)
      ]);

      console.log(`[Success] Registered: ${corpName} (사업자번호: ${bNo})`);
      successCount++;

    } catch (err) {
      console.error(`Error during processing ${corpCode}:`, err);
    }
  }

  client.release();
  console.log(`\n=== [Crawling Summary] 금일 배치 완료 ===`);
  console.log(`신규 등록 성공: ${successCount}건`);
  console.log(`사업자번호 없음(건너뜀): ${invalidCount}건`);
  console.log(`남은 신규 대상 잔여량: ${targets.length - successCount - invalidCount}개`);
}

run().then(() => pool.end());

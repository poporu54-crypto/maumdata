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

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ksicMap.ts와 동일한 로직 이식 (JS용)
const KSIC_MAP = {
  "26": "반도체 및 전자부품 제조업",
  "261": "반도체 제조업",
  "2611": "반도체 제조업",
  "2612": "반도체 제조업",
  "262": "반도체 및 전자부품 제조업",
  "2629": "반도체 및 전자부품 제조업",
  "263": "컴퓨터 및 주변장치 제조업",
  "264": "통신 및 방송 장비 제조업",
  "2641": "통신 및 방송 장비 제조업",
  "2642": "통신 및 방송 장비 제조업",
  "265": "비디오 및 기타 영상기기 제조업",
  "2651": "비디오 및 기타 영상기기 제조업",
  "30": "자동차 및 트레일러 제조업",
  "41": "종합 건설업",
  "411": "종합 건설업",
  "4111": "종합 건설업",
  "4112": "종합 건설업",
  "42": "전문직별 공사업",
  "58": "소프트웨어 개발 및 IT 서비스업",
  "582": "소프트웨어 개발 및 IT 서비스업",
  "5822": "소프트웨어 개발 및 IT 서비스업",
  "58221": "소프트웨어 개발 및 IT 서비스업",
  "58222": "소프트웨어 개발 및 IT 서비스업",
  "64": "금융 지원 서비스업",
  "642": "금융 지원 서비스업",
  "64201": "금융 지원 서비스업",
  "64209": "금융 지원 서비스업",
  "649": "금융 지원 서비스업",
  "6499": "금융 지원 서비스업",
  "64999": "금융 지원 서비스업",
  "66": "금융 지원 서비스업",
  "66199": "금융 지원 서비스업",
  "68": "부동산 개발 및 공급업",
  "681": "부동산 개발 및 공급업",
  "6811": "부동산 임대업",
  "68112": "부동산 임대업",
  "6812": "부동산 개발 및 공급업",
  "68121": "부동산 개발 및 공급업",
  "68122": "부동산 개발 및 공급업",
  "68129": "부동산 개발 및 공급업",
  "6822": "부동산 관리업",
  "71": "경영 컨설팅 및 기술 서비스업",
  "71531": "경영 컨설팅 및 기술 서비스업",
  "55101": "호텔 및 관광숙박업",
  "91121": "스포츠 레저시설 운영업"
};

const SPECIAL_SECTOR_CORRECTIONS = {
  "1248100998": "반도체 및 전자부품 제조업", // 삼성전자
  "1268122074": "반도체 및 전자부품 제조업", // SK하이닉스
};

function getKsicName(code, bNo) {
  const cleanBNo = bNo ? bNo.replace(/[^0-9]/g, "") : "";
  if (cleanBNo && SPECIAL_SECTOR_CORRECTIONS[cleanBNo]) {
    return SPECIAL_SECTOR_CORRECTIONS[cleanBNo];
  }

  if (!code) return "기타 서비스업";
  const cleanCode = code.trim();

  if (KSIC_MAP[cleanCode]) return KSIC_MAP[cleanCode];

  for (let len = cleanCode.length - 1; len >= 2; len--) {
    const subCode = cleanCode.substring(0, len);
    if (KSIC_MAP[subCode]) {
      return KSIC_MAP[subCode];
    }
  }

  if (/^[0-9]+$/.test(cleanCode)) {
    return "기타 제조업/금융업";
  }

  return cleanCode;
}

async function run() {
  const client = await pool.connect();
  try {
    console.log("=== DB Sector Migration & Healing Start ===");
    
    // 전체 기업 조회
    const res = await client.query("SELECT b_no, b_nm, b_sector FROM businesses");
    console.log(`총 ${res.rows.length}개 기업 분석 중...`);

    const updateTasks = [];
    for (const row of res.rows) {
      const currentSector = row.b_sector || "";
      const healedSector = getKsicName(currentSector, row.b_no);

      if (currentSector !== healedSector) {
        updateTasks.push({
          b_no: row.b_no,
          b_nm: row.b_nm,
          healedSector
        });
      }
    }

    console.log(`실제 보정이 필요한 기업 수: ${updateTasks.length}개`);

    let updatedCount = 0;
    const batchSize = 1000;
    
    for (let i = 0; i < updateTasks.length; i += batchSize) {
      const batch = updateTasks.slice(i, i + batchSize);
      
      const valueStrings = [];
      const queryParams = [];
      
      batch.forEach((task, index) => {
        const p1 = index * 2 + 1;
        const p2 = index * 2 + 2;
        valueStrings.push(`($${p1}, $${p2})`);
        queryParams.push(task.b_no, task.healedSector);
      });
      
      const bulkQuery = `
        UPDATE businesses AS b
        SET b_sector = tmp.sector,
            main_biz = tmp.sector
        FROM (VALUES ${valueStrings.join(', ')}) AS tmp(b_no, sector)
        WHERE b.b_no = tmp.b_no
      `;
      
      await client.query(bulkQuery, queryParams);
      updatedCount += batch.length;
      console.log(`[Healed] ${updatedCount} / ${updateTasks.length}개 기업 업종 보정 완료...`);
    }

    console.log(`\n=== Migration 완료 ===`);
    console.log(`총 보정된 기업 수: ${updatedCount}개`);

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

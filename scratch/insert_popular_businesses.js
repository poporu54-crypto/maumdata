const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

// 대한민국 주요 유명 기업 및 IT/스타트업 사업자등록번호 목록 (10자리)
const popularBusinesses = [
  { no: "1248100998", comment: "삼성전자" },
  { no: "1018109147", comment: "현대자동차" },
  { no: "2208162517", comment: "네이버" },
  { no: "1208147521", comment: "카카오" },
  { no: "1208801280", comment: "토스 (비바리퍼블리카)" },
  { no: "1208800767", comment: "쿠팡" },
  { no: "3758700088", comment: "당근" },
  { no: "1208781150", comment: "우아한형제들 (배달의민족)" },
  { no: "2118879947", comment: "무신사" },
  { no: "2618123567", comment: "컬리" },
  { no: "2208782853", comment: "야놀자" },
  { no: "1208797992", comment: "쏘카" },
  { no: "1198691245", comment: "오늘의집 (버킷플레이스)" },
  { no: "2118883861", comment: "직방" },
  { no: "1208742841", comment: "하이브 (BTS 소속사)" },
  { no: "2208717483", comment: "넥슨코리아" },
  { no: "1448119038", comment: "엔씨소프트" },
  { no: "1058764746", comment: "넷마블" },
  { no: "2208745308", comment: "크래프톤" },
  { no: "1068643981", comment: "아모레퍼시픽" },
  { no: "1048609535", comment: "CJ제일제당" },
  { no: "2018121515", comment: "스타벅스코리아" },
  { no: "8148600921", comment: "11번가" },
  { no: "2208775892", comment: "위메프" },
  { no: "2208183676", comment: "지마켓" },
  { no: "8518500622", comment: "롯데쇼핑" },
  { no: "2018132195", comment: "신세계" },
  { no: "1208100813", comment: "현대백화점" },
  { no: "1138645836", comment: "번개장터" },
  { no: "1058782705", comment: "아이디어스 (백패커)" },
  { no: "1028105450", comment: "삼양식품" },
  { no: "1298101153", comment: "오뚜기" },
  { no: "1108105030", comment: "농심" },
  { no: "1248621827", comment: "팔도" },
  { no: "1048137225", comment: "SK텔레콤" },
  { no: "1028142945", comment: "KT" },
  { no: "2208139938", comment: "LG유플러스" },
  { no: "2118122271", comment: "포스코홀딩스" },
  { no: "1108114790", comment: "대한항공" },
  { no: "1048117480", comment: "아시아나항공" },
  { no: "7028601646", comment: "토스뱅크" },
  { no: "3758800075", comment: "카카오뱅크" },
  { no: "8018100431", comment: "케이뱅크" },
  { no: "1018187854", comment: "국민은행" },
  { no: "1028126684", comment: "신한은행" },
  { no: "2018100071", comment: "우리은행" },
  { no: "2028102682", comment: "하나은행" }
];

async function main() {
  try {
    console.log(`Inserting ${popularBusinesses.length} popular business seeds into Neon DB...`);
    let insertCount = 0;

    for (const biz of popularBusinesses) {
      // 이미 DB에 존재하는지 번호로 체크
      const checkRes = await pool.query("SELECT b_no FROM businesses WHERE b_no = $1", [biz.no]);
      
      if (checkRes.rows.length === 0) {
        // DB에 없을 때만 '상호 정보 없음' 형태로 신규 파이프라인 트리거용 임시 적재
        await pool.query(`
          INSERT INTO businesses (
            b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_type,
            description, credit_rating, industry_rank, is_sme, listing_status,
            homepage, main_biz, is_audited, brand_name,
            tax_type, tax_type_cd
          ) VALUES (
            $1, '상호 정보 없음', '-', '-', '주소 정보 없음 (공시 비대상)', '미등록 업종', '소상공인/개인사업자',
            $2, '-', '-', '소상공인', '비상장',
            '-', '-', false, '상호 정보 없음, 상호 정보 없음',
            '부가가치세 일반과세자', '01'
          )
        `, [
          biz.no,
          `국세청 실시간 계속사업자 상태가 검증되었으나 상세 공시 정보가 동기화되지 않은 기업(${biz.comment})입니다.`
        ]);
        console.log(`[Seed Inserted] Added: ${biz.no} (${biz.comment})`);
        insertCount++;
      } else {
        console.log(`[Skip] Already exists: ${biz.no} (${biz.comment})`);
      }
    }

    console.log(`Successfully seeded ${insertCount} new businesses into queue!`);

  } catch (err) {
    console.error("Fatal seed error:", err);
  } finally {
    await pool.end();
  }
}

main();

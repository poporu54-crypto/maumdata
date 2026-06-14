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

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// 2. 추가할 주요 대기업 & IT 스타트업 사업자번호 리스트
const BULK_LIST = [
  { b_no: "1248100998", comment: "삼성전자" },
  { b_no: "1078614075", comment: "LG전자" },
  { b_no: "1268112502", comment: "SK하이닉스" },
  { b_no: "1018116295", comment: "현대자동차" },
  { b_no: "1208765763", comment: "우아한형제들 (배달의민족)" },
  { b_no: "2208702515", comment: "야놀자" },
  { b_no: "2118883504", comment: "무신사" },
  { b_no: "3758700871", comment: "당근마켓 (당근)" },
  { b_no: "2118879659", comment: "직방" },
  { b_no: "1208829283", comment: "버킷플레이스 (오늘의집)" },
  { b_no: "2618123567", comment: "컬리 (마켓컬리)" },
  { b_no: "1168189020", comment: "쏘카" },
  { b_no: "1208800767", comment: "쿠팡" },
  { b_no: "1108114790", comment: "대한항공" },
  { b_no: "2068650913", comment: "이마트" },
  { b_no: "1048635071", comment: "아모레퍼시픽" },
  { b_no: "1048609857", comment: "CJ제일제당" },
  { b_no: "1088179208", comment: "하이브 (HYBE)" },
  { b_no: "2208162508", comment: "크래프톤" },
  { b_no: "1448119038", comment: "엔씨소프트" },
  { b_no: "1058764746", comment: "넷마블" },
  // 신규 대량 수집 목록 추가
  { b_no: "5278800686", comment: "카카오페이" },
  { b_no: "1198654968", comment: "두나무 (업비트)" },
  { b_no: "1648700149", comment: "에이블리코퍼레이션" },
  { b_no: "2148891525", comment: "카카오스타일 (지그재그)" },
  { b_no: "2998600021", comment: "원티드랩" },
  { b_no: "3758800197", comment: "카카오뱅크" },
  { b_no: "4628601671", comment: "토스뱅크" },
  { b_no: "8268100172", comment: "케이뱅크" },
  { b_no: "1208727435", comment: "리디" },
  { b_no: "2208889136", comment: "샌드박스네트워크" },
  { b_no: "2098155339", comment: "마이리얼트립" },
  { b_no: "2208871844", comment: "빗썸코리아" },
  { b_no: "1888801893", comment: "티빙" },
  { b_no: "2328122920", comment: "네이버파이낸셜" },
  { b_no: "2048645520", comment: "카카오페이증권" },
  { b_no: "8898601777", comment: "토스증권" },
  { b_no: "2118893665", comment: "왓챠" },
  { b_no: "1138682701", comment: "콘텐츠웨이브 (웨이브)" },
  { b_no: "1348702206", comment: "당근페이" },
  { b_no: "1208841716", comment: "발란" },
  { b_no: "1358700465", comment: "트렌비" },
  { b_no: "1358700275", comment: "머스트잇" },
  { b_no: "2208843890", comment: "브랜디" },
  { b_no: "6638600994", comment: "클래스101" },
  { b_no: "4978100626", comment: "인프랩 (인프런)" },
  { b_no: "1208795627", comment: "크몽" },
  { b_no: "1208796420", comment: "숨고 (브레이브모바일)" },
  { b_no: "1088606833", comment: "데브시스터즈" }
];

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log(`=== [Bulk Insert] 사업자번호 일괄 임시 적재 시작 (총 ${BULK_LIST.length}개) ===`);
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;

  try {
    for (const biz of BULK_LIST) {
      const cleanBNo = biz.b_no.replace(/[^0-9]/g, "");
      
      // 1. 이미 존재하는 사업자 번호인지 체크
      const checkRes = await client.query("SELECT b_no, b_nm FROM businesses WHERE b_no = $1", [cleanBNo]);
      if (checkRes.rows.length > 0) {
        console.log(`[중복 건너뜀] 이미 DB에 존재함: ${cleanBNo} (${checkRes.rows[0].b_nm})`);
        skipped++;
        continue;
      }

      // 2. '상호 정보 없음' 상태로 임시 적재
      await client.query(`
        INSERT INTO businesses (
          b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_type, description, credit_rating, industry_rank, data_source, is_sme, listing_status, homepage, main_biz, is_audited
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        cleanBNo,
        "상호 정보 없음",
        "-",
        "-",
        "주소 정보 없음 (공시 비대상)",
        "미등록 업종",
        "소상공인/개인사업자",
        `사업자 상태 검증 및 외부 정보 동기화가 필요한 신규 유입 사업자등록번호(${cleanBNo})입니다.`,
        "-",
        "-",
        "estimated",
        "소상공인",
        "비상장",
        "-",
        "-",
        false
      ]);

      console.log(`[임시 적재 완료] ${cleanBNo} (${biz.comment})`);
      inserted++;
    }

    console.log(`\n[최종 보고] 신규 적재: ${inserted}건, 중복 건너뜀: ${skipped}건`);
    console.log("\n※ 팁: 이제 어드민 대시보드(http://localhost:3000/admin)에 로그인하여 '일괄 동기화(Bulk Sync)' 버튼을 누르면,");
    console.log("  적재된 사업자번호들을 돌며 국세청/공정위/국민연금/DART API로부터 진짜 기업 정보를 자동으로 채워넣습니다!");
  } catch (err) {
    console.error("DB 적재 에러:", err);
  } finally {
    client.release();
  }
}

run().then(() => pool.end());

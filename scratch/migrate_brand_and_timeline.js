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

// 상호명 정규화 필터 (법인 수식어 제거)
function extractCoreBrand(name) {
  if (!name) return "";
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .replace(/（주）/g, "")
    .replace(/\(유\)/g, "")
    .replace(/유한회사/g, "")
    .replace(/\(사\)/g, "")
    .replace(/사단법인/g, "")
    .trim();
}

async function main() {
  console.log("Connecting to Neon DB...");
  await client.connect();
  console.log("Connected!");

  // 1. brand_name 컬럼 추가
  console.log("1. Adding brand_name column to businesses if it doesn't exist...");
  await client.query(`
    ALTER TABLE businesses 
    ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255) DEFAULT '';
  `);
  console.log("Column brand_name added successfully (or already exists).");

  // 2. business_timeline 테이블 신설
  console.log("2. Creating business_timeline table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_timeline (
      id SERIAL PRIMARY KEY,
      b_no VARCHAR(10) REFERENCES businesses(b_no) ON DELETE CASCADE,
      event_date VARCHAR(8) NOT NULL,
      event_title VARCHAR(255) NOT NULL,
      event_description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(b_no, event_date, event_title)
    );
  `);
  console.log("Table business_timeline created successfully.");

  // 3. 기존 등록 기업 데이터에 대해 브랜드 별칭 및 히스토리 타임라인 마이그레이션 데이터 설정
  const defaultTimelines = {
    // 토스
    "1208801280": {
      brand: "토스, Toss, 비바리퍼블리카",
      timeline: [
        { date: "20130423", title: "법인 설립", desc: "주식회사 비바리퍼블리카 설립 (창업자 이승건)" },
        { date: "20150226", title: "서비스 런칭", desc: "모바일 간편 송금 서비스 '토스(Toss)' 공식 출시" },
        { date: "20210309", title: "인터넷전문은행 본인가", desc: "토스뱅크 인터넷전문은행 예비인가 및 공식 본인가 획득" }
      ]
    },
    // 스타벅스 (에스씨케이컴퍼니)
    "2018121515": {
      brand: "스타벅스, 스타벅스코리아, 스타벅스 코리아, 에스씨케이컴퍼니, SCK컴퍼니",
      timeline: [
        { date: "19970910", title: "법인 설립", desc: "주식회사 스타벅스커피코리아 설립 (신세계그룹과 미국 스타벅스 본사 합작 법인)" },
        { date: "19990727", title: "1호점 오픈", desc: "이대앞에 한국 스타벅스 1호 매장 신규 오픈" },
        { date: "20211231", title: "상호명 변경", desc: "주식회사 에스씨케이컴퍼니로 상호명 변경 (미국 스타벅스 본사 지분을 신세계그룹 이마트가 전량 인수)" }
      ]
    },
    // 네이버
    "2208162517": {
      brand: "네이버, NAVER, Naver",
      timeline: [
        { date: "19990602", title: "법인 설립", desc: "네이버컴 주식회사 설립 (이해진 창업자)" },
        { date: "20000515", title: "한게임 합병", desc: "한게임커뮤니케이션 인수 합병 및 NHN 공동 창업" },
        { date: "20010911", title: "상호명 변경", desc: "NHN 주식회사(Next Human Network)로 사명 변경" },
        { date: "20021029", title: "코스닥 상장", desc: "NHN 주식회사 코스닥 시장 공식 등록 및 거래 시작" },
        { date: "20031012", title: "지식iN 서비스 런칭", desc: "검색 포털 내 사용자 참여형 지식iN(지식인) 검색 정식 출시" },
        { date: "20040615", title: "포털 검색 1위 달성", desc: "국내 인터넷 검색 시장 점유율 공식 1위 등극" },
        { date: "20081128", title: "코스피 이전 상장", desc: "코스닥에서 유가증권시장(KOSPI)으로 주식 이전 상장 완료" },
        { date: "20100510", title: "그린팩토리 사옥 입주", desc: "성남시 분당구 정자동 친환경 신사옥 '그린팩토리' 완공 및 이전 입주" },
        { date: "20110623", title: "글로벌 라인(LINE) 출시", desc: "모바일 메신저 서비스 '라인(LINE)' 전 세계 공식 서비스 개시" },
        { date: "20130801", title: "상호명 변경", desc: "네이버 주식회사(NAVER Corporation)로 최종 상호 변경 및 NHN엔터테인먼트 인적분할" },
        { date: "20150312", title: "모바일 웹툰 플랫폼 런칭", desc: "네이버웹툰 모바일 앱 출시 및 글로벌 웹툰 시장 본격 공략" },
        { date: "20170301", title: "네이버랩스 분사", desc: "자율주행 및 로보틱스 연구 전담 '네이버랩스' 스핀오프 독립법인 설립" },
        { date: "20210301", title: "라인-야후 경영 통합", desc: "라인(LINE)과 야후 재팬의 합작 지주회사 Z홀딩스 공식 출범" },
        { date: "20230824", title: "하이퍼클로바X 공개", desc: "초거대 인공지능(AI) 모델 '하이퍼클로바X(HyperCLOVA X)' 전격 출시" }
      ]
    },
    // 카카오
    "1208147521": {
      brand: "카카오, Kakao, KAKAO, 다음, Daum",
      timeline: [
        { date: "19950216", title: "법인 설립", desc: "주식회사 다음커뮤니케이션 설립 (이재웅 창업자)" },
        { date: "20141001", title: "합병 및 상호 변경", desc: "모바일 플랫폼 카카오와 합병 완료에 따라 주식회사 다음카카오로 변경 등기" },
        { date: "20150923", title: "상호명 변경", desc: "주식회사 카카오(Kakao Corporation)로 사명 최종 변경" }
      ]
    },
    // 삼양식품
    "1028105450": {
      brand: "삼양식품, 삼양, 불닭볶음면, 삼양라면",
      timeline: [
        { date: "19610915", title: "법인 설립", desc: "삼양식품공업 주식회사 설립 (전중윤 창업자)" },
        { date: "19630915", title: "삼양라면 출시", desc: "대한민국 최초의 봉지 라면 '삼양라면' 개발 및 출시" },
        { date: "19900601", title: "상호명 변경", desc: "삼양식품 주식회사로 사명 변경" }
      ]
    }
  };

  // 4. DB의 모든 기업 정보를 조회하여 brand_name 일괄 적재 및 설립일 기준 자동 연합
  const res = await client.query("SELECT b_no, b_nm, start_dt FROM businesses");
  console.log(`\n3. Migrating brand names and timelines for ${res.rows.length} businesses...`);

  for (const row of res.rows) {
    const cleanBNo = row.b_no;
    const info = defaultTimelines[cleanBNo];
    
    // 브랜드 별칭 처리
    let brandVal = "";
    if (info && info.brand) {
      brandVal = info.brand;
    } else {
      const core = extractCoreBrand(row.b_nm);
      brandVal = core ? `${core}, ${row.b_nm}` : row.b_nm;
    }

    await client.query("UPDATE businesses SET brand_name = $1 WHERE b_no = $2", [brandVal, cleanBNo]);
    console.log(`-> Updated brand_name for ${row.b_nm} (${cleanBNo}) to: "${brandVal}"`);

    // 타임라인 연혁 처리
    let timelineEvents = [];
    if (info && info.timeline) {
      timelineEvents = info.timeline;
    }

    for (const ev of timelineEvents) {
      await client.query(`
        INSERT INTO business_timeline (b_no, event_date, event_title, event_description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (b_no, event_date, event_title) DO NOTHING
      `, [cleanBNo, ev.date, ev.title, ev.desc]);
    }
    console.log(`   Added ${timelineEvents.length} timeline events for ${row.b_nm}.`);
  }

  await client.end();
  console.log("\nMigration completed successfully!");
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await client.end();
});

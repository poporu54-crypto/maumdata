const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7";

async function testApi(url, name) {
  console.log(`\n--- Testing ${name} ---`);
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("Status:", json.status);
    console.log("Message:", json.message);
    if (json.list) {
      console.log(`Found ${json.list.length} items.`);
      json.list.slice(0, 5).forEach(item => {
        console.log(`Account: ${item.account_nm}, Amount: ${item.thstrm_amount || item.thstrm_dt}, FS: ${item.fs_div}`);
      });
    } else {
      console.log("No list found. Raw keys:", Object.keys(json));
    }
  } catch (err) {
    console.error(`Error testing ${name}:`, err.message);
  }
}

async function run() {
  const corpCode = '01473717'; // 구글코리아
  
  // 1. 단일회사 주요계정 조회 (2024년 사업보고서)
  const url1 = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=2024&reprt_code=11011`;
  await testApi(url1, "fnlttSinglAcnt (2024)");
  
  // 2. 단일회사 주요계정 조회 (2024년 반기보고서)
  const url1_half = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=2024&reprt_code=11012`;
  await testApi(url1_half, "fnlttSinglAcnt (2024 Half)");

  // 3. 단일회사 전체 재무제표 (2024년 사업보고서 - 보통 외감 유한회사는 이쪽이나 감사보고서에 정보가 있을 수 있음)
  const url2 = `https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=2024&reprt_code=11011&fs_div=OFS`;
  await testApi(url2, "fnlttSinglAcntAll (2024 OFS)");
  
  // 4. 최근 공시 리스트 조회 (감사보고서 제출 현황)
  const url3 = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bgn_de=20200101&end_de=20260612&page_no=1&page_count=30`;
  try {
    const res = await fetch(url3);
    const json = await res.json();
    console.log("\n--- Disclosures ---");
    if (json.list) {
      json.list.forEach(item => {
        console.log(`Report: ${item.report_nm}, Date: ${item.rcept_dt}, Flr: ${item.flr_nm}, RceptNo: ${item.rcept_no}`);
      });
    } else {
      console.log("No disclosures found.");
    }
  } catch (e) {
    console.error(e);
  }
}

run();

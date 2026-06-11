const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";

async function testFsc(bzno, crno) {
  let url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json`;
  if (crno) {
    url += `&crno=${crno}`;
  } else {
    url += `&bzno=${bzno}`;
  }
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log(`\n--- Test (bzno: ${bzno}, crno: ${crno}) ---`);
    console.log(text.substring(0, 1000));
  } catch (err) {
    console.error("Error:", err);
  }
}

async function run() {
  // 1. 토스 사업자번호로 조회
  await testFsc("1208801280", null);
  // 2. 토스 법인등록번호로 조회
  await testFsc(null, "1101115119080");
  // 3. 지윤 주식회사 사업자번호로 조회
  await testFsc("1378651839", null);
}

run();

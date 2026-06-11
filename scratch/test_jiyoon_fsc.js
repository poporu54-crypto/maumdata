const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";

async function testRealJiyoonOutline() {
  const crno = "1201110741274"; // 지윤 주식회사 법인등록번호
  
  // 금융위원회 기업개요 검색 (법인등록번호 기준)
  const basicUrl = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&crno=${crno}`;
  console.log(`[FSC API] Fetching outline for Real Jiyoon via: ${basicUrl}`);

  try {
    const res = await fetch(basicUrl);
    if (!res.ok) {
      console.error("HTTP error:", res.status);
      return;
    }
    const json = await res.json();
    const item = json?.response?.body?.items?.item?.[0];
    if (item) {
      console.log("\n[Test Result] FSC Real Outline:", JSON.stringify(item, null, 2));
    } else {
      console.log("No items found.");
    }
  } catch (err) {
    console.error("FSC Test failed with error:", err);
  }
}

testRealJiyoonOutline();

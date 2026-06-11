const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";

async function findMarketCodes() {
  // 500개 긁어와서 시장 구분의 고유값 확인
  const url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=500&resultType=json`;
  console.log(`Fetching 500 items to check market codes: ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("HTTP error:", res.status);
      return;
    }
    const json = await res.json();
    const items = json?.response?.body?.items?.item || [];
    console.log(`Fetched ${items.length} items.`);
    
    const marketMap = new Map();
    items.forEach(item => {
      const code = item.corpRegMrktDcd || "NULL";
      const name = item.corpRegMrktDcdNm || "NULL";
      marketMap.set(code, name);
    });

    console.log("\n--- Unique Market Codes Found ---");
    console.log(Array.from(marketMap.entries()));

  } catch (err) {
    console.error("Failed:", err);
  }
}

findMarketCodes();

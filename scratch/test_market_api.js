const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";

async function testMarketApi() {
  const today = new Date();
  // 최근 평일 기준 날짜 포맷 (예: 20260610)
  const basDt = "20260610"; // 최근 데이터 기준일자
  const url = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=10&resultType=json&basDt=${basDt}`;
  
  console.log(`Fetching stock prices: ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("HTTP error:", res.status);
      return;
    }
    const json = await res.json();
    const items = json?.response?.body?.items?.item || [];
    console.log(`Found ${items.length} stock items.`);
    if (items.length > 0) {
      console.log("Sample stock item:", JSON.stringify(items[0], null, 2));
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testMarketApi();

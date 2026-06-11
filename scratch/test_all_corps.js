const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";

async function testAllCorpList() {
  // 아무 필터 없이 10건 조회
  const url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=10&resultType=json`;
  console.log(`Fetching general corp outline: ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("HTTP error:", res.status);
      return;
    }
    const json = await res.json();
    const items = json?.response?.body?.items?.item || [];
    console.log(`Found ${items.length} items.`);
    if (items.length > 0) {
      console.log("Sample item fields:");
      console.log(Object.keys(items[0]));
      console.log("\nSample item data:", JSON.stringify(items[0], null, 2));
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testAllCorpList();

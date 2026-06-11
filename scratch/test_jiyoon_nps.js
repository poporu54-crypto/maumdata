const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";
const API_URL = "http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2";

async function testJiyoonNps() {
  const cleanBNo = "1378651839";
  const cleanCompanyNm = "지윤";
  
  const encodedName = encodeURIComponent(cleanCompanyNm);
  const searchUrl = `${API_URL}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=50&dataType=json&wkplNm=${encodedName}`;

  console.log(`[NPS API Step 1] Searching list for: ${cleanCompanyNm} via ${searchUrl}`);

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`HTTP error: ${response.status}`);
      return;
    }
    const text = await response.text();
    console.log("Step 1 raw text response containing:", text.substring(0, 300));
    
    const json = JSON.parse(text);
    const items = json?.response?.body?.items?.item;
    if (!items) {
      console.log("No items found in Step 1.");
      return;
    }

    const list = Array.isArray(items) ? items : [items];
    const targetBNo6 = cleanBNo.substring(0, 6);
    const matched = list.find((item) => {
      const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
      return apiBNo.startsWith(targetBNo6);
    });

    if (!matched) {
      console.log(`No matched company with prefix ${targetBNo6}`);
      return;
    }

    console.log("Matched company item from Step 1:", JSON.stringify(matched, null, 2));
    const seq = matched.seq;

    const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;
    console.log(`[NPS API Step 2] Fetching detail for seq: ${seq}`);

    const detailResponse = await fetch(detailUrl);
    const detailText = await detailResponse.text();
    const detailJson = JSON.parse(detailText);
    
    console.log("\n[Test Result] NPS API Step 2 response detail:", JSON.stringify(detailJson, null, 2));
  } catch (err) {
    console.error("Test failed with error:", err);
  }
}

testJiyoonNps();

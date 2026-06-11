const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";

async function testNpsDetail() {
  const companyNm = "네이버";
  const cleanCompanyNm = companyNm.trim();
  const encodedName = encodeURIComponent(cleanCompanyNm);
  const searchUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=10&dataType=json&wkplNm=${encodedName}`;

  try {
    const response = await fetch(searchUrl);
    const text = await response.text();
    const json = JSON.parse(text);
    const items = json?.response?.body?.items?.item;
    if (!items) {
      console.log("No items found.");
      return;
    }
    const list = Array.isArray(items) ? items : [items];
    const naver = list.find(item => item.wkplNm.includes("네이버"));
    if (!naver) {
      console.log("Naver not found in search.");
      return;
    }

    const seq = naver.seq;
    console.log(`Naver seq: ${seq}`);

    const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;
    const detailResponse = await fetch(detailUrl);
    const detailText = await detailResponse.text();
    const detailJson = JSON.parse(detailText);
    console.log("Detail Response:", JSON.stringify(detailJson, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

testNpsDetail();

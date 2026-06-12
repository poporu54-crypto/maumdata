const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";

async function testNpsDetail() {
  const companyNm = "대상주식회사";
  const cleanCompanyNm = companyNm.trim();
  const encodedName = encodeURIComponent(cleanCompanyNm);
  const searchUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=100&dataType=json&wkplNm=${encodedName}`;

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
    console.log("Search Result Count:", list.length);
    for (const item of list) {
      console.log(`Name: ${item.wkplNm} | BizNo: ${item.bzowrRgstNo} | Seq: ${item.seq}`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testNpsDetail();

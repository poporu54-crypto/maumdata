const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";

async function testMarketList() {
  // 코스피(P) 상장사 5건 조회
  const urlP = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=5&resultType=json&corpRegMrktDcd=P`;
  console.log(`Fetching KOSPI (P): ${urlP}`);
  
  // 코스닥(A) 상장사 5건 조회
  const urlA = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=5&resultType=json&corpRegMrktDcd=A`;
  console.log(`Fetching KOSDAQ (A): ${urlA}`);

  try {
    const resP = await fetch(urlP);
    const jsonP = await resP.json();
    const itemsP = jsonP?.response?.body?.items?.item || [];
    console.log(`KOSPI Found: ${itemsP.length} items.`);
    if (itemsP.length > 0) {
      console.log("KOSPI sample name:", itemsP[0].corpNm, "b_no:", itemsP[0].bzno);
    }

    const resA = await fetch(urlA);
    const jsonA = await resA.json();
    const itemsA = jsonA?.response?.body?.items?.item || [];
    console.log(`KOSDAQ Found: ${itemsA.length} items.`);
    if (itemsA.length > 0) {
      console.log("KOSDAQ sample name:", itemsA[0].corpNm, "b_no:", itemsA[0].bzno);
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testMarketList();

const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";
const API_URL = "http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2";

async function searchNpsBplcList(queryName, targetBNo6, limit = 100) {
  const encodedName = encodeURIComponent(queryName);
  const searchUrl = `${API_URL}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=${limit}&dataType=json&wkplNm=${encodedName}`;

  try {
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) return null;
    const text = await response.text();
    if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
      console.log("Error response text:", text);
      return null;
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.log("JSON parse error:", text);
      return null;
    }

    const items = json?.response?.body?.items?.item;
    if (!items) return null;

    const list = Array.isArray(items) ? items : [items];
    
    // 앞 6자리 매칭
    const matchedList = list.filter((item) => {
      const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
      return apiBNo.startsWith(targetBNo6);
    });

    if (matchedList.length === 0) return null;

    const noiseKeywords = ["일용", "현장", "공사", "납품", "용역", "/", "-"];
    const pureMatches = matchedList.filter((item) => {
      const name = item.wkplNm || "";
      return !noiseKeywords.some(kw => name.includes(kw));
    });

    if (pureMatches.length > 0) {
      pureMatches.sort((a, b) => (a.wkplNm || "").length - (b.wkplNm || "").length);
      return pureMatches[0];
    }

    matchedList.sort((a, b) => (a.wkplNm || "").length - (b.wkplNm || "").length);
    return matchedList[0];
  } catch (err) {
    console.error(`NPS Search Error for ${queryName}:`, err);
    return null;
  }
}

async function getNpsBplcInfo(bzowrRgstNo, companyNm) {
  const cleanBNo = bzowrRgstNo.replace(/[^0-9]/g, "");
  if (cleanBNo.length !== 10 || !companyNm) return null;

  const targetBNo6 = cleanBNo.substring(0, 6);
  let matchedBplc = null;

  const origName = companyNm.trim();
  if (origName) {
    console.log(`Step 1: Searching for '${origName}'...`);
    matchedBplc = await searchNpsBplcList(origName, targetBNo6, 100);
  }

  if (!matchedBplc) {
    const cleanCompanyNm = companyNm
      .replace(/\(.*?\)/g, "")
      .replace(/주식회사/g, "")
      .replace(/\(주\)/g, "")
      .trim();
    if (cleanCompanyNm && cleanCompanyNm !== origName) {
      console.log(`Step 2: Searching for fallback '${cleanCompanyNm}'...`);
      matchedBplc = await searchNpsBplcList(cleanCompanyNm, targetBNo6, 100);
    }
  }

  if (!matchedBplc || !matchedBplc.seq) {
    console.warn(`[NPS API] No matched company found for ${companyNm} (RegNo prefix: ${targetBNo6})`);
    return null;
  }

  const seq = matchedBplc.seq;
  console.log(`Step 3: Found matched company '${matchedBplc.wkplNm}' with seq ${seq}. Fetching detail...`);
  
  const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;

  try {
    const detailResponse = await fetch(detailUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!detailResponse.ok) return null;
    const detailText = await detailResponse.text();
    let detailJson = JSON.parse(detailText);

    const detailItem = detailJson?.response?.body?.items?.item;
    const targetDetail = Array.isArray(detailItem) ? detailItem[0] : detailItem;

    if (targetDetail) {
      const pepCnt = parseInt(targetDetail.jnngpCnt || targetDetail.npsSbscrbNmps || "0");
      return {
        wkplNm: targetDetail.wkplNm || matchedBplc.wkplNm || "",
        bzowrRgstNo: cleanBNo,
        npsSbscrbNmps: pepCnt,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch NPS detail info:", error);
    return null;
  }
}

async function run() {
  const result = await getNpsBplcInfo("1248100998", "삼성전자(주)");
  console.log("NPS API Result for Samsung:", result);
}

run();

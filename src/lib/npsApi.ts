export interface NpsBplcInfo {
  wkplNm: string;           // 사업장명
  bzowrRgstNo: string;      // 사업자등록번호
  npsSbscrbNmps: number;    // 국민연금 가입자수 (종업원수)
  newAcqsNmps?: number;     // 신규취득자수
  lossSbscrbNmps?: number;  // 상실가입자수
}

const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";
const API_URL = "http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2";

/**
 * 국민연금공단 V2 API를 통해 사업자등록번호(10자리) 기준의 국민연금 가입 기본 정보(가입자수 등)를 실시간 조회합니다.
 */
export async function getNpsBplcInfo(bzowrRgstNo: string, companyNm: string): Promise<NpsBplcInfo | null> {
  const cleanBNo = bzowrRgstNo.replace(/[^0-9]/g, "");
  const cleanCompanyNm = companyNm
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .trim();

  if (cleanBNo.length !== 10 || !cleanCompanyNm) return null;

  // Step 1. 회사명(wkplNm)으로 사업장 검색 목록 조회
  const encodedName = encodeURIComponent(cleanCompanyNm);
  const searchUrl = `${API_URL}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=50&dataType=json&wkplNm=${encodedName}`;

  console.log(`[NPS API Step 1] Searching list for: ${cleanCompanyNm} via ${searchUrl}`);

  try {
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`NPS Search API HTTP error: ${response.status}`);
      return null;
    }

    const text = await response.text();
    if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
      return null;
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return null;
    }

    const items = json?.response?.body?.items?.item;
    if (!items) return null;

    const list = Array.isArray(items) ? items : [items];
    
    // 사업자등록번호 앞 6자리가 일치하는 진짜 아이템 필터링
    const targetBNo6 = cleanBNo.substring(0, 6);
    const matched = list.find((item: any) => {
      const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
      return apiBNo.startsWith(targetBNo6);
    });

    if (!matched || !matched.seq) {
      console.warn(`[NPS API Step 1] No matched company found with prefix ${targetBNo6}`);
      return null;
    }

    const seq = matched.seq;
    
    // Step 2. 획득한 고유 seq를 사용하여 상세정보(가입자수) 쿼리
    const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;
    console.log(`[NPS API Step 2] Fetching detail for seq: ${seq}`);

    const detailResponse = await fetch(detailUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!detailResponse.ok) return null;
    const detailText = await detailResponse.text();
    let detailJson;
    try {
      detailJson = JSON.parse(detailText);
    } catch (e) {
      return null;
    }

    const detailItem = detailJson?.response?.body?.items?.item;
    const targetDetail = Array.isArray(detailItem) ? detailItem[0] : detailItem;

    if (targetDetail) {
      const pepCnt = parseInt(targetDetail.jnngpCnt || targetDetail.npsSbscrbNmps || "0");
      
      console.log(`[NPS API Success] Found employee count: ${pepCnt} for seq ${seq}`);

      return {
        wkplNm: targetDetail.wkplNm || matched.wkplNm || "",
        bzowrRgstNo: cleanBNo,
        npsSbscrbNmps: pepCnt,
        newAcqsNmps: 0, // 상세 API에 미제공 시 디폴트 처리
        lossSbscrbNmps: 0,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch NPS company info:", error);
    return null;
  }
}

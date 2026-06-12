export interface NpsBplcInfo {
  wkplNm: string;           // 사업장명
  bzowrRgstNo: string;      // 사업자등록번호
  npsSbscrbNmps: number;    // 국민연금 가입자수 (종업원수)
  newAcqsNmps?: number;     // 신규취득자수
  lossSbscrbNmps?: number;  // 상실가입자수
  npsChrgAmt?: number;      // 국민연금 고지금액 (평균연봉 추정용)
}

const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
const API_URL = "http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2";

/**
 * 국민연금공단 V2 API를 통해 사업자등록번호(10자리) 기준의 국민연금 가입 기본 정보(가입자수 등)를 실시간 조회합니다.
 */
// 다단계 본사 정밀 매칭을 위해 내부 검색 헬퍼 구현
async function searchNpsBplcList(queryName: string, targetBNo6: string, limit = 100): Promise<any | null> {
  const encodedName = encodeURIComponent(queryName);
  const searchUrl = `${API_URL}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=${limit}&dataType=json&wkplNm=${encodedName}`;

  try {
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;
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
    
    // 사업자등록번호 앞 6자리가 매칭되는 리스트 필터링
    const matchedList = list.filter((item: any) => {
      const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
      return apiBNo.startsWith(targetBNo6);
    });

    if (matchedList.length === 0) return null;

    // 진짜 본사 매칭 우선순위 선정 규칙:
    // 1순위: 이름에 일용직/공사용 꼬리말(일용, 현장, 공사, 납품, 용역, /, -)이 포함되지 않은 순수한 레코드
    const noiseKeywords = ["일용", "현장", "공사", "납품", "용역", "/", "-"];
    const pureMatches = matchedList.filter((item: any) => {
      const name = item.wkplNm || "";
      return !noiseKeywords.some(kw => name.includes(kw));
    });

    if (pureMatches.length > 0) {
      // 그중 글자수가 가장 짧은 명칭을 최종 획득 (가장 본사에 가깝고 용역 꼬리말이 없음)
      pureMatches.sort((a, b) => (a.wkplNm || "").length - (b.wkplNm || "").length);
      return pureMatches[0];
    }

    // 2순위: 노이즈 필터링 실패 시, 그냥 글자수가 가장 짧은 레코드
    matchedList.sort((a, b) => (a.wkplNm || "").length - (b.wkplNm || "").length);
    return matchedList[0];
  } catch (err) {
    console.error(`NPS Search Error for ${queryName}:`, err);
    return null;
  }
}

/**
 * 국민연금공단 V2 API를 통해 사업자등록번호(10자리) 기준의 국민연금 가입 기본 정보(가입자수 등)를 실시간 조회합니다.
 */
export async function getNpsBplcInfo(bzowrRgstNo: string, companyNm: string): Promise<NpsBplcInfo | null> {
  const cleanBNo = bzowrRgstNo.replace(/[^0-9]/g, "");
  if (cleanBNo.length !== 10 || !companyNm) return null;

  const targetBNo6 = cleanBNo.substring(0, 6);
  let matchedBplc: any = null;

  // 1단계: 원본 상호명(예: "삼성전자(주)" 또는 "삼성전자주식회사")으로 먼저 정밀 검색 시도
  const origName = companyNm.trim();
  if (origName) {
    matchedBplc = await searchNpsBplcList(origName, targetBNo6, 100);
  }

  // 2단계: 1단계 실패 시, 수식어 및 괄호를 지운 정규 상호명(예: "삼성전자")으로 넓은 검색 시도 (폴백)
  if (!matchedBplc) {
    const cleanCompanyNm = companyNm
      .replace(/\(.*?\)/g, "")
      .replace(/주식회사/g, "")
      .replace(/\(주\)/g, "")
      .trim();
    if (cleanCompanyNm && cleanCompanyNm !== origName) {
      matchedBplc = await searchNpsBplcList(cleanCompanyNm, targetBNo6, 100);
    }
  }

  if (!matchedBplc || !matchedBplc.seq) {
    console.warn(`[NPS API] No matched company found for ${companyNm} (RegNo prefix: ${targetBNo6})`);
    return null;
  }

  const seq = matchedBplc.seq;
  
  // Step 2. 획득한 고유 seq를 사용하여 상세정보(가입자수) 및 기간별 현황(취득/상실자수) 쿼리
  const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;
  const periodUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getPdAcctoSttusInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;
  console.log(`[NPS API Step 2] Fetching detail and period status for seq: ${seq}`);

  try {
    const [detailResponse, periodResponse] = await Promise.all([
      fetch(detailUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
      }),
      fetch(periodUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
      }).catch(() => null)
    ]);

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
      const npsChrgAmt = parseInt(targetDetail.crrmmNtcAmt || "0", 10);
      console.log(`[NPS API Success] Found employee count: ${pepCnt}, charge amount: ${npsChrgAmt} for seq ${seq}`);

      let newAcqsNmps = 0;
      let lossSbscrbNmps = 0;

      if (periodResponse && periodResponse.ok) {
        try {
          const periodText = await periodResponse.text();
          const periodJson = JSON.parse(periodText);
          const periodItem = periodJson?.response?.body?.items?.item;
          const targetPeriod = Array.isArray(periodItem) ? periodItem[0] : periodItem;
          if (targetPeriod) {
            newAcqsNmps = parseInt(targetPeriod.nwAcqzrCnt || "0", 10);
            lossSbscrbNmps = parseInt(targetPeriod.lssJnngpCnt || "0", 10);
            console.log(`[NPS API Success] Found acquisitions: ${newAcqsNmps}, losses: ${lossSbscrbNmps}`);
          }
        } catch (pe) {
          console.error("Failed to parse NPS period status:", pe);
        }
      }

      return {
        wkplNm: targetDetail.wkplNm || matchedBplc.wkplNm || "",
        bzowrRgstNo: cleanBNo,
        npsSbscrbNmps: pepCnt,
        newAcqsNmps,
        lossSbscrbNmps,
        npsChrgAmt,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch NPS detail info:", error);
    return null;
  }
}

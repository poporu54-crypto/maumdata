export interface NpsMonthlyRecord {
  recordMonth: string;      // YYYY-MM
  employees: number;
  newAcquisitions: number;
  losses: number;
  npsChargeAmount: number;
}

export interface NpsBplcInfo {
  wkplNm: string;           // 사업장명
  bzowrRgstNo: string;      // 사업자등록번호
  npsSbscrbNmps: number;    // 국민연금 가입자수 (종업원수)
  newAcqsNmps?: number;     // 신규취득자수
  lossSbscrbNmps?: number;  // 상실가입자수
  npsChrgAmt?: number;      // 국민연금 고지금액 (평균연봉 추정용)
  npsSector?: string;       // 국민연금 업종명 (vldtVlKrnNm)
  dataCrtYm?: string;       // 기준연월 (YYYYMM)
  monthlyHistory?: NpsMonthlyRecord[]; // 최근 월별 고용 추이
}

const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
const API_URL = "http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2";

/**
 * 국민연금공단 V2 API를 통해 사업자등록번호(10자리) 기준의 국민연금 가입 기본 정보(가입자수 등)를 실시간 조회합니다.
 */
// 다단계 본사 정밀 매칭을 위해 내부 검색 헬퍼 구현 (최신순 월별 리스트 반환)
async function searchNpsBplcList(queryName: string, targetBNo6: string, limit = 100): Promise<any[] | null> {
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

    const candidatePool = pureMatches.length > 0 ? pureMatches : matchedList;
    // 가장 짧은(본사에 가까운) 사업장명 선정하되, 최신 연월(dataCrtYm) 우선
    candidatePool.sort((a, b) => {
      const lenDiff = (a.wkplNm || "").length - (b.wkplNm || "").length;
      if (lenDiff !== 0) return lenDiff;
      return String(b.dataCrtYm || "").localeCompare(String(a.dataCrtYm || ""));
    });

    const bestWkplNm = candidatePool[0].wkplNm;
    const sameWorkplaceMonthlyList = candidatePool
      .filter((item: any) => item.wkplNm === bestWkplNm)
      .sort((a: any, b: any) => String(b.dataCrtYm || "").localeCompare(String(a.dataCrtYm || "")));

    // 월별 중복 제거
    const uniqueByMonth = new Map<string, any>();
    for (const item of sameWorkplaceMonthlyList) {
      const ym = String(item.dataCrtYm || item.seq);
      if (!uniqueByMonth.has(ym)) {
        uniqueByMonth.set(ym, item);
      }
    }

    return Array.from(uniqueByMonth.values());
  } catch (err) {
    console.error(`NPS Search Error for ${queryName}:`, err);
    return null;
  }
}

async function fetchNpsMonthDetail(seq: string | number, dataCrtYm?: string) {
  const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;
  const periodUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getPdAcctoSttusInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;

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
    const detailJson = JSON.parse(detailText);
    const detailItem = detailJson?.response?.body?.items?.item;
    const targetDetail = Array.isArray(detailItem) ? detailItem[0] : detailItem;
    if (!targetDetail) return null;

    const pepCnt = parseInt(targetDetail.jnngpCnt || targetDetail.npsSbscrbNmps || "0", 10);
    const npsChrgAmt = parseInt(targetDetail.crrmmNtcAmt || "0", 10);
    const npsSector = targetDetail.vldtVlKrnNm || "";

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
        }
      } catch (pe) {
        // ignore period parse error
      }
    }

    const ym = String(dataCrtYm || "").replace(/[^0-9]/g, "");
    const recordMonth = ym.length >= 6 ? `${ym.substring(0, 4)}-${ym.substring(4, 6)}` : "";

    return {
      wkplNm: targetDetail.wkplNm || "",
      pepCnt,
      npsChrgAmt,
      npsSector,
      newAcqsNmps,
      lossSbscrbNmps,
      dataCrtYm: ym,
      recordMonth,
    };
  } catch (e) {
    return null;
  }
}

/**
 * 국민연금공단 V2 API를 통해 사업자등록번호(10자리) 기준의 국민연금 가입 기본 정보(가입자수 및 최근 월별 추이)를 실시간 조회합니다.
 */
export async function getNpsBplcInfo(bzowrRgstNo: string, companyNm: string): Promise<NpsBplcInfo | null> {
  const cleanBNo = bzowrRgstNo.replace(/[^0-9]/g, "");
  if (cleanBNo.length !== 10 || !companyNm) return null;

  const targetBNo6 = cleanBNo.substring(0, 6);
  let matchedMonthlyList: any[] | null = null;

  // 1단계: 원본 상호명(예: "삼성전자(주)" 또는 "삼성전자주식회사")으로 먼저 정밀 검색 시도
  const origName = companyNm.trim();
  if (origName) {
    matchedMonthlyList = await searchNpsBplcList(origName, targetBNo6, 100);
  }

  // 2단계: 1단계 실패 시, 수식어 및 괄호를 지운 정규 상호명(예: "삼성전자")으로 넓은 검색 시도 (폴백)
  if (!matchedMonthlyList) {
    const cleanCompanyNm = companyNm
      .replace(/\(.*?\)/g, "")
      .replace(/주식회사/g, "")
      .replace(/\(주\)/g, "")
      .trim();
    if (cleanCompanyNm && cleanCompanyNm !== origName) {
      matchedMonthlyList = await searchNpsBplcList(cleanCompanyNm, targetBNo6, 100);
    }
  }

  // 3단계: 2단계 실패 시, 주식회사를 앞뒤로 명시적으로 붙여서 검색 시도
  if (!matchedMonthlyList) {
    const cleanCompanyNm = companyNm
      .replace(/\(.*?\)/g, "")
      .replace(/주식회사/g, "")
      .replace(/\(주\)/g, "")
      .trim();
    if (cleanCompanyNm) {
      matchedMonthlyList = await searchNpsBplcList(`${cleanCompanyNm}주식회사`, targetBNo6, 100);
      if (!matchedMonthlyList) {
        matchedMonthlyList = await searchNpsBplcList(`주식회사${cleanCompanyNm}`, targetBNo6, 100);
      }
      if (!matchedMonthlyList) {
        matchedMonthlyList = await searchNpsBplcList(`${cleanCompanyNm} 주식회사`, targetBNo6, 100);
      }
    }
  }

  if (!matchedMonthlyList || matchedMonthlyList.length === 0 || !matchedMonthlyList[0].seq) {
    console.warn(`[NPS API] No matched company found for ${companyNm} (RegNo prefix: ${targetBNo6})`);
    return null;
  }

  // 최근 최대 6개월치 seq를 병렬 조회하여 최신 상태 및 월별 고용 추이 동시 확보
  const recentMonths = matchedMonthlyList.slice(0, 6);
  const monthDetails = await Promise.all(
    recentMonths.map((m) => fetchNpsMonthDetail(m.seq, m.dataCrtYm))
  );

  const validDetails = monthDetails.filter((d): d is NonNullable<typeof d> => d !== null && d.pepCnt > 0);
  if (validDetails.length === 0) return null;

  const latest = validDetails[0];
  const monthlyHistory: NpsMonthlyRecord[] = validDetails
    .filter((d) => Boolean(d.recordMonth))
    .map((d) => ({
      recordMonth: d.recordMonth,
      employees: d.pepCnt,
      newAcquisitions: d.newAcqsNmps,
      losses: d.lossSbscrbNmps,
      npsChargeAmount: d.npsChrgAmt,
    }))
    .sort((a, b) => a.recordMonth.localeCompare(b.recordMonth));

  return {
    wkplNm: latest.wkplNm || matchedMonthlyList[0].wkplNm || "",
    bzowrRgstNo: cleanBNo,
    npsSbscrbNmps: latest.pepCnt,
    newAcqsNmps: latest.newAcqsNmps,
    lossSbscrbNmps: latest.lossSbscrbNmps,
    npsChrgAmt: latest.npsChrgAmt,
    npsSector: latest.npsSector,
    dataCrtYm: latest.dataCrtYm,
    monthlyHistory,
  };
}

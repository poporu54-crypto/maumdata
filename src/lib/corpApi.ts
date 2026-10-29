export interface CorpBasicOutline {
  crno: string;            // 법인등록번호
  corpNm: string;          // 법인명
  corpEnm?: string;        // 영문법인명
  bizrNo: string;          // 사업자등록번호
  enpRprFnm: string;       // 대표자명
  enpBsadr: string;        // 주소
  enpEstbDt: string;       // 설립일자
  enpIndyNm: string;       // 업종명
  enpEntprScaleNm?: string;// 기업규모명 (대기업, 중소기업 등)
  
  // 방대함 대응을 위한 추가 칼럼들
  basDt?: string;          // 기준일자
  enpPbncYn?: string;      // 기업공개여부 (Y/N)
  enpDivNm?: string;       // 기업구분명 (주식회사 등)
  enpHpaddr?: string;      // 홈페이지주소
  enpTlno?: string;        // 전화번호
  enpFxno?: string;        // 팩스번호
  enpPncd?: string;        // 우편번호
  enpStacNm?: string;      // 결산월
  enpMainBizNm?: string;   // 주요사업내용
  enpKosdaqYn?: string;    // 코스닥여부 (Y/N)
  enpKoseYn?: string;      // 거래소여부 (Y/N)
  enpKonexYn?: string;     // 코넥스여부 (Y/N)
}

export interface CorpFinanceDetail {
  year: number;
  revenue: number;         // 매출액 (억 원)
  operatingIncome: number; // 영업이익 (억 원, 손실인 경우 음수)
  netIncome: number;       // 당기순이익 (억 원, 손실인 경우 음수)
  totalAssets: number;     // 자산총계 (억 원)
  totalLiabilities: number;// 부채총계 (억 원)
  totalEquity: number;     // 자본총계 (억 원)
}

const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";

/**
 * 1. 금융위원회 기업기본정보 API를 조회하여 법인 기본 개요를 반환합니다.
 */
export async function getCorpBasicOutline(bizrNo: string, crno?: string): Promise<CorpBasicOutline | null> {
  const cleanBNo = bizrNo.replace(/[^0-9]/g, "");
  const rawCrno = crno ? crno.replace(/[^0-9]/g, "") : "";
  const cleanCrno = /^0+$/.test(rawCrno) ? "" : rawCrno;
  
  if (cleanBNo.length !== 10 && cleanCrno.length !== 13) return null;

  // getCorpOutline_V2는 crno 외에 bzno(사업자등록번호) 필터도 지원합니다.
  let url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json`;
  if (cleanCrno.length === 13) {
    url += `&crno=${cleanCrno}`;
  } else if (cleanBNo.length === 10) {
    url += `&bzno=${cleanBNo}`;
  } else {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`CorpBasic API HTTP error: ${response.status}`);
      return null;
    }

    const text = await response.text();
    if (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE")) {
      console.error("CorpBasic API XML Error Response:", text);
      return null;
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return null;
    }

    const items = json?.response?.body?.items?.item;
    if (items && items.length > 0) {
      const item = items[0];
      const baseAddr = (item.enpBsadr || "").trim();
      const dtlAddr = (item.enpDtadr || "").trim();
      const fullAddr = dtlAddr && !baseAddr.includes(dtlAddr) ? `${baseAddr} ${dtlAddr}`.trim() : baseAddr;
      const validCrno = item.crno && !/^0+$/.test(String(item.crno).replace(/[^0-9]/g, "")) ? item.crno : "";
      return {
        crno: validCrno,
        corpNm: item.enpPbanCmpyNm || item.corpNm || "",
        corpEnm: item.corpEnsnNm || item.corpEnm || "",
        bizrNo: item.bzno || item.bizrNo || cleanBNo,
        enpRprFnm: item.enpRprFnm || "",
        enpBsadr: fullAddr,
        enpEstbDt: item.enpEstbDt || "",
        enpIndyNm: item.sicNm || item.enpIndyNm || "",
        enpEntprScaleNm: item.smenpYn === "Y" ? "중소기업" : "일반기업",
        basDt: item.basDt || "",
        enpDivNm: item.corpDcdNm || item.enpDivNm || "",
        enpHpaddr: item.enpHmpgUrl || "",
        enpTlno: item.enpTlno || "",
        enpFxno: item.enpFxno || "",
        enpPncd: item.enpOzpno || "",
        enpStacNm: item.enpStacMm ? `${item.enpStacMm}월 결산` : "",
        enpMainBizNm: item.enpMainBizNm || "",
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch corp basic outline:", error);
    return null;
  }
}

/**
 * 2. 금융위원회 기업 재무정보 API를 조회하여 최근 3개년의 상세 재무 내역(자산, 부채, 자본, 매출, 영업이익, 당기순이익)을 반환합니다.
 */
export async function getCorpFinanceInfo(crno: string): Promise<CorpFinanceDetail[]> {
  const cleanCrno = crno.replace(/[^0-9]/g, "");
  if (cleanCrno.length !== 13 || /^0+$/.test(cleanCrno)) return [];

  // 요약재무제표조회 API 활용 (V2)
  const url = `https://apis.data.go.kr/1160100/service/GetFinaStatInfoService_V2/getSummFinaStat_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=50&resultType=json&crno=${cleanCrno}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`CorpFinance API HTTP error: ${response.status}`);
      return [];
    }

    const text = await response.text();
    if (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE")) {
      console.error("CorpFinance API XML Error Response:", text);
      return [];
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return [];
    }

    const items = json?.response?.body?.items?.item;
    if (!items || !Array.isArray(items)) return [];

    const history: CorpFinanceDetail[] = [];
    const yearMap = new Map<number, any>();

    items.forEach((item: any) => {
      const year = parseInt(item.bizYear || item.bsnsYear);
      if (!year) return;

      const code = item.fnclDcd || ""; // 110: 연결요약재무제표, 120: 요약재무제표
      const existing = yearMap.get(year);

      // 연결요약재무제표(110)를 최우선적으로 가져오고, 없으면 일반요약재무제표(120) 사용
      if (existing && existing.fnclDcd === "110" && code !== "110") {
        return;
      }

      yearMap.set(year, item);
    });

    yearMap.forEach((item, year) => {
      const to100M = (valStr: string) => {
        const val = parseFloat(valStr || "0");
        return Math.round((val / 100000000) * 10) / 10;
      };

      const revenue = to100M(item.enpSaleAmt); // 매출액
      const operatingIncome = to100M(item.enpBzopPft); // 영업이익
      const netIncome = to100M(item.enpCrtmNpf); // 당기순이익
      const totalAssets = to100M(item.enpTastAmt); // 자산총계
      const totalLiabilities = to100M(item.enpTdbtAmt); // 부채총계
      const totalEquity = to100M(item.enpTcptAmt); // 자본총계

      history.push({
        year,
        revenue,
        operatingIncome,
        netIncome,
        totalAssets,
        totalLiabilities,
        totalEquity
      });
    });

    // 과거 연도 순 정렬
    history.sort((a, b) => a.year - b.year);

    // 최근 3개년 데이터만 반환
    return history.slice(-3);
  } catch (error) {
    console.error("Failed to fetch corp finance info:", error);
    return [];
  }
}

const corpSearchCache = new Map<string, { expiresAt: number; items: CorpBasicOutline[] }>();
const CORP_SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10분 서버 메모리 캐시

/**
 * 3. 금융위원회 기업기본정보 API를 조회하여 법인명(상호명)으로 기업 목록을 검색합니다.
 */
export async function searchCorpOutline(corpNm: string): Promise<CorpBasicOutline[]> {
  if (!corpNm || corpNm.trim().length < 2) return [];

  const cleanQuery = corpNm
    .replace(/주식회사|\(주\)|（주）|유한회사|\(유\)/g, "")
    .trim();
  const effectiveQuery = cleanQuery.length >= 2 ? cleanQuery : corpNm.trim();
  const cacheKey = effectiveQuery.toLowerCase();
  const now = Date.now();
  const cached = corpSearchCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.items;
  }

  const encodedCorpNm = encodeURIComponent(effectiveQuery);
  const url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=30&resultType=json&corpNm=${encodedCorpNm}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`searchCorpOutline HTTP error: ${response.status}`);
      return [];
    }

    const text = await response.text();
    if (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE")) {
      console.error("searchCorpOutline XML Error Response:", text);
      return [];
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return [];
    }

    const items = json?.response?.body?.items?.item;
    if (items) {
      const list = Array.isArray(items) ? items : [items];
      const byBzno = new Map<string, CorpBasicOutline>();
      for (const item of list) {
        const bzno = String(item.bzno || item.bizrNo || "").replace(/[^0-9]/g, "");
        if (bzno.length !== 10 || byBzno.has(bzno)) continue;
        const baseAddr = (item.enpBsadr || "").trim();
        const dtlAddr = (item.enpDtadr || "").trim();
        const fullAddr = dtlAddr && !baseAddr.includes(dtlAddr) ? `${baseAddr} ${dtlAddr}`.trim() : baseAddr;
        const rawName = item.enpPbanCmpyNm || item.corpNm || "";
        const corpNmFormatted =
          item.corpDcdNm === "주식회사" && !rawName.includes("주식회사") && !rawName.includes("(주)")
            ? `${rawName} 주식회사`
            : rawName;
        byBzno.set(bzno, {
          crno: item.crno && !/^0+$/.test(String(item.crno).replace(/[^0-9]/g, "")) ? item.crno : "",
          corpNm: corpNmFormatted,
          corpEnm: item.corpEnsnNm || item.corpEnm || "",
          bizrNo: bzno,
          enpRprFnm: item.enpRprFnm || "-",
          enpBsadr: fullAddr || "-",
          enpEstbDt: item.enpEstbDt || "",
          enpIndyNm: item.sicNm || item.enpIndyNm || "기타 서비스업",
          enpEntprScaleNm: item.smenpYn === "Y" ? "중소기업" : "일반기업",
        });
      }
      const results = Array.from(byBzno.values());
      if (corpSearchCache.size > 300) {
        const oldestKey = corpSearchCache.keys().next().value;
        if (oldestKey) corpSearchCache.delete(oldestKey);
      }
      corpSearchCache.set(cacheKey, { expiresAt: Date.now() + CORP_SEARCH_CACHE_TTL_MS, items: results });
      return results;
    }

    corpSearchCache.set(cacheKey, { expiresAt: Date.now() + CORP_SEARCH_CACHE_TTL_MS, items: [] });
    return [];
  } catch (error) {
    console.error("Failed to search corp outline by name:", error);
    return [];
  }
}

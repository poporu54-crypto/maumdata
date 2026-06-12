export interface BidNotice {
  bidNtceNo: string;      // 입찰공고번호
  bidNtceOrd: string;     // 입찰공고차수
  bidNtceNm: string;      // 입찰공고명
  dminsttNm: string;      // 수요기관명
  opngDt: string;         // 개찰일시
  bidNtceDt: string;      // 등록일시
  cntrctCnclMthdNm: string;// 계약체결방법 (수의계약, 제한경쟁 등)
  presmptPrce: number;    // 추정가격 (원)
  detailUrl: string;      // 공고상세URL
}

const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
const API_URL_BASE = "https://apis.data.go.kr/1230000/as/ScsbidInfoService";

/**
 * 1. 조달청 나라장터 낙찰정보 API를 실시간 쿼리하여 관련 수주/낙찰 목록을 수집합니다.
 * @param companyNm 기업 상호명
 * @param bNo 사업자등록번호
 */
export async function getRecentBidsByCompany(companyNm: string, bNo: string): Promise<BidNotice[]> {
  const cleanCompanyNm = companyNm.trim();
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  
  if (!cleanCompanyNm || cleanCompanyNm.length < 2) return [];

  // 1주일(7일) 조회 범위 설정
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 7);

  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}0000`;
  };

  const bgnDt = formatDateString(past);
  const endDt = formatDateString(today);

  // 용역, 물품, 공사의 낙찰정보를 병렬로 호출하는 헬퍼 함수
  const fetchCategory = async (operation: string): Promise<any[]> => {
    const url = `${API_URL_BASE}/${operation}?serviceKey=${SERVICE_KEY}&numOfRows=100&pageNo=1&inqryDiv=1&inqryBgnDt=${bgnDt}&inqryEndDt=${endDt}&type=json`;
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(`Procurement API HTTP error for ${operation}: ${response.status}`);
        return [];
      }

      const text = await response.text();
      if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
        console.warn(`Procurement API Key not sync'd or blocked for ${operation}. Returning empty.`);
        return [];
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        return [];
      }

      const items = json?.response?.body?.items?.item || json?.response?.body?.items;
      if (items) {
        return Array.isArray(items) ? items : [items];
      }
      return [];
    } catch (err) {
      console.error(`Failed to fetch procurement bids for ${operation}:`, err);
      return [];
    }
  };

  try {
    // 3가지 낙찰정보 API 병렬 호출
    const [listServc, listThng, listConstc] = await Promise.all([
      fetchCategory("getScsbidListSttusServc"), // 용역
      fetchCategory("getScsbidListSttusThng"),  // 물품
      fetchCategory("getScsbidListSttusConstc") // 공사
    ]);

    const combinedList = [...listServc, ...listThng, ...listConstc];

    // 사후 정합성 필터링: 낙찰업체 사업자등록번호(scsbidBprcoNo)가 일치하거나 낙찰업체명(scsbidBprcoNm)이 매칭되는 것 필터
    const targetNmClean = cleanCompanyNm.replace(/\(.*?\)/g, "").replace(/주식회사/g, "").replace(/\(주\)/g, "").replace(/\s+/g, "").toLowerCase();
    
    const filteredList = combinedList.filter((item: any) => {
      const itemBNo = (item.scsbidBprcoNo || "").replace(/[^0-9]/g, "");
      const itemNm = (item.scsbidBprcoNm || "").replace(/\s+/g, "").toLowerCase();
      
      const isBNoMatch = cleanBNo && itemBNo === cleanBNo;
      const isNmMatch = targetNmClean && itemNm.includes(targetNmClean);
      
      return isBNoMatch || isNmMatch;
    });

    return filteredList.map((item: any) => {
      const dateStr = item.bidNtceDate || item.opengDate || "";
      const timeStr = item.bidNtceBgn || item.opengTm || "";
      const formattedDt = dateStr && timeStr ? `${dateStr} ${timeStr}` : (dateStr || "-");

      return {
        bidNtceNo: item.bidNtceNo || "",
        bidNtceOrd: item.bidNtceOrd || "00",
        bidNtceNm: item.bidNtceNm || "",
        dminsttNm: item.dmndInsttNm || item.ntceInsttNm || "",
        opngDt: item.opengDate || "",
        bidNtceDt: formattedDt,
        cntrctCnclMthdNm: item.cntrctCnclsMthdNm || "제한경쟁",
        presmptPrce: parseFloat(item.scsbidAmt || "0"), // 낙찰금액 매칭
        detailUrl: `https://www.g2b.go.kr:8081/ep/invitation/publishBidInvitationDetail.do?bidno=${item.bidNtceNo}&bidseq=${item.bidNtceOrd}`,
      };
    });
  } catch (err) {
    console.error("Failed to filter procurement bids:", err);
    return [];
  }
}


/**
 * 2. 특정 기업의 실제 수주/입찰 매칭을 재현하기 위한 정교한 공공 입찰 Mock 발전기
 */
export function getMockBids(keyword: string): BidNotice[] {
  const cleanKeyword = keyword.trim();
  const seed = cleanKeyword.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  const institutions = [
    "서울특별시청", "한국토지주택공사", "조달청", "한국전력공사", "국방부",
    "부산광역시 교육청", "행정안전부", "인천국제공항공사", "한국도로공사", "디지털플랫폼정부위원회"
  ];

  const bidContracts = [
    "협상에 의한 계약", "제한(총액)경쟁", "일반(총액)경쟁", "수의계약", "적격심사제"
  ];

  // 회사명이나 키워드에 따라 맞춤형 프로젝트명 매칭
  const projects = [
    "차세대 통합 데이터 플랫폼 고도화 및 인프라 구축 사업",
    "상반기 공공 데이터 품질 점검 및 정제 지원 용역",
    "기관 홈페이지 리뉴얼 및 반응형 UI/UX 퍼블리싱 용역",
    "스마트 시티 공공 와이파이 관제 시스템 위탁 운영",
    "클라우드 전환 사업 및 마이그레이션 기술 지원 컨설팅",
    "인공지능 기반 지능형 민원 분류 자동화 시범 사업",
  ];

  const bids: BidNotice[] = [];
  const count = 3 + (seed % 3); // 3 ~ 5개 생성

  for (let i = 0; i < count; i++) {
    const itemSeed = (seed + i * 47) % 100000;
    const inst = institutions[itemSeed % institutions.length];
    const contract = bidContracts[itemSeed % bidContracts.length];
    const proj = projects[itemSeed % projects.length];
    const price = 50000000 + (itemSeed * 25000) % 850000000; // 5천만원 ~ 9억원

    const date = new Date();
    date.setDate(date.getDate() - (i + 1) * 3);
    const dateStr = date.toISOString().replace(/T/, " ").replace(/\..+/, "").slice(0, 16);

    bids.push({
      bidNtceNo: `2026${String(itemSeed).padStart(7, "0")}`,
      bidNtceOrd: "00",
      bidNtceNm: `[${cleanKeyword}] ${proj}`,
      dminsttNm: inst,
      opngDt: dateStr,
      bidNtceDt: dateStr,
      cntrctCnclMthdNm: contract,
      presmptPrce: price,
      detailUrl: "https://www.g2b.go.kr",
    });
  }

  return bids;
}

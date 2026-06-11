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
const API_URL_BASE = "https://apis.data.go.kr/1230000/ao/PubDataOpnStdService";

/**
 * 1. 조달청 나라장터 용역/물품 입찰공고 API를 실시간 쿼리하여 관련 입찰 목록을 수집합니다.
 * @param keyword 검색어 (상호명 또는 주요 업종 키워드)
 */
export async function getRecentBidsByKeyword(keyword: string): Promise<BidNotice[]> {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword || cleanKeyword.length < 2) return [];

  // 개방표준 가이드라인에 따른 7일(1주일) 조회 범위 설정
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 7);

  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}0000`;
  };

  const searchKeyword = cleanKeyword
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .trim();

  const bgnDt = formatDateString(past);
  const endDt = formatDateString(today);
  const encodedKeyword = encodeURIComponent(searchKeyword);

  // 데이터셋 개방표준에 따른 입찰공고정보 조회 API
  const url = `${API_URL_BASE}/getDataSetOpnStdBidPblancInfo?serviceKey=${SERVICE_KEY}&numOfRows=5&pageNo=1&inqryBgnDt=${bgnDt}&inqryEndDt=${endDt}&bidNtceNm=${encodedKeyword}&type=json`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Procurement API HTTP error: ${response.status}`);
      return [];
    }

    const text = await response.text();
    if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
      console.warn("Procurement API Key not sync'd yet or blocked. Returning empty list.");
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
      const list = Array.isArray(items) ? items : [items];
      
      // 사후 정합성 필터링: 공고명(bidNtceNm)에 검색용 회사명(searchKeyword)이 실제로 포함되어 있는 것만 노출
      const filteredList = list.filter((item: any) => {
        if (!item.bidNtceNm) return false;
        return item.bidNtceNm.includes(searchKeyword);
      });

      return filteredList.map((item: any) => {
        const dateStr = item.bidNtceDate || "";
        const timeStr = item.bidNtceBgn || "";
        const formattedDt = dateStr && timeStr ? `${dateStr} ${timeStr}` : (dateStr || "-");

        return {
          bidNtceNo: item.bidNtceNo || "",
          bidNtceOrd: item.bidNtceOrd || "00",
          bidNtceNm: item.bidNtceNm || "",
          dminsttNm: item.dmndInsttNm || item.ntceInsttNm || "",
          opngDt: item.bidNtceOpngDt || "",
          bidNtceDt: formattedDt,
          cntrctCnclMthdNm: item.cntrctCnclsMthdNm || "제한경쟁",
          presmptPrce: parseFloat(item.presmptPrce || "0"),
          detailUrl: `https://www.g2b.go.kr:8081/ep/invitation/publishBidInvitationDetail.do?bidno=${item.bidNtceNo}&bidseq=${item.bidNtceOrd}`,
        };
      });
    }

    return [];
  } catch (err) {
    console.error("Failed to fetch procurement bids:", err);
    return [];
  }
}

/**
 * 2. 특정 기업의 실제 수주/입찰 매칭을 재현하기 위한 정교한 공공 입찰 Mock 발전기
 */
function getMockBids(keyword: string): BidNotice[] {
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

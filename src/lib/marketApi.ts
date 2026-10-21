export interface StoreInfo {
  bizesId: string;    // 상가업소번호
  bizesNm: string;    // 상호명
  brchNm?: string;    // 지점명
  indsLclsCd: string; // 업종대분류코드
  indsLclsNm: string; // 업종대분류명
  indsMclsCd: string; // 업종중분류코드
  indsMclsNm: string; // 업종중분류명
  indsSclsCd: string; // 업종소분류코드
  indsSclsNm: string; // 업종소분류명
  lnoAdr: string;     // 지번주소
  rdnmAdr: string;    // 도로명주소
  lon: number;        // 경도
  lat: number;        // 위도
}

export interface DongStoreResult {
  stores: StoreInfo[];
  totalCount: number;
  stdrYm?: string;
}

const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
const API_URL = "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong";

// 구버전 법정동/행정동 코드 ➔ 소상공인시장진흥공단 최신 행정동 코드(8자리) 정규화 매핑
const LEGACY_TO_REAL_ADONG_CD: Record<string, string> = {
  "11680640": "11680640", // 서울 강남구 역삼1동
  "11680650": "11680650", // 서울 강남구 역삼2동
  "11590620": "11590620", // 서울 동작구 사당1동
  "11110615": "11110615", // 서울 종로구 종로1.2.3.4가동
  "41135109": "41135655", // 경기 성남시 분당구 삼평동
  "41135655": "41135655",
  "28200540": "28200510", // 인천 남동구 구월1동
  "28200510": "28200510",
  "42110590": "51110660", // 강원 춘천시 퇴계동
  "51110590": "51110660",
  "51110660": "51110660",
  "30170560": "30170640", // 대전 서구 둔산2동
  "30170640": "30170640",
  "36110550": "36110560", // 세종 보람동
  "36110560": "36110560",
  "44133107": "44133566", // 충남 천안시 서북구 불당1동
  "44133566": "44133566",
  "43111510": "43111545", // 충북 청주시 상당구 성안동
  "43111545": "43111545",
  "26350105": "26350510", // 부산 해운대구 우1동
  "26350510": "26350510",
  "27260510": "27260510", // 대구 수성구 범어1동
  "48123550": "48123530", // 경남 창원시 성산구 상남동
  "48123530": "48123530",
  "31140590": "31140570", // 울산 남구 삼산동
  "31140570": "31140570",
  "47111630": "47111570", // 경북 포항시 남구 제철동
  "47111570": "47111570",
  "29140740": "12240745", // 광주 서구 치평동
  "12240745": "12240745",
  "45111605": "52111730", // 전북 전주시 완산구 효자5동
  "52111730": "52111730",
  "46130630": "12130800", // 전남 여수시 여천동
  "12130800": "12130800",
  "50110660": "50110660", // 제주 제주시 노형동
};

export function resolveRealAdongCd(adongCd: string): string {
  const clean = adongCd.trim();
  const prefix8 = clean.length >= 8 ? clean.substring(0, 8) : clean;
  return LEGACY_TO_REAL_ADONG_CD[prefix8] || prefix8;
}

/**
 * 1. 특정 행정동 코드를 기반으로 해당 동에 위치한 상가/상권 목록 및 전체 점포 수를 실시간 조회합니다.
 *    (가짜/폴백 데이터 전면 금지 원칙에 따라 오류 시 빈 배열을 반환합니다.)
 */
export async function getStoreDataInDong(adongCd: string): Promise<DongStoreResult> {
  const cleanDongCd = adongCd.trim();
  if (!cleanDongCd || cleanDongCd.length < 8) {
    return { stores: [], totalCount: 0 };
  }

  const queryKey = resolveRealAdongCd(cleanDongCd);
  const url = `${API_URL}?serviceKey=${SERVICE_KEY}&divId=adongCd&key=${queryKey}&type=json&numOfRows=100&pageNo=1`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 86400 }, // 24시간 캐시 적용
    });

    if (!response.ok) {
      console.error(`Market API HTTP error: ${response.status}`);
      return { stores: [], totalCount: 0 };
    }

    const text = await response.text();

    if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
      console.warn("Market API returned non-normal response:", text.substring(0, 200));
      return { stores: [], totalCount: 0 };
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("[Market API] JSON parse failed", e);
      return { stores: [], totalCount: 0 };
    }

    const items = json?.body?.items;
    const totalCount = typeof json?.body?.totalCount === "number" ? json.body.totalCount : (Array.isArray(items) ? items.length : 0);
    const stdrYm = json?.header?.stdrYm || "";

    if (items && Array.isArray(items)) {
      const stores: StoreInfo[] = items.map((item: any) => ({
        bizesId: item.bizesId || "",
        bizesNm: item.bizesNm || "",
        brchNm: item.brchNm || "",
        indsLclsCd: item.indsLclsCd || "",
        indsLclsNm: item.indsLclsNm || "",
        indsMclsCd: item.indsMclsCd || "",
        indsMclsNm: item.indsMclsNm || "",
        indsSclsCd: item.indsSclsCd || "",
        indsSclsNm: item.indsSclsNm || "",
        lnoAdr: item.lnoAdr || "",
        rdnmAdr: item.rdnmAdr || "",
        lon: parseFloat(item.lon || "0"),
        lat: parseFloat(item.lat || "0"),
      }));
      return { stores, totalCount: totalCount || stores.length, stdrYm };
    }

    return { stores: [], totalCount: 0 };
  } catch (err) {
    console.error("[Market API] Failed to fetch store list in dong:", err);
    return { stores: [], totalCount: 0 };
  }
}

export async function getStoreListInDong(adongCd: string): Promise<StoreInfo[]> {
  const res = await getStoreDataInDong(adongCd);
  return res.stores;
}

/**
 * 2. 동 코드별 한글 동 명칭 매핑
 */
export function getDongName(adongCd: string): { city: string; gu: string; dong: string; fullName: string } {
  const code = resolveRealAdongCd(adongCd);
  const mapping: Record<string, { city: string; gu: string; dong: string; fullName: string }> = {
    "11680640": { city: "서울특별시", gu: "강남구", dong: "역삼1동", fullName: "서울특별시 강남구 역삼1동" },
    "11680650": { city: "서울특별시", gu: "강남구", dong: "역삼2동", fullName: "서울특별시 강남구 역삼2동" },
    "11590620": { city: "서울특별시", gu: "동작구", dong: "사당1동", fullName: "서울특별시 동작구 사당1동" },
    "11110615": { city: "서울특별시", gu: "종로구", dong: "종로1.2.3.4가동", fullName: "서울특별시 종로구 종로1.2.3.4가동" },
    "41135655": { city: "경기도", gu: "성남시 분당구", dong: "삼평동", fullName: "경기도 성남시 분당구 삼평동" },
    "28200510": { city: "인천광역시", gu: "남동구", dong: "구월1동", fullName: "인천광역시 남동구 구월1동" },
    "51110660": { city: "강원특별자치도", gu: "춘천시", dong: "퇴계동", fullName: "강원특별자치도 춘천시 퇴계동" },
    "30170640": { city: "대전광역시", gu: "서구", dong: "둔산2동", fullName: "대전광역시 서구 둔산2동" },
    "36110560": { city: "세종특별자치시", gu: "", dong: "보람동", fullName: "세종특별자치시 보람동" },
    "44133566": { city: "충청남도", gu: "천안시 서북구", dong: "불당1동", fullName: "충청남도 천안시 서북구 불당1동" },
    "43111545": { city: "충청북도", gu: "청주시 상당구", dong: "성안동", fullName: "충청북도 청주시 상당구 성안동" },
    "26350510": { city: "부산광역시", gu: "해운대구", dong: "우1동", fullName: "부산광역시 해운대구 우1동" },
    "27260510": { city: "대구광역시", gu: "수성구", dong: "범어1동", fullName: "대구광역시 수성구 범어1동" },
    "48123530": { city: "경상남도", gu: "창원시 성산구", dong: "상남동", fullName: "경상남도 창원시 성산구 상남동" },
    "31140570": { city: "울산광역시", gu: "남구", dong: "삼산동", fullName: "울산광역시 남구 삼산동" },
    "47111570": { city: "경상북도", gu: "포항시 남구", dong: "제철동", fullName: "경상북도 포항시 남구 제철동" },
    "12240745": { city: "광주광역시", gu: "서구", dong: "치평동", fullName: "광주광역시 서구 치평동" },
    "52111730": { city: "전북특별자치도", gu: "전주시 완산구", dong: "효자5동", fullName: "전북특별자치도 전주시 완산구 효자5동" },
    "12130800": { city: "전라남도", gu: "여수시", dong: "여천동", fullName: "전라남도 여수시 여천동" },
    "50110660": { city: "제주특별자치도", gu: "제주시", dong: "노형동", fullName: "제주특별자치도 제주시 노형동" },
  };

  return mapping[code] || { city: "대한민국", gu: "", dong: `행정동(${code})`, fullName: `행정동 코드 ${code}` };
}

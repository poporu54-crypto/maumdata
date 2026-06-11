export interface DartDisclosure {
  corpCode: string;   // 고유번호
  corpName: string;   // 회사명
  reportNm: string;   // 보고서 명칭
  rceptNo: string;    // 접수번호 (상세 링크용)
  flrNm: string;      // 공시 제출인
  rceptDt: string;    // 접수일자 (YYYYMMDD)
  rm?: string;        // 비고
  detailUrl: string;  // DART 직접 뷰어 연결 링크
}

const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7";

/**
 * OpenDART 공시검색 API를 호출하여 해당 기업의 최근 공시 목록을 가져옵니다.
 * @param corpCode DART 8자리 고유번호
 * @param limit 가져올 최대 공시 개수 (기본 8개)
 */
export async function getRecentDisclosures(corpCode: string, limit = 8): Promise<DartDisclosure[]> {
  if (!corpCode || corpCode.trim().length !== 8) return [];

  // 날짜 범위: 오늘부터 약 2년 전까지 조회하여 충분한 공시 서류를 수집합니다.
  const today = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(today.getFullYear() - 2);

  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  };

  const bgnDe = formatDate(twoYearsAgo);
  const endDe = formatDate(today);

  const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bgn_de=${bgnDe}&end_de=${endDe}&page_no=1&page_count=${limit}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`OpenDART API HTTP error: ${response.status}`);
      return [];
    }

    const json = await response.json();
    
    // OpenDART API의 상태 체크 (status: "000" 이 정상 상태)
    if (json.status !== "000") {
      // 013: 조회된 데이타가 없습니다.
      if (json.status === "013") {
        return [];
      }
      console.error(`OpenDART API Error: [${json.status}] ${json.message}`);
      return [];
    }

    const list = json.list;
    if (!list || !Array.isArray(list)) return [];

    return list.map((item: any) => {
      const rceptDtStr = item.rcept_dt || "";
      const formattedDt = rceptDtStr.length === 8 
        ? `${rceptDtStr.slice(0, 4)}-${rceptDtStr.slice(4, 6)}-${rceptDtStr.slice(6, 8)}`
        : rceptDtStr;

      return {
        corpCode: item.corp_code || "",
        corpName: item.corp_name || "",
        reportNm: item.report_nm || "",
        rceptNo: item.rcept_no || "",
        flrNm: item.flr_nm || "",
        rceptDt: formattedDt,
        rm: item.rm || "",
        detailUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
      };
    });
  } catch (error) {
    console.error("Failed to fetch OpenDART disclosures:", error);
    return [];
  }
}

/**
 * OpenDART 공시검색 API를 호출하여 해당 기업의 주요 정기 공시(사업보고서, 반기보고서, 분기보고서) 목록을 가져옵니다.
 * @param corpCode DART 8자리 고유번호
 * @param limit 가져올 최대 공시 개수 (기본 8개)
 */
export async function getRecentKeyDisclosures(corpCode: string, limit = 8): Promise<DartDisclosure[]> {
  if (!corpCode || corpCode.trim().length !== 8) return [];

  // 날짜 범위: 정기보고서는 연도별로 올라오므로 넉넉하게 3년 전까지 조회합니다.
  const today = new Date();
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(today.getFullYear() - 3);

  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  };

  const bgnDe = formatDate(threeYearsAgo);
  const endDe = formatDate(today);

  // pblntf_ty=A 파라미터를 추가하여 정기공시(사업, 반기, 분기보고서)만 필터링합니다.
  const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bgn_de=${bgnDe}&end_de=${endDe}&pblntf_ty=A&page_no=1&page_count=${limit}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`OpenDART API HTTP error: ${response.status}`);
      return [];
    }

    const json = await response.json();
    
    if (json.status !== "000") {
      if (json.status === "013") {
        return [];
      }
      console.error(`OpenDART Key API Error: [${json.status}] ${json.message}`);
      return [];
    }

    const list = json.list;
    if (!list || !Array.isArray(list)) return [];

    return list.map((item: any) => {
      const rceptDtStr = item.rcept_dt || "";
      const formattedDt = rceptDtStr.length === 8 
        ? `${rceptDtStr.slice(0, 4)}-${rceptDtStr.slice(4, 6)}-${rceptDtStr.slice(6, 8)}`
        : rceptDtStr;

      return {
        corpCode: item.corp_code || "",
        corpName: item.corp_name || "",
        reportNm: item.report_nm || "",
        rceptNo: item.rcept_no || "",
        flrNm: item.flr_nm || "",
        rceptDt: formattedDt,
        rm: item.rm || "",
        detailUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
      };
    });
  } catch (error) {
    console.error("Failed to fetch OpenDART key disclosures:", error);
    return [];
  }
}

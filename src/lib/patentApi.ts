export interface PatentInfo {
  applicationNumber: string; // 출원번호
  applicationDate: string;   // 출원일자
  inventionTitle: string;    // 발명의 명칭
  registerNumber?: string;   // 등록번호
  registerDate?: string;     // 등록일자
  applicantName: string;     // 출원인명
  patentStatus: string;      // 특허상태 (등록, 공개, 소멸 등)
  detailUrl?: string;        // 상세정보 URL
}

const ACCESS_KEY = process.env.KIPRIS_ACCESS_KEY || "";
const API_URL = "http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getWordSearch"; // KIPRIS Plus getWordSearch API

/**
 * KIPRIS XML 응답을 직접 파싱하는 초경량 안전 파서
 */
function parsePatentXml(xml: string): PatentInfo[] {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  const list: PatentInfo[] = [];

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    
    const getTagValue = (tag: string) => {
      const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
      const m = regex.exec(block);
      return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim() : "";
    };

    const applicationNumber = getTagValue("applicationNumber") || getTagValue("appNo") || "";
    const applicationDateRaw = getTagValue("applicationDate") || getTagValue("appDate") || "";
    const inventionTitle = getTagValue("inventionTitle") || getTagValue("title") || "지식재산권";
    const registerNumber = getTagValue("registerNumber") || getTagValue("regNo") || "";
    const registerDateRaw = getTagValue("registerDate") || getTagValue("regDate") || "";
    const applicantName = getTagValue("applicantName") || getTagValue("applicant") || "";
    
    let patentStatus = getTagValue("patentStatus") || getTagValue("status");
    if (!patentStatus) {
      patentStatus = registerNumber ? "등록" : "공개";
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr.length !== 8) return dateStr || "-";
      return `${dateStr.slice(0, 4)}년 ${dateStr.slice(4, 6)}월 ${dateStr.slice(6, 8)}일`;
    };

    list.push({
      applicationNumber,
      applicationDate: formatDate(applicationDateRaw),
      inventionTitle,
      registerNumber: registerNumber || undefined,
      registerDate: registerDateRaw ? formatDate(registerDateRaw) : undefined,
      applicantName,
      patentStatus,
      detailUrl: `https://doi.org/10.8080/${applicationNumber.replace(/[^0-9]/g, "")}`,
    });
  }

  return list;
}

/**
 * 회사 이름 정제 함수 (노이즈 단어 제거하여 일치 확률 극대화)
 */
function sanitizeCorpName(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

/**
 * 1. 기업명/대표자명을 기준으로 해당 기업이 보유한 특허/상표 지식재산권 포트폴리오를 조회합니다.
 */
export async function getPatentsByCompany(companyNm: string, applicantNm: string): Promise<PatentInfo[]> {
  const cleanCompanyNm = companyNm.trim();
  const cleanApplicantNm = applicantNm.trim();
  
  if (!cleanCompanyNm || cleanCompanyNm.length < 2) return [];

  // "(NAVER)", "주식회사", "(주)" 등 특허청 검색 시 노이즈가 되는 단어를 정제
  const searchCompanyNm = sanitizeCorpName(cleanCompanyNm);

  // KIPRIS Plus REST API를 호출하여 특허 정보를 수집합니다. (출원인 전용 검색식 적용, 50개까지 수집하여 정합 필터링)
  const query = `AP=[${searchCompanyNm}]`;
  const encodedName = encodeURIComponent(query);
  const url = `${API_URL}?word=${encodedName}&ServiceKey=${ACCESS_KEY}&numOfRows=50&pageNo=1`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const text = await response.text();
    
    // KIPRIS 에러 체크
    if (text.includes("<resultCode>") && !text.includes("<resultCode>00</resultCode>")) {
      console.warn("KIPRIS API returned error code. Returning empty.");
      return [];
    }

    const allPatents = parsePatentXml(text);

    // 100% 회사명 일치 사후 필터링 (동명 회사나 부분일치 회사 필터링 차단)
    const targetCleanName = sanitizeCorpName(cleanCompanyNm);
    const filteredPatents = allPatents.filter((item) => {
      if (!item.applicantName) return false;
      const appCleanName = sanitizeCorpName(item.applicantName);
      return appCleanName === targetCleanName;
    });

    // 최종 최대 5개 노출
    return filteredPatents.slice(0, 5);
  } catch (err) {
    console.error("Failed to fetch patents from API:", err);
    return [];
  }
}

/**
 * 2. 기술력/SEO 롱테일 인덱싱을 위한 초정밀 결정론적 특허(IP) 생성기
 */
export function getMockPatents(companyNm: string, applicantNm: string): PatentInfo[] {
  const cleanComp = companyNm.replace(/\(가상.*\)/g, "").trim();
  const seed = cleanComp.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  const patentTechs = [
    "데이터 필터링 기반 지능형 기업 납세 검증 장치 및 그 방법",
    "실시간 국민연금 변동 데이터를 매핑한 고용 상태 자동 추적 시스템",
    "웹 크롤링 로봇 대응 동적 검색엔진 최적화(SEO) 제어 시스템 및 데이터 파싱 장치",
    "분산형 B2B 빅데이터 연계 분석 프레임워크 및 이를 이용한 지표 생성 모듈",
    "다차원 키워드 분산 라우팅 기술을 적용한 초고속 기업 검색 데이터베이스 장치",
    "위치 기반 상권 상업 빅데이터 매핑 알고리즘 및 행정 구역별 점포 통계 방법",
  ];

  const statuses = ["등록", "공개", "등록", "공개", "소멸"];

  const count = 2 + (seed % 3); // 2 ~ 4개 생성
  const patents: PatentInfo[] = [];

  for (let i = 0; i < count; i++) {
    const itemSeed = (seed + i * 83) % 100000;
    const tech = patentTechs[itemSeed % patentTechs.length];
    const status = statuses[itemSeed % statuses.length];
    
    const appYear = 2021 + (itemSeed % 4); // 2021 ~ 2024
    const appMonth = String(1 + (itemSeed % 12)).padStart(2, "0");
    const appDay = String(1 + (itemSeed % 28)).padStart(2, "0");
    const appNo = `10-${appYear}-${String(itemSeed).padStart(7, "0")}`;

    const regYear = appYear + 1;
    const regMonth = String(1 + ((itemSeed + 5) % 12)).padStart(2, "0");
    const regDay = String(1 + ((itemSeed + 5) % 28)).padStart(2, "0");
    const regNo = status === "등록" ? `10-${String(itemSeed + 2000).padStart(7, "0")}` : undefined;

    patents.push({
      applicationNumber: appNo,
      applicationDate: `${appYear}년 ${appMonth}월 ${appDay}일`,
      inventionTitle: tech,
      registerNumber: regNo,
      registerDate: status === "등록" ? `${regYear}년 ${regMonth}월 ${regDay}일` : undefined,
      applicantName: cleanComp,
      patentStatus: status,
      detailUrl: "https://plus.kipris.or.kr",
    });
  }

  return patents;
}

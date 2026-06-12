import { query } from "./db";

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
 * 1. 로컬 DB에서 해당 기업이 보유한 특허/상표 지식재산권을 즉시 조회합니다. (실시간 외부 API 호출 차단)
 */
export async function getPatentsByCompany(companyNm: string, applicantNm: string): Promise<PatentInfo[]> {
  try {
    const cleanCompanyNm = companyNm.trim();
    if (!cleanCompanyNm) return [];

    const res = await query(
      `SELECT p.application_number as "applicationNumber",
              p.application_date as "applicationDate",
              p.invention_title as "inventionTitle",
              p.patent_status as "patentStatus",
              p.detail_url as "detailUrl",
              b.b_nm as "applicantName"
       FROM business_patents p
       JOIN businesses b ON p.b_no = b.b_no
       WHERE b.b_nm = $1
       ORDER BY p.application_date DESC
       LIMIT 5`,
      [cleanCompanyNm]
    );

    return res.rows.map(r => ({
      applicationNumber: r.applicationNumber || "",
      applicationDate: r.applicationDate || "",
      inventionTitle: r.inventionTitle || "지식재산권",
      applicantName: r.applicantName || "",
      patentStatus: r.patentStatus || "등록",
      detailUrl: r.detailUrl || ""
    }));
  } catch (err) {
    console.error("Failed to query business patents from DB:", err);
    return [];
  }
}

/**
 * 2. 백그라운드에서 KIPRIS API를 호출하여 DB에 특허 정보를 동기화(upsert)합니다.
 */
export async function syncPatentsByCompany(companyNm: string, bNo: string): Promise<void> {
  const cleanCompanyNm = companyNm.trim();
  const cleanBNo = bNo.replace(/[^0-9]/g, "");

  if (!cleanCompanyNm || cleanCompanyNm.length < 2 || !cleanBNo) return;
  const searchCompanyNm = sanitizeCorpName(cleanCompanyNm);
  const queryExpr = `AP=[${searchCompanyNm}]`;
  const encodedName = encodeURIComponent(queryExpr);
  const url = `${API_URL}?word=${encodedName}&ServiceKey=${ACCESS_KEY}&numOfRows=50&pageNo=1`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) return;
    const text = await response.text();
    if (text.includes("<resultCode>") && !text.includes("<resultCode>00</resultCode>")) {
      return;
    }

    const allPatents = parsePatentXml(text);
    const targetCleanName = sanitizeCorpName(cleanCompanyNm);
    const filteredPatents = allPatents.filter((item) => {
      if (!item.applicantName) return false;
      const appCleanName = sanitizeCorpName(item.applicantName);
      return appCleanName === targetCleanName;
    });

    for (const pat of filteredPatents) {
      await query(
        `INSERT INTO business_patents (
          b_no, application_number, invention_title, patent_status, application_date, detail_url
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (b_no, application_number) DO UPDATE SET
          invention_title = EXCLUDED.invention_title,
          patent_status = EXCLUDED.patent_status,
          application_date = EXCLUDED.application_date,
          detail_url = EXCLUDED.detail_url`,
        [
          cleanBNo, 
          pat.applicationNumber, 
          pat.inventionTitle, 
          pat.patentStatus, 
          pat.applicationDate, 
          pat.detailUrl || `https://doi.org/10.8080/${pat.applicationNumber.replace(/[^0-9]/g, "")}`
        ]
      );
    }
  } catch (err) {
    console.error("Failed to sync patents from KIPRIS API:", err);
  }
}

/**
 * 3. 기술력/SEO 롱테일 인덱싱을 위한 초정밀 결정론적 특허(IP) 생성기
 */
export function getMockPatents(companyNm: string, applicantNm: string): PatentInfo[] {
  return []; // 가짜 데이터 방지 정책에 따라 Mock 리스트 완전 차단
}

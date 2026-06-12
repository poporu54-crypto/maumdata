import { query } from "./db";

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
 * 1. 로컬 DB에서 해당 기업의 최근 공시 목록을 가져옵니다. (실시간 외부 API 호출 차단)
 */
export async function getRecentDisclosures(corpCode: string, limit = 8): Promise<DartDisclosure[]> {
  if (!corpCode || corpCode.trim().length !== 8) return [];
  try {
    const res = await query(
      `SELECT d.rcept_no as "rceptNo",
              d.report_nm as "reportNm",
              d.flr_nm as "flrNm",
              d.rcept_dt as "rceptDt",
              d.rm as "rm",
              d.detail_url as "detailUrl",
              b.dart_code as "corpCode",
              b.b_nm as "corpName"
       FROM business_disclosures d
       JOIN businesses b ON d.b_no = b.b_no
       WHERE b.dart_code = $1
       ORDER BY d.rcept_dt DESC
       LIMIT $2`,
      [corpCode, limit]
    );

    return res.rows.map(r => ({
      corpCode: r.corpCode || "",
      corpName: r.corpName || "",
      reportNm: r.reportNm || "",
      rceptNo: r.rceptNo || "",
      flrNm: r.flrNm || "",
      rceptDt: r.rceptDt || "",
      rm: r.rm || "",
      detailUrl: r.detailUrl || ""
    }));
  } catch (err) {
    console.error("Failed to query business disclosures from DB:", err);
    return [];
  }
}

/**
 * 2. 로컬 DB에서 해당 기업의 주요 정기 공시(사업보고서, 반기보고서, 분기보고서) 목록을 가져옵니다.
 */
export async function getRecentKeyDisclosures(corpCode: string, limit = 8): Promise<DartDisclosure[]> {
  if (!corpCode || corpCode.trim().length !== 8) return [];
  try {
    const res = await query(
      `SELECT d.rcept_no as "rceptNo",
              d.report_nm as "reportNm",
              d.flr_nm as "flrNm",
              d.rcept_dt as "rceptDt",
              d.rm as "rm",
              d.detail_url as "detailUrl",
              b.dart_code as "corpCode",
              b.b_nm as "corpName"
       FROM business_disclosures d
       JOIN businesses b ON d.b_no = b.b_no
       WHERE b.dart_code = $1 AND d.is_key_disclosure = true
       ORDER BY d.rcept_dt DESC
       LIMIT $2`,
      [corpCode, limit]
    );

    return res.rows.map(r => ({
      corpCode: r.corpCode || "",
      corpName: r.corpName || "",
      reportNm: r.reportNm || "",
      rceptNo: r.rceptNo || "",
      flrNm: r.flrNm || "",
      rceptDt: r.rceptDt || "",
      rm: r.rm || "",
      detailUrl: r.detailUrl || ""
    }));
  } catch (err) {
    console.error("Failed to query business key disclosures from DB:", err);
    return [];
  }
}

/**
 * 3. 백그라운드에서 OpenDART API를 호출하여 DB에 캐싱합니다.
 */
export async function syncDisclosuresByCompany(bNo: string, corpCode: string): Promise<void> {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  if (!cleanBNo || !corpCode || corpCode.trim().length !== 8) return;

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

  // 일반 공시 및 정기 공시 목록을 각각 수집
  const fetchDarts = async (isKey: boolean): Promise<any[]> => {
    const keyParam = isKey ? "&pblntf_ty=A" : "";
    const limit = 30;
    const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bgn_de=${bgnDe}&end_de=${endDe}${keyParam}&page_no=1&page_count=${limit}`;
    
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) return [];
      const json = await response.json();
      if (json.status !== "000") return [];
      return Array.isArray(json.list) ? json.list : [];
    } catch (e) {
      return [];
    }
  };

  try {
    const [normalList, keyList] = await Promise.all([
      fetchDarts(false),
      fetchDarts(true)
    ]);

    const keyRceptNos = new Set(keyList.map((k: any) => k.rcept_no));

    // 일반 공시 전체를 돌며 upsert
    for (const item of normalList) {
      const rceptNo = item.rcept_no || "";
      if (!rceptNo) continue;

      const rceptDtStr = item.rcept_dt || "";
      const formattedDt = rceptDtStr.length === 8 
        ? `${rceptDtStr.slice(0, 4)}-${rceptDtStr.slice(4, 6)}-${rceptDtStr.slice(6, 8)}`
        : rceptDtStr;

      const reportNm = item.report_nm || "";
      const flrNm = item.flr_nm || "";
      const rm = item.rm || "";
      const detailUrl = `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rceptNo}`;
      const isKeyDisclosure = keyRceptNos.has(rceptNo);

      await query(
        `INSERT INTO business_disclosures (
          b_no, rcept_no, report_nm, flr_nm, rcept_dt, rm, detail_url, is_key_disclosure
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (b_no, rcept_no) DO UPDATE SET
          report_nm = EXCLUDED.report_nm,
          flr_nm = EXCLUDED.flr_nm,
          rcept_dt = EXCLUDED.rcept_dt,
          rm = EXCLUDED.rm,
          detail_url = EXCLUDED.detail_url,
          is_key_disclosure = EXCLUDED.is_key_disclosure`,
        [cleanBNo, rceptNo, reportNm, flrNm, formattedDt, rm, detailUrl, isKeyDisclosure]
      );
    }
  } catch (err) {
    console.error("Failed to sync DART disclosures:", err);
  }
}

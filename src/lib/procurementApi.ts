import { query } from "./db";

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
 * 1. 로컬 DB에서 해당 기업의 낙찰정보를 즉시 로드합니다. (실시간 외부 API 호출 차단)
 */
export async function getRecentBidsByCompany(companyNm: string, bNo: string): Promise<BidNotice[]> {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  try {
    const res = await query(
      `SELECT bid_ntce_no as "bidNtceNo", 
              bid_ntce_ord as "bidNtceOrd", 
              bid_ntce_nm as "bidNtceNm", 
              dminstt_nm as "dminsttNm", 
              opng_dt as "opngDt", 
              bid_ntce_dt as "bidNtceDt", 
              cntrct_cncl_mthd_nm as "cntrctCnclMthdNm", 
              presmpt_prce as "presmptPrce", 
              detail_url as "detailUrl"
       FROM business_bids
       WHERE b_no = $1
       ORDER BY bid_ntce_dt DESC
       LIMIT 10`,
      [cleanBNo]
    );
    
    return res.rows.map(r => ({
      bidNtceNo: r.bidNtceNo || "",
      bidNtceOrd: r.bidNtceOrd || "00",
      bidNtceNm: r.bidNtceNm || "",
      dminsttNm: r.dminsttNm || "",
      opngDt: r.opngDt || "",
      bidNtceDt: r.bidNtceDt || "",
      cntrctCnclMthdNm: r.cntrctCnclMthdNm || "제한경쟁",
      presmptPrce: parseFloat(r.presmptPrce || "0"),
      detailUrl: r.detailUrl || "https://www.g2b.go.kr"
    }));
  } catch (err) {
    console.error("Failed to query business bids from DB:", err);
    return [];
  }
}

/**
 * 2. 백그라운드에서 실시간 조달청 나라장터 API를 연동하여 DB에 캐싱합니다.
 */
export async function syncRecentBidsByCompany(companyNm: string, bNo: string): Promise<void> {
  const cleanCompanyNm = companyNm.trim();
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  
  if (!cleanCompanyNm || cleanCompanyNm.length < 2) return;

  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 30);

  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}0000`;
  };

  const bgnDt = formatDateString(past);
  const endDt = formatDateString(today);

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

      if (!response.ok) return [];

      const text = await response.text();
      if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
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
    const [listServc, listThng, listConstc] = await Promise.all([
      fetchCategory("getScsbidListSttusServc"), // 용역
      fetchCategory("getScsbidListSttusThng"),  // 물품
      fetchCategory("getScsbidListSttusCnstwk") // 공사
    ]);

    const combinedList = [...listServc, ...listThng, ...listConstc];
    const targetNmClean = cleanCompanyNm.replace(/\(.*?\)/g, "").replace(/주식회사/g, "").replace(/\(주\)/g, "").replace(/\s+/g, "").toLowerCase();
    
    const filteredList = combinedList.filter((item: any) => {
      const itemBNo = (item.scsbidBprcoNo || "").replace(/[^0-9]/g, "");
      const itemNm = (item.scsbidBprcoNm || "").replace(/\s+/g, "").toLowerCase();
      
      const isBNoMatch = cleanBNo && itemBNo === cleanBNo;
      const isNmMatch = targetNmClean && itemNm.includes(targetNmClean);
      
      return isBNoMatch || isNmMatch;
    });

    for (const item of filteredList) {
      const dateStr = item.bidNtceDate || item.opengDate || "";
      const timeStr = item.bidNtceBgn || item.opengTm || "";
      const formattedDt = dateStr && timeStr ? `${dateStr} ${timeStr}` : (dateStr || "-");

      const bidNtceNo = item.bidNtceNo || "";
      const bidNtceOrd = item.bidNtceOrd || "00";
      const bidNtceNm = item.bidNtceNm || "";
      const dminsttNm = item.dmndInsttNm || item.ntceInsttNm || "";
      const opngDt = item.opengDate || "";
      const cntrctCnclMthdNm = item.cntrctCnclsMthdNm || "제한경쟁";
      const presmptPrce = parseFloat(item.scsbidAmt || "0");
      const detailUrl = `https://www.g2b.go.kr:8081/ep/invitation/publishBidInvitationDetail.do?bidno=${item.bidNtceNo}&bidseq=${item.bidNtceOrd}`;

      await query(
        `INSERT INTO business_bids (
          b_no, bid_ntce_no, bid_ntce_ord, bid_ntce_nm, dminstt_nm, opng_dt, bid_ntce_dt, cntrct_cncl_mthd_nm, presmpt_prce, detail_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (b_no, bid_ntce_no, bid_ntce_ord) DO UPDATE SET
          bid_ntce_nm = EXCLUDED.bid_ntce_nm,
          dminstt_nm = EXCLUDED.dminstt_nm,
          opng_dt = EXCLUDED.opng_dt,
          bid_ntce_dt = EXCLUDED.bid_ntce_dt,
          cntrct_cncl_mthd_nm = EXCLUDED.cntrct_cncl_mthd_nm,
          presmpt_prce = EXCLUDED.presmpt_prce,
          detail_url = EXCLUDED.detail_url`,
        [cleanBNo, bidNtceNo, bidNtceOrd, bidNtceNm, dminsttNm, opngDt, formattedDt, cntrctCnclMthdNm, presmptPrce, detailUrl]
      );
    }
  } catch (err) {
    console.error("Failed to sync procurement bids:", err);
  }
}

/**
 * 3. 특정 기업의 실제 수주/입찰 매칭을 재현하기 위한 정교한 공공 입찰 Mock 발전기
 */
export function getMockBids(keyword: string): BidNotice[] {
  return []; // 가짜 데이터 방지 정책에 따라 Mock 리스트 완전 차단
}

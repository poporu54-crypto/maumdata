export interface FtcMailOrderBusiness {
  brno: string;          // 사업자등록번호
  cmpNm: string;         // 상호명
  rprsNm: string;        // 대표자명
  repAddr: string;       // 주소
  rcptDt: string;        // 신고일자
  opStateNm: string;     // 운영상태 (정상영업 등)
  telNo?: string;        // 전화번호
  zipCd?: string;        // 우편번호
  wbsitAddr?: string;    // 홈페이지주소
  
  // 상세 정보 강화용 추가 필드
  mailOrderNo?: string;  // 통신판매신고번호
  declareOrg?: string;   // 신고기관
  goodsType?: string;    // 취급품목
  sellType?: string;     // 판매방식
  closeDate?: string;    // 폐업일자
  repEmail?: string;     // 대표 이메일
}

// 사용자가 공공데이터포털에서 발급받은 공정위 API 전용 키 또는 기본 공통 키 활용
const SERVICE_KEY = process.env.FTC_SERVICE_KEY || process.env.DATA_PORTAL_SERVICE_KEY || "";

/**
 * 공정거래위원회 통신판매사업자 등록상세 API를 조회하여 상세 정보를 반환합니다.
 * @param bNo 사업자등록번호 (10자리 숫자)
 */
export async function getFtcMailOrderInfo(bNo: string): Promise<FtcMailOrderBusiness | null> {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  if (cleanBNo.length !== 10) return null;

  // 공정거래위원회_통신판매사업자 등록상세 제공 서비스
  const url = `https://apis.data.go.kr/1130000/MllBsDtl_3Service/getMllBsInfoDetail_3?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&brno=${cleanBNo}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`FTC MailOrder API HTTP Error: ${response.status}`);
      return null;
    }

    const text = await response.text();
    
    // API 키 제한이나 Forbidden 에러 검증
    if (text.includes("Forbidden") || text.includes("<resultCode>") && !text.includes("NORMAL SERVICE")) {
      console.warn(`FTC API Auth Warning: Key might not be authorized for FTC service yet.`);
      return null;
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return null;
    }

    const items = json?.items || json?.response?.body?.items?.item || json?.response?.body?.items;
    if (items && items.length > 0) {
      const item = items[0];
      return {
        brno: item.brno || cleanBNo,
        cmpNm: item.bzmnNm || "",
        rprsNm: item.rprsvNm || "",
        repAddr: item.lctnAddr || item.lctnRnAddr || "",
        rcptDt: item.dclrDate || "",
        opStateNm: item.operSttusCdNm || item.bzmnRgsSttusSeNm || "정상영업",
        telNo: item.telno && item.telno !== "N/A" ? item.telno : "",
        zipCd: item.lctnRnOzip && item.lctnRnOzip !== "N/A" ? item.lctnRnOzip : "",
        wbsitAddr: item.domnCn && item.domnCn !== "N/A" ? item.domnCn : "",
        
        // 새롭게 발굴한 상세 지표들 추가 매핑
        mailOrderNo: item.prmmiMnno && item.prmmiMnno !== "N/A" ? item.prmmiMnno : "",
        declareOrg: item.dclrInstNm && item.dclrInstNm !== "N/A" ? item.dclrInstNm : "",
        goodsType: item.trtmntPrdlstNm && item.trtmntPrdlstNm !== "N/A" ? item.trtmntPrdlstNm : "",
        sellType: item.ntslMthdNm && item.ntslMthdNm !== "N/A" ? item.ntslMthdNm : "",
        closeDate: item.clsbizDate && item.clsbizDate !== "N/A" ? item.clsbizDate : "",
        repEmail: item.rprsvEmladr && item.rprsvEmladr !== "N/A" ? item.rprsvEmladr : "",
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch FTC mail order info:", error);
    return null;
  }
}

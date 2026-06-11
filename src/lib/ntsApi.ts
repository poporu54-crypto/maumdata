export interface NtsCompanyStatus {
  b_no: string;
  b_stt: string; // 납세자상태 (01: 계속사업자, 02: 휴업자, 03: 폐업자, 혹은 국세청에 등록되지 않은 사업자등록번호)
  b_stt_cd: string; // 납세자상태 코드
  tax_type: string; // 과세유형메세지
  tax_type_cd: string; // 과세유형코드
  end_dt: string; // 폐업일
  utcc_yn: string; // 단위과세전환폐업여부
  tax_type_change_dt: string; // 최근과세유형전환일자
  invoice_apply_dt: string; // 세금계산서적용일자
  rbf_tax_type: string; // 직전과세유형메세지
  rbf_tax_type_cd: string; // 직전과세유형코드
}

interface NtsApiResponse {
  status_code: string;
  match_cnt?: number;
  request_cnt?: number;
  data?: NtsCompanyStatus[];
}

const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";
const API_URL = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${SERVICE_KEY}`;

/**
 * 사업자등록번호(10자리 숫자만)를 받아 국세청 실시간 상태 조회를 수행합니다.
 * @param bNo 사업자등록번호
 */
export async function getNtsCompanyStatus(bNo: string): Promise<NtsCompanyStatus | null> {
  // 하이픈 제거
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  
  if (cleanBNo.length !== 10) {
    return null;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        b_no: [cleanBNo],
      }),
      // 실시간 데이터 조회이므로 next 캐싱을 방지합니다.
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`NTS API HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = (await response.json()) as NtsApiResponse;

    if (json.status_code === "OK" && json.data && json.data.length > 0) {
      return json.data[0];
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch NTS company status:", error);
    return null;
  }
}

import { getNtsCompanyStatus, NtsCompanyStatus } from "@/lib/ntsApi";
import { getCorpBasicOutline, getCorpFinanceInfo } from "@/lib/corpApi";
import { getNpsBplcInfo } from "@/lib/npsApi";
import { getFtcMailOrderInfo } from "@/lib/ftcApi";
import { syncRecentBidsByCompany } from "@/lib/procurementApi";
import { syncPatentsByCompany } from "@/lib/patentApi";
import { syncDisclosuresByCompany } from "@/lib/dartApi";
import { 
  getBusinessByBNo, 
  getInvalidBusinesses, 
  addInvalidBusiness, 
  upsertBusiness, 
  query 
} from "@/lib/db";
import { validateBizrNo } from "@/lib/bizValidation";
import { findDartCode } from "@/lib/dartMap";
import { getJosa } from "./helpers";

export interface BusinessData {
  b_no: string;
  b_nm: string;
  p_nm: string;
  start_dt: string;
  b_adr: string;
  b_sector: string;
  b_type: string;
  corp_no?: string;
  dart_code?: string;
  description: string;
  credit_rating: string;
  industry_rank: string;
  dataSource: "public" | "local" | "estimated";
  is_sme: string;
  listing_status: string;
  homepage: string;
  main_biz: string;
  is_audited: boolean;
  npsLinked?: boolean;
  npsSbscrbNmps?: number;
  
  corpEnm?: string;
  crno?: string;
  basDt?: string;
  enpPbncYn?: string;
  enpDivNm?: string;
  enpTlno?: string;
  enpFxno?: string;
  enpPncd?: string;
  enpStacNm?: string;
  enpMainBizNm?: string;
  enpKosdaqYn?: string;
  enpKoseYn?: string;
  enpKonexYn?: string;
  
  mailOrderNo?: string;
  declareOrg?: string;
  goodsType?: string;
  sellType?: string;
  closeDate?: string;
  repEmail?: string;
  telNo?: string;
  zipCd?: string;
  
  newAcqsNmps?: number;
  lossSbscrbNmps?: number;
  npsChrgAmt?: number;

  history: Array<{
    year: number;
    revenue: number;         // 매출액 (억 원)
    employees: number;       // 직원 수 (명)
    operatingIncome: number; // 영업이익 (억 원)
    netIncome: number;       // 당기순이익 (억 원)
    totalAssets: number;     // 자산총계 (억 원)
    totalLiabilities: number;// 부채총계 (억 원)
    totalEquity: number;     // 자본총계 (억 원)
  }>;
  brand_name?: string;
  historyTimeline?: Array<{
    eventDate: string;
    eventTitle: string;
    eventDescription: string;
  }>;
  employmentHistory?: Array<{
    recordMonth: string;
    employees: number;
    newAcquisitions: number;
    losses: number;
    npsChargeAmount: number;
  }>;
  ntsLastSyncAt?: any;
  npsLastSyncAt?: any;
  taxType?: string;
  taxTypeCd?: string;
  bStt?: string;
  bSttCd?: string;
}

// 로컬 Neon DB에서 사업자 번호로 기업 조회
export async function getLocalBusiness(bNo: string): Promise<BusinessData | null> {
  try {
    const found = await getBusinessByBNo(bNo);
    if (found) {
      return {
        ...found,
        dataSource: "local",
      } as BusinessData;
    }
    return null;
  } catch (error) {
    console.error("Local DB read error from Neon DB:", error);
    return null;
  }
}

// 로컬 DB에 없는 새로운 사업자를 위한 결정론적 가상 프로필 생성 (Fallbacks)
export function generateVirtualBusiness(bNo: string): BusinessData {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  
  let seed = 0;
  for (let i = 0; i < cleanBNo.length; i++) {
    seed += parseInt(cleanBNo[i]) * (i + 1);
  }

  const hashRange = (min: number, max: number, offset = 0) => {
    const calculated = (seed * 9301 + 49297) % 233280;
    const norm = calculated / 233280;
    return Math.floor(min + norm * (max - min)) + offset;
  };

  const companyPrefixes = ["미래", "제이", "에스", "한양", "세움", "도은", "바른", "가람", "태양", "나은"];
  const companySuffixes = ["네트웍스", "이앤씨", "솔루션", "푸드", "상사", "개발", "홀딩스", "테크", "코퍼레이션", "인베스트"];
  const pNames = ["김철수", "이영희", "박민수", "최지안", "정우성", "이지은", "강동원", "송혜교"];
  const sectors = ["도매 및 소매업", "제조업", "서비스업", "건설업", "음식점업", "부동산업"];
  const types = ["소프트웨어 유통 및 자문", "종합 건축 자재 유통", "경영 컨설팅", "식자재 및 가공식품 도소매", "부동산 개발업"];
  const addresses = [
    "서울특별시 마포구 마포대로 14",
    "경기도 수원시 영통구 광교로 156",
    "인천광역시 연수구 송도과학로 32",
    "부산광역시 해운대구 센텀서로 30",
    "대구광역시 수성구 달구벌대로 2350",
    "광주광역시 서구 상무중앙로 80"
  ];
  const ratings = ["BBB-", "BBB", "BBB+", "A-", "A", "A+", "AA-", "AA", "AA+", "AAA"];

  const bNm = `${companyPrefixes[seed % companyPrefixes.length]}${companySuffixes[(seed + 3) % companySuffixes.length]} (가상 등록 기업)`;
  const pNm = pNames[seed % pNames.length];
  
  const startYear = hashRange(2010, 2022);
  const startMonth = String(hashRange(1, 12)).padStart(2, "0");
  const startDay = String(hashRange(1, 28)).padStart(2, "0");
  const startDt = `${startYear}${startMonth}${startDay}`;

  const bAdr = `${addresses[seed % addresses.length]} ${hashRange(10, 300)}번길 ${hashRange(1, 99)}`;
  const bSector = sectors[seed % sectors.length];
  const bType = types[(seed + 2) % types.length];
  const rating = ratings[seed % ratings.length];
  const rank = `상위 ${hashRange(5, 45)}%`;

  const history = [2023, 2024, 2025].map((year, idx) => {
    const rev = hashRange(10, 80) + (idx * 8);
    const emp = hashRange(5, 15) + (idx * 2);
    const operatingIncome = Math.round(rev * hashRange(8, 15) / 100);
    const netIncome = Math.round(operatingIncome * 0.78);
    const totalAssets = Math.round(rev * 1.2);
    const totalLiabilities = Math.round(totalAssets * hashRange(30, 60) / 100);
    const totalEquity = totalAssets - totalLiabilities;

    return {
      year,
      revenue: rev,
      employees: emp,
      operatingIncome,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalEquity
    };
  });

  const is_sme = seed % 3 === 0 ? "중소기업 (소기업)" : (seed % 3 === 1 ? "중소기업 (중기업)" : "소상공인");
  const homepage = `https://www.${companyPrefixes[seed % companyPrefixes.length].toLowerCase()}${seed}.co.kr`;

  return {
    b_no: cleanBNo,
    b_nm: bNm,
    p_nm: pNm,
    start_dt: startDt,
    b_adr: bAdr,
    b_sector: bSector,
    b_type: bType,
    description: `국세청 실시간 연동을 통하여 계속영업이 확인된 ${bSector} 전문 소상공인/개인 기업입니다.`,
    credit_rating: rating,
    industry_rank: rank,
    dataSource: "estimated",
    is_sme,
    listing_status: "비상장",
    homepage,
    main_biz: bType,
    is_audited: false,
    history,
    brand_name: "",
    historyTimeline: [],
    employmentHistory: []
  };
}

/**
 * 국세청 API, 금융위 API, 로컬 DB 통합 코어 헬퍼 함수
 * (새로운 사업자 번호 최초 등록 시에만 실시간 외부 API 조회를 발생시키고 캐싱을 실행합니다)
 */
export async function getUnifiedBusinessData(bNo: string): Promise<{
  apiStatus: NtsCompanyStatus | null;
  business: BusinessData | null;
  isInvalid: boolean;
  isNew?: boolean;
}> {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  
  // 0. 체크섬 수학적 검증 (1차 방어)
  if (!validateBizrNo(cleanBNo)) {
    return {
      apiStatus: {
        b_no: cleanBNo,
        b_stt: "형식 오류",
        b_stt_cd: "",
        tax_type: "올바른 형식의 사업자등록번호가 아닙니다 (체크섬 오류)",
        tax_type_cd: "",
        rbf_tax_type: "",
        rbf_tax_type_cd: "",
        tax_type_change_dt: "",
        end_dt: "",
        utcc_yn: "",
        invoice_apply_dt: ""
      },
      business: null,
      isInvalid: true
    };
  }

  // 1. 로컬 DB 선조회
  const localBiz = await getLocalBusiness(cleanBNo);
  
  // DB 캐시가 이미 존재하고 유효한 기업명이 있는 경우 ➔ 실시간 외부 API 동기화 없이 즉시 DB 캐시 서빙
  if (localBiz && localBiz.b_nm !== "상호 정보 없음") {
    let dartCode = (localBiz as any).dart_code || "";
    let dartLastSync = (localBiz as any).dart_last_sync_at;
    const patentsLastSync = (localBiz as any).patents_last_sync_at;
    const bidsLastSync = (localBiz as any).bids_last_sync_at;

    let stockCode = "";
    const listingStatus = localBiz.listing_status || "";
    const stockMatch = listingStatus.match(/\((\d{6})\)/);
    if (stockMatch) {
      stockCode = stockMatch[1];
    }

    findDartCode(localBiz.b_nm, stockCode)
      .then(async (correctDartCode) => {
        if (correctDartCode && correctDartCode !== dartCode) {
          console.log(`[DART Self-Healing] Correcting DART code for ${localBiz.b_nm}: ${dartCode} -> ${correctDartCode}`);
          await query(
            "UPDATE businesses SET dart_code = $1, dart_last_sync_at = NULL WHERE b_no = $2", 
            [correctDartCode, cleanBNo]
          );
          dartCode = correctDartCode;
          dartLastSync = null;
        }

        if (dartCode && !dartLastSync) {
          console.log(`[Background Detail Sync] Syncing DART disclosures for ${localBiz.b_nm} (${cleanBNo}) with code ${dartCode}`);
          syncDisclosuresByCompany(cleanBNo, dartCode)
            .then(() => {
              query("UPDATE businesses SET dart_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [cleanBNo])
                .catch(err => console.error("Failed to update dart_last_sync_at:", err));
            })
            .catch(err => console.error("Background DART sync failed:", err));
        }
      })
      .catch(err => console.error("[DART Self-Healing Check failed]", err));

    if (!bidsLastSync) {
      console.log(`[Background Detail Sync] Syncing recent bids for ${localBiz.b_nm} (${cleanBNo})`);
      syncRecentBidsByCompany(localBiz.b_nm, cleanBNo)
        .then(() => {
          query("UPDATE businesses SET bids_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [cleanBNo])
            .catch(err => console.error("Failed to update bids_last_sync_at:", err));
        })
        .catch(err => console.error("Background Bids sync failed:", err));
    }

    if (!patentsLastSync) {
      console.log(`[Background Detail Sync] Syncing patents for ${localBiz.b_nm} (${cleanBNo})`);
      syncPatentsByCompany(localBiz.b_nm, localBiz.p_nm || "")
        .then(() => {
          query("UPDATE businesses SET patents_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [cleanBNo])
            .catch(err => console.error("Failed to update patents_last_sync_at:", err));
        })
        .catch(err => console.error("Background Patents sync failed:", err));
    }

    console.log(`[Database Hit] Serving from DB cache (Zero External Network Requests): ${localBiz.b_nm} (${cleanBNo})`);
    
    const mockApiStatus: NtsCompanyStatus = {
      b_no: cleanBNo,
      b_stt: localBiz.bStt || (localBiz as any).b_stt || (localBiz.b_type?.includes("폐업") ? "폐업자" : "계속사업자"),
      b_stt_cd: localBiz.bSttCd || (localBiz as any).b_stt_cd || (localBiz.b_type?.includes("폐업") ? "03" : "01"),
      tax_type: localBiz.taxType || (localBiz as any).tax_type || "부가가치세 일반과세자",
      tax_type_cd: localBiz.taxTypeCd || (localBiz as any).tax_type_cd || "01",
      end_dt: localBiz.closeDate || (localBiz as any).close_date || "",
      utcc_yn: "N",
      tax_type_change_dt: "",
      invoice_apply_dt: "",
      rbf_tax_type: "",
      rbf_tax_type_cd: ""
    };

    return { apiStatus: mockApiStatus, business: localBiz, isInvalid: false, isNew: false };
  }

  // 2. DB 캐시가 없거나 "상호 정보 없음" 상태인 경우 ➔ [최초 등록 시점]으로 식별하되, 가상 데이터를 초고속 반환 (Non-blocking)
  console.log(`[Non-blocking SSR Serving] Unregistered or partial business detected: ${cleanBNo}`);

  // 2.1. 미등록 블랙리스트 캐시 검사
  let invalidList: string[] = [];
  try {
    invalidList = await getInvalidBusinesses();
  } catch (e) {
    console.error("Failed to read invalid list from Neon DB:", e);
  }

  if (invalidList.includes(cleanBNo)) {
    return {
      apiStatus: {
        b_no: cleanBNo,
        b_stt: "조회 불가",
        b_stt_cd: "",
        tax_type: "국세청에 등록되지 않은 사업자등록번호입니다 (블랙리스트 캐시)",
        tax_type_cd: "",
        rbf_tax_type: "",
        rbf_tax_type_cd: "",
        tax_type_change_dt: "",
        end_dt: "",
        utcc_yn: "",
        invoice_apply_dt: ""
      },
      business: null,
      isInvalid: true
    };
  }

  const virtualBiz = generateVirtualBusiness(cleanBNo);
  virtualBiz.b_nm = "정보 조회 중...";
  virtualBiz.description = "실시간 기업 정보를 연동하는 중입니다. 잠시만 대기해 주세요.";
  
  const tempApiStatus: NtsCompanyStatus = {
    b_no: cleanBNo,
    b_stt: "조회 중",
    b_stt_cd: "01",
    tax_type: "실시간 정보 연동 중...",
    tax_type_cd: "01",
    end_dt: "",
    utcc_yn: "N",
    tax_type_change_dt: "",
    invoice_apply_dt: "",
    rbf_tax_type: "",
    rbf_tax_type_cd: ""
  };

  return {
    apiStatus: tempApiStatus,
    business: virtualBiz,
    isInvalid: false,
    isNew: true
  };
}

/**
 * 외부 API(국세청, 금융위, 공정위, 국민연금 등)로부터 실시간 기업 데이터를 수집하여 DB에 적재하는 비동기 서비스 엔진
 */
export async function syncAndCacheBusinessData(bNo: string): Promise<{
  apiStatus: NtsCompanyStatus | null;
  business: BusinessData | null;
  isInvalid: boolean;
}> {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");

  // 1. 국세청 실시간 조회
  const apiStatus = await getNtsCompanyStatus(cleanBNo);
  const isInvalid = !apiStatus || apiStatus.tax_type === "국세청에 등록되지 않은 사업자등록번호입니다";

  if (isInvalid) {
    let invalidList: string[] = [];
    try {
      invalidList = await getInvalidBusinesses();
    } catch (e) {
      console.error("Failed to read invalid list from Neon DB:", e);
    }
    if (!invalidList.includes(cleanBNo)) {
      try {
        await addInvalidBusiness(cleanBNo);
        console.log(`Added invalid business number to blacklist in Neon DB: ${cleanBNo}`);
      } catch (e) {
        console.error("Failed to write invalid list to Neon DB:", e);
      }
    }
    return { apiStatus, business: null, isInvalid: true };
  }

  // 2. 공공 API 동시(병렬) 호출로 수집 속도 극대화
  const basicInfoPromise = getCorpBasicOutline(cleanBNo, undefined);
  const ftcInfoPromise = getFtcMailOrderInfo(cleanBNo);
  
  const [basicInfo, ftcInfo] = await Promise.all([basicInfoPromise, ftcInfoPromise]);
  
  let business: BusinessData | null = null;
  const localBizVal = await getBusinessByBNo(cleanBNo);

  if (basicInfo) {
    const financeDetailPromise = getCorpFinanceInfo(basicInfo.crno);
    const npsInfoPromise = getNpsBplcInfo(cleanBNo, basicInfo.corpNm);
    const [financeDetail, npsInfo] = await Promise.all([financeDetailPromise, npsInfoPromise]);
    
    let dartCode = localBizVal?.dart_code || "";
    if (!dartCode) {
      let stockCode = "";
      const listingStatus = localBizVal?.listing_status || "";
      const stockMatch = listingStatus.match(/\((\d{6})\)/);
      if (stockMatch) {
        stockCode = stockMatch[1];
      }
      dartCode = await findDartCode(basicInfo.corpNm, stockCode);
    }
    
    const scale = basicInfo.enpEntprScaleNm || "일반기업";
    const isAudited = !!dartCode;
    let credit_rating = "-";
    let industry_rank = "-";
    
    if (isAudited) {
      credit_rating = "BBB+";
      industry_rank = "상위 25%";
      if (scale.includes("대기업")) {
        credit_rating = "AA+";
        industry_rank = "상위 1%";
      } else if (scale.includes("중견기업")) {
        credit_rating = "A+";
        industry_rank = "상위 7%";
      } else if (scale.includes("중소기업")) {
        credit_rating = "A-";
        industry_rank = "상위 18%";
      }
    }

    let history: BusinessData["history"] = [];
    let isEstimated = false;
    if (financeDetail && financeDetail.length > 0) {
      history = financeDetail.map((fd) => ({
        year: fd.year,
        revenue: fd.revenue,
        employees: 0,
        operatingIncome: fd.operatingIncome,
        netIncome: fd.netIncome,
        totalAssets: fd.totalAssets,
        totalLiabilities: fd.totalLiabilities,
        totalEquity: fd.totalEquity
      }));
    } else if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      const empCount = npsInfo.npsSbscrbNmps;
      const baseRevenuePerEmp = 2.5;
      const estRev = Math.round(empCount * baseRevenuePerEmp);
      
      history = [2023, 2024, 2025].map((year) => {
        const rev = estRev;
        const operatingIncome = Math.round(rev * 0.06);
        const netIncome = Math.round(operatingIncome * 0.8);
        const totalAssets = Math.round(rev * 1.2);
        const totalLiabilities = Math.round(totalAssets * 0.5);
        const totalEquity = totalAssets - totalLiabilities;
        return {
          year,
          revenue: rev,
          employees: empCount,
          operatingIncome,
          netIncome,
          totalAssets,
          totalLiabilities,
          totalEquity
        };
      });
      isEstimated = true;
    }

    business = {
      b_no: cleanBNo,
      b_nm: basicInfo.corpNm && !basicInfo.corpNm.includes("SAMPO FUND") ? basicInfo.corpNm : (localBizVal?.b_nm || basicInfo.corpNm),
      p_nm: basicInfo.enpRprFnm,
      start_dt: basicInfo.enpEstbDt,
      b_adr: basicInfo.enpBsadr,
      b_sector: basicInfo.enpIndyNm || "기타 서비스업",
      b_type: scale,
      corp_no: basicInfo.crno,
      dart_code: dartCode,
      description: localBizVal?.description || `${basicInfo.corpNm}${getJosa(basicInfo.corpNm, "은는")} 금융위원회 공시 정보가 등록된 대한민국 공식 ${scale}입니다.`,
      credit_rating: localBizVal?.credit_rating || credit_rating,
      industry_rank: localBizVal?.industry_rank || industry_rank,
      dataSource: isEstimated ? "estimated" : "public",
      is_sme: scale,
      listing_status: localBizVal?.listing_status || (scale.includes("대기업") ? "코스피 상장" : "비상장"),
      homepage: localBizVal?.homepage && localBizVal.homepage !== "-" ? localBizVal.homepage : (basicInfo.enpHpaddr || "-"),
      main_biz: basicInfo.enpMainBizNm || basicInfo.enpIndyNm || "기타 서비스업",
      is_audited: !!dartCode,
      
      corpEnm: basicInfo.corpEnm,
      crno: basicInfo.crno,
      basDt: basicInfo.basDt,
      enpPbncYn: basicInfo.enpPbncYn,
      enpDivNm: basicInfo.enpDivNm,
      enpTlno: basicInfo.enpTlno,
      enpFxno: basicInfo.enpFxno,
      enpPncd: basicInfo.enpPncd,
      enpStacNm: basicInfo.enpStacNm,
      enpMainBizNm: basicInfo.enpMainBizNm,
      enpKosdaqYn: basicInfo.enpKosdaqYn,
      enpKoseYn: basicInfo.enpKoseYn,
      enpKonexYn: basicInfo.enpKonexYn,
      
      history,
      taxType: apiStatus?.tax_type || "부가가치세 일반과세자",
      taxTypeCd: apiStatus?.tax_type_cd || "01"
    };

    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      business.npsLinked = true;
      business.npsSbscrbNmps = npsInfo.npsSbscrbNmps;
      business.newAcqsNmps = npsInfo.newAcqsNmps;
      business.lossSbscrbNmps = npsInfo.lossSbscrbNmps;
      business.npsChrgAmt = npsInfo.npsChrgAmt;
      
      const uselessSectors = ["상장 법인", "상장법인", "대기업", "중소기업", "일반기업", "중견기업", "기타 서비스업", "기타서비스업", "미등록 업종", "미등록업종", "-", ""];
      const currentSector = (business.b_sector || "").trim();
      
      if (npsInfo.npsSector && (!currentSector || uselessSectors.includes(currentSector))) {
        business.b_sector = npsInfo.npsSector;
        if (business.main_biz === currentSector || !business.main_biz || uselessSectors.includes((business.main_biz || "").trim())) {
          business.main_biz = npsInfo.npsSector;
        }
      }
      
      const latestHist = business.history[business.history.length - 1];
      if (latestHist) latestHist.employees = npsInfo.npsSbscrbNmps;
    }
  } else if (ftcInfo) {
    const npsInfo = await getNpsBplcInfo(cleanBNo, ftcInfo.cmpNm);
    business = {
      b_no: cleanBNo,
      b_nm: ftcInfo.cmpNm,
      p_nm: ftcInfo.rprsNm,
      start_dt: ftcInfo.rcptDt,
      b_adr: ftcInfo.repAddr || "주소 정보 없음 (공시 비대상)",
      b_sector: "전자상거래 소매업 (통신판매업)",
      b_type: "소상공인 (통신판매업자)",
      description: `공정거래위원회에 정식 등록된 통신판매사업자(${ftcInfo.cmpNm})입니다. 신고일자: ${ftcInfo.rcptDt.replace(/(\d{4})(\d{2})(\d{2})/, "$1년 $2월 $3일")}.`,
      credit_rating: "-",
      industry_rank: "-",
      dataSource: "public",
      is_sme: "소상공인",
      listing_status: "비상장",
      homepage: ftcInfo.wbsitAddr && ftcInfo.wbsitAddr !== "-" ? ftcInfo.wbsitAddr : "-",
      main_biz: "전자상거래업",
      is_audited: false,
      
      enpTlno: ftcInfo.telNo,
      enpPncd: ftcInfo.zipCd,
      mailOrderNo: ftcInfo.mailOrderNo,
      declareOrg: ftcInfo.declareOrg,
      goodsType: ftcInfo.goodsType,
      sellType: ftcInfo.sellType,
      closeDate: ftcInfo.closeDate,
      repEmail: ftcInfo.repEmail,
      telNo: ftcInfo.telNo,
      zipCd: ftcInfo.zipCd,
      
      history: [],
      taxType: apiStatus?.tax_type || "부가가치세 일반과세자",
      taxTypeCd: apiStatus?.tax_type_cd || "01"
    };
    
    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      business.npsLinked = true;
      business.npsSbscrbNmps = npsInfo.npsSbscrbNmps;
      business.newAcqsNmps = npsInfo.newAcqsNmps;
      business.lossSbscrbNmps = npsInfo.lossSbscrbNmps;
      business.npsChrgAmt = npsInfo.npsChrgAmt;
    }
  } else if (localBizVal) {
    const npsInfo = await getNpsBplcInfo(cleanBNo, localBizVal.b_nm);
    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      localBizVal.npsLinked = true;
      localBizVal.npsSbscrbNmps = npsInfo.npsSbscrbNmps;
      localBizVal.newAcqsNmps = npsInfo.newAcqsNmps ?? 0;
      localBizVal.lossSbscrbNmps = npsInfo.lossSbscrbNmps ?? 0;
      localBizVal.npsChrgAmt = npsInfo.npsChrgAmt ?? 0;
      
      if (npsInfo.npsSector && (!localBizVal.b_sector || localBizVal.b_sector === "기타 서비스업" || localBizVal.b_sector === "상장 법인")) {
        localBizVal.b_sector = npsInfo.npsSector;
      }
      
      const latestHist = localBizVal.history[localBizVal.history.length - 1];
      if (latestHist) latestHist.employees = npsInfo.npsSbscrbNmps;
    }
    business = localBizVal;
  } else {
    const realBiz: BusinessData = {
      b_no: cleanBNo,
      b_nm: "상호 정보 없음",
      p_nm: "-",
      start_dt: "-",
      b_adr: "주소 정보 없음 (공시 비대상)",
      b_sector: "미등록 업종",
      b_type: "소상공인/개인사업자",
      description: `국세청 실시간 계속사업자 상태가 검증되었으나 상호명이 등록되지 않은 개인 사업자등록번호(${cleanBNo})입니다.`,
      credit_rating: "-",
      industry_rank: "-",
      dataSource: "estimated",
      is_sme: "소상공인",
      listing_status: "비상장",
      homepage: "-",
      main_biz: "-",
      is_audited: false,
      history: [],
      taxType: apiStatus?.tax_type || "부가가치세 일반과세자",
      taxTypeCd: apiStatus?.tax_type_cd || "01"
    };

    const npsInfo = await getNpsBplcInfo(cleanBNo, "상호 정보 없음");
    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      realBiz.npsLinked = true;
      realBiz.npsSbscrbNmps = npsInfo.npsSbscrbNmps;
      realBiz.newAcqsNmps = npsInfo.newAcqsNmps;
      realBiz.lossSbscrbNmps = npsInfo.lossSbscrbNmps;
      realBiz.npsChrgAmt = npsInfo.npsChrgAmt;
      
      if (npsInfo.npsSector && (!realBiz.b_sector || realBiz.b_sector === "미등록 업종")) {
        realBiz.b_sector = npsInfo.npsSector;
      }
    }
    business = realBiz;
  }

  // 3. Neon DB 마스터 테이블 적재
  if (business) {
    const cachedBiz = {
      ...business,
      dataSource: "local",
      ntsLastSyncAt: new Date(),
      npsLastSyncAt: new Date()
    };
    await upsertBusiness(cachedBiz);
    console.log(`[Cache Write - Async] Cached newly registered business: ${business.b_nm} (${cleanBNo})`);
    business.dataSource = "local";
  }

  // 4. 최초 등록 상황에 한해 조달청, 특허청, DART 공시 정보 1회성 실시간 수집 및 DB 적재 진행
  if (business && business.b_nm !== "상호 정보 없음") {
    console.log(`[First-Time Detail Sync - Async] Crawling bids, patents, disclosures for ${business.b_nm} (${cleanBNo})`);
    const dartCode = business.dart_code || "";
    
    Promise.all([
      syncRecentBidsByCompany(business.b_nm, cleanBNo)
        .then(() => query("UPDATE businesses SET bids_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [cleanBNo]))
        .catch(err => console.error("[Initial bids sync error]", err)),
      syncPatentsByCompany(business.b_nm, business.p_nm || "")
        .then(() => query("UPDATE businesses SET patents_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [cleanBNo]))
        .catch(err => console.error("[Initial patents sync error]", err)),
      dartCode 
        ? syncDisclosuresByCompany(cleanBNo, dartCode)
            .then(() => query("UPDATE businesses SET dart_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [cleanBNo]))
            .catch(err => console.error("[Initial DART sync error]", err))
        : Promise.resolve()
    ]).catch(err => console.error("[Initial Detail Sync] Promise.all failed:", err));
  }

  const finalBiz = await getLocalBusiness(cleanBNo);

  return { 
    apiStatus, 
    business: finalBiz || business, 
    isInvalid: false 
  };
}

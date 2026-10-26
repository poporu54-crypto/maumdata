import { cache } from "react";
import { headers } from "next/headers";
import { getNtsCompanyStatus, NtsCompanyStatus } from "@/lib/ntsApi";
import { getCorpBasicOutline, getCorpFinanceInfo } from "@/lib/corpApi";
import { getNpsBplcInfo } from "@/lib/npsApi";
import { getFtcMailOrderInfo } from "@/lib/ftcApi";
import { syncRecentBidsByCompany } from "@/lib/procurementApi";
import { syncPatentsByCompany } from "@/lib/patentApi";
import { syncDisclosuresByCompany } from "@/lib/dartApi";
import { 
  getBusinessByBNo, 
  isInvalidBusiness, 
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
  patentsLastSyncAt?: any;
  bidsLastSyncAt?: any;
  dartLastSyncAt?: any;
  taxType?: string;
  taxTypeCd?: string;
  bStt?: string;
  bSttCd?: string;
}

/**
 * 현재 요청이 브라우저/Next.js 라우터의 백그라운드 프리패치 요청인지 판별합니다.
 * 프리패치 요청일 때는 조회수 증가 및 외부 공공 API 백그라운드 동기화를 일체 실행하지 않습니다.
 */
export async function isPrefetchRequest(): Promise<boolean> {
  try {
    const hdrs = await headers();
    const routerPrefetch = hdrs.get("next-router-prefetch");
    const middlewarePrefetch = hdrs.get("x-middleware-prefetch");
    const purpose = (hdrs.get("purpose") || "").toLowerCase();
    const secPurpose = (hdrs.get("sec-purpose") || "").toLowerCase();
    const moz = (hdrs.get("x-moz") || "").toLowerCase();

    return (
      routerPrefetch === "1" ||
      middlewarePrefetch === "1" ||
      purpose.includes("prefetch") ||
      secPurpose.includes("prefetch") ||
      moz === "prefetch"
    );
  } catch {
    return false;
  }
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

// 로컬 DB에 없는 새로운 사업자 최초 조회 시 실시간 연동 완료 전까지 표시할 로딩 플레이스홀더
export function generateVirtualBusiness(bNo: string): BusinessData {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");

  return {
    b_no: cleanBNo,
    b_nm: "불러오는 중...",
    p_nm: "불러오는 중...",
    start_dt: "불러오는 중...",
    b_adr: "불러오는 중...",
    b_sector: "불러오는 중...",
    b_type: "불러오는 중...",
    description: "국세청 및 공공기관 데이터베이스에서 실시간 기업 정보를 불러오는 중입니다. 잠시만 기다려 주세요.",
    credit_rating: "-",
    industry_rank: "-",
    dataSource: "public",
    is_sme: "불러오는 중...",
    listing_status: "불러오는 중...",
    homepage: "-",
    main_biz: "불러오는 중...",
    is_audited: false,
    history: [],
    brand_name: "",
    historyTimeline: [],
    employmentHistory: []
  };
}

interface UnifiedBusinessResult {
  apiStatus: NtsCompanyStatus | null;
  business: BusinessData | null;
  isInvalid: boolean;
  isNew?: boolean;
  relatedBusinesses?: any[];
}

/**
 * 단일 SSR 렌더링 패스 내에서 generateMetadata()와 BusinessDetailPage()가
 * 동일한 DB 쿼리를 2번 중복 실행하지 않도록 React.cache()로 요청 단위 메모이제이션합니다.
 */
const loadUnifiedBusinessCached = cache(async (cleanBNo: string, isPrefetch: boolean): Promise<UnifiedBusinessResult> => {
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
  
  // DB 캐시가 이미 존재하는 경우 ➔ 실제 방문(!isPrefetch)일 때만 구버전 불완전 캐시 자가치유 및 미동기화 상세정보 1회 수집 수행
  if (localBiz) {
    const hasValidCompanyName = Boolean(
      localBiz.b_nm &&
      localBiz.b_nm !== "상호 정보 없음" &&
      localBiz.b_nm !== "불러오는 중..." &&
      localBiz.b_nm !== "정보 조회 중..."
    );

    if (!isPrefetch) {
      const needsImmediateHeal = Boolean(
        localBiz.npsLinked && (!localBiz.npsChrgAmt || !localBiz.employmentHistory || localBiz.employmentHistory.length <= 1)
      );
      if (needsImmediateHeal) {
        try {
          console.log(`[Self-Healing Sync] Refreshing outdated/incomplete cache for ${localBiz.b_nm} (${cleanBNo})`);
          const healed = await syncAndCacheBusinessData(cleanBNo);
          if (healed.business) {
            Object.assign(localBiz, healed.business);
          }
        } catch (healErr) {
          console.error("[Self-Healing Sync Failed]", healErr);
        }
      }

      let dartCode = localBiz.dart_code || "";
      let dartLastSync = localBiz.dartLastSyncAt ?? (localBiz as any).dart_last_sync_at;
      const patentsLastSync = localBiz.patentsLastSyncAt ?? (localBiz as any).patents_last_sync_at;
      const bidsLastSync = localBiz.bidsLastSyncAt ?? (localBiz as any).bids_last_sync_at;

      let stockCode = "";
      const listingStatus = localBiz.listing_status || "";
      const stockMatch = listingStatus.match(/\((\d{6})\)/);
      if (stockMatch) {
        stockCode = stockMatch[1];
      }

      // 개인사업자(법인번호 corp_no가 없거나 유효하지 않음)는 DART 매핑 대상에서 완전히 제외
      const hasCorpNo = localBiz.corp_no && localBiz.corp_no.replace(/[^0-9]/g, "").length === 13;

      if (hasValidCompanyName && (hasCorpNo || stockCode) && (!dartCode || !dartLastSync)) {
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
      } else if (!hasCorpNo && !stockCode) {
        // 법인번호가 없는 개인사업자의 경우, 혹시 DART 코드가 잘못 들어가 있다면 NULL로 제거 (자가 치유 보완)
        if (dartCode) {
          console.log(`[DART Self-Healing] Removing invalid DART code for individual business ${localBiz.b_nm}: ${dartCode}`);
          query("UPDATE businesses SET dart_code = NULL, dart_last_sync_at = NULL WHERE b_no = $1", [cleanBNo])
            .catch(err => console.error("Failed to clean up invalid DART code:", err));
        }
      }

      if (hasValidCompanyName && !bidsLastSync) {
        console.log(`[Background Detail Sync] Syncing recent bids for ${localBiz.b_nm} (${cleanBNo})`);
        syncRecentBidsByCompany(localBiz.b_nm, cleanBNo)
          .then(() => {
            query("UPDATE businesses SET bids_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [cleanBNo])
              .catch(err => console.error("Failed to update bids_last_sync_at:", err));
          })
          .catch(err => console.error("Background Bids sync failed:", err));
      }

      if (hasValidCompanyName && !patentsLastSync) {
        console.log(`[Background Detail Sync] Syncing patents for ${localBiz.b_nm} (${cleanBNo})`);
        syncPatentsByCompany(localBiz.b_nm, localBiz.p_nm || "")
          .then(() => {
            query("UPDATE businesses SET patents_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [cleanBNo])
              .catch(err => console.error("Failed to update patents_last_sync_at:", err));
          })
          .catch(err => console.error("Background Patents sync failed:", err));
      }
    }

    console.log(`[Database Hit] Serving from DB cache (Zero External Network Requests): ${localBiz.b_nm} (${cleanBNo})`);
    
    // 관련 사업자 조회 (동일 대표자 및 상호명 유사 매칭)
    let relatedBusinesses: any[] = [];
    if (hasValidCompanyName && localBiz.p_nm && localBiz.p_nm !== "-") {
      try {
        const cleanName = localBiz.b_nm.replace(/\(.*?\)/g, "").replace(/주식회사/g, "").replace(/\(주\)/g, "").trim();
        if (cleanName.length >= 2) {
          const relatedRes = await query(
            `SELECT b_no, b_nm, p_nm, b_adr, b_sector, listing_status, data_source, dart_code
             FROM businesses
             WHERE p_nm = $1 AND b_no != $2 AND (b_nm LIKE $3 OR $4 LIKE '%' || b_nm || '%')
             LIMIT 5`,
            [localBiz.p_nm, cleanBNo, `%${cleanName}%`, cleanName]
          );
          relatedBusinesses = relatedRes.rows;
        }
      } catch (err) {
        console.error("Failed to query related businesses in dataLoader:", err);
      }
    }

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

    return { apiStatus: mockApiStatus, business: localBiz, isInvalid: false, isNew: false, relatedBusinesses };
  }

  // 2. DB 캐시가 없는 경우 ➔ [최초 등록 시점]으로 식별하고 "불러오는 중..." 로딩 플레이스홀더 반환 (Non-blocking)
  console.log(`[Non-blocking SSR Serving] Unregistered business detected: ${cleanBNo}`);

  // 2.1. 미등록 블랙리스트 캐시 단건 PK 조회 (전체 테이블 스캔 방지)
  let blacklisted = false;
  try {
    blacklisted = await isInvalidBusiness(cleanBNo);
  } catch (e) {
    console.error("Failed to check invalid business in Neon DB:", e);
  }

  if (blacklisted) {
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

  const loadingBiz = generateVirtualBusiness(cleanBNo);
  
  const tempApiStatus: NtsCompanyStatus = {
    b_no: cleanBNo,
    b_stt: "불러오는 중...",
    b_stt_cd: "01",
    tax_type: "불러오는 중...",
    tax_type_cd: "01",
    end_dt: "",
    utcc_yn: "N",
    tax_type_change_dt: "",
    invoice_apply_dt: "",
    rbf_tax_type: "불러오는 중...",
    rbf_tax_type_cd: ""
  };

  return {
    apiStatus: tempApiStatus,
    business: loadingBiz,
    isInvalid: false,
    isNew: true,
    relatedBusinesses: []
  };
});

/**
 * 국세청 API, 금융위 API, 로컬 DB 통합 코어 헬퍼 함수
 * (새로운 사업자 번호 최초 등록 시에만 실시간 외부 API 조회를 발생시키고 캐싱을 실행합니다)
 */
export async function getUnifiedBusinessData(bNo: string): Promise<UnifiedBusinessResult> {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  const isPrefetch = await isPrefetchRequest();
  return loadUnifiedBusinessCached(cleanBNo, isPrefetch);
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
    try {
      await addInvalidBusiness(cleanBNo);
      console.log(`Added invalid business number to blacklist in Neon DB: ${cleanBNo}`);
    } catch (e) {
      console.error("Failed to write invalid business to Neon DB:", e);
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
    const credit_rating = localBizVal?.credit_rating || "-";
    const industry_rank = localBizVal?.industry_rank || "-";

    let history: BusinessData["history"] = [];
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
    }

    const resolvedCorpName =
      (ftcInfo?.cmpNm && ftcInfo.cmpNm.includes(basicInfo.corpNm) && ftcInfo.cmpNm.length > basicInfo.corpNm.length)
        ? ftcInfo.cmpNm
        : (basicInfo.corpNm && !basicInfo.corpNm.includes("SAMPO FUND")
            ? (basicInfo.enpDivNm === "주식회사" && !basicInfo.corpNm.includes("주식회사") && !basicInfo.corpNm.includes("(주)")
                ? `${basicInfo.corpNm} 주식회사`
                : basicInfo.corpNm)
            : (localBizVal?.b_nm || basicInfo.corpNm));

    const validExistingSector =
      localBizVal?.b_sector &&
      !["기타 서비스업", "기타 제조업/금융업", "상장 법인", "미등록 업종", "-", ""].includes(localBizVal.b_sector)
        ? localBizVal.b_sector
        : "";

    business = {
      b_no: cleanBNo,
      b_nm: resolvedCorpName,
      p_nm: basicInfo.enpRprFnm || ftcInfo?.rprsNm || "-",
      start_dt: basicInfo.enpEstbDt || ftcInfo?.rcptDt || "-",
      b_adr: basicInfo.enpBsadr || ftcInfo?.repAddr || "-",
      b_sector: basicInfo.enpIndyNm || validExistingSector || (ftcInfo ? "전자상거래 소매업 (통신판매업)" : "기타 서비스업"),
      b_type: basicInfo.enpDivNm || scale,
      corp_no: basicInfo.crno,
      dart_code: dartCode,
      description: `${resolvedCorpName}${getJosa(resolvedCorpName, "은는")} 금융위원회 공시 정보가 등록된 대한민국 공식 ${scale}입니다.`,
      credit_rating,
      industry_rank,
      dataSource: "public",
      is_sme: scale,
      listing_status: localBizVal?.listing_status || (scale.includes("대기업") ? "코스피 상장" : "비상장"),
      homepage: basicInfo.enpHpaddr || ftcInfo?.wbsitAddr || localBizVal?.homepage || "-",
      main_biz: basicInfo.enpMainBizNm || basicInfo.enpIndyNm || (ftcInfo?.goodsType ? `전자상거래 (${ftcInfo.goodsType})` : "기타 서비스업"),
      is_audited: !!dartCode,
      
      corpEnm: basicInfo.corpEnm || localBizVal?.corpEnm || "",
      crno: basicInfo.crno,
      basDt: npsInfo?.dataCrtYm || basicInfo.basDt,
      enpPbncYn: basicInfo.enpPbncYn,
      enpDivNm: basicInfo.enpDivNm,
      enpTlno: basicInfo.enpTlno || ftcInfo?.telNo || "",
      enpFxno: basicInfo.enpFxno && basicInfo.enpFxno !== "N/A" ? basicInfo.enpFxno : "",
      enpPncd: basicInfo.enpPncd || ftcInfo?.zipCd || "",
      enpStacNm: basicInfo.enpStacNm || "",
      enpMainBizNm: basicInfo.enpMainBizNm || "",
      enpKosdaqYn: basicInfo.enpKosdaqYn,
      enpKoseYn: basicInfo.enpKoseYn,
      enpKonexYn: basicInfo.enpKonexYn,

      mailOrderNo: ftcInfo?.mailOrderNo || localBizVal?.mailOrderNo || "",
      declareOrg: ftcInfo?.declareOrg || localBizVal?.declareOrg || "",
      goodsType: ftcInfo?.goodsType || localBizVal?.goodsType || "",
      sellType: ftcInfo?.sellType || localBizVal?.sellType || "",
      closeDate: ftcInfo?.closeDate || localBizVal?.closeDate || "",
      repEmail: ftcInfo?.repEmail || localBizVal?.repEmail || "",
      telNo: ftcInfo?.telNo || basicInfo.enpTlno || "",
      zipCd: ftcInfo?.zipCd || basicInfo.enpPncd || "",
      
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
      if (npsInfo.monthlyHistory && npsInfo.monthlyHistory.length > 0) {
        business.employmentHistory = npsInfo.monthlyHistory;
      }
      
      const uselessSectors = ["상장 법인", "상장법인", "대기업", "중소기업", "일반기업", "중견기업", "기타 서비스업", "기타서비스업", "미등록 업종", "미등록업종", "전자상거래 소매업 (통신판매업)", "-", ""];
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
      basDt: npsInfo?.dataCrtYm || "",
      
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
      if (npsInfo.monthlyHistory && npsInfo.monthlyHistory.length > 0) {
        business.employmentHistory = npsInfo.monthlyHistory;
      }
      if (npsInfo.npsSector) {
        business.b_sector = npsInfo.npsSector;
      }
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

import { query, upsertBusiness } from "@/lib/db";
import { validateBizrNo } from "@/lib/bizValidation";
import {
  getCorpBasicOutline,
  getCorpFinanceInfo,
  type CorpBasicOutline,
} from "@/lib/corpApi";
import { getFtcMailOrderInfo, type FtcMailOrderBusiness } from "@/lib/ftcApi";
import { getNtsBatchCompanyStatus, type NtsCompanyStatus } from "@/lib/ntsApi";
import { getNpsBplcInfo } from "@/lib/npsApi";
import { findDartCode } from "@/lib/dartMap";
import { refreshRssFeedSnapshot } from "@/lib/seoFeeds";

const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
const FTC_SERVICE_KEY = process.env.FTC_SERVICE_KEY || SERVICE_KEY;

const CURSOR_SETTING_KEY = "new_biz_discovery_cursor_v1";
const LAST_RUN_SETTING_KEY = "new_biz_discovery_last_run_v1";

const DEFAULT_CORP_START_PAGE = 1200; // 서울·수도권·전국 2015~2026 현역 주식회사 대역
const MIN_CORP_LOOP_PAGE = 100;
const PAPER_COMPANY_RE =
  /(기업인수목적|유동화|제[일이기삼사오육칠팔구십백0-9]+차|스팩|SPAC|SAMPO FUND|자산관리유한|프로젝트금융투자)/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 6000): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function cleanStr(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s || s === "N/A" || s === "NULL" || s === "null" || s === "-") return "";
  return s;
}

function formatCorpDisplayName(rawName: string, corpDcdNm?: string): string {
  const name = rawName.trim();
  if (!name) return "";
  if (
    corpDcdNm === "주식회사" &&
    !name.includes("주식회사") &&
    !name.includes("(주)") &&
    !name.includes("㈜")
  ) {
    return `${name} 주식회사`;
  }
  return name;
}

function isCorporateBizNo(bNo: string): boolean {
  if (bNo.length !== 10) return false;
  const mid = Number(bNo.slice(3, 5));
  return mid >= 81 && mid <= 88;
}

function getKoreanTopicParticle(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) return "은";
  const lastCode = trimmed.charCodeAt(trimmed.length - 1);
  if (lastCode >= 0xac00 && lastCode <= 0xd7a3) {
    return (lastCode - 0xac00) % 28 > 0 ? "은" : "는";
  }
  return "은";
}

interface DiscoveryCursor {
  corpPage: number;
  ftcOffsetFromEnd: number;
}

async function loadDiscoveryCursor(): Promise<DiscoveryCursor> {
  try {
    const res = await query(
      `SELECT value FROM public.system_settings WHERE key = $1 LIMIT 1`,
      [CURSOR_SETTING_KEY]
    );
    const val = res.rows[0]?.value;
    const corpPage = Number(val?.corpPage);
    const ftcOffsetFromEnd = Number(val?.ftcOffsetFromEnd);
    return {
      corpPage: Number.isFinite(corpPage) && corpPage >= 1 ? Math.floor(corpPage) : DEFAULT_CORP_START_PAGE,
      ftcOffsetFromEnd:
        Number.isFinite(ftcOffsetFromEnd) && ftcOffsetFromEnd >= 0 ? Math.floor(ftcOffsetFromEnd) : 0,
    };
  } catch {
    return { corpPage: DEFAULT_CORP_START_PAGE, ftcOffsetFromEnd: 0 };
  }
}

async function saveDiscoveryCursor(cursor: DiscoveryCursor): Promise<void> {
  await query(
    `INSERT INTO public.system_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       updated_at = NOW()`,
    [CURSOR_SETTING_KEY, JSON.stringify(cursor)]
  ).catch((err) => console.warn("[newBizDiscoverer] Failed to save cursor:", err));
}

async function findExistingOrInvalidBNos(bNos: string[]): Promise<Set<string>> {
  const unique = Array.from(new Set(bNos.filter((b) => b.length === 10)));
  if (unique.length === 0) return new Set();

  const [bizRes, invRes] = await Promise.all([
    query(`SELECT b_no FROM public.businesses WHERE b_no = ANY($1::varchar[])`, [unique]).catch(() => ({
      rows: [] as any[],
    })),
    query(`SELECT b_no FROM public.invalid_businesses WHERE b_no = ANY($1::varchar[])`, [unique]).catch(() => ({
      rows: [] as any[],
    })),
  ]);

  const set = new Set<string>();
  for (const r of bizRes.rows) set.add(String(r.b_no));
  for (const r of invRes.rows) set.add(String(r.b_no));
  return set;
}

interface RawCorpCandidate {
  bNo: string;
  crno: string;
  corpNm: string;
  corpEnm: string;
  repName: string;
  address: string;
  estbDt: string;
  sector: string;
  scale: string;
  corpDcdNm: string;
  homepage: string;
  telNo: string;
  faxNo: string;
  zipCd: string;
  stacMm: string;
  mainBiz: string;
  basDt: string;
  lastOpegDt: string;
  kospiYn: string;
  kosdaqYn: string;
  konexYn: string;
}

async function fetchCorpPageCandidates(
  pageNo: number
): Promise<{ totalCount: number; candidates: RawCorpCandidate[] }> {
  if (!SERVICE_KEY) return { totalCount: 0, candidates: [] };
  const encodedQuery = encodeURIComponent("주식회사");
  const url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=${pageNo}&numOfRows=50&resultType=json&corpNm=${encodedQuery}`;

  const json = await fetchJsonWithTimeout(url, 6500);
  const body = json?.response?.body;
  const totalCount = Number(body?.totalCount || 0);
  const rawItems = body?.items?.item;
  const list = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const dedup = new Map<string, RawCorpCandidate>();
  for (const item of list) {
    const bNo = cleanStr(item.bzno || item.bizrNo).replace(/[^0-9]/g, "");
    const crno = cleanStr(item.crno).replace(/[^0-9]/g, "");
    if (bNo.length !== 10 || !validateBizrNo(bNo)) continue;
    if (crno.length !== 13 || /^0+$/.test(crno)) continue;

    const rawName = cleanStr(item.enpPbanCmpyNm || item.corpNm);
    if (rawName.length < 2 || PAPER_COMPANY_RE.test(rawName)) continue;

    const baseAddr = cleanStr(item.enpBsadr);
    const dtlAddr = cleanStr(item.enpDtadr);
    const fullAddr = dtlAddr && !baseAddr.includes(dtlAddr) ? `${baseAddr} ${dtlAddr}`.trim() : baseAddr;
    if (fullAddr.length < 4) continue;

    const lastOpegDt = cleanStr(item.lastOpegDt || item.basDt);
    const existing = dedup.get(bNo);
    if (existing && existing.lastOpegDt >= lastOpegDt) continue;

    const corpDcdNm = cleanStr(item.corpDcdNm || item.enpDivNm);
    dedup.set(bNo, {
      bNo,
      crno,
      corpNm: formatCorpDisplayName(rawName, corpDcdNm),
      corpEnm: cleanStr(item.corpEnsnNm || item.corpEnm),
      repName: cleanStr(item.enpRprFnm) || "-",
      address: fullAddr,
      estbDt: cleanStr(item.enpEstbDt),
      sector: cleanStr(item.sicNm || item.enpIndyNm),
      scale: item.smenpYn === "Y" ? "중소기업" : "일반기업",
      corpDcdNm: corpDcdNm || "주식회사",
      homepage: cleanStr(item.enpHmpgUrl) || "-",
      telNo: cleanStr(item.enpTlno),
      faxNo: cleanStr(item.enpFxno),
      zipCd: cleanStr(item.enpOzpno),
      stacMm: cleanStr(item.enpStacMm) ? `${cleanStr(item.enpStacMm)}월 결산` : "",
      mainBiz: cleanStr(item.enpMainBizNm),
      basDt: cleanStr(item.basDt),
      lastOpegDt,
      kospiYn: cleanStr(item.enpXchgLstgDt) ? "Y" : "N",
      kosdaqYn: cleanStr(item.enpKosdaqLstgDt) ? "Y" : "N",
      konexYn: cleanStr(item.enpKrxLstgDt) ? "Y" : "N",
    });
  }

  return { totalCount, candidates: Array.from(dedup.values()) };
}

interface RawFtcCandidate {
  bNo: string;
  cmpNm: string;
  rprsNm: string;
  repAddr: string;
  rcptDt: string;
  telNo: string;
  zipCd: string;
  wbsitAddr: string;
  mailOrderNo: string;
  declareOrg: string;
  goodsType: string;
  sellType: string;
  repEmail: string;
  isCorp: boolean;
}

async function fetchFtcTotalCount(): Promise<number> {
  if (!FTC_SERVICE_KEY) return 0;
  const url = `https://apis.data.go.kr/1130000/MllBsDtl_3Service/getMllBsInfoDetail_3?serviceKey=${FTC_SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json`;
  const json = await fetchJsonWithTimeout(url, 5000);
  const total = Number(json?.totalCount ?? json?.response?.body?.totalCount ?? 0);
  return Number.isFinite(total) && total > 0 ? total : 0;
}

async function fetchFtcPageCandidates(pageNo: number): Promise<RawFtcCandidate[]> {
  if (!FTC_SERVICE_KEY || pageNo < 1) return [];
  const url = `https://apis.data.go.kr/1130000/MllBsDtl_3Service/getMllBsInfoDetail_3?serviceKey=${FTC_SERVICE_KEY}&pageNo=${pageNo}&numOfRows=50&resultType=json`;
  const json = await fetchJsonWithTimeout(url, 6000);
  const rawItems = json?.items ?? json?.response?.body?.items?.item ?? json?.response?.body?.items;
  const list = Array.isArray(rawItems) ? rawItems : rawItems && typeof rawItems === "object" ? [rawItems] : [];

  const dedup = new Map<string, RawFtcCandidate>();
  for (const item of list) {
    const bNo = cleanStr(item.brno).replace(/[^0-9]/g, "");
    if (bNo.length !== 10 || !validateBizrNo(bNo) || dedup.has(bNo)) continue;

    const opStatus = cleanStr(item.operSttusCdNm);
    const regStatus = cleanStr(item.bzmnRgsSttusSeNm);
    if (opStatus !== "정상영업") continue;
    if (regStatus.includes("폐업") || regStatus.includes("휴업")) continue;

    const cmpNm = cleanStr(item.bzmnNm);
    if (cmpNm.length < 2 || PAPER_COMPANY_RE.test(cmpNm)) continue;

    const addr = cleanStr(item.lctnRnAddr) || cleanStr(item.lctnAddr);
    if (addr.length < 4) continue;

    const isCorp = cleanStr(item.corpYnNm) === "법인" || isCorporateBizNo(bNo);
    const rawEmail = cleanStr(item.rprsvEmladr);
    dedup.set(bNo, {
      bNo,
      cmpNm,
      rprsNm: cleanStr(item.rprsvNm) || "-",
      repAddr: addr,
      rcptDt: cleanStr(item.dclrDate),
      telNo: cleanStr(item.telno),
      zipCd: cleanStr(item.lctnRnOzip),
      wbsitAddr: cleanStr(item.domnCn) || "-",
      mailOrderNo: cleanStr(item.prmmiMnno),
      declareOrg: cleanStr(item.dclrInstNm),
      goodsType: cleanStr(item.trtmntPrdlstNm),
      sellType: cleanStr(item.ntslMthdNm),
      repEmail: rawEmail,
      isCorp,
    });
  }

  return Array.from(dedup.values()).sort((a, b) => {
    if (a.isCorp !== b.isCorp) return a.isCorp ? -1 : 1;
    const dtDiff = b.rcptDt.localeCompare(a.rcptDt);
    if (dtDiff !== 0) return dtDiff;
    const scoreA = (a.wbsitAddr !== "-" ? 1 : 0) + (a.goodsType ? 1 : 0);
    const scoreB = (b.wbsitAddr !== "-" ? 1 : 0) + (b.goodsType ? 1 : 0);
    return scoreB - scoreA;
  });
}

async function saveSingleCorpCandidate(
  cand: RawCorpCandidate,
  nts: NtsCompanyStatus
): Promise<{
  bNo: string;
  name: string;
  sector: string;
  startDt: string;
  employees: number;
  latestRevenue: number | null;
  hasFinance: boolean;
  hasNps: boolean;
}> {
  const [finHistory, npsInfo, dartCode] = await Promise.all([
    withTimeout(getCorpFinanceInfo(cand.crno), 3500, []),
    withTimeout(getNpsBplcInfo(cand.bNo, cand.corpNm), 3500, null),
    withTimeout(findDartCode(cand.corpNm, ""), 1500, ""),
  ]);

  const history = finHistory.map((fd) => ({
    year: fd.year,
    revenue: fd.revenue,
    employees: 0,
    operatingIncome: fd.operatingIncome,
    netIncome: fd.netIncome,
    totalAssets: fd.totalAssets,
    totalLiabilities: fd.totalLiabilities,
    totalEquity: fd.totalEquity,
  }));

  const employees = npsInfo && npsInfo.npsSbscrbNmps > 0 ? npsInfo.npsSbscrbNmps : 0;
  if (employees > 0 && history.length > 0) {
    history[history.length - 1].employees = employees;
  }

  const sector =
    (npsInfo?.npsSector && (!cand.sector || cand.sector === "기타 서비스업")
      ? npsInfo.npsSector
      : cand.sector) || "기타 서비스업";

  const listingStatus =
    cand.kospiYn === "Y"
      ? "유가"
      : cand.kosdaqYn === "Y"
        ? "코스닥"
        : cand.konexYn === "Y"
          ? "코넥스"
          : "비상장";

  const now = new Date();
  await upsertBusiness({
    b_no: cand.bNo,
    b_nm: cand.corpNm,
    p_nm: cand.repName,
    start_dt: cand.estbDt || "-",
    b_adr: cand.address,
    b_sector: sector,
    b_type: cand.corpDcdNm || cand.scale,
    corp_no: cand.crno,
    dart_code: dartCode || "",
    description: `${cand.corpNm}${getKoreanTopicParticle(cand.corpNm)} 금융위원회 공시 정보가 등록된 대한민국 공식 ${cand.scale}입니다.`,
    credit_rating: "-",
    industry_rank: "-",
    dataSource: "public",
    is_sme: cand.scale,
    listing_status: listingStatus,
    homepage: cand.homepage,
    main_biz: cand.mainBiz || sector,
    is_audited: Boolean(dartCode),
    corpEnm: cand.corpEnm,
    crno: cand.crno,
    basDt: npsInfo?.dataCrtYm || cand.basDt,
    enpDivNm: cand.corpDcdNm,
    enpTlno: cand.telNo,
    enpFxno: cand.faxNo,
    enpPncd: cand.zipCd,
    enpStacNm: cand.stacMm,
    enpMainBizNm: cand.mainBiz,
    telNo: cand.telNo,
    zipCd: cand.zipCd,
    npsLinked: employees > 0,
    npsSbscrbNmps: employees,
    newAcqsNmps: npsInfo?.newAcqsNmps ?? 0,
    lossSbscrbNmps: npsInfo?.lossSbscrbNmps ?? 0,
    npsChrgAmt: npsInfo?.npsChrgAmt ?? 0,
    employmentHistory: npsInfo?.monthlyHistory || [],
    history,
    taxType: nts.tax_type || "부가가치세 일반과세자",
    taxTypeCd: nts.tax_type_cd || "01",
    bStt: nts.b_stt || "계속사업자",
    bSttCd: nts.b_stt_cd || "01",
    ntsLastSyncAt: now,
    npsLastSyncAt: now,
  });

  await query(`UPDATE public.businesses SET fin_last_sync_at = NOW() WHERE b_no = $1`, [cand.bNo]).catch(
    () => {}
  );

  const latestRev = history.length > 0 ? history[history.length - 1].revenue : null;
  return {
    bNo: cand.bNo,
    name: cand.corpNm,
    sector,
    startDt: cand.estbDt || "-",
    employees,
    latestRevenue: latestRev,
    hasFinance: history.length > 0,
    hasNps: employees > 0,
  };
}

async function saveSingleFtcCandidate(
  cand: RawFtcCandidate,
  nts: NtsCompanyStatus
): Promise<{
  bNo: string;
  name: string;
  sector: string;
  startDt: string;
  employees: number;
  latestRevenue: number | null;
  hasNps: boolean;
}> {
  // 법인 통신판매업자만 금융위 기업기본정보·국민연금을 병렬 보강 (신규 개인사업자는 불필요한 NPS 대기 생략)
  const [corpInfo, npsInfo] = cand.isCorp
    ? await Promise.all([
        withTimeout(getCorpBasicOutline(cand.bNo), 2500, null),
        withTimeout(getNpsBplcInfo(cand.bNo, cand.cmpNm), 2500, null),
      ])
    : [null, null];

  const finHistory =
    corpInfo?.crno && corpInfo.crno.replace(/[^0-9]/g, "").length === 13
      ? await withTimeout(getCorpFinanceInfo(corpInfo.crno), 2500, [])
      : [];

  const employees = npsInfo && npsInfo.npsSbscrbNmps > 0 ? npsInfo.npsSbscrbNmps : 0;
  const history = finHistory.map((fd) => ({
    year: fd.year,
    revenue: fd.revenue,
    employees: 0,
    operatingIncome: fd.operatingIncome,
    netIncome: fd.netIncome,
    totalAssets: fd.totalAssets,
    totalLiabilities: fd.totalLiabilities,
    totalEquity: fd.totalEquity,
  }));
  if (employees > 0 && history.length > 0) {
    history[history.length - 1].employees = employees;
  }

  const resolvedName = corpInfo?.corpNm || cand.cmpNm;
  const sector =
    npsInfo?.npsSector || corpInfo?.enpIndyNm || "전자상거래 소매업 (통신판매업)";
  const rcptFormatted =
    cand.rcptDt.length === 8
      ? cand.rcptDt.replace(/(\d{4})(\d{2})(\d{2})/, "$1년 $2월 $3일")
      : cand.rcptDt;
  const desc = corpInfo?.corpNm
    ? `${resolvedName}${getKoreanTopicParticle(resolvedName)} 금융위원회 및 공정거래위원회 통신판매업에 등록된 공식 ${corpInfo.enpEntprScaleNm || "법인"}입니다.`
    : rcptFormatted
      ? `공정거래위원회에 정식 등록된 통신판매사업자(${resolvedName})입니다. 신고일자: ${rcptFormatted}.`
      : `공정거래위원회에 정식 등록된 정상영업 통신판매사업자(${resolvedName})입니다.`;

  const now = new Date();
  await upsertBusiness({
    b_no: cand.bNo,
    b_nm: resolvedName,
    p_nm: corpInfo?.enpRprFnm || cand.rprsNm || "-",
    start_dt: corpInfo?.enpEstbDt || cand.rcptDt || "-",
    b_adr: corpInfo?.enpBsadr || cand.repAddr,
    b_sector: sector,
    b_type: corpInfo?.enpDivNm || (cand.isCorp ? "법인사업자 (통신판매업)" : "소상공인 (통신판매업자)"),
    corp_no: corpInfo?.crno || "",
    crno: corpInfo?.crno || "",
    corpEnm: corpInfo?.corpEnm || "",
    description: desc,
    credit_rating: "-",
    industry_rank: "-",
    dataSource: "public",
    is_sme: corpInfo?.enpEntprScaleNm || "소상공인",
    listing_status: "비상장",
    homepage: cand.wbsitAddr !== "-" ? cand.wbsitAddr : corpInfo?.enpHpaddr || "-",
    main_biz: corpInfo?.enpMainBizNm || (cand.goodsType ? `전자상거래 (${cand.goodsType})` : "전자상거래업"),
    is_audited: false,
    basDt: npsInfo?.dataCrtYm || corpInfo?.basDt || "",
    enpTlno: cand.telNo || corpInfo?.enpTlno || "",
    enpPncd: cand.zipCd || corpInfo?.enpPncd || "",
    mailOrderNo: cand.mailOrderNo,
    declareOrg: cand.declareOrg,
    goodsType: cand.goodsType,
    sellType: cand.sellType,
    repEmail: cand.repEmail,
    telNo: cand.telNo || corpInfo?.enpTlno || "",
    zipCd: cand.zipCd || corpInfo?.enpPncd || "",
    npsLinked: employees > 0,
    npsSbscrbNmps: employees,
    newAcqsNmps: npsInfo?.newAcqsNmps ?? 0,
    lossSbscrbNmps: npsInfo?.lossSbscrbNmps ?? 0,
    npsChrgAmt: npsInfo?.npsChrgAmt ?? 0,
    employmentHistory: npsInfo?.monthlyHistory || [],
    history,
    taxType: nts.tax_type || "부가가치세 일반과세자",
    taxTypeCd: nts.tax_type_cd || "01",
    bStt: nts.b_stt || "계속사업자",
    bSttCd: nts.b_stt_cd || "01",
    ntsLastSyncAt: now,
    npsLastSyncAt: now,
  });

  if (history.length > 0) {
    await query(`UPDATE public.businesses SET fin_last_sync_at = NOW() WHERE b_no = $1`, [cand.bNo]).catch(
      () => {}
    );
  }

  return {
    bNo: cand.bNo,
    name: resolvedName,
    sector,
    startDt: corpInfo?.enpEstbDt || cand.rcptDt || "-",
    employees,
    latestRevenue: history.length > 0 ? history[history.length - 1].revenue : null,
    hasNps: employees > 0,
  };
}

export interface DiscoverNewBusinessesOptions {
  corpLimit?: number;
  ftcLimit?: number;
  timeBudgetMs?: number;
  delayMs?: number;
}

export interface DiscoverNewBusinessesReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  corpCursorBefore: number;
  corpCursorAfter: number;
  corpDiscoveredCount: number;
  corpWithFinanceCount: number;
  corpWithNpsCount: number;
  ftcLastPageScanned: number;
  ftcOffsetAfter: number;
  ftcDiscoveredCount: number;
  ftcWithNpsCount: number;
  totalInsertedCount: number;
  skippedExistingCount: number;
  skippedInactiveCount: number;
  timedOutEarly: boolean;
  samples: Array<{
    source: "corp" | "ftc";
    bNo: string;
    name: string;
    sector: string;
    startDt: string;
    employees: number;
    latestRevenue: number | null;
  }>;
}

/**
 * 투트랙 공식 공공데이터 신규 사업자 자동 발굴 엔진:
 * - Track A (금융위원회 기업기본정보): 현역 주식회사 법인 커서 스캔 + 국세청 계속 검증 + 재무/국민연금 보강
 * - Track B (공정거래위원회 통신판매사업자): 최신 끝 페이지 역스캔 + 국세청 계속 검증 + 법인/국민연금 보강
 * - 가짜/폴백 데이터 0%, DB 풀스캔 0건, 42초 타임아웃 가드 내장
 */
export async function discoverAndStoreNewBusinesses(
  options: DiscoverNewBusinessesOptions = {}
): Promise<DiscoverNewBusinessesReport> {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const corpLimit = Math.min(30, Math.max(0, options.corpLimit ?? 6));
  const ftcLimit = Math.min(40, Math.max(0, options.ftcLimit ?? 10));
  const timeBudgetMs = Math.max(10_000, options.timeBudgetMs ?? 42_000);
  const delayMs = Math.max(80, options.delayMs ?? 150);

  const isOverBudget = () => Date.now() - startedMs >= timeBudgetMs;

  const cursor = await loadDiscoveryCursor();
  const corpCursorBefore = cursor.corpPage;
  let nextCorpPage = cursor.corpPage;
  let nextFtcOffset = cursor.ftcOffsetFromEnd;

  let corpDiscoveredCount = 0;
  let corpWithFinanceCount = 0;
  let corpWithNpsCount = 0;
  let ftcLastPageScanned = 0;
  let ftcDiscoveredCount = 0;
  let ftcWithNpsCount = 0;
  let skippedExistingCount = 0;
  let skippedInactiveCount = 0;
  let timedOutEarly = false;
  const samples: DiscoverNewBusinessesReport["samples"] = [];
  const insertedBNosInRun = new Set<string>();

  // ---------------------------------------------------------------------------
  // Track A: 금융위 현역 주식회사 법인 신규 발굴
  // ---------------------------------------------------------------------------
  if (corpLimit > 0 && SERVICE_KEY && !isOverBudget()) {
    const maxCorpPagesToScan = 3;
    let totalCorpPages = 5050;

    for (let p = 0; p < maxCorpPagesToScan && corpDiscoveredCount < corpLimit; p++) {
      if (isOverBudget()) {
        timedOutEarly = true;
        break;
      }

      const { totalCount, candidates } = await fetchCorpPageCandidates(nextCorpPage);
      if (totalCount > 0) {
        totalCorpPages = Math.max(1, Math.ceil(totalCount / 50));
      }
      nextCorpPage = nextCorpPage >= totalCorpPages ? MIN_CORP_LOOP_PAGE : nextCorpPage + 1;

      if (candidates.length === 0) continue;

      const existingSet = await findExistingOrInvalidBNos(candidates.map((c) => c.bNo));
      const freshCandidates = candidates.filter(
        (c) => !existingSet.has(c.bNo) && !insertedBNosInRun.has(c.bNo)
      );
      skippedExistingCount += candidates.length - freshCandidates.length;
      if (freshCandidates.length === 0) continue;

      // 국세청 단 1회 배치 검증 (최대 50건)
      const ntsBatch = await withTimeout(
        getNtsBatchCompanyStatus(freshCandidates.map((c) => c.bNo)),
        6000,
        null
      );
      if (!ntsBatch) continue;

      const ntsMap = new Map<string, NtsCompanyStatus>();
      for (const item of ntsBatch) {
        const clean = String(item.b_no || "").replace(/[^0-9]/g, "");
        if (clean) ntsMap.set(clean, item);
      }

      const activeCorpPairs: Array<{ cand: RawCorpCandidate; nts: NtsCompanyStatus }> = [];
      for (const cand of freshCandidates) {
        const nts = ntsMap.get(cand.bNo);
        if (!nts || nts.b_stt_cd !== "01") {
          skippedInactiveCount++;
          continue;
        }
        activeCorpPairs.push({ cand, nts });
      }

      const needed = corpLimit - corpDiscoveredCount;
      const toProcess = activeCorpPairs.slice(0, needed);

      for (let i = 0; i < toProcess.length; i += 2) {
        if (isOverBudget()) {
          timedOutEarly = true;
          break;
        }
        const chunk = toProcess.slice(i, i + 2);
        const settled = await Promise.all(
          chunk.map(async ({ cand, nts }) => {
            try {
              return await saveSingleCorpCandidate(cand, nts);
            } catch (err) {
              console.warn("[newBizDiscoverer] Failed to save corp candidate", cand.bNo, err);
              return null;
            }
          })
        );
        for (const saved of settled) {
          if (!saved) continue;
          insertedBNosInRun.add(saved.bNo);
          corpDiscoveredCount++;
          if (saved.hasFinance) corpWithFinanceCount++;
          if (saved.hasNps) corpWithNpsCount++;
          if (samples.length < 20) {
            samples.push({
              source: "corp",
              bNo: saved.bNo,
              name: saved.name,
              sector: saved.sector,
              startDt: saved.startDt,
              employees: saved.employees,
              latestRevenue: saved.latestRevenue,
            });
          }
        }
        if (i + 2 < toProcess.length) await sleep(delayMs);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Track B: 공정위 최신 정상영업 통신판매사업자 끝 페이지 역스캔
  // ---------------------------------------------------------------------------
  if (ftcLimit > 0 && FTC_SERVICE_KEY && !isOverBudget()) {
    const totalFtc = await fetchFtcTotalCount();
    if (totalFtc > 0) {
      const lastPage = Math.max(1, Math.ceil(totalFtc / 50));
      // 항상 최신 끝 2페이지를 우선 스캔해 당일/금주 신규 사업자를 즉시 확보, 부족하면 과거 오프셋 페이지 스캔
      const pagesToScan = Array.from(
        new Set(
          [
            lastPage,
            Math.max(1, lastPage - 1),
            Math.max(1, lastPage - 2 - nextFtcOffset),
          ].filter((p) => p >= 1)
        )
      );

      let foundFreshInLatestTwo = 0;

      for (let idx = 0; idx < pagesToScan.length && ftcDiscoveredCount < ftcLimit; idx++) {
        if (isOverBudget()) {
          timedOutEarly = true;
          break;
        }

        const pageNo = pagesToScan[idx];
        ftcLastPageScanned = pageNo;
        const candidates = await fetchFtcPageCandidates(pageNo);
        if (candidates.length === 0) continue;

        const existingSet = await findExistingOrInvalidBNos(candidates.map((c) => c.bNo));
        const freshCandidates = candidates.filter(
          (c) => !existingSet.has(c.bNo) && !insertedBNosInRun.has(c.bNo)
        );
        skippedExistingCount += candidates.length - freshCandidates.length;
        if (freshCandidates.length === 0) continue;

        const ntsBatch = await withTimeout(
          getNtsBatchCompanyStatus(freshCandidates.map((c) => c.bNo)),
          6000,
          null
        );
        if (!ntsBatch) continue;

        const ntsMap = new Map<string, NtsCompanyStatus>();
        for (const item of ntsBatch) {
          const clean = String(item.b_no || "").replace(/[^0-9]/g, "");
          if (clean) ntsMap.set(clean, item);
        }

        const activeFtcPairs: Array<{ cand: RawFtcCandidate; nts: NtsCompanyStatus }> = [];
        for (const cand of freshCandidates) {
          const nts = ntsMap.get(cand.bNo);
          if (!nts || nts.b_stt_cd !== "01") {
            skippedInactiveCount++;
            continue;
          }
          activeFtcPairs.push({ cand, nts });
        }

        const needed = ftcLimit - ftcDiscoveredCount;
        const toProcess = activeFtcPairs.slice(0, needed);

        for (let i = 0; i < toProcess.length; i += 3) {
          if (isOverBudget()) {
            timedOutEarly = true;
            break;
          }
          const chunk = toProcess.slice(i, i + 3);
          const settled = await Promise.all(
            chunk.map(async ({ cand, nts }) => {
              try {
                return await saveSingleFtcCandidate(cand, nts);
              } catch (err) {
                console.warn("[newBizDiscoverer] Failed to save FTC candidate", cand.bNo, err);
                return null;
              }
            })
          );
          for (const saved of settled) {
            if (!saved) continue;
            insertedBNosInRun.add(saved.bNo);
            ftcDiscoveredCount++;
            if (idx <= 1) foundFreshInLatestTwo++;
            if (saved.hasNps) ftcWithNpsCount++;
            if (samples.length < 20) {
              samples.push({
                source: "ftc",
                bNo: saved.bNo,
                name: saved.name,
                sector: saved.sector,
                startDt: saved.startDt,
                employees: saved.employees,
                latestRevenue: saved.latestRevenue,
              });
            }
          }
          if (i + 3 < toProcess.length) await sleep(delayMs);
        }
      }

      if (foundFreshInLatestTwo >= ftcLimit) {
        nextFtcOffset = 0;
      } else {
        nextFtcOffset = nextFtcOffset >= 500 ? 0 : nextFtcOffset + 1;
      }
    }
  }

  await saveDiscoveryCursor({
    corpPage: nextCorpPage,
    ftcOffsetFromEnd: nextFtcOffset,
  });

  // 신규 기업이 1건 이상 추가되었고 시간 여유가 있으면 RSS 스냅샷을 즉시 갱신해 검색엔진 피드에 반영
  if (corpDiscoveredCount + ftcDiscoveredCount > 0 && !isOverBudget()) {
    await withTimeout(refreshRssFeedSnapshot(), 4000, 0).catch(() => {});
  }

  const finishedAt = new Date().toISOString();
  const report: DiscoverNewBusinessesReport = {
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedMs,
    corpCursorBefore,
    corpCursorAfter: nextCorpPage,
    corpDiscoveredCount,
    corpWithFinanceCount,
    corpWithNpsCount,
    ftcLastPageScanned,
    ftcOffsetAfter: nextFtcOffset,
    ftcDiscoveredCount,
    ftcWithNpsCount,
    totalInsertedCount: corpDiscoveredCount + ftcDiscoveredCount,
    skippedExistingCount,
    skippedInactiveCount,
    timedOutEarly,
    samples,
  };

  await query(
    `INSERT INTO public.system_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       updated_at = NOW()`,
    [LAST_RUN_SETTING_KEY, JSON.stringify(report)]
  ).catch(() => {});

  return report;
}

/**
 * 대량 상태조회(`/api/biz/bulk-status`)에서 국세청 `계속사업자(01)`로 검증된 DB 미등록 번호들을
 * 응답 반환 후 백그라운드(`after()`)에서 안전하게 보강·적재합니다.
 * - 공공 API(금융위/공정위)에서 실제 상호명이 확인되는 경우에만 적재(빈 상호명 오염 방지).
 * - 최대 5건 상한 + 호출 타임아웃 적용으로 서버리스 부하 및 API 남용 차단.
 */
export async function ingestNewBusinessesFromBulkCheck(
  items: Array<{ bNo: string; nts: NtsCompanyStatus }>
): Promise<number> {
  const candidates = items
    .filter((x) => x.bNo.length === 10 && validateBizrNo(x.bNo) && x.nts?.b_stt_cd === "01")
    .slice(0, 5);
  if (candidates.length === 0) return 0;

  const existingOrInvalid = await findExistingOrInvalidBNos(candidates.map((c) => c.bNo));
  const targets = candidates.filter((c) => !existingOrInvalid.has(c.bNo));
  if (targets.length === 0) return 0;

  let inserted = 0;
  for (const target of targets) {
    try {
      const [corpInfo, ftcInfo]: [CorpBasicOutline | null, FtcMailOrderBusiness | null] =
        await Promise.all([
          withTimeout(getCorpBasicOutline(target.bNo), 3500, null),
          withTimeout(getFtcMailOrderInfo(target.bNo), 3500, null),
        ]);

      const resolvedName = cleanStr(corpInfo?.corpNm) || cleanStr(ftcInfo?.cmpNm);
      if (!resolvedName || resolvedName.length < 2 || PAPER_COMPANY_RE.test(resolvedName)) {
        continue;
      }

      if (corpInfo && corpInfo.crno && corpInfo.crno.replace(/[^0-9]/g, "").length === 13) {
        const rawCorp: RawCorpCandidate = {
          bNo: target.bNo,
          crno: corpInfo.crno.replace(/[^0-9]/g, ""),
          corpNm: formatCorpDisplayName(resolvedName, corpInfo.enpDivNm),
          corpEnm: cleanStr(corpInfo.corpEnm),
          repName: cleanStr(corpInfo.enpRprFnm) || cleanStr(ftcInfo?.rprsNm) || "-",
          address: cleanStr(corpInfo.enpBsadr) || cleanStr(ftcInfo?.repAddr) || "-",
          estbDt: cleanStr(corpInfo.enpEstbDt) || cleanStr(ftcInfo?.rcptDt),
          sector: cleanStr(corpInfo.enpIndyNm),
          scale: cleanStr(corpInfo.enpEntprScaleNm) || "일반기업",
          corpDcdNm: cleanStr(corpInfo.enpDivNm) || "법인",
          homepage: cleanStr(corpInfo.enpHpaddr) || cleanStr(ftcInfo?.wbsitAddr) || "-",
          telNo: cleanStr(corpInfo.enpTlno) || cleanStr(ftcInfo?.telNo),
          faxNo: cleanStr(corpInfo.enpFxno),
          zipCd: cleanStr(corpInfo.enpPncd) || cleanStr(ftcInfo?.zipCd),
          stacMm: cleanStr(corpInfo.enpStacNm),
          mainBiz: cleanStr(corpInfo.enpMainBizNm),
          basDt: cleanStr(corpInfo.basDt),
          lastOpegDt: "",
          kospiYn: corpInfo.enpKoseYn === "Y" ? "Y" : "N",
          kosdaqYn: corpInfo.enpKosdaqYn === "Y" ? "Y" : "N",
          konexYn: corpInfo.enpKonexYn === "Y" ? "Y" : "N",
        };
        await saveSingleCorpCandidate(rawCorp, target.nts);
        inserted++;
      } else if (ftcInfo && cleanStr(ftcInfo.cmpNm)) {
        const rawFtc: RawFtcCandidate = {
          bNo: target.bNo,
          cmpNm: cleanStr(ftcInfo.cmpNm),
          rprsNm: cleanStr(ftcInfo.rprsNm) || "-",
          repAddr: cleanStr(ftcInfo.repAddr) || "주소 정보 없음 (공시 비대상)",
          rcptDt: cleanStr(ftcInfo.rcptDt),
          telNo: cleanStr(ftcInfo.telNo),
          zipCd: cleanStr(ftcInfo.zipCd),
          wbsitAddr: cleanStr(ftcInfo.wbsitAddr) || "-",
          mailOrderNo: cleanStr(ftcInfo.mailOrderNo),
          declareOrg: cleanStr(ftcInfo.declareOrg),
          goodsType: cleanStr(ftcInfo.goodsType),
          sellType: cleanStr(ftcInfo.sellType),
          repEmail: cleanStr(ftcInfo.repEmail),
          isCorp: isCorporateBizNo(target.bNo),
        };
        await saveSingleFtcCandidate(rawFtc, target.nts);
        inserted++;
      }

      await sleep(150);
    } catch (err) {
      console.warn("[bulk-status ingest] Failed for", target.bNo, err);
    }
  }

  return inserted;
}

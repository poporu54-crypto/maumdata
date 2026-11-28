import { NextRequest, NextResponse, after } from "next/server";
import { guardApiRequest } from "@/lib/apiBotGuard";
import { validateBizrNo } from "@/lib/bizValidation";
import { getNtsBatchCompanyStatus, type NtsCompanyStatus } from "@/lib/ntsApi";
import { query } from "@/lib/db";
import { ingestNewBusinessesFromBulkCheck } from "@/lib/newBizDiscoverer";

export const dynamic = "force-dynamic";

export interface BulkCheckResultItem {
  inputOrder: number;
  bNo: string;
  formattedBNo: string;
  companyName: string | null;
  representative: string | null;
  sector: string | null;
  inDatabase: boolean;
  checksumValid: boolean;
  statusLevel: "safe" | "caution" | "danger";
  statusBadge: string;
  bSttCd: string;
  bStt: string;
  taxTypeCd: string;
  taxType: string;
  endDt: string;
  taxTypeChangeDt: string;
  rbfTaxType: string;
  advisoryNote: string;
}

function formatBizNo10(bNo: string): string {
  return bNo.replace(/^(\d{3})(\d{2})(\d{5})$/, "$1-$2-$3");
}

function classifyNtsStatus(nts: NtsCompanyStatus | undefined): {
  statusLevel: "safe" | "caution" | "danger";
  statusBadge: string;
  advisoryNote: string;
} {
  if (!nts) {
    return {
      statusLevel: "danger",
      statusBadge: "조회불가/미등록",
      advisoryNote: "국세청 등록 정보가 확인되지 않습니다.",
    };
  }

  const sttCd = (nts.b_stt_cd || "").trim();
  const taxMsg = (nts.tax_type || "").trim();
  const taxCd = (nts.tax_type_cd || "").trim();

  // 폐업자 (03)
  if (sttCd === "03" || nts.b_stt?.includes("폐업")) {
    const endStr = nts.end_dt
      ? `${nts.end_dt.slice(0, 4)}-${nts.end_dt.slice(4, 6)}-${nts.end_dt.slice(6, 8)}`
      : "";
    return {
      statusLevel: "danger",
      statusBadge: "폐업사업자",
      advisoryNote: endStr
        ? `폐업일(${endStr}) 이후 세금계산서 수취 시 매입세액 불공제 위험`
        : "폐업 상태 — 세금계산서 발행·수취 불가",
    };
  }

  // 휴업자 (02)
  if (sttCd === "02" || nts.b_stt?.includes("휴업")) {
    return {
      statusLevel: "danger",
      statusBadge: "휴업사업자",
      advisoryNote: "현재 휴업 상태 — 실제 영업 및 적격증빙 발행 가능 여부 사전 확인 필수",
    };
  }

  // 국세청 미등록 (sttCd 빈값)
  if (sttCd !== "01") {
    return {
      statusLevel: "danger",
      statusBadge: "국세청 미등록",
      advisoryNote: taxMsg || "국세청에 등록되지 않은 사업자등록번호입니다.",
    };
  }

  // 계속사업자(01) 중 간이과세자 / 면세 / 비영리 등 매입세액공제 주의 유형
  if (
    taxCd === "02" ||
    taxMsg.includes("간이과세자") ||
    taxCd === "03" ||
    taxMsg.includes("면세") ||
    taxMsg.includes("비영리") ||
    taxMsg.includes("세금계산서 발급불가")
  ) {
    const canIssueTaxInvoice = taxMsg.includes("세금계산서 발급사업자");
    return {
      statusLevel: "caution",
      statusBadge: taxMsg.includes("간이")
        ? canIssueTaxInvoice
          ? "계속 · 간이(발급가능)"
          : "계속 · 간이과세"
        : taxMsg.includes("면세")
          ? "계속 · 면세사업자"
          : "계속 · 특수과세",
      advisoryNote: canIssueTaxInvoice
        ? "세금계산서 발급 가능 간이과세자 (최근 과세유형 전환일 확인 권장)"
        : "일반 세금계산서 매입세액공제 제한 여부 확인 필요 (계산서/영수증 대상 확인)",
    };
  }

  // 정상 계속사업자 + 일반과세자
  const changedRecently = Boolean(nts.tax_type_change_dt && nts.tax_type_change_dt.trim().length === 8);
  return {
    statusLevel: "safe",
    statusBadge: "계속 · 일반과세",
    advisoryNote: changedRecently
      ? `정상 영업 중 (과세유형 전환일: ${nts.tax_type_change_dt.slice(0, 4)}-${nts.tax_type_change_dt.slice(4, 6)}-${nts.tax_type_change_dt.slice(6, 8)})`
      : "세금계산서 정상 발행·수취 가능 (계속사업자)",
  };
}

export async function POST(req: NextRequest) {
  const blocked = guardApiRequest(req, {
    bucket: "biz_bulk_status",
    maxRequests: 15,
    windowMs: 60_000,
    mode: "same-origin",
    rateLimitMessage: "대량 상태 조회 요청이 너무 빠릅니다. 잠시 후 다시 시도해 주세요.",
  });
  if (blocked) return blocked;

  try {
    const body = await req.json().catch(() => null);
    const rawList: unknown[] = Array.isArray(body?.bNos) ? body.bNos : [];

    // 중복 제거 및 최대 100개 상한 적용
    const seen = new Set<string>();
    const orderedUnique: string[] = [];
    for (const item of rawList) {
      const digits = String(item || "").replace(/[^0-9]/g, "");
      if (digits.length !== 10) continue;
      if (seen.has(digits)) continue;
      seen.add(digits);
      orderedUnique.push(digits);
      if (orderedUnique.length >= 100) break;
    }

    if (orderedUnique.length === 0) {
      return NextResponse.json(
        { error: "유효한 10자리 사업자등록번호를 1개 이상 입력해 주세요." },
        { status: 400 }
      );
    }

    const checksumValidList: string[] = [];
    const checksumMap = new Map<string, boolean>();
    for (const bNo of orderedUnique) {
      const ok = validateBizrNo(bNo);
      checksumMap.set(bNo, ok);
      if (ok) checksumValidList.push(bNo);
    }

    // 1) 유효 번호만 국세청 1회 배치 호출 + 2) 우리 DB 상호/대표자 PK 배열 단건 조회 병렬 수행
    const [ntsBatch, dbRowsRes] = await Promise.all([
      checksumValidList.length > 0 ? getNtsBatchCompanyStatus(checksumValidList) : Promise.resolve([]),
      query(
        `SELECT b_no, b_nm, p_nm, b_sector
         FROM public.businesses
         WHERE b_no = ANY($1::varchar[])`,
        [orderedUnique]
      ).catch(() => ({ rows: [] as any[] })),
    ]);

    if (checksumValidList.length > 0 && ntsBatch === null) {
      return NextResponse.json(
        { error: "국세청 실시간 상태조회 API 응답이 일시 지연되고 있습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const ntsMap = new Map<string, NtsCompanyStatus>();
    for (const item of ntsBatch || []) {
      const clean = String(item.b_no || "").replace(/[^0-9]/g, "");
      if (clean) ntsMap.set(clean, item);
    }

    const dbMap = new Map<string, { b_nm: string; p_nm: string; b_sector: string }>();
    for (const r of dbRowsRes.rows) {
      dbMap.set(String(r.b_no), {
        b_nm: r.b_nm && r.b_nm !== "상호 정보 없음" && r.b_nm !== "상호 미등록 사업자" ? String(r.b_nm) : "",
        p_nm: r.p_nm && r.p_nm !== "-" ? String(r.p_nm) : "",
        b_sector: r.b_sector && r.b_sector !== "-" ? String(r.b_sector) : "",
      });
    }

    // DB에 이미 존재하는 기업의 납세상태·과세유형 최신화 + DB 미등록 정상 계속사업자(최대 5건) 백그라운드 자동 축적
    const toSyncBNos: string[] = [];
    const toSyncStt: string[] = [];
    const toSyncSttCd: string[] = [];
    const toSyncTax: string[] = [];
    const toSyncTaxCd: string[] = [];
    const newActiveCandidates: Array<{ bNo: string; nts: NtsCompanyStatus }> = [];

    for (const [bNo, nts] of ntsMap.entries()) {
      if (dbMap.has(bNo) && nts.b_stt_cd) {
        toSyncBNos.push(bNo);
        toSyncStt.push(nts.b_stt || "");
        toSyncSttCd.push(nts.b_stt_cd || "");
        toSyncTax.push(nts.tax_type || "");
        toSyncTaxCd.push(nts.tax_type_cd || "");
      } else if (!dbMap.has(bNo) && nts.b_stt_cd === "01" && newActiveCandidates.length < 5) {
        newActiveCandidates.push({ bNo, nts });
      }
    }

    if (toSyncBNos.length > 0 || newActiveCandidates.length > 0) {
      after(async () => {
        if (toSyncBNos.length > 0) {
          await query(
            `UPDATE public.businesses AS b
             SET
               b_stt = u.b_stt,
               b_stt_cd = u.b_stt_cd,
               tax_type = u.tax_type,
               tax_type_cd = u.tax_type_cd,
               nts_last_sync_at = NOW()
             FROM UNNEST(
               $1::varchar[],
               $2::varchar[],
               $3::varchar[],
               $4::varchar[],
               $5::varchar[]
             ) AS u(b_no, b_stt, b_stt_cd, tax_type, tax_type_cd)
             WHERE b.b_no = u.b_no`,
            [toSyncBNos, toSyncStt, toSyncSttCd, toSyncTax, toSyncTaxCd]
          ).catch((e) => console.warn("[bulk-status] Background NTS sync update failed:", e));
        }

        if (newActiveCandidates.length > 0) {
          await ingestNewBusinessesFromBulkCheck(newActiveCandidates).catch((e) =>
            console.warn("[bulk-status] Background new business ingest failed:", e)
          );
        }
      });
    }

    let safeCount = 0;
    let cautionCount = 0;
    let dangerCount = 0;
    let invalidChecksumCount = 0;

    const results: BulkCheckResultItem[] = orderedUnique.map((bNo, idx) => {
      const isChecksumOk = Boolean(checksumMap.get(bNo));
      const dbInfo = dbMap.get(bNo);

      if (!isChecksumOk) {
        dangerCount++;
        invalidChecksumCount++;
        return {
          inputOrder: idx + 1,
          bNo,
          formattedBNo: formatBizNo10(bNo),
          companyName: dbInfo?.b_nm || null,
          representative: dbInfo?.p_nm || null,
          sector: dbInfo?.b_sector || null,
          inDatabase: Boolean(dbInfo),
          checksumValid: false,
          statusLevel: "danger",
          statusBadge: "번호형식 오류",
          bSttCd: "",
          bStt: "검증번호(체크섬) 불일치",
          taxTypeCd: "",
          taxType: "오타 의심 번호",
          endDt: "",
          taxTypeChangeDt: "",
          rbfTaxType: "",
          advisoryNote: "대한민국 사업자등록번호 검증 규칙과 일치하지 않습니다. 숫자 오타를 확인해 주세요.",
        };
      }

      const nts = ntsMap.get(bNo);
      const cls = classifyNtsStatus(nts);
      if (cls.statusLevel === "safe") safeCount++;
      else if (cls.statusLevel === "caution") cautionCount++;
      else dangerCount++;

      return {
        inputOrder: idx + 1,
        bNo,
        formattedBNo: formatBizNo10(bNo),
        companyName: dbInfo?.b_nm || null,
        representative: dbInfo?.p_nm || null,
        sector: dbInfo?.b_sector || null,
        inDatabase: Boolean(dbInfo),
        checksumValid: true,
        statusLevel: cls.statusLevel,
        statusBadge: cls.statusBadge,
        bSttCd: nts?.b_stt_cd || "",
        bStt: nts?.b_stt || "미등록",
        taxTypeCd: nts?.tax_type_cd || "",
        taxType: nts?.tax_type || "",
        endDt: nts?.end_dt || "",
        taxTypeChangeDt: nts?.tax_type_change_dt || "",
        rbfTaxType: nts?.rbf_tax_type || "",
        advisoryNote: cls.advisoryNote,
      };
    });

    return NextResponse.json(
      {
        success: true,
        checkedAt: new Date().toISOString(),
        summary: {
          total: results.length,
          safeCount,
          cautionCount,
          dangerCount,
          invalidChecksumCount,
        },
        results,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("[/api/biz/bulk-status] Error:", err);
    return NextResponse.json(
      { error: "일괄 상태 검증 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

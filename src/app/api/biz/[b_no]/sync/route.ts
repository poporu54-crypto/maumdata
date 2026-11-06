import { NextRequest, NextResponse } from "next/server";
import { getLocalBusiness, syncAndCacheBusinessData } from "@/app/biz/[b_no]/utils/dataLoader";
import { validateBizrNo } from "@/lib/bizValidation";
import { guardApiRequest } from "@/lib/apiBotGuard";

export const dynamic = "force-dynamic";

const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10분

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ b_no: string }> }
) {
  let cleanBNo = "";
  try {
    const blocked = guardApiRequest(request, {
      bucket: "biz_sync",
      maxRequests: 10,
      windowMs: 60_000,
      mode: "same-origin",
      rateLimitMessage: "동기화 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
    });
    if (blocked) return blocked;

    const resolvedParams = await params;
    const bNo = resolvedParams?.b_no || "";
    cleanBNo = bNo.replace(/[^0-9]/g, "");

    if (cleanBNo.length !== 10 || !validateBizrNo(cleanBNo)) {
      return NextResponse.json(
        { error: "올바르지 않은 사업자등록번호 형식입니다." },
        { status: 400 }
      );
    }

    // 최근 10분 이내에 이미 국세청/공공 API 동기화가 완료된 기업이면 외부 API 재호출 없이 캐시 반환
    const existingBiz = await getLocalBusiness(cleanBNo);
    const rawLastSync = existingBiz?.ntsLastSyncAt ?? (existingBiz as any)?.nts_last_sync_at;
    if (existingBiz && rawLastSync) {
      const lastSyncMs = new Date(rawLastSync).getTime();
      if (!Number.isNaN(lastSyncMs) && Date.now() - lastSyncMs < SYNC_COOLDOWN_MS) {
        return NextResponse.json({
          success: true,
          cached: true,
          isInvalid: false,
          message: "최근 동기화된 최신 기업 정보를 유지합니다.",
          data: {
            b_nm: existingBiz.b_nm,
            b_adr: existingBiz.b_adr,
            b_sector: existingBiz.b_sector
          }
        });
      }
    }

    console.log(`[Async Sync API] Starting sync for business: ${cleanBNo}`);

    // 실시간 API 연동 및 DB 캐시 저장 실행
    const { business, isInvalid } = await syncAndCacheBusinessData(cleanBNo);

    if (isInvalid) {
      console.log(`[Async Sync API] Invalid business number: ${cleanBNo}`);
      return NextResponse.json({
        success: true,
        isInvalid: true,
        message: "국세청에 등록되지 않은 사업자등록번호입니다."
      });
    }

    console.log(`[Async Sync API] Successfully synced and cached: ${business?.b_nm || cleanBNo}`);

    return NextResponse.json({
      success: true,
      isInvalid: false,
      message: "성공적으로 기업 실시간 정보 동기화가 완료되었습니다.",
      data: {
        b_nm: business?.b_nm,
        b_adr: business?.b_adr,
        b_sector: business?.b_sector
      }
    });

  } catch (error: unknown) {
    console.error(`[Async Sync API] Error during syncing ${cleanBNo || "unknown"}:`, error);
    return NextResponse.json(
      { error: "실시간 정보 동기화 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

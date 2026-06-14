import { NextRequest, NextResponse } from "next/server";
import { syncAndCacheBusinessData } from "@/app/biz/[b_no]/utils/dataLoader";
import { validateBizrNo } from "@/lib/bizValidation";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const bNo = resolvedParams.b_no;
    const cleanBNo = bNo.replace(/[^0-9]/g, "");

    if (cleanBNo.length !== 10 || !validateBizrNo(cleanBNo)) {
      return NextResponse.json(
        { error: "올바르지 않은 사업자등록번호 형식입니다." },
        { status: 400 }
      );
    }

    console.log(`[Async Sync API] Starting sync for business: ${cleanBNo}`);

    // 실시간 API 연동 및 DB 캐시 저장 실행
    const { apiStatus, business, isInvalid } = await syncAndCacheBusinessData(cleanBNo);

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

  } catch (error: any) {
    const resolvedParams = await params;
    console.error(`[Async Sync API] Error during syncing ${resolvedParams.b_no}:`, error);
    return NextResponse.json(
      { error: "실시간 정보 동기화 중 서버 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}

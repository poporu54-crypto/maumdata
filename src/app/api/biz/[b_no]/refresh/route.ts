import { NextRequest, NextResponse } from "next/server";
import { getNtsCompanyStatus } from "@/lib/ntsApi";
import { getNpsBplcInfo } from "@/lib/npsApi";
import { getBusinessByBNo, upsertBusiness, query } from "@/lib/db";
import { validateBizrNo } from "@/lib/bizValidation";
import { getCorpBasicOutline } from "@/lib/corpApi";
import { getFtcMailOrderInfo } from "@/lib/ftcApi";

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

    console.log(`[On-Demand Refresh] Triggered for business: ${cleanBNo}`);

    // 1. 국세청 실시간 상태 조회
    const ntsStatus = await getNtsCompanyStatus(cleanBNo);
    if (!ntsStatus || ntsStatus.tax_type === "국세청에 등록되지 않은 사업자등록번호입니다") {
      return NextResponse.json(
        { error: "국세청 등록 정보를 확인할 수 없습니다. 유효하지 않은 사업자 번호일 수 있습니다." },
        { status: 404 }
      );
    }

    // 2. 기존 로컬 DB 정보 확인
    let dbBiz = await getBusinessByBNo(cleanBNo);
    
    // 만약 로컬 DB에 아직 없는 기업인 경우, 기본 수집을 실행하여 기초 정보를 마련한다.
    if (!dbBiz) {
      console.log(`[On-Demand Refresh] Business ${cleanBNo} not in DB. Fetching public info first.`);
      const basicInfo = await getCorpBasicOutline(cleanBNo, undefined);
      const ftcInfo = await getFtcMailOrderInfo(cleanBNo);
      
      const newBiz: any = {
        b_no: cleanBNo,
        b_nm: basicInfo?.corpNm || ftcInfo?.cmpNm || "상호 정보 없음",
        p_nm: basicInfo?.enpRprFnm || ftcInfo?.rprsNm || "-",
        start_dt: basicInfo?.enpEstbDt || ftcInfo?.rcptDt || "-",
        b_adr: basicInfo?.enpBsadr || ftcInfo?.repAddr || "주소 정보 없음 (공시 비대상)",
        b_sector: basicInfo?.enpIndyNm || (ftcInfo ? "전자상거래 소매업 (통신판매업)" : "미등록 업종"),
        b_type: basicInfo?.enpEntprScaleNm || (ftcInfo ? "소상공인 (통신판매업자)" : "소상공인/개인사업자"),
        corp_no: basicInfo?.crno || "",
        description: basicInfo?.corpNm 
          ? `${basicInfo.corpNm}은(는) 금융위원회 공시 정보가 등록된 기업입니다.`
          : `국세청 실시간 계속사업자 상태가 검증되었으나 상호명이 등록되지 않은 개인 사업자등록번호(${cleanBNo})입니다.`,
        credit_rating: "-",
        industry_rank: "-",
        is_sme: basicInfo?.enpEntprScaleNm || "소상공인",
        listing_status: basicInfo?.enpEntprScaleNm?.includes("대기업") ? "코스피 상장" : "비상장",
        homepage: basicInfo?.enpHpaddr || ftcInfo?.wbsitAddr || "-",
        main_biz: basicInfo?.enpMainBizNm || basicInfo?.enpIndyNm || "-",
        is_audited: false,
        taxType: ntsStatus.tax_type,
        taxTypeCd: ntsStatus.tax_type_cd,
        ntsLastSyncAt: new Date(),
        npsLastSyncAt: new Date(),
        history: [],
        historyTimeline: []
      };
      
      await upsertBusiness(newBiz);
      dbBiz = await getBusinessByBNo(cleanBNo);
    }

    if (!dbBiz) {
      return NextResponse.json(
        { error: "기업 데이터를 생성하거나 로드하는 데 실패했습니다." },
        { status: 500 }
      );
    }

    // 3. 국민연금공단 고용 정보 실시간 조회 (상호명이 존재하는 경우에만 가능)
    let npsSbscrbNmps = dbBiz.npsSbscrbNmps || 0;
    let newAcqsNmps = dbBiz.newAcqsNmps || 0;
    let lossSbscrbNmps = dbBiz.lossSbscrbNmps || 0;
    let npsLinked = dbBiz.npsLinked || false;
    
    if (dbBiz.b_nm && dbBiz.b_nm !== "상호 정보 없음") {
      const npsInfo = await getNpsBplcInfo(cleanBNo, dbBiz.b_nm);
      if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
        npsSbscrbNmps = npsInfo.npsSbscrbNmps;
        newAcqsNmps = npsInfo.newAcqsNmps || 0;
        lossSbscrbNmps = npsInfo.lossSbscrbNmps || 0;
        npsLinked = true;
      }
    }

    // 4. Neon DB 업데이트 수행
    const bTypeAdjusted = ntsStatus.b_stt_cd === "03" ? "폐업자" : dbBiz.b_type;
    
    await query(
      `UPDATE businesses 
       SET tax_type = $1, 
           tax_type_cd = $2, 
           b_type = $3,
           nps_sbscrb_nmps = $4, 
           new_acqs_nmps = $5, 
           loss_sbscrb_nmps = $6, 
           nps_linked = $7, 
           nts_last_sync_at = CURRENT_TIMESTAMP, 
           nps_last_sync_at = CURRENT_TIMESTAMP
       WHERE b_no = $8`,
      [
        ntsStatus.tax_type,
        ntsStatus.tax_type_cd,
        bTypeAdjusted,
        npsSbscrbNmps,
        newAcqsNmps,
        lossSbscrbNmps,
        npsLinked,
        cleanBNo
      ]
    );

    // 연도별 이력 테이블의 최신 연도 종업원 수도 업데이트
    if (dbBiz.history && dbBiz.history.length > 0 && npsSbscrbNmps > 0) {
      const latestYear = dbBiz.history[dbBiz.history.length - 1].year;
      await query(
        `UPDATE business_history 
         SET employees = $1 
         WHERE b_no = $2 AND year = $3`,
        [npsSbscrbNmps, cleanBNo, latestYear]
      );
    }

    // 5. 최신 갱신 결과를 포함하여 로컬 DB 데이터 재조회 및 응답
    const updatedBiz = await getBusinessByBNo(cleanBNo);

    return NextResponse.json({
      success: true,
      message: "국세청 및 국민연금 실시간 지표 갱신이 완료되었습니다.",
      data: {
        b_stt: ntsStatus.b_stt,
        b_stt_cd: ntsStatus.b_stt_cd,
        tax_type: ntsStatus.tax_type,
        tax_type_cd: ntsStatus.tax_type_cd,
        npsSbscrbNmps: updatedBiz?.npsSbscrbNmps || 0,
        newAcqsNmps: updatedBiz?.newAcqsNmps || 0,
        lossSbscrbNmps: updatedBiz?.lossSbscrbNmps || 0,
        npsLinked: updatedBiz?.npsLinked || false,
        ntsLastSyncAt: updatedBiz?.ntsLastSyncAt,
        npsLastSyncAt: updatedBiz?.npsLastSyncAt
      }
    });

  } catch (error: any) {
    console.error(`[On-Demand Refresh] Error:`, error);
    return NextResponse.json(
      { error: "실시간 정보 갱신 중 서버 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}

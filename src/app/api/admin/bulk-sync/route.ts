import { NextRequest, NextResponse } from "next/server";
import { query, getAdminStats, getNoNameBusinesses, addInvalidBusiness } from "@/lib/db";
import { getNtsCompanyStatus } from "@/lib/ntsApi";
import { getFtcMailOrderInfo } from "@/lib/ftcApi";
import { isAdminRequest } from "@/lib/sessionAuth";

export const dynamic = "force-dynamic";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { error: "권한이 없습니다. 관리자 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // 통계 및 누락 기업 요약만 조회하는 경우 외부 공공 API 스캔을 실행하지 않음
    if (body?.onlyStats === true) {
      const [latestStats, latestNoNameList] = await Promise.all([
        getAdminStats(),
        getNoNameBusinesses(100, 0),
      ]);
      return NextResponse.json({
        success: true,
        stats: latestStats,
        noNameBusinesses: latestNoNameList,
      });
    }

    const batchLimit = Math.min(Math.max(Number(body?.limit) || 100, 1), 150);

    const targetQuery = await query(
      `SELECT b_no
       FROM businesses
       WHERE b_nm = '상호 정보 없음'
       ORDER BY view_count DESC NULLS LAST, updated_at ASC NULLS FIRST
       LIMIT $1`,
      [batchLimit]
    );
    const targets = targetQuery.rows.map((r) => r.b_no as string);

    let successCount = 0;
    let deletedCount = 0;
    let unchangedCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const bNo = targets[i];
      if (i > 0) await delay(150);

      try {
        const apiStatus = await getNtsCompanyStatus(bNo);
        const isInvalid = !apiStatus || apiStatus.tax_type?.includes("등록되지 않은");

        if (isInvalid) {
          await Promise.all([
            addInvalidBusiness(bNo),
            query("DELETE FROM businesses WHERE b_no = $1", [bNo]),
            query("DELETE FROM business_history WHERE b_no = $1", [bNo]),
            query("DELETE FROM business_timeline WHERE b_no = $1", [bNo]),
            query("DELETE FROM business_patents WHERE b_no = $1", [bNo]),
            query("DELETE FROM business_bids WHERE b_no = $1", [bNo]),
            query("DELETE FROM business_disclosures WHERE b_no = $1", [bNo]),
          ]);
          deletedCount++;
          continue;
        }

        const ftcInfo = await getFtcMailOrderInfo(bNo);
        if (ftcInfo && ftcInfo.cmpNm && ftcInfo.cmpNm.trim() !== "") {
          const coreBrandName = ftcInfo.cmpNm
            .replace(/\(.*?\)/g, "")
            .replace(/주식회사/g, "")
            .replace(/\(주\)/g, "")
            .trim();
          const brandVal = coreBrandName ? `${coreBrandName}, ${ftcInfo.cmpNm}` : ftcInfo.cmpNm;

          await query(
            `
            UPDATE businesses 
            SET b_nm = $1, 
                p_nm = $2, 
                b_adr = $3, 
                b_sector = $4,
                brand_name = $5,
                b_type = $6,
                homepage = $7,
                tel_no = $8,
                mail_order_no = $9,
                zip_cd = $10,
                nts_last_sync_at = CURRENT_TIMESTAMP,
                nps_last_sync_at = CURRENT_TIMESTAMP,
                tax_type = $11,
                tax_type_cd = $12
            WHERE b_no = $13
          `,
            [
              ftcInfo.cmpNm,
              ftcInfo.rprsNm || "-",
              ftcInfo.repAddr || "주소 정보 없음 (공시 비대상)",
              "전자상거래 소매업 (통신판매업)",
              brandVal,
              "소상공인 (통신판매업자)",
              ftcInfo.wbsitAddr || "-",
              ftcInfo.telNo || "",
              ftcInfo.mailOrderNo || "",
              ftcInfo.zipCd || "",
              apiStatus.tax_type || "부가가치세 일반과세자",
              apiStatus.tax_type_cd || "01",
              bNo,
            ]
          );
          successCount++;
        } else {
          await query(
            "UPDATE businesses SET nts_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1",
            [bNo]
          );
          unchangedCount++;
        }
      } catch (innerErr) {
        console.error(`[Bulk Sync] Error processing target ${bNo}:`, innerErr);
        unchangedCount++;
      }
    }

    const [latestStats, latestNoNameList] = await Promise.all([
      getAdminStats(),
      getNoNameBusinesses(100, 0),
    ]);

    return NextResponse.json({
      success: true,
      report: {
        totalScanned: targets.length,
        successCount,
        deletedCount,
        unchangedCount,
      },
      stats: latestStats,
      noNameBusinesses: latestNoNameList,
    });
  } catch (error) {
    console.error("Bulk sync fatal error:", error);
    return NextResponse.json(
      { error: "일괄 동기화 작업 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

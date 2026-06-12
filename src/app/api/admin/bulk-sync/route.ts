import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query, getAdminStats, getNoNameBusinesses } from "@/lib/db";
import { getNtsCompanyStatus } from "@/lib/ntsApi";
import { getFtcMailOrderInfo } from "@/lib/ftcApi";
import { addInvalidBusiness } from "@/lib/db";

export const dynamic = "force-dynamic";

// 딜레이를 위한 유틸리티 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    // 1. 어드민 세션 검증
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (!session || session.value !== "authenticated") {
      return NextResponse.json(
        { error: "권한이 없습니다. 관리자 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("[Bulk Sync] Admin triggered bulk scan for '상호 정보 없음' businesses.");

    // 2. 상호명이 '상호 정보 없음'인 모든 사업자 번호 조회
    const targetQuery = await query(
      "SELECT b_no FROM businesses WHERE b_nm = '상호 정보 없음'"
    );
    const targets = targetQuery.rows.map(r => r.b_no);

    console.log(`[Bulk Sync] Found ${targets.length} targets to sync.`);

    let successCount = 0;
    let deletedCount = 0;
    let unchangedCount = 0;

    // 3. 순회하면서 정보 동기화 처리
    for (let i = 0; i < targets.length; i++) {
      const bNo = targets[i];
      console.log(`[Bulk Sync] (${i + 1}/${targets.length}) Scanning: ${bNo}`);

      // API 호출 부하 조절을 위한 미세 딜레이
      if (i > 0) await delay(150);

      try {
        // A. 국세청 실시간 상태 조회
        const apiStatus = await getNtsCompanyStatus(bNo);
        const isInvalid = !apiStatus || apiStatus.tax_type?.includes("등록되지 않은");

        if (isInvalid) {
          // 국세청 미등록 유효하지 않은 번호는 DB에서 말소하고 블랙리스트로 보냄
          await Promise.all([
            addInvalidBusiness(bNo),
            query("DELETE FROM businesses WHERE b_no = $1", [bNo]),
            query("DELETE FROM business_history WHERE b_no = $1", [bNo]),
            query("DELETE FROM business_timeline WHERE b_no = $1", [bNo])
          ]);
          console.log(`[Bulk Sync] ${bNo} is invalid. Added to blacklist and deleted from cache.`);
          deletedCount++;
          continue;
        }

        // B. 공정거래위원회 통신판매업 상세 조회
        const ftcInfo = await getFtcMailOrderInfo(bNo);
        if (ftcInfo && ftcInfo.cmpNm && ftcInfo.cmpNm.trim() !== "") {
          const coreBrandName = ftcInfo.cmpNm.replace(/\(.*?\)/g, "").replace(/주식회사/g, "").replace(/\(주\)/g, "").trim();
          const brandVal = `${coreBrandName}, ${ftcInfo.cmpNm}`;

          // 실시간 정보 획득 시 DB 캐시 업데이트
          await query(`
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
          `, [
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
            bNo
          ]);
          console.log(`[Bulk Sync] Successfully resolved ${bNo} -> ${ftcInfo.cmpNm}`);
          successCount++;
        } else {
          // 계속사업자이지만 공정위 통신판매업 정보도 발견되지 않은 경우
          // 국세청 동기화 일자만 업데이트
          await query(
            "UPDATE businesses SET nts_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1",
            [bNo]
          );
          console.log(`[Bulk Sync] Unchanged ${bNo}. Active but no public details found.`);
          unchangedCount++;
        }
      } catch (innerErr) {
        console.error(`[Bulk Sync] Error processing target ${bNo}:`, innerErr);
        unchangedCount++;
      }
    }

    // 4. 완료 후 갱신된 최신 통계 및 누락 목록 데이터 로드
    const [latestStats, latestNoNameList] = await Promise.all([
      getAdminStats(),
      getNoNameBusinesses(100, 0)
    ]);

    return NextResponse.json({
      success: true,
      report: {
        totalScanned: targets.length,
        successCount,
        deletedCount,
        unchangedCount
      },
      stats: latestStats,
      noNameBusinesses: latestNoNameList
    });

  } catch (error: any) {
    console.error("Bulk sync fatal error:", error);
    return NextResponse.json(
      { error: "일괄 동기화 작업 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

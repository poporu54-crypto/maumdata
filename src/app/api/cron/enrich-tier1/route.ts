import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/sessionAuth";
import { runSafeTier1EnrichmentBatch } from "@/lib/tier1Enricher";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorizedCron(req: NextRequest): boolean {
  if (isAdminRequest(req)) return true;
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json(
      { error: "Unauthorized cron execution" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const requestedLimit = Number(searchParams.get("limit") || "8");
    const safeLimit = Number.isFinite(requestedLimit)
      ? Math.min(20, Math.max(1, Math.floor(requestedLimit)))
      : 8;
    // HTTP 크론은 60초 타임아웃 보호를 위해 기본 스냅샷 전체 재빌드를 생략(개별 허브 6시간 SWR이 자동 갱신)
    const refreshSnapshots = searchParams.get("snapshots") === "1";

    const report = await runSafeTier1EnrichmentBatch({
      limit: safeLimit,
      delayMs: 300,
      refreshSnapshots,
      pruneViewLogs: true,
      pruneBatchSize: 5000,
    });

    return NextResponse.json(
      { success: true, report },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[/api/cron/enrich-tier1] Failed:", err);
    return NextResponse.json(
      { success: false, error: "Tier-1 enrichment cron failed" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

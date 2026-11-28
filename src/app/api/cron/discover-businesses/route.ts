import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/sessionAuth";
import { discoverAndStoreNewBusinesses } from "@/lib/newBizDiscoverer";

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
    const reqCorpLimit = Number(searchParams.get("corpLimit") || "6");
    const reqFtcLimit = Number(searchParams.get("ftcLimit") || "10");

    const corpLimit = Number.isFinite(reqCorpLimit)
      ? Math.min(20, Math.max(0, Math.floor(reqCorpLimit)))
      : 6;
    const ftcLimit = Number.isFinite(reqFtcLimit)
      ? Math.min(30, Math.max(0, Math.floor(reqFtcLimit)))
      : 10;

    const report = await discoverAndStoreNewBusinesses({
      corpLimit,
      ftcLimit,
      timeBudgetMs: 42_000,
      delayMs: 150,
    });

    return NextResponse.json(
      { success: true, report },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[/api/cron/discover-businesses] Failed:", err);
    return NextResponse.json(
      { success: false, error: "New business discovery cron failed" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/apiBotGuard";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "claim_profile",
  "closure_alert",
  "contract_pro",
  "data_partnership",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  const blocked = guardApiRequest(req, {
    bucket: "b2b_partner_inquiry",
    maxRequests: 6,
    windowMs: 10 * 60_000,
    mode: "same-origin",
    rateLimitMessage: "잠시 후 다시 신청해 주세요. (10분당 최대 6회 접수 가능)",
  });
  if (blocked) return blocked;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "올바른 요청 형식이 아닙니다." }, { status: 400 });
    }

    const inquiryType = String(body.inquiryType || "").trim();
    const companyName = String(body.companyName || "").trim().slice(0, 150);
    const bNo = String(body.bNo || "").replace(/[^0-9]/g, "").slice(0, 10);
    const contactName = String(body.contactName || "").trim().slice(0, 70);
    const contactEmail = String(body.contactEmail || "").trim().slice(0, 150);
    const watchlistCountRaw = Number(body.watchlistCount || 0);
    const watchlistCount = Number.isFinite(watchlistCountRaw)
      ? Math.min(10000, Math.max(0, Math.floor(watchlistCountRaw)))
      : 0;
    const message = String(body.message || "").trim().slice(0, 2000);

    if (!ALLOWED_TYPES.has(inquiryType)) {
      return NextResponse.json({ error: "문의 유형을 정확히 선택해 주세요." }, { status: 400 });
    }
    if (companyName.length < 2) {
      return NextResponse.json({ error: "기업명(상호)을 2글자 이상 입력해 주세요." }, { status: 400 });
    }
    if (contactName.length < 2) {
      return NextResponse.json({ error: "담당자 성함을 입력해 주세요." }, { status: 400 });
    }
    if (!EMAIL_RE.test(contactEmail)) {
      return NextResponse.json({ error: "회신받으실 정확한 이메일 주소를 입력해 주세요." }, { status: 400 });
    }

    const insertRes = await query(
      `INSERT INTO public.b2b_partner_inquiries (
         inquiry_type, company_name, b_no, contact_name, contact_email, watchlist_count, message
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [inquiryType, companyName, bNo, contactName, contactEmail, watchlistCount, message]
    );

    return NextResponse.json(
      {
        success: true,
        id: insertRes.rows[0]?.id,
        createdAt: insertRes.rows[0]?.created_at,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[/api/partners/inquiry] Error:", err);
    return NextResponse.json(
      { error: "접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

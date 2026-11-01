import { NextResponse, NextRequest } from "next/server";
import { createContract } from "@/lib/db";
import { uploadContractSnapshotToR2 } from "@/lib/r2";
import crypto from "crypto";
import {
  checkRateLimit,
  getAuthenticatedContractUser,
  getClientIp,
  getSafeBaseOrigin,
} from "@/lib/sessionAuth";

export const dynamic = "force-dynamic";

function isValidDataImageUrl(val: unknown): boolean {
  if (!val) return true;
  if (typeof val !== "string") return false;
  if (val.length > 700_000) return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(val);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`contract_create:${ip}`, 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `계약 생성 요청이 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      templateId,
      title,
      partyAName,
      partyACompany,
      partyABno,
      partyAPhone,
      partyAEmail,
      partyASignature,
      partyBName,
      partyBCompany,
      partyBBno,
      partyBPhone,
      partyBEmail,
      accessPin,
      formData,
    } = body || {};

    if (!templateId || !title || !formData || typeof formData !== "object") {
      return NextResponse.json(
        { error: "필수 계약 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (!isValidDataImageUrl(partyASignature)) {
      return NextResponse.json(
        { error: "유효하지 않거나 용량이 초과된 서명 이미지입니다." },
        { status: 400 }
      );
    }

    const authUser = getAuthenticatedContractUser(request);
    const verifiedPartyAUserId = authUser ? authUser.id : "";

    const enrichedFormData = {
      ...formData,
      partyAEmail: (authUser?.email || partyAEmail || formData?.email || "").trim().toLowerCase(),
      partyBEmail: (partyBEmail || "").trim().toLowerCase(),
    };

    const contractId = `cnt_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const signToken = `sig_${crypto.randomBytes(20).toString("hex")}`;
    const safePin = accessPin ? String(accessPin).trim().slice(0, 12) : "";

    // Cloudflare R2에 발송 시점 계약서 스냅샷 백업
    const r2Key = await uploadContractSnapshotToR2(contractId, {
      id: contractId,
      templateId: String(templateId).slice(0, 64),
      title: String(title).slice(0, 200),
      status: "WAITING_PARTY_B",
      partyAName,
      partyACompany,
      partyABno,
      partyAPhone,
      partyAEmail: enrichedFormData.partyAEmail,
      partyASignature,
      partyAIp: ip,
      partyBName,
      partyBCompany,
      partyBBno,
      partyBPhone,
      partyBEmail: enrichedFormData.partyBEmail,
      formData: enrichedFormData,
      createdAt: new Date().toISOString(),
    });

    const newContract = await createContract({
      id: contractId,
      templateId: String(templateId).slice(0, 64),
      title: String(title).slice(0, 200),
      partyAName: String(partyAName || "").slice(0, 120),
      partyACompany: String(partyACompany || "").slice(0, 120),
      partyABno: String(partyABno || "").slice(0, 32),
      partyAPhone: String(partyAPhone || "").slice(0, 32),
      partyASignature: partyASignature || "",
      partyAIp: ip,
      partyAUserId: verifiedPartyAUserId,
      partyBName: String(partyBName || "").slice(0, 120),
      partyBCompany: String(partyBCompany || "").slice(0, 120),
      partyBBno: String(partyBBno || "").slice(0, 32),
      partyBPhone: String(partyBPhone || "").slice(0, 32),
      formData: enrichedFormData,
      signToken,
      accessPin: safePin,
      r2Key: r2Key || "",
    });

    const baseOrigin = getSafeBaseOrigin(request);
    const signUrl = `${baseOrigin}/sign/${signToken}`;

    return NextResponse.json({
      success: true,
      contractId,
      signToken,
      signUrl,
      accessPin: safePin,
      r2Key: r2Key || "",
      title: newContract.title,
      status: newContract.status,
      createdAt: newContract.created_at,
    });
  } catch (err) {
    console.error("Failed to create contract:", err);
    return NextResponse.json(
      { error: "계약서 생성 중 일시적인 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

import { NextResponse, NextRequest } from "next/server";
import {
  getContractBySignToken,
  completePartyBSignature,
  bindUserToContract,
  getTemplateByIdFromDB,
} from "@/lib/db";
import { getTemplateById } from "@/app/form/templatesData";
import { uploadContractSnapshotToR2 } from "@/lib/r2";
import {
  checkRateLimit,
  getAuthenticatedContractUser,
  getClientIp,
  safeStringEqual,
  SessionUserPayload,
} from "@/lib/sessionAuth";
import { guardApiRequest } from "@/lib/apiBotGuard";

export const dynamic = "force-dynamic";

function isValidSignatureImage(val: unknown): val is string {
  if (typeof val !== "string" || val.length < 32 || val.length > 700_000) {
    return false;
  }
  return /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(val);
}

function isUserVerifiedParty(contract: any, authUser: SessionUserPayload | null): boolean {
  if (!authUser) return false;
  if (contract.party_a_user_id && contract.party_a_user_id === authUser.id) return true;
  if (contract.party_b_user_id && contract.party_b_user_id === authUser.id) return true;

  const parsedForm =
    typeof contract.form_data === "string"
      ? (() => {
          try {
            return JSON.parse(contract.form_data);
          } catch {
            return {};
          }
        })()
      : contract.form_data || {};

  const emailLower = authUser.email.toLowerCase();
  if (parsedForm.partyAEmail && String(parsedForm.partyAEmail).toLowerCase() === emailLower) {
    return true;
  }
  if (parsedForm.partyBEmail && String(parsedForm.partyBEmail).toLowerCase() === emailLower) {
    return true;
  }
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const blocked = guardApiRequest(request, {
    bucket: "contract_token_get",
    maxRequests: 40,
    windowMs: 60_000,
    mode: "public-read",
  });
  if (blocked) return blocked;

  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;
    const { searchParams } = new URL(request.url);
    const inputPin = (searchParams.get("pin") || "").trim();

    if (!token) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 400 });
    }

    const contract = await getContractBySignToken(token);
    if (!contract) {
      return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
    }

    const storedPin = (contract.access_pin || "").trim();
    const authUser = getAuthenticatedContractUser(request);
    const verifiedParty = isUserVerifiedParty(contract, authUser);

    if (storedPin.length > 0 && !verifiedParty) {
      if (inputPin.length === 0) {
        return NextResponse.json({
          success: true,
          requiresPin: true,
          contract: {
            id: contract.id,
            title: contract.title,
            status: contract.status,
            partyAName: contract.party_a_name,
            partyACompany: contract.party_a_company,
            partyBName: contract.party_b_name,
            partyBCompany: contract.party_b_company,
            createdAt: contract.created_at,
          },
        });
      }

      const ip = getClientIp(request);
      const pinRate = checkRateLimit(`pin_verify:${token}:${ip}`, 10, 300_000);
      if (!pinRate.allowed) {
        return NextResponse.json({
          success: true,
          requiresPin: true,
          pinError: `비밀번호 입력 횟수를 초과했습니다. ${pinRate.retryAfterSec}초 후 다시 시도해 주세요.`,
          contract: {
            id: contract.id,
            title: contract.title,
            status: contract.status,
            partyAName: contract.party_a_name,
            partyACompany: contract.party_a_company,
            partyBName: contract.party_b_name,
            partyBCompany: contract.party_b_company,
            createdAt: contract.created_at,
          },
        });
      }

      if (!safeStringEqual(inputPin, storedPin)) {
        return NextResponse.json({
          success: true,
          requiresPin: true,
          pinError: "임시 비밀번호가 일치하지 않습니다.",
          contract: {
            id: contract.id,
            title: contract.title,
            status: contract.status,
            partyAName: contract.party_a_name,
            partyACompany: contract.party_a_company,
            partyBName: contract.party_b_name,
            partyBCompany: contract.party_b_company,
            createdAt: contract.created_at,
          },
        });
      }
    }

    // 계약 서식의 조항 레이아웃 및 한글 필드 스키마 함께 로드
    const rawTemplate =
      getTemplateById(contract.template_id) ||
      (await getTemplateByIdFromDB(contract.template_id));

    const templateMeta = rawTemplate
      ? {
          id: rawTemplate.id,
          title: rawTemplate.title,
          category: rawTemplate.category,
          fields: Array.isArray(rawTemplate.fields) ? rawTemplate.fields : [],
          layout: (rawTemplate as any).layout || null,
        }
      : null;

    return NextResponse.json({
      success: true,
      requiresPin: false,
      template: templateMeta,
      contract: {
        id: contract.id,
        templateId: contract.template_id,
        title: contract.title,
        status: contract.status,
        partyAName: contract.party_a_name,
        partyACompany: contract.party_a_company,
        partyABno: contract.party_a_bno,
        partyAPhone: contract.party_a_phone,
        partyASignature: contract.party_a_signature,
        partyASignedAt: contract.party_a_signed_at,
        partyBName: contract.party_b_name,
        partyBCompany: contract.party_b_company,
        partyBBno: contract.party_b_bno,
        partyBPhone: contract.party_b_phone,
        partyBSignature: contract.party_b_signature,
        partyBSignedAt: contract.party_b_signed_at,
        r2Key: contract.r2_key || "",
        formData:
          typeof contract.form_data === "string"
            ? JSON.parse(contract.form_data)
            : contract.form_data,
        createdAt: contract.created_at,
      },
    });
  } catch (err) {
    console.error("Failed to get contract:", err);
    return NextResponse.json(
      { error: "계약서 조회 중 일시적인 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const blocked = guardApiRequest(request, {
    bucket: "contract_token_post",
    maxRequests: 15,
    windowMs: 60_000,
    mode: "same-origin",
  });
  if (blocked) return blocked;

  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;
    const body = await request.json().catch(() => ({}));
    const { signatureImage, signerName, action, pin } = body || {};

    if (!token) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 400 });
    }

    const existing = await getContractBySignToken(token);
    if (!existing) {
      return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
    }

    const storedPin = (existing.access_pin || "").trim();
    const authUser = getAuthenticatedContractUser(request);
    const verifiedParty = isUserVerifiedParty(existing, authUser);
    const inputPin = typeof pin === "string" ? pin.trim() : "";

    if (storedPin.length > 0 && !verifiedParty) {
      const ip = getClientIp(request);
      const pinRate = checkRateLimit(`pin_post:${token}:${ip}`, 10, 300_000);
      if (!pinRate.allowed) {
        return NextResponse.json(
          { error: `비밀번호 인증 시도가 너무 많습니다. ${pinRate.retryAfterSec}초 후 시도해 주세요.` },
          { status: 429 }
        );
      }
      if (!inputPin || !safeStringEqual(inputPin, storedPin)) {
        return NextResponse.json(
          { error: "계약서 보호 비밀번호가 일치하지 않습니다." },
          { status: 403 }
        );
      }
    }

    // 1. 보관함 영구 등록 전용 액션 (서버 검증된 로그인 사용자만 본인 ID로 바인딩 허용)
    if (action === "bind_user") {
      if (!authUser) {
        return NextResponse.json(
          { error: "보관함 등록을 위해 본인 로그인이 필요합니다." },
          { status: 401 }
        );
      }
      await bindUserToContract(token, authUser.id, "B");
      return NextResponse.json({ success: true });
    }

    // 2. 이미 체결 완료된 계약서 재서명/덮어쓰기 원천 차단
    if (existing.status === "COMPLETED") {
      return NextResponse.json(
        { error: "이미 양측 서명이 완료되어 영구 봉인된 계약서입니다." },
        { status: 409 }
      );
    }

    if (!isValidSignatureImage(signatureImage)) {
      return NextResponse.json(
        { error: "유효한 전자서명 이미지가 누락되었거나 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const safeSignerName =
      typeof signerName === "string" ? signerName.trim().slice(0, 120) : "";
    const signedAtIso = new Date().toISOString();

    const parsedFormData =
      typeof existing.form_data === "string"
        ? JSON.parse(existing.form_data)
        : existing.form_data;

    // Cloudflare R2에 체결 완료 최종본 불변 스냅샷 영구 보관 (completed.json)
    const r2Key = await uploadContractSnapshotToR2(existing.id, {
      id: existing.id,
      templateId: existing.template_id,
      title: existing.title,
      status: "COMPLETED",
      partyAName: existing.party_a_name,
      partyACompany: existing.party_a_company,
      partyABno: existing.party_a_bno,
      partyAPhone: existing.party_a_phone,
      partyASignature: existing.party_a_signature,
      partyASignedAt: existing.party_a_signed_at,
      partyAIp: existing.party_a_ip,
      partyBName: safeSignerName || existing.party_b_name,
      partyBCompany: existing.party_b_company,
      partyBBno: existing.party_b_bno,
      partyBPhone: existing.party_b_phone,
      partyBSignature: signatureImage,
      partyBSignedAt: signedAtIso,
      partyBIp: clientIp,
      formData: parsedFormData,
      completedAt: signedAtIso,
    });

    const completed = await completePartyBSignature(
      token,
      signatureImage,
      clientIp,
      safeSignerName,
      authUser?.id || "",
      r2Key || existing.r2_key || ""
    );

    if (!completed) {
      return NextResponse.json(
        { error: "이미 체결되었거나 서명 가능한 상태가 아닙니다." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      contractId: completed.id,
      status: completed.status,
      signedAt: completed.party_b_signed_at,
      r2Key: completed.r2_key || "",
    });
  } catch (err) {
    console.error("Failed to complete contract:", err);
    return NextResponse.json(
      { error: "서명 처리 중 일시적인 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

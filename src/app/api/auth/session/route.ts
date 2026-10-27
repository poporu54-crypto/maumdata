import { NextResponse, NextRequest } from "next/server";
import { getContractUserByEmail, upsertContractUser, deleteContractUser } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw + "_maumdata_salt_2026").digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, company, provider = "quick" } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "이메일 주소를 입력해 주세요." },
        { status: 400 }
      );
    }

    if (!password || String(password).trim().length < 4) {
      return NextResponse.json(
        { error: "보안 비밀번호(4자리 이상)를 입력해 주세요." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashed = hashPassword(String(password).trim());

    const existing = await getContractUserByEmail(cleanEmail);

    if (existing) {
      // 기존 가입자: 비밀번호 해시 검증
      if (existing.password_hash && existing.password_hash !== hashed) {
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않습니다. 처음 설정하신 비밀번호를 입력해 주세요." },
          { status: 401 }
        );
      }

      const updated = await upsertContractUser({
        id: existing.id,
        provider: existing.provider || provider,
        email: cleanEmail,
        name: name || existing.name,
        company: company || existing.company,
        passwordHash: hashed,
      });

      return NextResponse.json({
        success: true,
        isNewUser: false,
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name || cleanEmail.split("@")[0],
          company: updated.company || "",
          provider: updated.provider || "quick",
        },
      });
    } else {
      // 신규 가입자: 즉시 계정 생성 및 로그인
      const newUserId = `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const created = await upsertContractUser({
        id: newUserId,
        provider,
        email: cleanEmail,
        name: name || cleanEmail.split("@")[0],
        company: company || "",
        passwordHash: hashed,
      });

      return NextResponse.json({
        success: true,
        isNewUser: true,
        user: {
          id: created.id,
          email: created.email,
          name: created.name || cleanEmail.split("@")[0],
          company: created.company || "",
          provider: created.provider || "quick",
        },
      });
    }
  } catch (err: any) {
    console.error("Auth session error:", err);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다: " + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body || {};

    if (!userId && !email) {
      return NextResponse.json(
        { error: "삭제할 계정 정보가 없습니다." },
        { status: 400 }
      );
    }

    await deleteContractUser(String(userId || ""), String(email || ""));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Account delete error:", err);
    return NextResponse.json(
      { error: "계정 탈퇴 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

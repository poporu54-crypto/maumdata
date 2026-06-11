import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPendingEditRequests } from "@/lib/db";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  // 로그인 상태 검증
  if (!session || session.value !== "authenticated") {
    redirect("/admin/login");
  }

  // Neon DB로부터 대기 중인 제안 목록 로딩
  const requests = await getPendingEditRequests();

  return (
    <div style={{ backgroundColor: "#0b0f19", minHeight: "100vh" }}>
      <AdminDashboard initialRequests={requests} />
    </div>
  );
}

import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPendingEditRequests, getAdminStats, getNoNameBusinesses } from "@/lib/db";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  // 로그인 상태 검증
  if (!session || session.value !== "authenticated") {
    redirect("/admin/login");
  }

  // 병렬 데이터 로딩을 활용하여 성능 최적화
  const [requests, stats, noNameBusinesses] = await Promise.all([
    getPendingEditRequests(),
    getAdminStats(),
    getNoNameBusinesses(100, 0),
  ]);

  return (
    <div style={{ backgroundColor: "#0b0f19", minHeight: "100vh" }}>
      <AdminDashboard 
        initialRequests={requests} 
        stats={stats}
        noNameBusinesses={noNameBusinesses}
      />
    </div>
  );
}


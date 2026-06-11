import React from "react";
import Link from "next/link";
import { getPortalStats } from "@/lib/statApi";
import SearchForm from "@/components/SearchForm";
import StatsDashboard from "@/components/StatsDashboard";
import { recordSnapshotIfMissing, startSnapshotScheduler } from "@/lib/statScheduler";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MainPage() {
  // 백그라운드 스케줄러 기동 (서버 기동 최초 1회 가드 처리됨)
  startSnapshotScheduler();
  // 오늘 자정 스냅샷 기록 여부 점검 및 자동 보정 (지연 동기화)
  await recordSnapshotIfMissing();

  // 서버 사이드에서 실시간 국가 통계 API(전국사업체조사 & 100대 생활업종) 집계 조회
  const stats = await getPortalStats();

  // DB에서 조회수 기준 상위 인기 검색 기업 6개 동적 조회
  let quickLinks = [];
  try {
    const popularBizRes = await query(`
      SELECT b.b_no, b.b_nm, b.brand_name, COUNT(l.id) AS recent_views
      FROM businesses b
      LEFT JOIN business_view_logs l ON b.b_no = l.b_no AND l.viewed_at >= NOW() - INTERVAL '24 hours'
      WHERE b.b_nm != '상호 미등록 사업자'
      GROUP BY b.b_no, b.b_nm, b.brand_name, b.view_count, b.nps_sbscrb_nmps
      ORDER BY recent_views DESC, b.view_count DESC, b.nps_sbscrb_nmps DESC
      LIMIT 6
    `);
    
    quickLinks = popularBizRes.rows.map((row: any) => {
      let shortName = row.b_nm;
      if (row.brand_name) {
        shortName = row.brand_name.split(",")[0].trim();
      }
      return { name: shortName, no: row.b_no };
    });
  } catch (err) {
    console.error("Failed to fetch dynamic quick links:", err);
    // Fallback static links in case of database errors
    quickLinks = [
      { name: "지윤", no: "1378651839" },
      { name: "토스", no: "1208801280" },
      { name: "네이버", no: "2208162517" },
      { name: "카카오", no: "1208147521" },
      { name: "스타벅스", no: "2018121515" },
      { name: "삼양식품", no: "1028105450" }
    ];
  }

  return (
    <div className="animate-fade-in" style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "720px" }}>
        
        {/* 히어로 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--color-primary-light)",
            color: "var(--color-primary)",
            padding: "8px 16px",
            borderRadius: "30px",
            fontSize: "0.85rem",
            fontWeight: 700,
            marginBottom: "16px"
          }}>
            <span>✨ 마음데이터 독자적인 기업 분석 엔진</span>
          </div>
          <h1 className="hero-title">
            모든 기업 정보를 <br className="br-pc" />
            한 번에, 정확하게
          </h1>
          <p className="hero-subtitle">
            정교한 AI 기업 분석 지표와 실시간 상태 검증이 <br className="br-pc" />
            하나로 융합된 대한민국 대표 민간 기업 데이터 포털
          </p>
        </div>

        {/* 토스 스타일 대형 검색창 */}
        <SearchForm />

        {/* 실시간 퀵 링크 */}
        <div style={{ marginBottom: "56px" }}>
          <h3 style={{
            fontSize: "0.85rem",
            color: "var(--color-text-desc)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "12px",
            paddingLeft: "4px"
          }}>
            실시간 많이 찾는 기업
          </h3>
          <div className="quick-links-scroll">
            {quickLinks.map((link) => (
              <Link
                key={link.no}
                href={`/biz/${link.no}`}
                className="related-card"
                style={{
                  backgroundColor: "var(--bg-color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "10px 16px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--color-text-sub)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "var(--shadow-sm)",
                  transition: "var(--transition-smooth)"
                }}
              >
                <span>🏢</span>
                <span>{link.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 포털 요약 지표 카드 & 실시간 상세 대시보드 */}
        <StatsDashboard stats={stats} />

        {/* 프리미엄 B2B 빅데이터 분석 서비스 쇼케이스 섹션 (신설) */}
        <div style={{ marginTop: "64px" }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--color-text-main)",
            marginBottom: "8px",
            paddingLeft: "4px"
          }}>
            💼 프리미엄 B2B 빅데이터 분석 서비스
          </h2>
          <p style={{
            fontSize: "0.9rem",
            color: "var(--color-text-desc)",
            marginBottom: "24px",
            paddingLeft: "4px"
          }}>
            공공 및 민간의 대용량 실시간 로우 데이터를 수집·가공하여 차별화된 기업 정보를 제공합니다.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {/* 서비스 1: 지역 상권 분석 */}
            <div className="card" style={{
              padding: "28px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              <div style={{ fontSize: "2rem" }}>📍</div>
              <div>
                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
                  실시간 지역 상권 분석
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
                  전국 수백만 상가업소의 업종분류, 가동 분포 및 활성화 지표를 실시간 분석합니다. 검색창에 동 이름을 입력해 보세요.
                </p>
              </div>
              {/* 퀵 추천 상권 단축키 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                <Link href="/stats/market-area/1168064000" className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "8px" }}>
                  서울 역삼동
                </Link>
                <Link href="/stats/market-area/1159062000" className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "8px" }}>
                  서울 사당동
                </Link>
                <Link href="/stats/market-area/2635010500" className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "8px" }}>
                  부산 우동
                </Link>
                <Link href="/stats/market-area/2726051000" className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "8px" }}>
                  대구 범어동
                </Link>
              </div>
            </div>

            {/* 서비스 2: 조달청 나라장터 입찰 매칭 */}
            <div className="card" style={{
              padding: "28px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ fontSize: "2rem" }}>🏛️</div>
                <div>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
                    공공 조달 및 입찰 매칭
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
                    기업 정보와 연동된 최근 나라장터의 물품/용역 입찰공고 및 추정가격, 수요기관 정보를 실시간 매핑하여 제공합니다.
                  </p>
                </div>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}>
                * 기업 상세페이지 하단에서 실시간 확인 가능
              </div>
            </div>

            {/* 서비스 3: 기업 기술력 (특허) 포트폴리오 */}
            <div className="card" style={{
              padding: "28px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ fontSize: "2rem" }}>💡</div>
                <div>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
                    지식재산권(IP) 포트폴리오
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
                    출원/보유하고 있는 특허 및 상표 자산을 실시간 추적하여 해당 기업의 기술 경쟁력 등급을 시각화합니다.
                  </p>
                </div>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}>
                * 기업 상세페이지 하단에서 실시간 확인 가능
              </div>
            </div>

            {/* 서비스 4: 실시간 고용 트렌드 분석 (신설) */}
            <div className="card" style={{
              padding: "28px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ fontSize: "2rem" }}>👥</div>
                <div>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
                    실시간 고용 트렌드 분석
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
                    국민연금 실시간 가입 데이터를 연동하여 상시근로자 수 변화, 당월 신규 취득자(입사) 및 상실자(퇴사) 추이를 추적하고 인력 성장률을 분석합니다.
                  </p>
                </div>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}>
                * 기업 상세페이지 하단에서 실시간 확인 가능
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

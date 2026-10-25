import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getStoreDataInDong, getDongName } from "@/lib/marketApi";
import ClientMapWrapper from "@/components/ClientMapWrapper";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ dongCd: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const dongInfo = getDongName(resolvedParams.dongCd);
  const canonicalPath = `/stats/market-area/${resolvedParams.dongCd}`;
  
  return {
    title: `${dongInfo.fullName} 업종별 실시간 상권 분석 리포트 | 마음데이타`,
    description: `${dongInfo.fullName} 지역의 실시간 상가 점포 현황, 업종별 점유 비율, 대표 카페 및 한식집 분포 빅데이터 리포트입니다.`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${dongInfo.fullName} 업종별 실시간 상권 분석 리포트 | 마음데이타`,
      description: `${dongInfo.fullName} 지역의 실시간 상가 점포 현황, 업종별 점유 비율, 대표 카페 및 한식집 분포 빅데이터 리포트입니다.`,
      url: `https://www.maumdata.com${canonicalPath}`,
      type: "website",
    },
  };
}

export default async function MarketAreaPage({ params }: PageProps) {
  const resolvedParams = await params;
  const dongCd = resolvedParams.dongCd;
  const dongInfo = getDongName(dongCd);

  // 1. 실시간 동별 상가 정보 수집
  const { stores: storeList, totalCount } = await getStoreDataInDong(dongCd);
  const sampleCount = storeList.length;

  // 2. 지도 마커용 데이터 매핑
  const mapMarkers = storeList.map((store) => ({
    lat: store.lat,
    lng: store.lon,
    title: store.bizesNm,
    category: store.indsSclsNm,
    address: store.rdnmAdr,
  }));

  // 3. 업종 대분류별 비중 집계
  const counts: Record<string, { count: number; name: string; color: string }> = {};
  
  const colorMapping: Record<string, string> = {
    "음식": "var(--color-primary)",
    "소매": "#a855f7",
    "교육": "#10b981",
    "생활서비스": "#fbbf24",
    "숙박": "#ec4899",
    "기타": "#94a3b8"
  };

  storeList.forEach((store) => {
    const lNm = store.indsLclsNm || "기타";
    if (!counts[lNm]) {
      counts[lNm] = {
        count: 0,
        name: lNm,
        color: colorMapping[lNm] || colorMapping["기타"],
      };
    }
    counts[lNm].count++;
  });

  const chartData = Object.values(counts)
    .map((item) => ({
      ...item,
      pct: sampleCount > 0 ? parseFloat(((item.count / sampleCount) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 도넛 차트 세그먼트 오프셋 산출용
  let accumulatedPct = 25; // 12시 방향부터 시작(SVG 대쉬어레이 오프셋 보정)

  // 상위 대표 점포 리스트 (최대 10개)
  const topStores = storeList.slice(0, 10);

  return (
    <div className="animate-fade-in" style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "720px" }}>

        {/* 타이틀 헤더 */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{
              backgroundColor: "var(--color-primary-light)",
              color: "var(--color-primary)",
              fontSize: "0.8rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "20px"
            }}>
              실시간 상권 분석
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 500 }}>
              공공데이터포털 연동
            </span>
          </div>
          <h1 style={{
            fontSize: "1.85rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--color-text-main)",
            marginBottom: "10px"
          }}>
            📍 {dongInfo.fullName} 상권 리포트
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", lineHeight: 1.5 }}>
            소상공인시장진흥공단 공식 상가(상권)데이터를 실시간 집계하여 해당 행정동 구역 내의 상가 총량, 업종 다각성 및 대표 점포 분포를 분석한 대시보드입니다.
          </p>
        </div>

        {/* 핵심 통계 요약 카드 */}
        <div className="card" style={{
          padding: "32px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-card)",
          marginBottom: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div>
            <span style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              {dongInfo.dong} 점포 가동 밀도
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              {totalCount > 0 ? `${totalCount.toLocaleString()}개소` : "-"}
            </span>
            <span style={{
              backgroundColor: totalCount > 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(148, 163, 184, 0.1)",
              color: totalCount > 0 ? "#10b981" : "var(--color-text-desc)",
              fontSize: "0.85rem",
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: "30px"
            }}>
              {totalCount > 0 ? "상권 데이터 연동 완료" : "조회된 점포 데이터 없음"}
            </span>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-sub)", lineHeight: 1.5 }}>
            지정 구역 내에서 활성화 상태로 파악된 대기업/프랜차이즈 및 개인 소상공인 점포의 총합입니다. 동종 업계의 출점 밀도 및 경쟁 강도를 측정하는 핵심 선행지표입니다.
          </p>
        </div>

        {/* 실시간 점포 분포 지도 카드 */}
        <div className="card" style={{
          padding: "32px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-card)",
          marginBottom: "32px",
          height: "450px",
          display: "flex",
          flexDirection: "column"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
            🗺️ 실시간 가동 점포 위치 분포
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            해당 행정동 구역 내에서 활성화 상태인 점포들의 공간적 밀집도와 위치를 지도상에 시각화합니다.
          </p>
          <div style={{ flex: 1, width: "100%", position: "relative" }}>
            <ClientMapWrapper markers={mapMarkers} />
          </div>
        </div>

        {/* 도넛 차트 점유율 카드 */}
        <div className="card" style={{
          padding: "32px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-card)",
          marginBottom: "32px"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
            📊 업종별 점유 구성비
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "24px" }}>
            상권 내 가장 지배적인 영향력을 가진 주요 산업군별 분포 비율입니다.
          </p>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "32px"
          }}>
            {/* SVG Donut 차트 */}
            <div style={{ position: "relative", width: "160px", height: "160px" }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                <circle cx="21" cy="21" r="15.915" fill="transparent"></circle>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-border)" strokeWidth="4"></circle>
                
                {chartData.map((item, idx) => {
                  const offset = (accumulatedPct - item.pct + 100) % 100;
                  accumulatedPct = offset;
                  return (
                    <circle 
                      key={idx}
                      cx="21" cy="21" r="15.915" 
                      fill="transparent" 
                      stroke={item.color} 
                      strokeWidth="4.5"
                      strokeDasharray={`${item.pct} ${100 - item.pct}`} 
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 850, color: "var(--color-text-main)", lineHeight: 1 }}>{totalCount.toLocaleString()}개</div>
                <div style={{ fontSize: "0.68rem", color: "var(--color-text-desc)", fontWeight: 700, marginTop: "4px" }}>총 상업시설</div>
              </div>
            </div>

            {/* 범례 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "12px",
              minWidth: "200px"
            }}>
              {chartData.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.9rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: item.color }}></div>
                    <span style={{ color: "var(--color-text-sub)" }}>{item.name}</span>
                  </div>
                  <span style={{ color: "var(--color-text-main)", fontWeight: 700 }}>
                    {item.count}개 ({item.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 점포 디렉토리 리스트 */}
        <div className="card" style={{
          padding: "32px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-card)",
          marginBottom: "32px"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
            📋 {dongInfo.dong} 대표 가동 점포 리스트 (상위 10선)
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            도로명 주소 및 위경도 검증이 확보된 행정구역 핵심 상가 데이터입니다.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {topStores.map((store, idx) => (
              <div 
                key={store.bizesId} 
                style={{
                  padding: "16px 20px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.005)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <strong style={{ color: "var(--color-text-main)", fontSize: "0.98rem" }}>{store.bizesNm}</strong>
                    <span style={{
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      color: "var(--color-text-desc)",
                      fontSize: "0.75rem",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: 600
                    }}>
                      {store.indsSclsNm}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-desc)", margin: 0 }}>
                    📍 {store.rdnmAdr}
                  </p>
                </div>
                
                <span style={{
                  fontSize: "0.75rem",
                  color: "var(--color-primary)",
                  backgroundColor: "var(--color-primary-light)",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "6px"
                }}>
                  영업 중
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 전국 주요 핵심 상권 비교 내부 <a href> 연결망 */}
        <section
          aria-label="전국 주요 핵심 상권 비교 리포트"
          className="card"
          style={{
            padding: "28px 24px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--bg-color-card)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              🗺️ 전국 20대 핵심 상권 비교 리포트 바로가기
            </h3>
            <Link
              href="/stats/market-area"
              style={{
                fontSize: "0.84rem",
                fontWeight: 700,
                color: "var(--color-primary)",
                textDecoration: "none",
              }}
            >
              전국 상권 분석 메인 허브 ➔
            </Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[
              { cd: "1168064000", label: "서울 강남 역삼1동" },
              { cd: "1168065000", label: "서울 강남 역삼2동" },
              { cd: "1159062000", label: "서울 동작 사당1동" },
              { cd: "1111061500", label: "서울 종로1·2·3·4가동" },
              { cd: "4113565500", label: "성남 분당 삼평동(판교)" },
              { cd: "2820051000", label: "인천 남동 구월1동" },
              { cd: "5111066000", label: "강원 춘천 퇴계동" },
              { cd: "3017064000", label: "대전 서구 둔산2동" },
              { cd: "3611056000", label: "세종 보람동" },
              { cd: "4413356600", label: "천안 불당1동" },
              { cd: "4311154500", label: "청주 성안동" },
              { cd: "2635051000", label: "부산 해운대 우1동" },
              { cd: "2726051000", label: "대구 수성 범어1동" },
              { cd: "4812353000", label: "창원 성산 상남동" },
              { cd: "3114057000", label: "울산 남구 삼산동" },
              { cd: "4711157000", label: "포항 남구 제철동" },
              { cd: "1224074500", label: "광주 서구 치평동" },
              { cd: "5211173000", label: "전주 완산 효자5동" },
              { cd: "1213080000", label: "여수 여천동" },
              { cd: "5011066000", label: "제주 노형동" },
            ]
              .filter((d) => d.cd !== dongCd)
              .map((d) => (
                <Link
                  key={d.cd}
                  href={`/stats/market-area/${d.cd}`}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--color-text-sub)",
                    backgroundColor: "var(--bg-color-main)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "20px",
                    padding: "6px 12px",
                    textDecoration: "none",
                  }}
                >
                  {d.label}
                </Link>
              ))}
          </div>
        </section>

        {/* 하단 메인 바로가기 */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginTop: "16px" }}>
          <Link
            href="/stats/market-area"
            style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              textDecoration: "underline",
            }}
          >
            ← 전국 상권 분석 허브로 돌아가기
          </Link>
          <Link
            href="/"
            style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "var(--color-text-sub)",
              textDecoration: "underline",
            }}
          >
            마음데이타 기업 조회 홈으로 이동
          </Link>
        </div>

      </div>
    </div>
  );
}

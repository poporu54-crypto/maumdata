import React, { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import { searchCorpOutline, CorpBasicOutline } from "@/lib/corpApi";
import { searchBusinesses, query as dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ query?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { query } = await searchParams;
  const decodedQuery = query ? decodeURIComponent(query) : "";
  return {
    title: `"${decodedQuery}" 검색 결과 | 마음데이터 기업 검색`,
    description: `마음데이터 포털에서 "${decodedQuery}"에 부합하는 실시간 기업 상태 및 3개년 종합 재무 분석 이력을 조회해보세요.`,
  };
}

interface UnifiedSearchResult {
  b_no: string;          // 사업자번호 (10자리)
  b_nm: string;          // 상호명
  p_nm: string;          // 대표자명
  b_adr: string;         // 주소
  b_sector: string;      // 주업종
  dataSource: "local" | "public";
  is_sme?: string;
  listing_status?: string;
}

// 검색결과 로딩 시 시각적 CLS 및 체감 로딩 속도 완화를 위한 스켈레톤 로더 UI
function SearchResultsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-custom {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .skeleton-item {
          animation: pulse-custom 1.5s infinite ease-in-out;
        }
      `}} />
      <div className="skeleton-item" style={{ width: "130px", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          padding: "24px",
          borderRadius: "18px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-card)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "var(--shadow-sm)",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "60%" }}>
              <div className="skeleton-item" style={{ width: "80%", height: "20px", borderRadius: "6px", backgroundColor: "var(--color-border)" }} />
              <div className="skeleton-item" style={{ width: "50%", height: "12px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
            </div>
            <div className="skeleton-item" style={{ width: "95px", height: "22px", borderRadius: "20px", backgroundColor: "var(--color-border)" }} />
          </div>
          <div className="skeleton-item" style={{ width: "75%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
          <div className="skeleton-item" style={{ width: "45%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
        </div>
      ))}
    </div>
  );
}

// 24시간 실시간 조회 로그 집계 및 인기 추천 기업 목록 비동기 조회
async function getPopularQuickLinks() {
  try {
    const popularBizRes = await dbQuery(`
      SELECT b.b_no, b.b_nm, b.brand_name, COUNT(l.id) AS recent_views
      FROM businesses b
      LEFT JOIN business_view_logs l ON b.b_no = l.b_no AND l.viewed_at >= NOW() - INTERVAL '24 hours'
      WHERE b.b_nm != '상호 정보 없음'
      GROUP BY b.b_no, b.b_nm, b.brand_name, b.view_count, b.nps_sbscrb_nmps
      ORDER BY recent_views DESC, b.view_count DESC, b.nps_sbscrb_nmps DESC
      LIMIT 4
    `);
    
    return popularBizRes.rows.map((row: any) => {
      let shortName = row.b_nm;
      if (row.brand_name) {
        const brandPrefix = row.brand_name.split(",")[0].trim();
        if (brandPrefix && brandPrefix !== "상호 미등록 사업자" && brandPrefix !== "상호 정보 없음") {
          shortName = brandPrefix;
        }
      }
      return { name: shortName, no: row.b_no };
    });
  } catch (err) {
    console.error("Failed to fetch search quick links:", err);
    return [
      { name: "지윤 주식회사", no: "1378651839" },
      { name: "토스 (비바리퍼블리카)", no: "1208801280" },
      { name: "네이버 (NAVER)", no: "2208162517" },
      { name: "스타벅스 코리아", no: "2018121515" }
    ];
  }
}

// 검색 결과가 존재하지 않을 때 추천 링크 목록과 함께 오류 메시지를 띄우는 비동기 컴포넌트
async function NoSearchResultSection({ searchQuery }: { searchQuery: string }) {
  const quickLinks = await getPopularQuickLinks();
  
  return (
    <div style={{
      textAlign: "center",
      padding: "80px 24px",
      border: "1px dashed var(--color-border)",
      borderRadius: "20px",
      backgroundColor: "rgba(255, 255, 255, 0.005)"
    }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🔍</div>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "8px" }}>
        &ldquo;{searchQuery}&rdquo; 검색 결과가 없습니다
      </h3>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", maxWidth: "400px", margin: "0 auto 24px auto" }}>
        사업자등록번호(10자리), 상호명 또는 대표자명을 다시 한 번 정확히 확인해 주세요.
      </p>
      
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "0.82rem", color: "var(--color-text-desc)", fontWeight: 600 }}>추천 인기 키워드 검색:</span>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          {quickLinks.map(link => (
            <Link 
              key={link.no}
              href={`/search?query=${encodeURIComponent(link.name)}`}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1px solid var(--color-border)",
                fontSize: "0.8rem",
                fontWeight: 600,
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                color: "var(--color-text-sub)"
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// 실질적인 데이터 로드 및 중복 제거 처리를 담당하는 비동기 서브 컴포넌트
async function SearchResultList({ searchQuery }: { searchQuery: string }) {
  let results: UnifiedSearchResult[] = [];

  if (searchQuery.length >= 2) {
    let localMatches: UnifiedSearchResult[] = [];
    try {
      const list = await searchBusinesses(searchQuery);
      localMatches = list.map((item: any) => ({
        b_no: item.b_no,
        b_nm: item.b_nm,
        p_nm: item.p_nm,
        b_adr: item.b_adr || "-",
        b_sector: item.b_sector || "-",
        dataSource: "local",
        is_sme: item.is_sme,
        listing_status: item.listing_status
      }));
    } catch (err) {
      console.error("Failed to read Neon DB for search:", err);
    }

    let publicMatches: CorpBasicOutline[] = [];
    if (localMatches.length === 0) {
      try {
        console.log(`[Search API] No local matches for "${searchQuery}". Querying public API...`);
        publicMatches = await searchCorpOutline(searchQuery);
      } catch (err) {
        console.error("Failed to fetch public api for search:", err);
      }
    } else {
      console.log(`[Search Cache Hit] Found ${localMatches.length} local matches for "${searchQuery}". Skipped public API query.`);
    }

    const mergeMap = new Map<string, UnifiedSearchResult>();

    localMatches.forEach(item => {
      const key = item.b_no.replace(/[^0-9]/g, "");
      if (key && key.length === 10) {
        mergeMap.set(key, item);
      }
    });

    publicMatches.forEach(item => {
      const key = item.bizrNo ? item.bizrNo.replace(/[^0-9]/g, "") : "";
      if (key && key.length === 10 && !mergeMap.has(key)) {
        mergeMap.set(key, {
          b_no: key,
          b_nm: item.corpNm,
          p_nm: item.enpRprFnm,
          b_adr: item.enpBsadr || "-",
          b_sector: item.enpIndyNm || "-",
          dataSource: "public",
          is_sme: item.enpEntprScaleNm || "일반기업",
          listing_status: "비상장"
        });
      }
    });

    results = Array.from(mergeMap.values());
  }

  if (results.length > 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <span style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", fontWeight: 600 }}>
          검색 완료 ({results.length}건의 기업 매칭)
        </span>
        {results.map((item) => (
          <Link 
            href={`/biz/${item.b_no}`} 
            key={item.b_no}
            style={{
              display: "block",
              padding: "24px",
              borderRadius: "18px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              boxShadow: "var(--shadow-sm)",
              transition: "var(--transition-smooth)"
            }}
            className="related-card"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                  {item.b_nm}
                </h3>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 500 }}>
                  대표자: {item.p_nm} | 사업자번호: {item.b_no.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")}
                </span>
              </div>
              
              {item.dataSource === "local" ? (
                <span style={{
                  backgroundColor: "rgba(45, 202, 115, 0.1)",
                  color: "#2dca73",
                  fontSize: "0.75rem",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontWeight: 700
                }}>
                  상세 분석 정보 제공
                </span>
              ) : (
                <span style={{
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  color: "var(--color-text-desc)",
                  fontSize: "0.75rem",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontWeight: 600
                }}>
                  공공 기본 정보
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.88rem", color: "var(--color-text-sub)" }}>
              <div>📍 {item.b_adr}</div>
              <div>🏢 {item.b_sector} | {item.is_sme} | {item.listing_status}</div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return <NoSearchResultSection searchQuery={searchQuery} />;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.query ? decodeURIComponent(resolvedParams.query).trim() : "";

  return (
    <div className="animate-fade-in" style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "720px" }}>

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--color-text-main)",
            marginBottom: "8px"
          }}>
            &ldquo;{searchQuery}&rdquo; 검색 결과
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-desc)" }}>
            로컬 검증 기업 DB 및 대한민국 금융위원회 법인공시 DB를 통합 검색한 결과입니다.
          </p>
        </div>

        {/* 재검색 폼 */}
        <div style={{ marginBottom: "40px" }}>
          <SearchForm />
        </div>

        {searchQuery ? (
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResultList searchQuery={searchQuery} />
          </Suspense>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "80px 24px",
            border: "1px dashed var(--color-border)",
            borderRadius: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.005)"
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "8px" }}>
              검색어를 입력해 주세요
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", maxWidth: "400px", margin: "0 auto 0 auto" }}>
              사업자등록번호, 상호명, 대표자명 또는 지역명을 입력하여 조회할 수 있습니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}


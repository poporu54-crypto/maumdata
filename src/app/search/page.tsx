import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import SearchForm from "@/components/SearchForm";
import { searchCorpOutline, CorpBasicOutline } from "@/lib/corpApi";

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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { query } = await searchParams;
  const searchQuery = query ? decodeURIComponent(query).trim() : "";

  let results: UnifiedSearchResult[] = [];

  if (searchQuery.length >= 2) {
    // 1. 로컬 DB에서 상호명/대표자명/사업자번호 부분 일치 검색
    let localMatches: UnifiedSearchResult[] = [];
    try {
      const filePath = path.join(process.cwd(), "src/data/businesses.json");
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const list = JSON.parse(fileContent);
        
        localMatches = list
          .filter((item: any) => {
            const nameMatch = (item.b_nm || "").toLowerCase().includes(searchQuery.toLowerCase());
            const ownerMatch = (item.p_nm || "").toLowerCase().includes(searchQuery.toLowerCase());
            
            const cleanSearchNumber = searchQuery.replace(/[^0-9]/g, "");
            const numMatch = cleanSearchNumber !== "" && (item.b_no || "").replace(/[^0-9]/g, "").includes(cleanSearchNumber);
            
            return nameMatch || ownerMatch || numMatch;
          })
          .map((item: any) => ({
            b_no: item.b_no,
            b_nm: item.b_nm,
            p_nm: item.p_nm,
            b_adr: item.b_adr || "-",
            b_sector: item.b_type || item.b_sector || "-",
            dataSource: "local",
            is_sme: item.is_sme,
            listing_status: item.listing_status
          }));
      }
    } catch (err) {
      console.error("Failed to read local DB for search:", err);
    }

    // 2. 금융위 기업기본정보 API 검색
    let publicMatches: CorpBasicOutline[] = [];
    try {
      publicMatches = await searchCorpOutline(searchQuery);
    } catch (err) {
      console.error("Failed to fetch public api for search:", err);
    }

    // 3. 중복을 제거하며 병합 (로컬 데이터 우선 매핑 - 지윤 주식회사 등 정보보호)
    const mergeMap = new Map<string, UnifiedSearchResult>();

    // 로컬 매칭을 먼저 등록 (우선순위 1위)
    localMatches.forEach(item => {
      const key = item.b_no.replace(/[^0-9]/g, "");
      if (key) mergeMap.set(key, item);
    });

    // 공공 API 매칭을 후속 등록 (로컬에 없는 경우만)
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

  // 퀵 서치 링크 추천용
  const quickLinks = [
    { name: "지윤 주식회사", no: "1378651839" },
    { name: "토스 (비바리퍼블리카)", no: "1208801280" },
    { name: "네이버 (NAVER)", no: "2208162517" },
    { name: "스타벅스 코리아", no: "2018121515" },
  ];

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

        {/* 결과 섹션 */}
        <div>
          {results.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                fontSize: "0.85rem",
                color: "var(--color-text-desc)",
                fontWeight: 700,
                marginBottom: "4px"
              }}>
                총 {results.length}건의 매칭된 기업이 발견되었습니다.
              </div>

              {results.map((item) => {
                const formattedBNo = item.b_no.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");
                return (
                  <Link 
                    key={item.b_no} 
                    href={`/biz/${item.b_no}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div 
                      className="card hover-translate"
                      style={{
                        padding: "24px",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--bg-color-card)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        transition: "var(--transition-smooth)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "1.4rem" }}>🏢</span>
                          <span style={{
                            fontSize: "1.15rem",
                            fontWeight: 800,
                            color: "var(--color-text-main)"
                          }}>
                            {item.b_nm}
                          </span>
                        </div>
                        {/* 데이터 소스 배지 */}
                        {item.dataSource === "local" ? (
                          <span style={{
                            backgroundColor: "var(--color-primary-light)",
                            color: "var(--color-primary)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "20px"
                          }}>
                            ✓ 마음데이터 검증
                          </span>
                        ) : (
                          <span style={{
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            color: "var(--color-text-desc)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "20px"
                          }}>
                            공공데이터 연동
                          </span>
                        )}
                      </div>

                      {/* 핵심 요약 그리드 */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "8px 16px",
                        padding: "12px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.015)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.02)"
                      }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)" }}>
                          대표자: <strong style={{ color: "var(--color-text-sub)" }}>{item.p_nm || "-"}</strong>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)" }}>
                          사업자번호: <strong style={{ color: "var(--color-text-sub)" }}>{formattedBNo}</strong>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", gridColumn: "span 2" }}>
                          주업종: <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>{item.b_sector}</span>
                        </div>
                      </div>

                      {/* 주소 정보 */}
                      <div style={{
                        fontSize: "0.8rem",
                        color: "var(--color-text-desc)",
                        display: "flex",
                        gap: "6px",
                        alignItems: "center"
                      }}>
                        <span>📍</span>
                        <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {item.b_adr}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="card" style={{
              padding: "48px 32px",
              textAlign: "center",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px"
            }}>
              <div style={{ fontSize: "3rem" }}>🔍</div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
                  검색 결과가 없습니다
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-desc)", lineHeight: 1.5 }}>
                  입력하신 키워드 &ldquo;<strong>{searchQuery}</strong>&rdquo; 에 매칭되는 공공 법인 또는 검증 기업 정보가 존재하지 않습니다.<br />
                  검색어의 철자가 올바른지 확인하시거나, 다른 검색어로 다시 검색해 주세요.
                </p>
              </div>

              {/* 추천 바로가기 링크 */}
              <div style={{ marginTop: "12px", width: "100%", maxWidth: "400px" }}>
                <div style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-sub)",
                  fontWeight: 700,
                  marginBottom: "10px"
                }}>
                  💡 이런 기업 정보는 어떠신가요?
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  {quickLinks.map((link) => (
                    <Link
                      key={link.no}
                      href={`/biz/${link.no}`}
                      style={{
                        padding: "10px 16px",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "10px",
                        fontSize: "0.85rem",
                        color: "var(--color-text-sub)",
                        fontWeight: 600,
                        textDecoration: "none",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "var(--transition-smooth)"
                      }}
                      className="related-card"
                    >
                      <span>🏢 {link.name}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-primary)" }}>바로가기 ➔</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

import React, { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

// 외부 공통 컴포넌트 임포트
import AdBanner from "@/components/AdBanner";
import EditRequestTrigger from "@/components/EditRequestTrigger";
import B2BColorStatus from "@/components/B2BColorStatus";

// 분리한 유틸 헬퍼 및 데이터 로더 임포트
import { 
  formatDate, 
  formatCrno, 
  formatSyncTime, 
  formatJosa,
} from "./utils/helpers";
import { 
  getUnifiedBusinessData, 
} from "./utils/dataLoader";

// 분리한 서브 컴포넌트 임포트
import { 
  SectionSkeleton, 
  TableSkeleton, 
  RecommendedSkeleton 
} from "./components/Skeletons";
import { 
  BidsSection, 
  PatentsSection, 
  DartDisclosuresSection, 
  DartKeyDisclosuresSection, 
  TimelineSection,
  RecommendedSection
} from "./components/DetailSections";
import { 
  SalarySection, 
  IndustrySection,
  InsightSection,
  FinancialTableSection
} from "./components/AnalysisSections";
import SyncTrigger from "./components/SyncTrigger";

export const dynamic = "force-dynamic";

// 1. 동적 SEO 메타데이터 생성
export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const resolvedParams = await params;
  const bNo = resolvedParams.b_no;
  
  const { apiStatus, business, isInvalid } = await getUnifiedBusinessData(bNo);
  const formattedBNo = bNo.replace(/[^0-9]/g, "").replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");

  if (isInvalid || !business) {
    return {
      title: `미등록 사업자번호 ${formattedBNo} 조회 결과`,
      description: `사업자등록번호 ${formattedBNo}는 현재 국세청에 등록되지 않았거나 삭제된 유효하지 않은 사업자 번호입니다.`,
    };
  }

  const name = business.b_nm;
  const status = apiStatus?.b_stt || "계속사업자";
  const taxType = apiStatus?.tax_type || "부가가치세 일반과세자";

  return {
    title: `${name} | 사업자등록번호 ${formattedBNo} 실시간 상태 및 기업정보`,
    description: `${name}(사업자번호 ${formattedBNo})의 현재 상태는 [${status} (${taxType})] 입니다. 주소: ${business.b_adr}. 업종: ${business.b_sector} | 마음데이터 민간 기업 정보 포털`,
    openGraph: {
      title: `${name} (${formattedBNo}) 실시간 사업자 조회`,
      description: `${name}의 국세청 실시간 납세자 상태(${status}), 주소, 매출 추이 및 기업 분석 정보를 제공합니다.`,
      type: "website",
    },
  };
}

export default async function BusinessDetailPage({ params }: { params: any }) {
  const resolvedParams = await params;
  const bNo = resolvedParams.b_no;

  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  if (cleanBNo.length !== 10) {
    notFound();
  }

  const { apiStatus, business, isInvalid, isNew } = await getUnifiedBusinessData(cleanBNo);
  const formattedBNo = cleanBNo.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");

  const renderSourceBadge = () => {
    if (!business) return null;
    const sources = {
      public: { text: "금융위원회 공시 정보", color: "#3182f6", bg: "rgba(49, 130, 246, 0.1)" },
      local: { text: "마음데이터 파트너 정보", color: "#2dca73", bg: "rgba(45, 202, 115, 0.1)" },
      estimated: { text: "추정 데이터 분석치", color: "#8b95a1", bg: "var(--bg-color-main)" }
    };
    const badge = sources[business.dataSource];
    return (
      <span style={{
        backgroundColor: badge.bg,
        color: badge.color,
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: 700,
        border: `1px solid ${badge.color}22`
      }}>
        {badge.text}
      </span>
    );
  };

  const latestFinance = business?.history && business.history.length > 0
    ? business.history[business.history.length - 1]
    : null;
  const latestEmployees = latestFinance?.employees || 0;

  const jsonLd = business ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": business.b_nm,
    "image": "https://www.maumdata.com/images/default-company.png",
    "@id": `https://www.maumdata.com/biz/${cleanBNo}`,
    "url": `https://www.maumdata.com/biz/${cleanBNo}`,
    "telephone": "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": business.b_adr,
      "addressLocality": business.b_adr.split(" ")[0],
      "addressCountry": "KR"
    },
    "taxID": formattedBNo,
    "foundingDate": business.start_dt.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
  } : null;

  return (
    <div className="animate-fade-in" style={{ padding: "24px 0 80px 0" }}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="container" style={{ maxWidth: "800px" }}>
        {/* 비동기 동기화 트리거 컴포넌트 장착 */}
        <SyncTrigger bNo={cleanBNo} isNew={isNew} />

        {isInvalid ? (
          <div className="card" style={{
            textAlign: "center",
            padding: "48px 24px",
            borderColor: "var(--color-danger)"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "12px", color: "var(--color-danger)" }}>
              등록되지 않은 사업자등록번호
            </h2>
            <p style={{
              color: "var(--color-text-sub)",
              lineHeight: 1.6,
              maxWidth: "500px",
              margin: "0 auto 24px auto"
            }}>
              입력하신 <strong>{formattedBNo}</strong> 번호는 국세청에 등록되지 않았거나, 당사 시스템 DB에 사전 수집 및 적재되어 있지 않은 미등록 사업자 번호입니다.
            </p>
            <div style={{
              backgroundColor: "var(--bg-color-main)",
              padding: "16px",
              borderRadius: "12px",
              display: "inline-flex",
              flexDirection: "column",
              gap: "8px",
              textAlign: "left",
              fontSize: "0.85rem",
              color: "var(--color-text-desc)"
            }}>
              <div>• 국세청 API 응답 메시지: {apiStatus?.tax_type || "확인 불가"}</div>
              <div>• 조회 시각: {new Date().toLocaleString("ko-KR")}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 기업 요약 헤더 카드 */}
            <div className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.95rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                      사업자등록번호 {formattedBNo}
                    </span>
                    {isNew ? (
                      <span style={{
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                        color: "rgb(245, 158, 11)",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        animation: "pulse 1.5s infinite"
                      }}>
                        ⚡ 실시간 검증 진행 중
                      </span>
                    ) : (
                      <span style={{
                        backgroundColor: "var(--color-primary-light)",
                        color: "var(--color-primary)",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700
                      }}>
                        ✓ 실시간 검증 완료
                      </span>
                    )}
                    {renderSourceBadge()}
                  </div>
                  <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-text-main)", letterSpacing: "-0.02em" }}>
                    {business?.b_nm}
                    {(() => {
                      const brandPrefix = business?.brand_name?.split(",")[0].trim() || "";
                      const hasValidBrand = brandPrefix && 
                                            brandPrefix !== business?.b_nm && 
                                            brandPrefix !== "상호 미등록 사업자" && 
                                            brandPrefix !== "상호 정보 없음";
                      return hasValidBrand ? (
                        <span style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--color-text-desc)", marginLeft: "12px", display: "inline-block", verticalAlign: "middle" }}>
                          ({brandPrefix})
                        </span>
                      ) : null;
                    })()}
                  </h1>
                </div>

                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: isNew 
                    ? "rgba(245, 158, 11, 0.1)" 
                    : (apiStatus?.b_stt_cd === "01" ? "rgba(45, 202, 115, 0.1)" : "rgba(240, 68, 56, 0.1)"),
                  color: isNew 
                    ? "rgb(245, 158, 11)" 
                    : (apiStatus?.b_stt_cd === "01" ? "var(--color-success)" : "var(--color-danger)"),
                  padding: "10px 18px",
                  borderRadius: "30px",
                  fontWeight: 700,
                  fontSize: "1rem"
                }}>
                  <span style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: isNew 
                      ? "rgb(245, 158, 11)" 
                      : (apiStatus?.b_stt_cd === "01" ? "var(--color-success)" : "var(--color-danger)"),
                    display: "inline-block"
                  }}></span>
                  <span>{isNew ? "조회 중" : (apiStatus?.b_stt || "계속사업자")}</span>
                </div>
              </div>

              <p style={{
                color: "var(--color-text-sub)",
                fontSize: "1.05rem",
                lineHeight: 1.6,
                fontWeight: 500,
                borderLeft: "4px solid var(--color-primary)",
                paddingLeft: "16px",
                margin: 0
              }}>
                {formatJosa(business?.description)}
              </p>

              {business?.b_nm === "상호 정보 없음" && (
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginTop: "12px" }}>
                  <EditRequestTrigger
                    bNo={cleanBNo}
                    currentBusinessName={business.b_nm}
                    currentBrandName={business.brand_name || ""}
                    currentHomepage={business.homepage || ""}
                    currentDescription={business.description || ""}
                  />
                </div>
              )}
            </div>

            {/* 실시간 거래처 휴폐업 리스크 신호등 위젯 */}
            <B2BColorStatus
              bNo={cleanBNo}
              initialTaxType={apiStatus?.tax_type || "부가가치세 일반과세자"}
              initialTaxTypeCd={apiStatus?.tax_type_cd || "01"}
              initialBStt={apiStatus?.b_stt || "계속사업자"}
              initialBSttCd={apiStatus?.b_stt_cd || "01"}
              ntsLastSyncAt={business?.ntsLastSyncAt}
            />

            {/* 기본 정보 그리드 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "24px"
            }}>
              
              <div className="card" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "20px" }}>
                  실시간 기업 납세 상태 지표
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>현재 사업자 상태</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {apiStatus?.b_stt || "계속사업자"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>현재 과세 유형</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)", textAlign: "right" }}>
                      {apiStatus?.tax_type || "일반과세자"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>직전 과세 유형</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)", textAlign: "right" }}>
                      {apiStatus?.rbf_tax_type || "해당없음"}
                    </span>
                  </div>
                  {apiStatus?.tax_type_change_dt && (
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>최근 과세유형 전환일</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                        {formatDate(apiStatus.tax_type_change_dt)}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "2px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>검증 시각</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-desc)" }}>
                      {business ? formatSyncTime(business.ntsLastSyncAt) : "방금 전 (실시간)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "20px" }}>
                  기업 종합 법적/기본 개요
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>상호명</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)", textAlign: "right" }}>
                      {business?.b_nm} {business?.corpEnm ? `(${business.corpEnm})` : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>대표자 성명</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {business?.p_nm}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>개업/설립 연월일</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {formatDate(business?.start_dt || "")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>법인등록번호</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {formatCrno(business?.corp_no || business?.crno || "")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>기업구분</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {business?.enpDivNm || business?.b_type || "-"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>중소기업 여부</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {business?.is_sme || "-"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>상장 여부</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {business?.listing_status || (business?.enpPbncYn === "Y" ? "상장" : "비상장")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>주업종</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)", textAlign: "right" }}>
                      {business?.main_biz || (business?.goodsType ? `전자상거래 (${business.goodsType})` : business?.b_sector) || "-"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "2px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>홈페이지</span>
                    {business?.homepage && business.homepage !== "-" ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end", maxWidth: "250px", textAlign: "right" }}>
                        {business.homepage.split(",").map((url, idx, arr) => {
                          const cleanUrl = url.trim();
                          if (!cleanUrl) return null;
                          const href = cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://") 
                            ? cleanUrl 
                            : `http://${cleanUrl}`;
                          return (
                            <React.Fragment key={idx}>
                              <a href={href} target="_blank" rel="noopener noreferrer" style={{
                                fontWeight: 700,
                                color: "var(--color-primary)",
                                textDecoration: "underline",
                                wordBreak: "break-all"
                              }}>
                                {cleanUrl}
                              </a>
                              {idx < arr.length - 1 && <span style={{ color: "var(--color-text-desc)" }}>,</span>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600, color: "var(--color-text-desc)" }}>-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 연계 기관 상세 정보 카드 */}
              <div className="card" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "20px" }}>
                  연계 기관 상세 정보 및 실시간 연동 지표
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>결산월</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {business?.enpStacNm || "12월 결산"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>대표 전화번호</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {business?.enpTlno || business?.telNo || "-"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>팩스 번호</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {business?.enpFxno || "-"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>우편번호</span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                      {business?.enpPncd || business?.zipCd || "-"}
                    </span>
                  </div>
                  {business?.enpMainBizNm && (
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>주요 사업 내용</span>
                      <span style={{ fontWeight: 600, color: "var(--color-text-main)", textAlign: "right", maxWidth: "250px", wordBreak: "break-all" }}>
                        {business.enpMainBizNm}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px", alignItems: "center" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>종업원 수</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: "var(--color-primary)", whiteSpace: "nowrap" }}>
                        {latestEmployees > 0 ? `${latestEmployees.toLocaleString()}명` : "-"}
                      </span>
                      {business?.npsLinked && (
                        <span style={{
                          backgroundColor: "rgba(45, 202, 115, 0.1)",
                          color: "var(--color-success)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          border: "1px solid rgba(45, 202, 115, 0.2)",
                          whiteSpace: "nowrap"
                        }}>
                          국민연금 연동
                        </span>
                      )}
                    </div>
                  </div>
                  {business?.npsLinked && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                        <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>당월 국민연금 신규 취득</span>
                        <span style={{ fontWeight: 700, color: "var(--color-success)" }}>
                          +{business.newAcqsNmps?.toLocaleString() || 0}명
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                        <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>당월 국민연금 상실</span>
                        <span style={{ fontWeight: 700, color: "var(--color-danger)" }}>
                          -{business.lossSbscrbNmps?.toLocaleString() || 0}명
                        </span>
                      </div>
                    </>
                  )}
                  {business?.basDt && (
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "2px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>공공 데이터 기준일자</span>
                      <span style={{ fontWeight: 600, color: "var(--color-text-desc)" }}>
                        {formatDate(business.basDt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 통신판매업자 신고 정보 또는 기업 평가 및 신용 지표 */}
              {business?.mailOrderNo ? (
                <div className="card" style={{ padding: "28px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "20px" }}>
                    🛍️ 통신판매업 신고 상세 정보
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>통신판매번호</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                        {business.mailOrderNo}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>신고 기관</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                        {business.declareOrg || "-"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>취급 품목</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)", textAlign: "right" }}>
                        {business.goodsType || "-"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>판매 방식</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                        {business.sellType || "-"}
                      </span>
                    </div>
                    {business.repEmail && (
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                        <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>대표 이메일</span>
                        <span style={{ fontWeight: 700, color: "var(--color-text-main)", wordBreak: "break-all" }}>
                          {business.repEmail}
                        </span>
                      </div>
                    )}
                    {business.closeDate && business.closeDate !== "-" && (
                      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "2px" }}>
                        <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>통신판매 폐업일</span>
                        <span style={{ fontWeight: 700, color: "var(--color-danger)" }}>
                          {formatDate(business.closeDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: "28px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "20px" }}>
                    🛡️ 기업 신용 평가 및 시장 지표
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>기업 신용등급</span>
                      <span style={{
                        fontWeight: 700,
                        color: business?.credit_rating && business.credit_rating !== "-" ? "var(--color-primary)" : "var(--color-text-desc)"
                      }}>
                        {business?.credit_rating && business.credit_rating !== "-" ? business.credit_rating : "평가 보류/일반 관리"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>업계 시장 점유율</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                        {business?.industry_rank && business.industry_rank !== "-" ? business.industry_rank : "순위 정보 없음"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>외부 감사 여부</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                        {business?.is_audited ? "외부감사 대상 법인 (외감)" : "일반 관리 대상"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>상장 구분</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                        {business?.listing_status || (business?.enpPbncYn === "Y" ? "상장" : "비상장")}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "2px" }}>
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>정합성 상태</span>
                      <span style={{
                        fontWeight: 700,
                        color: "var(--color-success)",
                        backgroundColor: "rgba(45, 202, 115, 0.1)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.78rem"
                      }}>
                        실시간 검증 완료
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <AdBanner />

            {/* 소재지 주소 */}
            <div className="card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>📍</span>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                  사업장 소재지 주소
                </h4>
              </div>
              <p style={{
                fontSize: "1.1rem",
                color: "var(--color-text-sub)",
                fontWeight: 600,
                lineHeight: 1.5,
                backgroundColor: "var(--bg-color-main)",
                padding: "16px 20px",
                borderRadius: "12px",
                border: "1px solid var(--color-border)"
              }}>
                {business?.b_adr}
              </p>
            </div>

            {/* 예상 평균 연봉/HR 지표 및 동종 업종/업계 순위 분석 대시보드 */}
            {business && (
              <SalarySection business={business} />
            )}

            {business && business.b_sector && (
              <Suspense fallback={<SectionSkeleton />}>
                <IndustrySection bSector={business.b_sector} bNo={cleanBNo} />
              </Suspense>
            )}

            {/* 재무/고용 요약 대시보드 */}
            {business && (
              <InsightSection business={business} />
            )}

            {/* 3개년 공식 재무제표 요약 테이블 */}
            {business && (
              <FinancialTableSection business={business} />
            )}

            {/* 3. 실시간 공공 입찰공고 및 계약 현황 */}
            <div style={{ marginTop: "32px" }}>
              <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                🏛️ 조달청 나라장터 입찰공고 매칭 내역
              </h4>
              <Suspense fallback={<SectionSkeleton />}>
                <BidsSection companyNm={business?.b_nm || ""} bNo={cleanBNo} />
              </Suspense>
            </div>

            {/* 4. 지식재산권 (특허/상표) 포트폴리오 */}
            <div style={{ marginTop: "32px", marginBottom: "16px" }}>
              <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                💡 보유 특허 및 지식재산권(IP) 포트폴리오
              </h4>
              <Suspense fallback={<TableSkeleton />}>
                <PatentsSection companyNm={business?.b_nm || ""} pNm={business?.p_nm || ""} />
              </Suspense>
            </div>

            {/* 5. 금융감독원 DART 실시간 공시 목록 */}
            {business?.is_audited && (
              <div id="dart-disclosures-section" style={{ marginTop: "32px", marginBottom: "16px", scrollMarginTop: "24px" }}>
                <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                  🏛️ 금융감독원 DART 실시간 공시 내역
                </h4>
                {business.dart_code ? (
                  <Suspense fallback={<TableSkeleton />}>
                    <DartDisclosuresSection dartCode={business.dart_code} />
                  </Suspense>
                ) : (
                  <div style={{
                    padding: "24px",
                    borderRadius: "14px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    textAlign: "center",
                    fontSize: "0.88rem",
                    color: "var(--color-text-desc)"
                  }}>
                    DART 고유번호 매핑 정보가 등록되지 않아 공시 내역을 연동할 수 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 6. 금융감독원 DART 주요 실적/정기 보고서 */}
            {business?.is_audited && (
              <div style={{ marginTop: "32px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                  📊 금융감독원 DART 분기별 실적/정기 보고서
                </h4>
                {business.dart_code ? (
                  <Suspense fallback={<TableSkeleton />}>
                    <DartKeyDisclosuresSection dartCode={business.dart_code} />
                  </Suspense>
                ) : (
                  <div style={{
                    padding: "24px",
                    borderRadius: "14px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    textAlign: "center",
                    fontSize: "0.88rem",
                    color: "var(--color-text-desc)"
                  }}>
                    최근 3년 간의 사업/반기/분기보고서 공시 내역이 존재하지 않습니다.
                  </div>
                )}
              </div>
            )}

            {/* 기업 연혁 및 상호 변경 히스토리 */}
            {(() => {
              const timelineData = (business?.historyTimeline && business.historyTimeline.length > 0)
                ? business.historyTimeline
                : (business?.start_dt && business.start_dt !== "-" && business.start_dt.replace(/[^0-9]/g, "").length === 8
                  ? [{ eventDate: business.start_dt, eventTitle: "법인 설립", eventDescription: `${business.b_nm} 설립 및 개업` }]
                  : []);
              return (
                <TimelineSection
                  timeline={timelineData}
                  bNo={cleanBNo}
                  brandName={business?.brand_name || ""}
                  homepage={business?.homepage || ""}
                  description={business?.description || ""}
                />
              );
            })()}

            {/* 연관 사업자 추천 */}
            <div style={{ marginTop: "16px" }}>
              <h3 style={{
                fontSize: "0.95rem",
                color: "var(--color-text-desc)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "14px",
                paddingLeft: "4px"
              }}>
                주변 기업 및 추천 관련 사업자
              </h3>
              <Suspense fallback={<RecommendedSkeleton />}>
                <RecommendedSection
                  cleanBNo={cleanBNo}
                  bAdr={business?.b_adr || ""}
                  bSector={business?.b_sector || ""}
                  isSme={business?.is_sme || ""}
                />
              </Suspense>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

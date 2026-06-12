import React from "react";
import Link from "next/link";
import { getRecentBidsByCompany } from "@/lib/procurementApi";
import { getPatentsByCompany } from "@/lib/patentApi";
import { getRecentDisclosures, getRecentKeyDisclosures } from "@/lib/dartApi";
import { getRecommendedBusinesses } from "@/lib/db";
import { formatMoney, formatEventDate } from "../utils/helpers";
import EditRequestTrigger from "@/components/EditRequestTrigger";
import AdBanner from "@/components/AdBanner";
import { BusinessData } from "../utils/dataLoader";

// 1. 추천 비즈니스 연동용 비동기 컴포넌트
export async function RecommendedSection({
  cleanBNo,
  bAdr,
  bSector,
  isSme
}: {
  cleanBNo: string;
  bAdr: string;
  bSector: string;
  isSme: string;
}) {
  const recommended = await getRecommendedBusinesses(cleanBNo, bAdr, bSector, isSme);
  const relatedList = recommended.map(r => ({
    name: r.b_nm,
    no: r.b_no
  }));

  if (relatedList.length === 0) return null;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      gap: "12px"
    }}>
      {relatedList.map((item) => (
        <Link
          key={item.no}
          href={`/biz/${item.no}`}
          className="related-card"
        >
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "6px" }}>
            {item.no.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")}
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
            {item.name}
          </div>
        </Link>
      ))}
    </div>
  );
}

// 2. 조달청 나라장터 입찰공고 컴포넌트
export async function BidsSection({ companyNm, bNo }: { companyNm: string; bNo: string }) {
  const bids = await getRecentBidsByCompany(companyNm, bNo);

  const totalAmount = bids.reduce((acc, curr) => acc + (curr.presmptPrce || 0), 0);

  let b2gGrade = "E";
  let b2gGradeDesc = "B2G 실적 없음";
  let gradeColor = "#718096";
  let gradeBg = "rgba(113, 128, 150, 0.1)";

  if (totalAmount >= 1000000000) {
    b2gGrade = "S";
    b2gGradeDesc = "B2G 선도 명가";
    gradeColor = "#ff3366";
    gradeBg = "rgba(255, 51, 102, 0.15)";
  } else if (totalAmount >= 500000000) {
    b2gGrade = "A";
    b2gGradeDesc = "B2G 우수 파트너";
    gradeColor = "#3182f6";
    gradeBg = "rgba(49, 130, 246, 0.15)";
  } else if (totalAmount >= 200000000) {
    b2gGrade = "B";
    b2gGradeDesc = "B2G 유망 파트너";
    gradeColor = "#10b981";
    gradeBg = "rgba(16, 185, 129, 0.15)";
  } else if (totalAmount > 0) {
    b2gGrade = "C";
    b2gGradeDesc = "B2G 도약 파트너";
    gradeColor = "#f59e0b";
    gradeBg = "rgba(245, 158, 11, 0.15)";
  }

  const contractTypes = bids.map(b => b.cntrctCnclMthdNm || "");
  const safeContracts = contractTypes.filter(t => t.includes("수의") || t.includes("제한") || t.includes("적격")).length;
  const safeContractRatio = bids.length > 0 ? (safeContracts / bids.length) : 0;
  
  const cashFlowScore = bids.length > 0 ? Math.min(100, Math.round(60 + (safeContractRatio * 30) + (bids.length * 2.5))) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        background: "linear-gradient(135deg, rgba(26, 32, 44, 0.7) 0%, rgba(17, 20, 28, 0.9) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderRight: "1px solid rgba(255,255,255,0.06)", paddingRight: "16px" }}>
          <span style={{ fontSize: "0.82rem", color: "#a0aec0", fontWeight: 700 }}>B2G 정부 입찰 역량 등급</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <span style={{
              fontSize: "2.4rem",
              fontWeight: 900,
              color: gradeColor,
              backgroundColor: gradeBg,
              width: "60px",
              height: "60px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${gradeColor}33`,
              boxShadow: `0 0 15px ${gradeColor}11`
            }}>
              {b2gGrade}
            </span>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f7fafc" }}>{b2gGradeDesc}</div>
              <div style={{ fontSize: "0.78rem", color: "#718096", marginTop: "2px" }}>최근 나라장터 수주 실적 기반</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px", borderRight: "1px solid rgba(255,255,255,0.06)", paddingRight: "16px" }}>
          <span style={{ fontSize: "0.82rem", color: "#a0aec0", fontWeight: 700 }}>누적 공공 수주 사업 규모</span>
          <div style={{ marginTop: "12px" }}>
            <span style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--color-primary)" }}>
              {totalAmount >= 100000000 
                ? `${(totalAmount / 100000000).toFixed(1)}억` 
                : `${(totalAmount / 10000).toLocaleString()}만`}
            </span>
            <span style={{ fontSize: "0.9rem", color: "#718096", fontWeight: 600, marginLeft: "4px" }}>원</span>
            <div style={{ fontSize: "0.78rem", color: "#718096", marginTop: "8px" }}>
              총 {bids.length}개 사업 참여 매칭
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px" }}>
          <span style={{ fontSize: "0.82rem", color: "#a0aec0", fontWeight: 700 }}>안정적 현금 흐름 지수</span>
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.7rem", fontWeight: 800, color: bids.length > 0 ? (cashFlowScore >= 80 ? "#10b981" : "#f59e0b") : "#718096" }}>
                {bids.length > 0 ? cashFlowScore : "-"}
              </span>
              <span style={{ fontSize: "0.85rem", color: "#718096", fontWeight: 700 }}>/ 100 점</span>
            </div>
            <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{
                width: `${bids.length > 0 ? cashFlowScore : 0}%`,
                height: "100%",
                backgroundColor: bids.length > 0 ? (cashFlowScore >= 80 ? "#10b981" : "#f59e0b") : "#718096",
                borderRadius: "3px",
                boxShadow: bids.length > 0 ? `0 0 8px ${cashFlowScore >= 80 ? "#10b981" : "#f59e0b"}99` : "none"
              }} />
            </div>
            <div style={{ fontSize: "0.75rem", color: "#718096", marginTop: "8px" }}>
              대금 조기 회수 및 안정적 매출 기여
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {bids.length > 0 ? (
          bids.map((bid, index) => (
            <div 
              key={`${bid.bidNtceNo}-${bid.bidNtceOrd || index}`} 
              style={{
                padding: "20px",
                border: "1px solid var(--color-border)",
                borderRadius: "14px",
                backgroundColor: "var(--bg-color-card)",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", fontWeight: 700, display: "inline-block", marginBottom: "4px" }}>
                    공고번호: {bid.bidNtceNo}-{bid.bidNtceOrd} | {bid.cntrctCnclMthdNm}
                  </span>
                  <h5 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--color-text-main)", margin: "4px 0 0 0" }}>
                    {bid.bidNtceNm}
                  </h5>
                </div>
                <a 
                  href={bid.detailUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-primary)",
                    fontWeight: 700,
                    textDecoration: "underline",
                    whiteSpace: "nowrap"
                  }}
                >
                  공고 원본 보기 ➔
                </a>
              </div>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "6px 12px",
                padding: "10px 14px",
                backgroundColor: "rgba(255, 255, 255, 0.015)",
                borderRadius: "10px",
                fontSize: "0.85rem"
              }}>
                <div style={{ color: "var(--color-text-desc)" }}>
                  수요기관: <strong style={{ color: "var(--color-text-sub)" }}>{bid.dminsttNm}</strong>
                </div>
                <div style={{ color: "var(--color-text-desc)" }}>
                  공고 등록일: <strong style={{ color: "var(--color-text-sub)" }}>{bid.bidNtceDt}</strong>
                </div>
                <div style={{ color: "var(--color-text-desc)", gridColumn: "span 2" }}>
                  추정사업금액: <strong style={{ color: "var(--color-primary)" }}>{bid.presmptPrce.toLocaleString()}원</strong>
                </div>
              </div>
            </div>
          ))
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
            최근 등록된 입찰/낙찰 공고 매칭 내역이 존재하지 않습니다.
          </div>
        )}
      </div>
    </div>
  );
}

// 3. 특허 및 지식재산권 컴포넌트
export async function PatentsSection({ companyNm, pNm }: { companyNm: string, pNm: string }) {
  const patents = await getPatentsByCompany(companyNm, pNm);

  const tagMap: Record<string, string[]> = {
    "#빅데이터": ["데이터", "DB", "분석", "데이터베이스", "통계"],
    "#인공지능": ["인공지능", "AI", "지능형", "머신러닝", "딥러닝", "기계학습", "뉴럴", "분류"],
    "#클라우드": ["클라우드", "분산", "서버", "가상화", "인프라", "마이그레이션"],
    "#정보보안": ["보안", "인증", "암호", "블록체인", "해시", "위변조"],
    "#자동화기술": ["자동", "제어", "로봇", "워크플로우", "트래킹", "추적"],
    "#알고리즘": ["알고리즘", "모델", "학습", "매핑", "필터링"],
    "#플랫폼서비스": ["플랫폼", "포털", "서비스", "통합", "네트워크"]
  };

  const extractedTagsSet = new Set<string>();
  patents.forEach(pat => {
    const title = pat.inventionTitle;
    Object.entries(tagMap).forEach(([tag, keywords]) => {
      if (keywords.some(kw => title.includes(kw))) {
        extractedTagsSet.add(tag);
      }
    });
  });

  if (extractedTagsSet.size === 0 && patents.length > 0) {
    extractedTagsSet.add("#독점기술");
    extractedTagsSet.add("#원천특허");
  }

  const tags = Array.from(extractedTagsSet).slice(0, 5);

  const registeredCount = patents.filter(p => p.patentStatus === "등록").length;
  const publishedCount = patents.filter(p => p.patentStatus === "공개").length;
  
  const rndScore = patents.length > 0 ? Math.min(100, (registeredCount * 25) + (publishedCount * 15)) : 0;

  let rndTier = "Tier 5";
  let rndTierTitle = "R&D 준비 단계";
  let tierColor = "#a0aec0";
  let tierBg = "rgba(160, 174, 192, 0.1)";

  if (patents.length === 0) {
    rndTier = "-";
    rndTierTitle = "평가 보류 (실적 없음)";
    tierColor = "#718096";
    tierBg = "rgba(113, 128, 150, 0.1)";
  } else if (rndScore >= 80) {
    rndTier = "Tier 1";
    rndTierTitle = "선도 혁신 기업";
    tierColor = "#a855f7";
    tierBg = "rgba(168, 85, 247, 0.15)";
  } else if (rndScore >= 60) {
    rndTier = "Tier 2";
    rndTierTitle = "R&D 최우수 기업";
    tierColor = "#ff3366";
    tierBg = "rgba(255, 51, 102, 0.15)";
  } else if (rndScore >= 40) {
    rndTier = "Tier 3";
    rndTierTitle = "R&D 유망 기업";
    tierColor = "#3182f6";
    tierBg = "rgba(49, 130, 246, 0.15)";
  } else if (rndScore >= 20) {
    rndTier = "Tier 4";
    rndTierTitle = "R&D 성장 기업";
    tierColor = "#10b981";
    tierBg = "rgba(16, 185, 129, 0.15)";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        background: "linear-gradient(135deg, rgba(26, 32, 44, 0.7) 0%, rgba(17, 20, 28, 0.9) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderRight: "1px solid rgba(255,255,255,0.06)", paddingRight: "16px" }}>
          <span style={{ fontSize: "0.82rem", color: "#a0aec0", fontWeight: 700 }}>기술 독점력 & R&D 혁신도</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <span style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              color: tierColor,
              backgroundColor: tierBg,
              width: "75px",
              height: "55px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${tierColor}33`,
              boxShadow: `0 0 15px ${tierColor}11`,
              textAlign: "center",
              lineHeight: 1.1
            }}>
              {rndTier}
            </span>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f7fafc" }}>{rndTierTitle}</div>
              <div style={{ fontSize: "0.78rem", color: "#718096", marginTop: "2px" }}>지식재산권(IP) 보유 규모 분석</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px", borderRight: "1px solid rgba(255,255,255,0.06)", paddingRight: "16px" }}>
          <span style={{ fontSize: "0.82rem", color: "#a0aec0", fontWeight: 700 }}>원천 기술 가치 스코어</span>
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.7rem", fontWeight: 800, color: patents.length > 0 ? tierColor : "#718096" }}>
                {patents.length > 0 ? rndScore : "-"}
              </span>
              <span style={{ fontSize: "0.85rem", color: "#718096", fontWeight: 700 }}>/ 100 점</span>
            </div>
            <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{
                width: `${patents.length > 0 ? rndScore : 0}%`,
                height: "100%",
                backgroundColor: patents.length > 0 ? tierColor : "#718096",
                borderRadius: "3px",
                boxShadow: patents.length > 0 ? `0 0 8px ${tierColor}99` : "none"
              }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px" }}>
          <span style={{ fontSize: "0.82rem", color: "#a0aec0", fontWeight: 700 }}>원천 기술 특허 도메인</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
            {tags.length > 0 ? (
              tags.map(tag => (
                <span key={tag} style={{
                  backgroundColor: "rgba(168, 85, 247, 0.1)",
                  color: "#c084fc",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700
                }}>
                  {tag}
                </span>
              ))
            ) : (
              <span style={{ fontSize: "0.8rem", color: "#718096" }}>추출된 기술 도메인 없음</span>
            )}
          </div>
        </div>
      </div>

      {patents.length > 0 ? (
        <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.88rem",
            backgroundColor: "var(--bg-color-card)"
          }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-color-main)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>권리 구분 (출원번호)</th>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>발명/상표 명칭</th>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>출원일자</th>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {patents.map((pat) => (
                <tr key={pat.applicationNumber} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ display: "block", fontWeight: 700, color: "var(--color-text-main)" }}>
                      특허권
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)" }}>
                      {pat.applicationNumber}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--color-text-sub)", maxWidth: "240px", wordBreak: "break-all" }}>
                    {pat.detailUrl ? (
                      <a 
                        href={pat.detailUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="patent-link"
                      >
                        {pat.inventionTitle} ↗
                      </a>
                    ) : (
                      pat.inventionTitle
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-desc)" }}>
                    {pat.applicationDate}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <span style={{
                      backgroundColor: pat.patentStatus === "등록" ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                      color: pat.patentStatus === "등록" ? "#10b981" : "var(--color-primary)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: "6px"
                    }}>
                      {pat.patentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          출원 또는 등록된 공식 특허 지식재산권 정보가 제공되지 않는 기업입니다.
        </div>
      )}
    </div>
  );
}

// 4. DART 실시간 공시 목록 컴포넌트
export async function DartDisclosuresSection({ dartCode }: { dartCode: string }) {
  const disclosures = await getRecentDisclosures(dartCode);
  return (
    <>
      {disclosures && disclosures.length > 0 ? (
        <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.88rem",
            backgroundColor: "var(--bg-color-card)"
          }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-color-main)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>보고서 명칭</th>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>공시 제출인</th>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>접수일자</th>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>원문 보기</th>
              </tr>
            </thead>
            <tbody>
              {disclosures.map((disc) => (
                <tr key={disc.rceptNo} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--color-text-main)", maxWidth: "320px", wordBreak: "break-all" }}>
                    {disc.reportNm}
                    {disc.rm && (
                      <span style={{
                        marginLeft: "8px",
                        backgroundColor: "rgba(49, 130, 246, 0.1)",
                        color: "var(--color-primary)",
                        fontSize: "0.7rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 700
                      }}>
                        {disc.rm}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-sub)" }}>
                    {disc.flrNm}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-desc)" }}>
                    {disc.rceptDt}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <a 
                      href={disc.detailUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{
                        color: "var(--color-primary)",
                        fontWeight: 700,
                        textDecoration: "underline"
                      }}
                    >
                      열람 ➔
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          최근 2년 내에 DART에 공시된 보고서 내역이 없거나 임시 점검 중입니다.
        </div>
      )}
    </>
  );
}

// 5. DART 주요 실적/정기 보고서 컴포넌트
export async function DartKeyDisclosuresSection({ dartCode }: { dartCode: string }) {
  const keyDisclosures = await getRecentKeyDisclosures(dartCode);
  return (
    <>
      {keyDisclosures && keyDisclosures.length > 0 ? (
        <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.88rem",
            backgroundColor: "var(--bg-color-card)"
          }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-color-main)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>보고서 구분</th>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>보고서 명칭</th>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>접수일자</th>
                <th style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>공시 열람</th>
              </tr>
            </thead>
            <tbody>
              {keyDisclosures.map((disc) => {
                let typeText = "정기공시";
                let typeColor = "var(--color-primary)";
                let typeBg = "rgba(49, 130, 246, 0.1)";
                
                if (disc.reportNm.includes("사업보고서")) {
                  typeText = "사업보고서 (연간)";
                  typeColor = "#ef4444";
                  typeBg = "rgba(239, 68, 68, 0.1)";
                } else if (disc.reportNm.includes("반기보고서")) {
                  typeText = "반기보고서";
                  typeColor = "#f59e0b";
                  typeBg = "rgba(245, 158, 11, 0.1)";
                } else if (disc.reportNm.includes("분기보고서")) {
                  typeText = "분기보고서";
                  typeColor = "#10b981";
                  typeBg = "rgba(16, 185, 129, 0.1)";
                }

                return (
                  <tr key={disc.rceptNo} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        backgroundColor: typeBg,
                        color: typeColor,
                        fontSize: "0.75rem",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        border: `1px solid ${typeColor}22`
                      }}>
                        {typeText}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--color-text-main)", maxWidth: "300px", wordBreak: "break-all" }}>
                      {disc.reportNm}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--color-text-desc)", fontWeight: 600 }}>
                      {disc.rceptDt}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <a 
                        href={disc.detailUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          color: "var(--color-primary)",
                          fontWeight: 700,
                          textDecoration: "underline"
                        }}
                      >
                        원문 보기 ➔
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
    </>
  );
}

// 6. 주요 연혁 타임라인 UI 컴포넌트
export function TimelineSection({
  timeline,
  bNo,
  brandName,
  homepage,
  description
}: {
  timeline?: BusinessData["historyTimeline"];
  bNo: string;
  brandName: string;
  homepage: string;
  description: string;
}) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <>
      <AdBanner />
      <div className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "1.3rem" }}>📅</span>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
            주요 연혁 및 기업 히스토리
          </h3>
        </div>
        
        <div style={{
          position: "relative",
          paddingLeft: "24px",
          borderLeft: "2px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          marginLeft: "10px"
        }}>
          {timeline.map((event, idx) => (
            <div key={idx} style={{ position: "relative" }}>
              <span style={{
                position: "absolute",
                left: "-31px",
                top: "4px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "var(--color-primary)",
                border: "3px solid var(--bg-color-card)"
              }} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--color-primary)"
                }}>
                  {formatEventDate(event.eventDate)}
                </span>
                <strong style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "var(--color-text-main)"
                }}>
                  {event.eventTitle}
                </strong>
                <p style={{
                  fontSize: "0.92rem",
                  color: "var(--color-text-sub)",
                  lineHeight: 1.5,
                  margin: "4px 0 0 0"
                }}>
                  {event.eventDescription}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "20px" }}>
          <EditRequestTrigger
            bNo={bNo}
            currentBusinessName={brandName}
            currentBrandName={brandName}
            currentHomepage={homepage}
            currentDescription={description}
          />
        </div>
      </div>
    </>
  );
}

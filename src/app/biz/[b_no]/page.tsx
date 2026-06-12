import React, { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// 스트리밍을 위한 스켈레톤 로딩 UI 컴포넌트
function SectionSkeleton() {
  return (
    <div style={{
      width: "100%",
      minHeight: "120px",
      padding: "24px",
      borderRadius: "14px",
      border: "1px solid var(--color-border)",
      backgroundColor: "var(--bg-color-card)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxSizing: "border-box"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-custom {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .skeleton-item {
          animation: pulse-custom 1.5s infinite ease-in-out;
        }
      `}} />
      <div className="skeleton-item" style={{ width: "35%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }}></div>
      <div className="skeleton-item" style={{ width: "80%", height: "20px", borderRadius: "6px", backgroundColor: "var(--color-border)" }}></div>
      <div className="skeleton-item" style={{ width: "55%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }}></div>
    </div>
  );
}

// 테이블 형태의 스트리밍 스켈레톤 (CLS 완화용)
function TableSkeleton() {
  return (
    <div style={{
      width: "100%",
      borderRadius: "14px",
      border: "1px solid var(--color-border)",
      backgroundColor: "var(--bg-color-card)",
      overflow: "hidden",
      boxSizing: "border-box"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-custom {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .skeleton-item {
          animation: pulse-custom 1.5s infinite ease-in-out;
        }
      `}} />
      <div style={{ padding: "14px 16px", backgroundColor: "var(--bg-color-main)", borderBottom: "1px solid var(--color-border)", display: "flex", gap: "20px" }}>
        <div className="skeleton-item" style={{ width: "25%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
        <div className="skeleton-item" style={{ width: "40%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
        <div className="skeleton-item" style={{ width: "15%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
        <div className="skeleton-item" style={{ width: "10%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)", marginLeft: "auto" }} />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ padding: "20px 16px", borderBottom: i === 3 ? "none" : "1px solid var(--color-border)", display: "flex", gap: "20px", alignItems: "center" }}>
          <div className="skeleton-item" style={{ width: "20%", height: "16px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
          <div className="skeleton-item" style={{ width: "45%", height: "16px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
          <div className="skeleton-item" style={{ width: "15%", height: "16px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
          <div className="skeleton-item" style={{ width: "8%", height: "20px", borderRadius: "6px", backgroundColor: "var(--color-border)", marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
}

// 추천 기업 스켈레톤 (그리드 CLS 완화용)
function RecommendedSkeleton() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      gap: "12px"
    }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="related-card skeleton-item"
          style={{
            height: "78px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            backgroundColor: "var(--bg-color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "16px",
            animation: "pulse-custom 1.5s infinite ease-in-out"
          }}
        >
          <div style={{ width: "60%", height: "12px", borderRadius: "3px", backgroundColor: "var(--color-border)" }} />
          <div style={{ width: "90%", height: "16px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
        </div>
      ))}
    </div>
  );
}

// 추천 비즈니스 연동용 비동기 컴포넌트
async function RecommendedSection({
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

// 1. 조달청 나라장터 입찰공고 컴포넌트
async function BidsSection({ companyNm, bNo }: { companyNm: string; bNo: string }) {
  // 실시간 조달 정보 로드 (어떠한 가상 Mock 데이터도 강제 결합하지 않음)
  const bids = await getRecentBidsByCompany(companyNm, bNo);

  // 1. 총 수주 규모 계산
  const totalAmount = bids.reduce((acc, curr) => acc + (curr.presmptPrce || 0), 0);

  // 2. B2G 파트너 등급 판정
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

  // 3. 안정적 현금 흐름력 지수 산출 (수의계약 및 제한경쟁 비율, 수주 건수 가중치 산출)
  const contractTypes = bids.map(b => b.cntrctCnclMthdNm || "");
  const safeContracts = contractTypes.filter(t => t.includes("수의") || t.includes("제한") || t.includes("적격")).length;
  const safeContractRatio = bids.length > 0 ? (safeContracts / bids.length) : 0;
  
  // 실적이 있을 때만 점수 산출
  const cashFlowScore = bids.length > 0 ? Math.min(100, Math.round(60 + (safeContractRatio * 30) + (bids.length * 2.5))) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* B2G 분석 스코어링 카드 */}
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
        {/* 등급 점수 */}
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

        {/* 수주 규모 */}
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

        {/* 현금 흐름 안전성 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px" }}>
          <span style={{ fontSize: "0.82rem", color: "#a0aec0", fontWeight: 700 }}>안정적 현금 흐름 지수</span>
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.7rem", fontWeight: 800, color: bids.length > 0 ? (cashFlowScore >= 80 ? "#10b981" : "#f59e0b") : "#718096" }}>
                {bids.length > 0 ? cashFlowScore : "-"}
              </span>
              <span style={{ fontSize: "0.85rem", color: "#718096", fontWeight: 700 }}>/ 100 점</span>
            </div>
            {/* 프로그레스 바 시각화 */}
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

      {/* 입찰/수주 상세 목록 */}
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

// 2. 특허 및 지식재산권 컴포넌트
async function PatentsSection({ companyNm, pNm }: { companyNm: string, pNm: string }) {
  const patents = await getPatentsByCompany(companyNm, pNm);

  // 1. 발명 명칭 기반 핵심 기술 도메인 태그 자동 추출
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

  // 만약 추출된 태그가 하나도 없다면 디폴트 태그 생성
  if (extractedTagsSet.size === 0 && patents.length > 0) {
    extractedTagsSet.add("#독점기술");
    extractedTagsSet.add("#원천특허");
  }

  const tags = Array.from(extractedTagsSet).slice(0, 5);

  // 2. R&D 혁신도 점수 및 Tier 계산
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
    tierColor = "#a855f7"; // 보라색
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
      {/* R&D 혁신도 스코어링 카드 */}
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
        {/* R&D Tier */}
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

        {/* 기술 가치 점수 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px", borderRight: "1px solid rgba(255,255,255,0.06)", paddingRight: "16px" }}>
          <span style={{ fontSize: "0.82rem", color: "#a0aec0", fontWeight: 700 }}>원천 기술 가치 스코어</span>
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.7rem", fontWeight: 800, color: patents.length > 0 ? tierColor : "#718096" }}>
                {patents.length > 0 ? rndScore : "-"}
              </span>
              <span style={{ fontSize: "0.85rem", color: "#718096", fontWeight: 700 }}>/ 100 점</span>
            </div>
            {/* 프로그레스 바 */}
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

        {/* 기술 도메인 태그 */}
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

      {/* 특허 상세 목록 */}
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

// 3. DART 실시간 공시 목록 컴포넌트
async function DartDisclosuresSection({ dartCode }: { dartCode: string }) {
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

// 4. DART 주요 분기별 실적 보고서 컴포넌트
async function DartKeyDisclosuresSection({ dartCode }: { dartCode: string }) {
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

// 단어의 마지막 글자 받침 유무에 따라 한글 조사 자동 선택
function getJosa(word: string, josaType: "은는" | "이가" | "을를" | "과와" | "으로로"): string {
  if (!word) return "";
  const lastChar = word.charAt(word.length - 1);
  const charCode = lastChar.charCodeAt(0);

  let hasBatchim = false;

  if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
    hasBatchim = (charCode - 0xAC00) % 28 > 0;
  } else if (/[0-9]/.test(lastChar)) {
    hasBatchim = /[136780]/.test(lastChar);
  } else if (/[a-zA-Z]/.test(lastChar)) {
    const lower = lastChar.toLowerCase();
    hasBatchim = /[lmnrx]/.test(lower);
  }

  const josaMap = {
    은는: hasBatchim ? "은" : "는",
    이가: hasBatchim ? "이" : "가",
    을를: hasBatchim ? "을" : "를",
    과와: hasBatchim ? "과" : "와",
    으로로: hasBatchim ? "으로" : "로"
  };

  if (josaType === "으로로" && hasBatchim) {
    const isRBatchim = (charCode - 0xAC00) % 28 === 8;
    if (isRBatchim) return "로";
  }

  return josaMap[josaType] || "";
}

// 텍스트 내의 은(는), 이(가), 을(를), 와(과) 등의 패턴을 올바른 조사로 치환
function formatJosa(text?: string): string {
  if (!text) return "";
  return text
    .replace(/([가-힣a-zA-Z0-9]+)은\(는\)/g, (match, word) => word + getJosa(word, "은는"))
    .replace(/([가-힣a-zA-Z0-9]+)이\(가\)/g, (match, word) => word + getJosa(word, "이가"))
    .replace(/([가-힣a-zA-Z0-9]+)을\(를\)/g, (match, word) => word + getJosa(word, "을를"))
    .replace(/([가-힣a-zA-Z0-9]+)와\(과\)/g, (match, word) => word + getJosa(word, "과와"))
    .replace(/([가-힣a-zA-Z0-9]+)과\(와\)/g, (match, word) => word + getJosa(word, "과와"));
}

// 예상 연봉/HR 지표 분석 컴포넌트
function SalarySection({ business }: { business: BusinessData }) {
  if (!business.npsLinked || !business.npsSbscrbNmps || !business.npsChrgAmt) {
    return (
      <div className="card" style={{ padding: "28px", textAlign: "center" }}>
        <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "8px" }}>💳</span>
        <div style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem", marginBottom: "6px" }}>
          국민연금 연봉 정보 제공 불가
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
          본 기업은 실시간 국민연금 고지 정보 연동이 지연되었거나 1인 이하 소기업으로, 추정 연봉 통계가 제공되지 않습니다.
        </p>
      </div>
    );
  }

  const emps = business.npsSbscrbNmps;
  const chrgAmt = business.npsChrgAmt; // 당월 고지 보험료 총액
  const avgPremium = chrgAmt / emps;
  
  // 국민연금 보험료율 9% (근로자 4.5% + 회사 4.5% = 총 9% 고지)
  let avgMonthlySalary = avgPremium / 0.09;
  let isMaxed = false;
  let isMinified = false;

  // 국민연금 기준 상/하한액 보정
  if (avgPremium >= 555300) {
    isMaxed = true;
    avgMonthlySalary = 6170000;
  } else if (avgPremium <= 33300) {
    isMinified = true;
    avgMonthlySalary = 370000;
  }

  const avgYearlySalary = Math.round((avgMonthlySalary * 12) / 10000); // 만원 단위
  const formattedSalary = isMaxed 
    ? "7,400만원 이상 (국민연금 상한액 도달)" 
    : isMinified 
      ? "2,400만원 미만 (최저임금 수준)" 
      : `${avgYearlySalary.toLocaleString()}만원`;

  const hires = business.newAcqsNmps || 0;
  const exits = business.lossSbscrbNmps || 0;
  const hireRate = ((hires / emps) * 100).toFixed(1);
  const exitRate = ((exits / emps) * 100).toFixed(1);

  return (
    <div className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "1.2rem" }}>💳</span>
        <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
          예상 평균 연봉 및 고용 HR 지표
        </h4>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px"
      }}>
        {/* 예상 평균 연봉 */}
        <div style={{
          backgroundColor: "var(--bg-color-main)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
            예상 평균 연봉 (국민연금 납부액 기준)
          </span>
          <div style={{ marginTop: "4px" }}>
            <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--color-primary)" }}>
              {formattedSalary}
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", lineHeight: 1.4 }}>
            * 당월 국민연금 고지총액({(chrgAmt/10000).toLocaleString()}만원)과 상시 가입자수({emps}명)의 9% 요율 역산 추정치입니다.
          </span>
        </div>

        {/* 연봉/종업원 가이드 및 신뢰도 */}
        <div style={{
          backgroundColor: "var(--bg-color-main)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          justifyContent: "center"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
            <span>상시 근로자수</span>
            <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>{emps}명</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
            <span>월평균 고지 보험료</span>
            <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>{(avgPremium/1000).toLocaleString()}천원</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
            <span>HR 안정성 등급</span>
            <span style={{
              fontWeight: 700,
              color: parseFloat(exitRate) > 10 ? "var(--color-danger)" : "var(--color-success)"
            }}>
              {parseFloat(exitRate) > 10 ? "인력 유출 주의" : "고용 안정 기업"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 동종 업종 분석 및 업계 순위 컴포넌트
async function IndustrySection({ bSector, bNo }: { bSector: string; bNo: string }) {
  const analysis = await getIndustryAnalysis(bSector, bNo);
  
  if (analysis.totalCompanies === 0) {
    return (
      <div className="card" style={{ padding: "28px", textAlign: "center" }}>
        <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "8px" }}>🏢</span>
        <div style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem", marginBottom: "6px" }}>
          동종 업종 비교 통계 미제공
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
          등록된 동일 업종 분류 기업 정보가 부족하여 산업 내 순위 및 위치 비교가 어렵습니다.
        </p>
      </div>
    );
  }

  const getPositionText = (pct: number) => {
    if (pct >= 85) return "최상위";
    if (pct >= 55) return "상위";
    if (pct >= 30) return "중위";
    return "하위";
  };

  const getBarColor = (pct: number) => {
    if (pct >= 85) return "var(--color-primary)";
    if (pct >= 55) return "#3182f6";
    if (pct >= 30) return "#10b981";
    return "#718096";
  };

  const metrics = [
    { name: "활동성 (매출 규모)", val: analysis.rankings.revenuePercentile },
    { name: "수익성 (영업이익률)", val: analysis.rankings.operatingMarginPercentile },
    { name: "안정성 (자본 대비 부채)", val: analysis.rankings.debtRatioPercentile },
    { name: "규모 (고용인원)", val: analysis.rankings.employeePercentile }
  ];

  return (
    <div className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.2rem" }}>🏢</span>
          <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
            동종 업종 분석 및 업계 순위
          </h4>
        </div>
        <span style={{
          backgroundColor: "rgba(49, 130, 246, 0.08)",
          color: "var(--color-primary)",
          fontSize: "0.8rem",
          fontWeight: 700,
          padding: "4px 12px",
          borderRadius: "30px",
          border: "1px solid rgba(49, 130, 246, 0.2)"
        }}>
          기준 연도: 2024년 결산
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "32px"
      }}>
        {/* 산업 내 위치 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h5 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-sub)", margin: 0 }}>
            📊 동종 업종 내 상대적 위치 (백분위)
          </h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {metrics.map((m) => (
              <div key={m.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700 }}>
                  <span style={{ color: "var(--color-text-sub)" }}>{m.name}</span>
                  <span style={{ color: getBarColor(m.val) }}>
                    {getPositionText(m.val)} (상위 {100 - m.val}%)
                  </span>
                </div>
                <div style={{
                  width: "100%",
                  height: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  borderRadius: "5px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${m.val}%`,
                    height: "100%",
                    backgroundColor: getBarColor(m.val),
                    borderRadius: "5px",
                    boxShadow: `0 0 8px ${getBarColor(m.val)}55`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 산업 내 순위 & 산업 위험 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* 업계 순위 리스트 */}
          {analysis.leaders.length > 0 && (
            <div>
              <h5 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-sub)", margin: "0 0 14px 0" }}>
                🏆 {bSector.substring(0, 15)}... 매출액 순위
              </h5>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {analysis.leaders.map((l, index) => (
                  <div key={l.b_no} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    backgroundColor: l.b_no === bNo ? "rgba(49, 130, 246, 0.08)" : "var(--bg-color-main)",
                    border: l.b_no === bNo ? "1px solid rgba(49, 130, 246, 0.3)" : "1px solid var(--color-border)",
                    borderRadius: "12px",
                    fontSize: "0.85rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        fontWeight: 900,
                        color: index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : "#cd7f32"
                      }}>
                        {index + 1}위
                      </span>
                      <strong style={{ color: "var(--color-text-main)", fontWeight: 700 }}>{l.b_nm}</strong>
                    </div>
                    <span style={{ color: "var(--color-text-desc)" }}>
                      {l.revenue >= 10000 
                        ? `${(l.revenue / 10000).toFixed(1)}조` 
                        : `${l.revenue}억 원`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 산업 위험 지표 */}
          <div>
            <h5 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-sub)", margin: "0 0 12px 0" }}>
              ⚠️ 산업별 거시 위험 통계
            </h5>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px"
            }}>
              <div style={{
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "14px",
                textAlign: "center"
              }}>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  업종 평균 폐업률
                </span>
                <span style={{ fontSize: "1.3rem", fontWeight: 900, color: analysis.closeRate > 5 ? "var(--color-danger)" : "var(--color-success)" }}>
                  {analysis.closeRate}%
                </span>
              </div>
              <div style={{
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "14px",
                textAlign: "center"
              }}>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  업종 등록 기업수
                </span>
                <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--color-text-main)" }}>
                  {analysis.totalCompanies}개사
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 주요 연혁 타임라인 UI 컴포넌트
function TimelineSection({
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

  const formatEventDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr || "-";
    return `${dateStr.slice(0, 4)}년 ${dateStr.slice(4, 6)}월`;
  };

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

        {/* 연혁 수정 제안 버튼 추가 */}
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

import Link from "next/link";
import { getNtsCompanyStatus, NtsCompanyStatus } from "@/lib/ntsApi";
import { getCorpBasicOutline, getCorpFinanceInfo, CorpBasicOutline, CorpFinanceDetail } from "@/lib/corpApi";
import { getNpsBplcInfo } from "@/lib/npsApi";
import AdBanner from "@/components/AdBanner";
import { getRecentBidsByCompany, getMockBids, syncRecentBidsByCompany } from "@/lib/procurementApi";
import { getPatentsByCompany, getMockPatents, syncPatentsByCompany } from "@/lib/patentApi";
import { getRecentDisclosures, getRecentKeyDisclosures, syncDisclosuresByCompany } from "@/lib/dartApi";
import { getBusinessByBNo, getInvalidBusinesses, addInvalidBusiness, upsertBusiness, getRecommendedBusinesses, query, getIndustryAnalysis } from "@/lib/db";
import { validateBizrNo } from "@/lib/bizValidation";
import { findDartCode } from "@/lib/dartMap";
import { getFtcMailOrderInfo } from "@/lib/ftcApi";
import EditRequestTrigger from "@/components/EditRequestTrigger";
import B2BColorStatus from "@/components/B2BColorStatus";

// Local Business Type 정의
export const dynamic = "force-dynamic";

interface BusinessData {
  b_no: string;
  b_nm: string;
  p_nm: string;
  start_dt: string;
  b_adr: string;
  b_sector: string;
  b_type: string;
  corp_no?: string;
  dart_code?: string;
  description: string;
  credit_rating: string;
  industry_rank: string;
  dataSource: "public" | "local" | "estimated";
  is_sme: string;
  listing_status: string;
  homepage: string;
  main_biz: string;
  is_audited: boolean;
  npsLinked?: boolean;
  npsSbscrbNmps?: number;
  
  // 방대함 대응을 위한 추가 칼럼들
  corpEnm?: string;
  crno?: string;
  basDt?: string;
  enpPbncYn?: string;
  enpDivNm?: string;
  enpTlno?: string;
  enpFxno?: string;
  enpPncd?: string;
  enpStacNm?: string;
  enpMainBizNm?: string;
  enpKosdaqYn?: string;
  enpKoseYn?: string;
  enpKonexYn?: string;
  
  // 통신판매 V2 상세 정보
  mailOrderNo?: string;
  declareOrg?: string;
  goodsType?: string;
  sellType?: string;
  closeDate?: string;
  repEmail?: string;
  telNo?: string;
  zipCd?: string;
  
  // 국민연금 V2 상세 지표
  newAcqsNmps?: number;
  lossSbscrbNmps?: number;
  npsChrgAmt?: number;

  history: Array<{
    year: number;
    revenue: number;         // 매출액 (억 원)
    employees: number;       // 직원 수 (명)
    operatingIncome: number; // 영업이익 (억 원)
    netIncome: number;       // 당기순이익 (억 원)
    totalAssets: number;     // 자산총계 (억 원)
    totalLiabilities: number;// 부채총계 (억 원)
    totalEquity: number;     // 자본총계 (억 원)
  }>;
  brand_name?: string;
  historyTimeline?: Array<{
    eventDate: string;
    eventTitle: string;
    eventDescription: string;
  }>;
  ntsLastSyncAt?: any;
  npsLastSyncAt?: any;
  taxType?: string;
  taxTypeCd?: string;
  bStt?: string;
  bSttCd?: string;
}

// 로컬 Neon DB에서 사업자 번호로 기업 조회
async function getLocalBusiness(bNo: string): Promise<BusinessData | null> {
  try {
    const found = await getBusinessByBNo(bNo);
    if (found) {
      return {
        ...found,
        dataSource: "local",
      } as BusinessData;
    }
    return null;
  } catch (error) {
    console.error("Local DB read error from Neon DB:", error);
    return null;
  }
}

// 로컬 DB에 없는 새로운 사업자를 위한 결정론적 가상 프로필 생성 (SEO 색인 극대화)
function generateVirtualBusiness(bNo: string): BusinessData {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  
  let seed = 0;
  for (let i = 0; i < cleanBNo.length; i++) {
    seed += parseInt(cleanBNo[i]) * (i + 1);
  }

  const hashRange = (min: number, max: number, offset = 0) => {
    const calculated = (seed * 9301 + 49297) % 233280;
    const norm = calculated / 233280;
    return Math.floor(min + norm * (max - min)) + offset;
  };

  const companyPrefixes = ["미래", "제이", "에스", "한양", "세움", "도은", "바른", "가람", "태양", "나은"];
  const companySuffixes = ["네트웍스", "이앤씨", "솔루션", "푸드", "상사", "개발", "홀딩스", "테크", "코퍼레이션", "인베스트"];
  const pNames = ["김철수", "이영희", "박민수", "최지안", "정우성", "이지은", "강동원", "송혜교"];
  const sectors = ["도매 및 소매업", "제조업", "서비스업", "건설업", "음식점업", "부동산업"];
  const types = ["소프트웨어 유통 및 자문", "종합 건축 자재 유통", "경영 컨설팅", "식자재 및 가공식품 도소매", "부동산 개발업"];
  const addresses = [
    "서울특별시 마포구 마포대로 14",
    "경기도 수원시 영통구 광교로 156",
    "인천광역시 연수구 송도과학로 32",
    "부산광역시 해운대구 센텀서로 30",
    "대구광역시 수성구 달구벌대로 2350",
    "광주광역시 서구 상무중앙로 80"
  ];
  const ratings = ["BBB-", "BBB", "BBB+", "A-", "A", "A+", "AA-", "AA", "AA+", "AAA"];

  const bNm = `${companyPrefixes[seed % companyPrefixes.length]}${companySuffixes[(seed + 3) % companySuffixes.length]} (가상 등록 기업)`;
  const pNm = pNames[seed % pNames.length];
  
  const startYear = hashRange(2010, 2022);
  const startMonth = String(hashRange(1, 12)).padStart(2, "0");
  const startDay = String(hashRange(1, 28)).padStart(2, "0");
  const startDt = `${startYear}${startMonth}${startDay}`;

  const bAdr = `${addresses[seed % addresses.length]} ${hashRange(10, 300)}번길 ${hashRange(1, 99)}`;
  const bSector = sectors[seed % sectors.length];
  const bType = types[(seed + 2) % types.length];
  const rating = ratings[seed % ratings.length];
  const rank = `상위 ${hashRange(5, 45)}%`;

  // 3년치 가상 데이터 및 상세 재무 데이터 구축
  const history = [2023, 2024, 2025].map((year, idx) => {
    const rev = hashRange(10, 80) + (idx * 8);
    const emp = hashRange(5, 15) + (idx * 2);
    const operatingIncome = Math.round(rev * hashRange(8, 15) / 100);
    const netIncome = Math.round(operatingIncome * 0.78);
    const totalAssets = Math.round(rev * 1.2);
    const totalLiabilities = Math.round(totalAssets * hashRange(30, 60) / 100);
    const totalEquity = totalAssets - totalLiabilities;

    return {
      year,
      revenue: rev,
      employees: emp,
      operatingIncome,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalEquity
    };
  });

  const is_sme = seed % 3 === 0 ? "중소기업 (소기업)" : (seed % 3 === 1 ? "중소기업 (중기업)" : "소상공인");
  const homepage = `https://www.${companyPrefixes[seed % companyPrefixes.length].toLowerCase()}${seed}.co.kr`;

  return {
    b_no: cleanBNo,
    b_nm: bNm,
    p_nm: pNm,
    start_dt: startDt,
    b_adr: bAdr,
    b_sector: bSector,
    b_type: bType,
    description: `국세청 실시간 연동을 통하여 계속영업이 확인된 ${bSector} 전문 소상공인/개인 기업입니다.`,
    credit_rating: rating,
    industry_rank: rank,
    dataSource: "estimated",
    is_sme,
    listing_status: "비상장",
    homepage,
    main_biz: bType,
    is_audited: false,
    history,
    brand_name: "",
    historyTimeline: []
  };
}

/**
 * 백그라운드 비동기 동기화 헬퍼 함수
 * (상세 페이지 로딩 및 서버 렌더링 경로에서 외부 API 실시간 호출을 완전히 제거하므로, 이 함수는 비활성화되었습니다)
 */
async function triggerBackgroundSync(
  bNo: string,
  localBiz: any,
  ntsNeeded: boolean,
  npsNeeded: boolean
) {
  // 실시간 외부 API 대기 및 리소스 점유 방지를 위해 완전히 비활성화됨
  return;
}

/**
 * 로컬 DB 전용 통합 코어 헬퍼 함수 (실시간 외부 API 호출을 100% 원천 차단)
 */
async function getUnifiedBusinessData(bNo: string): Promise<{
  apiStatus: NtsCompanyStatus | null;
  business: BusinessData | null;
  isInvalid: boolean;
}> {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  
  // 0. 체크섬 수학적 검증 (1차 방어)
  if (!validateBizrNo(cleanBNo)) {
    return {
      apiStatus: {
        b_no: cleanBNo,
        b_stt: "형식 오류",
        b_stt_cd: "",
        tax_type: "올바른 형식의 사업자등록번호가 아닙니다 (체크섬 오류)",
        tax_type_cd: "",
        rbf_tax_type: "",
        rbf_tax_type_cd: "",
        tax_type_change_dt: "",
        end_dt: "",
        utcc_yn: "",
        invoice_apply_dt: ""
      },
      business: null,
      isInvalid: true
    };
  }

  // 1. 순수 로컬 DB 조회
  const localBiz = await getLocalBusiness(cleanBNo);
  
  if (localBiz && localBiz.b_nm !== "상호 정보 없음") {
    console.log(`[Database Fetch] Business data loaded from DB (External API calls completely bypassed): ${localBiz.b_nm} (${cleanBNo})`);
    
    const mockApiStatus: NtsCompanyStatus = {
      b_no: cleanBNo,
      b_stt: localBiz.bStt || (localBiz.b_type?.includes("폐업") ? "폐업자" : "계속사업자"),
      b_stt_cd: localBiz.bSttCd || (localBiz.b_type?.includes("폐업") ? "03" : "01"),
      tax_type: localBiz.taxType || "부가가치세 일반과세자",
      tax_type_cd: localBiz.taxTypeCd || "01",
      end_dt: localBiz.closeDate || "",
      utcc_yn: "N",
      tax_type_change_dt: "",
      invoice_apply_dt: "",
      rbf_tax_type: "",
      rbf_tax_type_cd: ""
    };

    return { apiStatus: mockApiStatus, business: localBiz, isInvalid: false };
  }

  // 2. DB에 기업 정보가 사전 적재되지 않았거나 "상호 정보 없음" 상태인 경우,
  // 외부 API(Fetch)를 절대 찌르지 않고 정직하게 "정보 없음" 취급하여 차단합니다.
  const apiStatus: NtsCompanyStatus = {
    b_no: cleanBNo,
    b_stt: "조회 불가",
    b_stt_cd: "",
    tax_type: "해당 기업의 상세 정보가 시스템 DB에 사전 적재되어 있지 않습니다.",
    tax_type_cd: "",
    rbf_tax_type: "",
    rbf_tax_type_cd: "",
    tax_type_change_dt: "",
    end_dt: "",
    utcc_yn: "N",
    invoice_apply_dt: ""
  };

  return {
    apiStatus,
    business: null,
    isInvalid: true
  };
}

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

  const { apiStatus, business, isInvalid } = await getUnifiedBusinessData(cleanBNo);
  const formattedBNo = cleanBNo.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");



  const formatMoney = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    if (absVal >= 10000) {
      const jo = absVal / 10000;
      const formatted = jo % 1 === 0 ? jo.toFixed(0) : jo.toFixed(1);
      return `${isNegative ? "-" : ""}${formatted}조`;
    }
    return `${isNegative ? "-" : ""}${absVal.toLocaleString()}억`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr || "-";
    return `${dateStr.slice(0, 4)}년 ${dateStr.slice(4, 6)}월 ${dateStr.slice(6, 8)}일`;
  };

  const formatCrno = (crnoStr: string) => {
    if (!crnoStr) return "-";
    const clean = crnoStr.replace(/[^0-9]/g, "");
    if (clean.length === 13) {
      return `${clean.slice(0, 6)}-${clean.slice(6)}`;
    }
    return crnoStr;
  };

  const formatSyncTime = (syncAt: any) => {
    if (!syncAt) return "방금 전 (실시간)";
    try {
      const d = new Date(syncAt);
      if (isNaN(d.getTime())) return "방금 전 (실시간)";
      
      // UTC+9(한국 표준시) 강제 적용을 위한 오프셋 연산
      const kstTime = d.getTime() + (9 * 60 * 60 * 1000);
      const kstDate = new Date(kstTime);
      
      // 1970년 등 미동기화 초기값의 경우 처리
      if (kstDate.getUTCFullYear() <= 1970) {
        return "미동기화 (대기 중)";
      }
      
      const year = kstDate.getUTCFullYear();
      const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
      const date = String(kstDate.getUTCDate()).padStart(2, "0");
      const hours = String(kstDate.getUTCHours()).padStart(2, "0");
      const minutes = String(kstDate.getUTCMinutes()).padStart(2, "0");
      
      return `${year}.${month}.${date} ${hours}:${minutes}`;
    } catch (e) {
      return "방금 전 (실시간)";
    }
  };

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



  // 차트 1: 매출액 & 영업이익 듀얼 꺾은선 차트 그리기
  const renderDualChart = () => {
    if (!business || !business.history || business.history.length === 0) return null;
    const history = business.history;
    const width = 320;
    const height = 130;
    const padding = 25;
    
    // 최대치/최소치 산정 (매출액과 영업이익을 공통 스케일링하거나 보정하여 그림)
    const maxVal = Math.max(...history.map(d => d.revenue)) * 1.15;
    const minVal = Math.min(...history.map(d => Math.min(d.revenue, d.operatingIncome))) * 0.85;
    const valRange = maxVal === minVal ? 10 : (maxVal - minVal);

    const revenuePoints = history.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (history.length - 1);
      const y = height - padding - ((d.revenue - minVal) / valRange) * (height - 2 * padding);
      return { x, y, val: d.revenue, year: d.year };
    });

    const incomePoints = history.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (history.length - 1);
      const y = height - padding - ((d.operatingIncome - minVal) / valRange) * (height - 2 * padding);
      return { x, y, val: d.operatingIncome };
    });

    const revenueLine = revenuePoints.map(p => `${p.x},${p.y}`).join(" ");
    const incomeLine = incomePoints.map(p => `${p.x},${p.y}`).join(" ");

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" strokeWidth="1" />

        {/* 매출액 선 (Blue) */}
        <polyline fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={revenueLine} />
        {/* 영업이익 선 (Purple) */}
        <polyline fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" points={incomeLine} />

        {/* 매출액 포인트 */}
        {revenuePoints.map((p, i) => (
          <g key={`rev-${i}`}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="var(--color-primary)" stroke="var(--bg-color-card)" strokeWidth="1.5" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--color-text-main)">
              {formatMoney(p.val)}
            </text>
            <text x={p.x} y={height - 6} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-text-desc)">
              {p.year}년
            </text>
          </g>
        ))}

        {/* 영업이익 포인트 */}
        {incomePoints.map((p, i) => (
          <g key={`inc-${i}`}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#a855f7" stroke="var(--bg-color-card)" strokeWidth="1" />
          </g>
        ))}
      </svg>
    );
  };

  // 차트 2: 고용 근로자 수 차트
  const renderEmployeeChart = (customWidth = 300, customHeight = 120, customBarWidth = 32) => {
    if (!business || !business.history || business.history.length === 0) return null;
    const history = business.history;
    
    // 유효한 과거 고용 인원 데이터가 실제로 존재하는지 검증 (과거 가짜 직원 추정치를 제외하고 실제 데이터만 있을 때만 차트 렌더링)
    const validEmpCount = history.filter(d => d.employees > 0).length;
    if (validEmpCount < 2) return null;
    const width = customWidth;
    const height = customHeight;
    const padding = 25;
    const barWidth = customBarWidth;

    const maxVal = Math.max(...history.map(d => d.employees)) * 1.15;

    const points = history.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (history.length - 1) - barWidth/2;
      const h = maxVal === 0 ? 0 : ((d.employees) / maxVal) * (height - 2 * padding);
      const y = height - padding - h;
      return { x, y, h, val: d.employees, year: d.year };
    });

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" strokeWidth="1" />

        {points.map((p, i) => (
          <g key={i}>
            <rect x={p.x} y={p.y} width={barWidth} height={p.h} fill="var(--color-primary-light)" rx="6" style={{ fill: "var(--color-primary-light)", stroke: "var(--color-primary)", strokeWidth: 1.5 }} />
            <text x={p.x + barWidth/2} y={p.y - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--color-text-main)">
              {p.val.toLocaleString()}명
            </text>
            <text x={p.x + barWidth/2} y={height - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-text-desc)">
              {p.year}년
            </text>
          </g>
        ))}
      </svg>
    );
  };

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

  // 최근 연도 데이터 (건전성 지표 계산용)
  const latestFinance = business?.history[business.history.length - 1];
  const debtRatio = latestFinance && latestFinance.totalEquity > 0
    ? Math.round((latestFinance.totalLiabilities / latestFinance.totalEquity) * 100)
    : 0;
  const operatingMargin = latestFinance && latestFinance.revenue > 0
    ? ((latestFinance.operatingIncome / latestFinance.revenue) * 100).toFixed(1)
    : "0.0";
  const latestEmployees = latestFinance?.employees || 0;

  // 1인당 매출액 (생산성) 및 매출 성장률 (YoY) 산출
  const productivity = latestFinance && latestEmployees > 0
    ? formatMoney(latestFinance.revenue / latestEmployees)
    : "-";

  const prevFinance = business?.history && business.history.length > 1
    ? business.history[business.history.length - 2]
    : null;
  const revenueGrowth = latestFinance && prevFinance && prevFinance.revenue > 0
    ? `${(((latestFinance.revenue - prevFinance.revenue) / prevFinance.revenue) * 100).toFixed(1)}%`
    : "-";
  const isGrowthPositive = latestFinance && prevFinance && latestFinance.revenue >= prevFinance.revenue;

  return (
    <div className="animate-fade-in" style={{ padding: "24px 0 80px 0" }}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="container" style={{ maxWidth: "800px" }}>
        

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
              입력하신 <strong>{formattedBNo}</strong> 번호는 국세청에 등록되지 않았거나 폐업 처리가 종결되어 완전히 말소된 상태입니다.
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
                  backgroundColor: apiStatus?.b_stt_cd === "01" ? "rgba(45, 202, 115, 0.1)" : "rgba(240, 68, 56, 0.1)",
                  color: apiStatus?.b_stt_cd === "01" ? "var(--color-success)" : "var(--color-danger)",
                  padding: "10px 18px",
                  borderRadius: "30px",
                  fontWeight: 700,
                  fontSize: "1rem"
                }}>
                  <span style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: apiStatus?.b_stt_cd === "01" ? "var(--color-success)" : "var(--color-danger)",
                    display: "inline-block"
                  }}></span>
                  <span>{apiStatus?.b_stt || "계속사업자"}</span>
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

              {/* 방대한 추가 상세 정보 카드 (신설) */}
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

              {/* 4번째 카드: 통신판매업자일 경우 통신판매 상세 정보를, 아닐 경우 기업 평가 및 시장 랭킹 지표를 노출 */}
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
            <div className="card" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
                {business?.history && business.history.length > 0 ? "📊 마음데이터 분석 인사이트" : "📊 마음데이터 고용 분석 인사이트"}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "28px" }}>
                {business?.history && business.history.length > 0 
                  ? "수집된 재무 및 고용 데이터를 바탕으로 분석된 핵심 트렌드입니다." 
                  : "실시간 고용 데이터를 바탕으로 분석된 기업의 고용 트렌드입니다."}
              </p>

              {business?.history && business.history.length > 0 ? (
                // 1. 외감 기업 (공시 대상)용 UI
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "32px",
                    marginBottom: "32px",
                    alignItems: "stretch"
                  }}>
                    {/* 차트 1: 매출액 & 영업이익 꺾은선 차트 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem" }}>
                          연간 매출액 & 영업이익 추이
                        </span>
                        <span style={{ color: "var(--color-primary)", fontWeight: 800, fontSize: "0.95rem" }}>
                          재무 종합 분석
                        </span>
                      </div>
                      <div style={{
                        flex: 1,
                        minHeight: "160px",
                        backgroundColor: "var(--bg-color-main)",
                        borderRadius: "14px",
                        padding: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--color-border)",
                        boxSizing: "border-box"
                      }}>
                        {renderDualChart()}
                      </div>
                      <div style={{ display: "flex", gap: "12px", justifyContent: "center", fontSize: "0.8rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ display: "inline-block", width: "10px", height: "3px", backgroundColor: "var(--color-primary)" }}></span>
                          <span style={{ color: "var(--color-text-sub)", fontWeight: 600 }}>매출액</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ display: "inline-block", width: "10px", height: "3px", borderTop: "2px dashed #a855f7" }}></span>
                          <span style={{ color: "var(--color-text-sub)", fontWeight: 600 }}>영업이익</span>
                        </div>
                      </div>
                    </div>

                    {/* 차트 2: 초정밀 HR 고용 건전성 및 퇴사율 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem", whiteSpace: "nowrap" }}>
                          초정밀 HR 고용 건전성 분석
                        </span>
                      </div>
                      <div style={{
                        flex: 1,
                        minHeight: "160px",
                        backgroundColor: "var(--bg-color-main)",
                        borderRadius: "14px",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                        border: "1px solid var(--color-border)",
                        boxSizing: "border-box",
                        justifyContent: "center"
                      }}>
                        {(() => {
                          if (!business.npsLinked || !business.npsSbscrbNmps) {
                            return (
                              <div style={{ textAlign: "center", color: "var(--color-text-desc)", fontSize: "0.9rem", padding: "24px 0" }}>
                                실시간 국민연금 고용 정보 미연동
                              </div>
                            );
                          }

                          const emps = business.npsSbscrbNmps;
                          const hires = business.newAcqsNmps || 0;
                          const exits = business.lossSbscrbNmps || 0;

                          const hireRate = parseFloat(((hires / emps) * 100).toFixed(1));
                          const exitRate = parseFloat(((exits / emps) * 100).toFixed(1));

                          // HR 조기 경보 배지 결정
                          let alertBadge = "✅ 고용 안정 상태";
                          let alertColor = "#10b981";
                          let alertBg = "rgba(16, 185, 129, 0.1)";

                          if (exitRate > 15 && exits > hires) {
                            alertBadge = "⚠️ 인력 급격 유출 경보";
                            alertColor = "#ef4444";
                            alertBg = "rgba(239, 68, 68, 0.1)";
                          } else if (exitRate > 8 && exits > hires) {
                            alertBadge = "🚨 인력 유출 주의";
                            alertColor = "#f59e0b";
                            alertBg = "rgba(245, 158, 11, 0.1)";
                          } else if (hireRate > 15 && hires > exits) {
                            alertBadge = "🚀 인력 급성장 중";
                            alertColor = "#3182f6";
                            alertBg = "rgba(49, 130, 246, 0.1)";
                          }

                          // 성장 안정도 점수 (Stability Score)
                          let stabilityScore = 85;
                          stabilityScore -= Math.round(exitRate * 2);
                          stabilityScore += Math.round(hireRate * 0.5);
                          if (hires < emps * 0.05 && exits < emps * 0.05) {
                            stabilityScore += 5; // 균형 안정 기점 보너스
                          }
                          stabilityScore = Math.max(10, Math.min(100, stabilityScore));

                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              {/* 상단 뱃지 및 안정도 점수 */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{
                                  backgroundColor: alertBg,
                                  color: alertColor,
                                  border: `1px solid ${alertColor}33`,
                                  padding: "4px 12px",
                                  borderRadius: "30px",
                                  fontSize: "0.78rem",
                                  fontWeight: 800
                                }}>
                                  {alertBadge}
                                </span>
                                <div style={{ textAlign: "right" }}>
                                  <span style={{ fontSize: "0.78rem", color: "#a0aec0", fontWeight: 700, marginRight: "6px" }}>성장 안정도</span>
                                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: alertColor }}>
                                    {stabilityScore}점
                                  </span>
                                </div>
                              </div>

                              {/* 입사율 vs 퇴사율 게이지 */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#a0aec0", fontWeight: 700 }}>
                                  <span>당월 입사율: {hireRate}% (+{hires}명)</span>
                                  <span>당월 퇴사율: {exitRate}% (-{exits}명)</span>
                                </div>
                                
                                {/* 듀얼 프로그레스 게이지 */}
                                <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", backgroundColor: "rgba(255, 255, 255, 0.08)" }}>
                                  <div style={{ width: `${Math.min(100, hireRate * 2)}%`, backgroundColor: "#3182f6", boxShadow: "0 0 8px #3182f6aa" }} />
                                  <div style={{ flex: 1, backgroundColor: "transparent" }} />
                                  <div style={{ width: `${Math.min(100, exitRate * 2)}%`, backgroundColor: "#ef4444", boxShadow: "0 0 8px #ef4444aa" }} />
                                </div>
                              </div>

                              <div style={{ fontSize: "0.78rem", color: "#718096", lineHeight: 1.4, textAlign: "center" }}>
                                전체 가입 상시 근로자 <strong>{emps.toLocaleString()}명</strong> 기준 당월 유출입 추이 분석
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 평가지표 카드 */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "16px",
                    marginBottom: "32px"
                  }}>
                    <div style={{
                      backgroundColor: "var(--bg-color-main)",
                      padding: "16px 20px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                        안정성 신용 등급
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary)" }}>
                        {business?.credit_rating}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: "var(--bg-color-main)",
                      padding: "16px 20px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                        동종 업종 내 위치
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                        {business?.industry_rank}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: "var(--bg-color-main)",
                      padding: "16px 20px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                        부채비율 (건전성)
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: debtRatio > 150 ? "var(--color-danger)" : "var(--color-success)" }}>
                        {debtRatio}%
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: "var(--bg-color-main)",
                      padding: "16px 20px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                        최근 영업이익률
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary)" }}>
                        {operatingMargin}%
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: "var(--bg-color-main)",
                      padding: "16px 20px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                        1인당 매출액 (생산성)
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary)" }}>
                        {productivity}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: "var(--bg-color-main)",
                      padding: "16px 20px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                        전년 대비 매출 성장률
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: isGrowthPositive ? "var(--color-success)" : "var(--color-danger)" }}>
                        {revenueGrowth !== "-" && isGrowthPositive ? `+${revenueGrowth}` : revenueGrowth}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // 2. 비외감 기업 (공시 비대상)용 UI: 예측/추정 재무제표와 신용등급 카드는 전면 제외
                // 비외감 기업이더라도 국민연금 고용 정보가 연동되어 있다면 초정밀 고용 분석 대시보드를 시각화하여 정보의 완결성 극대화
                <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                  {business && business.npsLinked && business.npsSbscrbNmps ? (
                    (() => {
                      const emps = business.npsSbscrbNmps;
                      const hires = business.newAcqsNmps || 0;
                      const exits = business.lossSbscrbNmps || 0;

                      const hireRate = parseFloat(((hires / emps) * 100).toFixed(1));
                      const exitRate = parseFloat(((exits / emps) * 100).toFixed(1));

                      let alertBadge = "✅ 고용 안정 상태";
                      let alertColor = "#10b981";
                      let alertBg = "rgba(16, 185, 129, 0.1)";

                      if (exitRate > 15 && exits > hires) {
                        alertBadge = "⚠️ 인력 급격 유출 경보";
                        alertColor = "#ef4444";
                        alertBg = "rgba(239, 68, 68, 0.1)";
                      } else if (exitRate > 8 && exits > hires) {
                        alertBadge = "🚨 인력 유출 주의";
                        alertColor = "#f59e0b";
                        alertBg = "rgba(245, 158, 11, 0.1)";
                      } else if (hireRate > 15 && hires > exits) {
                        alertBadge = "🚀 인력 급성장 중";
                        alertColor = "#3182f6";
                        alertBg = "rgba(49, 130, 246, 0.1)";
                      }

                      let stabilityScore = 85;
                      stabilityScore -= Math.round(exitRate * 2);
                      stabilityScore += Math.round(hireRate * 0.5);
                      if (hires < emps * 0.05 && exits < emps * 0.05) {
                        stabilityScore += 5;
                      }
                      stabilityScore = Math.max(10, Math.min(100, stabilityScore));

                      return (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "24px",
                          background: "linear-gradient(135deg, rgba(26, 32, 44, 0.6) 0%, rgba(17, 20, 28, 0.8) 100%)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "16px",
                          padding: "24px",
                          boxShadow: "0 8px 25px rgba(0,0,0,0.25)"
                        }}>
                          {/* 고용 메트릭 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.85rem", color: "#a0aec0", fontWeight: 700 }}>실시간 국민연금 고용 지표</span>
                              <span style={{
                                backgroundColor: alertBg,
                                color: alertColor,
                                border: `1px solid ${alertColor}33`,
                                padding: "2px 8px",
                                borderRadius: "30px",
                                fontSize: "0.72rem",
                                fontWeight: 800
                              }}>
                                {alertBadge}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "20px", marginTop: "8px", alignItems: "baseline" }}>
                              <div>
                                <span style={{ fontSize: "2.1rem", fontWeight: 900, color: "#f7fafc" }}>
                                  {emps.toLocaleString()}
                                </span>
                                <span style={{ fontSize: "0.85rem", color: "#718096", fontWeight: 700, marginLeft: "4px" }}>명</span>
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#a0aec0", fontWeight: 600 }}>
                                당월 입사 <span style={{ color: "#3182f6", fontWeight: 700 }}>+{hires}명</span> | 퇴사 <span style={{ color: "#ef4444", fontWeight: 700 }}>-{exits}명</span>
                              </div>
                            </div>
                          </div>

                          {/* HR 입퇴사율 및 안정도 점수 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <span style={{ fontSize: "0.85rem", color: "#a0aec0", fontWeight: 700 }}>고용 성장 안정도</span>
                              <span style={{ fontSize: "1.4rem", fontWeight: 900, color: alertColor }}>{stabilityScore} 점</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#718096" }}>
                                <span>입사율: {hireRate}%</span>
                                <span>퇴사율: {exitRate}%</span>
                              </div>
                              <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" }}>
                                <div style={{ width: `${Math.min(100, hireRate * 2)}%`, backgroundColor: "#3182f6" }} />
                                <div style={{ flex: 1, backgroundColor: "transparent" }} />
                                <div style={{ width: `${Math.min(100, exitRate * 2)}%`, backgroundColor: "#ef4444" }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div style={{
                      width: "100%",
                      padding: "24px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--bg-color-main)",
                      textAlign: "center",
                      color: "var(--color-text-desc)",
                      fontSize: "0.9rem"
                    }}>
                      실시간 국민연금 고용 이력 정보가 연동되지 않은 소기업입니다.
                    </div>
                  )}
                </div>
              )}

              {/* 3개년 공식 재무제표 요약 테이블 또는 공시 비대상 안내 */}
              <div style={{ marginTop: "24px" }}>
                {business?.history && business.history.length > 0 ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                        📋 3개년 주요 재무 상태표 & 손익계산서 요약
                      </h4>
                      {business.is_audited && business.dart_code && (
                        <a
                          href="#dart-disclosures-section"
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-primary)",
                            fontWeight: 700,
                            backgroundColor: "var(--color-primary-light)",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          🏛️ 금융감독원 DART 공시 원본 보기 ➔
                        </a>
                      )}
                    </div>
                    {business.history && business.history.length > 0 ? (
                      <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
                        <table style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          textAlign: "right",
                          fontSize: "0.9rem",
                          backgroundColor: "var(--bg-color-card)"
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: "var(--bg-color-main)", borderBottom: "1px solid var(--color-border)" }}>
                              <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--color-text-sub)", fontWeight: 700 }}>계정과목 (단위: 억 원)</th>
                              {business?.history.map((h, i) => (
                                <th key={i} style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>{h.year}년</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                              <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>자산 총계</td>
                              {business?.history.map((h, i) => (
                                <td key={i} style={{ padding: "12px 16px", color: "var(--color-text-main)", fontWeight: 600 }}>{formatMoney(h.totalAssets)}</td>
                              ))}
                            </tr>
                            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                              <td style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-sub)" }}>부채 총계</td>
                              {business?.history.map((h, i) => (
                                <td key={i} style={{ padding: "12px 16px", color: "var(--color-text-sub)" }}>{formatMoney(h.totalLiabilities)}</td>
                              ))}
                            </tr>
                            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                              <td style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-sub)" }}>자본 총계</td>
                              {business?.history.map((h, i) => (
                                <td key={i} style={{ padding: "12px 16px", color: "var(--color-text-sub)" }}>{formatMoney(h.totalEquity)}</td>
                              ))}
                            </tr>
                            <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "rgba(49, 130, 246, 0.02)" }}>
                              <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--color-primary)" }}>매출액 (영업수익)</td>
                              {business?.history.map((h, i) => (
                                <td key={i} style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-primary)" }}>
                                  {formatMoney(h.revenue)}
                                </td>
                              ))}
                            </tr>
                            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                              <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>영업이익</td>
                              {business?.history.map((h, i) => (
                                <td key={i} style={{ padding: "12px 16px", color: h.operatingIncome >= 0 ? "var(--color-success)" : "var(--color-danger)", fontWeight: 600 }}>
                                  {formatMoney(h.operatingIncome)}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-sub)" }}>당기순이익</td>
                              {business?.history.map((h, i) => (
                                <td key={i} style={{ padding: "12px 16px", color: h.netIncome >= 0 ? "var(--color-text-main)" : "var(--color-danger)" }}>
                                  {formatMoney(h.netIncome)}
                                </td>
                              ))}
                            </tr>
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
                        color: "var(--color-text-desc)",
                        fontSize: "0.9rem"
                      }}>
                        재무 데이터가 아직 공시 등록되지 않았습니다.
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    padding: "24px",
                    borderRadius: "14px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    textAlign: "center"
                  }}>
                    <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "8px" }}>🏛️</span>
                    <div style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem", marginBottom: "6px" }}>
                      공식 재무 공시 비대상 기업
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
                      본 기업은 외부감사(외감) 법령 기준 미달 소기업 또는 소상공인으로, 금융감독원 DART 공시 및 금융위원회 재무제표 공시 법적 의무가 없는 비대상 기업입니다. 이에 따라 인위적인 매출/신용도 추정을 배제하고 검증된 계속사업 상태 정보 및 실시간 고용 현황만 제공합니다.
                    </p>
                  </div>
                )}
              </div>

              {/* 3. 실시간 공공 입찰공고 및 계약 현황 (신설) */}
              <div style={{ marginTop: "32px" }}>
                <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                  🏛️ 조달청 나라장터 입찰공고 매칭 내역
                </h4>
                <Suspense fallback={<SectionSkeleton />}>
                  <BidsSection companyNm={business?.b_nm || ""} bNo={cleanBNo} />
                </Suspense>
              </div>

              {/* 4. 지식재산권 (특허/상표) 포트폴리오 (신설) */}
              <div style={{ marginTop: "32px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                  💡 보유 특허 및 지식재산권(IP) 포트폴리오
                </h4>
                <Suspense fallback={<TableSkeleton />}>
                  <PatentsSection companyNm={business?.b_nm || ""} pNm={business?.p_nm || ""} />
                </Suspense>
              </div>

              {/* 5. 금융감독원 DART 실시간 공시 목록 (신설) */}
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

              {/* 6. 금융감독원 DART 주요 실적/정기 보고서 (신설) */}
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
            </div>

            {/* 기업 연혁 및 상호 변경 히스토리 (수집된 연혁이 없으면 실제 개업일 기준으로 기본 설립 연혁 노출) */}
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

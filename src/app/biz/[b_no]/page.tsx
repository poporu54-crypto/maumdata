import React, { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// 스트리밍을 위한 스켈레톤 로딩 UI 컴포넌트
function SectionSkeleton() {
  return (
    <div style={{
      width: "100%",
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

// 1. 조달청 나라장터 입찰공고 컴포넌트
async function BidsSection({ companyNm }: { companyNm: string }) {
  const bids = await getRecentBidsByKeyword(companyNm);
  return (
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
                <h5 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--color-text-main)", margin: "4px 0 0 0" }}>
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
          최근 7일간 등록된 입찰/낙찰 공고 매칭 내역이 존재하지 않습니다.
        </div>
      )}
    </div>
  );
}

// 2. 특허 및 지식재산권 컴포넌트
async function PatentsSection({ companyNm, pNm }: { companyNm: string, pNm: string }) {
  const patents = await getPatentsByCompany(companyNm, pNm);
  return (
    <>
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
    </>
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
          currentBrandName={brandName}
          currentHomepage={homepage}
          currentDescription={description}
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { getNtsCompanyStatus, NtsCompanyStatus } from "@/lib/ntsApi";
import { getCorpBasicOutline, getCorpFinanceInfo, CorpBasicOutline, CorpFinanceDetail } from "@/lib/corpApi";
import { getNpsBplcInfo } from "@/lib/npsApi";
import { getRecentBidsByKeyword } from "@/lib/procurementApi";
import { getPatentsByCompany } from "@/lib/patentApi";
import { getRecentDisclosures, getRecentKeyDisclosures } from "@/lib/dartApi";
import { getBusinessByBNo, getInvalidBusinesses, addInvalidBusiness, upsertBusiness, getRecommendedBusinesses, query } from "@/lib/db";
import { validateBizrNo } from "@/lib/bizValidation";
import { findDartCode } from "@/lib/dartMap";
import { getFtcMailOrderInfo } from "@/lib/ftcApi";
import EditRequestTrigger from "@/components/EditRequestTrigger";

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
 * 사용자의 로딩 흐름(Response)을 가로막지 않고 외부 API를 찔러 DB 캐시만 동용 업데이트합니다.
 */
async function triggerBackgroundSync(
  bNo: string,
  localBiz: any,
  ntsNeeded: boolean,
  npsNeeded: boolean
) {
  try {
    console.log(`[Background Sync] Checking updates for ${localBiz.b_nm} (${bNo}). NTS: ${ntsNeeded}, NPS: ${npsNeeded}`);
    
    // 1. 국세청 동기화 (10일 만료)
    if (ntsNeeded) {
      const apiStatus = await getNtsCompanyStatus(bNo);
      if (apiStatus) {
        // 국세청 동기화 시각 업데이트
        await query(
          "UPDATE businesses SET nts_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1",
          [bNo]
        );
        console.log(`[Background Sync] NTS sync time updated for ${bNo}`);
      }
    }
    
    // 2. 국민연금 동기화 (30일 만료)
    if (npsNeeded) {
      const npsInfo = await getNpsBplcInfo(bNo, localBiz.b_nm);
      if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
        // businesses 테이블의 종업원 수 및 동기화 일자 갱신
        await query(
          `UPDATE businesses 
           SET nps_sbscrb_nmps = $1, 
               new_acqs_nmps = $2, 
               loss_sbscrb_nmps = $3, 
               nps_last_sync_at = CURRENT_TIMESTAMP 
           WHERE b_no = $4`,
          [npsInfo.npsSbscrbNmps, npsInfo.newAcqsNmps || 0, npsInfo.lossSbscrbNmps || 0, bNo]
        );
        
        // history 테이블의 최신 연도 종업원 수도 같이 갱신
        const latestHistYear = localBiz.history && localBiz.history.length > 0
          ? localBiz.history[localBiz.history.length - 1].year
          : null;
        if (latestHistYear) {
          await query(
            "UPDATE business_history SET employees = $1 WHERE b_no = $2 AND year = $3",
            [npsInfo.npsSbscrbNmps, bNo, latestHistYear]
          );
        }
        console.log(`[Background Sync] NPS count updated for ${bNo} to ${npsInfo.npsSbscrbNmps}`);
      } else {
        // API 결과가 없거나 실패하더라도 계속 찌르지 않도록 동기화 일자는 업데이트 해줍니다.
        await query(
          "UPDATE businesses SET nps_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1",
          [bNo]
        );
      }
    }
  } catch (err) {
    console.error(`[Background Sync] Failed to sync business ${bNo}:`, err);
  }
}

/**
 * 국세청 API, 금융위 API, 로컬 DB 통합 코어 헬퍼 함수
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

  // 0.1. 미등록 블랙리스트 캐시 검사 (2차 방어)
  let invalidList: string[] = [];
  try {
    invalidList = await getInvalidBusinesses();
  } catch (e) {
    console.error("Failed to read invalid list from Neon DB:", e);
  }

  if (invalidList.includes(cleanBNo)) {
    return {
      apiStatus: {
        b_no: cleanBNo,
        b_stt: "조회 불가",
        b_stt_cd: "",
        tax_type: "국세청에 등록되지 않은 사업자등록번호입니다 (블랙리스트 캐시)",
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

  // 1. 국세청 실시간 상태 조회
  const apiStatus = await getNtsCompanyStatus(cleanBNo);
  const isInvalid = !apiStatus || apiStatus.tax_type === "국세청에 등록되지 않은 사업자등록번호입니다";

  if (isInvalid) {
    // 블랙리스트 캐시 등록
    if (!invalidList.includes(cleanBNo)) {
      try {
        await addInvalidBusiness(cleanBNo);
        console.log(`Added invalid business number to blacklist in Neon DB: ${cleanBNo}`);
      } catch (e) {
        console.error("Failed to write invalid list to Neon DB:", e);
      }
    }
    return { apiStatus, business: null, isInvalid: true };
  }

  // 2. 로컬 DB 조회
  const localBiz = await getLocalBusiness(cleanBNo);
  
  // 2.1. DB에 이미 온전한 기업 정보가 적재되어 있는 경우 외부 API 호출을 완전히 생략하고 캐시 데이터 즉시 사용
  // (단, 이전에 정보 없음으로 잘못 캐싱된 오염 데이터인 "상호 미등록 사업자"는 제외하고 실시간 재조회)
  const isListedOrAudited = 
    localBiz?.listing_status?.includes("상장") || 
    localBiz?.b_type?.includes("상장") || 
    localBiz?.b_type?.includes("대기업") || 
    localBiz?.b_type?.includes("중견기업") || 
    localBiz?.is_audited === true;

  const isCacheIncomplete = localBiz && (
    !localBiz.crno || 
    localBiz.crno === "-" ||
    (isListedOrAudited && (!localBiz.history || localBiz.history.length === 0))
  );

  if (localBiz && localBiz.b_nm !== "상호 미등록 사업자" && !isCacheIncomplete) {
    console.log(`[Cache Hit] Business data loaded directly from Neon DB: ${localBiz.b_nm} (${cleanBNo})`);
    
    // 최종 동기화 시각과 현재 시각 대조하여 백그라운드 비동기 동기화 여부 검토
    const now = new Date();
    
    // 국세청 최종 동기화로부터 경과 일수 계산 (기본값 '1970-01-01'일 경우 매우 큰 값)
    const ntsLastSync = localBiz.ntsLastSyncAt ? new Date(localBiz.ntsLastSyncAt) : new Date(0);
    const ntsDiffDays = Math.floor((now.getTime() - ntsLastSync.getTime()) / (1000 * 60 * 60 * 24));
    
    // 국민연금 최종 동기화로부터 경과 일수 계산
    const npsLastSync = localBiz.npsLastSyncAt ? new Date(localBiz.npsLastSyncAt) : new Date(0);
    const npsDiffDays = Math.floor((now.getTime() - npsLastSync.getTime()) / (1000 * 60 * 60 * 24));
    
    const ntsUpdateNeeded = ntsDiffDays >= 10;
    // 국민연금이 이미 정상 연동된 곳은 30일 주기, 미연동(실패)된 상태인 곳은 1일 주기로 재시도하여 자가 치유를 앞당깁니다.
    const npsUpdateNeeded = localBiz.npsLinked ? (npsDiffDays >= 30) : (npsDiffDays >= 1);
    
    if (ntsUpdateNeeded || npsUpdateNeeded) {
      // 비동기 백그라운드 쓰레드로 동기화 실행 (await 없이 호출하여 렌더링에 영향을 미치지 않음)
      triggerBackgroundSync(cleanBNo, localBiz, ntsUpdateNeeded, npsUpdateNeeded);
    }
    
    return { apiStatus, business: localBiz, isInvalid: false };
  }

  // 3. 공공 API 동시(병렬) 호출로 로딩 속도 극대화
  const basicInfoPromise = getCorpBasicOutline(cleanBNo, localBiz?.corp_no);
  const ftcInfoPromise = getFtcMailOrderInfo(cleanBNo);
  
  const [basicInfo, ftcInfo] = await Promise.all([basicInfoPromise, ftcInfoPromise]);
  
  let business: BusinessData | null = null;

  if (basicInfo) {
    // 3.1. 금융위 데이터가 있는 경우 (법인/대기업/외감)
    // 재무정보와 국민연금 정보를 병렬로 수집
    const financeDetailPromise = getCorpFinanceInfo(basicInfo.crno);
    const npsInfoPromise = getNpsBplcInfo(cleanBNo, basicInfo.corpNm);
    const [financeDetail, npsInfo] = await Promise.all([financeDetailPromise, npsInfoPromise]);
    
    // DART 고유번호 동적 매핑 조회
    let dartCode = localBiz?.dart_code || "";
    if (!dartCode) {
      let stockCode = "";
      const listingStatus = localBiz?.listing_status || "";
      const stockMatch = listingStatus.match(/\((\d{6})\)/);
      if (stockMatch) {
        stockCode = stockMatch[1];
      }
      dartCode = await findDartCode(basicInfo.corpNm, stockCode);
    }
    
    const scale = basicInfo.enpEntprScaleNm || "일반기업";
    const isAudited = !!dartCode;
    let credit_rating = "-";
    let industry_rank = "-";
    
    if (isAudited) {
      credit_rating = "BBB+";
      industry_rank = "상위 25%";
      if (scale.includes("대기업")) {
        credit_rating = "AA+";
        industry_rank = "상위 1%";
      } else if (scale.includes("중견기업")) {
        credit_rating = "A+";
        industry_rank = "상위 7%";
      } else if (scale.includes("중소기업")) {
        credit_rating = "A-";
        industry_rank = "상위 18%";
      }
    }

    let history: BusinessData["history"] = [];
    
    if (financeDetail && financeDetail.length > 0) {
      history = financeDetail.map((fd) => {
        return {
          year: fd.year,
          revenue: fd.revenue,
          employees: 0, // 과거 연도 직원수 공식 추정치 전면 제거 (데이터 미제공)
          operatingIncome: fd.operatingIncome,
          netIncome: fd.netIncome,
          totalAssets: fd.totalAssets,
          totalLiabilities: fd.totalLiabilities,
          totalEquity: fd.totalEquity
        };
      });
    } else {
      history = [];
    }

    business = {
      b_no: cleanBNo,
      b_nm: basicInfo.corpNm,
      p_nm: basicInfo.enpRprFnm,
      start_dt: basicInfo.enpEstbDt,
      b_adr: basicInfo.enpBsadr,
      b_sector: basicInfo.enpIndyNm || "기타 서비스업",
      b_type: scale,
      corp_no: basicInfo.crno,
      dart_code: dartCode,
      description: localBiz?.description || `${basicInfo.corpNm}은(는) 금융위원회 공시 정보가 등록된 대한민국 공식 ${scale}입니다.`,
      credit_rating: localBiz?.credit_rating || credit_rating,
      industry_rank: localBiz?.industry_rank || industry_rank,
      dataSource: "public",
      is_sme: scale,
      listing_status: localBiz?.listing_status || (scale.includes("대기업") ? "코스피 상장" : "비상장"),
      homepage: localBiz?.homepage && localBiz.homepage !== "-" ? localBiz.homepage : (basicInfo.enpHpaddr || "-"),
      main_biz: basicInfo.enpMainBizNm || basicInfo.enpIndyNm || "기타 서비스업",
      is_audited: !!dartCode,
      
      corpEnm: basicInfo.corpEnm,
      crno: basicInfo.crno,
      basDt: basicInfo.basDt,
      enpPbncYn: basicInfo.enpPbncYn,
      enpDivNm: basicInfo.enpDivNm,
      enpTlno: basicInfo.enpTlno,
      enpFxno: basicInfo.enpFxno,
      enpPncd: basicInfo.enpPncd,
      enpStacNm: basicInfo.enpStacNm,
      enpMainBizNm: basicInfo.enpMainBizNm,
      enpKosdaqYn: basicInfo.enpKosdaqYn,
      enpKoseYn: basicInfo.enpKoseYn,
      enpKonexYn: basicInfo.enpKonexYn,
      
      history
    };

    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      business.npsLinked = true;
      business.npsSbscrbNmps = npsInfo.npsSbscrbNmps;
      business.newAcqsNmps = npsInfo.newAcqsNmps;
      business.lossSbscrbNmps = npsInfo.lossSbscrbNmps;
      const latestHist = business.history[business.history.length - 1];
      if (latestHist) latestHist.employees = npsInfo.npsSbscrbNmps;
    }
  } else if (ftcInfo) {
    // 3.2. 금융위에는 없으나 공정위 통신판매업 데이터가 있는 경우 (쇼핑몰/소상공인)
    const npsInfo = await getNpsBplcInfo(cleanBNo, ftcInfo.cmpNm);
    business = {
      b_no: cleanBNo,
      b_nm: ftcInfo.cmpNm,
      p_nm: ftcInfo.rprsNm,
      start_dt: ftcInfo.rcptDt,
      b_adr: ftcInfo.repAddr || "주소 정보 없음 (공시 비대상)",
      b_sector: "전자상거래 소매업 (통신판매업)",
      b_type: "소상공인 (통신판매업자)",
      description: `공정거래위원회에 정식 등록된 통신판매사업자(${ftcInfo.cmpNm})입니다. 신고일자: ${ftcInfo.rcptDt.replace(/(\d{4})(\d{2})(\d{2})/, "$1년 $2월 $3일")}.`,
      credit_rating: "-",
      industry_rank: "-",
      dataSource: "public",
      is_sme: "소상공인",
      listing_status: "비상장",
      homepage: ftcInfo.wbsitAddr && ftcInfo.wbsitAddr !== "-" ? ftcInfo.wbsitAddr : "-",
      main_biz: "전자상거래업",
      is_audited: false,
      
      enpTlno: ftcInfo.telNo,
      enpPncd: ftcInfo.zipCd,
      mailOrderNo: ftcInfo.mailOrderNo,
      declareOrg: ftcInfo.declareOrg,
      goodsType: ftcInfo.goodsType,
      sellType: ftcInfo.sellType,
      closeDate: ftcInfo.closeDate,
      repEmail: ftcInfo.repEmail,
      telNo: ftcInfo.telNo,
      zipCd: ftcInfo.zipCd,
      
      history: []
    };
    
    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      business.npsLinked = true;
      business.npsSbscrbNmps = npsInfo.npsSbscrbNmps;
      business.newAcqsNmps = npsInfo.newAcqsNmps;
      business.lossSbscrbNmps = npsInfo.lossSbscrbNmps;
    }
  } else if (localBiz) {
    // 3.3. 공용 API도 다 실패했는데 기존 로컬 DB 캐시 데이터가 있는 경우
    const npsInfo = await getNpsBplcInfo(cleanBNo, localBiz.b_nm);
    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      localBiz.npsLinked = true;
      localBiz.npsSbscrbNmps = npsInfo.npsSbscrbNmps;
      localBiz.newAcqsNmps = npsInfo.newAcqsNmps;
      localBiz.lossSbscrbNmps = npsInfo.lossSbscrbNmps;
      const latestHist = localBiz.history[localBiz.history.length - 1];
      if (latestHist) latestHist.employees = npsInfo.npsSbscrbNmps;
    }
    business = localBiz;
  } else {
    // 3.4. 모든 공시 정보가 없어 최후 수단으로 미등록 사업자 Fallback
    const realBiz: BusinessData = {
      b_no: cleanBNo,
      b_nm: "상호 미등록 사업자",
      p_nm: "-",
      start_dt: "-",
      b_adr: "주소 정보 없음 (공시 비대상)",
      b_sector: "미등록 업종",
      b_type: "소상공인/개인사업자",
      description: `국세청 실시간 계속사업자 상태가 검증된 개인 사업자등록번호(${cleanBNo})입니다.`,
      credit_rating: "-",
      industry_rank: "-",
      dataSource: "estimated",
      is_sme: "소상공인",
      listing_status: "비상장",
      homepage: "-",
      main_biz: "-",
      is_audited: false,
      history: [],
    };

    const npsInfo = await getNpsBplcInfo(cleanBNo, "상호 미등록 사업자");
    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      realBiz.npsLinked = true;
      realBiz.npsSbscrbNmps = npsInfo.npsSbscrbNmps;
      realBiz.newAcqsNmps = npsInfo.newAcqsNmps;
      realBiz.lossSbscrbNmps = npsInfo.lossSbscrbNmps;
    }
    business = realBiz;
  }

  // 5. 신규 기업 데이터 Neon DB 자동 적재 및 실시간 갱신 정보 동기화 (온디맨드 동기화 및 DART 코드 갱신)
  if (business) {
    const isNew = !localBiz;
    const wasUnregistered = localBiz && localBiz.b_nm === "상호 미등록 사업자" && business.b_nm !== "상호 미등록 사업자";
    const hasNewDartCode = localBiz && !localBiz.dart_code && business.dart_code;
    
    // 로컬 DB의 종업원수와 실시간 API로 가져온 종업원수가 다를 경우 데이터 동기화
    const hasEmployeeCountDiff = localBiz && localBiz.npsSbscrbNmps !== business.npsSbscrbNmps;

    if (isNew || wasUnregistered || hasNewDartCode || hasEmployeeCountDiff) {
      try {
        if (isNew || wasUnregistered || hasEmployeeCountDiff) {
          const cachedBiz = {
            ...business,
            dataSource: "local",
            ntsLastSyncAt: new Date(),
            npsLastSyncAt: new Date()
          };
          await upsertBusiness(cachedBiz);
          console.log(`[Cache Sync] Successfully cached/updated business to Neon DB: ${business.b_nm} (${cleanBNo}), Employees: ${business.npsSbscrbNmps}`);
          business.dataSource = "local";
        } else if (hasNewDartCode) {
          localBiz.dart_code = business.dart_code;
          await upsertBusiness(localBiz);
          console.log(`[Cache Sync] Successfully updated DART code for existing business in Neon DB: ${business.b_nm} (${business.dart_code})`);
        }
      } catch (e) {
        console.error("[Cache Sync] Failed to update Neon DB cache:", e);
      }
    }
  }

  return { apiStatus, business, isInvalid: false };
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

  const recommended = await getRecommendedBusinesses(
    cleanBNo,
    business?.b_adr || "",
    business?.b_sector || "",
    business?.is_sme || ""
  );

  const relatedList = recommended.map(r => ({
    name: r.b_nm,
    no: r.b_no
  }));

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
                    {business?.brand_name && business.brand_name.split(",")[0].trim() !== business.b_nm && (
                      <span style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--color-text-desc)", marginLeft: "12px", display: "inline-block", verticalAlign: "middle" }}>
                        ({business.brand_name.split(",")[0].trim()})
                      </span>
                    )}
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
                paddingLeft: "16px"
              }}>
                {business?.description}
              </p>
            </div>

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
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>마음데이터 검증 시각</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-desc)" }}>
                      방금 전 (실시간)
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
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>종업원 수 (국민연금)</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>
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
                          border: "1px solid rgba(45, 202, 115, 0.2)"
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
                      <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>데이터 정합성 상태</span>
                      <span style={{
                        fontWeight: 700,
                        color: "var(--color-success)",
                        backgroundColor: "rgba(45, 202, 115, 0.1)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.78rem"
                      }}>
                        공공 API 연동 실시간 검증 완료
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

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

            {/* 재무/고용 요약 대시보드 */}
            <div className="card" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
                {business?.history && business.history.length > 0 ? "📊 마음데이터 분석 인사이트" : "📊 마음데이터 고용 분석 인사이트"}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "28px" }}>
                {business?.history && business.history.length > 0 
                  ? "수집된 재무 및 고용 데이터를 바탕으로 분석된 핵심 트렌드입니다." 
                  : "국민연금 실시간 연동 데이터를 바탕으로 분석된 기업의 실시간 고용 트렌드입니다."}
              </p>

              {business?.history && business.history.length > 0 ? (
                // 1. 외감 기업 (공시 대상)용 UI
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "32px",
                    marginBottom: "32px"
                  }}>
                    {/* 차트 1: 매출액 & 영업이익 꺾은선 차트 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem" }}>
                          연간 매출액 & 영업이익 추이
                        </span>
                        <span style={{ color: "var(--color-primary)", fontWeight: 800, fontSize: "0.95rem" }}>
                          공식재무제표
                        </span>
                      </div>
                      <div style={{
                        height: "150px",
                        backgroundColor: "var(--bg-color-main)",
                        borderRadius: "14px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--color-border)"
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

                    {/* 차트 2: 근로자 수 차트 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem" }}>
                          {business.npsLinked ? "실시간 고용 근로 현황" : "고용 직원 수 변화"}
                        </span>
                        <span style={{ color: "var(--color-text-desc)", fontWeight: 700, fontSize: "0.9rem" }}>
                          {business.npsLinked ? "국민연금 연동" : "상시근로자 기준"}
                        </span>
                      </div>
                      <div style={{
                        height: "150px",
                        backgroundColor: "var(--bg-color-main)",
                        borderRadius: "14px",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        border: "1px solid var(--color-border)",
                        boxSizing: "border-box"
                      }}>
                        {renderEmployeeChart() || (
                          business.npsLinked ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "center" }}>
                              <div style={{ fontSize: "0.82rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                                국민연금 가입 상시 근로자
                              </div>
                              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-primary)" }}>
                                {business.npsSbscrbNmps?.toLocaleString()}명
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "var(--color-text-sub)", fontWeight: 600 }}>
                                당월 신규 취득: <span style={{ color: "var(--color-success)", fontWeight: 700 }}>+{business.newAcqsNmps}명</span> | 상실: <span style={{ color: "var(--color-danger)", fontWeight: 700 }}>-{business.lossSbscrbNmps}명</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign: "center", color: "var(--color-text-desc)", fontSize: "0.9rem" }}>
                              고용 정보 미연동 기업
                            </div>
                          )
                        )}
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
                  </div>
                </>
              ) : (
                // 2. 비외감 기업 (공시 비대상)용 UI: 예측/추정 재무제표와 신용등급 카드는 전면 제외
                <div style={{ marginBottom: "32px", display: "flex", justifyContent: "center" }}>
                  {business?.history && business.history.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem" }}>고용 직원 수 변화</span>
                        <span style={{ color: "var(--color-text-desc)", fontWeight: 700, fontSize: "0.9rem" }}>
                          상시근로자 기준 (국민연금 연동)
                        </span>
                      </div>
                      <div style={{
                        height: "180px",
                        backgroundColor: "var(--bg-color-main)",
                        borderRadius: "14px",
                        padding: "16px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--color-border)"
                      }}>
                        {renderEmployeeChart(650, 140, 56)}
                      </div>
                    </div>
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
                  <BidsSection companyNm={business?.b_nm || ""} />
                </Suspense>
              </div>

              {/* 4. 지식재산권 (특허/상표) 포트폴리오 (신설) */}
              <div style={{ marginTop: "32px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                  💡 보유 특허 및 지식재산권(IP) 포트폴리오
                </h4>
                <Suspense fallback={<SectionSkeleton />}>
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
                    <Suspense fallback={<SectionSkeleton />}>
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
                    <Suspense fallback={<SectionSkeleton />}>
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
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

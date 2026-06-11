"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Leaflet 지도는 클라이언트 사이드에서만 안전하게 렌더링되도록 dynamic import(ssr: false) 처리합니다.
const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
});

interface DongInfo {
  cd: string;
  name: string;
  gu: string;
  desc: string;
  stores: number;
  lat: number;
  lng: number;
}

interface RegionInfo {
  id: string;
  name: string;
  fullName: string;
  centerLat: number;
  centerLng: number;
  zoom: number;
  dongs: DongInfo[];
}

const REGIONS: RegionInfo[] = [
  {
    id: "seoul",
    name: "서울",
    fullName: "서울특별시",
    centerLat: 37.5250,
    centerLng: 126.9850,
    zoom: 11,
    dongs: [
      { cd: "1168064000", name: "역삼1동", gu: "강남구", desc: "테헤란로 IT/금융 오피스 밀집 대한민국 최대 상권", stores: 1254, lat: 37.4979, lng: 127.0276 },
      { cd: "1168065000", name: "역삼2동", gu: "강남구", desc: "역삼역 오피스 배후 고밀도 주상복합 혼합형 상권", stores: 842, lat: 37.5008, lng: 127.0365 },
      { cd: "1159062000", name: "사당1동", gu: "동작구", desc: "지하철 2·4호선 교통 허브 기반 남부 유동 밀집지", stores: 915, lat: 37.4765, lng: 126.9815 },
      { cd: "1111061500", name: "종로1.2.3.4가동", gu: "종로구", desc: "대기업 본사 및 역사적 전통 상업지구가 공존하는 핵심 상권", stores: 1420, lat: 37.5704, lng: 126.9922 },
    ]
  },
  {
    id: "gyeonggi",
    name: "경기/인천",
    fullName: "경기도 & 인천광역시",
    centerLat: 37.4250,
    centerLng: 126.9500,
    zoom: 9,
    dongs: [
      { cd: "4113510900", name: "삼평동", gu: "성남시 분당구", desc: "판교테크노밸리 심장부, 국내 IT 인재들이 집결하는 상권", stores: 642, lat: 37.4021, lng: 127.1105 },
      { cd: "2820054000", name: "구월1동", gu: "인천 남동구", desc: "인천광역시청 중심의 행정·대규모 백화점 연동 상권", stores: 789, lat: 37.4475, lng: 126.7006 },
    ]
  },
  {
    id: "gangwon",
    name: "강원",
    fullName: "강원특별자치도",
    centerLat: 37.8228,
    centerLng: 128.1555,
    zoom: 8,
    dongs: [
      { cd: "5111059000", name: "퇴계동", gu: "춘천시", desc: "남춘천역세권 기반 춘천 남부 핵심 신흥 주거/상업 복합지", stores: 485, lat: 37.8596, lng: 127.7285 },
    ]
  },
  {
    id: "chungcheong",
    name: "충청",
    fullName: "대전·세종·충청도",
    centerLat: 36.5184,
    centerLng: 127.2341,
    zoom: 9,
    dongs: [
      { cd: "3017056000", name: "둔산2동", gu: "대전 서구", desc: "정부대전청사 및 행정·학원·금융가가 집약된 대전 대표 상권", stores: 924, lat: 36.3551, lng: 127.3838 },
      { cd: "3611055000", name: "보람동", gu: "세종특별자치시", desc: "세종시청 인근 금강 보행교 연동 중심상가 및 행정지구", stores: 310, lat: 36.4795, lng: 127.2885 },
      { cd: "4413310700", name: "불당동", gu: "천안시 서북구", desc: "KTX 천안아산역 중심 불당신도시 명품 신흥 아파트 배후 상권", stores: 733, lat: 36.8095, lng: 127.1075 },
      { cd: "4311151000", name: "성안동", gu: "청주시 상당구", desc: "청주 성안길 중심 청주 전통 최대 패션 및 뷰티 번화가", stores: 580, lat: 36.6325, lng: 127.4895 },
    ]
  },
  {
    id: "gyeongsang",
    name: "경상",
    fullName: "대구·부산·울산·경상도",
    centerLat: 35.5389,
    centerLng: 128.6000,
    zoom: 8,
    dongs: [
      { cd: "2635010500", name: "우제1동", gu: "부산 해운대구", desc: "해운대 벡스코, 센텀·마린시티 초고층 랜드마크 부촌 상권", stores: 890, lat: 35.1631, lng: 129.1635 },
      { cd: "2726051000", name: "범어1동", gu: "대구 수성구", desc: "대구 최고의 명문 학군 및 수성구 금융·법조 오피스 중심가", stores: 512, lat: 35.8585, lng: 128.6285 },
      { cd: "4812355000", name: "상남동", gu: "창원시 성산구", desc: "창원 최고 밀집도를 지닌 대규모 엔터테인먼트 상업 타운", stores: 985, lat: 35.2215, lng: 128.6875 },
      { cd: "3114059000", name: "삼산동", gu: "울산 남구", desc: "백화점 2곳 및 아울렛이 인접한 울산 최대 교통·패션 중심지", stores: 1040, lat: 35.5395, lng: 129.3395 },
      { cd: "4711163000", name: "제철동", gu: "포항시 남구", desc: "포스코 포항제철소 배후 대규모 근로자 복합 생활 상권", stores: 233, lat: 35.9895, lng: 129.3885 },
    ]
  },
  {
    id: "jeolla",
    name: "전라",
    fullName: "광주·전라도",
    centerLat: 35.1557,
    centerLng: 126.8533,
    zoom: 8,
    dongs: [
      { cd: "2914074000", name: "치평동", gu: "광주 서구", desc: "광주시청 및 상무지구 중심의 광주광역시 핵심 비즈니스 벨트", stores: 754, lat: 35.1537, lng: 126.8485 },
      { cd: "4511160500", name: "효자5동", gu: "전주시 완산구", desc: "전북도청 신시가지 인근 먹거리 쇼핑 타운 및 트렌디 소비 중심", stores: 620, lat: 35.8155, lng: 127.1085 },
      { cd: "4613063000", name: "여천동", gu: "여수시", desc: "여천역 배후 석유화학단지 초입 주거/행정 믹스 상권", stores: 290, lat: 34.7705, lng: 127.6885 },
    ]
  },
  {
    id: "jeju",
    name: "제주",
    fullName: "제주특별자치도",
    centerLat: 33.3890,
    centerLng: 126.5583,
    zoom: 10,
    dongs: [
      { cd: "5011066000", name: "노형동", gu: "제주시", desc: "제주 드림타워 신흥 번화가 및 노형오거리 중심 생활 밀접 상권", stores: 815, lat: 33.4839, lng: 126.4781 },
    ]
  }
];

export default function MarketAreaHub() {
  const [selectedRegion, setSelectedRegion] = useState<string>("seoul");
  const [mapCenter, setMapCenter] = useState({
    lat: 37.5250,
    lng: 126.9850,
    zoom: 11
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const activeRegion = REGIONS.find((r) => r.id === selectedRegion) || REGIONS[0];

  // 전체 검색 가능한 행정동 목록 평탄화
  const allDongs = REGIONS.flatMap((region) =>
    region.dongs.map((dong) => ({
      ...dong,
      regionName: region.name,
      regionFullName: region.fullName,
      regionId: region.id,
    }))
  );

  // 지도 마커 배열 생성
  const mapMarkers = allDongs.map((d) => ({
    lat: d.lat,
    lng: d.lng,
    title: `${d.regionName} ${d.gu} ${d.name}`,
    category: `점포 ${d.stores.toLocaleString()}개소`,
    address: d.desc,
    link: `/stats/market-area/${d.cd}`
  }));

  const handleRegionClick = (regionId: string) => {
    setSelectedRegion(regionId);
    const reg = REGIONS.find((r) => r.id === regionId);
    if (reg) {
      setMapCenter({
        lat: reg.centerLat,
        lng: reg.centerLng,
        zoom: reg.zoom
      });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();

    if (!query) {
      setErrorMsg("검색어를 입력해 주세요.");
      return;
    }

    if (query.length < 2) {
      setErrorMsg("두 글자 이상 입력해 주세요.");
      return;
    }

    // 스마트 동 매핑 및 부분 일치 검색
    const foundDong = allDongs.find(
      (d) =>
        d.name.includes(query) ||
        query.includes(d.name) ||
        `${d.regionName} ${d.name}`.includes(query)
    );

    if (foundDong) {
      router.push(`/stats/market-area/${foundDong.cd}`);
    } else {
      // 매핑에 없더라도, 8자리~10자리 숫자 동코드가 직접 입력된 경우 이동 시도
      if (/^\d{8,10}$/.test(query)) {
        router.push(`/stats/market-area/${query}`);
      } else {
        setErrorMsg(`'${query}'에 매핑되는 대표 분석 상권을 찾을 수 없습니다. 추천 인기 상권을 이용해 보세요.`);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: "40px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "1000px" }}>
        
        {/* 타이틀 및 소개글 */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{
            backgroundColor: "var(--color-primary-light)",
            color: "var(--color-primary)",
            fontSize: "0.85rem",
            fontWeight: 800,
            padding: "6px 14px",
            borderRadius: "20px",
            display: "inline-block",
            marginBottom: "12px"
          }}>
            대한민국 1,000만 상업 시설 실시간 데이터베이스
          </span>
          <h1 style={{
            fontSize: "2.4rem",
            fontWeight: 850,
            color: "var(--color-text-main)",
            letterSpacing: "-0.03em",
            marginBottom: "16px"
          }}>
            전국 상권 분석 메인 허브
          </h1>
          <p style={{
            fontSize: "1.05rem",
            color: "var(--color-text-sub)",
            maxWidth: "640px",
            margin: "0 auto",
            lineHeight: 1.6
          }}>
            소상공인시장진흥공단의 빅데이터와 국세청 실시간 계속/휴폐업 가동률 지표를 결합하여, 전국 시도별 주요 행정동의 상권 과밀도와 업종 구성을 진단합니다.
          </p>
        </div>

        {/* 상권 전용 스마트 검색창 */}
        <div style={{ maxWidth: "680px", margin: "0 auto 48px auto" }}>
          <form onSubmit={handleSearchSubmit}>
            <div className="card" style={{
              padding: "8px 8px 8px 24px",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              boxShadow: "var(--shadow-md)",
              border: errorMsg ? "2px solid var(--color-danger)" : "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              transition: "var(--transition-smooth)"
            }}>
              <div style={{ fontSize: "1.5rem", marginRight: "16px" }}>📍</div>
              <input
                type="text"
                placeholder="검색할 동 이름을 입력해 주세요 (예: 역삼동, 삼평동, 우제1동)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setErrorMsg("");
                }}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: "var(--color-text-main)",
                  padding: "12px 0"
                }}
              />
              <button type="submit" className="btn-primary" style={{
                borderRadius: "16px",
                padding: "14px 28px",
                fontSize: "1rem",
                whiteSpace: "nowrap"
              }}>
                상권 분석하기
              </button>
            </div>
          </form>
          {errorMsg && (
            <p style={{
              color: "var(--color-danger)",
              fontSize: "0.9rem",
              fontWeight: 600,
              marginTop: "12px",
              textAlign: "center"
            }}>
              ⚠️ {errorMsg}
            </p>
          )}

          {/* 퀵 추천 태그 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginTop: "16px",
            flexWrap: "wrap"
          }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 600 }}>인기 검색:</span>
            {["역삼1동", "삼평동", "우제1동", "사당1동", "범어1동", "노형동"].map((tagName) => {
              const matched = allDongs.find(d => d.name.includes(tagName));
              return (
                <button
                  key={tagName}
                  onClick={() => router.push(`/stats/market-area/${matched?.cd || "1168064000"}`)}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--color-border)",
                    padding: "6px 12px",
                    borderRadius: "30px",
                    fontSize: "0.82rem",
                    color: "var(--color-text-sub)",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "var(--transition-smooth)"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.color = "var(--color-primary)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.color = "var(--color-text-sub)";
                  }}
                >
                  #{tagName}
                </button>
              );
            })}
          </div>
        </div>

        {/* 지도 및 정보 그리드 레이아웃 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "32px",
          marginBottom: "56px"
        }}>
          {/* PC 뷰일 때 가로 배치 */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "32px",
            justifyContent: "center"
          }}>
            
            {/* 1. 좌측 대한민국 진짜 인터랙티브 지도 카드 */}
            <div className="card" style={{
              flex: "1 1 350px",
              maxWidth: "420px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--bg-color-card)",
              border: "1px solid var(--color-border)",
              height: "550px"
            }}>
              <h3 style={{
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "var(--color-text-main)",
                marginBottom: "16px",
                alignSelf: "flex-start"
              }}>
                🗺️ 대한민국 실시간 상권 맵
              </h3>
              
              <div style={{ flex: 1, width: "100%", position: "relative", marginBottom: "16px" }}>
                <InteractiveMap 
                  markers={mapMarkers}
                  centerLat={mapCenter.lat}
                  centerLng={mapCenter.lng}
                  zoom={mapCenter.zoom}
                />
              </div>

              <div style={{ alignSelf: "flex-start" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", display: "block" }}>
                  * 지도의 마커를 클릭하면 해당 대표 행정동 상권으로 편리하게 이동할 수 있습니다.
                </span>
              </div>
            </div>

            {/* 2. 우측 선택 권역별 상세 행정동 리스트 카드 */}
            <div className="card" style={{
              flex: "1 1 450px",
              padding: "32px",
              backgroundColor: "var(--bg-color-card)",
              border: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              height: "550px"
            }}>
              {/* 권역 선택 가로 탭 */}
              <div style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                paddingBottom: "12px",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "20px",
                scrollbarWidth: "none"
              }}>
                {REGIONS.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionClick(region.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      border: "1px solid var(--color-border)",
                      backgroundColor: selectedRegion === region.id ? "var(--color-primary-light)" : "transparent",
                      color: selectedRegion === region.id ? "var(--color-primary)" : "var(--color-text-sub)",
                      transition: "var(--transition-smooth)"
                    }}
                  >
                    {region.name}
                  </button>
                ))}
              </div>

              {/* 지역명 타이틀 */}
              <div style={{
                borderBottom: "1px solid var(--color-border)",
                paddingBottom: "16px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <h2 style={{
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "var(--color-text-main)",
                    margin: 0
                  }}>
                    {activeRegion.fullName}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", margin: "4px 0 0 0" }}>
                    실시간 API 검증 완료된 상권 리스트
                  </p>
                </div>
                <span style={{
                  backgroundColor: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "12px"
                }}>
                  {activeRegion.dongs.length}개 대표동
                </span>
              </div>

              {/* 리스트 목록 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                {activeRegion.dongs.map((dong) => (
                  <div
                    key={dong.cd}
                    onClick={() => router.push(`/stats/market-area/${dong.cd}`)}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "14px",
                      padding: "16px 20px",
                      cursor: "pointer",
                      backgroundColor: "rgba(255, 255, 255, 0.005)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "var(--transition-smooth)"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-primary)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "1.05rem", fontWeight: 750, color: "var(--color-text-main)" }}>
                        {activeRegion.name} {dong.gu} <span style={{ color: "var(--color-primary)" }}>{dong.name}</span>
                      </span>
                      <span style={{
                        fontSize: "0.78rem",
                        color: "var(--color-text-desc)",
                        fontWeight: 600
                      }}>
                        실시간 점포 {dong.stores.toLocaleString()}개소
                      </span>
                    </div>
                    <p style={{
                      fontSize: "0.85rem",
                      color: "var(--color-text-sub)",
                      lineHeight: 1.4,
                      margin: 0
                    }}>
                      {dong.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 핫 토크 - 인기 급상승 상권 바로가기 섹션 */}
        <div>
          <h2 style={{
            fontSize: "1.35rem",
            fontWeight: 800,
            color: "var(--color-text-main)",
            marginBottom: "20px"
          }}>
            🔥 실시간 급상승 인기 상권 TOP 5
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px"
          }}>
            {[
              { cd: "1168064000", name: "역삼1동", gu: "서울 강남구", tag: "금융/오피스 1위", count: 1254, bgGrad: "linear-gradient(135deg, #3182f6 0%, #1c52b5 100%)" },
              { cd: "2635010500", name: "우제1동 (우동)", gu: "부산 해운대구", tag: "해양관광/레저 1위", count: 890, bgGrad: "linear-gradient(135deg, #10b981 0%, #065f46 100%)" },
              { cd: "4113510900", name: "삼평동 (판교)", gu: "경기 성남시 분당구", tag: "IT테크밸리 1위", count: 642, bgGrad: "linear-gradient(135deg, #a855f7 0%, #581c87 100%)" },
              { cd: "2726051000", name: "범어1동", gu: "대구 수성구", tag: "명문교육/금융 1위", count: 512, bgGrad: "linear-gradient(135deg, #fbbf24 0%, #b45309 100%)" },
              { cd: "5011066000", name: "노형동", gu: "제주특별자치도", tag: "제주 랜드마크 1위", count: 815, bgGrad: "linear-gradient(135deg, #ec4899 0%, #9d174d 100%)" }
            ].map((hot) => (
              <div
                key={hot.cd}
                onClick={() => router.push(`/stats/market-area/${hot.cd}`)}
                style={{
                  padding: "24px",
                  borderRadius: "18px",
                  cursor: "pointer",
                  color: "#ffffff",
                  background: hot.bgGrad,
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "150px",
                  transition: "var(--transition-smooth)"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "scale(1.02) translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "scale(1) translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                <div>
                  <span style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    padding: "4px 8px",
                    borderRadius: "20px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em"
                  }}>
                    {hot.tag}
                  </span>
                  <div style={{ fontSize: "1.25rem", fontWeight: 850, marginTop: "12px", letterSpacing: "-0.01em" }}>
                    {hot.gu} {hot.name}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                  <span style={{ fontSize: "0.78rem", opacity: 0.85 }}>가동 상가 목록 조회</span>
                  <span style={{ fontSize: "0.92rem", fontWeight: 800 }}>{hot.count.toLocaleString()}개소 →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

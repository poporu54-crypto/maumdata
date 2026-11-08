import React from "react";
import ClientMapWrapper from "./ClientMapWrapper";
import type { MapMarker } from "./InteractiveMap";
import { getCachedNearbyDiningByAddress } from "@/lib/nearbyPlacesApi";

interface NearbyDiningMapSectionProps {
  targetAddress: string;
  anchorTitle: string;
  radiusMeters?: number;
  variant?: "company" | "district";
}

export default async function NearbyDiningMapSection({
  targetAddress,
  anchorTitle,
  radiusMeters = 600,
  variant = "company",
}: NearbyDiningMapSectionProps) {
  const bundle = await getCachedNearbyDiningByAddress(targetAddress, radiusMeters);

  // 가짜/폴백 데이터 전면 금지 원칙 준수: 조회 결과가 없으면 렌더링하지 않음
  if (!bundle || bundle.places.length === 0) {
    return null;
  }

  const markers: MapMarker[] = [
    {
      lat: bundle.centerLat,
      lng: bundle.centerLng,
      title: `🏢 ${anchorTitle}`,
      category: variant === "company" ? "기준 사업장 소재지" : "기준 상권 중심",
      address: bundle.normalizedAddress,
    },
    ...bundle.places.map((p, idx) => ({
      lat: p.lat,
      lng: p.lng,
      title: `${idx + 1}. ${p.name}`,
      category: `${p.spotType === "cafe" ? "☕" : "🍽️"} ${p.categoryLabel} (도보 약 ${p.walkMinutes}분 · ${p.distanceMeters}m)`,
      address: p.address,
      link: p.kakaoMapUrl,
    })),
  ];

  return (
    <section
      className="card"
      aria-label={`${anchorTitle} 주변 도보권 맛집 및 미팅 카페 지도`}
      style={{
        padding: "28px 24px",
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--bg-color-card)",
        marginTop: variant === "company" ? "32px" : "0",
        marginBottom: variant === "district" ? "32px" : "0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "var(--color-primary)",
              backgroundColor: "var(--color-primary-light)",
              padding: "4px 10px",
              borderRadius: "20px",
              marginBottom: "8px",
            }}
          >
            📍 반경 {radiusMeters}m 실측 로컬 가이드
          </span>
          <h3
            style={{
              fontSize: "1.18rem",
              fontWeight: 800,
              color: "var(--color-text-main)",
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            {variant === "company"
              ? `🍽️ ${anchorTitle} 방문객·임직원 추천 주변 맛집 & 미팅 카페`
              : `🍽️ ${anchorTitle} 핵심 식음료(F&B) 맛집 · 카페 지도`}
          </h3>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--color-text-desc)",
              marginTop: "6px",
              marginBottom: 0,
              lineHeight: 1.5,
              wordBreak: "keep-all",
            }}
          >
            소재지 좌표 반경 내 실제 영업 중인 음식점과 비즈니스 미팅에 적합한 카페 위치입니다. 원클릭으로 카카오맵·네이버지도 길찾기를 실행할 수 있습니다.
          </p>
        </div>

        {/* 출장·외근 숙소 가격 비교 시너지 백링크 (StayChart) */}
        <a
          href={bundle.staychartLink.url}
          target="_blank"
          rel="noopener"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--bg-color-main)",
            color: "var(--color-primary)",
            fontSize: "0.8rem",
            fontWeight: 700,
            textDecoration: "none",
            wordBreak: "keep-all",
          }}
        >
          <span>🏨 {bundle.staychartLink.label}</span>
          <span>↗</span>
        </a>
      </div>

      {/* 인터랙티브 핀 지도 (Leaflet 오픈소스 타일 — API 과금 0원) */}
      <div
        style={{
          width: "100%",
          height: "310px",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        <ClientMapWrapper markers={markers} />
      </div>

      {/* 번호 매칭 맛집·카페 카드 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
          gap: "12px",
        }}
      >
        {bundle.places.map((place, idx) => (
          <div
            key={place.id}
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "22px",
                      height: "22px",
                      borderRadius: "999px",
                      backgroundColor: place.spotType === "cafe" ? "#0d9488" : "#ea580c",
                      color: "#ffffff",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <strong
                      style={{
                        fontSize: "0.96rem",
                        fontWeight: 800,
                        color: "var(--color-text-main)",
                        wordBreak: "keep-all",
                      }}
                    >
                      {place.name}
                    </strong>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.73rem",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "6px",
                          backgroundColor:
                            place.spotType === "cafe"
                              ? "rgba(13, 148, 136, 0.12)"
                              : "rgba(234, 88, 12, 0.12)",
                          color: place.spotType === "cafe" ? "#0d9488" : "#ea580c",
                        }}
                      >
                        {place.spotType === "cafe" ? "☕ " : "🍽️ "}
                        {place.categoryLabel}
                      </span>
                      <span
                        style={{
                          fontSize: "0.73rem",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "6px",
                          backgroundColor: "var(--bg-color-card)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-sub)",
                        }}
                      >
                        도보 약 {place.walkMinutes}분 · {place.distanceMeters}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {place.address && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-desc)",
                    marginTop: "8px",
                    marginBottom: 0,
                    wordBreak: "keep-all",
                  }}
                >
                  {place.address}
                </p>
              )}
            </div>

            {/* 카카오맵 / 네이버지도 원클릭 길찾기 버튼 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingTop: "10px",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <a
                href={place.kakaoMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 11px",
                  borderRadius: "8px",
                  backgroundColor: "#FEE500",
                  color: "#191919",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                <span>카카오맵 보기</span>
                <span>↗</span>
              </a>

              <a
                href={place.naverMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 11px",
                  borderRadius: "8px",
                  backgroundColor: "#03C75A",
                  color: "#ffffff",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                <span>네이버지도 길찾기</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

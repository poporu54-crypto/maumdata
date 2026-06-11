"use client";

import React, { useEffect, useRef, useState } from "react";

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  category: string;
  address: string;
  link?: string;
}

interface InteractiveMapProps {
  markers: MapMarker[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
}

export default function InteractiveMap({
  markers,
  centerLat,
  centerLng,
  zoom = 13,
  onMarkerClick,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet Script & CSS
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadLeaflet = () => {
      // 1. CSS Load
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // 2. JS Load
      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          setLeafletLoaded(true);
        };
        document.head.appendChild(script);
      } else if ((window as any).L) {
        setLeafletLoaded(true);
      } else {
        const interval = setInterval(() => {
          if ((window as any).L) {
            setLeafletLoaded(true);
            clearInterval(interval);
          }
        }, 100);
      }
    };

    loadLeaflet();
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Default center
    const defaultLat = centerLat || 37.5665;
    const defaultLng = centerLng || 126.9780;

    // Check if map already exists
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([defaultLat, defaultLng], zoom);

      // 다크 테마 느낌의 CartoDB.DarkMatter 타일 적용 (마음데이터 UI와 일치)
      const tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      
      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);

      markersGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      // Keep instance intact unless completely unmounted
    };
  }, [leafletLoaded]);

  // Handle markers & bounds
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !markersGroupRef.current) return;
    const L = (window as any).L;
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;

    // Clear existing markers
    markersGroup.clearLayers();

    if (markers.length === 0) return;

    // Custom CSS-based divIcon for premium Toss Neon style
    markers.forEach((m) => {
      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: `
          <div style="
            width: 14px; 
            height: 14px; 
            background-color: var(--color-primary); 
            border: 3px solid #ffffff; 
            border-radius: 50%; 
            box-shadow: 0 0 10px var(--color-primary), 0 0 4px rgba(0,0,0,0.5);
            transform: translate(-50%, -50%);
            transition: all 0.2s ease;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(markersGroup);

      const popupContent = `
        <div style="
          font-family: 'Inter', -apple-system, sans-serif;
          padding: 8px 10px;
          min-width: 180px;
          border-radius: 12px;
          background-color: var(--bg-color-card);
          color: var(--color-text-main);
        ">
          <div style="font-size: 14px; font-weight: 800; color: var(--color-text-main); margin-bottom: 4px; line-height: 1.3;">
            ${m.title}
          </div>
          <div style="
            display: inline-block;
            background-color: var(--color-primary);
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 6px;
            margin-bottom: 8px;
          ">
            ${m.category}
          </div>
          <div style="font-size: 11px; color: var(--color-text-sub); line-height: 1.4; margin-bottom: 8px;">
            ${m.address}
          </div>
          ${
            m.link
              ? `<a href="${m.link}" style="
                  display: block;
                  text-align: center;
                  background-color: var(--color-primary-light);
                  color: var(--color-primary);
                  font-size: 11px;
                  font-weight: 700;
                  padding: 6px 10px;
                  border-radius: 8px;
                  text-decoration: none;
                  transition: background-color 0.2s;
                " onmouseover="this.style.filter='brightness(0.9)'" onmouseout="this.style.filter='none'">
                  상권 리포트 보기
                </a>`
              : ""
          }
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: "custom-leaflet-popup",
        closeButton: false,
        offset: [0, -5]
      });

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(m));
      }
    });

    // Fit bounds dynamically if multiple markers are available
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 15);
    }
  }, [leafletLoaded, markers]);

  // Handle dynamic camera focus changes
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    if (centerLat && centerLng) {
      mapRef.current.flyTo([centerLat, centerLng], zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [leafletLoaded, centerLat, centerLng, zoom]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {!leafletLoaded && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "var(--bg-color-card)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          borderRadius: "14px",
          border: "1px solid var(--color-border)"
        }}>
          <div className="animate-pulse-subtle" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-sub)" }}>
            지도 데이터를 불러오는 중...
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)"
        }}
      />
      
      <style jsx global>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background-color: var(--bg-color-card) !important;
          color: var(--color-text-main) !important;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-md);
          padding: 0px;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 4px;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background-color: var(--bg-color-card) !important;
          border-left: 1px solid var(--color-border);
          border-down: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}

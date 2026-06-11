"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MapMarker } from "./InteractiveMap";

// 브라우저 런타임에서만 동작하도록 ssr: false 처리된 InteractiveMap을 dynamic import 합니다.
const InteractiveMap = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
});

interface ClientMapWrapperProps {
  markers: MapMarker[];
}

export default function ClientMapWrapper({ markers }: ClientMapWrapperProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <InteractiveMap markers={markers} />
    </div>
  );
}

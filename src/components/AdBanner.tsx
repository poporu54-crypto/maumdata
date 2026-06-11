"use client";

import React, { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    try {
      // 이미 window.adsbygoogle이 로드되었고 push할 대상이 있는지 체크 후 안전하게 트리거
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense push error:", e);
    }
  }, []);

  return (
    <div style={{ margin: "28px 0", textAlign: "center", width: "100%", overflow: "hidden" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3713361723411048"
        data-ad-slot="2095684443"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

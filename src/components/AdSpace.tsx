"use client";

import React, { useEffect, useRef, useState } from "react";

// 구글 애드센스 실제 연동 코드 소스화 (중앙 관리)
export const ADSENSE_CLIENT = "ca-pub-3713361723411048";
export const ADSENSE_SLOTS = {
  display: "2095684443",
  infeed: "6981214035",
  infeedLayout: "-gw-3+1f-3d+2z",
};

interface AdSpaceProps {
  client?: string; // ca-pub-XXXXX
  slot?: string; // 10자리 숫자 슬롯 ID
  adType?: "display" | "infeed";
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  responsive?: string;
  style?: React.CSSProperties;
}

export default function AdSpace({
  client,
  slot,
  adType = "display",
  format = "auto",
  responsive = "true",
  style = {},
}: AdSpaceProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const [isUnfilled, setIsUnfilled] = useState(false);

  const targetClient = client || ADSENSE_CLIENT;
  const targetSlot =
    slot === "8888888888"
      ? ""
      : slot || (adType === "infeed" ? ADSENSE_SLOTS.infeed : ADSENSE_SLOTS.display);

  useEffect(() => {
    if (!targetSlot || typeof window === "undefined") return;
    const insEl = insRef.current;
    if (!insEl) return;

    const observer = new MutationObserver(() => {
      const adStatus = insEl.getAttribute("data-ad-status");
      if (adStatus === "unfilled") {
        setIsUnfilled(true);
      }
    });
    observer.observe(insEl, { attributes: true, attributeFilter: ["data-ad-status"] });

    if (!pushedRef.current && !insEl.getAttribute("data-adsbygoogle-status")) {
      pushedRef.current = true;
      try {
        ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
      } catch {
        setIsUnfilled(true);
      }
    }

    return () => observer.disconnect();
  }, [adType, targetClient, targetSlot]);

  if (!targetSlot || isUnfilled) {
    return null;
  }

  return (
    <div
      className="ad-wrapper"
      style={{
        margin: "24px auto",
        padding: "8px",
        borderRadius: "12px",
        textAlign: "center",
        overflow: "hidden",
        width: "100%",
        maxWidth: style.width || "100%",
        ...style,
      }}
    >
      {adType === "infeed" ? (
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-format="fluid"
          data-ad-layout-key={ADSENSE_SLOTS.infeedLayout}
          data-ad-client={targetClient}
          data-ad-slot={targetSlot}
        />
      ) : (
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={targetClient}
          data-ad-slot={targetSlot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      )}
    </div>
  );
}

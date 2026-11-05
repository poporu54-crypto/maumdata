import React from "react";

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>> | null | undefined;
}

/**
 * XSS 안전 직렬화(`<` -> `\u003c`)가 기본 적용된 구조화 데이터(JSON-LD) 렌더러.
 * 클라이언트 번들을 전혀 늘리지 않으며 서버/클라이언트 컴포넌트 어디서든 사용할 수 있습니다.
 */
export default function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;

  const serialized = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}

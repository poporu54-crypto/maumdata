import { Metadata } from "next";

export const metadata: Metadata = {
  title: "대한민국 사업자 데이터 인사이트 & 산업 통계",
  description: "국세청 사업자등록 실시간 통계를 가공 및 분류하여 최신 업종별 사업자 분포, 시·도 광역 지역별 활성 기업 수 및 연도별 성장 추이 흐름을 한눈에 제공합니다.",
  alternates: {
    canonical: "/insights",
  },
  openGraph: {
    title: "대한민국 사업자 데이터 인사이트 | 마음데이타",
    description: "국세청 사업자등록 실시간 통계를 바탕으로 최신 창업 트렌드 및 산업 변화 흐름을 한눈에 확인하세요.",
    url: "https://www.maumdata.com/insights",
    type: "website",
  },
};

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

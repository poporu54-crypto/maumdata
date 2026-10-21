import { Metadata } from "next";

export const metadata: Metadata = {
  title: "전국 상권 분석 메인 허브 & 행정동 점포 빅데이터",
  description: "소상공인시장진흥공단 빅데이터와 국세청 실시간 계속/휴폐업 가동률 지표를 결합하여, 전국 시도별 주요 행정동의 상권 과밀도와 업종 구성을 진단합니다.",
  alternates: {
    canonical: "/stats/market-area",
  },
  openGraph: {
    title: "전국 상권 분석 메인 허브 | 마음데이타",
    description: "전국 주요 행정동의 실시간 상가 점포 현황, 업종별 점유 비율 및 상권 과밀도를 실시간 분석합니다.",
    url: "https://www.maumdata.com/stats/market-area",
    type: "website",
  },
};

export default function MarketAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

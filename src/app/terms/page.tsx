import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 | 마음데이터",
  description: "지윤 주식회사가 제공하는 마음데이터(MaumData) 서비스 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <div className="animate-fade-in" style={{ padding: "40px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        
        {/* 뒤로가기 링크 */}
        <div style={{ marginBottom: "24px" }}>
          <Link href="/" className="back-link" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            ➔ 메인 화면으로 돌아가기
          </Link>
        </div>

        {/* 메인 카드 */}
        <div className="card" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "28px" }}>
          
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 850, color: "var(--color-text-main)", marginBottom: "8px" }}>
              서비스 이용약관
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-desc)" }}>
              시행일자: 2026년 6월 11일
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: 0 }} />

          {/* 약관 본문 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", lineHeight: "1.7", color: "var(--color-text-sub)", fontSize: "0.95rem" }}>
            
            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제1조 (목적)
              </h2>
              <p>
                본 약관은 <strong>지윤 주식회사</strong>(이하 "회사")가 운영하는 인터넷 서비스 <strong>마음데이터(MaumData)</strong>(이하 "서비스")를 이용함에 있어, 회사와 이용자의 권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제2조 (정의)
              </h2>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>"서비스"란 회사가 제공하는 실시간 사업자 상태 검증, 기업 데이터 분석, 국가 통계 요약 지표 리포트 등 정보 포털 서비스를 의미합니다.</li>
                <li>"이용자"란 본 서비스에 접속하여 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제3조 (약관의 명시와 개정)
              </h2>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 화면 또는 연결 화면에 게시합니다.</li>
                <li>회사는 관계 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 최소 적용 7일 전(이용자에게 불리한 변경의 경우 30일 전)에 공지합니다.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제4조 (서비스의 제공 및 변경)
              </h2>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>회사는 이용자에게 실시간 사업자 상태 정보 조회, 기업 상세 분석 리포트, 지역 및 업종 통계 등의 서비스를 제공합니다.</li>
                <li>회사는 서비스의 품질 향상 또는 기술적 사양의 변경 등이 필요한 경우 제공하는 서비스의 내용을 변경할 수 있으며, 이 경우 공지사항을 통해 사전에 공지합니다.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제5조 (서비스의 이용 제한 및 중단)
              </h2>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 또는 운영상 합리적인 이유가 있는 경우 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                <li>이용자는 본 서비스가 제공하는 정보를 무단으로 대량 크롤링, 스크래핑하거나 기계적인 수단을 이용해 시스템에 부하를 주는 행위를 하여서는 안 되며, 회사는 이러한 행위가 적발될 경우 즉시 접속 제한 조치를 취할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제6조 (책임의 제한 및 면책)
              </h2>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>본 서비스에서 제공하는 실시간 사업자 조회 결과는 국세청 실시간 데이터를 기반으로 하나, 공공 데이터 제공 기관의 일시적 오류나 지연 등으로 인해 실제 현황과 일시적인 불일치가 발생할 수 있습니다. 회사는 이에 대해 고의 또는 중과실이 없는 한 책임을 지지 않습니다.</li>
                <li>회사는 서비스에서 제공하는 분석 정보 및 예측 지표의 정확성이나 특정 목적 적합성에 대해 보증하지 않으며, 이용자가 서비스의 정보를 신뢰하여 행한 의사결정이나 거래 결과에 대해 책임을 지지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제7조 (준거법 및 관할법원)
              </h2>
              <p>
                회사와 이용자 간에 발생한 서비스 이용 분쟁에 관한 소송은 대한민국 법을 준거법으로 하며, 회사의 본사 소재지를 관할하는 법원을 합의 관할법원으로 합니다.
              </p>
            </section>

          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: 0 }} />

          {/* 사업자 정보 하단 풋노트 */}
          <div style={{
            backgroundColor: "var(--bg-color-main)",
            padding: "24px",
            borderRadius: "12px",
            fontSize: "0.85rem",
            color: "var(--color-text-desc)",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}>
            <h3 style={{ fontWeight: 800, color: "var(--color-text-sub)", fontSize: "0.9rem", marginBottom: "8px" }}>
              사업자 및 서비스 운영 정보
            </h3>
            <div>• 상호명: 지윤 주식회사</div>
            <div>• 대표자: 박상욱</div>
            <div>• 사업자등록번호: 137-86-51839</div>
            <div>• 이메일 문의: poporu54@gmail.com</div>
            <div>• 웹사이트: https://www.maumdata.com</div>
          </div>

        </div>
      </div>
    </div>
  );
}

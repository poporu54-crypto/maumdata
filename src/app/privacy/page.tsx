import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 마음데이터",
  description: "지윤 주식회사가 운영하는 마음데이터(MaumData) 서비스의 개인정보처리방침입니다.",
};

export default function PrivacyPage() {
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
              개인정보처리방침
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-desc)" }}>
              시행일자: 2026년 6월 11일
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: 0 }} />

          {/* 방침 본문 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", lineHeight: "1.7", color: "var(--color-text-sub)", fontSize: "0.95rem" }}>
            
            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제1조 (개인정보의 처리 목적)
              </h2>
              <p>
                <strong>지윤 주식회사</strong>(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 개인정보 보호법 등 관련 법령을 준수하고 있습니다. 회사는 수집한 개인정보를 다음의 목적을 위해 처리하며, 목적 외의 용도로는 사용하지 않습니다.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li><strong>서비스 제공 및 운영</strong>: 실시간 사업자 검증, 맞춤형 통계 분석 리포트 제공, 비즈니스 매칭 지원 등.</li>
                <li><strong>고객 문의 처리</strong>: 서비스 이용 관련 불만 처리, 사용자 식별, 기술 지원 및 문의 사항 응대.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제2조 (처리하는 개인정보의 항목)
              </h2>
              <p>
                회사는 별도의 회원가입 없이도 대부분의 조회 서비스를 이용할 수 있도록 운영하고 있습니다. 다만, 서비스 이용 과정에서 아래와 같은 정보들이 자동으로 생성되어 수집될 수 있습니다.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li><strong>자동 수집 항목</strong>: IP 주소, 쿠키(Cookie), 서비스 방문 및 이용 기록, 접속 로그, 브라우저 종류 및 OS 정보 등.</li>
                <li><strong>문의 시 수집 항목</strong>: 이메일 주소, 문의 내용 (사용자가 직접 이메일 등을 통해 제공하는 경우에 한함).</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제3조 (개인정보의 처리 및 보유 기간)
              </h2>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                <li>사용자가 직접 보낸 이메일 문의 내역 및 관련 정보는 문의가 완전히 해결된 날로부터 <strong>3년간</strong> 보관 후 파기됩니다.</li>
                <li>통신비밀보호법에 따른 접속 로그 데이터는 <strong>3개월</strong>간 보관 후 자동으로 파기됩니다.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제4조 (개인정보의 제3자 제공)
              </h2>
              <p>
                회사는 이용자의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제5조 (정보주체의 권리·의무 및 행사방법)
              </h2>
              <p>
                이용자는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다. 권리 행사는 회사에 이메일(poporu54@gmail.com) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제6조 (개인정보의 안전성 확보 조치)
              </h2>
              <p>
                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li><strong>기술적 조치</strong>: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 전송 데이터의 암호화(SSL 보안 연결 적용).</li>
                <li><strong>관리적 조치</strong>: 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위한 백신 프로그램 운영 및 내부 관리 계획 수립.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제7조 (개인정보 보호책임자)
              </h2>
              <p>
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div style={{
                backgroundColor: "var(--bg-color-main)",
                padding: "16px 20px",
                borderRadius: "8px",
                marginTop: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}>
                <div><strong>• 개인정보 보호책임자 및 담당 부서</strong></div>
                <div>- 성명 / 직책: 박상욱 대표</div>
                <div>- 연락처/이메일: poporu54@gmail.com</div>
              </div>
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

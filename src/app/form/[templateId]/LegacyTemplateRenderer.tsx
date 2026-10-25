"use client";

import React from "react";

export interface LegacyTemplateRendererProps {
  templateId: string;
  data: any;
  handleFieldInputDirect: (key: string, value: string) => void;
  handleFieldChange: (key: string, value: any) => void;
  handleArrayFieldChange: (arrayKey: string, index: number, field: string, value: string) => void;
}

export default function LegacyTemplateRenderer({
  templateId,
  data,
  handleFieldInputDirect,
  handleFieldChange,
  handleArrayFieldChange,
}: LegacyTemplateRendererProps) {
    switch (templateId) {
      // 1. 사직서
      case "resignation":
        return (
          <div contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flexGrow: 1, fontSize: "11pt", outline: "none" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "26pt", fontWeight: 800, margin: "10px 0 25px 0", letterSpacing: "15px" }}>사직서</h1>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "10.5pt" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000000", width: "18%", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>소 속</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("dept", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("dept", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px 10px", width: "32%", outline: "none" }}
                    >
                      {data.dept}
                    </td>
                    <td style={{ border: "1px solid #000000", width: "18%", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>직 위</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("rank", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("rank", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px 10px", width: "32%", outline: "none" }}
                    >
                      {data.rank}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>성 명</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("name", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("name", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px 10px", outline: "none" }}
                    >
                      {data.name}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>생년월일</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("birth", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("birth", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px 10px", outline: "none" }}
                    >
                      {data.birth}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>연락처</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("phone", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("phone", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px 10px", outline: "none" }}
                    >
                      {data.phone}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>주 소</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("address", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("address", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px 10px", outline: "none" }}
                    >
                      {data.address}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>사직 예정일</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("leaveDate", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("leaveDate", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px 10px", fontWeight: "bold", outline: "none" }}
                    >
                      {data.leaveDate}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap", height: "130px" }}>사직 사유</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("reason", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("reason", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px 10px", verticalAlign: "top", whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "break-word", outline: "none" }}
                    >
                      {data.reason}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: "25px", fontSize: "11pt", lineHeight: 1.8 }}>
                <p style={{ textIndent: "12px", wordBreak: "keep-all", overflowWrap: "break-word" }}>
                  상기 본인은 일신상의 사유로 인하여 사직하고자 사직서를 제출하오며, 퇴사 시까지 인수인계를 성실히 수행하고 회사 영업 비밀을 유지할 것을 서약합니다.
                </p>
              </div>
            </div>
            <div className="generic-footer-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "15px", marginTop: "15px" }}>
              <div 
                onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
                style={{ fontSize: "12pt", fontWeight: "bold", outline: "none" }}
              >
                {data.date}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "350px", fontSize: "11pt" }}>
                <span>신 청 인 :</span>
                <span 
                  onInput={(e) => handleFieldInputDirect("name", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("name", e.currentTarget.innerText)}
                  style={{ fontWeight: "bold", outline: "none" }}
                >
                  {data.name} (서명 / 인)
                </span>
              </div>
              {data.company && (
                <h2 
                  onInput={(e) => handleFieldInputDirect("company", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("company", e.currentTarget.innerText)}
                  style={{ fontSize: "16pt", fontWeight: 800, marginTop: "15px", letterSpacing: "2px", outline: "none" }}
                >
                  {data.company.endsWith("귀하") ? data.company : `${data.company} 귀하`}
                </h2>
              )}
            </div>
          </div>
        );

      // 2. 표준 이력서
      // 2. 표준 이력서
      case "resume":
        return (
          <div contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", flexGrow: 1, fontSize: "9.5pt", outline: "none" }}>
            <h1 style={{ textAlign: "center", fontSize: "26pt", fontWeight: 800, margin: "10px 0 20px 0", letterSpacing: "12px" }}>이 력 서</h1>
            
            <h3 style={{ borderLeft: "4px solid #000", paddingLeft: "8px", fontWeight: "bold", fontSize: "11.5pt", margin: "15px 0 8px 0" }}>1. 인적 사항</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", marginBottom: "15px", fontSize: "9.5pt" }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #000000", width: "20%", padding: "8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>성명 (한글)</td>
                  <td 
                    onInput={(e) => handleFieldInputDirect("nameKo", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("nameKo", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "8px", width: "30%", outline: "none" }}
                  >
                    {data.nameKo}
                  </td>
                  <td style={{ border: "1px solid #000000", width: "20%", padding: "8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>성명 (영문)</td>
                  <td 
                    onInput={(e) => handleFieldInputDirect("nameEn", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("nameEn", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "8px", width: "30%", outline: "none" }}
                  >
                    {data.nameEn}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>생년월일</td>
                  <td 
                    onInput={(e) => handleFieldInputDirect("birth", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("birth", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "8px", outline: "none" }}
                  >
                    {data.birth}
                  </td>
                  <td style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>연락처</td>
                  <td 
                    onInput={(e) => handleFieldInputDirect("phone", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("phone", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "8px", outline: "none" }}
                  >
                    {data.phone}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>이메일</td>
                  <td 
                    colSpan={3} 
                    onInput={(e) => handleFieldInputDirect("email", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("email", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "8px", outline: "none" }}
                  >
                    {data.email}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>주소</td>
                  <td 
                    colSpan={3} 
                    onInput={(e) => handleFieldInputDirect("address", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("address", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "8px", outline: "none" }}
                  >
                    {data.address}
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ borderLeft: "4px solid #000", paddingLeft: "8px", fontWeight: "bold", fontSize: "11.5pt", margin: "15px 0 8px 0" }}>2. 학력 사항</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", marginBottom: "15px", fontSize: "9.5pt" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", textAlign: "center", fontWeight: "bold" }}>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "35%" }}>재학 기간</td>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "25%" }}>학교명</td>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "25%" }}>전공</td>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "15%" }}>구분</td>
                </tr>
              </thead>
              <tbody>
                {data.education?.map((edu: any, i: number) => (
                  <tr key={i}>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("education", i, "period", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {edu.period || "-"}
                    </td>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("education", i, "school", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {edu.school || "-"}
                    </td>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("education", i, "major", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {edu.major || "-"}
                    </td>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("education", i, "status", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {edu.status || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ borderLeft: "4px solid #000", paddingLeft: "8px", fontWeight: "bold", fontSize: "11.5pt", margin: "15px 0 8px 0" }}>3. 경력 사항</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", marginBottom: "15px", fontSize: "9.5pt" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", textAlign: "center", fontWeight: "bold" }}>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "35%" }}>근무 기간</td>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "25%" }}>회사명</td>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "15%" }}>직위</td>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "25%" }}>담당 업무</td>
                </tr>
              </thead>
              <tbody>
                {data.experience?.map((exp: any, i: number) => (
                  <tr key={i}>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("experience", i, "period", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {exp.period || "-"}
                    </td>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("experience", i, "company", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {exp.company || "-"}
                    </td>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("experience", i, "rank", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {exp.rank || "-"}
                    </td>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("experience", i, "task", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", outline: "none" }}
                    >
                      {exp.task || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ borderLeft: "4px solid #000", paddingLeft: "8px", fontWeight: "bold", fontSize: "11.5pt", margin: "15px 0 8px 0" }}>4. 자격 및 면허</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", marginBottom: "15px", fontSize: "9.5pt" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", textAlign: "center", fontWeight: "bold" }}>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "25%" }}>취득 일자</td>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "40%" }}>자격 및 면허명</td>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "20%" }}>발급 기관</td>
                  <td style={{ border: "1px solid #000000", padding: "8px", width: "15%" }}>결과</td>
                </tr>
              </thead>
              <tbody>
                {data.skills?.map((skill: any, i: number) => (
                  <tr key={i}>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("skills", i, "date", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {skill.date || "-"}
                    </td>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("skills", i, "name", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {skill.name || "-"}
                    </td>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("skills", i, "org", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {skill.org || "-"}
                    </td>
                    <td 
                      onBlur={(e) => handleArrayFieldChange("skills", i, "score", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", outline: "none" }}
                    >
                      {skill.score || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ borderLeft: "4px solid #000", paddingLeft: "8px", fontWeight: "bold", fontSize: "11.5pt", margin: "15px 0 8px 0" }}>5. 자기소개서</h3>
            <div 
              onInput={(e) => handleFieldInputDirect("intro", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("intro", e.currentTarget.innerText)}
              style={{ border: "2px solid #000000", padding: "15px", minHeight: "180px", fontSize: "10pt", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "keep-all", outline: "none" }}
            >
              {data.intro}
            </div>
          </div>
        );

      case "contract":
      case "contract_minor":
      case "contract_construction":
      case "contract_short_time":
      case "contract_foreigner": {
        // 날짜 파싱 헬퍼 함수
        const parseDateOrEmpty = (dateStr: string, defaultYear = "    ", defaultMonth = "  ", defaultDay = "  ") => {
          if (!dateStr) {
            return { y: defaultYear, m: defaultMonth, d: defaultDay, hasValue: false };
          }
          const match = dateStr.match(/(\d{4})년?\s*(\d{1,2})월?\s*(\d{1,2})일?/);
          if (match) {
            return { y: match[1], m: String(Number(match[2])).padStart(2, "0"), d: String(Number(match[3])).padStart(2, "0"), hasValue: true };
          }
          const matchDot = dateStr.match(/(\d{4})[.-]\s*(\d{1,2})[.-]\s*(\d{1,2})/);
          if (matchDot) {
            return { y: matchDot[1], m: String(Number(matchDot[2])).padStart(2, "0"), d: String(Number(matchDot[3])).padStart(2, "0"), hasValue: true };
          }
          return { y: dateStr, m: "", d: "", hasValue: true };
        };

        // 공용 밑줄 공란 렌더러 헬퍼 (HWP 인라인 언더라인 완벽 재현 & 양방향 편집 연동)
        const renderUnderline = (val: string, minWidth = "100px", fieldKey?: string, padding = "0 8px") => (
          <span 
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={fieldKey ? (e) => handleFieldInputDirect(fieldKey, e.currentTarget.innerText) : undefined}
            onBlur={fieldKey ? (e) => handleFieldChange(fieldKey, e.currentTarget.innerText) : undefined}
            style={{
              borderBottom: "1.2px solid #000000",
              display: "inline-block",
              minWidth: minWidth,
              textAlign: "center",
              fontWeight: "bold",
              padding: padding,
              color: val ? "#000000" : "transparent",
              whiteSpace: "nowrap",
              outline: "none",
              cursor: "text"
            }}
            className={fieldKey ? "editable-value-field" : ""}
            data-field-key={fieldKey}
          >
            {val || "\u00a0"}
          </span>
        );

        const renderCheck = (isChecked: boolean) => (
          <span style={{ fontFamily: "serif", fontWeight: "bold", fontSize: "10.5pt", margin: "0 2px" }}>
            ({isChecked ? "✔" : "  "})
          </span>
        );

        const renderTimePart = (timeStr: string, type: "H" | "M") => {
          if (!timeStr) return "\u00a0\u00a0";
          const parts = timeStr.split(":");
          if (type === "H") return parts[0] || "\u00a0\u00a0";
          return parts[1] || "\u00a0\u00a0";
        };

        const dSign = parseDateOrEmpty(data.date);

        if (templateId === "contract") {
          const isFixedTerm = data.contractEnd && data.contractEnd !== "기한의 정함이 없음";
          const dStart = parseDateOrEmpty(data.contractStart);
          const dEnd = parseDateOrEmpty(data.contractEnd);
          const hasBonus = data.bonusAmt && data.bonusAmt !== "없음";
          const hasOtherPay = data.otherPayAmt && data.otherPayAmt !== "없음";
          const isDirect = data.payMethod?.includes("직접");
          const isBank = data.payMethod?.includes("계좌") || data.payMethod?.includes("통장") || data.payMethod?.includes("입금");

          return (
            <div className="contract-compact hwp-document" contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, minHeight: "920px", fontSize: "9.5pt", fontFamily: "'Batang', '바탕', 'Times New Roman', serif", lineHeight: 1.6, color: "#000000", padding: "30px 35px", boxSizing: "border-box", outline: "none" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                  <div style={{ border: "2px solid #000000", padding: "6px 40px", fontSize: "16pt", fontWeight: "bold", textAlign: "center", letterSpacing: "6px", backgroundColor: "#ffffff" }}>
                    표 준 근 로 계 약 서
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "8.5pt", marginBottom: "15px" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "5px 6px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>사업주 (상호)</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "5px 6px", width: "32%", outline: "none" }}
                      >
                        {data.employerName}
                      </td>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "5px 6px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>근로자 성명</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeeName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeeName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "5px 6px", width: "32%", outline: "none" }}
                      >
                        {data.employeeName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>대표자 성명</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerCEO", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerCEO", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "5px 6px", outline: "none" }}
                      >
                        {data.employerCEO}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>연락처</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeePhone", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeePhone", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "5px 6px", outline: "none" }}
                      >
                        {data.employeePhone}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>사업장 주소</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerAddr", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerAddr", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "5px 6px", outline: "none" }}
                      >
                        {data.employerAddr}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>근로자 주소</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeeAddr", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeeAddr", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "5px 6px", outline: "none" }}
                      >
                        {data.employeeAddr}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ wordBreak: "keep-all", marginBottom: "15px" }}>
                  <p style={{ textIndent: "10px", margin: "0 0 14px 0", fontSize: "9.8pt", lineHeight: 1.6 }}>
                    {renderUnderline(data.employerName, "160px", "employerName")} (이하 “사업주”라 함)과(와) {renderUnderline(data.employeeName, "110px", "employeeName")} (이하 “근로자”라 함)은 다음과 같이 근로계약을 체결한다.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "9.5pt" }}>
                    <div>
                      <strong>1. 근로계약기간 :</strong>
                      {isFixedTerm ? (
                        <span>
                          {" "}{dStart.hasValue ? <>{renderUnderline(dStart.y, "45px")}년 {renderUnderline(dStart.m, "25px")}월 {renderUnderline(dStart.d, "25px")}일</> : renderUnderline(data.contractStart, "120px", "contractStart")}부터 
                          {dEnd.hasValue ? <>{renderUnderline(dEnd.y, "45px")}년 {renderUnderline(dEnd.m, "25px")}월 {renderUnderline(dEnd.d, "25px")}일까지</> : <> {renderUnderline(data.contractEnd, "120px", "contractEnd")}까지</>}
                        </span>
                      ) : (
                        <span>
                          {" "}{dStart.hasValue ? <>{renderUnderline(dStart.y, "45px")}년 {renderUnderline(dStart.m, "25px")}월 {renderUnderline(dStart.d, "25px")}일</> : renderUnderline(data.contractStart, "120px", "contractStart")}부터 기한의 정함이 없는 근로계약을 체결한 것으로 한다.
                        </span>
                      )}
                      <div style={{ fontSize: "8.0pt", textIndent: "15px", color: "#444444", marginTop: "2px" }}>
                        ※ 근로계약기간을 정하지 않는 경우에는 “근로개시일”만 기재
                      </div>
                    </div>
                    
                    <div>
                      <strong>2. 근 무 장 소 :</strong> {renderUnderline(data.workPlace, "380px", "workPlace")}
                    </div>
                    
                    <div>
                      <strong>3. 업무의 내용 :</strong> {renderUnderline(data.workTask, "380px", "workTask")}
                    </div>
                    
                    <div>
                      <strong>4. 소정근로시간 :</strong> {renderUnderline(renderTimePart(data.workTimeStart, "H"), "30px", "workTimeStart")}시 {renderUnderline(renderTimePart(data.workTimeStart, "M"), "30px")}분부터 {renderUnderline(renderTimePart(data.workTimeEnd, "H"), "30px", "workTimeEnd")}시 {renderUnderline(renderTimePart(data.workTimeEnd, "M"), "30px")}분까지 (휴게시간 : {renderUnderline(renderTimePart(data.breakTimeStart, "H"), "25px", "breakTimeStart")}시 {renderUnderline(renderTimePart(data.breakTimeStart, "M"), "25px")}분 ~ {renderUnderline(renderTimePart(data.breakTimeEnd, "H"), "25px", "breakTimeEnd")}시 {renderUnderline(renderTimePart(data.breakTimeEnd, "M"), "25px")}분)
                    </div>
                    
                    <div>
                      <strong>5. 근무일 / 휴일 :</strong> 매주 {renderUnderline(data.workingDays, "120px", "workingDays")} 근무, 주휴일은 매주 {renderUnderline(data.holiday, "80px", "holiday")}요일로 한다.
                    </div>
                    
                    <div>
                      <strong>6. 임 금 :</strong>
                      <div style={{ paddingLeft: "15px", marginTop: "5px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div>- {data.salaryType || "월"}급 : {renderUnderline(data.salaryAmt, "140px", "salaryAmt")}원</div>
                        <div>- 상여금 : 있음 {renderCheck(hasBonus)} {renderUnderline(hasBonus ? data.bonusAmt : "", "100px", "bonusAmt")}원, 없음 {renderCheck(!hasBonus)}</div>
                        <div>- 기타급여(제수당 등) : 있음 {renderCheck(hasOtherPay)} , 없음 {renderCheck(!hasOtherPay)}
                          {hasOtherPay && <span style={{ marginLeft: "5px" }}>({renderUnderline(data.otherPayAmt, "200px", "otherPayAmt")}원)</span>}
                        </div>
                        <div>- 임금지급일 : 매월(매주 또는 매일) {renderUnderline(data.payDay, "60px", "payDay")}일 (휴일의 경우는 전일 지급)</div>
                        <div>- 지급방법 : 근로자에게 직접지급 {renderCheck(isDirect)}, 근로자 명의 예금통장에 입금 {renderCheck(isBank)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <strong>7. 연차유급휴가 :</strong>
                      <div style={{ paddingLeft: "15px" }}>- 연차유급휴가는 근로기준법에서 정하는 바에 따라 부여함.</div>
                    </div>
                    
                    <div>
                      <strong>8. 근로계약서 교부 :</strong>
                      <div style={{ paddingLeft: "15px" }}>
                        - 사업주는 근로계약을 체결함과 동시에 본 계약서를 복사하여 근로자의 교부요구 여부와 관계없이 근로자에게 교부함(근로기준법 제17조 이행).
                      </div>
                    </div>
                    
                    <div>
                      <strong>9. 기 타 :</strong>
                      <div style={{ paddingLeft: "15px" }}>- 본 계약에 정하지 아니한 사항은 근로기준법령에 의함.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="contract-footer-block">
                <div style={{ display: "flex", justifyContent: "center", margin: "25px 0 15px 0", fontSize: "9.8pt", fontWeight: "bold" }}>
                  {dSign.hasValue ? (
                    <>{renderUnderline(dSign.y, "45px")}년 {renderUnderline(dSign.m, "25px")}월 {renderUnderline(dSign.d, "25px")}일</>
                  ) : (
                    <>　　　  년 　　 월 　　 일</>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5pt", borderTop: "1.2px solid #000000", paddingTop: "12px" }}>
                  <div style={{ width: "48%", lineHeight: 1.7 }}>
                    <strong>(사업주)</strong> 사업체명: {data.employerName}<br />
                    주소: {data.employerAddr}<br />
                    대표자: {renderUnderline(data.employerCEO, "90px", "employerCEO")} (서명 또는 인)
                  </div>
                  <div style={{ width: "48%", lineHeight: 1.7 }}>
                    <strong>(근로자)</strong> 주소: {data.employeeAddr}<br />
                    연락처: {data.employeePhone}<br />
                    성명: {renderUnderline(data.employeeName, "90px", "employeeName")} (서명 또는 인)
                  </div>
                </div>
              </div>
            </div>
          );
        }
        if (templateId === "contract_minor") {
          const dStart = parseDateOrEmpty(data.contractStart);
          const dEnd = parseDateOrEmpty(data.contractEnd);
          const hasBonus = data.bonusAmt && data.bonusAmt !== "없음";
          const hasOtherPay = data.otherPayAmt && data.otherPayAmt !== "없음";
          const isDirect = data.payMethod?.includes("직접");
          const isBank = data.payMethod?.includes("계좌") || data.payMethod?.includes("통장") || data.payMethod?.includes("입금");

          return (
            <div className="contract-compact hwp-document" contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, minHeight: "920px", fontSize: "9.2pt", fontFamily: "'Batang', '바탕', 'Times New Roman', serif", lineHeight: 1.5, color: "#000000", padding: "25px 30px", boxSizing: "border-box", outline: "none" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
                  <div style={{ border: "2px solid #000000", padding: "5px 30px", fontSize: "14pt", fontWeight: "bold", textAlign: "center", backgroundColor: "#ffffff" }}>
                    연소근로자 표준근로계약서 (친권자 동의서 포함)
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "8.5pt", marginBottom: "12px" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>사업주 (상호)</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", width: "32%", outline: "none" }}
                      >
                        {data.employerName}
                      </td>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>근로자 성명</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeeName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeeName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", width: "32%", outline: "none" }}
                      >
                        {data.employeeName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>대표자 성명</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerCEO", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerCEO", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employerCEO}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>연락처</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeePhone", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeePhone", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employeePhone}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>사업장 주소</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerAddr", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerAddr", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employerAddr}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>근로자 주소</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeeAddr", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeeAddr", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employeeAddr}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ wordBreak: "keep-all", marginBottom: "10px" }}>
                  <p style={{ textIndent: "10px", margin: "0 0 10px 0", fontSize: "9.5pt" }}>
                    {renderUnderline(data.employerName, "150px", "employerName")} (이하 “사업주”라 함)과(와) {renderUnderline(data.employeeName, "100px", "employeeName")} (이하 “근로자”라 함)은 다음과 같이 근로계약을 체결한다.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "9.2pt" }}>
                    <div>
                      <strong>1. 근로계약기간 :</strong>
                      {" "}{dStart.hasValue ? <>{renderUnderline(dStart.y, "40px")}년 {renderUnderline(dStart.m, "22px")}월 {renderUnderline(dStart.d, "22px")}일</> : renderUnderline(data.contractStart, "100px", "contractStart")}부터 
                      {dEnd.hasValue ? <>{renderUnderline(dEnd.y, "40px")}년 {renderUnderline(dEnd.m, "22px")}월 {renderUnderline(dEnd.d, "22px")}일까지</> : <> {renderUnderline(data.contractEnd, "100px", "contractEnd")}까지</>}
                    </div>
                    
                    <div>
                      <strong>2. 근 무 장 소 :</strong> {renderUnderline(data.workPlace, "380px", "workPlace")}
                    </div>
                    
                    <div>
                      <strong>3. 업무의 내용 :</strong> {renderUnderline(data.workTask, "380px", "workTask")}
                    </div>
                    
                    <div>
                      <strong>4. 소정근로시간 :</strong> {renderUnderline(renderTimePart(data.workTimeStart, "H"), "30px", "workTimeStart")}시 {renderUnderline(renderTimePart(data.workTimeStart, "M"), "30px")}분부터 {renderUnderline(renderTimePart(data.workTimeEnd, "H"), "30px", "workTimeEnd")}시 {renderUnderline(renderTimePart(data.workTimeEnd, "M"), "30px")}분까지 (휴게시간 : {renderUnderline(renderTimePart(data.breakTimeStart, "H"), "25px")}시 {renderUnderline(renderTimePart(data.breakTimeStart, "M"), "25px")}분 ~ {renderUnderline(renderTimePart(data.breakTimeEnd, "H"), "25px")}시 {renderUnderline(renderTimePart(data.breakTimeEnd, "M"), "25px")}분)
                    </div>
                    
                    <div>
                      <strong>5. 근무일 / 휴일 :</strong> 매주 {renderUnderline(data.workingDays, "120px", "workingDays")} 근무, 주휴일은 매주 {renderUnderline(data.holiday, "80px", "holiday")}요일로 한다.
                    </div>
                    
                    <div>
                      <strong>6. 임 금 :</strong>
                      <div style={{ paddingLeft: "15px", marginTop: "3px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div>- {data.salaryType || "시"}급 : {renderUnderline(data.salaryAmt, "120px", "salaryAmt")}원</div>
                        <div>- 상여금 : 있음 {renderCheck(hasBonus)} {renderUnderline(hasBonus ? data.bonusAmt : "", "90px", "bonusAmt")}원, 없음 {renderCheck(!hasBonus)}</div>
                        <div>- 기타급여 : 있음 {renderCheck(hasOtherPay)} {hasOtherPay ? `(${renderUnderline(data.otherPayAmt, "90px", "otherPayAmt")}원)` : ""}, 없음 {renderCheck(!hasOtherPay)}</div>
                        <div>- 임금지급일 : 매월 {renderUnderline(data.payDay, "60px", "payDay")}일 / 지급방법 : 직접지급 {renderCheck(isDirect)}, 계좌입금 {renderCheck(isBank)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <strong>7. 연차유급휴가 :</strong> 근로기준법에서 정하는 바에 따라 부여함.
                    </div>
                    
                    <div>
                      <strong>8. 가족관계증명 확인 및 친권자 동의서 교부 :</strong>
                      <div style={{ paddingLeft: "15px", fontSize: "8.8pt", color: "#333333" }}>
                        - 사업주는 만 18세 미만인 자를 고용할 경우 가족관계기록사항에 관한 증명서와 친권자(후견인) 동의서를 사업장에 비치해야 함(근로기준법 제66조).
                      </div>
                    </div>

                    <div style={{ border: "1.5px solid #000000", padding: "10px", marginTop: "5px", backgroundColor: "#ffffff" }}>
                      <div style={{ textAlign: "center", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "4px", marginBottom: "8px", fontSize: "9.5pt" }}>
                        [ 친권자 (후견인) 동의서 ]
                      </div>
                      <div style={{ fontSize: "8.8pt", lineHeight: 1.5 }}>
                        본인은 연소근로자 {renderUnderline(data.employeeName, "70px", "employeeName")}의 친권자(후견인)로서, 상기 근로 조건에 따른 근로계약을 체결하고 근무하는 것에 동의합니다.
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px", fontSize: "8.5pt" }}>
                        <div style={{ width: "48%" }}>성명: {renderUnderline(data.parentName, "80px", "parentName")} (인/서명)</div>
                        <div style={{ width: "48%" }}>관계: {renderUnderline(data.parentRelation, "80px", "parentRelation")}</div>
                        <div style={{ width: "48%" }}>생년월일: {renderUnderline(data.parentBirth, "100px", "parentBirth")}</div>
                        <div style={{ width: "48%" }}>연락처: {renderUnderline(data.parentPhone, "100px", "parentPhone")}</div>
                        <div style={{ width: "100%" }}>주소: {renderUnderline(data.parentAddr, "280px", "parentAddr")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="contract-footer-block">
                <div style={{ display: "flex", justifyContent: "center", margin: "15px 0 10px 0", fontSize: "9.2pt", fontWeight: "bold" }}>
                  {dSign.hasValue ? (
                    <>{renderUnderline(dSign.y, "40px")}년 {renderUnderline(dSign.m, "22px")}월 {renderUnderline(dSign.d, "22px")}일</>
                  ) : (
                    <>　　　  년 　　 월 　　 일</>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.2pt", borderTop: "1.2px solid #000000", paddingTop: "8px" }}>
                  <div style={{ width: "48%", lineHeight: 1.5 }}>
                    <strong>(사업주)</strong> 상호: {data.employerName}<br />
                    주소: {data.employerAddr}<br />
                    대표자: {renderUnderline(data.employerCEO, "80px", "employerCEO")} (인)
                  </div>
                  <div style={{ width: "48%", lineHeight: 1.5 }}>
                    <strong>(근로자)</strong> 주소: {data.employeeAddr}<br />
                    연락처: {data.employeePhone}<br />
                    성명: {renderUnderline(data.employeeName, "80px", "employeeName")} (인)
                  </div>
                </div>
              </div>
            </div>
          );
        }
        if (templateId === "contract_construction") {
          const dStart = parseDateOrEmpty(data.contractStart);
          const isDirect = data.payMethod?.includes("직접");
          const isBank = data.payMethod?.includes("계좌") || data.payMethod?.includes("통장") || data.payMethod?.includes("입금");

          return (
            <div className="contract-compact hwp-document" contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, minHeight: "920px", fontSize: "9.2pt", fontFamily: "'Batang', '바탕', 'Times New Roman', serif", lineHeight: 1.5, color: "#000000", padding: "25px 30px", boxSizing: "border-box", outline: "none" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
                  <div style={{ border: "2px solid #000000", padding: "5px 30px", fontSize: "14pt", fontWeight: "bold", textAlign: "center", backgroundColor: "#ffffff" }}>
                    건설일용근로자 표준근로계약서
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "8.5pt", marginBottom: "12px" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>사업주 (상호·성명)</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", width: "32%", outline: "none" }}
                      >
                        {data.employerName}
                      </td>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>근로자 성명</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeeName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeeName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", width: "32%", outline: "none" }}
                      >
                        {data.employeeName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>대표자 성명</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerCEO", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerCEO", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employerCEO}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>주민등록번호</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeeRegNo", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeeRegNo", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employeeRegNo || ""}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>사업장 주소</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerAddr", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerAddr", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employerAddr}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>연락처</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeePhone", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeePhone", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employeePhone}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ wordBreak: "keep-all", marginBottom: "10px" }}>
                  <p style={{ textIndent: "10px", margin: "0 0 10px 0", fontSize: "9.5pt" }}>
                    {renderUnderline(data.employerName, "150px", "employerName")} (이하 “사업주”라 함)과(와) {renderUnderline(data.employeeName, "100px", "employeeName")} (이하 “근로자”라 함)은 다음과 같이 근로계약을 체결한다.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "9.2pt" }}>
                    <div>
                      <strong>1. 근로계약기간 :</strong>
                      {" "}{dStart.hasValue ? <>{renderUnderline(dStart.y, "40px")}년 {renderUnderline(dStart.m, "22px")}월 {renderUnderline(dStart.d, "22px")}일</> : renderUnderline(data.contractStart, "100px", "contractStart")}부터 
                      {renderUnderline(data.contractEnd, "220px", "contractEnd")}까지
                    </div>
                    
                    <div>
                      <strong>2. 근무장소 및 업무내용 :</strong><br />
                      <span style={{ paddingLeft: "15px" }}>- 근무장소 (공사명): {renderUnderline(data.workPlace, "300px", "workPlace")}</span><br />
                      <span style={{ paddingLeft: "15px" }}>- 담당업무 (직종): {renderUnderline(data.workTask, "300px", "workTask")}</span>
                    </div>
                    
                    <div>
                      <strong>3. 근로시간 및 휴게시간 :</strong> {renderUnderline(renderTimePart(data.workTimeStart, "H"), "30px", "workTimeStart")}시 {renderUnderline(renderTimePart(data.workTimeStart, "M"), "30px")}분부터 {renderUnderline(renderTimePart(data.workTimeEnd, "H"), "30px", "workTimeEnd")}시 {renderUnderline(renderTimePart(data.workTimeEnd, "M"), "30px")}분까지 (휴게시간 : {renderUnderline(renderTimePart(data.breakTimeStart, "H"), "25px", "breakTimeStart")}시 {renderUnderline(renderTimePart(data.breakTimeStart, "M"), "25px")}분 ~ {renderUnderline(renderTimePart(data.breakTimeEnd, "H"), "25px")}시 {renderUnderline(renderTimePart(data.breakTimeEnd, "M"), "25px")}분)
                    </div>
                    
                    <div>
                      <strong>4. 근로일 및 휴일 :</strong> 근무일은 매주 {renderUnderline(data.workingDays || "공사 일정에 따름", "120px", "workingDays")} 근무로 하며, 주휴일은 매주 {renderUnderline(data.holiday, "80px", "holiday")}요일로 한다.
                    </div>
                    
                    <div>
                      <strong>5. 임 금 (일급/시급) :</strong>
                      <div style={{ paddingLeft: "15px", marginTop: "3px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div>- 임금 총액 : {renderUnderline(data.salaryAmt, "120px", "salaryAmt")}원 ({data.salaryType || "일"}급)</div>
                        <div style={{ fontSize: "8.8pt", color: "#333333" }}>
                          (※ 기본급 : {renderUnderline(data.salaryBaseAmt, "100px", "salaryBaseAmt")}원 / 주휴수당 등 제수당 : {renderUnderline(data.salaryAllowance, "100px", "salaryAllowance")}원)
                        </div>
                        <div>- 임금 지급일 : {renderUnderline(data.payDay, "180px", "payDay")}에 지급한다.</div>
                        <div>- 지급방법 : 근로자에게 직접지급 {renderCheck(isDirect)}, 계좌입금 {renderCheck(isBank)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <strong>6. 사회보험 적용 여부 :</strong> {renderUnderline(data.socialInsurance, "350px", "socialInsurance")}
                    </div>
                    
                    <div>
                      <strong>7. 근로계약서 교부 :</strong> 사업주는 계약 체결 시 근로자의 요구와 상관없이 계약서를 근로자에게 무조건 교부함(근로기준법 제17조).
                    </div>
                  </div>
                </div>
              </div>

              <div className="contract-footer-block">
                <div style={{ display: "flex", justifyContent: "center", margin: "20px 0 10px 0", fontSize: "9.2pt", fontWeight: "bold" }}>
                  {dSign.hasValue ? (
                    <>{renderUnderline(dSign.y, "40px")}년 {renderUnderline(dSign.m, "22px")}월 {renderUnderline(dSign.d, "22px")}일</>
                  ) : (
                    <>　　　  년 　　 월 　　 일</>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.2pt", borderTop: "1.2px solid #000000", paddingTop: "8px" }}>
                  <div style={{ width: "48%", lineHeight: 1.5 }}>
                    <strong>(사업주)</strong> 상호: {data.employerName}<br />
                    주소: {data.employerAddr}<br />
                    대표자: {renderUnderline(data.employerCEO, "80px", "employerCEO")} (인)
                  </div>
                  <div style={{ width: "48%", lineHeight: 1.5 }}>
                    <strong>(근로자)</strong> 주소: {data.employeeAddr}<br />
                    연락처: {data.employeePhone}<br />
                    성명: {renderUnderline(data.employeeName, "80px", "employeeName")} (인)
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (templateId === "contract_short_time") {
          const dStart = parseDateOrEmpty(data.contractStart);
          const dEnd = parseDateOrEmpty(data.contractEnd);
          const hasBonus = data.bonusAmt && data.bonusAmt !== "없음";
          const hasOtherPay = data.otherPayAmt && data.otherPayAmt !== "없음";
          const isDirect = data.payMethod?.includes("직접");
          const isBank = data.payMethod?.includes("계좌") || data.payMethod?.includes("통장") || data.payMethod?.includes("입금");

          return (
            <div className="contract-compact hwp-document" contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, minHeight: "920px", fontSize: "9.0pt", fontFamily: "'Batang', '바탕', 'Times New Roman', serif", lineHeight: 1.5, color: "#000000", padding: "20px 25px", boxSizing: "border-box", outline: "none" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <div style={{ border: "2px solid #000000", padding: "5px 30px", fontSize: "14pt", fontWeight: "bold", textAlign: "center", backgroundColor: "#ffffff" }}>
                    단시간근로자 표준근로계약서
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "8.5pt", marginBottom: "10px" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>사업주 (상호)</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", width: "32%", outline: "none" }}
                      >
                        {data.employerName}
                      </td>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>근로자 성명</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeeName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeeName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", width: "32%", outline: "none" }}
                      >
                        {data.employeeName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>대표자 성명</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerCEO", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerCEO", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employerCEO}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>연락처</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeePhone", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeePhone", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employeePhone}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>사업장 주소</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerAddr", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerAddr", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employerAddr}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>근로자 주소</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeeAddr", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeeAddr", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employeeAddr}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ wordBreak: "keep-all", marginBottom: "8px" }}>
                  <p style={{ textIndent: "10px", margin: "0 0 10px 0", fontSize: "9.2pt" }}>
                    {renderUnderline(data.employerName, "150px", "employerName")} (이하 “사업주”라 함)과(와) {renderUnderline(data.employeeName, "100px", "employeeName")} (이하 “근로자”라 함)은 다음과 같이 근로계약을 체결한다.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "9.0pt" }}>
                    <div>
                      <strong>1. 근로계약기간 :</strong>
                      {" "}{dStart.hasValue ? <>{renderUnderline(dStart.y, "40px")}년 {renderUnderline(dStart.m, "22px")}월 {renderUnderline(dStart.d, "22px")}일</> : renderUnderline(data.contractStart, "100px", "contractStart")}부터 
                      {dEnd.hasValue ? <>{renderUnderline(dEnd.y, "40px")}년 {renderUnderline(dEnd.m, "22px")}월 {renderUnderline(dEnd.d, "22px")}일까지</> : <> {renderUnderline(data.contractEnd, "100px", "contractEnd")}까지</>}
                    </div>
                    
                    <div>
                      <strong>2. 근 무 장 소 :</strong> {renderUnderline(data.workPlace, "380px", "workPlace")}
                    </div>
                    
                    <div>
                      <strong>3. 업무의 내용 :</strong> {renderUnderline(data.workTask, "380px", "workTask")}
                    </div>
                    
                    <div>
                      <strong>4. 근로일별 근로시간 및 휴게시간 :</strong>
                      <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid #000000", marginTop: "5px", fontSize: "8.5pt", textAlign: "center" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f9fafb", fontWeight: "bold" }}>
                            <td style={{ border: "1px solid #000000", padding: "4px", width: "12.5%" }}>요일</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", width: "12.5%" }}>월</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", width: "12.5%" }}>화</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", width: "12.5%" }}>수</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", width: "12.5%" }}>목</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", width: "12.5%" }}>금</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", width: "12.5%" }}>토</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", width: "12.5%" }}>일</td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>근로시간</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", fontSize: "7.8pt" }}>{data.monTime || "휴무"}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", fontSize: "7.8pt" }}>{data.tueTime || "휴무"}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", fontSize: "7.8pt" }}>{data.wedTime || "휴무"}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", fontSize: "7.8pt" }}>{data.thuTime || "휴무"}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", fontSize: "7.8pt" }}>{data.friTime || "휴무"}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", fontSize: "7.8pt" }}>{data.satTime || "휴무"}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px", fontSize: "7.8pt" }}>{data.sunTime || "휴무"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div>
                      <strong>5. 근무일 / 휴일 :</strong> 매주 {renderUnderline(data.workingDays, "120px", "workingDays")} 근무, 주휴일은 매주 {renderUnderline(data.holiday, "80px", "holiday")}요일로 한다.
                    </div>
                    
                    <div>
                      <strong>6. 임 금 :</strong>
                      <div style={{ paddingLeft: "15px", marginTop: "3px", display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div>- {data.salaryType || "시"}급 : {renderUnderline(data.salaryAmt, "120px", "salaryAmt")}원</div>
                        <div>- 상여금 : 있음 {renderCheck(hasBonus)} {renderUnderline(hasBonus ? data.bonusAmt : "", "90px", "bonusAmt")}원, 없음 {renderCheck(!hasBonus)}</div>
                        <div>- 기타급여 : 있음 {renderCheck(hasOtherPay)} {hasOtherPay ? `(${renderUnderline(data.otherPayAmt, "90px", "otherPayAmt")}원)` : ""}, 없음 {renderCheck(!hasOtherPay)}</div>
                        <div>- 임금지급일 : 매월 {renderUnderline(data.payDay, "60px", "payDay")}일 / 지급방법 : 직접지급 {renderCheck(isDirect)}, 계좌입금 {renderCheck(isBank)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <strong>7. 연차유급휴가 및 주휴수당 :</strong> 단시간근로자의 근로시간 비율에 따라 근로기준법 및 관련 법령이 정하는 바에 따라 부여함.
                    </div>
                    
                    <div>
                      <strong>8. 근로계약서 교부 :</strong> 사업주는 계약 체결 즉시 본 계약서 사본을 근로자의 요구 유무와 상관없이 근로자에게 교부해야 함(근로기준법 제17조).
                    </div>
                  </div>
                </div>
              </div>

              <div className="contract-footer-block">
                <div style={{ display: "flex", justifyContent: "center", margin: "15px 0 8px 0", fontSize: "9.0pt", fontWeight: "bold" }}>
                  {dSign.hasValue ? (
                    <>{renderUnderline(dSign.y, "40px")}년 {renderUnderline(dSign.m, "22px")}월 {renderUnderline(dSign.d, "22px")}일</>
                  ) : (
                    <>　　　  년 　　 월 　　 일</>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.2pt", borderTop: "1.2px solid #000000", paddingTop: "8px" }}>
                  <div style={{ width: "48%", lineHeight: 1.5 }}>
                    <strong>(사업주)</strong> 상호: {data.employerName}<br />
                    주소: {data.employerAddr}<br />
                    대표자: {renderUnderline(data.employerCEO, "80px", "employerCEO")} (인)
                  </div>
                  <div style={{ width: "48%", lineHeight: 1.5 }}>
                    <strong>(근로자)</strong> 주소: {data.employeeAddr}<br />
                    연락처: {data.employeePhone}<br />
                    성명: {renderUnderline(data.employeeName, "80px", "employeeName")} (인)
                  </div>
                </div>
              </div>
            </div>
          );
        }
        if (templateId === "contract_foreigner") {
          const dStart = parseDateOrEmpty(data.contractStart);
          const dEnd = parseDateOrEmpty(data.contractEnd);
          return (
            <div className="contract-foreigner hwp-document" contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, minHeight: "920px", fontSize: "8.2pt", fontFamily: "'Batang', '바탕', 'Times New Roman', serif", lineHeight: 1.5, color: "#000000", padding: "20px 25px", boxSizing: "border-box", outline: "none" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
                  <div style={{ border: "2px solid #000000", padding: "5px 30px", fontSize: "13pt", fontWeight: "bold", textAlign: "center", letterSpacing: "2px", backgroundColor: "#ffffff" }}>
                    표준근로계약서 (Standard Labor Contract)
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "8.0pt", marginBottom: "12px" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>사업주 (Employer)</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", width: "32%", outline: "none" }}
                      >
                        {data.employerName}
                      </td>
                      <td style={{ border: "1px solid #000000", width: "18%", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>근로자 (Employee)</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeeName", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeeName", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", width: "32%", outline: "none" }}
                      >
                        {data.employeeName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>대표자 (CEO)</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employerCEO", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerCEO", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employerCEO}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>여권번호 (Passport)</td>
                      <td 
                        onInput={(e) => handleFieldInputDirect("employeePassport", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employeePassport", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employeePassport || ""}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "4px 5px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold" }}>회사주소 (Address)</td>
                      <td 
                        colSpan={3} 
                        onInput={(e) => handleFieldInputDirect("employerAddr", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("employerAddr", e.currentTarget.innerText)}
                        style={{ border: "1px solid #000000", padding: "4px 5px", outline: "none" }}
                      >
                        {data.employerAddr}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ wordBreak: "keep-all", marginBottom: "10px" }}>
                  <p style={{ textIndent: "10px", margin: "0 0 12px 0", fontSize: "8.5pt" }}>
                    {renderUnderline(data.employerName, "150px", "employerName")} (Employer)과 {renderUnderline(data.employeeName, "100px", "employeeName")} (Employee)은 다음과 같이 근로계약을 체결한다.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <strong>1. 근로계약기간 (Contract Period) :</strong><br />
                      <span style={{ paddingLeft: "10px" }}>- {dStart.hasValue ? <>{renderUnderline(dStart.y, "40px")}년 {renderUnderline(dStart.m, "22px")}월 {renderUnderline(dStart.d, "22px")}일</> : renderUnderline(data.contractStart, "100px", "contractStart")}부터 {dEnd.hasValue ? <>{renderUnderline(dEnd.y, "40px")}년 {renderUnderline(dEnd.m, "22px")}월 {renderUnderline(dEnd.d, "22px")}일까지</> : renderUnderline(data.contractEnd, "100px", "contractEnd")}까지</span>
                    </div>

                    <div>
                      <strong>2. 근무장소 및 업무내용 (Place of Work & Description of Work) :</strong><br />
                      <span style={{ paddingLeft: "10px" }}>- 근무장소: {renderUnderline(data.workPlace, "200px", "workPlace")} / 업무내용: {renderUnderline(data.workTask, "200px", "workTask")}</span>
                    </div>

                    <div>
                      <strong>3. 근로시간 및 휴게시간 (Working Hours & Break Time) :</strong><br />
                      <span style={{ paddingLeft: "10px" }}>- 근로시간: {renderUnderline(renderTimePart(data.workTimeStart, "H"), "22px", "workTimeStart")}시 {renderUnderline(renderTimePart(data.workTimeStart, "M"), "22px")}분 ~ {renderUnderline(renderTimePart(data.workTimeEnd, "H"), "22px", "workTimeEnd")}시 {renderUnderline(renderTimePart(data.workTimeEnd, "M"), "22px")}분</span><br />
                      <span style={{ paddingLeft: "10px" }}>- 휴게시간: {renderUnderline(renderTimePart(data.breakTimeStart, "H"), "20px", "breakTimeStart")}시 {renderUnderline(renderTimePart(data.breakTimeStart, "M"), "20px")}분 ~ {renderUnderline(renderTimePart(data.breakTimeEnd, "H"), "20px", "breakTimeEnd")}시 {renderUnderline(renderTimePart(data.breakTimeEnd, "M"), "20px")}분</span>
                    </div>

                    <div>
                      <strong>4. 근무일 및 휴일 (Working Days & Holidays) :</strong><br />
                      <span style={{ paddingLeft: "10px" }}>- 근무일: 매주 {renderUnderline(data.workingDays, "80px", "workingDays")} 근무 / 휴일: 매주 {renderUnderline(data.holiday, "80px", "holiday")}요일</span>
                    </div>

                    <div>
                      <strong>5. 임금 (Wages) :</strong><br />
                      <span style={{ paddingLeft: "10px" }}>- {data.salaryType || "월"}급: {renderUnderline(data.salaryAmt, "120px", "salaryAmt")}원 / 임금지급일: 매월 {renderUnderline(data.payDay, "50px", "payDay")}일</span><br />
                      <span style={{ paddingLeft: "10px" }}>- 지급방법: {data.payMethod}</span>
                    </div>

                    <div>
                      <strong>6. 숙식 제공 및 부담 (Provision of Lodging/Meals & Expense Charge) :</strong><br />
                      <span style={{ paddingLeft: "10px" }}>- 제공 상태: {renderUnderline(data.lodgingProvided, "220px", "lodgingProvided")} (비용부담액: {renderUnderline(data.lodgingFee, "80px", "lodgingFee")})</span>
                    </div>

                    <div>
                      <strong>7. 기타 사항 (Miscellaneous) :</strong> 외국인근로자의 고용 등에 관한 법률 및 근로기준법에 따름.
                    </div>
                  </div>
                </div>
              </div>

              <div className="contract-footer-block">
                {/* 날짜 표시 */}
                <div style={{ display: "flex", justifyContent: "center", margin: "25px 0 15px 0", fontSize: "9.0pt", fontWeight: "bold" }}>
                  {dSign.hasValue ? (
                    <>{renderUnderline(dSign.y, "40px")}년 {renderUnderline(dSign.m, "22px")}월 {renderUnderline(dSign.d, "22px")}일</>
                  ) : (
                    <>　　　  년 　　 월 　　 일</>
                  )}
                </div>

                {/* 서명부 */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7.8pt", borderTop: "1.2px solid #000000", paddingTop: "12px" }}>
                  <div style={{ width: "48%" }}>
                    <strong>[사업주 (Employer)]</strong><br />
                    Company: {data.employerName}<br />
                    CEO: {renderUnderline(data.employerCEO, "80px", "employerCEO")} (Signature)
                  </div>
                  <div style={{ width: "48%" }}>
                    <strong>[근로자 (Employee)]</strong><br />
                    Passport No: {data.employeePassport}<br />
                    Name: {data.employeeName}<br />
                    Signature: {renderUnderline(data.employeeName, "80px", "employeeName")} (Signature)
                  </div>
                </div>
              </div>
            </div>
          );
        }
      }      // 4. 연차 휴가 신청서
      case "leave":
        return (
          <div contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flexGrow: 1, fontSize: "10.5pt", outline: "none" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "24pt", fontWeight: 800, margin: "20px 0 35px 0", letterSpacing: "8px" }}>연차 휴가 신청서</h1>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "10.5pt" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000000", width: "18%", padding: "14px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>부 서</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("dept", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("dept", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "14px 12px", width: "32%", outline: "none" }}
                    >
                      {data.dept}
                    </td>
                    <td style={{ border: "1px solid #000000", width: "18%", padding: "14px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>직 급</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("rank", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("rank", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "14px 12px", width: "32%", outline: "none" }}
                    >
                      {data.rank}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "14px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>성 명</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("name", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("name", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "14px 12px", outline: "none" }}
                    >
                      {data.name}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "14px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>휴가 종류</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("leaveType", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("leaveType", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "14px 12px", fontWeight: "bold", color: "var(--color-primary)", outline: "none" }}
                    >
                      {data.leaveType}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "14px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>휴가 기간</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("leavePeriod", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("leavePeriod", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "14px 12px", fontWeight: "bold", outline: "none" }}
                    >
                      {data.leavePeriod}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "14px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>비상 연락망</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("emergencyContact", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("emergencyContact", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "14px 12px", outline: "none" }}
                    >
                      {data.emergencyContact}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "14px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap", height: "180px" }}>휴가 사유</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("reason", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("reason", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "14px 12px", verticalAlign: "top", wordBreak: "keep-all", whiteSpace: "pre-wrap", outline: "none" }}
                    >
                      {data.reason}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style={{ marginTop: "40px", fontSize: "11pt", textAlign: "center", wordBreak: "keep-all", lineHeight: 1.8 }}>
                상기와 같이 휴가를 신청하오니 결재하여 주시기 바랍니다.
              </p>
            </div>
            <div className="generic-footer-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "15px", marginTop: "30px" }}>
              <div 
                onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
                style={{ fontSize: "12pt", fontWeight: "bold", outline: "none" }}
              >
                {data.date}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "320px", fontSize: "11pt" }}>
                <span>신 청 자 :</span>
                <span 
                  onInput={(e) => handleFieldInputDirect("name", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("name", e.currentTarget.innerText)}
                  style={{ fontWeight: "bold", outline: "none" }}
                >
                  {data.name} (서명 / 인)
                </span>
              </div>
              {data.company && (
                <h2 
                  onInput={(e) => handleFieldInputDirect("company", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("company", e.currentTarget.innerText)}
                  style={{ fontSize: "16pt", fontWeight: 800, marginTop: "25px", letterSpacing: "2px", outline: "none" }}
                >
                  {data.company.endsWith("귀하") ? data.company : `${data.company} 귀하`}
                </h2>
              )}
            </div>
          </div>
        );
 
      // 5. 업무 경위서
      case "report":
        return (
          <div contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, fontSize: "10.5pt", outline: "none" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "24pt", fontWeight: 800, margin: "15px 0 25px 0", letterSpacing: "8px" }}>시말서 / 업무 경위서</h1>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "10.5pt", marginBottom: "15px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000000", width: "18%", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>소속 부서</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("dept", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("dept", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "10px 12px", width: "32%", outline: "none" }}
                    >
                      {data.dept}
                    </td>
                    <td style={{ border: "1px solid #000000", width: "18%", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>직위 / 직급</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("rank", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("rank", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "10px 12px", width: "32%", outline: "none" }}
                    >
                      {data.rank}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>보고자 성명</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("name", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("name", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "10px 12px", outline: "none" }}
                    >
                      {data.name}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>작성일자</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "10px 12px", outline: "none" }}
                    >
                      {data.date}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>사건 일시</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("eventTime", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("eventTime", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "10px 12px", outline: "none" }}
                    >
                      {data.eventTime}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>사건 장소</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("eventPlace", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("eventPlace", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "10px 12px", outline: "none" }}
                    >
                      {data.eventPlace}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>사건 제목</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("title", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("title", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "10px 12px", fontWeight: "bold", wordBreak: "keep-all", overflowWrap: "break-word", outline: "none" }}
                    >
                      {data.title}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap", height: "170px" }}>사건 경위<br/>및 상세 내용</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("description", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("description", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "10px 12px", verticalAlign: "top", whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "break-word", outline: "none" }}
                    >
                      {data.description}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap", height: "90px" }}>수습 대책<br/>및 의견</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("measure", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("measure", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "10px 12px", verticalAlign: "top", whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "break-word", outline: "none" }}
                    >
                      {data.measure}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ fontSize: "10.5pt", lineHeight: 1.7, padding: "5px 5px 0 5px" }}>
                <p style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
                  본인은 상기 사건의 발생 경위를 사실 그대로 기술하였으며, 향후 동일한 문제가 재발하지 않도록 규정을 준수하고 업무 관리에 철저를 기할 것을 서약합니다.
                </p>
              </div>
            </div>
            <div className="generic-footer-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "12px", marginTop: "20px" }}>
              <div 
                onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
                style={{ fontSize: "11.5pt", fontWeight: "bold", outline: "none" }}
              >
                {data.date}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "320px", fontSize: "11pt" }}>
                <span>보 고 자 :</span>
                <span 
                  onInput={(e) => handleFieldInputDirect("name", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("name", e.currentTarget.innerText)}
                  style={{ fontWeight: "bold", outline: "none" }}
                >
                  {data.name} (서명 / 인)
                </span>
              </div>
            </div>
          </div>
        );

      // 6. 기안서
      case "proposal":
        return (
          <div contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, fontSize: "10.5pt", outline: "none" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "24pt", fontWeight: 800, margin: "15px 0 25px 0", letterSpacing: "15px" }}>기 안 서</h1>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", marginBottom: "15px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000000", width: "20%", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>기안 부서</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("dept", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("dept", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", width: "30%", outline: "none" }}
                    >
                      {data.dept}
                    </td>
                    <td style={{ border: "1px solid #000000", width: "20%", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>기 안 자</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("drafter", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("drafter", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", width: "30%", outline: "none" }}
                    >
                      {data.drafter}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>기안 일자</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", outline: "none" }}
                    >
                      {data.date}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>제출 구분</td>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px" }}>사내 결재</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>기안 제목</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("title", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("title", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", fontWeight: "bold", wordBreak: "keep-all", outline: "none" }}
                    >
                      {data.title}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>기안 목적</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("purpose", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("purpose", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", wordBreak: "keep-all", outline: "none" }}
                    >
                      {data.purpose}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap", height: "200px" }}>상세 기안내용<br/>및 기대효과</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("content", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("content", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", verticalAlign: "top", whiteSpace: "pre-wrap", wordBreak: "keep-all", outline: "none" }}
                    >
                      {data.content}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style={{ textAlign: "center", fontSize: "11pt", wordBreak: "keep-all", marginTop: "20px" }}>상기와 같이 업무 기안하오니 재가하여 주시기 바랍니다.</p>
            </div>
            <div className="generic-footer-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "5px", marginTop: "20px" }}>
              <div 
                onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
                style={{ fontSize: "12pt", fontWeight: "bold", outline: "none" }}
              >
                {data.date}
              </div>
              <div style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "5px" }}>
                기안자 : 
                <span 
                  onInput={(e) => handleFieldInputDirect("drafter", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("drafter", e.currentTarget.innerText)}
                  style={{ outline: "none", marginLeft: "4px" }}
                >
                  {data.drafter}
                </span> (서명 / 인)
              </div>
            </div>
          </div>
        );
 
      // 7. 품의서
      case "approval":
        return (
          <div contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, fontSize: "10.5pt", outline: "none" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "24pt", fontWeight: 800, margin: "15px 0 25px 0", letterSpacing: "15px" }}>품 의 서</h1>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", marginBottom: "15px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000000", width: "20%", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>품의 부서</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("dept", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("dept", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", width: "30%", outline: "none" }}
                    >
                      {data.dept}
                    </td>
                    <td style={{ border: "1px solid #000000", width: "20%", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>품 의 자</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("name", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("name", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", width: "30%", outline: "none" }}
                    >
                      {data.name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>품의 일자</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", outline: "none" }}
                    >
                      {data.date}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>품의 금액</td>
                    <td 
                      onInput={(e) => handleFieldInputDirect("amount", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("amount", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", fontWeight: "bold", fontSize: "11pt", color: "var(--color-primary)", outline: "none" }}
                    >
                      {data.amount}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>품의 제목</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("title", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("title", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", fontWeight: "bold", wordBreak: "keep-all", outline: "none" }}
                    >
                      {data.title}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>품의 품목</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("itemDetails", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("itemDetails", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", wordBreak: "keep-all", outline: "none" }}
                    >
                      {data.itemDetails}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap", height: "200px" }}>품의 사유<br/>및 상세내용</td>
                    <td 
                      colSpan={3} 
                      onInput={(e) => handleFieldInputDirect("reason", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("reason", e.currentTarget.innerText)}
                      style={{ border: "1px solid #000000", padding: "11px 12px", verticalAlign: "top", whiteSpace: "pre-wrap", wordBreak: "keep-all", outline: "none" }}
                    >
                      {data.reason}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style={{ textAlign: "center", fontSize: "11pt", wordBreak: "keep-all", marginTop: "20px" }}>상기와 같이 예산 및 사업품의를 상신하오니 결재바랍니다.</p>
            </div>
            <div className="generic-footer-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "5px", marginTop: "20px" }}>
              <div 
                onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
                style={{ fontSize: "12pt", fontWeight: "bold", outline: "none" }}
              >
                {data.date}
              </div>
              <div style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "5px" }}>
                품의자 : 
                <span 
                  onInput={(e) => handleFieldInputDirect("name", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("name", e.currentTarget.innerText)}
                  style={{ outline: "none", marginLeft: "4px" }}
                >
                  {data.name}
                </span> (서명 / 인)
              </div>
            </div>
          </div>
        );

      // 8. 회의록
      case "meeting":
        return (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, fontSize: "10pt" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "22pt", fontWeight: 800, margin: "10px 0 20px 0", letterSpacing: "10px" }}>회의록</h1>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", marginBottom: "15px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000000", width: "20%", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>회의 주제</td>
                    <td colSpan={3} style={{ border: "1px solid #000000", padding: "8px 10px", fontWeight: "bold" }}>{data.title}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", width: "20%", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>회의 일시</td>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", width: "30%" }}>{data.meetingTime}</td>
                    <td style={{ border: "1px solid #000000", width: "20%", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>회의 장소</td>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", width: "30%" }}>{data.meetingPlace}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>참석자 명단</td>
                    <td colSpan={3} style={{ border: "1px solid #000000", padding: "8px 10px" }}>{data.attendees}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>회의 안건</td>
                    <td colSpan={3} style={{ border: "1px solid #000000", padding: "8px 10px", wordBreak: "keep-all" }}>{data.agenda}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap", height: "150px" }}>주요 회의내용</td>
                    <td colSpan={3} style={{ border: "1px solid #000000", padding: "8px 10px", verticalAlign: "top", whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>
                      {data.discussion}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap", height: "110px" }}>결정/의결사항</td>
                    <td colSpan={3} style={{ border: "1px solid #000000", padding: "8px 10px", verticalAlign: "top", whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>
                      {data.decision}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="generic-footer-block" style={{ display: "flex", justifyContent: "flex-end", width: "100%", fontSize: "10pt" }}>
              <span>작성 및 기록일자: <strong>{data.date}</strong></span>
            </div>
          </div>
        );

      // 9. 지출결의서
      case "payment":
        return (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, fontSize: "10.5pt" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "24pt", fontWeight: 800, margin: "15px 0 25px 0", letterSpacing: "15px" }}>지출결의서</h1>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", marginBottom: "15px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000000", width: "20%", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>결의 부서</td>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", width: "30%" }}>{data.dept}</td>
                    <td style={{ border: "1px solid #000000", width: "20%", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>결 의 자</td>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", width: "30%" }}>{data.resolver}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>결의 일자</td>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px" }}>{data.date}</td>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>합계 금액</td>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", fontWeight: "bold", fontSize: "11pt", color: "var(--color-primary)" }}>{data.amount}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>지출 목적</td>
                    <td colSpan={3} style={{ border: "1px solid #000000", padding: "11px 12px", wordBreak: "keep-all" }}>{data.purpose}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap", height: "220px" }}>지출 상세내역</td>
                    <td colSpan={3} style={{ border: "1px solid #000000", padding: "11px 12px", verticalAlign: "top", whiteSpace: "pre-wrap", fontSize: "10pt" }}>
                      {data.details}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style={{ textAlign: "center", fontSize: "11pt", wordBreak: "keep-all", marginTop: "20px" }}>위 금액을 사내 업무 목적 경비로 지출하고자 결의하오니 재가하여 주시기 바랍니다.</p>
            </div>
            <div className="generic-footer-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "5px", marginTop: "20px" }}>
              <div style={{ fontSize: "12pt", fontWeight: "bold" }}>{data.date}</div>
              <div style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "5px" }}>영수인(결의자): {data.resolver} (서명 / 인)</div>
            </div>
          </div>
        );

      // 10. 견적서
      case "estimate":
        return (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, fontSize: "10pt" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "24pt", fontWeight: 800, margin: "10px 0 20px 0", letterSpacing: "15px" }}>견 적 서</h1>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ width: "45%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <h2 style={{ fontSize: "13pt", fontWeight: "bold", borderBottom: "2px solid #000000", paddingBottom: "6px" }}>
                    {data.customer}
                  </h2>
                  <p style={{ marginTop: "12px", wordBreak: "keep-all" }}>
                    아래와 같이 견적서를 제출합니다.
                  </p>
                  <p style={{ fontSize: "10.5pt", marginTop: "8px" }}>견적일자: <strong>{data.estDate}</strong></p>
                </div>
                <div style={{ width: "50%", border: "1.5px solid #000000", padding: "12px", whiteSpace: "pre-line", fontSize: "9.5pt", lineHeight: 1.6 }}>
                  <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "4px", marginBottom: "6px", fontSize: "10pt", textAlign: "center" }}>공 급 자</div>
                  {data.provider}
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "10.5pt", marginBottom: "20px" }}>
                <tbody>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <td style={{ border: "1px solid #000000", width: "25%", padding: "13px 12px", textAlign: "center", fontWeight: "bold", whiteSpace: "nowrap" }}>견적 주요품목</td>
                    <td style={{ border: "1px solid #000000", padding: "13px 12px" }}>{data.estDetails}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "13px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>합계 금액</td>
                    <td style={{ border: "1px solid #000000", padding: "13px 12px", fontWeight: "bold", fontSize: "11.5pt", color: "var(--color-primary)" }}>{data.totalPrice}</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ borderLeft: "4px solid #000", paddingLeft: "8px", fontWeight: "bold", fontSize: "11pt", margin: "15px 0 8px 0" }}>견적 세부조건 및 유효기간</h3>
              <div style={{ border: "1px solid #000000", padding: "12px", minHeight: "150px", whiteSpace: "pre-wrap", fontSize: "9.5pt", lineHeight: 1.6, wordBreak: "keep-all" }}>
                {data.description}
              </div>
            </div>
            
            <div className="generic-footer-block" style={{ textAlign: "center", fontSize: "10pt", color: "var(--color-text-desc)", marginTop: "15px" }}>
              * 본 견적 금액은 제시된 조건 범위 내에서 유효하며, 부가가치세를 포함하고 있습니다.
            </div>
          </div>
        );

      // 11. 발주서
      case "order":
        return (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, fontSize: "10pt" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "24pt", fontWeight: 800, margin: "10px 0 20px 0", letterSpacing: "15px" }}>발 주 서</h1>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ width: "45%" }}>
                  <div style={{ fontWeight: "bold", fontSize: "10pt", borderBottom: "1px solid #000", paddingBottom: "4px", marginBottom: "8px" }}>수신 (공급자)</div>
                  <div style={{ fontSize: "11.5pt", fontWeight: "bold", minHeight: "70px", whiteSpace: "pre-line" }}>{data.provider}</div>
                </div>
                <div style={{ width: "50%", border: "1.5px solid #000000", padding: "12px", whiteSpace: "pre-line", fontSize: "9.5pt", lineHeight: 1.6 }}>
                  <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "4px", marginBottom: "6px", fontSize: "10pt", textAlign: "center" }}>발주자 (구매처)</div>
                  {data.customer}
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "10pt", marginBottom: "20px" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000000", width: "22%", padding: "11px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>발주 일자</td>
                    <td style={{ border: "1px solid #000000", padding: "11px 10px", width: "28%" }}>{data.orderDate}</td>
                    <td style={{ border: "1px solid #000000", width: "22%", padding: "11px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>납기 기한</td>
                    <td style={{ border: "1px solid #000000", padding: "11px 10px", width: "28%", fontWeight: "bold" }}>{data.deliveryDate}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "11px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>발주 총액</td>
                    <td colSpan={3} style={{ border: "1px solid #000000", padding: "11px 10px", fontWeight: "bold", fontSize: "11pt", color: "var(--color-primary)" }}>{data.totalPrice}</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ borderLeft: "4px solid #000", paddingLeft: "8px", fontWeight: "bold", fontSize: "11pt", margin: "15px 0 8px 0" }}>발주 상세내용 및 운송조건</h3>
              <div style={{ border: "1px solid #000000", padding: "12px", minHeight: "180px", whiteSpace: "pre-wrap", fontSize: "10pt", lineHeight: 1.6, wordBreak: "keep-all" }}>
                {data.description}
              </div>
            </div>
            
            <div className="generic-footer-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "5px", marginTop: "20px" }}>
              <div style={{ fontSize: "11.5pt", fontWeight: "bold" }}>발주자 (구매처): ________________ (인/서명)</div>
            </div>
          </div>
        );

      // 12. 차용증
      case "iou":
        return (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, fontSize: "9.5pt", letterSpacing: "-0.5px" }}>
            <div>
              <h1 style={{ textAlign: "center", fontSize: "22pt", fontWeight: 800, margin: "10px 0 15px 0", letterSpacing: "10px" }}>금전차용증서</h1>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px", wordBreak: "keep-all" }}>
                <div style={{ border: "1px solid #000", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "4px" }}>
                  <strong>[채권자 (빌려주는 사람)]</strong><br />
                  성명: {data.creditorName} / 주민등록번호: {data.creditorRegNo}<br />
                  주소: {data.creditorAddr} / 연락처: {data.creditorPhone}
                </div>
                <div style={{ border: "1px solid #000", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "4px" }}>
                  <strong>[채무자 (빌리는 사람)]</strong><br />
                  성명: {data.debtorName} / 주민등록번호: {data.debtorRegNo}<br />
                  주소: {data.debtorAddr} / 연락처: {data.debtorPhone}
                </div>
                
                <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", marginTop: "10px" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #000000", width: "25%", padding: "10px 8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>1. 차용 원금</td>
                      <td style={{ border: "1px solid #000000", padding: "10px 8px", fontWeight: "bold", fontSize: "11pt", color: "var(--color-primary)" }}>{data.amount}</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "10px 8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>2. 이자율 조건</td>
                      <td style={{ border: "1px solid #000000", padding: "10px 8px" }}>{data.interestRate} (이자제한법상 최고이자율 연 20%를 초과하지 않음)</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "10px 8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>3. 이자 지급일</td>
                      <td style={{ border: "1px solid #000000", padding: "10px 8px" }}>{data.interestPayDay}</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000000", padding: "10px 8px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>4. 변제 기일</td>
                      <td style={{ border: "1px solid #000000", padding: "10px 8px", fontWeight: "bold" }}>{data.dueDate} (만기 일시 상환)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 style={{ borderLeft: "4px solid #000", paddingLeft: "8px", fontWeight: "bold", fontSize: "10.5pt", margin: "12px 0 6px 0" }}>차용 계약 세부 조항</h3>
              <div style={{ border: "1px solid #000000", padding: "12px", minHeight: "120px", whiteSpace: "pre-wrap", fontSize: "9pt", lineHeight: 1.6, wordBreak: "keep-all" }}>
                {data.conditions}
              </div>
            </div>
            
            <div className="generic-footer-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "10px", marginTop: "15px", borderTop: "1.5px solid #000", paddingTop: "12px" }}>
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>차용 계약일 (작성일) : {data.date}</div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "10pt", marginTop: "8px" }}>
                <div style={{ width: "48%" }}>
                  <strong>채권자 (갑)</strong><br />
                  성명: {data.creditorName} (인/서명)
                </div>
                <div style={{ width: "48%" }}>
                  <strong>채무자 (을)</strong><br />
                  성명: {data.debtorName} (인/서명)
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>정의되지 않은 템플릿입니다.</div>;
    }
}

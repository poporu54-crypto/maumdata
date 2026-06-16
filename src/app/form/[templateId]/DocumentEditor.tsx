"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTemplateById, DocumentTemplate, LayoutElement } from "../templatesData";
import AdSpace from "@/components/AdSpace";

interface DynamicDocumentRendererProps {
  layout: LayoutElement[];
  data: any;
  handleFieldInputDirect: (key: string, value: string) => void;
  handleFieldChange: (key: string, value: string) => void;
  handleArrayFieldChange?: (arrayKey: string, index: number, fieldKey: string, value: string) => void;
  theme: string;
}

const THEME_TOKENS: Record<string, {
  fontFamily: string;
  borderColor: string;
  borderWidth: string;
  borderStyle: string;
  headerBg: string;
  headerTextColor: string;
  subtitleBorderLeft: string;
  titleLetterSpacing: string;
  padding: string;
  fontSizeMultiplier: number;
  textColor: string;
  titleColor: string;
  showTableVerticalLines: boolean;
  borderStyleDashed?: boolean;
  commonHeaderBorderBottom: string;
  signBlockBg?: string;
  titleBorderBottom?: string;
}> = {
  classic: {
    fontFamily: "'Noto Sans KR', sans-serif",
    borderColor: "#000000",
    borderWidth: "1.5px",
    borderStyle: "solid",
    headerBg: "#f9fafb",
    headerTextColor: "#000000",
    subtitleBorderLeft: "4px solid #000000",
    titleLetterSpacing: "6px",
    padding: "6px 8px",
    fontSizeMultiplier: 1.0,
    textColor: "#000000",
    titleColor: "#000000",
    showTableVerticalLines: true,
    commonHeaderBorderBottom: "1.5px solid #000000",
  },
  modern: {
    fontFamily: "var(--font-pretendard), 'Pretendard', sans-serif",
    borderColor: "#e2e8f0", // 아주 부드럽고 옅은 회색
    borderWidth: "1px",
    borderStyle: "solid",
    headerBg: "#f8fafc",
    headerTextColor: "#0f172a",
    subtitleBorderLeft: "4px solid #3b82f6", // 트렌디한 파랑색
    titleLetterSpacing: "4px",
    padding: "13px 15px", // 넓은 여백 적용으로 시각적 호흡 부여
    fontSizeMultiplier: 0.98,
    textColor: "#334155",
    titleColor: "#0f172a",
    showTableVerticalLines: false, // 테이블의 좌우 세로선을 제거하는 혁신 적용
    commonHeaderBorderBottom: "none", // 브랜드 헤더 선 제거로 미니멀 연출
    titleBorderBottom: "3px solid #3b82f6", // 제목 아래 짧고 시크한 포인트 라인
  },
  navy: {
    fontFamily: "var(--font-pretendard), 'Pretendard', sans-serif",
    borderColor: "#cbd5e1",
    borderWidth: "1.2px",
    borderStyle: "solid",
    headerBg: "#1e3a8a", // 진한 네이비 배경
    headerTextColor: "#ffffff", // 흰색 폰트로 가독성 확보
    subtitleBorderLeft: "4px solid #1e3a8a",
    titleLetterSpacing: "4px",
    padding: "9px 11px",
    fontSizeMultiplier: 1.0,
    textColor: "#1e293b",
    titleColor: "#1e3a8a",
    showTableVerticalLines: true,
    commonHeaderBorderBottom: "2px solid #1e3a8a",
    signBlockBg: "#f8fafc", // 서명란에 옅은 그레이블루 카드 스타일 씌우기
  },
  serif: {
    fontFamily: "'KoPub Batang', 'Batang', 'Georgia', serif",
    borderColor: "#475569",
    borderWidth: "1px",
    borderStyle: "solid",
    headerBg: "#fafaf9",
    headerTextColor: "#1c1917",
    subtitleBorderLeft: "1px solid #1c1917",
    titleLetterSpacing: "10px", // 우아한 자간 배치
    padding: "7px 9px",
    fontSizeMultiplier: 1.02,
    textColor: "#292524",
    titleColor: "#1c1917",
    showTableVerticalLines: true,
    borderStyleDashed: true, // 점선 표 연출
    commonHeaderBorderBottom: "1px double #1c1917",
  }
};

const DynamicDocumentRenderer: React.FC<DynamicDocumentRendererProps> = ({
  layout,
  data,
  handleFieldInputDirect,
  handleFieldChange,
  handleArrayFieldChange,
  theme
}) => {
  if (!layout) return null;
  const tokens = THEME_TOKENS[theme] || THEME_TOKENS.classic;

  const bindData = (text?: string) => {
    if (!text) return "";
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : "";
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, outline: "none", fontFamily: tokens.fontFamily, color: tokens.textColor }}>
      {layout.map((element, elIdx) => {
        if (element.type === "page-break") {
          return null;
        }

        if (element.type === "title") {
          return (
            <div key={elIdx} style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "10px 0 15px 0" }}>
              <h1 style={{ textAlign: "center", fontSize: "20pt", fontWeight: 800, margin: 0, letterSpacing: tokens.titleLetterSpacing, color: tokens.titleColor, ...element.style }}>
                {bindData(element.value)}
              </h1>
              {tokens.titleBorderBottom && (
                <div style={{ width: "45px", height: "3px", backgroundColor: "#3b82f6", marginTop: "12px", borderRadius: "1.5px" }} />
              )}
            </div>
          );
        }

        if (element.type === "subtitle") {
          return (
            <h3 key={elIdx} style={{ borderLeft: tokens.subtitleBorderLeft, paddingLeft: "8px", fontWeight: "bold", fontSize: "10.5pt", margin: "12px 0 6px 0", textAlign: "left", color: tokens.titleColor, ...element.style }}>
              {bindData(element.value)}
            </h3>
          );
        }

        if (element.type === "paragraph") {
          return (
            <p key={elIdx} style={{ fontSize: "10pt", lineHeight: 1.6, margin: "6px 0", textAlign: "justify", wordBreak: "keep-all", ...element.style }}>
              {bindData(element.value)}
            </p>
          );
        }

        if (element.type === "spacer") {
          return <div key={elIdx} style={{ height: "12px", ...element.style }}></div>;
        }

        if (element.type === "table") {
          const borderStyle = tokens.borderStyleDashed ? "dashed" : tokens.borderStyle;
          return (
            <table key={elIdx} style={{ width: "100%", borderCollapse: "collapse", border: `${tokens.borderWidth} ${tokens.borderStyle} ${tokens.borderColor}`, marginBottom: "8px", ...element.style }}>
              <tbody>
                {element.rows?.flatMap((row: any, rIdx: number) => {
                  if (row.repeatKey) {
                    const listData = data[row.repeatKey] || [];
                    return listData.map((item: any, itemIdx: number) => (
                      <tr key={`${rIdx}-${itemIdx}`} style={{ height: row.height }}>
                        {row.cells.map((cell: any, cIdx: number) => {
                          const isEditable = !!cell.key;
                          
                          const bindItemData = (text?: string) => {
                            if (!text) return "";
                            return text.replace(/\{(\w+)\}/g, (match, key) => {
                              return item[key] !== undefined ? item[key] : "";
                            });
                          };

                          const cellContent = bindItemData(cell.label);
                          const isHeaderCell = cell.bg === "#f9fafb" || cell.bg === "var(--bg-color-app)";
                          
                          const cellStyle: React.CSSProperties = {
                            borderTop: `1px ${borderStyle} ${tokens.borderColor}`,
                            borderBottom: `1px ${borderStyle} ${tokens.borderColor}`,
                            borderLeft: tokens.showTableVerticalLines ? `1px ${borderStyle} ${tokens.borderColor}` : "none",
                            borderRight: tokens.showTableVerticalLines ? `1px ${borderStyle} ${tokens.borderColor}` : "none",
                            padding: tokens.padding,
                            textAlign: cell.align || "left",
                            fontWeight: (cell.bold || isHeaderCell) ? "bold" : "normal",
                            backgroundColor: isHeaderCell ? tokens.headerBg : (cell.bg || "transparent"),
                            color: (isHeaderCell && tokens.headerBg === "#1e3a8a") ? "#ffffff" : "inherit",
                            whiteSpace: "pre-wrap",
                            outline: isEditable ? "none" : "inherit",
                            fontSize: "9.5pt",
                            ...cell.style
                          };

                          if (isEditable && handleArrayFieldChange) {
                            return (
                              <td
                                key={cIdx}
                                colSpan={cell.colSpan}
                                rowSpan={cell.rowSpan}
                                style={{ ...cellStyle, width: cell.width }}
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => {
                                  handleArrayFieldChange(row.repeatKey, itemIdx, cell.key, e.currentTarget.innerText);
                                }}
                              >
                                {item[cell.key] || ""}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={cIdx}
                              colSpan={cell.colSpan}
                              rowSpan={cell.rowSpan}
                              style={{ ...cellStyle, width: cell.width }}
                            >
                              {cellContent}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  }

                  return (
                    <tr key={rIdx} style={{ height: row.height }}>
                      {row.cells.map((cell: any, cIdx: number) => {
                        const isEditable = !!cell.key;
                        const cellContent = bindData(cell.label);
                        const isHeaderCell = cell.bg === "#f9fafb" || cell.bg === "var(--bg-color-app)";
                        
                        const cellStyle: React.CSSProperties = {
                          borderTop: `1px ${borderStyle} ${tokens.borderColor}`,
                          borderBottom: `1px ${borderStyle} ${tokens.borderColor}`,
                          borderLeft: tokens.showTableVerticalLines ? `1px ${borderStyle} ${tokens.borderColor}` : "none",
                          borderRight: tokens.showTableVerticalLines ? `1px ${borderStyle} ${tokens.borderColor}` : "none",
                          padding: tokens.padding,
                          textAlign: cell.align || "left",
                          fontWeight: (cell.bold || isHeaderCell) ? "bold" : "normal",
                          backgroundColor: isHeaderCell ? tokens.headerBg : (cell.bg || "transparent"),
                          color: (isHeaderCell && tokens.headerBg === "#1e3a8a") ? "#ffffff" : "inherit",
                          whiteSpace: "pre-wrap",
                          outline: isEditable ? "none" : "inherit",
                          fontSize: "9.5pt",
                          ...cell.style
                        };

                        if (isEditable) {
                          return (
                            <td
                              key={cIdx}
                              colSpan={cell.colSpan}
                              rowSpan={cell.rowSpan}
                              style={{ ...cellStyle, width: cell.width }}
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onInput={(e) => handleFieldInputDirect(cell.key, e.currentTarget.innerText)}
                              onBlur={(e) => handleFieldChange(cell.key, e.currentTarget.innerText)}
                            >
                              {data[cell.key] || ""}
                            </td>
                          );
                        }

                        return (
                          <td
                            key={cIdx}
                            colSpan={cell.colSpan}
                            rowSpan={cell.rowSpan}
                            style={{ ...cellStyle, width: cell.width }}
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        }

        if (element.type === "sign-block") {
          const isCard = !!tokens.signBlockBg;
          return (
            <div 
              key={elIdx} 
              className="generic-footer-block" 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                width: "100%", 
                gap: "8px", 
                marginTop: "20px", 
                borderTop: isCard ? "none" : `1.5px solid ${tokens.borderColor}`, 
                paddingTop: isCard ? "14px" : "10px", 
                backgroundColor: tokens.signBlockBg || "transparent",
                borderRadius: isCard ? "8px" : "0",
                border: isCard ? `1px solid ${tokens.borderColor}` : "none",
                padding: isCard ? "14px 10px" : "inherit",
                ...element.style 
              }}
            >
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>
                {bindData(element.value)}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default function DocumentEditor({ templateId, initialTemplate }: { templateId: string, initialTemplate: any }) {
  const params = useParams();
  const router = useRouter();
  
  const [template, setTemplate] = useState<any>(initialTemplate);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(!initialTemplate);

  // 프리미엄 디자인 테마 상태 추가
  const [theme, setTheme] = useState<"classic" | "modern" | "navy" | "serif">("classic");

  // 로고 및 회사 정보 상태 관리 (실시간 편집 및 업로드 지원)
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoText, setLogoText] = useState<string>("[YOUR LOGO]");
  const [companyInfoText, setCompanyInfoText] = useState<string>("마음데이타 | www.maumdata.com");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const triggerLogoUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (logoInputRef.current) {
      logoInputRef.current.click();
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 오늘 날짜 및 하이브리드 데이터 로드
  useEffect(() => {
    let active = true;
    
    async function loadTemplate() {
      if (initialTemplate) {
        if (active) {
          setTemplate(initialTemplate);
          initializeData(initialTemplate);
          setLoading(false);
        }
        return;
      }
      
      setLoading(true);
      // 1. 먼저 로컬에서 확인
      const localTpl = getTemplateById(templateId);
      if (localTpl) {
        if (active) {
          setTemplate(localTpl);
          initializeData(localTpl);
          setLoading(false);
        }
        return;
      }

      // 2. 로컬에 없을 시 DB API 호출
      try {
        const res = await fetch(`/api/form/${templateId}`);
        if (!res.ok) {
          throw new Error("Template not found");
        }
        const json = await res.json();
        if (json.success && json.data && active) {
          setTemplate(json.data);
          initializeData(json.data);
        } else if (active) {
          router.push("/form");
        }
      } catch (err) {
        console.error("Failed to load template:", err);
        if (active) {
          router.push("/form");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    function initializeData(tpl: any) {
      if (!tpl) return;
      const today = new Date();
      const formattedDate = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, "0")}월 ${String(today.getDate()).padStart(2, "0")}일`;
      
      const initData = { ...tpl.initialValues };
      // 날짜 키가 있는 경우 오늘 날짜 주입
      if (initData.hasOwnProperty("date")) {
        initData.date = formattedDate;
      }
      if (initData.hasOwnProperty("orderDate")) {
        initData.orderDate = formattedDate;
      }
      if (initData.hasOwnProperty("estDate")) {
        initData.estDate = formattedDate;
      }
      setData(initData);
    }

    loadTemplate();

    return () => {
      active = false;
    };
  }, [templateId, router, initialTemplate]);

  if (loading || !template || !data) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-sub)" }}>양식을 불러오는 중입니다...</p>
      </div>
    );
  }

  // 폼 필드 입력 변경 핸들러
  const handleFieldChange = (key: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  // 실시간 타이핑 시 왼쪽 폼에 즉각 반영하는 direct DOM 조작 헬퍼 (React 리렌더링에 의한 IME 깨짐 방지)
  const handleFieldInputDirect = (key: string, value: string) => {
    const inputEl = document.getElementById(`form-input-${key}`) as HTMLInputElement | HTMLTextAreaElement | null;
    if (inputEl) {
      inputEl.value = value;
    }
  };

  // 동적 리스트(표 행) 항목 변경 핸들러
  const handleArrayFieldChange = (arrayKey: string, index: number, field: string, value: string) => {
    setData((prev: any) => {
      const updatedArray = [...prev[arrayKey]];
      updatedArray[index] = {
        ...updatedArray[index],
        [field]: value
      };
      return {
        ...prev,
        [arrayKey]: updatedArray
      };
    });
  };

  // 리스트 행 추가
  const addArrayRow = (arrayKey: string, schemaFields: any[]) => {
    const emptyObj: Record<string, string> = {};
    schemaFields.forEach(f => {
      emptyObj[f.key] = "";
    });
    
    setData((prev: any) => ({
      ...prev,
      [arrayKey]: [...prev[arrayKey], emptyObj]
    }));
  };

  // 리스트 행 삭제
  const removeArrayRow = (arrayKey: string, index: number) => {
    setData((prev: any) => {
      if (prev[arrayKey].length <= 1) return prev; // 최소 1행 유지
      const updatedArray = prev[arrayKey].filter((_: any, idx: number) => idx !== index);
      return {
        ...prev,
        [arrayKey]: updatedArray
      };
    });
  };

  // PDF 저장 및 인쇄
  const handlePrint = () => {
    window.print();
  };

  // HWP/Word 파일 다운로드 브릿지 (HTML Blob 형식 이용)
  const handleDownloadDoc = (format: "hwp" | "docx") => {
    const paperElement = document.getElementById("a4-print-area");
    if (!paperElement) return;

    // 1. 메모리 상에 클론 생성 및 전처리 진행 (워드프로세서 호환성용)
    const clone = paperElement.cloneNode(true) as HTMLElement;

    // 2. 줄바꿈(\n)을 명시적인 <br /> 태그로 변환 (white-space가 pre-wrap인 셀 대응)
    const textContainers = clone.querySelectorAll('td, div, p');
    textContainers.forEach((el) => {
      const element = el as HTMLElement;
      if (element.style.whiteSpace === "pre-wrap" || element.innerText?.includes("\n")) {
        if (element.children.length === 0 || (element.children.length > 0 && element.innerHTML.indexOf("<table") === -1)) {
          const text = element.innerText;
          if (text && text.includes("\n")) {
            const escapedHtml = text
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;")
              .replace(/\n/g, "<br />");
            element.innerHTML = escapedHtml;
          }
        }
      }
    });

    // 3. flex space-between을 워드 프로세서 친화적인 공백(&nbsp;) 레이아웃으로 보정
    const flexBetweenElements = clone.querySelectorAll('div[style*="justifyContent: space-between"], div[style*="justifycontent: space-between"]');
    flexBetweenElements.forEach((el) => {
      const element = el as HTMLElement;
      const children = Array.from(element.children);
      // 신청인/작성인 서명 라인 1줄짜리 정렬 보정
      if (children.length === 2 && children[0].tagName === "SPAN" && children[1].tagName === "SPAN") {
        const leftText = (children[0] as HTMLElement).innerText || "";
        const rightText = (children[1] as HTMLElement).innerText || "";
        // 공백 문자를 충분히 주입하여 나란히 벌림 효과 생성
        element.innerHTML = `<span style="font-size: 10pt;">${leftText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${rightText}</span>`;
        element.style.display = "block";
        element.style.textAlign = "center";
        element.style.width = "100%";
      }
    });

    // 4. 근로계약서 등 2단 레이아웃 (width: 48% 컬럼들) float 강제 주입
    const col48Elements = clone.querySelectorAll('div[style*="width: 48%"], div[style*="width:48%"]');
    col48Elements.forEach((el) => {
      const element = el as HTMLElement;
      element.style.float = "left";
      element.style.width = "48%";
      const parent = element.parentElement;
      if (parent) {
        parent.style.clear = "both";
      }
    });

    // 5. 제목 및 수신관청(h1, h2, h3) 강제 가운데 정렬 주입
    const headers = clone.querySelectorAll('h1, h2, h3');
    headers.forEach((el) => {
      const element = el as HTMLElement;
      element.style.textAlign = "center";
      element.style.width = "100%";
      element.style.display = "block";
      element.style.margin = "10px auto";
    });

    // 6. 하단 날짜 및 정렬 블록 강제 가운데 정렬 주입
    const footerBlocks = clone.querySelectorAll('.generic-footer-block, .generic-footer-block div, .contract-footer-block, .contract-footer-block div');
    footerBlocks.forEach((el) => {
      const element = el as HTMLElement;
      element.style.textAlign = "center";
      element.style.width = "100%";
      element.style.display = "block";
      element.style.margin = "8px auto";
    });

    const htmlHead = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${template.title}</title>
        <style>
          /* 한글/워드 용지설정 최적화 (좁은 마진 강제 주입하여 가로 공간 확보) */
          @page {
            size: A4 portrait;
            margin: 12mm 12mm 12mm 12mm;
          }
          @page Section1 {
            size: 210mm 297mm;
            margin: 12mm 12mm 12mm 12mm;
            mso-header-margin: 10mm;
            mso-footer-margin: 10mm;
          }
          div.Section1 {
            page: Section1;
          }

          body { font-family: 'Malgun Gothic', 'Arial', sans-serif; line-height: 1.3; padding: 0; margin: 0; }
          
          /* 워드/한글 내에서 높이 팽창을 막기 위한 셀 패딩 및 폰트 축소 */
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #000000; padding: 5px 8px !important; text-align: left; font-size: 9.5pt !important; line-height: 1.3 !important; }
          th { background-color: #f2f2f2; font-weight: bold; }
          
          h1 { font-size: 18pt !important; font-weight: bold; text-align: center; margin: 0 0 10px 0 !important; letter-spacing: 3px; }
          h2 { font-size: 13pt !important; font-weight: bold; text-align: center; margin: 10px 0 0 0 !important; }
          
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .title { font-size: 18pt !important; font-weight: bold; text-align: center; margin-bottom: 15px; letter-spacing: 5px; }
          .approval-table { width: 180px; float: right; margin-bottom: 20px; }
          .approval-table td { height: 45px; text-align: center; font-size: 8.5pt; }
          .approval-title { height: 18px !important; background-color: #f2f2f2; }
          .clear { clear: both; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${clone.innerHTML}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", htmlHead], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${templateId}_form_${new Date().toISOString().substring(0, 10)}.${format === "hwp" ? "hwp" : "doc"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 결재란 실시간 Preview 렌더러
  const renderApprovalTable = () => {
    if (!data || !data.useApproval) return null;
    const tokens = THEME_TOKENS[theme] || THEME_TOKENS.classic;
    const isNavyHeader = tokens.headerBg === "#1e3a8a";
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", marginBottom: "10px" }} className="approval-section">
        <table className="approval-table" style={{ width: "150px", borderCollapse: "collapse", fontSize: "7.5pt", border: `1px solid ${tokens.borderColor}` }}>
          <tbody>
            <tr>
              <td className="approval-label" rowSpan={2} style={{ width: "20px", border: `1px solid ${tokens.borderColor}`, textAlign: "center", backgroundColor: tokens.headerBg, color: isNavyHeader ? "#ffffff" : "inherit", fontWeight: "bold", verticalAlign: "middle", lineHeight: 1.2, padding: "2px" }}>결<br/>재</td>
              <td className="approval-header" style={{ border: `1px solid ${tokens.borderColor}`, textAlign: "center", backgroundColor: tokens.headerBg, color: isNavyHeader ? "#ffffff" : "inherit", fontWeight: "bold", padding: "2px 0", width: "43px" }}>담당</td>
              <td className="approval-header" style={{ border: `1px solid ${tokens.borderColor}`, textAlign: "center", backgroundColor: tokens.headerBg, color: isNavyHeader ? "#ffffff" : "inherit", fontWeight: "bold", padding: "2px 0", width: "43px" }}>검토</td>
              <td className="approval-header" style={{ border: `1px solid ${tokens.borderColor}`, textAlign: "center", backgroundColor: tokens.headerBg, color: isNavyHeader ? "#ffffff" : "inherit", fontWeight: "bold", padding: "2px 0", width: "43px" }}>승인</td>
            </tr>
            <tr>
              <td className="approval-cell" style={{ border: `1px solid ${tokens.borderColor}`, height: "35px" }}></td>
              <td className="approval-cell" style={{ border: `1px solid ${tokens.borderColor}`, height: "35px" }}></td>
              <td className="approval-cell" style={{ border: `1px solid ${tokens.borderColor}`, height: "35px" }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // 공통 브랜드 헤더 렌더러 (실시간 로고 업로드 및 텍스트 편집 지원)
  const renderCommonHeader = () => {
    const tokens = THEME_TOKENS[theme] || THEME_TOKENS.classic;
    const hasHeaderBorder = tokens.commonHeaderBorderBottom !== "none";
    return (
      <div className="common-brand-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%", paddingBottom: "8px", borderBottom: hasHeaderBorder ? tokens.commonHeaderBorderBottom : "none", marginBottom: "14px", fontFamily: tokens.fontFamily }}>
        <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
          {logoImage ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img src={logoImage} alt="Logo" style={{ maxHeight: "30px", maxWidth: "120px", objectFit: "contain", verticalAlign: "middle" }} onClick={triggerLogoUpload} />
              <button 
                onClick={(e) => { e.stopPropagation(); setLogoImage(null); }} 
                className="no-print" 
                style={{ position: "absolute", top: "-10px", right: "-10px", background: "#f04438", color: "#fff", border: "none", borderRadius: "50%", width: "15px", height: "15px", fontSize: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                title="로고 제거"
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div 
                contentEditable 
                suppressContentEditableWarning
                onBlur={(e) => setLogoText(e.currentTarget.innerText)}
                style={{ border: `1px dashed ${tokens.borderColor}`, padding: "4px 8px", fontSize: "7.5pt", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", outline: "none", cursor: "text" }}
                title="클릭하여 로고 텍스트 변경"
              >
                {logoText}
              </div>
              <button 
                onClick={triggerLogoUpload} 
                className="no-print" 
                style={{ border: "1px solid var(--color-border)", background: "var(--bg-color-card)", borderRadius: "4px", padding: "2px 4px", fontSize: "8px", cursor: "pointer", color: "var(--color-text-sub)" }}
                title="이미지 업로드"
              >
                📷 이미지
              </button>
            </div>
          )}
          <input type="file" ref={logoInputRef} onChange={handleLogoFileChange} accept="image/*" style={{ display: "none" }} />
        </div>
        
        <div 
          contentEditable 
          suppressContentEditableWarning
          onBlur={(e) => setCompanyInfoText(e.currentTarget.innerText)}
          style={{ textAlign: "right", fontSize: "7.5pt", color: "#4e5968", outline: "none", cursor: "text", minWidth: "150px" }}
          title="클릭하여 회사 정보 변경"
        >
          {companyInfoText}
        </div>
      </div>
    );
  };

  // 12종 서식별 A4 내부 레이아웃 분기 렌더러
  const renderA4Content = () => {
    // 만약 동적 레이아웃(layout)이 정의되어 있다면, 동적 렌더러를 통해 조판을 렌더링
    if (template.layout) {
      return (
        <DynamicDocumentRenderer
          layout={template.layout}
          data={data}
          handleFieldInputDirect={handleFieldInputDirect}
          handleFieldChange={handleFieldChange}
          handleArrayFieldChange={handleArrayFieldChange}
          theme={theme}
        />
      );
    }

    // 범용/하부 민원·법률 및 행정 서식 동적 공통 렌더러
    if (templateId.startsWith("generic_") || templateId === "generic" || templateId.startsWith("gov_") || templateId.startsWith("generic_comwel_")) {
      return (
        <div className="generic-compact" contentEditable={true} suppressContentEditableWarning={true} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flexGrow: 1, fontSize: "10.5pt" }}>
          <div>
            <h1 
              onInput={(e) => handleFieldInputDirect("title", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("title", e.currentTarget.innerText)}
              style={{ textAlign: "center", fontSize: "24pt", fontWeight: 800, margin: "10px 0 25px 0", letterSpacing: "8px", outline: "none" }}
            >
              {data.title || template.title}
            </h1>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000000", fontSize: "10.5pt", marginBottom: "20px" }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #000000", width: "20%", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>소속 / 부서</td>
                  <td 
                    onInput={(e) => handleFieldInputDirect("dept", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("dept", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "10px 12px", width: "30%", outline: "none" }}
                  >
                    {data.dept}
                  </td>
                  <td style={{ border: "1px solid #000000", width: "20%", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>성명 / 작성자</td>
                  <td 
                    onInput={(e) => handleFieldInputDirect("name", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("name", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "10px 12px", width: "30%", outline: "none" }}
                  >
                    {data.name}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "10px 12px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>작성 일자</td>
                  <td 
                    colSpan={3} 
                    onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "10px 12px", outline: "none" }}
                  >
                    {data.date}
                  </td>
                </tr>
                <tr>
                  <td className="detail-header" style={{ border: "1px solid #000000", padding: "12px 10px", textAlign: "center", backgroundColor: "#f9fafb", fontWeight: "bold", whiteSpace: "nowrap" }}>상세 내용</td>
                  <td 
                    colSpan={3} 
                    onInput={(e) => handleFieldInputDirect("content", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("content", e.currentTarget.innerText)}
                    style={{ border: "1px solid #000000", padding: "12px 10px", verticalAlign: "top", whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "break-word", outline: "none" }}
                  >
                    {data.content}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="generic-footer-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "12px", marginTop: "20px" }}>
            <div 
              onInput={(e) => handleFieldInputDirect("date", e.currentTarget.innerText)} onBlur={(e) => handleFieldChange("date", e.currentTarget.innerText)}
              style={{ fontSize: "11.5pt", fontWeight: "bold", outline: "none" }}
            >
              {data.date}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "320px", fontSize: "11pt" }}>
              <span>작 성 인 :</span>
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
    }

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
  };

  return (
    <div className="container" style={{ padding: "32px 24px", maxWidth: "1400px" }}>
      <Link href="/form" className="back-link">
        ← 무료 서식 센터 홈으로
      </Link>

      <div className="editor-layout">
        
        {/* 1. 좌측 입력 폼 판넬 */}
        <div className="editor-form-panel">
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 700 }}>
              마음데이터 FORM &middot; {template.category} 카테고리
            </span>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, margin: "4px 0" }}>
              {template.title}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.4 }}>
              {template.desc}
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

          {/* 결재란 유무 토글 */}
          {template.initialValues.hasOwnProperty("useApproval") && (
            <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}>
              <input 
                type="checkbox" 
                id="useApproval" 
                checked={data.useApproval} 
                onChange={(e) => handleFieldChange("useApproval", e.target.checked)} 
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label htmlFor="useApproval" style={{ cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}>
                문서 상단에 결재란(담당/검토/승인) 표시하기
              </label>
            </div>
          )}

          {/* 동적 폼 필드 렌더러 */}
          {template.fields.map((field: any) => {
            
            // 1. 일반 텍스트 입력창
            if (field.type === "text") {
              return (
                <div key={field.key} className="form-group">
                  <label>{field.label}</label>
                  <input id={`form-input-${field.key}`} type="text" placeholder={field.placeholder} value={data[field.key] || ""} onChange={(e) => handleFieldChange(field.key, e.target.value)} />
                </div>
              );
            }

            // 2. 장문 텍스트 입력창
            if (field.type === "textarea") {
              return (
                <div key={field.key} className="form-group">
                  <label>{field.label}</label>
                  <textarea id={`form-input-${field.key}`} rows={4} placeholder={field.placeholder} value={data[field.key] || ""} onChange={(e) => handleFieldChange(field.key, e.target.value)} />
                </div>
              );
            }

            // 3. 셀렉트(Select) 선택창
            if (field.type === "select") {
              return (
                <div key={field.key} className="form-group">
                  <label>{field.label}</label>
                  <select 
                    value={data[field.key] || ""} 
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  >
                    {field.options?.map((opt: any) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            }

            // 4. 리스트(List) 행 추가/삭제 테이블 입력창 (이력서 등)
            if (field.type === "list" && field.listFields) {
              const arrayKey = field.key;
              const subFields = field.listFields;

              return (
                <div key={arrayKey} style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <label style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text-sub)" }}>
                      {field.label}
                    </label>
                    <button 
                      onClick={() => addArrayRow(arrayKey, subFields)}
                      className="btn-secondary" 
                      style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px" }}
                    >
                      + 행 추가
                    </button>
                  </div>
                  
                  {data[arrayKey]?.map((item: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                      {subFields.map((sf: any) => (
                        <input 
                          key={sf.key}
                          type="text" 
                          placeholder={sf.placeholder} 
                          value={item[sf.key] || ""} 
                          onChange={(e) => handleArrayFieldChange(arrayKey, i, sf.key, e.target.value)} 
                          style={{ 
                            flex: 1, 
                            padding: "6px 10px", 
                            fontSize: "0.8rem",
                            backgroundColor: "var(--bg-color-main)",
                            color: "var(--color-text-main)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "6px"
                          }}
                        />
                      ))}
                      <button 
                        onClick={() => removeArrayRow(arrayKey, i)} 
                        style={{ color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              );
            }

            return null;
          })}

          {/* 좌측 하단 애드센스 광고 삽입 시뮬레이션 */}
          <AdSpace format="rectangle" style={{ width: "100%", marginTop: "12px" }} />

        </div>

        {/* 2. 우측 A4 실시간 프리뷰 및 다운로드 판넬 */}
        <div className="editor-preview-panel">
          <div className="a4-container">
            
            {/* 디자인 테마 선택기 */}
            <div className="theme-selector-card no-print" style={{ 
              width: "100%", 
              maxWidth: "700px", 
              backgroundColor: "var(--bg-color-card)", 
              border: "1px solid var(--color-border)", 
              borderRadius: "8px", 
              padding: "12px", 
              marginBottom: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--color-text-main)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                🎨 문서 디자인 테마 선택
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { id: "classic", label: "🏛️ Classic", desc: "정통 흑백" },
                  { id: "modern", label: "⚡ Modern", desc: "현대적 미니멀" },
                  { id: "navy", label: "💼 Business Navy", desc: "신뢰감있는 네이비" },
                  { id: "serif", label: "✒️ Premium Serif", desc: "격식있는 명조" }
                ].map((t) => {
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      style={{
                        flex: 1,
                        minWidth: "120px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: isActive ? "2px solid #3b82f6" : "1px solid var(--color-border)",
                        backgroundColor: isActive ? "rgba(59, 130, 246, 0.08)" : "var(--bg-color-app)",
                        color: isActive ? "var(--color-text-main)" : "var(--color-text-sub)",
                        fontWeight: isActive ? "bold" : "normal",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        textAlign: "center",
                        fontSize: "0.8rem"
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>{t.label}</div>
                      <div style={{ fontSize: "0.7rem", opacity: 0.8, marginTop: "2px" }}>{t.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 상단 액션 컨트롤러 */}
            <div className="a4-actions-bar" style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "700px", marginBottom: "16px" }}>
              <button onClick={handlePrint} className="btn-primary" style={{ flex: 1.5, padding: "10px" }}>
                🖨️ PDF 저장 및 인쇄
              </button>
              <button onClick={() => handleDownloadDoc("hwp")} className="btn-secondary" style={{ flex: 1, padding: "10px", fontSize: "0.85rem" }}>
                한글(HWP) 파일
              </button>
              <button onClick={() => handleDownloadDoc("docx")} className="btn-secondary" style={{ flex: 1, padding: "10px", fontSize: "0.85rem" }}>
                워드(doc) 파일
              </button>
            </div>

            {/* 인쇄 및 캡처 전용 A4 도화지 (다중 페이지 지원) */}
            <div id="a4-print-area" style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", alignItems: "center" }}>
              {(() => {
                const hasPageBreak = template.layout?.some((el: any) => el.type === "page-break");
                
                const splitLayoutIntoPages = (elements: any[]) => {
                  const pages: any[][] = [];
                  let currentPage: any[] = [];
                  for (const el of elements) {
                    if (el.type === "page-break") {
                      if (currentPage.length > 0) {
                        pages.push(currentPage);
                        currentPage = [];
                      }
                    } else {
                      currentPage.push(el);
                    }
                  }
                  if (currentPage.length > 0) {
                    pages.push(currentPage);
                  }
                  return pages.length > 0 ? pages : [[]];
                };

                if (hasPageBreak && template.layout) {
                  const pages = splitLayoutIntoPages(template.layout);
                  return pages.map((pageLayout, pageIdx) => (
                    <div 
                      className="a4-paper multipage-page" 
                      key={pageIdx} 
                      style={{ 
                        position: "relative", 
                        marginBottom: pageIdx === pages.length - 1 ? "0" : "20px" 
                      }}
                    >
                      {pageIdx === 0 && renderApprovalTable()}
                      {pageIdx === 0 && renderCommonHeader()}
                      
                      <DynamicDocumentRenderer
                        layout={pageLayout}
                        data={data}
                        handleFieldInputDirect={handleFieldInputDirect}
                        handleFieldChange={handleFieldChange}
                        handleArrayFieldChange={handleArrayFieldChange}
                        theme={theme}
                      />
                      
                      <div className="common-page-footer" style={{ position: "absolute", bottom: "8px", left: "0", right: "0", textAlign: "center", fontSize: "7.5pt", color: "#8b95a1", fontFamily: "sans-serif", letterSpacing: "0.5px", pointerEvents: "none" }}>
                        [Designed with MaumData - Page {pageIdx + 1}/{pages.length}]
                      </div>
                    </div>
                  ));
                } else {
                  return (
                    <div className="a4-paper singlepage-page" style={{ position: "relative" }}>
                      {renderApprovalTable()}
                      {renderCommonHeader()}
                      {renderA4Content()}
                      
                      <div className="common-page-footer" style={{ position: "absolute", bottom: "8px", left: "0", right: "0", textAlign: "center", fontSize: "7.5pt", color: "#8b95a1", fontFamily: "sans-serif", letterSpacing: "0.5px", pointerEvents: "none" }}>
                        [Designed with MaumData - Page 1/1]
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            {/* 우측 미리보기 하단 광고 지면 */}
            <AdSpace format="horizontal" style={{ width: "100%", maxWidth: "700px", marginTop: "24px" }} />

          </div>
        </div>

      </div>
    </div>
  );
}

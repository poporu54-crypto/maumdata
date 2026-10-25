"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import type { LayoutElement } from "../templatesData";
import AdSpace from "@/components/AdSpace";
import { shareDocumentPdf, vibrateDevice, showAppToast } from "@/lib/appBridge";
import type { SelectedCompany } from "@/components/CompanySearchModal";

const LegacyTemplateRenderer = dynamic(() => import("./LegacyTemplateRenderer"));
const DocumentSignatureModal = dynamic(() => import("@/components/DocumentSignatureModal"), {
  ssr: false,
});
const CompanySearchModal = dynamic(() => import("@/components/CompanySearchModal"), {
  ssr: false,
});
const RequestSignatureModal = dynamic(() => import("@/components/RequestSignatureModal"), {
  ssr: false,
});

function buildInitialFormData(tpl: any): Record<string, any> | null {
  if (!tpl) return null;
  const base: Record<string, any> = { ...(tpl.initialValues || {}) };
  if (Array.isArray(tpl.fields)) {
    for (const f of tpl.fields) {
      if (f?.key && !Object.prototype.hasOwnProperty.call(base, f.key)) {
        base[f.key] = f.type === "list" ? [{}] : "";
      }
    }
  }
  return base;
}

interface DynamicDocumentRendererProps {
  layout: LayoutElement[];
  data: any;
  handleFieldInputDirect: (key: string, value: string) => void;
  handleFieldChange: (key: string, value: string) => void;
  handleArrayFieldChange?: (arrayKey: string, index: number, fieldKey: string, value: string) => void;
  theme: string;
  spacing: {
    padding: string;
    lineHeight: number;
    spacerHeight: number;
    fontDelta: number;
  };
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
    borderColor: "#cbd5e1", // 슬레이트 계열 초연회색
    borderWidth: "1px",
    borderStyle: "solid",
    headerBg: "#fafafa",
    headerTextColor: "#1e293b",
    subtitleBorderLeft: "4px solid #3b82f6", // 세련된 블루 바
    titleLetterSpacing: "4px",
    padding: "13px 15px", // 기본 패딩 (스페이서 알고리즘에 의해 오버라이드됨)
    fontSizeMultiplier: 0.98,
    textColor: "#475569", // 부드러운 차콜 그레이
    titleColor: "#0f172a", // 선명한 다크 그레이
    showTableVerticalLines: false, // 테이블의 좌우 세로선을 제거하는 혁신 적용
    commonHeaderBorderBottom: "none", // 브랜드 헤더 선 제거로 미니멀 연출
    titleBorderBottom: "3px solid #3b82f6", // 제목 아래 짧고 시크한 포인트 라인
  },
  navy: {
    fontFamily: "var(--font-pretendard), 'Pretendard', sans-serif",
    borderColor: "#cbd5e1",
    borderWidth: "1.2px",
    borderStyle: "solid",
    headerBg: "#1a365d", // 짙은 네이비 배경 면(Fill) 적용
    headerTextColor: "#ffffff", // 흰색 폰트로 가독성 확보
    subtitleBorderLeft: "4px solid #1a365d",
    titleLetterSpacing: "4px",
    padding: "9px 11px",
    fontSizeMultiplier: 1.0,
    textColor: "#1e293b",
    titleColor: "#1a365d",
    showTableVerticalLines: true,
    commonHeaderBorderBottom: "2px solid #1a365d",
    signBlockBg: "#f8fafc", // 서명란에 옅은 그레이블루 카드 스타일 씌우기
  },
  serif: {
    fontFamily: "'KoPub Batang', 'Batang', 'Georgia', serif",
    borderColor: "#57534e",
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

// 동적 공백 및 간격 제어 알고리즘 (Smart Spacing)
const calculateSpacing = (data: any, theme: string) => {
  let totalLength = 0;
  if (data) {
    Object.values(data).forEach((val) => {
      if (typeof val === "string") {
        totalLength += val.length;
      }
    });
  }

  // 텍스트 볼륨 분류: Short (400자 미만), Medium (400~800자), Long (800자 초과)
  const isShort = totalLength < 400;
  const isLong = totalLength > 800;

  let padding = "6px 8px";
  let lineHeight = 1.5;
  let spacerHeight = 12;
  let fontDelta = 0; // 폰트 사이즈 조정치 (pt)

  if (theme === "modern") {
    if (isShort) {
      padding = "16px 20px";
      lineHeight = 1.85; // 줄간격 넓게 써서 1페이지 꽉 차게 연출
      spacerHeight = 24;
      fontDelta = 1.0;  // 글씨를 미세하게 키움
    } else if (isLong) {
      padding = "7px 10px";
      lineHeight = 1.35; // 촘촘하게 압축
      spacerHeight = 8;
      fontDelta = -0.5; // 글씨 크기 축소
    } else {
      padding = "12px 14px";
      lineHeight = 1.6;
      spacerHeight = 15;
      fontDelta = 0;
    }
  } else if (theme === "navy") {
    if (isShort) {
      padding = "12px 15px";
      lineHeight = 1.75;
      spacerHeight = 20;
      fontDelta = 0.5;
    } else if (isLong) {
      padding = "5px 7px";
      lineHeight = 1.35;
      spacerHeight = 6;
      fontDelta = -0.5;
    } else {
      padding = "8px 10px";
      lineHeight = 1.5;
      spacerHeight = 12;
      fontDelta = 0;
    }
  } else if (theme === "serif") {
    if (isShort) {
      padding = "12px 14px";
      lineHeight = 1.8;
      spacerHeight = 22;
      fontDelta = 0.5;
    } else if (isLong) {
      padding = "5px 6px";
      lineHeight = 1.4;
      spacerHeight = 8;
      fontDelta = -0.5;
    } else {
      padding = "8px 10px";
      lineHeight = 1.6;
      spacerHeight = 14;
      fontDelta = 0;
    }
  } else {
    // classic
    if (isShort) {
      padding = "10px 12px";
      lineHeight = 1.7;
      spacerHeight = 18;
      fontDelta = 0.5;
    } else if (isLong) {
      padding = "4px 6px";
      lineHeight = 1.35;
      spacerHeight = 6;
      fontDelta = -0.5;
    } else {
      padding = "6px 8px";
      lineHeight = 1.5;
      spacerHeight = 12;
      fontDelta = 0;
    }
  }

  return { padding, lineHeight, spacerHeight, fontDelta };
};

const parsePaddingToPx = (paddingStr: string): number => {
  const match = paddingStr.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 8;
};

const DynamicDocumentRenderer: React.FC<DynamicDocumentRendererProps> = ({
  layout,
  data,
  handleFieldInputDirect,
  handleFieldChange,
  handleArrayFieldChange,
  theme,
  spacing
}) => {
  if (!layout) return null;
  const tokens = THEME_TOKENS[theme] || THEME_TOKENS.classic;

  const bindData = (text?: string) => {
    if (!text) return "";
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : "";
    });
  };

  let hasStampedSeal = false;
  const renderTextWithSeal = (text: string, forceFallbackAppend = false) => {
    if (!data?.signatureImage || !text) return text;
    const sealRegex = /(\(인\)|\(서명\s*또는\s*인\)|\(서명\s*\/\s*인\)|\(인\s*\/\s*서명\)|\(서명·인\)|\(직인\))/;
    const match = !hasStampedSeal ? text.match(sealRegex) : null;
    if (match && match.index !== undefined) {
      hasStampedSeal = true;
      const before = text.slice(0, match.index);
      const sealText = match[0];
      const after = text.slice(match.index + sealText.length);
      return (
        <>
          {before}
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span>{sealText}</span>
            <img
              src={data.signatureImage}
              alt="전자서명/인감"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "54px",
                height: "54px",
                objectFit: "contain",
                pointerEvents: "none",
                opacity: 0.92,
                mixBlendMode: "multiply",
                zIndex: 2,
              }}
            />
          </span>
          {after}
        </>
      );
    }
    if (forceFallbackAppend && !hasStampedSeal) {
      hasStampedSeal = true;
      return (
        <>
          {text}
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "-18px",
            }}
          >
            <img
              src={data.signatureImage}
              alt="전자서명/인감"
              style={{
                width: "54px",
                height: "54px",
                objectFit: "contain",
                pointerEvents: "none",
                opacity: 0.92,
                mixBlendMode: "multiply",
              }}
            />
          </span>
        </>
      );
    }
    return text;
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
              <h1 style={{ textAlign: "center", fontSize: "22pt", fontWeight: 900, margin: 0, letterSpacing: tokens.titleLetterSpacing, color: tokens.titleColor, ...element.style }}>
                {bindData(element.value)}
              </h1>
              {tokens.titleBorderBottom && (
                <div style={{ width: "60px", height: "3px", backgroundColor: "#3b82f6", marginTop: "12px", borderRadius: "1.5px" }} />
              )}
            </div>
          );
        }

        if (element.type === "subtitle") {
          return (
            <h3 key={elIdx} style={{ borderLeft: tokens.subtitleBorderLeft, paddingLeft: "8px", fontWeight: "bold", fontSize: `${11 + spacing.fontDelta}pt`, margin: "14px 0 8px 0", textAlign: "left", color: tokens.titleColor, ...element.style }}>
              {bindData(element.value)}
            </h3>
          );
        }

        if (element.type === "paragraph") {
          const boundVal = bindData(element.value);
          // 타이포그래피 계층 보강: 본문 번호 매기기(1., 2., 3.) 마다 문단 간 간격을 주어 가독성 극대화
          const isNumbered = /^\s*\d+\./.test(boundVal);
          return (
            <p 
              key={elIdx} 
              style={{ 
                fontSize: `${10 + spacing.fontDelta}pt`, 
                lineHeight: spacing.lineHeight, 
                marginTop: "4px",
                marginBottom: isNumbered ? "14px" : "6px", // 번호 문단 간 더 넓은 간격 부여
                textAlign: "justify", 
                wordBreak: "keep-all", 
                ...element.style 
              }}
            >
              {boundVal}
            </p>
          );
        }

        if (element.type === "spacer") {
          return <div key={elIdx} style={{ height: `${spacing.spacerHeight}px`, ...element.style }}></div>;
        }

        if (element.type === "table") {
          const borderStyle = tokens.borderStyleDashed ? "dashed" : tokens.borderStyle;
          const isTypeB = theme === "modern" || theme === "serif"; // Type B 플랫 레이아웃 조건

          return (
            <table 
              key={elIdx} 
              style={{ 
                width: "100%", 
                borderCollapse: "collapse", 
                // Type B의 경우 사방 테두리를 제거
                border: isTypeB ? "none" : `${tokens.borderWidth} ${tokens.borderStyle} ${tokens.borderColor}`, 
                marginBottom: "10px", 
                ...element.style 
              }}
            >
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
                            // Type B의 경우 세로선 완벽 배제 및 가로 구분선만 연하게 남김
                            borderTop: isTypeB ? "none" : `1px ${borderStyle} ${tokens.borderColor}`,
                            borderBottom: `1px ${borderStyle} ${tokens.borderColor}`,
                            borderLeft: (!isTypeB && tokens.showTableVerticalLines) ? `1px ${borderStyle} ${tokens.borderColor}` : "none",
                            borderRight: (!isTypeB && tokens.showTableVerticalLines) ? `1px ${borderStyle} ${tokens.borderColor}` : "none",
                            padding: spacing.padding,
                            textAlign: cell.align || "left",
                            // 타이포그래피 계층 이원화: 라벨 셀(Bold/Regular) 및 텍스트 톤 차별화
                            fontWeight: isHeaderCell ? "bold" : (cell.bold ? "bold" : "normal"),
                            backgroundColor: isHeaderCell ? tokens.headerBg : (cell.bg || "transparent"),
                            color: (isHeaderCell && tokens.headerBg === "#1a365d") 
                              ? "#ffffff" // 네이비 면 채우기 시 글씨 화이트 반전
                              : (isHeaderCell && isTypeB) 
                                ? "var(--color-text-sub)" // Type B 플랫 레이아웃 라벨은 연한 차콜
                                : "inherit",
                            whiteSpace: "pre-wrap",
                            outline: isEditable ? "none" : "inherit",
                            fontSize: `${9.5 + spacing.fontDelta}pt`,
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
                          // Type B의 경우 세로선 완벽 배제 및 가로 구분선만 연하게 남김
                          borderTop: isTypeB ? "none" : `1px ${borderStyle} ${tokens.borderColor}`,
                          borderBottom: `1px ${borderStyle} ${tokens.borderColor}`,
                          borderLeft: (!isTypeB && tokens.showTableVerticalLines) ? `1px ${borderStyle} ${tokens.borderColor}` : "none",
                          borderRight: (!isTypeB && tokens.showTableVerticalLines) ? `1px ${borderStyle} ${tokens.borderColor}` : "none",
                          padding: spacing.padding,
                          textAlign: cell.align || "left",
                          // 타이포그래피 계층 이원화: 라벨 셀(Bold/Regular) 및 텍스트 톤 차별화
                          fontWeight: isHeaderCell ? "bold" : (cell.bold ? "bold" : "normal"),
                          backgroundColor: isHeaderCell ? tokens.headerBg : (cell.bg || "transparent"),
                          color: (isHeaderCell && tokens.headerBg === "#1a365d") 
                            ? "#ffffff" // 네이비 면 채우기 시 글씨 화이트 반전
                            : (isHeaderCell && isTypeB) 
                              ? "var(--color-text-sub)" // Type B 플랫 레이아웃 라벨은 연한 차콜
                              : "inherit",
                          whiteSpace: "pre-wrap",
                          outline: isEditable ? "none" : "inherit",
                          fontSize: `${9.5 + spacing.fontDelta}pt`,
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
                            {renderTextWithSeal(cellContent)}
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
              <div style={{ fontSize: `${11 + spacing.fontDelta}pt`, fontWeight: "bold" }}>
                {renderTextWithSeal(bindData(element.value), true)}
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
  const [data, setData] = useState<any>(() => buildInitialFormData(initialTemplate));
  const [loading, setLoading] = useState(!initialTemplate);

  // 프리미엄 디자인 테마 상태 추가
  const [theme, setTheme] = useState<"classic" | "modern" | "navy" | "serif">("classic");

  // 사용자 조판 미세 조정 상태 추가
  const [isManualSpacing, setIsManualSpacing] = useState<boolean>(false);
  const [userFontDelta, setUserFontDelta] = useState<number>(0);
  const [userLineHeight, setUserLineHeight] = useState<number>(1.5);
  const [userPadding, setUserPadding] = useState<number>(8);
  const [userSpacerHeight, setUserSpacerHeight] = useState<number>(12);

  // AI 추천 값을 수동 조판 상태에 동기화 (isManualSpacing이 false일 때만)
  useEffect(() => {
    if (!isManualSpacing && data) {
      const autoSpacing = calculateSpacing(data, theme);
      setUserFontDelta(autoSpacing.fontDelta);
      setUserLineHeight(autoSpacing.lineHeight);
      setUserSpacerHeight(autoSpacing.spacerHeight);
      
      const px = parsePaddingToPx(autoSpacing.padding);
      setUserPadding(px);
    }
  }, [data, theme, isManualSpacing]);

  // 최종 사용될 스페이싱 계산값
  const currentSpacing = isManualSpacing ? {
    padding: `${userPadding}px ${Math.round(userPadding * 1.3)}px`,
    lineHeight: userLineHeight,
    spacerHeight: userSpacerHeight,
    fontDelta: userFontDelta
  } : calculateSpacing(data, theme);

  // 로고 및 회사 정보 상태 관리 (실시간 편집 및 업로드 지원)
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoText, setLogoText] = useState<string>("[YOUR LOGO]");
  const [companyInfoText, setCompanyInfoText] = useState<string>("마음데이타 | www.maumdata.com");
  
  // 모바일/앱 특화: 전자서명 & 기업검색 & 공유 상태
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCompanySearchModalOpen, setIsCompanySearchModalOpen] = useState(false);
  const [isRequestSigModalOpen, setIsRequestSigModalOpen] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  // 상단 액션 바 마우스/터치 가로 드래그 스크롤 제어
  const actionsBarRef = useRef<HTMLDivElement>(null);
  const isDraggingBar = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDraggedBar = useRef(false);

  const handleBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = actionsBarRef.current;
    if (!bar) return;
    isDraggingBar.current = true;
    hasDraggedBar.current = false;
    dragStartX.current = e.pageX - bar.offsetLeft;
    dragScrollLeft.current = bar.scrollLeft;
  };

  const handleBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingBar.current || !actionsBarRef.current) return;
    e.preventDefault();
    const x = e.pageX - actionsBarRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.3;
    if (Math.abs(walk) > 5) {
      hasDraggedBar.current = true;
    }
    actionsBarRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleBarMouseUpOrLeave = () => {
    isDraggingBar.current = false;
  };

  const handleBarClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasDraggedBar.current) {
      e.stopPropagation();
      e.preventDefault();
      hasDraggedBar.current = false;
    }
  };

  const handleSelectCompanyFromDb = (comp: SelectedCompany) => {
    vibrateDevice(40);
    const cleanBno = comp.b_no ? comp.b_no.replace(/[^0-9]/g, "") : "";
    const formattedBno = cleanBno.length === 10
      ? cleanBno.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")
      : comp.b_no;

    setData((prev: any) => {
      const next = { ...prev };
      ["company", "partyB_name", "client", "client_name", "target_company", "supplier", "receiver", "receiverName", "buyer"].forEach((k) => {
        if (next.hasOwnProperty(k)) next[k] = comp.b_nm;
      });
      ["b_no", "partyB_bno", "business_number", "client_bno", "registration_number"].forEach((k) => {
        if (next.hasOwnProperty(k)) next[k] = formattedBno || comp.b_no;
      });
      ["owner", "partyB_owner", "ceo", "representative", "client_rep", "president"].forEach((k) => {
        if (next.hasOwnProperty(k)) next[k] = comp.p_nm;
      });
      ["address", "partyB_address", "location", "client_address"].forEach((k) => {
        if (next.hasOwnProperty(k)) next[k] = comp.b_adr;
      });
      return next;
    });
    showAppToast(`${comp.b_nm} 정보가 서식에 자동 입력되었습니다.`);
  };

  const handleApplySignature = (sigDataUrl: string) => {
    setSignatureImage(sigDataUrl);
    setData((prev: any) => ({
      ...prev,
      signatureImage: sigDataUrl,
      stampImage: sigDataUrl
    }));
    showAppToast("전자 서명/도장이 문서에 반영되었습니다.");
  };

  const handleShareDoc = async () => {
    vibrateDevice(30);
    const docTitle = template?.title || "마음데이터 서식";
    await shareDocumentPdf({
      title: docTitle,
      text: `[${docTitle}] 마음데이터에서 생성된 문서입니다.`,
      fileName: `${docTitle}.pdf`
    });
  };
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
      // 서버 API를 통해 해당 단일 서식만 조회 (클라이언트 번들 오염 방지)
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
      
      const initData: Record<string, any> = buildInitialFormData(tpl) || {};
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
      // 기업 상세 또는 스캐너에서 전달된 기업 데이터 자동 주입
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const partyBName = urlParams.get("partyB_name");
        const partyBBno = urlParams.get("partyB_bno");
        const partyBOwner = urlParams.get("partyB_owner");
        const partyBAddress = urlParams.get("partyB_address");

        if (partyBName) {
          ["company", "partyB_name", "client", "client_name", "target_company", "supplier", "receiver", "receiverName", "buyer"].forEach((k) => {
            if (initData.hasOwnProperty(k)) initData[k] = partyBName;
          });
        }
        if (partyBBno) {
          ["b_no", "partyB_bno", "business_number", "client_bno", "registration_number"].forEach((k) => {
            if (initData.hasOwnProperty(k)) initData[k] = partyBBno;
          });
        }
        if (partyBOwner) {
          ["owner", "partyB_owner", "ceo", "representative", "client_rep", "president"].forEach((k) => {
            if (initData.hasOwnProperty(k)) initData[k] = partyBOwner;
          });
        }
        if (partyBAddress) {
          ["address", "partyB_address", "location", "client_address"].forEach((k) => {
            if (initData.hasOwnProperty(k)) initData[k] = partyBAddress;
          });
        }
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
    const isNavyHeader = tokens.headerBg === "#1a365d";
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
          spacing={currentSpacing}
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


    return (
      <LegacyTemplateRenderer
        templateId={templateId}
        data={data}
        handleFieldInputDirect={handleFieldInputDirect}
        handleFieldChange={handleFieldChange}
        handleArrayFieldChange={handleArrayFieldChange}
      />
    );

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
              마음데이타 FORM &middot; {template.category} 카테고리
            </span>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 700, margin: "4px 0" }}>
              {template.title}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.4 }}>
              {template.desc}
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

          {/* 결재란 유무 토글 */}
          {Boolean(template.initialValues && Object.prototype.hasOwnProperty.call(template.initialValues, "useApproval")) && (
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
          {(template.fields || []).map((field: any) => {
            
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
          {/* 전역/하드코딩 서식 레이아웃 폰트 및 패딩 오버라이드 스타일 */}
          <style dangerouslySetInnerHTML={{__html: `
            #a4-print-area, #a4-print-area * {
              font-family: ${THEME_TOKENS[theme]?.fontFamily || THEME_TOKENS.classic.fontFamily} !important;
            }
            #a4-print-area h1 {
              font-size: calc(22pt + ${currentSpacing.fontDelta}pt) !important;
              line-height: 1.2 !important;
            }
            #a4-print-area h2 {
              font-size: calc(15pt + ${currentSpacing.fontDelta}pt) !important;
              line-height: 1.3 !important;
            }
            #a4-print-area h3 {
              font-size: calc(11.5pt + ${currentSpacing.fontDelta}pt) !important;
              line-height: 1.4 !important;
            }
            #a4-print-area p, 
            #a4-print-area td,
            #a4-print-area .editable-value-field,
            #a4-print-area .generic-footer-block,
            #a4-print-area .generic-footer-block div,
            #a4-print-area .contract-footer-block,
            #a4-print-area .contract-footer-block div,
            #a4-print-area span[contenteditable="true"] {
              font-size: calc(10pt + ${currentSpacing.fontDelta}pt) !important;
              line-height: ${currentSpacing.lineHeight} !important;
            }
            #a4-print-area td {
              padding: ${currentSpacing.padding} !important;
            }
            #a4-print-area .approval-table td {
              font-size: 7.5pt !important;
              padding: 2px !important;
              line-height: 1.2 !important;
            }
            #a4-print-area .common-brand-header,
            #a4-print-area .common-brand-header * {
              font-size: 7.5pt !important;
              line-height: 1.2 !important;
            }
          `}} />
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

            {/* 레이아웃 미세 조정기 (Micro-Adjuster) */}
            <div className="layout-adjuster-card no-print" style={{ 
              width: "100%", 
              maxWidth: "700px", 
              backgroundColor: "var(--bg-color-card)", 
              border: "1px solid var(--color-border)", 
              borderRadius: "8px", 
              padding: "16px", 
              marginBottom: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                  🎛️ 레이아웃 미세 조정 (1페이지 조판 튜닝)
                  {isManualSpacing ? (
                    <span style={{ fontSize: "0.7rem", backgroundColor: "#f3f4f6", color: "#374151", padding: "2px 6px", borderRadius: "4px", fontWeight: "normal" }}>
                      수동 조정 모드
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#2563eb", padding: "2px 6px", borderRadius: "4px", fontWeight: "normal" }}>
                      🤖 AI 자동 조판 중
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsManualSpacing(false)}
                  disabled={!isManualSpacing}
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: isManualSpacing ? "#f8fafc" : "#f1f5f9",
                    color: isManualSpacing ? "#0f172a" : "#94a3b8",
                    cursor: isManualSpacing ? "pointer" : "not-allowed",
                    fontWeight: "bold",
                    transition: "all 0.2s ease"
                  }}
                  title="문서 내용 길이에 알맞게 AI가 최적 간격을 다시 계산합니다."
                >
                  🔄 AI 자동 조판 리셋
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* 1. 글꼴 크기 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-sub)", width: "110px", display: "flex", alignItems: "center", gap: "4px" }}>
                    🔤 글꼴 크기
                  </span>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.5"
                    value={userFontDelta}
                    onChange={(e) => {
                      setUserFontDelta(parseFloat(e.target.value));
                      setIsManualSpacing(true);
                    }}
                    style={{ flex: 1, cursor: "pointer", height: "4px", borderRadius: "2px" }}
                  />
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold", width: "90px", textAlign: "right", color: "var(--color-text-main)" }}>
                    {10 + currentSpacing.fontDelta}pt ({userFontDelta > 0 ? `+${userFontDelta}` : userFontDelta}pt)
                  </span>
                </div>

                {/* 2. 줄간격 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-sub)", width: "110px", display: "flex", alignItems: "center", gap: "4px" }}>
                    ↔️ 줄간격
                  </span>
                  <input
                    type="range"
                    min="1.1"
                    max="2.2"
                    step="0.05"
                    value={userLineHeight}
                    onChange={(e) => {
                      setUserLineHeight(parseFloat(e.target.value));
                      setIsManualSpacing(true);
                    }}
                    style={{ flex: 1, cursor: "pointer", height: "4px", borderRadius: "2px" }}
                  />
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold", width: "90px", textAlign: "right", color: "var(--color-text-main)" }}>
                    {currentSpacing.lineHeight.toFixed(2)}배
                  </span>
                </div>

                {/* 3. 표 셀 여백 (패딩) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-sub)", width: "110px", display: "flex", alignItems: "center", gap: "4px" }}>
                    ↕️ 표 셀 여백
                  </span>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={userPadding}
                    onChange={(e) => {
                      setUserPadding(parseInt(e.target.value, 10));
                      setIsManualSpacing(true);
                    }}
                    style={{ flex: 1, cursor: "pointer", height: "4px", borderRadius: "2px" }}
                  />
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold", width: "90px", textAlign: "right", color: "var(--color-text-main)" }}>
                    {userPadding}px
                  </span>
                </div>
              </div>
            </div>

            {/* 상단 액션 컨트롤러 (마우스 & 손가락 가로 드래그 스크롤 지원) */}
            <style dangerouslySetInnerHTML={{__html: `
              .a4-actions-bar::-webkit-scrollbar { display: none; }
              .a4-actions-bar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
            <div
              ref={actionsBarRef}
              className="a4-actions-bar"
              onMouseDown={handleBarMouseDown}
              onMouseMove={handleBarMouseMove}
              onMouseUp={handleBarMouseUpOrLeave}
              onMouseLeave={handleBarMouseUpOrLeave}
              onClickCapture={handleBarClickCapture}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                maxWidth: "700px",
                marginBottom: "16px",
                flexWrap: "nowrap",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                cursor: "grab",
                userSelect: "none",
                padding: "2px 0 4px 0",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  vibrateDevice(30);
                  setIsRequestSigModalOpen(true);
                }}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)",
                }}
              >
                <span>🤝 비대면 서명 요청 (무료)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateDevice(20);
                  setIsSignatureModalOpen(true);
                }}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  height: "42px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-card)",
                  color: "var(--color-text-main)",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>✍️ 전자서명 · 도장</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#3182f6",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>🖨️ PDF 저장 및 인쇄</span>
              </button>
              <button
                type="button"
                onClick={handleShareDoc}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  height: "42px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#fee500",
                  color: "#191919",
                  fontWeight: 800,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>💬 카카오톡 공유</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateDevice(20);
                  setIsCompanySearchModalOpen(true);
                }}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  height: "42px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid #3b82f6",
                  backgroundColor: "rgba(59, 130, 246, 0.08)",
                  color: "#2563eb",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>🔍 상대방 기업 DB</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadDoc("hwp")}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  height: "42px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-card)",
                  color: "var(--color-text-sub)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                }}
              >
                <span>📄 한글(HWP)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadDoc("docx")}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  height: "42px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-card)",
                  color: "var(--color-text-sub)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                }}
              >
                <span>📝 워드(DOC)</span>
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
                        spacing={currentSpacing}
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

      {/* 전자 서명 · 인감 모달 (열릴 때만 지연 로드) */}
      {isSignatureModalOpen && (
        <DocumentSignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onApplySignature={handleApplySignature}
          defaultSignerName={data?.name || data?.partyA_owner || data?.owner || "대표자"}
        />
      )}

      {/* 기업 DB 검색 및 자동 입력 모달 (열릴 때만 지연 로드) */}
      {isCompanySearchModalOpen && (
        <CompanySearchModal
          isOpen={isCompanySearchModalOpen}
          onClose={() => setIsCompanySearchModalOpen(false)}
          onSelectCompany={handleSelectCompanyFromDb}
        />
      )}

      {/* 비대면 전자서명 요청 모달 (열릴 때만 지연 로드) */}
      {isRequestSigModalOpen && (
        <RequestSignatureModal
          isOpen={isRequestSigModalOpen}
          onClose={() => setIsRequestSigModalOpen(false)}
          templateId={templateId}
          templateTitle={template?.title || "계약서"}
          formData={data}
          currentSignature={signatureImage || data?.signatureImage}
          onRequireSignature={() => {
            setIsRequestSigModalOpen(false);
            setIsSignatureModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

const API_PRIMARY = "https://www.maumdata.com";
const API_FALLBACK = "http://localhost:3000";

let currentBizData = null;

// 토스트 표시 헬퍼
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window.__mdToastTimer);
  window.__mdToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1900);
}

// 클립보드 복사 헬퍼
function copyToClipboard(text, label = "텍스트") {
  if (!text || text === "-") return;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} 복사 완료! ✨`);
  });
}

// 국세청 10자리 사업자등록번호 가중치 검증식
function isValidKoreanBrn(raw10) {
  const clean = String(raw10 || "").replace(/[^0-9]/g, "");
  if (clean.length !== 10) return false;
  const digits = clean.split("").map(Number);
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }
  sum += Math.floor((digits[8] * 5) / 10);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
}

// 사업자번호 가운데 2자리 기준 과세/법인 유형 판별
function getBrnEntityType(raw10) {
  const clean = String(raw10 || "").replace(/[^0-9]/g, "");
  const mid = parseInt(clean.slice(3, 5), 10);
  if (mid >= 1 && mid <= 79) return "개인사업자 (일반·간이과세)";
  if (mid === 80) return "개인 또는 법인 아닌 단체";
  if ([81, 86, 87, 88].includes(mid)) return "영리법인 (본점)";
  if (mid === 82) return "비영리법인 (본점·지점)";
  if (mid === 83) return "국가·지자체·공공기관";
  if (mid === 84) return "외국법인";
  if (mid === 85) return "영리법인 (지점)";
  if (mid >= 90 && mid <= 99) return "개인사업자 (면세사업자 등)";
  return "일반 사업자";
}

function formatBrn(raw10) {
  const clean = String(raw10 || "").replace(/[^0-9]/g, "");
  if (clean.length !== 10) return raw10;
  return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
}

// 실서버 우선 API 호출
async function fetchApiJson(path) {
  try {
    const res = await fetch(`${API_PRIMARY}${path}`);
    if (res.ok) return await res.json();
    if (res.status === 404) return { __notFound: true };
    throw new Error(`HTTP ${res.status}`);
  } catch (primaryErr) {
    try {
      const resLocal = await fetch(`${API_FALLBACK}${path}`);
      if (resLocal.ok) return await resLocal.json();
      if (resLocal.status === 404) return { __notFound: true };
    } catch (_) {}
    throw primaryErr;
  }
}

// 스테이지 뷰 전환
function switchBizStage(stageName) {
  const stages = {
    intro: document.getElementById("biz-view-intro"),
    loading: document.getElementById("biz-view-loading"),
    list: document.getElementById("biz-view-list"),
    detail: document.getElementById("biz-view-detail"),
  };
  Object.values(stages).forEach((el) => el && el.classList.add("hidden"));
  if (stages[stageName]) stages[stageName].classList.remove("hidden");
}

// 최근 조회 기업 칩 렌더링
const DEFAULT_RECENT = [
  { b_no: "1378651839", b_nm: "지윤 주식회사" },
  { b_no: "1208801280", b_nm: "비바리퍼블리카" },
  { b_no: "1208765763", b_nm: "우아한형제들" },
];

async function renderRecentChips() {
  const holder = document.getElementById("recent-chips");
  if (!holder) return;
  const stored = await chrome.storage.local.get(["recentBizList"]);
  const list =
    Array.isArray(stored.recentBizList) && stored.recentBizList.length > 0
      ? stored.recentBizList
      : DEFAULT_RECENT;

  holder.innerHTML = "";
  list.slice(0, 5).forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "recent-chip";
    btn.textContent = item.b_nm;
    btn.title = `${item.b_nm} (${formatBrn(item.b_no)})`;
    btn.addEventListener("click", () => {
      const input = document.getElementById("biz-search-input");
      if (input) input.value = formatBrn(item.b_no);
      loadBusinessDetail(item.b_no);
    });
    holder.appendChild(btn);
  });
}

async function saveToRecent(bNo, bNm) {
  if (!bNo || !bNm) return;
  const clean = bNo.replace(/[^0-9]/g, "");
  const stored = await chrome.storage.local.get(["recentBizList"]);
  let list = Array.isArray(stored.recentBizList) ? stored.recentBizList : [...DEFAULT_RECENT];
  list = list.filter((x) => x.b_no !== clean);
  list.unshift({ b_no: clean, b_nm: bNm });
  await chrome.storage.local.set({ recentBizList: list.slice(0, 6) });
  renderRecentChips();
}

// 검색 실행 분기
function handleQuerySubmit(rawQuery) {
  const q = (rawQuery || "").trim();
  if (!q) return;
  const digits = q.replace(/[^0-9]/g, "");
  if (digits.length === 10) {
    loadBusinessDetail(digits);
  } else {
    searchBusinessesByName(q);
  }
}

async function searchBusinessesByName(query) {
  switchBizStage("loading");
  try {
    const list = await fetchApiJson(`/api/extension/search?query=${encodeURIComponent(query)}`);
    if (!Array.isArray(list) || list.length === 0) {
      renderListMessage(`'${query}'에 매칭되는 법인·기업이 없습니다.`, "개인사업자는 사업자등록번호 10자리로 조회해 주세요.");
      return;
    }
    if (list.length === 1 && list[0].b_no) {
      loadBusinessDetail(list[0].b_no);
      return;
    }
    renderSearchList(list);
  } catch (err) {
    renderListMessage("기업 검색 중 일시적인 통신 오류가 발생했습니다.", err.message || "");
  }
}

function renderListMessage(title, sub) {
  switchBizStage("list");
  const container = document.getElementById("biz-search-list");
  if (!container) return;
  container.innerHTML = `
    <div style="text-align:center; padding: 22px 10px; color: #94a3b8;">
      <div style="font-size: 24px; margin-bottom: 6px;">🔍</div>
      <div style="font-size: 12px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">${title}</div>
      <div style="font-size: 10.5px; color: #64748b;">${sub}</div>
    </div>
  `;
}

function renderSearchList(list) {
  switchBizStage("list");
  const container = document.getElementById("biz-search-list");
  if (!container) return;
  container.innerHTML = "";
  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "biz-list-item";
    div.innerHTML = `
      <div class="biz-list-top">
        <strong>${item.b_nm}</strong>
        <span class="source-pill">${formatBrn(item.b_no)}</span>
      </div>
      <div class="biz-list-sub">대표: ${item.p_nm || "-"} · ${item.b_sector || "업종 정보"}</div>
    `;
    div.addEventListener("click", () => loadBusinessDetail(item.b_no));
    container.appendChild(div);
  });
}

async function loadBusinessDetail(bNo) {
  const clean = String(bNo || "").replace(/[^0-9]/g, "");
  if (clean.length !== 10) return;

  switchBizStage("loading");
  try {
    const data = await fetchApiJson(`/api/extension/biz/${clean}`);
    if (!data || data.__notFound) {
      renderListMessage(
        `사업자번호 ${formatBrn(clean)} 조회 결과 없음`,
        "국세청 미등록 번호이거나 아직 공시되지 않은 사업자입니다."
      );
      return;
    }
    currentBizData = data;
    saveToRecent(clean, data.b_nm);
    renderBusinessDetail(data);
  } catch (err) {
    renderListMessage("기업 상세 조회 중 통신 오류가 발생했습니다.", err.message || "");
  }
}

function formatRevKor(valEok) {
  if (!valEok || valEok === 0) return "비공개";
  if (valEok >= 10000) return `${(valEok / 10000).toFixed(1)}조 원`;
  return `${Number(valEok).toLocaleString()}억 원`;
}

function renderBusinessDetail(data) {
  switchBizStage("detail");

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "-";
  };

  setTxt("dt-name", data.b_nm);
  setTxt("dt-brn", data.b_no_formatted || formatBrn(data.b_no));
  setTxt("dt-sme-badge", data.is_sme || "기업");
  setTxt("dt-ceo", data.p_nm || "-");

  const rawDt = String(data.start_dt || "");
  const formattedDt =
    rawDt.length === 8 ? `${rawDt.slice(0, 4)}.${rawDt.slice(4, 6)}.${rawDt.slice(6, 8)}` : rawDt || "-";
  setTxt("dt-founded", formattedDt);
  setTxt("dt-sector", data.b_sector || "-");
  setTxt("dt-addr", data.b_adr || "-");

  // 국세청 납세 상태 배지 스타일링
  const stt = (data.tax_status && data.tax_status.b_stt) || "계속사업자";
  const taxType = (data.tax_status && data.tax_status.tax_type) || "부가가치세 일반과세자";
  setTxt("dt-tax-stt", stt);
  setTxt("dt-tax-type", taxType);

  const dot = document.getElementById("dt-tax-dot");
  const box = document.getElementById("dt-tax-box");
  if (dot && box) {
    dot.className = "status-pulse-dot";
    if (stt.includes("폐업")) {
      dot.classList.add("status-danger");
      box.style.background = "rgba(239, 68, 68, 0.12)";
      box.style.borderColor = "rgba(239, 68, 68, 0.35)";
    } else if (stt.includes("휴업")) {
      dot.classList.add("status-warn");
      box.style.background = "rgba(245, 158, 11, 0.12)";
      box.style.borderColor = "rgba(245, 158, 11, 0.35)";
    } else {
      dot.classList.add("status-active");
      box.style.background = "rgba(16, 185, 129, 0.10)";
      box.style.borderColor = "rgba(16, 185, 129, 0.30)";
    }
  }

  // 매출 미니 바 차트 애니메이션
  const finWrap = document.getElementById("dt-fin-bars");
  const history = Array.isArray(data.history) ? [...data.history].sort((a, b) => a.year - b.year).slice(-3) : [];
  if (history.length > 0) {
    const latest = history[history.length - 1];
    setTxt("dt-latest-rev", formatRevKor(latest.revenue));
    const maxRev = Math.max(...history.map((h) => Number(h.revenue) || 0), 1);
    if (finWrap) {
      finWrap.innerHTML = history
        .map((h) => {
          const pct = Math.max(12, Math.min(100, Math.round(((Number(h.revenue) || 0) / maxRev) * 100)));
          return `
            <div class="fin-mini-row">
              <span class="fin-mini-yr">${String(h.year).slice(-2)}년</span>
              <div class="fin-mini-track"><div class="fin-mini-fill" data-pct="${pct}"></div></div>
              <span class="fin-mini-val">${h.revenue ? h.revenue + "억" : "-"}</span>
            </div>
          `;
        })
        .join("");
      setTimeout(() => {
        finWrap.querySelectorAll(".fin-mini-fill").forEach((bar) => {
          bar.style.width = `${bar.getAttribute("data-pct")}%`;
        });
      }, 50);
    }
  } else {
    setTxt("dt-latest-rev", formatRevKor(data.latest_revenue));
    if (finWrap) {
      finWrap.innerHTML = `<div style="font-size:10px; color:#64748b; padding:6px 0;">공시된 3개년 재무 표본이 없습니다.</div>`;
    }
  }

  // 국민연금 가입자 원형 SVG 링 애니메이션
  const empCount = Number(data.latest_employees) || 0;
  setTxt("dt-emp-count", empCount > 0 ? `${empCount.toLocaleString()}명` : "집계중");
  setTxt("dt-emp-sub", empCount > 0 ? "국민연금 가입" : "기준 데이터");

  const ring = document.getElementById("dt-emp-ring");
  if (ring) {
    const circumference = 107;
    const fillRatio = empCount > 0 ? Math.min(0.92, Math.max(0.22, Math.log10(empCount + 1) / 3)) : 0.1;
    const dash = Math.round(circumference * fillRatio);
    ring.setAttribute("stroke-dasharray", `0 ${circumference}`);
    setTimeout(() => {
      ring.setAttribute("stroke-dasharray", `${dash} ${circumference}`);
    }, 60);
  }
}

// =========================================================
// 현재 활성 탭에서 사업자등록번호 자동 스캔
// =========================================================
async function scanActiveTabForBrn(autoTriggerLookup = false) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url || tab.url.startsWith("chrome://")) {
      if (autoTriggerLookup) showToast("스캔 가능한 웹페이지가 아닙니다.");
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: "SCAN_PAGE_BRN" }).catch(() => null);
    const rawCandidates = (response && Array.isArray(response.matches)) ? response.matches : [];
    // 우리 사이트 기본 푸터 번호 등을 제외한 유효 국세청 체크섬 번호 필터링
    const validBrns = [...new Set(rawCandidates)].filter((num) => isValidKoreanBrn(num));

    if (validBrns.length > 0) {
      const firstBrn = validBrns[0];
      const banner = document.getElementById("page-scan-banner");
      const brnText = document.getElementById("scanned-brn-text");
      if (banner && brnText) {
        brnText.textContent = formatBrn(firstBrn);
        banner.dataset.brn = firstBrn;
        banner.classList.remove("hidden");
      }
      if (autoTriggerLookup) {
        loadBusinessDetail(firstBrn);
      }
    } else if (autoTriggerLookup) {
      showToast("현재 페이지에서 사업자번호(000-00-00000)를 찾지 못했습니다.");
    }
  } catch (_) {
    if (autoTriggerLookup) {
      showToast("이 페이지에서는 자동 스캔을 사용할 수 없습니다.");
    }
  }
}

// =========================================================
// TAB 2: 부가세 · 원천징수 · 계약서용 한글 금액 변환기
// =========================================================
function parseKoreanAmountInput(raw) {
  if (!raw) return 0;
  let str = String(raw).replace(/,/g, "").trim();
  if (/^\d+$/.test(str)) return parseInt(str, 10);

  let total = 0;
  const eokMatch = str.match(/(\d+(?:\.\d+)?)\s*억/);
  const cheonMatch = str.match(/(\d+(?:\.\d+)?)\s*천/);
  const baekMatch = str.match(/(\d+(?:\.\d+)?)\s*백/);
  const manMatch = str.match(/(\d+(?:\.\d+)?)\s*만/);

  if (eokMatch || cheonMatch || baekMatch || manMatch) {
    if (eokMatch) total += parseFloat(eokMatch[1]) * 100000000;
    if (cheonMatch) total += parseFloat(cheonMatch[1]) * 10000000;
    if (baekMatch) total += parseFloat(baekMatch[1]) * 1000000;
    if (manMatch) total += parseFloat(manMatch[1]) * 10000;
    return Math.round(total);
  }

  const numOnly = parseInt(str.replace(/[^0-9]/g, ""), 10);
  return isNaN(numOnly) ? 0 : numOnly;
}

function numberToKoreanLegal(num) {
  if (!num || num <= 0) return "금 영 원정";
  const hanDigits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  const smallUnits = ["", "십", "백", "천"];
  const bigUnits = ["", "만", "억", "조", "경"];

  let result = "";
  let unitIdx = 0;
  let temp = Math.floor(num);

  while (temp > 0) {
    const chunk = temp % 10000;
    if (chunk > 0) {
      let chunkStr = "";
      let c = chunk;
      for (let i = 0; i < 4; i++) {
        const d = c % 10;
        if (d > 0) {
          chunkStr = hanDigits[d] + smallUnits[i] + chunkStr;
        }
        c = Math.floor(c / 10);
      }
      result = chunkStr + bigUnits[unitIdx] + " " + result;
    }
    temp = Math.floor(temp / 10000);
    unitIdx++;
  }
  return `금 ${result.trim()} 원정`;
}

function updateVatCalculator() {
  const input = document.getElementById("vat-input");
  if (!input) return;
  const amount = parseKoreanAmountInput(input.value);

  const korEl = document.getElementById("kor-amount-text");
  if (korEl) korEl.textContent = numberToKoreanLegal(amount);

  const fmt = (n) => `${Math.round(n).toLocaleString("ko-KR")}원`;

  // 1. 합계금액 기준 (부가세 포함)
  const incSupply = Math.round(amount / 1.1);
  const incTax = amount - incSupply;
  document.getElementById("vat-inc-supply").textContent = fmt(incSupply);
  document.getElementById("vat-inc-tax").textContent = fmt(incTax);

  // 2. 공급가액 기준 (부가세 별도)
  const excTax = Math.round(amount * 0.1);
  const excTotal = amount + excTax;
  document.getElementById("vat-exc-tax").textContent = fmt(excTax);
  document.getElementById("vat-exc-total").textContent = fmt(excTotal);

  // 3. 3.3% 원천징수
  const tax33 = Math.floor(amount * 0.033);
  const net33 = amount - tax33;
  document.getElementById("vat-33-tax").textContent = fmt(tax33);
  document.getElementById("vat-33-net").textContent = fmt(net33);
}

// =========================================================
// 초기화 및 이벤트 바인딩
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
  // 상단 탭 전환
  const tabBtns = document.querySelectorAll(".mode-tab");
  const tabPanels = {
    biz: document.getElementById("tab-biz"),
    calc: document.getElementById("tab-calc"),
    contract: document.getElementById("tab-contract"),
  };

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      Object.entries(tabPanels).forEach(([k, panel]) => {
        if (panel) panel.classList.toggle("active", k === target);
      });
    });
  });

  // 로고 클릭 시 초기 상태 복귀
  const btnLogoReset = document.getElementById("btn-logo-reset");
  if (btnLogoReset) {
    btnLogoReset.addEventListener("click", () => {
      switchBizStage("intro");
    });
  }

  // 검색창 이벤트
  const searchInput = document.getElementById("biz-search-input");
  const btnSearch = document.getElementById("btn-biz-search");
  if (btnSearch && searchInput) {
    btnSearch.addEventListener("click", () => handleQuerySubmit(searchInput.value));
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleQuerySubmit(searchInput.value);
    });
  }

  // 목록에서 돌아가기
  const btnBackList = document.getElementById("btn-back-from-list");
  if (btnBackList) {
    btnBackList.addEventListener("click", () => switchBizStage("intro"));
  }

  // 수동 및 배너 스캔 버튼
  const btnManualScan = document.getElementById("btn-manual-page-scan");
  if (btnManualScan) {
    btnManualScan.addEventListener("click", () => scanActiveTabForBrn(true));
  }
  const btnScanLookup = document.getElementById("btn-scan-lookup");
  if (btnScanLookup) {
    btnScanLookup.addEventListener("click", () => {
      const banner = document.getElementById("page-scan-banner");
      if (banner && banner.dataset.brn) {
        loadBusinessDetail(banner.dataset.brn);
      }
    });
  }

  // 상세 뷰 복사 이벤트
  const btnCopyBrn = document.getElementById("btn-copy-brn");
  if (btnCopyBrn) {
    btnCopyBrn.addEventListener("click", () => {
      const txt = document.getElementById("dt-brn")?.textContent;
      copyToClipboard(txt, "사업자번호");
    });
  }

  document.querySelectorAll(".meta-cell.copyable").forEach((cell) => {
    cell.addEventListener("click", () => {
      const targetId = cell.getAttribute("data-copy-target");
      const val = document.getElementById(targetId)?.textContent;
      copyToClipboard(val, "기업 정보");
    });
  });

  // 상세 뷰 하단 액션 버튼
  const btnDtContract = document.getElementById("btn-dt-contract");
  if (btnDtContract) {
    btnDtContract.addEventListener("click", () => {
      chrome.tabs.create({ url: `${API_PRIMARY}/contracts` });
    });
  }

  const btnDtFull = document.getElementById("btn-dt-full");
  if (btnDtFull) {
    btnDtFull.addEventListener("click", () => {
      const bNo = currentBizData?.b_no || "1378651839";
      chrome.tabs.create({ url: `${API_PRIMARY}/biz/${bNo}` });
    });
  }

  // 부가세 계산기 바인딩
  const vatInput = document.getElementById("vat-input");
  const btnVatClear = document.getElementById("btn-vat-clear");
  if (vatInput) {
    vatInput.addEventListener("input", updateVatCalculator);
    updateVatCalculator();
  }
  if (btnVatClear && vatInput) {
    btnVatClear.addEventListener("click", () => {
      vatInput.value = "";
      updateVatCalculator();
      vatInput.focus();
    });
  }

  const korCopyBox = document.getElementById("kor-amount-copy");
  if (korCopyBox) {
    korCopyBox.addEventListener("click", () => {
      const txt = document.getElementById("kor-amount-text")?.textContent;
      copyToClipboard(txt, "한글 금액");
    });
  }

  document.querySelectorAll(".copy-num").forEach((el) => {
    el.addEventListener("click", () => {
      copyToClipboard(el.textContent, "계산 금액");
    });
  });

  // 탭 3: 국세청 체크섬 판독기 바인딩
  const chkInput = document.getElementById("chk-brn-input");
  const btnChk = document.getElementById("btn-chk-brn");
  const chkRes = document.getElementById("chk-brn-result");
  if (btnChk && chkInput && chkRes) {
    const runCheck = () => {
      const clean = chkInput.value.replace(/[^0-9]/g, "");
      if (clean.length !== 10) {
        chkRes.style.color = "#f87171";
        chkRes.textContent = `⚠️ 숫자 10자리를 정확히 입력해 주세요. (현재 ${clean.length}자리)`;
        return;
      }
      const valid = isValidKoreanBrn(clean);
      const entity = getBrnEntityType(clean);
      if (valid) {
        chkRes.style.color = "#34d399";
        chkRes.textContent = `✅ 유효한 국세청 번호 (${formatBrn(clean)}) · 유형: ${entity}`;
      } else {
        chkRes.style.color = "#f87171";
        chkRes.textContent = `❌ 국세청 가중치 체크섬 불일치 (${formatBrn(clean)}) — 오타 여부를 확인하세요.`;
      }
    };
    btnChk.addEventListener("click", runCheck);
    chkInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runCheck();
    });
  }

  // 초기 데이터 로드: 최근 칩 + 드래그된 텍스트 + 현재 페이지 스캔
  await renderRecentChips();
  scanActiveTabForBrn(false);

  const stored = await chrome.storage.local.get(["draggedText", "lastUpdated"]);
  if (stored.draggedText && Date.now() - (stored.lastUpdated || 0) < 60000) {
    if (searchInput) searchInput.value = stored.draggedText;
    handleQuerySubmit(stored.draggedText);
  }
});

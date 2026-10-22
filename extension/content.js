// content.js - 웹페이지 드래그 텍스트 기반 마음데이타 인페이지 레이어 팝업 & 플로팅 버튼
let quickBizBtn = null;
let layerModal = null;
let currentSelectedText = "";

function createFloatingButton() {
  if (quickBizBtn) return;

  quickBizBtn = document.createElement("div");
  quickBizBtn.id = "maumdata-floating-btn";
  quickBizBtn.innerHTML = `
    <span class="md-float-pulse"></span>
    <span>⚡ 마음데이타 기업 스캔</span>
  `;

  quickBizBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentSelectedText) {
      chrome.runtime.sendMessage({
        type: "SAVE_DRAGGED_QUERY",
        text: currentSelectedText,
      });
      openInPageLayerModal(currentSelectedText);
    }
    hideFloatingButton();
  });

  document.body.appendChild(quickBizBtn);
}

function showFloatingButton(x, y) {
  createFloatingButton();
  quickBizBtn.style.left = `${Math.max(10, x)}px`;
  quickBizBtn.style.top = `${Math.max(10, y)}px`;
  quickBizBtn.classList.add("visible");
}

function hideFloatingButton() {
  if (quickBizBtn) {
    quickBizBtn.classList.remove("visible");
  }
}

function closeInPageLayerModal() {
  if (layerModal) {
    layerModal.remove();
    layerModal = null;
  }
}

function formatBrn(raw10) {
  const clean = String(raw10 || "").replace(/[^0-9]/g, "");
  if (clean.length !== 10) return raw10;
  return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
}

function openInPageLayerModal(query) {
  closeInPageLayerModal();

  layerModal = document.createElement("div");
  layerModal.id = "maumdata-layer-modal";
  layerModal.innerHTML = `
    <div class="md-modal-header">
      <div class="md-modal-brand">
        <span>⚡ MAUMDATA LAYER SCAN</span>
      </div>
      <button class="md-modal-close" id="md-layer-close">&times;</button>
    </div>
    <div id="md-layer-body" style="text-align:center; padding: 18px 6px; color:#94a3b8; font-size:12px;">
      실시간 국세청·공시 데이터를 불러오는 중...
    </div>
  `;

  document.body.appendChild(layerModal);

  const closeBtn = layerModal.querySelector("#md-layer-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeInPageLayerModal);
  }

  const cleanNum = query.replace(/[^0-9]/g, "");
  if (cleanNum.length === 10) {
    fetchBizForLayer(cleanNum);
  } else {
    chrome.runtime.sendMessage({ type: "API_SEARCH_BIZ", query }, (res) => {
      if (!res || !res.ok || !Array.isArray(res.data) || res.data.length === 0) {
        renderLayerNotFound(query);
        return;
      }
      fetchBizForLayer(res.data[0].b_no);
    });
  }
}

function fetchBizForLayer(bNo) {
  chrome.runtime.sendMessage({ type: "API_GET_BIZ_DETAIL", bNo }, (res) => {
    const body = layerModal && layerModal.querySelector("#md-layer-body");
    if (!body) return;

    if (!res || !res.ok || !res.data) {
      renderLayerNotFound(formatBrn(bNo));
      return;
    }

    const d = res.data;
    const stt = (d.tax_status && d.tax_status.b_stt) || "계속사업자";
    const taxType = (d.tax_status && d.tax_status.tax_type) || "일반과세자";
    const revStr = d.latest_revenue ? `${d.latest_revenue}억 원` : "비공개";
    const empStr = d.latest_employees ? `${d.latest_employees}명` : "집계중";

    body.style.textAlign = "left";
    body.style.padding = "0";
    body.innerHTML = `
      <div class="md-modal-title">${d.b_nm}</div>
      <div class="md-modal-brn">사업자등록번호: ${d.b_no_formatted || formatBrn(d.b_no)} · ${d.is_sme || "기업"}</div>
      <div class="md-modal-status">
        <span>● ${stt} (${taxType})</span>
      </div>
      <div class="md-modal-grid">
        <div class="md-modal-cell">
          <span class="md-modal-k">대표자</span>
          <span class="md-modal-v">${d.p_nm || "-"}</span>
        </div>
        <div class="md-modal-cell">
          <span class="md-modal-k">최근 매출 / 인원</span>
          <span class="md-modal-v">${revStr} / ${empStr}</span>
        </div>
        <div class="md-modal-cell full">
          <span class="md-modal-k">주요 업종</span>
          <span class="md-modal-v">${d.b_sector || "-"}</span>
        </div>
        <div class="md-modal-cell full">
          <span class="md-modal-k">소재지</span>
          <span class="md-modal-v">${d.b_adr || "-"}</span>
        </div>
      </div>
      <div class="md-modal-actions">
        <a href="https://www.maumdata.com/contracts" target="_blank" class="md-btn-sub">✍️ 전자계약 작성</a>
        <a href="https://www.maumdata.com/biz/${d.b_no}" target="_blank" class="md-btn-main">📊 상세 리포트 ↗</a>
      </div>
    `;
  });
}

function renderLayerNotFound(query) {
  const body = layerModal && layerModal.querySelector("#md-layer-body");
  if (!body) return;
  body.innerHTML = `
    <div style="padding: 12px 4px; text-align:center;">
      <div style="font-size:13px; font-weight:800; color:#f8fafc; margin-bottom:6px;">'${query}' 조회 결과 안내</div>
      <div style="font-size:11px; color:#94a3b8; margin-bottom:12px;">마음데이타 포털에서 실시간 국세청 상태 및 상세 검색을 진행해보세요.</div>
      <a href="https://www.maumdata.com/search?q=${encodeURIComponent(query)}" target="_blank" class="md-btn-main">마음데이타에서 검색하기 ↗</a>
    </div>
  `;
}

function isValidQuery(str) {
  if (!str) return false;
  const clean = str.trim();

  // 1. 사업자번호 형식 (123-45-67890 또는 연속 10자리 숫자)
  if (/^\d{3}-\d{2}-\d{5}$/.test(clean) || /^\d{10}$/.test(clean)) {
    return true;
  }

  // 2. 법인 키워드 포함 기업명
  if (clean.length >= 3 && clean.length <= 28 && !clean.includes("\n")) {
    const corpKeywords = ["(주)", "주식회사", "(유)", "유한회사", "(합)", "합자회사", "합명회사", "법인"];
    if (corpKeywords.some((k) => clean.includes(k))) {
      return true;
    }
  }
  return false;
}

document.addEventListener("mouseup", (e) => {
  if ((quickBizBtn && quickBizBtn.contains(e.target)) || (layerModal && layerModal.contains(e.target))) {
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";

    if (isValidQuery(selectedText)) {
      currentSelectedText = selectedText;
      showFloatingButton(e.pageX - 50, e.pageY + 14);
    } else {
      hideFloatingButton();
      currentSelectedText = "";
    }
  }, 15);
});

document.addEventListener("mousedown", (e) => {
  if (quickBizBtn && !quickBizBtn.contains(e.target)) {
    hideFloatingButton();
  }
});

// 우클릭 컨텍스트 메뉴 및 팝업 페이지 스캔 요청 처리
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "OPEN_MAUMDATA_LAYER_MODAL" && msg.query) {
    openInPageLayerModal(msg.query);
  }
  if (msg && msg.type === "SCAN_PAGE_BRN") {
    const text = document.body ? document.body.innerText : "";
    const regex = /\b(\d{3})-(\d{2})-(\d{5})\b/g;
    const matches = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
      matches.push(m[1] + m[2] + m[3]);
      if (matches.length >= 15) break;
    }
    sendResponse({ matches });
    return true;
  }
});

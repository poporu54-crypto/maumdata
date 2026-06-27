const API_BASE = "http://localhost:3000";
const WEB_BASE = "https://www.maumdata.com";

let currentBNo = "";

// 뷰 스위처 (기업 조회 내부 뷰 - Null Guard 및 Lazy Load 적용)
function showBizView(viewName) {
  const viewIntro = document.getElementById("view-intro");
  const viewLoading = document.getElementById("view-loading");
  const viewSearchResults = document.getElementById("view-search-results");
  const viewDetail = document.getElementById("view-detail");

  if (viewIntro) viewIntro.classList.add("hidden");
  if (viewLoading) viewLoading.classList.add("hidden");
  if (viewSearchResults) viewSearchResults.classList.add("hidden");
  if (viewDetail) viewDetail.classList.add("hidden");

  if (viewName === "intro" && viewIntro) viewIntro.classList.remove("hidden");
  else if (viewName === "loading" && viewLoading) viewLoading.classList.remove("hidden");
  else if (viewName === "search-results" && viewSearchResults) viewSearchResults.classList.remove("hidden");
  else if (viewName === "detail" && viewDetail) viewDetail.classList.remove("hidden");
}

// 초기화 (DOM 로드 완료 시 안전 바인딩)
document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("panel-search-input");
  const btnSearch = document.getElementById("btn-panel-search");
  const btnGoDetail = document.getElementById("btn-go-detail");

  if (btnSearch && searchInput) {
    btnSearch.addEventListener("click", () => {
      const query = searchInput.value.trim();
      if (query) handleInputQuery(query);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) handleInputQuery(query);
      }
    });
  }

  if (btnGoDetail) {
    btnGoDetail.addEventListener("click", () => {
      if (currentBNo) {
        chrome.tabs.create({ url: `${WEB_BASE}/biz/${currentBNo}` });
      }
    });
  }

  const btnLogoHome = document.getElementById("btn-logo-home");
  if (btnLogoHome) {
    btnLogoHome.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      showBizView("intro");
    });
  }

  // 테마 스위칭 기능
  const btnThemeToggle = document.getElementById("btn-theme-toggle");
  chrome.storage.local.get(["theme"], (result) => {
    if (result.theme === "light") {
      document.body.classList.add("light-mode");
      if (btnThemeToggle) btnThemeToggle.innerText = "🌙";
    } else {
      document.body.classList.remove("light-mode");
      if (btnThemeToggle) btnThemeToggle.innerText = "☀️";
    }
  });

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-mode");
      const nextTheme = isLight ? "light" : "dark";
      btnThemeToggle.innerText = isLight ? "🌙" : "☀️";
      chrome.storage.local.set({ theme: nextTheme });
    });
  }

  // 드래그된 정보 수신 및 초기 로딩
  const data = await chrome.storage.local.get(["draggedText", "lastUpdated"]);
  if (data.draggedText && Date.now() - data.lastUpdated < 60000) {
    handleInputQuery(data.draggedText);
  } else {
    showBizView("intro");
  }
});

// 메시지 리스너 (드래그 감지 시 실시간 연동)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "DRAGGED_TEXT_UPDATED" && message.text) {
    handleInputQuery(message.text);
  }
});

// 입력 분석기
function handleInputQuery(query) {
  if (!query) return;

  const cleanNum = query.replace(/[^0-9]/g, "");
  showBizView("loading");
  
  if (cleanNum.length === 10) {
    loadBusinessDetail(cleanNum);
  } else {
    searchBusinesses(query);
  }
}

// -------------------------------------------------------------
// 기업 조회 연동 로직
// -------------------------------------------------------------
async function searchBusinesses(query) {
  try {
    const res = await fetch(`${API_BASE}/api/extension/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("검색 실패");
    const list = await res.json();
    
    if (!list || list.length === 0) {
      renderNoResults(query);
      return;
    }
    
    if (list.length === 1) {
      loadBusinessDetail(list[0].b_no);
      return;
    }
    
    renderSearchResults(list);
  } catch (err) {
    console.error(err);
    renderError(`기업 검색 중 오류가 발생했습니다.<br>(${err.message})`);
  }
}

async function loadBusinessDetail(bNo) {
  currentBNo = bNo;
  showBizView("loading");
  
  try {
    const res = await fetch(`${API_BASE}/api/extension/biz/${bNo}`);
    if (!res.ok) {
      if (res.status === 404) {
        renderError(`마음데이터 DB에 등록되지 않은 사업자입니다.<br>(${bNo.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")})`);
        return;
      }
      throw new Error("조회 실패");
    }
    const data = await res.json();
    renderDetail(data);
  } catch (err) {
    console.error(err);
    renderError(`상세 기업 정보를 조회하는 중 서버 오류가 발생했습니다.<br>(${err.message})`);
  }
}

function renderNoResults(query) {
  showBizView("search-results");
  const listHolder = document.getElementById("search-list");
  if (listHolder) {
    listHolder.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🔍</div>
        <p class="empty-txt"><strong>'${query}'</strong>에 매칭되는 기업 정보가 없습니다.</p>
        <p class="empty-sub">상호명 철자나 사업자등록번호를 확인해 주세요.</p>
      </div>
    `;
  }
}

function renderError(message) {
  showBizView("search-results");
  const listHolder = document.getElementById("search-list");
  if (listHolder) {
    listHolder.innerHTML = `
      <div class="error-state">
        <div class="error-emoji">⚠️</div>
        <p class="error-txt">${message}</p>
      </div>
    `;
  }
}

function renderSearchResults(list) {
  showBizView("search-results");
  const listHolder = document.getElementById("search-list");
  if (!listHolder) return;
  listHolder.innerHTML = "";
  
  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "search-item-card";
    
    const formattedBNo = item.b_no.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");
    const sourceBadge = item.dataSource === "local" ? "파트너사" : "공시정보";
    
    card.innerHTML = `
      <div class="search-item-title">
        <strong>${item.b_nm}</strong>
        <span class="badge-sm">${sourceBadge}</span>
      </div>
      <div class="search-item-desc">
        <span>대표: ${item.p_nm}</span> | <span>사업자: ${formattedBNo}</span>
      </div>
      <div class="search-item-sector">${item.b_sector}</div>
    `;
    
    card.addEventListener("click", () => {
      loadBusinessDetail(item.b_no);
    });
    
    listHolder.appendChild(card);
  });
}

function formatEventDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return dateStr || "-";
  return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
}

function formatRevenue(val) {
  if (val === 0 || !val) return "정보 없음";
  if (val >= 10000) {
    return `${(val / 10000).toFixed(1)}조`;
  }
  return `${val.toLocaleString()}억`;
}

// 상세 정보 렌더러
function renderDetail(data) {
  showBizView("detail");
  
  // DOM 요소 안전 획득 및 매핑 헬퍼
  const setTxt = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.innerText = txt || "-";
  };
  
  setTxt("detail-b-nm", data.b_nm);
  setTxt("detail-b-no", `사업자번호: ${data.b_no_formatted}`);
  setTxt("detail-desc", data.description);
  
  const badge = document.getElementById("detail-badge");
  if (badge) {
    if (data.listing_status.includes("코스닥") || data.listing_status.includes("코스피")) {
      badge.innerText = "금융위 공시 정보";
      badge.style.backgroundColor = "rgba(49, 130, 246, 0.15)";
      badge.style.color = "#3182f6";
    } else {
      badge.innerText = "마음데이터 종합분석";
      badge.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
      badge.style.color = "#10b981";
    }
  }

  const indicator = document.getElementById("detail-tax-indicator");
  const stt = document.getElementById("detail-tax-stt");
  const type = document.getElementById("detail-tax-type");
  
  if (stt) stt.innerText = data.tax_status.b_stt;
  if (type) type.innerText = data.tax_status.tax_type;
  
  if (indicator && stt) {
    if (data.tax_status.b_stt.includes("폐업")) {
      indicator.style.color = "#ef4444";
      stt.style.color = "#ef4444";
    } else if (data.tax_status.b_stt.includes("휴업")) {
      indicator.style.color = "#f59e0b";
      stt.style.color = "#f59e0b";
    } else {
      indicator.style.color = "#10b981";
      stt.style.color = "#f8fafc";
    }
  }

  setTxt("info-p-nm", data.p_nm);
  setTxt("info-start-dt", formatEventDate(data.start_dt));
  setTxt("info-sector", data.b_sector);
  setTxt("info-sme", data.is_sme);
  setTxt("info-listing", data.listing_status);
  setTxt("info-adr", data.b_adr);

  // 2. B2G 정부 입찰 역량 등급 산출
  let totalBidsAmount = 0;
  let safeContracts = 0;
  
  if (data.recent_bids && data.recent_bids.length > 0) {
    data.recent_bids.forEach(b => {
      totalBidsAmount += (b.presmptPrce || 0);
      const method = b.cntrctCnclMthdNm || "";
      if (method.includes("수의") || method.includes("제한") || method.includes("적격")) {
        safeContracts++;
      }
    });
  }

  const safeRatio = data.recent_bids && data.recent_bids.length > 0 ? (safeContracts / data.recent_bids.length) : 0;
  const cashFlowScore = data.recent_bids && data.recent_bids.length > 0 
    ? Math.min(100, Math.round(60 + (safeRatio * 30) + (data.recent_bids.length * 2.5))) 
    : 0;

  let b2gGrade = "E";
  let b2gGradeTitle = "B2G 실적 없음";
  let gradeColor = "#64748b";

  if (totalBidsAmount >= 1000000000) {
    b2gGrade = "S";
    b2gGradeTitle = "B2G 선도 명가";
    gradeColor = "#ff3366";
  } else if (totalBidsAmount >= 500000000) {
    b2gGrade = "A";
    b2gGradeTitle = "B2G 우수 파트너";
    gradeColor = "#3182f6";
  } else if (totalBidsAmount >= 200000000) {
    b2gGrade = "B";
    b2gGradeTitle = "B2G 유망 파트너";
    gradeColor = "#10b981";
  } else if (totalBidsAmount > 0) {
    b2gGrade = "C";
    b2gGradeTitle = "B2G 도약 파트너";
    gradeColor = "#f59e0b";
  }

  const b2gGradeEl = document.getElementById("b2g-grade");
  if (b2gGradeEl) {
    b2gGradeEl.innerText = b2gGrade;
    b2gGradeEl.style.color = gradeColor;
    b2gGradeEl.style.borderColor = gradeColor + "55";
    b2gGradeEl.style.backgroundColor = gradeColor + "15";
  }
  setTxt("b2g-grade-title", b2gGradeTitle);
  
  const b2gAmountStr = totalBidsAmount >= 100000000 
    ? `${(totalBidsAmount / 100000000).toFixed(1)}억 원` 
    : `${totalBidsAmount.toLocaleString()}원`;
  setTxt("b2g-total-amount", b2gAmountStr);
  setTxt("b2g-cash-score", `${cashFlowScore}점`);

  // 3. 고용 성장세 및 조직 건강도 산출
  const totalEmp = data.latest_employees || 0;
  const newAcqs = data.nps_acqs_nmps || 0;
  const losses = data.nps_loss_nmps || 0;
  const netChange = newAcqs - losses;

  const quitRate = totalEmp > 0 ? parseFloat(((losses / totalEmp) * 100).toFixed(1)) : 0;
  const joinRate = totalEmp > 0 ? parseFloat(((newAcqs / totalEmp) * 100).toFixed(1)) : 0;
  const netGrowthRate = totalEmp > 0 ? parseFloat(((netChange / totalEmp) * 100).toFixed(1)) : 0;

  let healthGrade = "✓";
  let healthGradeTitle = "고용 안정세 (유지 중)";
  let healthColor = "#64748b";

  if (quitRate >= 10.0 && losses >= 3) {
    healthGrade = "⚠️";
    healthGradeTitle = "인력 이탈 과다 (경고)";
    healthColor = "#ef4444";
  } else if (netGrowthRate > 2.0 && netChange >= 3) {
    healthGrade = "⚡";
    healthGradeTitle = "초고속 성장 (대폭 확장)";
    healthColor = "#3182f6";
  } else if (netGrowthRate > 0.5 && netChange >= 1) {
    healthGrade = "📈";
    healthGradeTitle = "안정적 성장 (확장 중)";
    healthColor = "#10b981";
  } else if (netGrowthRate < -1.0 && netChange <= -3) {
    healthGrade = "📉";
    healthGradeTitle = "인력 유출 우려 (인원 감축)";
    healthColor = "#f59e0b";
  }

  const healthGradeEl = document.getElementById("health-grade");
  if (healthGradeEl) {
    healthGradeEl.innerText = healthGrade;
    healthGradeEl.style.color = healthColor;
    healthGradeEl.style.borderColor = healthColor + "55";
    healthGradeEl.style.backgroundColor = healthColor + "15";
  }
  setTxt("health-grade-title", healthGradeTitle);
  setTxt("emp-join-rate", `${joinRate}%`);
  setTxt("emp-quit-rate", `${quitRate}%`);
  
  const growthValEl = document.getElementById("emp-growth-rate");
  if (growthValEl) {
    growthValEl.innerText = `${netChange > 0 ? '+' : ''}${netGrowthRate}%`;
    if (netChange > 0) {
      growthValEl.style.color = "#10b981";
    } else if (netChange < 0) {
      growthValEl.style.color = "#ef4444";
    } else {
      growthValEl.style.color = "#f8fafc";
    }
  }

  // 4. 고용 세부 수치 연동
  const sectionEmp = document.getElementById("section-employment");
  if (sectionEmp) {
    if (totalEmp > 0) {
      sectionEmp.classList.remove("hidden");
      setTxt("emp-count", `${totalEmp.toLocaleString()} 명`);
      setTxt("emp-acqs", `+${newAcqs} 명`);
      setTxt("emp-loss", `-${losses} 명`);
    } else {
      sectionEmp.classList.add("hidden");
    }
  }

  // 5. 재무 목록 렌더링
  const sectionFin = document.getElementById("section-finance");
  const finList = document.getElementById("finance-trend-list");
  if (sectionFin && finList) {
    finList.innerHTML = "";
    if (data.history && data.history.length > 0) {
      sectionFin.classList.remove("hidden");
      const sortedHistory = [...data.history].sort((a, b) => b.year - a.year).slice(0, 3);
      
      sortedHistory.forEach(item => {
        const row = document.createElement("div");
        row.className = "finance-row";
        row.innerHTML = `
          <div class="fin-year">${item.year}년</div>
          <div class="fin-vals">
            <span>매출: <strong>${formatRevenue(item.revenue)}</strong></span>
            <span class="divider">|</span>
            <span>영업이익: <strong class="${item.operatingIncome < 0 ? 'text-danger' : 'text-success'}">${formatRevenue(item.operatingIncome)}</strong></span>
          </div>
        `;
        finList.appendChild(row);
      });
    } else {
      sectionFin.classList.add("hidden");
    }
  }

  // 6. 특허 바인딩
  const sectionPatents = document.getElementById("section-patents");
  const patentList = document.getElementById("patent-list");
  if (sectionPatents && patentList) {
    setTxt("patent-count", `${data.patents_count}건`);
    patentList.innerHTML = "";
    
    if (data.recent_patents && data.recent_patents.length > 0) {
      sectionPatents.classList.remove("hidden");
      data.recent_patents.forEach(p => {
        const item = document.createElement("a");
        item.className = "list-item-link";
        item.href = p.detailUrl || "#";
        item.target = "_blank";
        item.innerHTML = `
          <div class="item-link-title">💡 ${p.inventionTitle}</div>
          <div class="item-link-desc">출원일: ${p.applicationDate} | 상태: ${p.patentStatus}</div>
        `;
        patentList.appendChild(item);
      });
    } else {
      sectionPatents.classList.add("hidden");
    }
  }

  // 7. 입찰 바인딩
  const sectionBids = document.getElementById("section-bids");
  const bidList = document.getElementById("bid-list");
  if (sectionBids && bidList) {
    setTxt("bid-count", `${data.bids_count}건`);
    bidList.innerHTML = "";

    if (data.recent_bids && data.recent_bids.length > 0) {
      sectionBids.classList.remove("hidden");
      data.recent_bids.forEach(b => {
        const item = document.createElement("a");
        item.className = "list-item-link";
        item.href = b.detailUrl || "#";
        item.target = "_blank";

        const priceStr = b.presmptPrce >= 100000000 
          ? `${(b.presmptPrce / 100000000).toFixed(1)}억 원` 
          : `${b.presmptPrce.toLocaleString()}원`;

        item.innerHTML = `
          <div class="item-link-title">🏛️ ${b.bidNtceNm}</div>
          <div class="item-link-desc">추정가격: ${priceStr} | 계약방법: ${b.cntrctCnclMthdNm}</div>
        `;
        bidList.appendChild(item);
      });
    } else {
      sectionBids.classList.add("hidden");
    }
  }
}

const PROD_API_BASE = "https://www.maumdata.com";
const LOCAL_API_BASE = "http://localhost:3000";

// API 호출 헬퍼 (실서버 우선 호출 → 실패 시 로컬 개발서버 폴백)
async function fetchFromMaumData(path) {
  try {
    const res = await fetch(`${PROD_API_BASE}${path}`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    if (res.ok || res.status === 404 || res.status === 400) {
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (prodErr) {
    try {
      const localRes = await fetch(`${LOCAL_API_BASE}${path}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      const data = await localRes.json().catch(() => ({}));
      return { ok: localRes.ok, status: localRes.status, data };
    } catch (_) {
      throw prodErr;
    }
  }
}

// 컨텍스트 메뉴 등록
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "maumdata-quick-biz-search",
      title: "⚡ 마음데이타 레이어 팝업으로 기업 조회",
      contexts: ["selection"]
    });
  });
});

// 우클릭 컨텍스트 메뉴 클릭 시 현재 페이지에 레이어 팝업 모달 즉시 표시
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "maumdata-quick-biz-search") {
    const text = info.selectionText ? info.selectionText.trim() : "";
    if (!text) return;

    await chrome.storage.local.set({
      draggedText: text,
      lastUpdated: Date.now()
    });

    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: "OPEN_MAUMDATA_LAYER_MODAL",
        query: text
      }).catch(() => {
        // content script가 동작하지 않는 특수 페이지(chrome:// 등)에서는 새 탭으로 연결
        const cleanNum = text.replace(/[^0-9]/g, "");
        const destUrl = cleanNum.length === 10
          ? `${PROD_API_BASE}/biz/${cleanNum}`
          : `${PROD_API_BASE}/search?q=${encodeURIComponent(text)}`;
        chrome.tabs.create({ url: destUrl });
      });
    }
  }
});

// Content Script 및 Popup 메시지 핸들러
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_DRAGGED_QUERY") {
    const text = (message.text || "").trim();
    chrome.storage.local.set({
      draggedText: text,
      lastUpdated: Date.now()
    }).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "API_GET_BIZ_DETAIL") {
    const bNo = (message.bNo || "").replace(/[^0-9]/g, "");
    fetchFromMaumData(`/api/extension/biz/${bNo}`)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, status: 500, error: err.message }));
    return true;
  }

  if (message.type === "API_SEARCH_BIZ") {
    const q = (message.query || "").trim();
    fetchFromMaumData(`/api/extension/search?query=${encodeURIComponent(q)}`)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, status: 500, error: err.message }));
    return true;
  }
});

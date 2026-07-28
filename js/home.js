import { loadChecklistRegistry } from "./data.js";
import { withParams } from "./app.js";
import { clearAllChecklistSessions, clearSession } from "./storage.js";

const grid = document.querySelector("#checklistGrid");

init();

async function init() {
  try {
    // 首頁初始化時自動清空 localStorage 中先前儲存的所有「已帶／完成項目」暫存資料
    clearAllChecklistSessions();
    const checklists = await loadChecklistRegistry();
    renderChecklists(checklists);
  } catch {
    grid.innerHTML = `<p class="muted">Could not load checklists.</p>`;
  }
}

function renderChecklists(checklists) {
  grid.innerHTML = checklists
    .map(
      (checklist) => `
        <a class="checklist-card" data-id="${checklist.id}" href="${withParams("list.html", { id: checklist.id, mode: "list" })}">
          <div>
            <h2>${checklist.title}</h2>
            <p>${checklist.description || ""}</p>
          </div>
          <span class="card-footer">
            <span>開始清單模式 (List Mode)</span>
            <span aria-hidden="true">→</span>
          </span>
        </a>
      `
    )
    .join("");

  grid.querySelectorAll(".checklist-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const checklistId = card.dataset.id;
      startChecklistSession(checklistId);
    });
  });
}

/**
 * 從 index.html 點擊進入檢查表時，預設顯示 List 模式並清空舊有暫存
 * @param {string} checklistId - 清單 ID
 */
export function startChecklistSession(checklistId) {
  // 1. 清空舊的已帶項目暫存
  clearSession(checklistId);
  
  // 2. 設定預設模式為 list 模式並跳轉至 list.html
  localStorage.setItem("current_view", "list");
  window.location.href = withParams("list.html", { id: checklistId, mode: "list" });
}


import { getParam, renderProgress, showError, statusLabel, withParams } from "./app.js";
import { loadChecklist, loadChecklistRegistry } from "./data.js";
import {
  createSession,
  isComplete,
  loadOrCreateSession,
  statusForItem,
  toggleConfirmed
} from "./checklist-session.js";
import { clearSession } from "./storage.js";

const checklistId = getParam("id", "home");
const listTitle = document.querySelector("#listTitle");
const listStatus = document.querySelector("#listStatus");
const itemList = document.querySelector("#itemList");
const swipeLink = document.querySelector("#swipeLink");
const homeLink = document.querySelector("#homeLink");
const restartButton = document.querySelector("#restartButton");

let checklist;
let session;

init();

async function init() {
  try {
    const [loadedChecklist, registry] = await Promise.all([
      loadChecklist(checklistId),
      loadChecklistRegistry()
    ]);

    checklist = loadedChecklist;
    session = loadOrCreateSession(checklist);
    listTitle.textContent = checklist.title;
    document.title = checklist.title;
    homeLink.hidden = registry.length < 2;
    swipeLink.href = withParams("checklist.html", { id: checklist.id });

    restartButton.addEventListener("click", restart);
    itemList.addEventListener("change", handleItemChange);

    // 從滑動模式按返回時，頁面可能來自快取，需重新讀取進度
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        session = loadOrCreateSession(checklist);
        render();
      }
    });

    render();
  } catch {
    showError(itemList, "無法載入這份檢查表。");
  }
}

function restart() {
  const hasProgress = session.confirmed.length + session.skipped.length > 0;
  if (hasProgress && !window.confirm("要清除目前進度，重新開始嗎？")) {
    return;
  }

  clearSession(checklist.id);
  session = createSession(checklist);
  render();
}

function handleItemChange(event) {
  session = toggleConfirmed(checklist, session, event.target.dataset.id);
  render();
}

function render() {
  listStatus.innerHTML = `${renderProgress(checklist, session)}${renderDoneBanner()}`;
  itemList.innerHTML = checklist.items.map(renderItem).join("");
}

function renderDoneBanner() {
  if (!isComplete(checklist, session)) {
    return "";
  }

  const skippedText = session.skipped.length ? `，略過 ${session.skipped.length} 項` : "";

  return `
    <p class="done-banner">
      <strong>檢查完成</strong>
      <span>已帶 ${session.confirmed.length} 項${skippedText}，仍可繼續修改。</span>
    </p>
  `;
}

function renderItem(item) {
  const status = statusForItem(session, item.id);

  return `
    <label class="list-item ${status}">
      <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${status === "confirmed" ? "checked" : ""}>
      <span class="item-copy">
        <strong>${item.name}</strong>
        ${item.subtitle ? `<span>${item.subtitle}</span>` : ""}
      </span>
      <span class="item-badge">${statusLabel(status)}</span>
    </label>
  `;
}

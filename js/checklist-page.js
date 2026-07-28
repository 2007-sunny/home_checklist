import { getParam, showError } from "./app.js";
import { loadChecklist } from "./data.js";
import {
  createSession,
  isComplete,
  loadOrCreateSession,
  moveCurrentIndex,
  recordDecision,
  setCurrentIndex,
  statusForItem,
  toggleConfirmed
} from "./checklist-session.js";
import { clearSession, saveSession } from "./storage.js";
import { bindSwipeCard } from "./swipe-card.js";

const checklistId = getParam("id", "home");
const startItemId = getParam("start");
const shell = document.querySelector("#swipeShell");
const modeToggle = document.querySelector("#modeToggle");

let checklist;
let session;
let viewMode = getParam("mode", "checklist");

init();

async function init() {
  try {
    checklist = await loadChecklist(checklistId);
    session = loadOrCreateSession(checklist, startItemId);
    saveSession(checklist.id, session);
    bindModeToggle();
    render();
  } catch {
    showError(shell, "Could not load this checklist.");
  }
}

function bindModeToggle() {
  modeToggle.addEventListener("click", () => {
    viewMode = viewMode === "checklist" ? "list" : "checklist";
    render();
  });
}

function render() {
  if (isComplete(checklist, session)) {
    renderFinish();
    return;
  }

  const item = checklist.items[session.currentIndex];
  const processed = session.confirmed.length + session.skipped.length;
  const itemStatus = statusForItem(session, item.id);
  const isListMode = viewMode === "list";

  modeToggle.textContent = isListMode ? "Checklist View (單項卡片)" : "List View (總覽模式)";

  shell.innerHTML = `
    <div class="progress-row">
      <span>${checklist.title} (${session.currentIndex + 1} / ${checklist.items.length})</span>
      <span>完成 ${session.confirmed.length} / ${checklist.items.length} 項目</span>
    </div>

    <div class="flip-stage ${isListMode ? "is-flipped" : ""}">
      <div class="flip-card">
        ${renderChecklistFace(item, itemStatus, processed)}
        ${renderListFace(item, itemStatus)}
      </div>
    </div>

    ${isListMode ? renderListControls() : renderChecklistHints()}

    <section class="overview-section" aria-label="總覽清單">
      <h3 class="overview-title">總覽清單勾選欄 (${session.confirmed.length}/${checklist.items.length})</h3>
      <div class="overview-list">
        ${renderOverviewItems()}
      </div>
    </section>
  `;

  bindCurrentView(item);
  bindOverviewCheckboxes();
}

function renderChecklistFace(item, itemStatus, processed) {
  return `
    <article class="card-face card-front swipe-card" id="activeCard">
      <span class="swipe-label confirm" data-swipe-label="confirm">已帶 (Packed)</span>
      <span class="swipe-label skip" data-swipe-label="skip">略過 (Skip)</span>
      <label class="check-toggle">
        <input type="checkbox" id="packedToggle" ${itemStatus === "confirmed" ? "checked" : ""}>
        <span>已帶</span>
      </label>
      <div>
        <p class="card-count">${processed} / ${checklist.items.length} checked</p>
        <h1>${item.name}</h1>
        ${item.subtitle ? `<p class="item-subtitle">${item.subtitle}</p>` : ""}
      </div>
    </article>
  `;
}

function renderListFace(item, itemStatus) {
  return `
    <article class="card-face card-back list-card ${itemStatus}">
      <label class="check-toggle">
        <input type="checkbox" id="listPackedToggle" ${itemStatus === "confirmed" ? "checked" : ""}>
        <span>已帶</span>
      </label>
      <p class="eyebrow">List Mode</p>
      <h1>${item.name}</h1>
      ${item.subtitle ? `<p class="item-subtitle">${item.subtitle}</p>` : ""}
      <p class="list-status">${statusLabel(itemStatus)}</p>
    </article>
  `;
}

function renderChecklistHints() {
  return `
    <div class="hint-row" aria-hidden="true">
      <div class="action-hint">← 向左滑動略過</div>
      <div class="action-hint">向右滑動確認已帶 →</div>
    </div>
  `;
}

function renderListControls() {
  const isFirst = session.currentIndex === 0;
  const isLast = session.currentIndex === checklist.items.length - 1;
  return `
    <div class="list-card-controls">
      <button class="button" id="prevItemButton" type="button" ${isFirst ? "disabled" : ""}>上一項 (←)</button>
      <button class="button primary" id="nextItemButton" type="button" ${isLast ? "disabled" : ""}>下一項 (→)</button>
    </div>
  `;
}

function renderOverviewItems() {
  return checklist.items
    .map((item, index) => {
      const status = statusForItem(session, item.id);
      const isActive = index === session.currentIndex;
      const isChecked = status === "confirmed";

      return `
        <div class="overview-item ${status} ${isActive ? "active" : ""}">
          <label class="overview-check-container" title="勾選狀態">
            <input type="checkbox" class="overview-checkbox" data-id="${item.id}" ${isChecked ? "checked" : ""}>
          </label>
          <div class="overview-content" data-index="${index}">
            <strong>${item.name}</strong>
            ${item.subtitle ? `<small>${item.subtitle}</small>` : ""}
          </div>
          <span class="overview-badge ${status}" data-index="${index}">${statusLabel(status)}</span>
        </div>
      `;
    })
    .join("");
}

function bindCurrentView(item) {
  if (viewMode === "checklist") {
    bindSwipeCard(document.querySelector("#activeCard"), (decision) => {
      session = recordDecision(checklist, session, item.id, decision);
      render();
    });

    const packedToggle = document.querySelector("#packedToggle");
    if (packedToggle) {
      packedToggle.addEventListener("change", () => {
        session = toggleConfirmed(checklist, session, item.id);
        render();
      });
    }

    const checkToggle = document.querySelector(".card-front .check-toggle");
    if (checkToggle) {
      checkToggle.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
    }

    return;
  }

  // List 模式下的卡片背面勾選框與左右切換按鈕
  const listPackedToggle = document.querySelector("#listPackedToggle");
  if (listPackedToggle) {
    listPackedToggle.addEventListener("change", () => {
      session = toggleConfirmed(checklist, session, item.id);
      render();
    });
  }

  const prevBtn = document.querySelector("#prevItemButton");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (session.currentIndex > 0) {
        session = moveCurrentIndex(checklist, session, -1);
        render();
      }
    });
  }

  const nextBtn = document.querySelector("#nextItemButton");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (session.currentIndex < checklist.items.length - 1) {
        session = moveCurrentIndex(checklist, session, 1);
        render();
      }
    });
  }
}

function bindOverviewCheckboxes() {
  shell.querySelectorAll(".overview-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      e.stopPropagation();
      const itemId = checkbox.dataset.id;
      session = toggleConfirmed(checklist, session, itemId);
      render();
    });

    checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });

  shell.querySelectorAll(".overview-content, .overview-badge").forEach((el) => {
    el.addEventListener("click", () => {
      session = setCurrentIndex(checklist, session, Number(el.dataset.index));
      render();
    });
  });
}

function renderFinish() {
  const confirmed = itemsFromIds(session.confirmed);
  const skipped = itemsFromIds(session.skipped);
  modeToggle.textContent = "List View";

  shell.innerHTML = `
    <section class="finish-page">
      <header>
        <p class="eyebrow">檢查完成 (Complete)</p>
        <h1>${checklist.title}</h1>
      </header>
      ${renderSummary("已帶項目 (Confirmed)", confirmed)}
      ${renderSummary("略過項目 (Skipped)", skipped)}
      <div class="finish-actions">
        <button class="button primary full" id="restartButton" type="button">重新檢查 (Restart)</button>
        <a class="button full" href="index.html">返回首頁 (Home)</a>
      </div>
    </section>
  `;

  document.querySelector("#restartButton").addEventListener("click", () => {
    clearSession(checklist.id);
    session = createSession(checklist);
    viewMode = "list";
    session = setCurrentIndex(checklist, session, 0);
    render();
  });
}

function renderSummary(title, items) {
  const content = items.length
    ? items.map((item) => `<li>✓ ${item.name}</li>`).join("")
    : `<li class="muted">無</li>`;

  return `
    <section class="summary-group">
      <h2>${title}</h2>
      <ul class="summary-list">${content}</ul>
    </section>
  `;
}

function itemsFromIds(ids) {
  return ids
    .map((id) => checklist.items.find((item) => item.id === id))
    .filter(Boolean);
}

function statusLabel(status) {
  if (status === "confirmed") {
    return "✓ 已帶";
  }

  if (status === "skipped") {
    return "略過 / 未帶";
  }

  return "尚未檢查";
}


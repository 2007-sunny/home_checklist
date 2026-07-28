import { getParam, showError, withParams } from "./app.js";
import { loadChecklist } from "./data.js";
import {
  loadOrCreateSession,
  moveCurrentIndex,
  setCurrentIndex,
  statusForItem,
  toggleConfirmed
} from "./checklist-session.js";

const checklistId = getParam("id", "home");
const startItemId = getParam("start");
const listTitle = document.querySelector("#listTitle");
const listCardPanel = document.querySelector("#listCardPanel");
const itemList = document.querySelector("#itemList");
const swipeLink = document.querySelector("#swipeLink");

let checklist;
let session;

init();

async function init() {
  try {
    checklist = await loadChecklist(checklistId);
    session = loadOrCreateSession(checklist, startItemId);
    listTitle.textContent = checklist.title;
    render();
  } catch {
    showError(itemList, "Could not load this checklist.");
  }
}

function render() {
  renderCard();
  renderItems();
  if (checklist && session) {
    swipeLink.href = withParams("checklist.html", {
      id: checklist.id,
      start: checklist.items[session.currentIndex]?.id,
      mode: "checklist"
    });
  }
}

function renderCard() {
  const item = checklist.items[session.currentIndex];
  const status = statusForItem(session, item.id);
  const isFirst = session.currentIndex === 0;
  const isLast = session.currentIndex === checklist.items.length - 1;

  listCardPanel.innerHTML = `
    <article class="review-card ${status}">
      <div>
        <p class="eyebrow">List Mode (${session.currentIndex + 1} / ${checklist.items.length})</p>
        <h2>${item.name}</h2>
        ${item.subtitle ? `<p>${item.subtitle}</p>` : ""}
        <span class="review-status">${statusLabel(status)}</span>
      </div>
      <div class="list-card-controls">
        <button class="button" id="prevItemButton" type="button" ${isFirst ? "disabled" : ""}>上一項 (←)</button>
        <a class="button primary" href="${withParams("checklist.html", {
          id: checklist.id,
          start: item.id,
          mode: "checklist"
        })}">Checklist 模式</a>
        <button class="button" id="nextItemButton" type="button" ${isLast ? "disabled" : ""}>下一項 (→)</button>
      </div>
    </article>
  `;

  // 左右控制按鈕：切換當前瀏覽項目
  document.querySelector("#prevItemButton").addEventListener("click", () => {
    if (!isFirst) {
      session = moveCurrentIndex(checklist, session, -1);
      render();
    }
  });

  document.querySelector("#nextItemButton").addEventListener("click", () => {
    if (!isLast) {
      session = moveCurrentIndex(checklist, session, 1);
      render();
    }
  });
}

function renderItems() {
  itemList.innerHTML = checklist.items
    .map((item, index) => {
      const status = statusForItem(session, item.id);
      const isActive = index === session.currentIndex;
      const isChecked = status === "confirmed";

      return `
        <div class="list-item ${status} ${isActive ? "active" : ""}" data-index="${index}">
          <label class="item-check-container" title="勾選狀態">
            <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${isChecked ? "checked" : ""}>
            <span class="checkbox-custom"></span>
          </label>
          <div class="item-content" data-index="${index}">
            <span class="item-copy">
              <strong>${item.name}</strong>
              ${item.subtitle ? `<span>${item.subtitle}</span>` : ""}
            </span>
          </div>
          <span class="jump-label" data-index="${index}">${isActive ? "當前" : "查看"}</span>
        </div>
      `;
    })
    .join("");

  // 點擊項目內容切換卡片
  itemList.querySelectorAll(".item-content, .jump-label").forEach((el) => {
    el.addEventListener("click", () => {
      session = setCurrentIndex(checklist, session, Number(el.dataset.index));
      render();
    });
  });

  // 點擊 Checkbox 即時勾選 / 取消勾選並更新 localStorage 狀態
  itemList.querySelectorAll(".item-checkbox").forEach((checkbox) => {
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


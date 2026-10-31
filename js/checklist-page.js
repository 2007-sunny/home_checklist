import { getParam, renderProgress, showError, statusLabel, withParams } from "./app.js";
import { loadChecklist } from "./data.js";
import {
  focusNextPending,
  isComplete,
  loadOrCreateSession,
  moveCurrentIndex,
  recordDecision,
  statusForItem
} from "./checklist-session.js";
import { bindSwipeCard } from "./swipe-card.js";

const checklistId = getParam("id", "home");
const shell = document.querySelector("#swipeShell");
const listLink = document.querySelector("#listLink");

let checklist;
let session;

init();

async function init() {
  try {
    checklist = await loadChecklist(checklistId);
    session = focusNextPending(checklist, loadOrCreateSession(checklist));
    listLink.href = listUrl();
    render();
  } catch {
    showError(shell, "無法載入這份檢查表。");
  }
}

function listUrl() {
  return withParams("list.html", { id: checklist.id });
}

function render() {
  const item = checklist.items[session.currentIndex];
  const label = statusLabel(statusForItem(session, item.id));

  shell.innerHTML = `
    ${renderProgress(checklist, session)}

    <div class="card-stage">
      <article class="swipe-card" id="activeCard">
        <span class="swipe-label confirm" data-swipe-label="confirm">已帶</span>
        <span class="swipe-label skip" data-swipe-label="skip">略過</span>
        <div>
          <h1>${item.name}</h1>
          ${item.subtitle ? `<p class="item-subtitle">${item.subtitle}</p>` : ""}
          ${label ? `<p class="card-status">目前標記：${label}</p>` : ""}
        </div>
      </article>
    </div>

    <div class="decision-row">
      <button class="button" id="skipButton" type="button">← 略過</button>
      <button class="button primary" id="confirmButton" type="button">已帶 →</button>
    </div>

    <button class="text-button" id="previousButton" type="button" ${session.currentIndex === 0 ? "disabled" : ""}>
      回上一項
    </button>
  `;

  const card = bindSwipeCard(document.querySelector("#activeCard"), (decision) => {
    session = recordDecision(checklist, session, item.id, decision);

    if (isComplete(checklist, session)) {
      window.location.replace(listUrl());
      return;
    }

    render();
  });

  document.querySelector("#skipButton").addEventListener("click", () => card.dismiss("skipped"));
  document.querySelector("#confirmButton").addEventListener("click", () => card.dismiss("confirmed"));
  document.querySelector("#previousButton").addEventListener("click", () => {
    session = moveCurrentIndex(checklist, session, -1);
    render();
  });
}

import { getParam, showError, withParams } from "./app.js";
import { loadChecklist } from "./data.js";
import {
  createSession,
  isComplete,
  loadOrCreateSession,
  recordDecision
} from "./checklist-session.js";
import { clearSession, saveSession } from "./storage.js";
import { bindSwipeCard } from "./swipe-card.js";

const checklistId = getParam("id", "home");
const startItemId = getParam("start");
const shell = document.querySelector("#swipeShell");
const listLink = document.querySelector("#listLink");

let checklist;
let session;

init();

async function init() {
  try {
    checklist = await loadChecklist(checklistId);
    listLink.href = withParams("list.html", { id: checklist.id });
    session = loadOrCreateSession(checklist, startItemId);
    saveSession(checklist.id, session);
    render();
  } catch {
    showError(shell, "Could not load this checklist.");
  }
}

function render() {
  if (isComplete(checklist, session)) {
    renderFinish();
    return;
  }

  const item = checklist.items[session.currentIndex];
  const processed = session.confirmed.length + session.skipped.length;

  shell.innerHTML = `
    <div class="progress-row">
      <span>${checklist.title}</span>
      <span>${processed + 1} / ${checklist.items.length}</span>
    </div>
    <div class="card-stage">
      <article class="swipe-card" id="activeCard">
        <span class="swipe-label confirm" data-swipe-label="confirm">Packed</span>
        <span class="swipe-label skip" data-swipe-label="skip">Skip</span>
        <div>
          <h1>${item.name}</h1>
          ${item.subtitle ? `<p class="item-subtitle">${item.subtitle}</p>` : ""}
        </div>
      </article>
    </div>
    <div class="hint-row" aria-hidden="true">
      <div class="action-hint">Swipe left to skip</div>
      <div class="action-hint">Swipe right to confirm</div>
    </div>
  `;

  bindSwipeCard(document.querySelector("#activeCard"), (decision) => {
    session = recordDecision(checklist, session, item.id, decision);
    render();
  });
}

function renderFinish() {
  const confirmed = itemsFromIds(session.confirmed);
  const skipped = itemsFromIds(session.skipped);

  shell.innerHTML = `
    <section class="finish-page">
      <header>
        <p class="eyebrow">Complete</p>
        <h1>${checklist.title}</h1>
      </header>
      ${renderSummary("Confirmed Items", confirmed)}
      ${renderSummary("Skipped Items", skipped)}
      <div class="finish-actions">
        <button class="button primary full" id="restartButton" type="button">Restart</button>
        <a class="button full" href="index.html">Return Home</a>
      </div>
    </section>
  `;

  document.querySelector("#restartButton").addEventListener("click", () => {
    clearSession(checklist.id);
    session = createSession(checklist);
    saveSession(checklist.id, session);
    render();
  });
}

function renderSummary(title, items) {
  const content = items.length
    ? items.map((item) => `<li>${item.name}</li>`).join("")
    : `<li class="muted">None</li>`;

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

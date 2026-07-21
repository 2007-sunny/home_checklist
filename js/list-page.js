import { getParam, showError, withParams } from "./app.js";
import { loadChecklist } from "./data.js";
import { loadOrCreateSession, statusForItem } from "./checklist-session.js";

const checklistId = getParam("id", "home");
const listTitle = document.querySelector("#listTitle");
const itemList = document.querySelector("#itemList");
const swipeLink = document.querySelector("#swipeLink");

init();

async function init() {
  try {
    const checklist = await loadChecklist(checklistId);
    const session = loadOrCreateSession(checklist);
    listTitle.textContent = checklist.title;
    swipeLink.href = withParams("checklist.html", { id: checklist.id });
    renderItems(checklist, session);
  } catch {
    showError(itemList, "Could not load this checklist.");
  }
}

function renderItems(checklist, session) {
  itemList.innerHTML = checklist.items
    .map((item) => {
      const status = statusForItem(session, item.id);
      const href = withParams("checklist.html", { id: checklist.id, start: item.id });

      return `
        <a class="list-item ${status}" href="${href}">
          <span class="status-dot" aria-label="${status}"></span>
          <span class="item-copy">
            <strong>${item.name}</strong>
            ${item.subtitle ? `<span>${item.subtitle}</span>` : ""}
          </span>
          <span class="jump-label">Open</span>
        </a>
      `;
    })
    .join("");
}

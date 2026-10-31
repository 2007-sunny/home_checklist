import { loadChecklistRegistry } from "./data.js";
import { withParams } from "./app.js";

const grid = document.querySelector("#checklistGrid");

init();

async function init() {
  try {
    const checklists = await loadChecklistRegistry();

    // 只有一份清單時直接進入，省去多點一次
    if (checklists.length === 1) {
      window.location.replace(withParams("list.html", { id: checklists[0].id }));
      return;
    }

    renderChecklists(checklists);
  } catch {
    grid.innerHTML = `<p class="muted">無法載入檢查表。</p>`;
  }
}

function renderChecklists(checklists) {
  grid.innerHTML = checklists
    .map(
      (checklist) => `
        <a class="checklist-card" href="${withParams("list.html", { id: checklist.id })}">
          <div>
            <h2>${checklist.title}</h2>
            <p>${checklist.description || ""}</p>
          </div>
          <span class="card-footer">
            <span>開始檢查</span>
            <span aria-hidden="true">→</span>
          </span>
        </a>
      `
    )
    .join("");
}

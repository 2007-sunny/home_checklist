import { loadChecklistRegistry } from "./data.js";
import { withParams } from "./app.js";

const grid = document.querySelector("#checklistGrid");

init();

async function init() {
  try {
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
        <a class="checklist-card" href="${withParams("checklist.html", { id: checklist.id })}">
          <div>
            <h2>${checklist.title}</h2>
            <p>${checklist.description || ""}</p>
          </div>
          <span class="card-footer">
            <span>Start</span>
            <span aria-hidden="true">></span>
          </span>
        </a>
      `
    )
    .join("");
}

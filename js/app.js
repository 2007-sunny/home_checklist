export function getParam(name, fallback = "") {
  return new URLSearchParams(window.location.search).get(name) || fallback;
}

export function withParams(path, params) {
  const url = new URL(path, window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return `${url.pathname.split("/").pop()}${url.search}`;
}

export function showError(container, message) {
  container.innerHTML = `
    <section class="error-state">
      <p>${message}</p>
      <a class="button full" href="index.html">返回首頁</a>
    </section>
  `;
}

export function itemById(checklist, itemId) {
  return checklist.items.find((item) => item.id === itemId);
}

export function renderProgress(checklist, session) {
  const total = checklist.items.length;
  const confirmed = session.confirmed.length;
  const percent = total ? Math.round((confirmed / total) * 100) : 0;

  return `
    <div class="progress">
      <p class="progress-label">已帶 ${confirmed} / ${total}</p>
      <div class="progress-track" aria-hidden="true">
        <div class="progress-fill" style="width: ${percent}%"></div>
      </div>
    </div>
  `;
}

export function statusLabel(status) {
  if (status === "confirmed") {
    return "已帶";
  }

  if (status === "skipped") {
    return "略過";
  }

  return "";
}

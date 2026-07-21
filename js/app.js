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
      <a class="button full" href="index.html">Return Home</a>
    </section>
  `;
}

export function itemById(checklist, itemId) {
  return checklist.items.find((item) => item.id === itemId);
}

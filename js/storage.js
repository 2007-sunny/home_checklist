const keyPrefix = "preflight.session.";

export function getSession(checklistId) {
  const raw = localStorage.getItem(`${keyPrefix}${checklistId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(checklistId, session) {
  localStorage.setItem(
    `${keyPrefix}${checklistId}`,
    JSON.stringify({ ...session, updatedAt: new Date().toISOString() })
  );
}

export function clearSession(checklistId) {
  localStorage.removeItem(`${keyPrefix}${checklistId}`);
}

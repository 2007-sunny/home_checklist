const keyPrefix = "home_checklist_session.";

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
  localStorage.removeItem(`preflight.session.${checklistId}`);
  localStorage.removeItem(`session_${checklistId}`);
}

export function clearAllChecklistSessions() {
  Object.keys(localStorage)
    .filter((key) => 
      key.startsWith(keyPrefix) || 
      key.startsWith("preflight.session.") || 
      key.startsWith("session_") ||
      key.startsWith("app_session_")
    )
    .forEach((key) => localStorage.removeItem(key));

  sessionStorage.clear();
}


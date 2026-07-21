import { getSession, saveSession } from "./storage.js";

export function createSession(checklist, startItemId = "") {
  const startIndex = Math.max(
    0,
    checklist.items.findIndex((item) => item.id === startItemId)
  );

  return {
    checklistId: checklist.id,
    currentIndex: startIndex,
    confirmed: [],
    skipped: [],
    updatedAt: new Date().toISOString()
  };
}

export function loadOrCreateSession(checklist, startItemId = "") {
  const stored = getSession(checklist.id);
  const session = stored ? normalizeSession(checklist, stored) : createSession(checklist);

  if (startItemId) {
    const startIndex = checklist.items.findIndex((item) => item.id === startItemId);
    if (startIndex >= 0) {
      const jumpedSession = { ...session, currentIndex: startIndex };
      saveSession(checklist.id, jumpedSession);
      return jumpedSession;
    }
  }

  return session;
}

export function recordDecision(checklist, session, itemId, decision) {
  const nextSession = {
    ...session,
    confirmed: session.confirmed.filter((id) => id !== itemId),
    skipped: session.skipped.filter((id) => id !== itemId)
  };

  if (decision === "confirmed") {
    nextSession.confirmed.push(itemId);
  } else {
    nextSession.skipped.push(itemId);
  }

  nextSession.currentIndex = findNextIndex(checklist, nextSession);
  saveSession(checklist.id, nextSession);
  return nextSession;
}

export function isComplete(checklist, session) {
  return session.confirmed.length + session.skipped.length >= checklist.items.length;
}

export function statusForItem(session, itemId) {
  if (session.confirmed.includes(itemId)) {
    return "confirmed";
  }

  if (session.skipped.includes(itemId)) {
    return "skipped";
  }

  return "pending";
}

function normalizeSession(checklist, session) {
  const validIds = new Set(checklist.items.map((item) => item.id));
  const confirmed = [...new Set(session.confirmed || [])].filter((id) => validIds.has(id));
  const skipped = [...new Set(session.skipped || [])].filter(
    (id) => validIds.has(id) && !confirmed.includes(id)
  );

  return {
    checklistId: checklist.id,
    currentIndex: Number.isInteger(session.currentIndex)
      ? Math.min(session.currentIndex, checklist.items.length)
      : 0,
    confirmed,
    skipped,
    updatedAt: session.updatedAt || new Date().toISOString()
  };
}

function findNextIndex(checklist, session) {
  const processed = new Set([...session.confirmed, ...session.skipped]);
  const nextIndex = checklist.items.findIndex((item) => !processed.has(item.id));
  return nextIndex === -1 ? checklist.items.length : nextIndex;
}

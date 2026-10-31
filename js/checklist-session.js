import { getSession, saveSession } from "./storage.js";

export function createSession(checklist) {
  return {
    checklistId: checklist.id,
    currentIndex: 0,
    confirmed: [],
    skipped: [],
    updatedAt: new Date().toISOString()
  };
}

export function loadOrCreateSession(checklist) {
  const stored = getSession(checklist.id);
  return stored ? normalizeSession(checklist, stored) : createSession(checklist);
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

export function toggleConfirmed(checklist, session, itemId) {
  const isConfirmed = session.confirmed.includes(itemId);
  const nextSession = {
    ...session,
    confirmed: isConfirmed
      ? session.confirmed.filter((id) => id !== itemId)
      : [...session.confirmed.filter((id) => id !== itemId), itemId],
    skipped: session.skipped.filter((id) => id !== itemId)
  };

  saveSession(checklist.id, nextSession);
  return nextSession;
}

export function setCurrentIndex(checklist, session, index) {
  const currentIndex = clampIndex(checklist, index);
  const nextSession = { ...session, currentIndex };
  saveSession(checklist.id, nextSession);
  return nextSession;
}

export function moveCurrentIndex(checklist, session, direction) {
  return setCurrentIndex(checklist, session, session.currentIndex + direction);
}

export function focusNextPending(checklist, session) {
  return setCurrentIndex(checklist, session, findNextIndex(checklist, session));
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
      ? clampIndex(checklist, session.currentIndex)
      : 0,
    confirmed,
    skipped,
    updatedAt: session.updatedAt || new Date().toISOString()
  };
}

function findNextIndex(checklist, session) {
  const processed = new Set([...session.confirmed, ...session.skipped]);
  const nextIndex = checklist.items.findIndex((item) => !processed.has(item.id));
  return nextIndex === -1 ? session.currentIndex : nextIndex;
}

function clampIndex(checklist, index) {
  return Math.max(0, Math.min(index, checklist.items.length - 1));
}

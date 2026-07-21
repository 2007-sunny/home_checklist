const registryPath = "data/checklists.json";

export async function loadChecklistRegistry() {
  const response = await fetch(registryPath);
  if (!response.ok) {
    throw new Error("Unable to load checklist registry.");
  }
  return response.json();
}

export async function loadChecklist(id) {
  const registry = await loadChecklistRegistry();
  const entry = registry.find((checklist) => checklist.id === id);

  if (!entry) {
    throw new Error(`Unknown checklist: ${id}`);
  }

  const response = await fetch(`data/${entry.file}`);
  if (!response.ok) {
    throw new Error(`Unable to load checklist: ${id}`);
  }

  return response.json();
}

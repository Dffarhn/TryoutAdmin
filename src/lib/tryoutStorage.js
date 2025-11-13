// Simple localStorage-based storage for Tryouts (no backend)
// Data shape stored:
// {
//   id: string,
//   title: string,
//   description: string,
//   durationMinutes: number,
//   isActive: boolean,
//   category: string,
//   package: string,
//   createdAt: string,
//   updatedAt: string
// }

const STORAGE_KEY = "__tryout_admin__tryouts";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

export function getTryouts() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const arr = safeParse(raw);
  if (!Array.isArray(arr)) return [];
  return arr;
}

export function saveTryouts(tryouts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tryouts));
}

function generateId() {
  // Simple unique ID using timestamp + random
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  ).toUpperCase();
}

export function addTryout(partial) {
  const now = new Date().toISOString();
  const newItem = {
    id: generateId(),
    title: "",
    description: "",
    durationMinutes: 0,
    isActive: true,
    category: "",
    package: "",
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
  const list = getTryouts();
  list.push(newItem);
  saveTryouts(list);
  return newItem;
}

export function updateTryout(id, changes) {
  const list = getTryouts();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated = {
    ...list[idx],
    ...changes,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = updated;
  saveTryouts(list);
  return updated;
}

export function findTryout(id) {
  const list = getTryouts();
  return list.find((t) => t.id === id) || null;
}

export function removeTryout(id) {
  const list = getTryouts();
  const filtered = list.filter((t) => t.id !== id);
  saveTryouts(filtered);
  return list.length !== filtered.length;
}



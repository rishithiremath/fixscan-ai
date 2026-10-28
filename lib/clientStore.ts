import type { FixTask } from "./types";
import { SEED_TASKS } from "./seed";

const KEY = "fixscan-tasks-v1";
const COUNTER_KEY = "fixscan-counter-v1";

// Upgrade previously saved demo boards so old SVG placeholders are replaced
// without asking a returning visitor to reset their local demo data.
const LEGACY_SAMPLE_IMAGES: Record<string, string> = {
  "/samples/damp.svg": "/samples/damp-photo.jpg",
  "/samples/leak.svg": "/samples/leak-photo.jpg",
  "/samples/crack.svg": "/samples/crack-photo.jpg",
  "/samples/electrical.svg": "/samples/electrical-photo.jpg",
  "/samples/peeling.svg": "/samples/peeling-photo.jpg",
};

function upgradeSamplePhotos(tasks: FixTask[]): FixTask[] {
  return tasks.map((task) => ({
    ...task,
    image_url: LEGACY_SAMPLE_IMAGES[task.image_url ?? ""] ?? task.image_url,
    after_image_url: task.after_image_url
      ? LEGACY_SAMPLE_IMAGES[task.after_image_url] ?? task.after_image_url
      : null,
  }));
}

function clone(tasks: FixTask[]): FixTask[] {
  return tasks.map((t) => ({ ...t, notes: [...t.notes], action_steps: [...t.action_steps] }));
}

export function loadTasks(): FixTask[] {
  if (typeof window === "undefined") return clone(SEED_TASKS);
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED_TASKS));
      window.localStorage.setItem(COUNTER_KEY, "1008");
      return clone(SEED_TASKS);
    }
    const parsed = JSON.parse(raw) as FixTask[];
    if (!Array.isArray(parsed) || parsed.length === 0) return clone(SEED_TASKS);
    const upgraded = upgradeSamplePhotos(parsed);
    window.localStorage.setItem(KEY, JSON.stringify(upgraded));
    return upgraded;
  } catch {
    return clone(SEED_TASKS);
  }
}

export function saveTasks(tasks: FixTask[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(tasks));
}

export function nextDisplayId(tasks: FixTask[]): string {
  if (typeof window === "undefined") return "FS-1008";
  const stored = Number(window.localStorage.getItem(COUNTER_KEY) || "1008");
  const maxSeed = Math.max(1007, ...tasks.map((t) => Number(t.display_id.replace("FS-", "")) || 1007));
  const next = Math.max(stored, maxSeed + 1);
  window.localStorage.setItem(COUNTER_KEY, String(next + 1));
  return `FS-${next}`;
}

export function resetDemo(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(SEED_TASKS));
  window.localStorage.setItem(COUNTER_KEY, "1008");
}

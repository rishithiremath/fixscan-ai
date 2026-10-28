import type { FixTask } from "./types";
import { SEED_TASKS } from "./seed";

// Server-side in-memory store, used only when Supabase is not configured.
// In a serverless deployment this resets between cold starts, which is why
// the browser pages also persist tasks to localStorage for Demo Mode.
let tasks: FixTask[] = [...SEED_TASKS.map((t) => ({ ...t, notes: [...t.notes], action_steps: [...t.action_steps] }))];
let counter = 1008;

export function listTasks(): FixTask[] {
  return tasks;
}

export function getTask(id: string): FixTask | undefined {
  return tasks.find((t) => t.id === id || t.display_id === id);
}

export function createTask(task: Omit<FixTask, "id" | "display_id" | "created_at" | "updated_at">): FixTask {
  const now = new Date().toISOString();
  const created: FixTask = {
    ...task,
    id: `task-${Date.now()}`,
    display_id: `FS-${counter++}`,
    created_at: now,
    updated_at: now,
  };
  tasks = [created, ...tasks];
  return created;
}

export function updateTask(id: string, patch: Partial<FixTask>): FixTask | null {
  const idx = tasks.findIndex((t) => t.id === id || t.display_id === id);
  if (idx < 0) return null;
  tasks[idx] = { ...tasks[idx], ...patch, updated_at: new Date().toISOString() };
  return tasks[idx];
}

export function nextDisplayId(): string {
  return `FS-${counter}`;
}

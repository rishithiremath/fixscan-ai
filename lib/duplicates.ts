import type { FixTask } from "./types";

export function normaliseLocation(value: string): string {
  const synonyms: Record<string, string> = {
    washroom: "bathroom",
    toilet: "bathroom",
    restroom: "bathroom",
  };
  let out = value.toLowerCase().trim().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ");
  for (const [from, to] of Object.entries(synonyms)) {
    out = out.replace(new RegExp(`\\b${from}\\b`, "g"), to);
  }
  return out;
}

function keyTerms(text: string): string[] {
  const stop = new Set(["the", "and", "near", "is", "a", "an", "in", "of", "to", "for", "with", "has", "have"]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
}

export interface DuplicateResult {
  task: FixTask | null;
  score: number;
  verdict: "duplicate" | "possible" | "new";
}

/**
 * MVP scoring: location 0.5 + category 0.3 + shared key terms 0.2.
 * >= 0.80 likely duplicate, 0.60-0.80 show side-by-side, < 0.60 new task.
 * Only open / in_progress tasks are candidates.
 */
export function findDuplicate(
  candidate: { location: string; category: string; title: string; description: string },
  tasks: FixTask[],
): DuplicateResult {
  const candLoc = normaliseLocation(candidate.location);
  const candTerms = new Set(keyTerms(`${candidate.title} ${candidate.description}`));
  let best: FixTask | null = null;
  let bestScore = 0;

  for (const task of tasks) {
    if (task.status === "resolved") continue;
    let score = 0;
    if (candLoc && normaliseLocation(task.location) === candLoc) score += 0.5;
    else if (candLoc && normaliseLocation(task.location).includes(candLoc)) score += 0.25;
    if (task.category === candidate.category) score += 0.3;
    const taskTerms = keyTerms(`${task.title} ${task.description}`);
    const shared = taskTerms.filter((t) => candTerms.has(t)).length;
    if (shared > 0) score += 0.2;
    if (score > bestScore) {
      bestScore = score;
      best = task;
    }
  }

  if (best && bestScore >= 0.8) return { task: best, score: bestScore, verdict: "duplicate" };
  if (best && bestScore >= 0.6) return { task: best, score: bestScore, verdict: "possible" };
  return { task: null, score: bestScore, verdict: "new" };
}

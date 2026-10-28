import type { Category, Priority, ProblemType, Severity } from "./types";

export const SLA_HOURS: Record<Priority, number> = {
  high: 24,
  medium: 72,
  low: 24 * 7,
};

/** HARD RULES decide priority. A model suggestion is only a suggestion. */
export function decidePriority(input: {
  problem_type: ProblemType;
  category: Category;
  text?: string;
  suggested?: Priority;
  severity?: Severity;
}): Priority {
  const text = (input.text || "").toLowerCase();
  const highSignals = [
    "active_leak",
    "electrical_fault",
    "sewage",
    "no water",
    "no-water",
    "no power",
    "no-power",
    "exposed wiring",
    "exposed wire",
    "sparking",
    "burst",
    "flooding",
    "heavy mould",
  ];
  if (
    input.problem_type === "active_leak" ||
    input.problem_type === "electrical_fault" ||
    input.problem_type === "mould" ||
    highSignals.some((s) => text.includes(s))
  ) {
    return "high";
  }
  if (input.problem_type === "crack") {
    if (
      text.includes("wide") ||
      text.includes("structural") ||
      text.includes("deep crack") ||
      text.includes("big crack")
    ) {
      return "high";
    }
    return "medium";
  }
  if (
    input.problem_type === "dampness" ||
    input.problem_type === "water_stain" ||
    input.problem_type === "peeling_paint"
  ) {
    if (text.includes("dripping") || text.includes("leaking") || text.includes("active")) {
      return "high";
    }
    return "medium";
  }
  if (input.severity === "high") return "high";
  if (input.suggested) return input.suggested;
  if (input.severity === "medium") return "medium";
  return "low";
}

export function slaDueFrom(priority: Priority, from = new Date()): string {
  const due = new Date(from.getTime() + SLA_HOURS[priority] * 60 * 60 * 1000);
  return due.toISOString();
}

export function slaPlainWords(slaDue: string, now = new Date()): string {
  const due = new Date(slaDue);
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return "Overdue";
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  const dateLabel = due.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = due.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (hours <= 48) return `Due by ${dateLabel}, ${timeLabel}`;
  return `Due by ${dateLabel}, ${timeLabel} (${Math.round(hours / 24)} days)`;
}

export function assigneeFor(category: Category, problemType: ProblemType): string {
  if (category === "electrical" || problemType === "electrical_fault") return "Electrician";
  if (category === "plumbing" || problemType === "active_leak") return "Plumbing team";
  if (category === "structural" || problemType === "crack") return "Civil contractor";
  if (category === "paint" || problemType === "peeling_paint") return "Painter";
  if (category === "seepage" || problemType === "dampness" || problemType === "water_stain") return "Plumbing team";
  if (category === "carpentry") return "Carpenter";
  if (category === "appliance") return "Appliance technician";
  return "General maintenance";
}

export function escalatePriority(p: Priority): Priority {
  if (p === "low") return "medium";
  if (p === "medium") return "high";
  return "high";
}

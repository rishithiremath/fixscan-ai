import type { AnalyseResult, Diagnosis } from "./types";
import { assigneeFor, decidePriority, slaDueFrom } from "./priority";
import { costBandFor } from "./costs";

function base(d: Diagnosis, title: string, category: AnalyseResult["category"], location: string, text: string): AnalyseResult {
  const priority = decidePriority({ problem_type: d.problem_type, category, text, severity: d.severity });
  const band = costBandFor(d.problem_type);
  return {
    diagnosis: d,
    extraction: null,
    title,
    category,
    location,
    priority,
    sla_hours: priority === "high" ? 24 : priority === "medium" ? 72 : 168,
    sla_due: slaDueFrom(priority),
    estimated_cost_min: band.min,
    estimated_cost_max: band.max,
    cost_label: band.label,
    assignee_suggestion: assigneeFor(category, d.problem_type),
    needs_review: d.confidence === "low" || d.problem_type === "none_detected",
    source: "demo",
  };
}

/**
 * Cached demo diagnoses. Used when no Gemini key is set, or when a Gemini
 * call fails. Never claims to be a live AI result: source is "demo" and
 * needs_review is true for unclear inputs.
 */
export function demoAnalyse(input: { text: string; sampleId?: string; locationHint?: string }): AnalyseResult {
  const text = input.text.toLowerCase();
  const location = input.locationHint || "not specified";
  if (input.sampleId === "damp" || text.includes("damp") || text.includes("seepage") || text.includes("mould") || text.includes("mold")) {
    return base(
      {
        problem_type: "dampness",
        ai_diagnosis: "A damp patch is visible, consistent with seepage. Check the source before repainting.",
        probable_cause: "Overhead pipe leak or roof seepage",
        severity: "medium",
        severity_reason: "Damp patch without active dripping in this sample.",
        professional_needed: true,
        action_steps: ["Keep the area dry.", "Do not paint over the damp patch.", "Plumbing team to find and fix the source."],
        confidence: "medium",
      },
      "Damp patch and seepage",
      "seepage",
      location,
      text,
    );
  }
  if (input.sampleId === "leak" || text.includes("leak") || text.includes("dripping") || text.includes("tap")) {
    return base(
      {
        problem_type: "active_leak",
        ai_diagnosis: "An active water leak is reported. Shut off the supply if you can do so safely.",
        probable_cause: "Worn washer, loose fitting, or pipe leak",
        severity: "high",
        severity_reason: "Active water loss can cause damage quickly.",
        professional_needed: true,
        action_steps: ["Shut off the supply if safe.", "Catch drips in a container.", "Plumber to repair the fitting or pipe."],
        confidence: "medium",
      },
      "Active water leak",
      "plumbing",
      location,
      text,
    );
  }
  if (input.sampleId === "crack" || text.includes("crack")) {
    return base(
      {
        problem_type: "crack",
        ai_diagnosis: "A wall crack is visible. A hairline crack is filled and monitored; a wide crack needs professional inspection first.",
        probable_cause: "Minor settlement or plaster shrinkage",
        severity: "medium",
        severity_reason: "Crack size is not confirmed as structural from this sample.",
        professional_needed: true,
        action_steps: ["Photograph the crack for comparison.", "Do not fill a wide crack without inspection.", "Contractor to inspect, fill and repaint."],
        confidence: "medium",
      },
      "Wall crack",
      "structural",
      location,
      text,
    );
  }
  if (text.includes("electric") || text.includes("wiring") || text.includes("switchboard") || text.includes("spark")) {
    return base(
      {
        problem_type: "electrical_fault",
        ai_diagnosis: "An electrical fault is reported. Do not touch exposed wiring.",
        probable_cause: "Damaged fitting or loose cover",
        severity: "high",
        severity_reason: "Electrical faults are a safety risk.",
        professional_needed: true,
        action_steps: ["Do not touch the wiring.", "Keep people away.", "Licensed electrician to inspect and repair."],
        confidence: "medium",
      },
      "Electrical fault",
      "electrical",
      location,
      text,
    );
  }
  if (text.includes("peel") || text.includes("paint")) {
    return base(
      {
        problem_type: "peeling_paint",
        ai_diagnosis: "Paint is peeling, often after earlier dampness. Confirm the wall is dry before repainting.",
        probable_cause: "Earlier dampness under the paint layer",
        severity: "low",
        severity_reason: "Cosmetic issue on the evidence provided.",
        professional_needed: false,
        action_steps: ["Check the wall is fully dry.", "Scrape loose paint.", "Painter to prime and repaint."],
        confidence: "medium",
      },
      "Peeling paint",
      "paint",
      location,
      text,
    );
  }
  if (!input.text.trim() && !input.sampleId) {
    return base(
      {
        problem_type: "other",
        ai_diagnosis: "A property problem was reported, but the AI could not confidently diagnose it from the information provided.",
        probable_cause: "unclear from photo",
        severity: "medium",
        severity_reason: "Unclear input, so a medium default is used pending manual review.",
        professional_needed: false,
        action_steps: ["Add a clearer photo or more detail.", "Ask the maintenance team to review this task."],
        confidence: "low",
      },
      "Property maintenance issue",
      "other",
      location,
      text,
    );
  }
  return base(
    {
      problem_type: "other",
      ai_diagnosis: "A property maintenance issue was reported from the text provided. A team member should review it to confirm the category.",
      probable_cause: "unclear from text",
      severity: "medium",
      severity_reason: "Text-only report, pending review.",
      professional_needed: false,
      action_steps: ["Review the reporter text.", "Assign the correct trade team.", "Add a photo if available."],
      confidence: "low",
    },
    input.text.trim().slice(0, 80) || "Property maintenance issue",
    "other",
    location,
    text,
  );
}

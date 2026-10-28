import type { Diagnosis, TextExtraction } from "./types";

// ─── Vision prompt ────────────────────────────────────────────────────────────
// STRICT: must reject non-property images and clean walls.
export const VISION_PROMPT = `You are FixScan, an AI that inspects photos of property defects.

STEP 1 — CHECK IMAGE TYPE
First decide: is this a real photo of a property defect (wall, ceiling, floor, pipe, fitting, roof, bathroom)?
- If the image is a screenshot, website UI, document, text page, person, animal, food, vehicle, landscape, artwork, or any non-property subject → return problem_type "none_detected".
- If the image shows a clean, undamaged wall/ceiling/floor with NO visible defect → return problem_type "none_detected".
- If the image is too blurry, too dark, or too small to analyse → return problem_type "none_detected" and confidence "low".

STEP 2 — DIAGNOSE ONLY IF A DEFECT IS VISIBLE
Only if a real property defect is clearly visible in the photo, identify it honestly.
Never invent a leak, crack, damp patch, or any defect that is not actually visible.

Return ONLY valid JSON, no markdown, no extra text:
{
  "problem_type": "dampness | active_leak | crack | mould | peeling_paint | water_stain | electrical_fault | other | none_detected",
  "ai_diagnosis": "1-2 plain sentences. If none_detected: 'No property defect detected in this image.'",
  "probable_cause": "most likely cause if a defect is present, or 'none' if none_detected",
  "severity": "low | medium | high",
  "severity_reason": "one short reason, or 'No defect detected' if none_detected",
  "professional_needed": false,
  "action_steps": [],
  "confidence": "low | medium | high"
}

Rules for diagnosis (only when a defect IS visible):
- Active leak / mould with spread / exposed wiring / wide structural crack → severity "high".
- Dampness patch, minor crack, water stain → severity "medium".
- Peeling paint, cosmetic marks → severity "low".
- action_steps: safest immediate step first, professional step last (max 3 steps).
- confidence "low" if image is unclear, partially obscured, or defect is ambiguous.
- Never give medical or structural-safety guarantees.
- Return ONLY valid JSON.`;

// ─── Text extraction prompt ───────────────────────────────────────────────────
export const TEXT_PROMPT = `You extract structured data from a messy property maintenance complaint.
The text may be in English, Hindi or Hinglish, may have spelling errors, may be emotional. Extract facts only.
Return ONLY valid JSON, no markdown, no extra text:
{
  "title": "short title, max 80 characters",
  "category": "plumbing | seepage | electrical | structural | paint | carpentry | appliance | other",
  "location": "location mentioned, or 'not specified'",
  "issue_summary": "one neutral sentence, no emotion, no blame",
  "urgency_signals": ["words or facts that raise urgency"],
  "suggested_priority": "low | medium | high",
  "priority_reason": "one short reason"
}
Rules:
- Never invent a room or floor that is not in the text.
- Words like "nobody has fixed it" or a mention of days passing raise urgency by one level, up to high.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function parseJsonLoose<T>(raw: string, fallback: T): T {
  try {
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1)) as T;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────
export const FALLBACK_DIAGNOSIS: Diagnosis = {
  problem_type:     "other",
  ai_diagnosis:     "A property problem was reported, but the AI could not confidently diagnose it from the information provided.",
  probable_cause:   "unclear from photo",
  severity:         "medium",
  severity_reason:  "Unclear input; medium default pending manual review.",
  professional_needed: false,
  action_steps: [
    "Keep the area safe.",
    "Add a clearer photo or more detail about the location.",
    "Ask the maintenance team to review this task.",
  ],
  confidence: "low",
};

export const NONE_DETECTED_DIAGNOSIS: Diagnosis = {
  problem_type:     "none_detected",
  ai_diagnosis:     "No property defect detected in this image.",
  probable_cause:   "none",
  severity:         "low",
  severity_reason:  "No defect detected.",
  professional_needed: false,
  action_steps:     [],
  confidence:       "high",
};

export const FALLBACK_EXTRACTION: TextExtraction = {
  title:             "Property maintenance issue",
  category:          "other",
  location:          "not specified",
  issue_summary:     "A property maintenance issue was reported.",
  urgency_signals:   [],
  suggested_priority:"medium",
  priority_reason:   "Default priority pending manual review.",
};

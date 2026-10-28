export type ProblemType =
  | "dampness"
  | "active_leak"
  | "crack"
  | "mould"
  | "peeling_paint"
  | "water_stain"
  | "electrical_fault"
  | "other"
  | "none_detected";

export type Category =
  | "plumbing"
  | "seepage"
  | "electrical"
  | "structural"
  | "paint"
  | "carpentry"
  | "appliance"
  | "other";

export type Severity = "low" | "medium" | "high";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "open" | "in_progress" | "resolved";

export interface Diagnosis {
  problem_type: ProblemType;
  ai_diagnosis: string;
  probable_cause: string;
  severity: Severity;
  severity_reason: string;
  professional_needed: boolean;
  action_steps: string[];
  confidence: "low" | "medium" | "high";
}

export interface TextExtraction {
  title: string;
  category: Category;
  location: string;
  issue_summary: string;
  urgency_signals: string[];
  suggested_priority: Priority;
  priority_reason: string;
}

export interface AnalyseResult {
  diagnosis: Diagnosis;
  extraction: TextExtraction | null;
  title: string;
  category: Category;
  location: string;
  priority: Priority;
  sla_hours: number;
  sla_due: string;
  estimated_cost_min: number | null;
  estimated_cost_max: number | null;
  cost_label: string;
  assignee_suggestion: string;
  needs_review: boolean;
  /** gemini = live AI result | demo = explicit sample | no_key = key missing + real upload | error = Gemini call failed */
  source: "gemini" | "demo" | "no_key" | "error";
  /** Specific error code returned when source === "error" or source === "no_key" */
  errorCode?: GeminiErrorCode;
}

/** Specific Gemini failure modes surfaced to the frontend */
export type GeminiErrorCode =
  | "NO_KEY"
  | "AUTH_ERROR"
  | "MODEL_NOT_FOUND"
  | "QUOTA_EXCEEDED"
  | "TIMEOUT"
  | "GEMINI_ERROR"
  | "EMPTY_RESPONSE"
  | "UNKNOWN";

export interface FixTask {
  id: string;
  display_id: string;
  title: string;
  category: Category;
  location: string;
  description: string;
  image_url: string | null;
  after_image_url: string | null;
  ai_diagnosis: string;
  problem_type: ProblemType;
  probable_cause: string;
  severity: Severity;
  priority: Priority;
  sla_due: string;
  duplicate_of: string | null;
  similarity_score: number | null;
  report_count: number;
  assignee_suggestion: string;
  estimated_cost_min: number | null;
  estimated_cost_max: number | null;
  action_steps: string[];
  status: TaskStatus;
  reporter_name: string | null;
  reporter_contact: string | null;
  needs_review: boolean;
  notes: string[];
  created_at: string;
  updated_at: string;
}

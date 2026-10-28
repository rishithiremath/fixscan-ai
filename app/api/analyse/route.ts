import { NextResponse } from "next/server";
import type { AnalyseResult, Diagnosis, GeminiErrorCode, TextExtraction } from "../../../lib/types";
import {
  FALLBACK_DIAGNOSIS,
  FALLBACK_EXTRACTION,
  TEXT_PROMPT,
  VISION_PROMPT,
  parseJsonLoose,
} from "../../../lib/prompts";
import { assigneeFor, decidePriority, slaDueFrom } from "../../../lib/priority";
import { costBandFor } from "../../../lib/costs";
import { demoAnalyse } from "../../../lib/demo";

export const dynamic = "force-dynamic";

class GeminiCallError extends Error {
  code: GeminiErrorCode;
  constructor(code: GeminiErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "GeminiCallError";
  }
}

// ─── Gemini HTTP call ─────────────────────────────────────────────────────────
async function callGemini(
  prompt: string,
  imageBase64?: string,
  mimeType?: string,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiCallError("NO_KEY", "GEMINI_API_KEY is not set");

  // Hardcoded — do NOT read GEMINI_MODEL from env. This model was verified by
  // a successful live generateContent request with the configured key.
  const model = "gemini-3-flash-preview";
  const controller = new AbortController();
  // Vision analysis can take longer than a text-only call, especially for
  // mobile photos. Allow a practical response window before surfacing TIMEOUT.
  const timeout    = setTimeout(() => controller.abort(), 45_000);

  try {
    // Image part MUST come before text so Gemini processes it first.
    const parts: unknown[] = [];
    if (imageBase64) {
      parts.push({ inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } });
    }
    parts.push({ text: prompt });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ contents: [{ parts }] }),
        signal:  controller.signal,
      },
    );

    if (!res.ok) {
      // Log the real status + body (never the key or image).
      let bodyText = "";
      try { bodyText = await res.text(); } catch { /* ignore */ }
      console.error(
        `[FixScan/Gemini] HTTP ${res.status} from model=${model}. Body: ${bodyText.slice(0, 400)}`,
      );

      if (res.status === 401 || res.status === 403) {
        throw new GeminiCallError("AUTH_ERROR", `Gemini HTTP ${res.status}`);
      }
      if (res.status === 404) {
        throw new GeminiCallError("MODEL_NOT_FOUND", `Gemini HTTP 404 – model="${model}" not found`);
      }
      if (res.status === 429) {
        throw new GeminiCallError("QUOTA_EXCEEDED", `Gemini HTTP 429 – quota/rate limit`);
      }
      throw new GeminiCallError("GEMINI_ERROR", `Gemini HTTP ${res.status}`);
    }

    const json = await res.json();
    const text =
      json?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || "")
        .join("") || "";
    if (!text) throw new GeminiCallError("EMPTY_RESPONSE", "Gemini returned 200 but no text content");
    return text;
  } catch (err) {
    if (err instanceof GeminiCallError) throw err;
    // AbortController timeout or network error
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error(
      `[FixScan/Gemini] ${isAbort ? "Timeout" : "Network error"} calling model=${model}: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw new GeminiCallError("TIMEOUT", isAbort ? "Request aborted (20 s timeout)" : `Network error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeout);
  }
}

// Retry once — but ONLY for JSON-parse failures (empty/malformed response).
// Never retry auth (401/403), not-found (404), quota (429), or timeout errors.
const NO_RETRY_CODES: GeminiErrorCode[] = ["NO_KEY", "AUTH_ERROR", "MODEL_NOT_FOUND", "QUOTA_EXCEEDED", "TIMEOUT"];

async function tryGemini(
  prompt: string,
  imageBase64?: string,
  mimeType?: string,
): Promise<string> {
  try {
    return await callGemini(prompt, imageBase64, mimeType);
  } catch (firstErr) {
    if (
      firstErr instanceof GeminiCallError &&
      NO_RETRY_CODES.includes(firstErr.code)
    ) {
      throw firstErr;
    }
    console.warn("[FixScan/Gemini] First attempt failed, retrying once…");
    return await callGemini(prompt, imageBase64, mimeType);
  }
}

// ─── Build a full AnalyseResult from Gemini outputs ──────────────────────────
function buildResult(
  diagnosis: Diagnosis,
  extraction: TextExtraction | null,
  locationHint: string,
  text: string,
  source: AnalyseResult["source"],
  errorCode?: AnalyseResult["errorCode"],
): AnalyseResult {
  const isNone = diagnosis.problem_type === "none_detected";

  // For none_detected: no cost, no assignee, low priority.
  const category = isNone
    ? "other"
    : (extraction?.category ||
        (diagnosis.problem_type === "electrical_fault"
          ? "electrical"
          : diagnosis.problem_type === "dampness" || diagnosis.problem_type === "water_stain"
          ? "seepage"
          : diagnosis.problem_type === "active_leak"
          ? "plumbing"
          : diagnosis.problem_type === "crack"
          ? "structural"
          : diagnosis.problem_type === "peeling_paint" || diagnosis.problem_type === "mould"
          ? "paint"
          : "other"));

  const priority = isNone
    ? "low"
    : decidePriority({
        problem_type: diagnosis.problem_type,
        category,
        text,
        suggested:    extraction?.suggested_priority,
        severity:     diagnosis.severity,
      });

  const band = isNone ? { min: null, max: null, label: "No repair needed — no defect detected" } : costBandFor(diagnosis.problem_type);

  return {
    diagnosis,
    extraction,
    title:               isNone ? "No defect detected" : (extraction?.title || diagnosis.ai_diagnosis.slice(0, 80) || "Property maintenance issue"),
    category,
    location:            locationHint || extraction?.location || "not specified",
    priority,
    sla_hours:           priority === "high" ? 24 : priority === "medium" ? 72 : 168,
    sla_due:             slaDueFrom(priority),
    estimated_cost_min:  band.min,
    estimated_cost_max:  band.max,
    cost_label:          band.label,
    assignee_suggestion: isNone ? "None required" : assigneeFor(category, diagnosis.problem_type),
    needs_review:        diagnosis.confidence === "low" || diagnosis.problem_type === "none_detected",
    source,
    errorCode,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  // ── ENV CHECK: fail immediately if no key ─────────────────────────────────
  const key = process.env.GEMINI_API_KEY;

  try {
    const body          = await req.json().catch(() => ({}));
    const text: string  = String(body.text || "");
    const locationHint  = String(body.locationHint || "");
    const sampleId: string | undefined = body.sampleId || undefined;

    // imageData is a full data-URL ("data:image/jpeg;base64,…")
    const rawImageData: string | undefined = body.imageData ? String(body.imageData) : undefined;
    const isRealUpload  = Boolean(rawImageData && !sampleId);   // user uploaded their own photo
    const isSample      = Boolean(sampleId);                    // user picked a labelled sample

    // Extract base64 payload + MIME type from data-URL.
    let imageBase64: string | undefined;
    let imageMime:   string | undefined;
    if (rawImageData) {
      // "data:image/png;base64,AAAA…"
      const commaIdx = rawImageData.indexOf(",");
      if (commaIdx > 0) {
        imageBase64 = rawImageData.slice(commaIdx + 1);
        imageMime   = rawImageData.slice(5, rawImageData.indexOf(";"));
      }
    }

    // ── CASE 1: Key missing — tell them clearly without any diagnosis ──────
    if (!key) {
      console.warn("[FixScan/Gemini] GEMINI_API_KEY is not set — returning no_key response");
      // For sample requests we still want the demo to work, but real uploads must get the error.
      if (isSample) {
        const demo = demoAnalyse({ text, sampleId, locationHint });
        return NextResponse.json({ ...demo, source: "demo" });
      }
      return NextResponse.json(
        buildResult(
          {
            ...FALLBACK_DIAGNOSIS,
            ai_diagnosis: "AI not connected — GEMINI_API_KEY is missing.",
            problem_type: "other",
            confidence:   "low",
          },
          null,
          locationHint,
          text,
          "no_key",
          "NO_KEY",
        ),
      );
    }

    // ── CASE 2: Sample photo clicked → always use demo (no real AI call) ─────
    if (isSample) {
      const demo = demoAnalyse({ text, sampleId, locationHint });
      return NextResponse.json({ ...demo, source: "demo" });
    }

    // ── CASE 3: Gemini key present — call the real API ────────────────────────
    try {
      let diagnosis: Diagnosis = FALLBACK_DIAGNOSIS;
      let extraction: TextExtraction | null = null;

      // Vision call: always pass real imageBase64 if we have it.
      if (isRealUpload || body.hasImage) {
        const visionPrompt = `${VISION_PROMPT}\n\nReporter note: ${text || "(none)"}${locationHint ? `\nLocation hint: ${locationHint}` : ""}`;
        const raw          = await tryGemini(visionPrompt, imageBase64, imageMime);
        const parsed       = parseJsonLoose<Diagnosis>(raw, FALLBACK_DIAGNOSIS);
        // Sanity-check: if none of the expected fields are present, treat as fallback.
        diagnosis = parsed.problem_type ? parsed : FALLBACK_DIAGNOSIS;
      }

      // Text extraction (if complaint text is provided).
      if (text.trim()) {
        const rawText = await tryGemini(`${TEXT_PROMPT}\n\nComplaint: ${text}`);
        extraction    = parseJsonLoose<TextExtraction>(rawText, FALLBACK_EXTRACTION);
      }

      return NextResponse.json(buildResult(diagnosis, extraction, locationHint, text, "gemini"));
    } catch (geminiErr) {
      // Key present but call failed — surface the specific error code.
      const errorCode: GeminiErrorCode =
        geminiErr instanceof GeminiCallError ? geminiErr.code : "UNKNOWN";

      console.error(
        `[FixScan/Gemini] Call failed with code=${errorCode}: ${geminiErr instanceof Error ? geminiErr.message : String(geminiErr)}`,
      );

      if (isRealUpload) {
        // Don't return a fake plumbing diagnosis for a real upload.
        return NextResponse.json(
          buildResult(
            {
              ...FALLBACK_DIAGNOSIS,
              ai_diagnosis: `AI analysis failed (${errorCode}). Please check configuration and retry.`,
              problem_type: "other",
              confidence:   "low",
            },
            null,
            locationHint,
            text,
            "error",
            errorCode,
          ),
        );
      }
      // Text-only complaint with no photo: fall through to text-based demo.
    }

    // ── CASE 4: No real image + text only → demo text analysis ──────────────
    // Only reached when key exists but call failed AND no real image, OR no key AND no sample.
    const demo = demoAnalyse({ text, sampleId: undefined, locationHint });
    return NextResponse.json(demo);
  } catch {
    // Last-resort: return a safe, honest error result.
    return NextResponse.json({
      ...buildResult(
        { ...FALLBACK_DIAGNOSIS, ai_diagnosis: "An unexpected server error occurred. Please try again.", confidence: "low" },
        null,
        "",
        "",
        "error",
        "UNKNOWN",
      ),
      needs_review: true,
    } satisfies AnalyseResult);
  }
}

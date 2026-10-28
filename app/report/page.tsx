"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalyseResult, FixTask, GeminiErrorCode } from "../../lib/types";
import { loadTasks, nextDisplayId, saveTasks } from "../../lib/clientStore";
import { findDuplicate } from "../../lib/duplicates";
import { escalatePriority, slaDueFrom } from "../../lib/priority";

const SAMPLES = [
  { id: "damp",  label: "Damp wall",   src: "/samples/damp-photo.jpg"  },
  { id: "leak",  label: "Leaking tap", src: "/samples/leak-photo.jpg"  },
  { id: "crack", label: "Wall crack",  src: "/samples/crack-photo.jpg" },
];

// Max dimensions / file size before we compress client-side.
const MAX_PX   = 1600;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function badgeClass(p: string) {
  return p === "high" ? "badge badge-high" : p === "medium" ? "badge badge-medium" : "badge badge-low";
}

// ── Human-readable message per error code ─────────────────────────────────────
function errorMessage(code: GeminiErrorCode | undefined): string {
  switch (code) {
    case "NO_KEY":
      return "AI not connected — GEMINI_API_KEY is missing from .env.local (local) or Vercel Environment Variables (deployed). Add it and restart/redeploy.";
    case "AUTH_ERROR":
      return "Gemini key invalid, restricted, or the Gemini API is not enabled for this key. Check Google AI Studio → API keys.";
    case "MODEL_NOT_FOUND":
      return "Gemini model not found — the configured model may be unavailable for this API key. Update the model constant in app/api/analyse/route.ts.";
    case "QUOTA_EXCEEDED":
      return "Gemini quota / rate limit reached. Wait a moment and retry, or use a new key / project in Google AI Studio.";
    case "TIMEOUT":
      return "Gemini timed out. Check your connection, then retry with a smaller or less complex photo.";
    case "EMPTY_RESPONSE":
      return "Gemini returned an empty response. Please retry — this is usually a transient issue.";
    case "GEMINI_ERROR":
      return "Gemini returned an unexpected HTTP error. Please check the server logs and retry.";
    default:
      return "An unexpected error occurred while calling the AI. Please retry.";
  }
}

// ── Source / error banner ──────────────────────────────────────────────────────
function SourceBanner({ source, errorCode }: { source: AnalyseResult["source"]; errorCode?: GeminiErrorCode }) {
  if (source === "gemini") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: 8, padding: "8px 14px", marginBottom: 20, fontSize: 13, fontWeight: 600,
      }}>
        <span style={{ color: "#34d399" }}>●</span>
        <span style={{ color: "#34d399" }}>Source: Live AI</span>
        <span style={{ color: "var(--grey3)", fontWeight: 400 }}>— analysed from your photo using Gemini Vision</span>
      </div>
    );
  }
  if (source === "demo") {
    return (
      <div style={{
        background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.28)",
        borderRadius: 10, padding: "14px 16px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ color: "#fbbf24", fontSize: 16 }}>⚠</span>
          <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: 14, letterSpacing: 0.3 }}>
            DEMO SAMPLE RESULT — NOT ANALYSED FROM YOUR PHOTO
          </span>
        </div>
        <p style={{ color: "rgba(251,191,36,0.75)", fontSize: 13, margin: 0 }}>
          This result comes from a pre-written demo scenario for the sample illustration.
          It does not reflect any real photo you uploaded.
          Source: <strong>Demo Sample</strong>
        </p>
      </div>
    );
  }

  // "no_key" and "error" — show a specific, actionable message only (no result card below).
  const isNoKey = source === "no_key";
  const title   = isNoKey ? "AI NOT CONNECTED" : "AI ANALYSIS FAILED";
  const icon    = isNoKey ? "⛔" : "✕";
  const msg     = errorMessage(errorCode);

  return (
    <div style={{
      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
      borderRadius: 10, padding: "18px 20px", marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: "#f87171", fontSize: 18 }}>{icon}</span>
        <span style={{ color: "#f87171", fontWeight: 800, fontSize: 14 }}>{title}</span>
      </div>
      <p style={{ color: "rgba(248,113,113,0.9)", fontSize: 14, margin: 0, lineHeight: 1.65 }}>
        {msg}
      </p>
      <p style={{ color: "rgba(248,113,113,0.55)", fontSize: 12, marginTop: 8, marginBottom: 0 }}>
        Creating a task from this result is disabled.{" "}
        Error code: <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4 }}>{errorCode ?? "UNKNOWN"}</code>
      </p>
    </div>
  );
}

// ── None-detected card ────────────────────────────────────────────────────────
function NoneDetectedCard({ photoUrl, onRetry }: { photoUrl: string | null; onRetry: () => void }) {
  return (
    <div className="section-card fade-up" style={{ marginTop: 16, textAlign: "center", padding: "48px 32px" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
      <h2 style={{ fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 10 }}>
        No property problem detected
      </h2>
      <p style={{ maxWidth: 420, margin: "0 auto 8px" }}>
        The AI could not find a visible property defect in this image.
        This could be a clean wall, a non-property photo, or an unclear image.
      </p>
      {photoUrl && (
        <img
          src={photoUrl}
          alt="Uploaded"
          style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 10, border: "1px solid var(--border)", margin: "16px auto", display: "block", objectFit: "cover" }}
        />
      )}
      <p style={{ color: "var(--grey3)", fontSize: 13, marginBottom: 24 }}>
        If you have a real property issue, try uploading a clearer, closer photo —
        or submit a text-only description below.
      </p>
      <div className="btn-row" style={{ justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onRetry} id="retry-photo-btn">
          ↩ Try another photo
        </button>
      </div>
    </div>
  );
}

// ── Client-side image compression ─────────────────────────────────────────────
async function compressImage(dataUrl: string, maxPx = MAX_PX, maxBytes = MAX_BYTES): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      // Scale down if needed.
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round((height / width) * maxPx); width = maxPx; }
        else                 { width  = Math.round((width / height) * maxPx); height = maxPx; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0, width, height);
      // Try progressively lower quality until under maxBytes.
      for (let q = 0.85; q >= 0.4; q -= 0.1) {
        const out = canvas.toDataURL("image/jpeg", q);
        // base64 → approx byte size
        const approxBytes = (out.length - out.indexOf(",") - 1) * 0.75;
        if (approxBytes <= maxBytes) { resolve(out); return; }
      }
      // Still too large — caller will show the "too large" message.
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const [text, setText]                     = useState("");
  const [location, setLocation]             = useState("");
  const [name, setName]                     = useState("");
  const [contact, setContact]               = useState("");
  const [photoUrl, setPhotoUrl]             = useState<string | null>(null);
  const [photoData, setPhotoData]           = useState<string | null>(null);
  const [sampleId, setSampleId]             = useState<string | null>(null);
  const [error, setError]                   = useState("");
  const [analysing, setAnalysing]           = useState(false);
  const [result, setResult]                 = useState<AnalyseResult | null>(null);
  const [reviewLocation, setReviewLocation] = useState("");
  const [created, setCreated]               = useState<FixTask | null>(null);
  const [mergedInto, setMergedInto]         = useState<FixTask | null>(null);
  const [tasks, setTasks]                   = useState<FixTask[]>([]);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  useEffect(() => { setTasks(loadTasks()); }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read raw data-URL first.
    const rawDataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(file);
    });

    // If over 5 MB, try to compress.
    if (file.size > MAX_BYTES) {
      const compressed = await compressImage(rawDataUrl);
      if (!compressed) {
        setError("Image too large — try a smaller photo (under 5 MB, ideally under 2 MB).");
        return;
      }
      setPhotoUrl(compressed);
      setPhotoData(compressed);
    } else {
      // Still compress if dimensions are huge (saves API bandwidth + avoids timeouts).
      const img = new Image();
      img.src = rawDataUrl;
      await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); });
      if (img.width > MAX_PX || img.height > MAX_PX) {
        const compressed = await compressImage(rawDataUrl);
        setPhotoUrl(compressed ?? rawDataUrl);
        setPhotoData(compressed ?? rawDataUrl);
      } else {
        setPhotoUrl(rawDataUrl);
        setPhotoData(rawDataUrl);
      }
    }
    setSampleId(null);    // clear any selected sample
    setError("");
  }

  function pickSample(s: { id: string; src: string }) {
    setSampleId(s.id);
    setPhotoUrl(s.src);
    setPhotoData(null);   // samples have no base64 — route uses sampleId
  }

  function reset() {
    setResult(null);
    setCreated(null);
    setMergedInto(null);
    setError("");
  }

  async function analyse() {
    if (!photoUrl && text.trim().length < 10) {
      setError("Add a photo OR at least 10 characters of text.");
      return;
    }
    // ① Clear old result immediately so no stale card is visible while loading.
    setError("");
    setResult(null);
    setCreated(null);
    setMergedInto(null);
    setAnalysing(true);
    try {
      const res  = await fetch("/api/analyse", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          locationHint: location,
          sampleId:     sampleId || undefined,
          hasImage:     Boolean(photoUrl),
          // Only send the real base64 data-URL for user uploads, not the built-in demo photos.
          imageData:    photoData || undefined,
        }),
      });
      const data = await res.json();
      setResult(data as AnalyseResult);
      setReviewLocation(location || data.location || "");
    } catch {
      setError("Analysis failed — network error. Please try again.");
    } finally {
      setAnalysing(false);
    }
  }

  function createTask(mergeTarget: FixTask | null) {
    if (!result) return;
    const all = loadTasks();
    if (mergeTarget) {
      const updated = all.map((t) => {
        if (t.id !== mergeTarget.id) return t;
        const newCount    = t.report_count + 1;
        const newPriority = newCount >= 3 ? escalatePriority(t.priority) : t.priority;
        return {
          ...t,
          report_count: newCount,
          priority:     newPriority,
          sla_due:      newCount >= 3 && newPriority !== t.priority ? slaDueFrom(newPriority) : t.sla_due,
          notes:        [...t.notes, `Report merged. Count: ${newCount}.`],
        };
      });
      saveTasks(updated);
      setTasks(updated);
      setMergedInto({ ...mergeTarget, report_count: mergeTarget.report_count + 1 });
      return;
    }
    const now  = new Date().toISOString();
    const task: FixTask = {
      id:                  `task-${Date.now()}`,
      display_id:          nextDisplayId(all),
      title:               result.title,
      category:            result.category,
      location:            reviewLocation || result.location,
      description:         text.trim() || result.title,
      image_url:           photoUrl,
      after_image_url:     null,
      ai_diagnosis:        result.diagnosis.ai_diagnosis,
      problem_type:        result.diagnosis.problem_type,
      probable_cause:      result.diagnosis.probable_cause,
      severity:            result.diagnosis.severity,
      priority:            result.priority,
      sla_due:             result.sla_due,
      duplicate_of:        null,
      similarity_score:    null,
      report_count:        1,
      assignee_suggestion: result.assignee_suggestion,
      estimated_cost_min:  result.estimated_cost_min,
      estimated_cost_max:  result.estimated_cost_max,
      action_steps:        result.diagnosis.action_steps,
      status:              "open",
      reporter_name:       name || null,
      reporter_contact:    contact || null,
      needs_review:        result.needs_review,
      notes:               [],
      created_at:          now,
      updated_at:          now,
    };
    const updated = [task, ...all];
    saveTasks(updated);
    setTasks(updated);
    setCreated(task);
  }

  const isNoneDetected   = result?.diagnosis.problem_type === "none_detected";
  // Block task creation for: no_key, error, none_detected
  const canCreateTask    = result
    && result.source !== "no_key"
    && result.source !== "error"
    && !isNoneDetected;

  const duplicate = (result && canCreateTask)
    ? findDuplicate(
        { location: reviewLocation || result.location, category: result.category, title: result.title, description: text },
        tasks,
      )
    : null;

  /* ── Task created ──────────────────────────────────────────────────────────*/
  if (created) return (
    <div className="wrap-inner">
      <div className="section-card fade-up" style={{ textAlign: "center", padding: "60px 40px" }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>✅</div>
        <div className="section-label" style={{ justifyContent: "center" }}>Task created</div>
        <h1 style={{ fontWeight: 900, letterSpacing: "-2px", marginBottom: 20 }}>{created.display_id}</h1>
        <div className="meta-row" style={{ justifyContent: "center", marginBottom: 32 }}>
          <span className={badgeClass(created.priority)}>{created.priority.toUpperCase()}</span>
          <span className="meta-sep">·</span>
          <span>SLA {new Date(created.sla_due).toLocaleString("en-IN")}</span>
        </div>
        <div className="btn-row">
          <a className="btn btn-primary" href={`/tasks/${created.id}`} id="view-task-btn">View task →</a>
          <a className="btn btn-ghost"   href="/dashboard" id="view-dash-btn">Dashboard</a>
        </div>
      </div>
    </div>
  );

  /* ── Merged ────────────────────────────────────────────────────────────────*/
  if (mergedInto) return (
    <div className="wrap-inner">
      <div className="section-card fade-up" style={{ textAlign: "center", padding: "60px 40px" }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🔁</div>
        <div className="section-label" style={{ justifyContent: "center" }}>Report merged</div>
        <h1 style={{ fontWeight: 900, letterSpacing: "-2px", marginBottom: 20 }}>Reporter #{mergedInto.report_count}</h1>
        <p style={{ maxWidth: 420, margin: "0 auto 32px", textAlign: "center" }}>
          Added to task <strong style={{ color: "var(--off-white)" }}>{mergedInto.display_id}</strong> —
          priority escalated instead of creating a duplicate.
        </p>
        <div className="btn-row">
          <a className="btn btn-primary" href={`/tasks/${mergedInto.id}`} id="view-merged-btn">View task →</a>
          <a className="btn btn-ghost"   href="/dashboard">Dashboard</a>
        </div>
      </div>
    </div>
  );

  /* ── Main form ─────────────────────────────────────────────────────────────*/
  return (
    <div className="wrap-inner">

      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div className="section-label">✦ AI-powered</div>
        <h1 style={{ fontWeight: 900, letterSpacing: "-2px" }}>
          Report a<br />
          <span style={{ color: "var(--grey)" }}>Problem</span>
        </h1>
        <p>Photo, text, or both. Demo Mode works without API keys.</p>
      </div>

      <div className="section-card fade-up-2">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--grey2)" }}>
          1 · Photo
        </h2>
        <input id="photo-upload" ref={fileInputRef} type="file" accept="image/*" onChange={onFile} />
        {photoUrl && !sampleId && (
          <div style={{ marginTop: 14 }}>
            <img className="preview" src={photoUrl} alt="Uploaded" style={{ maxHeight: 260, objectFit: "cover", width: "100%" }} />
          </div>
        )}

        <p style={{ marginTop: 18, marginBottom: 10, fontSize: 12, fontWeight: 600, color: "var(--grey3)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Or try a realistic sample photo (demo only):
        </p>
        <div className="sample-row">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`sample-tile${sampleId === s.id ? " selected" : ""}`}
              onClick={() => pickSample(s)}
              aria-pressed={sampleId === s.id}
            >
              <img src={s.src} alt="" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="divider" style={{ margin: "28px 0" }} />

        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--grey2)" }}>
          2 · Describe the problem
        </h2>
        <label>Complaint (English or Hinglish)</label>
        <textarea
          id="complaint-text"
          className="field"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Water is leaking near the hostel washroom, nobody has fixed it..."
          style={{ resize: "vertical" }}
        />

        <label>Location</label>
        <input id="location-input" className="field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hostel washroom, Block C" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Your name (optional)</label>
            <input id="name-input" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" />
          </div>
          <div>
            <label>Contact (optional)</label>
            <input id="contact-input" className="field" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 98765 43210" />
          </div>
        </div>

        {error && <p className="error">⚠ {error}</p>}

        <div style={{ marginTop: 24 }}>
          <button
            id="analyse-btn"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={analyse}
            disabled={analysing}
          >
            {analysing ? "⟳  Analysing — reading photo, checking for duplicates…" : "✦  Analyse with AI"}
          </button>
        </div>
      </div>

      {/* ── Error / no_key: show ONLY the error panel, nothing else ──────── */}
      {result && (result.source === "error" || result.source === "no_key") && (
        <div className="section-card fade-up" style={{ marginTop: 16 }}>
          <SourceBanner source={result.source} errorCode={result.errorCode} />
          <div className="btn-row" style={{ justifyContent: "flex-start" }}>
            <button id="report-again-btn" className="btn btn-ghost" onClick={() => reset()}>
              ↩ Try again
            </button>
          </div>
        </div>
      )}

      {/* ── None-detected special card ────────────────────────────────────── */}
      {result && isNoneDetected && result.source === "gemini" && (
        <NoneDetectedCard photoUrl={photoUrl} onRetry={() => { reset(); setPhotoUrl(null); setPhotoData(null); setSampleId(null); }} />
      )}

      {/* ── Full result card (only for real/demo results with an actual problem) */}
      {result && !isNoneDetected && result.source !== "error" && result.source !== "no_key" && (
        <div className="section-card fade-up" style={{ marginTop: 16 }}>

          {/* Source banner — always first */}
          <SourceBanner source={result.source} errorCode={result.errorCode} />

          {/* Photo */}
          {photoUrl && !sampleId && (
            <img className="preview" src={photoUrl} alt="Problem" style={{ marginBottom: 20, maxHeight: 240, objectFit: "cover", width: "100%" }} />
          )}

          <div className="section-label">✦ AI Review Card</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 12 }}>{result.title}</h2>

          <div className="meta-row" style={{ marginBottom: 16 }}>
            <span>{result.diagnosis.problem_type.replace(/_/g, " ")}</span>
            <span className="meta-sep">·</span>
            <span>Severity <span className={badgeClass(result.diagnosis.severity)}>{result.diagnosis.severity.toUpperCase()}</span></span>
          </div>

          <p style={{ lineHeight: 1.8, marginBottom: 14 }}>{result.diagnosis.ai_diagnosis}</p>
          {result.diagnosis.probable_cause && result.diagnosis.probable_cause !== "none" && (
            <p style={{ marginBottom: 20 }}>
              <strong style={{ color: "var(--off-white)", fontWeight: 600 }}>Probable cause: </strong>
              {result.diagnosis.probable_cause}
            </p>
          )}

          <label>Location (correct if needed)</label>
          <input id="review-location-input" className="field" value={reviewLocation} onChange={(e) => setReviewLocation(e.target.value)} />

          <div className="divider" />

          {/* Meta grid — hide Cost & Assignee for none_detected */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Category",  val: result.category,  show: true },
              { label: "Priority",  val: <span className={badgeClass(result.priority)}>{result.priority.toUpperCase()}</span>, show: true },
              { label: "SLA due",   val: new Date(result.sla_due).toLocaleDateString("en-IN"), show: true },
              { label: "Cost",      val: result.cost_label, show: result.source === "gemini" || result.source === "demo" },
              { label: "Assignee",  val: result.assignee_suggestion, show: result.source === "gemini" || result.source === "demo" },
            ]
              .filter((m) => m.show)
              .map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 11, color: "var(--grey3)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--off-white)" }}>{m.val}</div>
                </div>
              ))}
          </div>

          {result.diagnosis.action_steps.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--grey3)", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600, marginBottom: 10 }}>Action steps</div>
              <ul style={{ paddingLeft: 16 }}>
                {result.diagnosis.action_steps.map((s, i) => (
                  <li key={i} style={{ fontSize: 14, color: "var(--grey)", marginBottom: 6 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.needs_review && result.source === "gemini" && (
            <p className="error">⚠ Needs manual review — low confidence or unclear input.</p>
          )}

          {duplicate && duplicate.verdict !== "new" && duplicate.task && (
            <p className="error">
              🔁 Similar task: <strong>{duplicate.task.display_id}</strong> — {duplicate.task.title}.
              &nbsp;Score: {duplicate.score.toFixed(2)}.
              &nbsp;{duplicate.verdict === "duplicate" ? "Looks like a duplicate." : "Compare before creating."}
            </p>
          )}

          {result.source === "gemini" && (
            <p className="note" style={{ marginBottom: 20 }}>⚠ AI-generated — verify before major work.</p>
          )}

          {/* Action buttons — only shown when task creation is allowed */}
          <div className="btn-row" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
            {canCreateTask ? (
              <>
                {duplicate && duplicate.verdict === "duplicate" && duplicate.task ? (
                  <button id="merge-btn" className="btn btn-primary" onClick={() => createTask(duplicate.task!)}>
                    🔁 Add to {duplicate.task!.display_id}
                  </button>
                ) : (
                  <button id="create-task-btn" className="btn btn-primary" onClick={() => createTask(null)}>
                    ✦ Create task
                  </button>
                )}
              </>
            ) : (
              <button className="btn btn-ghost" disabled style={{ cursor: "not-allowed", opacity: 0.45 }}>
                ✦ Create task (disabled)
              </button>
            )}
            <button id="report-again-btn" className="btn btn-ghost" onClick={() => { reset(); }}>
              Report again
            </button>
          </div>

          {duplicate && duplicate.verdict === "possible" && duplicate.task && canCreateTask && (
            <div style={{ marginTop: 12 }}>
              <button id="merge-possible-btn" className="btn btn-ghost btn-sm" onClick={() => createTask(duplicate.task!)}>
                Or add to {duplicate.task!.display_id} instead
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { FixTask, TaskStatus } from "../../../lib/types";
import { loadTasks, saveTasks } from "../../../lib/clientStore";

function badgeClass(p: string) {
  return p === "high" ? "badge badge-high" : p === "medium" ? "badge badge-medium" : "badge badge-low";
}

function statusStyle(s: string) {
  if (s === "open")        return { label: "Open",        cls: "badge badge-open"    };
  if (s === "in_progress") return { label: "In Progress", cls: "badge badge-medium"  };
  return                          { label: "Resolved",    cls: "badge badge-success" };
}

export default function TaskDetailPage() {
  const params   = useParams();
  const id       = String(params.id);
  const [task, setTask]       = useState<FixTask | null>(null);
  const [note, setNote]       = useState("");
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [error, setError]     = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const found = loadTasks().find((t) => t.id === id || t.display_id === id);
    setTask(found || null);
    if (found?.after_image_url) setAfterUrl(found.after_image_url);
  }, [id]);

  function update(patch: Partial<FixTask>, noteText?: string) {
    if (!task) return;
    const all     = loadTasks();
    const updated = all.map((t) => t.id === task.id
      ? { ...t, ...patch, notes: noteText ? [...t.notes, noteText] : t.notes, updated_at: new Date().toISOString() }
      : t
    );
    saveTasks(updated);
    setTask(updated.find((t) => t.id === task.id) || null);
  }

  function changeStatus(status: TaskStatus) {
    setError(""); setMessage("");
    if (status === "resolved" && !afterUrl) { setError("Upload an after photo before marking Resolved."); return; }
    update({ status, after_image_url: status === "resolved" ? afterUrl : task?.after_image_url || null }, `Status changed to ${status}.`);
    setMessage(`Status updated to ${status}.`);
  }

  function onAfterFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("After photo must be 5 MB or smaller."); return; }
    const reader = new FileReader();
    reader.onload = () => setAfterUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  if (!task) return (
    <div className="wrap-inner">
      <div className="section-card" style={{ textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Task not found</h1>
        <p>The task may have been deleted or the link is incorrect.</p>
        <a className="btn btn-ghost" href="/dashboard" style={{ marginTop: 16, display: "inline-flex" }}>← Dashboard</a>
      </div>
    </div>
  );

  const sl     = statusStyle(task.status);
  const overdue = task.status !== "resolved" && new Date(task.sla_due) < new Date();

  return (
    <div className="wrap-inner">

      {/* Back */}
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <a href="/dashboard" style={{ fontSize: 13, color: "var(--grey3)", display: "inline-flex", alignItems: "center", gap: 5 }}>
          ← Dashboard
        </a>
      </div>

      {/* ── Title card ───────────────────────────────────────── */}
      <div className="section-card fade-up" style={{ marginBottom: 14 }}>
        <div className="inline-row" style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--border)", borderRadius: "var(--r-pill)",
            padding: "3px 12px", color: "var(--grey2)", textTransform: "uppercase", letterSpacing: "0.8px",
          }}>{task.display_id}</span>
          <span className={sl.cls}>{sl.label}</span>
          <span className={badgeClass(task.priority)}>{task.priority.toUpperCase()}</span>
          {overdue && <span className="badge badge-high">OVERDUE</span>}
        </div>

        <h1 style={{ fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 16 }}>{task.title}</h1>

        <div className="meta-row">
          <span>📍 {task.location}</span>
          <span className="meta-sep">·</span>
          <span>🗂 {task.category}</span>
          <span className="meta-sep">·</span>
          <span>📅 SLA {new Date(task.sla_due).toLocaleDateString("en-IN")}</span>
          <span className="meta-sep">·</span>
          <span>📢 {task.report_count} report{task.report_count !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── Photos ───────────────────────────────────────────── */}
      {(task.image_url || task.after_image_url) && (
        <div
          className="card fade-up-2"
          style={{
            display: "grid",
            gridTemplateColumns: task.image_url && task.after_image_url ? "1fr 1fr" : "1fr",
            gap: 16, marginBottom: 14,
          }}
        >
          {task.image_url && (
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>Before</div>
              <img className="preview" src={task.image_url} alt="Before" style={{ width: "100%", height: 200, objectFit: "cover" }} />
            </div>
          )}
          {task.after_image_url && (
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>After</div>
              <img className="preview" src={task.after_image_url} alt="After" style={{ width: "100%", height: 200, objectFit: "cover" }} />
            </div>
          )}
        </div>
      )}

      {/* ── AI Diagnosis ─────────────────────────────────────── */}
      <div className="section-card fade-up-2" style={{ marginBottom: 14 }}>
        <div className="section-label">✦ AI Diagnosis</div>
        <div className="meta-row" style={{ marginBottom: 12 }}>
          <strong style={{ color: "var(--off-white)", fontSize: 16 }}>{task.problem_type}</strong>
          {task.severity && <span className={badgeClass(task.severity)}>{task.severity.toUpperCase()}</span>}
        </div>
        <p style={{ lineHeight: 1.8, marginBottom: 14 }}>{task.ai_diagnosis}</p>
        <p style={{ marginBottom: 24 }}>
          <strong style={{ color: "var(--grey2)", fontWeight: 600 }}>Probable cause: </strong>
          {task.probable_cause}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Cost estimate", val: task.estimated_cost_min !== null ? `₹${task.estimated_cost_min} – ₹${task.estimated_cost_max}` : "Quote needed" },
            { label: "Assignee",     val: task.assignee_suggestion },
            ...(task.reporter_name ? [{ label: "Reporter", val: task.reporter_name }] : []),
            ...(task.reporter_contact ? [{ label: "Contact", val: task.reporter_contact }] : []),
          ].map((m) => (
            <div key={m.label} style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: 10, color: "var(--grey3)", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--off-white)" }}>{m.val}</div>
            </div>
          ))}
        </div>

        {task.action_steps.length > 0 && (
          <>
            <div className="section-label" style={{ marginBottom: 10 }}>Action steps</div>
            <ul>
              {task.action_steps.map((s, i) => <li key={i} style={{ fontSize: 14, color: "var(--grey)", marginBottom: 6 }}>{s}</li>)}
            </ul>
          </>
        )}

        <p className="note" style={{ marginTop: 16 }}>⚠ AI-generated — verify before major work.</p>
      </div>

      {/* ── Reporter text ─────────────────────────────────────── */}
      <div className="card fade-up-3" style={{ marginBottom: 14 }}>
        <div className="section-label">Reporter's text</div>
        <p style={{ fontStyle: "italic", lineHeight: 1.8 }}>"{task.description}"</p>
      </div>

      {/* ── History ───────────────────────────────────────────── */}
      {task.notes.length > 0 && (
        <div className="card fade-up-3" style={{ marginBottom: 14 }}>
          <div className="section-label">History &amp; notes</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {task.notes.map((n, i) => (
              <li key={i} style={{ padding: "10px 0", borderBottom: i < task.notes.length - 1 ? "1px solid var(--border)" : "none", color: "var(--grey)", fontSize: 14 }}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Update ────────────────────────────────────────────── */}
      <div className="section-card fade-up-3">
        <div className="section-label">✦ Update Task</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 20 }}>
          Change status or add a note
        </h2>

        <label>
          After photo
          <span style={{ textTransform: "none", fontWeight: 400, fontSize: 11, color: "var(--grey3)", marginLeft: 4 }}>
            (required before Resolved)
          </span>
        </label>
        <input id="after-photo-upload" type="file" accept="image/*" onChange={onAfterFile} />
        {afterUrl && !task.after_image_url && (
          <div style={{ marginTop: 12 }}>
            <img className="preview" src={afterUrl} alt="After preview" style={{ maxHeight: 180, objectFit: "cover", width: "100%" }} />
          </div>
        )}

        <label>Note</label>
        <input id="note-input" className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note or update..." />

        {error   && <p className="error">⚠ {error}</p>}
        {message && <p className="success-msg">✓ {message}</p>}

        <div className="inline-row" style={{ marginTop: 24, flexWrap: "wrap" }}>
          <button
            id="add-note-btn"
            className="btn btn-ghost"
            onClick={() => { if (note.trim()) { update({}, note.trim()); setNote(""); setMessage("Note added."); } }}
          >
            Add note
          </button>
          <button id="in-progress-btn" className="btn btn-ghost" onClick={() => changeStatus("in_progress")}>In Progress</button>
          <button
            id="resolved-btn"
            className="btn btn-primary"
            style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", boxShadow: "0 4px 20px rgba(16,185,129,0.25)" }}
            onClick={() => changeStatus("resolved")}
          >
            ✓ Mark Resolved
          </button>
          <button id="reopen-btn" className="btn btn-ghost" onClick={() => changeStatus("open")}>Reopen</button>
        </div>

        <div style={{ marginTop: 24 }}>
          <a href="/dashboard" style={{ fontSize: 13, color: "var(--grey3)" }}>← Back to dashboard</a>
        </div>
      </div>

    </div>
  );
}

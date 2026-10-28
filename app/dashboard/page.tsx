"use client";

import { useEffect, useMemo, useState } from "react";
import type { FixTask, TaskStatus } from "../../lib/types";
import { loadTasks, resetDemo } from "../../lib/clientStore";

function badgeClass(p: string) {
  return p === "high" ? "badge badge-high" : p === "medium" ? "badge badge-medium" : "badge badge-low";
}

export default function DashboardPage() {
  const [tasks, setTasks]                   = useState<FixTask[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter]     = useState("");

  useEffect(() => { setTasks(loadTasks()); }, []);

  const filtered = useMemo(() => tasks.filter((t) =>
    (!locationFilter || t.location.toLowerCase().includes(locationFilter.toLowerCase())) &&
    (!categoryFilter || t.category === categoryFilter) &&
    (!priorityFilter || t.priority === priorityFilter) &&
    (!statusFilter    || t.status === statusFilter)
  ), [tasks, locationFilter, categoryFilter, priorityFilter, statusFilter]);

  const now = new Date();
  const counts = {
    open:     tasks.filter((t) => t.status === "open").length,
    high:     tasks.filter((t) => t.priority === "high" && t.status !== "resolved").length,
    overdue:  tasks.filter((t) => t.status !== "resolved" && new Date(t.sla_due) < now).length,
    resolved: tasks.filter((t) => t.status === "resolved").length,
  };

  const columns: { key: TaskStatus; label: string; dotClass: string }[] = [
    { key: "open",        label: "Open",        dotClass: "dot-open"     },
    { key: "in_progress", label: "In Progress",  dotClass: "dot-progress" },
    { key: "resolved",    label: "Resolved",     dotClass: "dot-resolved" },
  ];

  return (
    <div className="wrap-inner">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div className="section-label">✦ Live view</div>
        <h1 style={{ fontSize: "clamp(26px,5vw,42px)", fontWeight: 900, letterSpacing: "-2px" }}>
          Repair Board
          <span className="sparkle-star" style={{ fontSize: 18 }}>✦</span>
        </h1>
        <p style={{ marginBottom: 0 }}>All active and resolved maintenance tasks in one place.</p>
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid3 fade-up-2">
        <div className="stat-card">
          <div className="stat-label">Open tasks</div>
          <div className="stat-value accent">{counts.open}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High priority · Overdue</div>
          <div className="stat-value warning">
            {counts.high}
            {counts.overdue > 0 && (
              <span style={{ fontSize: 18, color: "#f87171", marginLeft: 8 }}>/ {counts.overdue}</span>
            )}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolved</div>
          <div className="stat-value success">{counts.resolved}</div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="card fade-up-3" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--grey2)", marginBottom: 16 }}>
          Filter tasks
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          <div>
            <label>Location</label>
            <input id="filter-location" className="field" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="e.g. hostel" />
          </div>
          <div>
            <label>Category</label>
            <select id="filter-category" className="field" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All</option>
              {["plumbing","seepage","electrical","structural","paint","carpentry","appliance","other"].map((c) =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
          </div>
          <div>
            <label>Priority</label>
            <select id="filter-priority" className="field" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select id="filter-status" className="field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        <div className="inline-row" style={{ marginTop: 16 }}>
          <button
            id="clear-filters-btn"
            className="btn btn-ghost btn-sm"
            onClick={() => { setLocationFilter(""); setCategoryFilter(""); setPriorityFilter(""); setStatusFilter(""); }}
          >
            Clear filters
          </button>
          <button
            id="reset-demo-btn"
            className="btn btn-ghost btn-sm"
            onClick={() => { resetDemo(); setTasks(loadTasks()); }}
          >
            ↺ Reset demo
          </button>
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>🔍</p>
          <p style={{ marginBottom: 16 }}>No tasks match these filters.</p>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setLocationFilter(""); setCategoryFilter(""); setPriorityFilter(""); setStatusFilter(""); }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Kanban ──────────────────────────────────────────── */}
      <div className="kanban-grid">
        {columns.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col.key);
          return (
            <div key={col.key}>
              <div className="kanban-col-header">
                <span className={`kanban-dot ${col.dotClass}`} />
                <h2>{col.label}</h2>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--grey3)", fontWeight: 700 }}>
                  {colTasks.length}
                </span>
              </div>

              {colTasks.map((t) => {
                const overdue = t.status !== "resolved" && new Date(t.sla_due) < now;
                return (
                  <div className="task-card" key={t.id}>
                    {t.image_url && (
                      <img
                        src={t.image_url}
                        alt={t.title}
                        style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 10, border: "1px solid var(--border)" }}
                      />
                    )}
                    <h3><a href={`/tasks/${t.id}`}>{t.display_id} — {t.title}</a></h3>
                    <div className="meta-row">
                      <span>{t.location}</span>
                      <span className="meta-sep">·</span>
                      <span className={badgeClass(t.priority)}>{t.priority.toUpperCase()}</span>
                      {overdue && <span className="badge badge-high">OVERDUE</span>}
                    </div>
                    <div className="meta-row">
                      <span style={{ fontSize: 12 }}>SLA {new Date(t.sla_due).toLocaleDateString("en-IN")}</span>
                      <span className="meta-sep">·</span>
                      <span style={{ fontSize: 12 }}>{t.report_count} report{t.report_count !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })}

              {colTasks.length === 0 && (
                <div style={{ padding: "28px 0", textAlign: "center", color: "var(--grey3)", fontSize: 13 }}>
                  Empty
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

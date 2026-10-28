"use client";

import { useState } from "react";

export default function NavClient() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Floating pill navbar ──────────────────────────── */}
      <header className="topbar">
        <a href="/" className="brand">
          <span className="brand-icon">⚡</span>
          FixScan AI
        </a>

        <nav>
          <a href="/report">Report</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/report" className="nav-cta">Get started</a>
        </nav>

        {/* Hamburger (mobile only) */}
        <button
          className="nav-hamburger"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <span /><span /><span />
        </button>
      </header>

      {/* ── Mobile fullscreen nav ─────────────────────────── */}
      {open && (
        <div className="mobile-nav open">
          <button
            className="mobile-nav-close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
          <a href="/"          onClick={() => setOpen(false)}>Home</a>
          <a href="/report"    onClick={() => setOpen(false)}>Report a problem</a>
          <a href="/dashboard" onClick={() => setOpen(false)}>Dashboard</a>
          <a href="/report" onClick={() => setOpen(false)} style={{
            marginTop: 16,
            background: "var(--white)",
            color: "#0a0a0a",
            fontWeight: 700,
            borderRadius: "var(--r-pill)",
          }}>
            Get started ↗
          </a>
        </div>
      )}
    </>
  );
}

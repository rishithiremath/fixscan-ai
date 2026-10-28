export default function Home() {
  return (
    <>
      <div className="wrap">

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <section className="hero-section fade-up">
          <div className="hero-eyebrow">
            <span className="dot" />
            Smart Property AI &nbsp;·&nbsp; NEURA X 2026
          </div>

          <h1 className="hero-title">
            <span className="light">See it. Report it.</span>
            <span className="bold-line">
              Fix it.
              <span className="sparkle-star">✦</span>
            </span>
          </h1>

          <p className="hero-sub">
            FixScan turns a photo or a messy complaint into a diagnosed,
            prioritised, deduplicated repair task — in under&nbsp;
            <strong style={{ color: "var(--off-white)", fontWeight: 700 }}>30 seconds</strong>.
          </p>

          <div className="btn-row">
            <a className="btn btn-primary" href="/report" id="hero-cta-report">
              ↗ &thinsp;Report a problem
            </a>
            <a className="btn btn-ghost" href="/dashboard" id="hero-cta-dash">
              View dashboard
            </a>
          </div>

          <p className="note" style={{ marginTop: 20, textAlign: "center" }}>
            Demo Mode — no API keys needed. Try a sample photo on the report page.
          </p>
        </section>

        {/* ══ STATS ════════════════════════════════════════════ */}
        <div className="stats-row fade-up-2">
          {[
            { num: "30s",   desc: "Avg. diagnosis time"       },
            { num: "100%",  desc: "Photo-verified tasks"      },
            { num: "3×",    desc: "Fewer duplicate reports"   },
            { num: "0 ₹",   desc: "To start — free Demo Mode" },
          ].map((s) => (
            <div className="stat-box" key={s.num}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* ══ FEATURE SECTION ══════════════════════════════════ */}
        <section className="section-card fade-up-3" style={{ marginBottom: 16 }}>
          <div className="section-label">✦ Features</div>
          <h2 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 12 }}>
            AI Tool That<br />
            <span style={{ color: "var(--grey)" }}>Delivers</span> Real Results
          </h2>
          <p style={{ maxWidth: 480, marginBottom: 32 }}>
            Our proven methods help you fix property problems faster than ever, giving every
            issue a photo, a priority, and an owner.
          </p>

          {/* mock dashboard preview */}
          <div style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: 10,
          }}>
            {[
              { icon: "📸", label: "Photo Upload",      val: "Instant" },
              { icon: "🤖", label: "AI Diagnosis",      val: "30 sec"  },
              { icon: "🔁", label: "Duplicate Check",   val: "Auto"    },
              { icon: "🚨", label: "Priority Score",    val: "Smart"   },
              { icon: "📋", label: "Audit Trail",       val: "Always"  },
              { icon: "📅", label: "SLA Tracking",      val: "Live"    },
            ].map((f) => (
              <div
                key={f.label}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-sm)",
                  padding: "14px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span style={{ fontSize: 11, color: "var(--grey2)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{f.label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--white)", letterSpacing: "-0.5px" }}>{f.val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══ HOW IT WORKS ════════════════════════════════════ */}
        <section style={{ marginBottom: 16 }}>
          <div className="section-label fade-up">✦ How it works</div>
          <h2 className="fade-up" style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 24 }}>
            Proven Results<br />
            <span style={{ color: "var(--grey)" }}>You Can Trust</span>
          </h2>

          <div className="steps-grid fade-up-2">
            {[
              {
                n: "01", icon: "📷", title: "Report",
                desc: "Upload a photo or type a complaint in English or Hinglish. Both work.",
              },
              {
                n: "02", icon: "🧠", title: "Diagnose",
                desc: "AI reads the image and text, identifies the problem, severity, cause and cost.",
              },
              {
                n: "03", icon: "✅", title: "Track",
                desc: "Tasks are prioritised, duplicates merged. Nothing resolves without an after photo.",
              },
            ].map((s) => (
              <div className="step-card" key={s.n}>
                <div className="step-num-large">{s.n}</div>
                <span className="step-icon">{s.icon}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ WHY FIXSCAN ════════════════════════════════════ */}
        <section className="section-card fade-up-3">
          <div className="section-label">✦ For everyone</div>
          <h2 style={{ fontSize: "clamp(20px,4vw,32px)", fontWeight: 900, letterSpacing: "-1px", marginBottom: 16 }}>
            For Hostels, Societies
            <span className="sparkle-star" style={{ fontSize: 18 }}>✦</span><br />
            <span style={{ color: "var(--grey)" }}>and Every Home</span>
          </h2>
          <p style={{ maxWidth: 520, marginBottom: 32, lineHeight: 1.8 }}>
            Today complaints get lost on WhatsApp. FixScan gives every problem a photo,
            a priority, a deadline and an owner — so a small leak never becomes a big bill.
          </p>
          <div className="btn-row" style={{ justifyContent: "flex-start" }}>
            <a className="btn btn-primary" href="/report">Start for free ↗</a>
            <a className="btn btn-ghost" href="/dashboard">See the board</a>
          </div>
          <p className="note" style={{ marginTop: 20 }}>
            ⚠ AI-generated — verify before major work. Costs are indicative estimates only.
          </p>
        </section>

      </div>
    </>
  );
}

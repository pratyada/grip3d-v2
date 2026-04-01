import Link from "next/link"
import { GlobeWrapper } from "@/components/GlobeWrapper"
import { ConsultingForm } from "@/components/ConsultingForm"
import { FocusRail, type FocusRailItem } from "@/components/ui/focus-rail"
import { useCases } from "@/lib/data"

// Build FocusRail items from live use cases only
const railItems: FocusRailItem[] = useCases
  .filter((uc) => uc.status === "live")
  .map((uc) => ({
    id: uc.id,
    title: uc.title,
    description: uc.description,
    imageSrc: uc.image,
    href: uc.demoUrl ?? `/use-cases/${uc.slug}`,
    meta: uc.category.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
  }))

export default function HomePage() {
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .consulting-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section
        style={{
          background: "linear-gradient(135deg, var(--bg) 0%, #0a1628 50%, var(--bg) 100%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "clamp(48px, 8vw, 100px) clamp(16px, 4vw, 48px) clamp(40px, 6vw, 80px)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(32px, 5vw, 80px)",
            alignItems: "center",
          }}
          className="hero-grid"
        >
          {/* Left copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 14px", borderRadius: "100px",
              background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)",
              width: "fit-content",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
                Interactive Globe Platform
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              margin: 0,
            }}>
              See your world.<br />
              <span style={{ color: "var(--accent)" }}>In real-time 3D.</span>
            </h1>

            <p style={{ fontSize: "clamp(15px, 1.5vw, 18px)", color: "var(--muted)", lineHeight: 1.7, maxWidth: "480px", margin: 0 }}>
              GRIP 3D turns complex global data into interactive 3D globe experiences — for telecom, maritime, AI infrastructure, climate, energy, and beyond.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href="/use-cases"
                style={{
                  padding: "14px 28px", borderRadius: "12px",
                  background: "var(--accent)", color: "#000",
                  fontWeight: 700, fontSize: "14px", textDecoration: "none",
                  letterSpacing: "0.01em",
                }}
              >
                Browse All Demos →
              </Link>
              <Link
                href="/contact"
                style={{
                  padding: "14px 28px", borderRadius: "12px",
                  background: "transparent", color: "var(--accent)",
                  border: "1px solid var(--accent)",
                  fontWeight: 700, fontSize: "14px", textDecoration: "none",
                }}
              >
                Talk to us
              </Link>
            </div>

            {/* Trust strip */}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginTop: "8px" }}>
              {[
                { n: "12+", label: "Live Demos" },
                { n: "5", label: "Industries" },
                { n: "3D", label: "Globe Engine" },
              ].map(({ n, label }) => (
                <div key={label}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Globe */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: "min(520px, 100%)" }}>
              <GlobeWrapper />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOCUS RAIL: FEATURED DEMOS ── */}
      <section>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "clamp(40px, 5vw, 64px) 0 0",
        }}>
          <div style={{
            padding: "0 clamp(16px, 4vw, 48px)",
            marginBottom: "32px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}>
            <div>
              <div style={{
                display: "inline-flex", padding: "4px 12px", borderRadius: "100px",
                background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)",
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px",
              }}>
                Live Demo Showcase
              </div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>
                Pick a scenario. See the globe do the work.
              </h2>
            </div>
            <Link
              href="/use-cases"
              style={{ fontSize: "13px", color: "var(--accent)", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              View all {useCases.length} use cases →
            </Link>
          </div>
        </div>
        <FocusRail items={railItems} autoPlay={true} interval={5000} loop={true} />
      </section>

      {/* ── PLATFORM NUMBERS STRIP ── */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "clamp(32px, 4vw, 48px) clamp(16px, 4vw, 48px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "32px",
        }}>
          {[
            { n: "12+", label: "Live Globe Demos", sub: "and growing" },
            { n: "46", label: "Data Layers", sub: "in UC07 Demographics alone" },
            { n: "35K+", label: "Power Plants", sub: "geolocated in UC12" },
            { n: "26K+", label: "Radio Stations", sub: "playable in UC11" },
            { n: "60", label: "Satellite Passes", sub: "monitored in UC10 NTN" },
            { n: "25", label: "AI GPU Clusters", sub: "tracked in UC14" },
          ].map(({ n, label, sub }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 900, color: "var(--accent)", lineHeight: 1, letterSpacing: "-0.02em" }}>{n}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{label}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATFORM PILLARS ── */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(16px, 4vw, 48px)" }}>
          <div style={{ marginBottom: "48px" }}>
            <div style={{
              display: "inline-flex", padding: "4px 12px", borderRadius: "100px",
              background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)",
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px",
            }}>
              Platform
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--text)", margin: 0, maxWidth: "540px", letterSpacing: "-0.02em" }}>
              Built for enterprise teams who need to see the world as it is.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {[
              {
                icon: "🌐",
                title: "One Globe. Every Layer.",
                body: "Telecom beams, weather fronts, ship routes, AI clusters, earthquake alerts — all layerable on a single live globe. Toggle any dataset in real time.",
                accent: "var(--accent)",
              },
              {
                icon: "⚡",
                title: "Your Data, Your Stack.",
                body: "Connect your OSS, NMS, GIS, CRM, or live telemetry streams via partner APIs. White-label globe embeds. Deploy in your own infrastructure.",
                accent: "#c084fc",
              },
              {
                icon: "📡",
                title: "Built for Operators.",
                body: "Not a BI dashboard. Not a map widget. A purpose-built operational intelligence layer for NOC teams, fleet operators, and ML platform engineers.",
                accent: "#60a5fa",
              },
            ].map((p) => (
              <div
                key={p.title}
                style={{
                  padding: "28px",
                  borderRadius: "16px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  display: "flex", flexDirection: "column", gap: "16px",
                }}
              >
                <div style={{ fontSize: "36px", lineHeight: 1 }}>{p.icon}</div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>{p.title}</h3>
                  <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{p.body}</p>
                </div>
                <div style={{ height: "2px", width: "40px", borderRadius: "2px", background: p.accent, marginTop: "auto" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONSULTING / CONTACT ── */}
      <section
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "clamp(48px, 6vw, 80px) 0",
        }}
      >
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 48px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(32px, 5vw, 80px)",
          alignItems: "start",
        }}
        className="consulting-grid"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{
              display: "inline-flex", padding: "4px 12px", borderRadius: "100px",
              background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)",
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--accent)", width: "fit-content",
            }}>
              Consulting
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>
              Let&apos;s build something meaningful together.
            </h2>
            <p style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              We work with telcos, logistics companies, governments, and tech teams to design and deploy custom globe applications. White-label embeds, data integration, or full platform consulting.
            </p>
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "14px 16px", borderRadius: "12px",
              background: "var(--surface-2)", border: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: "20px" }}>✉️</span>
              <div>
                <div style={{ fontSize: "11px", color: "var(--muted)" }}>Direct email</div>
                <a href="mailto:connect@grip3d.com" style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
                  connect@grip3d.com
                </a>
              </div>
            </div>
          </div>
          <ConsultingForm />
        </div>
      </section>
    </>
  )
}

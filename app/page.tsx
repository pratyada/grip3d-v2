"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { ConsultingForm } from "@/components/ConsultingForm"
import { useCases } from "@/lib/data"
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero"
import { GridBeam } from "@/components/ui/background-grid-beam"

// Lazy-load the WebGL shader effect — keeps Three.js out of the initial JS bundle
const CanvasRevealEffect = dynamic(
  () => import("@/components/ui/canvas-reveal-effect").then((m) => ({ default: m.CanvasRevealEffect })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-black" />,
  }
)

// Lazy-load the 3D carousel so framer-motion animations don't block first paint
const FocusRail = dynamic(
  () => import("@/components/ui/focus-rail").then((m) => ({ default: m.FocusRail })),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 600, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>Loading demos…</span>
      </div>
    ),
  }
)

type FocusRailItem = {
  id: string | number
  title: string
  description?: string
  imageSrc: string
  href?: string
  meta?: string
}

const railItems: FocusRailItem[] = useCases
  .filter((uc) => uc.status === "live")
  .map((uc) => ({
    id: uc.id,
    title: uc.title,
    description: uc.description,
    imageSrc: uc.image,
    href: uc.demoUrl ?? `/use-cases/${uc.slug}`,
    meta: uc.category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
  }))

export default function HomePage() {
  return (
    <ScrollExpandMedia
      mediaType="video"
      mediaSrc="/demo-main.mp4"
      bgComponent={
        <CanvasRevealEffect
          colors={[[51, 204, 221], [100, 200, 255]]}
          dotSize={3}
          opacities={[0.15, 0.15, 0.2, 0.2, 0.3, 0.3, 0.5, 0.5, 0.7, 1]}
          containerClassName="bg-black"
        />
      }
      title="GRIP 3D"
      date="Interactive Globe Platform"
      scrollToExpand="↓ Scroll to explore"
      textBlend={false}
    >
      {/* ── GRIDBEAM HERO TEXT (shown after video expands) ── */}
      <section style={{ background: "var(--bg)", position: "relative" }}>
        <div
          style={{
            background: "var(--surface-2)",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Dark grid background pattern */}
          <div
            style={{
              background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(51,204,221,0.08) 0%, transparent 60%)",
              minHeight: "320px",
              position: "relative",
            }}
          >
            <GridBeam className="min-h-[320px] flex items-center justify-center">
              <div
                style={{
                  maxWidth: "900px",
                  margin: "0 auto",
                  padding: "clamp(48px, 6vw, 80px) clamp(16px, 4vw, 48px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "28px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {/* Badge */}
                <div style={{
                  display: "inline-flex", padding: "5px 14px", borderRadius: "100px",
                  background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--accent)",
                }}>
                  Layer-first · Partner APIs · Real-time 3D
                </div>

                {/* Main headline */}
                <h1 style={{
                  fontSize: "clamp(32px, 5vw, 60px)",
                  fontWeight: 900,
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                  margin: 0,
                }}>
                  Bring a global view into your perspective —{" "}
                  <span style={{ color: "var(--accent)" }}>
                    operational awareness in real-time 3D.
                  </span>
                </h1>

                {/* Sub */}
                <p style={{
                  fontSize: "clamp(15px, 1.8vw, 18px)",
                  color: "var(--muted)",
                  lineHeight: 1.75,
                  maxWidth: "640px",
                  margin: 0,
                }}>
                  GRIP 3D transforms complex global data into interactive globe experiences — for telecom, maritime, AI infrastructure, energy, climate, and beyond.
                </p>

                {/* CTAs */}
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
                  <Link
                    href="/use-cases"
                    style={{
                      padding: "14px 32px", borderRadius: "12px",
                      background: "var(--accent)", color: "#000",
                      fontWeight: 700, fontSize: "15px", textDecoration: "none",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Browse Demos →
                  </Link>
                  <Link
                    href="/contact"
                    style={{
                      padding: "14px 32px", borderRadius: "12px",
                      background: "transparent", color: "var(--accent)",
                      border: "1px solid var(--accent)",
                      fontWeight: 700, fontSize: "15px", textDecoration: "none",
                    }}
                  >
                    Talk to us
                  </Link>
                </div>

                {/* Trust row */}
                <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", justifyContent: "center", marginTop: "4px" }}>
                  {[
                    { n: "30+", label: "Live Globe Demos" },
                    { n: "12", label: "Industries" },
                    { n: "Real-time", label: "3D Globe Engine" },
                  ].map(({ n, label }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{n}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </GridBeam>
          </div>
        </div>
      </section>

      {/* ── FOCUS RAIL ── */}
      <section style={{ background: "var(--bg)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(48px, 5vw, 64px) 0 0" }}>
          <div style={{
            padding: "0 clamp(16px, 4vw, 48px)",
            marginBottom: "28px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
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
              <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>
                Pick a scenario. See the globe do the work.
              </h2>
            </div>
            <Link href="/use-cases" style={{ fontSize: "13px", color: "var(--accent)", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
              View all {useCases.length} use cases →
            </Link>
          </div>
        </div>
        <FocusRail items={railItems} autoPlay={true} interval={5000} loop={true} />
      </section>

      {/* ── PLATFORM NUMBERS ── */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "clamp(32px, 4vw, 56px) clamp(16px, 4vw, 48px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "32px",
        }}>
          {[
            { n: "30+", label: "Live Globe Demos", sub: "and growing" },
            { n: "100+", label: "Data Layers", sub: "across all use cases" },
            { n: "6,000+", label: "Satellites Tracked", sub: "Starlink + debris" },
            { n: "500+", label: "Natural Hazards", sub: "real-time monitoring" },
            { n: "243", label: "UNESCO Heritage Sites", sub: "across 168 countries" },
            { n: "8.98M", label: "Cell Towers Mapped", sub: "global density" },
          ].map(({ n, label, sub }) => (
            <div key={label}>
              <div style={{ fontSize: "clamp(28px, 3vw, 42px)", fontWeight: 900, color: "var(--accent)", lineHeight: 1, letterSpacing: "-0.02em" }}>{n}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{label}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section style={{ background: "var(--bg)", padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(16px, 4vw, 48px)" }}>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: "var(--text)", margin: "0 0 36px", maxWidth: "500px", letterSpacing: "-0.02em" }}>
            Built for enterprise teams who need to see the world as it is.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { icon: "🌐", title: "One Globe. Every Layer.", body: "Telecom beams, weather fronts, ship routes, AI clusters, earthquake alerts — all layerable on a single live globe. Toggle any dataset in real time.", accent: "var(--accent)" },
              { icon: "⚡", title: "Your Data, Your Stack.", body: "Connect OSS, NMS, GIS, CRM, or live telemetry streams via partner APIs. White-label globe embeds. Deploy in your own infrastructure.", accent: "#c084fc" },
              { icon: "📡", title: "Built for Operators.", body: "Not a BI dashboard. Not a map widget. A purpose-built operational intelligence layer for NOC teams, fleet operators, and ML platform engineers.", accent: "#60a5fa" },
            ].map((p) => (
              <div key={p.title} style={{ padding: "28px", borderRadius: "16px", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ fontSize: "32px", lineHeight: 1 }}>{p.icon}</div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>{p.title}</h3>
                  <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{p.body}</p>
                </div>
                <div style={{ height: "2px", width: "36px", borderRadius: "2px", background: p.accent, marginTop: "auto" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONSULTING ── */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(16px, 4vw, 48px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(32px, 5vw, 72px)", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: "100px", background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", width: "fit-content" }}>Consulting</div>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>
                Let&apos;s build something meaningful together.
              </h2>
              <p style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                Telcos, logistics companies, governments, and tech teams — we design and deploy custom globe applications. White-label embeds, data integration, or full platform consulting.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--border)", width: "fit-content" }}>
                <span style={{ fontSize: "20px" }}>✉️</span>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>Direct email</div>
                  <a href="mailto:connect@grip3d.com" style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>connect@grip3d.com</a>
                </div>
              </div>
            </div>
            <ConsultingForm />
          </div>
        </div>
      </section>

    </ScrollExpandMedia>
  )
}

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Satellite NTN + Ground Stations — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Satellite NTN + Ground Stations use case: TLE/orbital data ingestion, beam footprint computation, gateway health polling, 3D globe rendering, KPI overlay, and NOC alert integration.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "TLE / Orbital Data Ingestion",
    icon: "📡",
    color: "#33ccdd",
    desc: "Two-Line Element (TLE) sets for all tracked satellites are fetched from CelesTrak and Space-Track, covering LEO, MEO, and GEO constellations. Orbital elements are cached server-side and refreshed at configurable intervals to balance freshness with API rate limits.",
    tech: ["CelesTrak GP API", "Space-Track.org", "TLE / OMM v2.0", "NORAD catalogue"],
  },
  {
    n: "02",
    title: "Beam Footprint Computation",
    icon: "📶",
    color: "#5588ff",
    desc: "Per-satellite beam footprints are computed from the orbital position, elevation mask, and antenna half-angle parameters. Coverage polygons are generated as GeoJSON features and projected onto the globe surface for each active beam.",
    tech: ["SGP4 propagation", "Elevation mask geometry", "GeoJSON polygon output", "Half-angle projection"],
  },
  {
    n: "03",
    title: "Gateway Health Polling",
    icon: "🔁",
    color: "#ff8844",
    desc: "Ground station gateways are polled via REST or SNMP endpoints at configurable intervals. Uplink/downlink status, signal strength, EIRP, and latency metrics are collected, normalized, and stored in a time-series buffer for KPI aggregation.",
    tech: ["REST / SNMP polling", "EIRP / link budget", "Signal strength metrics", "Time-series buffer"],
  },
  {
    n: "04",
    title: "3D Globe Rendering",
    icon: "🌐",
    color: "#cc44ff",
    desc: "Satellite positions, ground station markers, beam footprint polygons, and orbit arc tracks are rendered on a globe.gl WebGL globe. The scene is updated every 5 seconds with fresh propagated positions and live gateway health color coding.",
    tech: ["globe.gl 2.x", "Three.js WebGL", "GeoJSON polygon layer", "Orbit arc paths"],
  },
  {
    n: "05",
    title: "KPI Overlay",
    icon: "📊",
    color: "#44ff88",
    desc: "NOC-grade KPIs — link availability, beam utilization, handover rate, and signal degradation indicators — are overlaid directly on the globe as color-coded heat zones and per-satellite badges, giving operators immediate operational awareness.",
    tech: ["Link availability KPI", "Beam utilization", "Handover rate", "Signal degradation heatmap"],
  },
  {
    n: "06",
    title: "Alert Integration",
    icon: "🚨",
    color: "#ffcc00",
    desc: "Threshold-based alerts for signal outages, gateway failures, and coverage gaps are generated in real time and surfaced in the globe UI as pulsing markers. Webhook and email integration allows NOC teams to route alerts to existing incident management systems.",
    tech: ["Threshold alerting", "Pulsing marker UI", "Webhook integration", "Email / PagerDuty routing"],
  },
]

const STATS = [
  { val: "40+",         label: "Satellites tracked",   icon: "🛰️" },
  { val: "5",           label: "Orbital shells",        icon: "🔵" },
  { val: "Multi-const.", label: "Constellation support", icon: "🌐" },
  { val: "Live",        label: "Beam footprints",       icon: "📶" },
  { val: "NOC-ready",   label: "Alert integration",     icon: "🚨" },
  { val: "REST / SNMP", label: "API integrations",      icon: "🔁" },
  { val: "5 s",         label: "Position refresh",      icon: "⏱" },
  { val: "GEO/MEO/LEO", label: "Orbit classes",         icon: "🛸" },
]

const TECH_STACK = [
  { label: "Globe renderer",  value: "globe.gl + Three.js",   icon: "🌐" },
  { label: "Orbital engine",  value: "SGP4 via satellite.js", icon: "🧮" },
  { label: "Orbital data",    value: "TLE / SGP4",            icon: "📡" },
  { label: "GPU rendering",   value: "WebGL",                 icon: "🖥" },
  { label: "Framework",       value: "Next.js App Router",    icon: "⚡" },
  { label: "Coverage zones",  value: "GeoJSON polygons",      icon: "📐" },
  { label: "KPI pipeline",    value: "REST / SNMP polling",   icon: "🔁" },
  { label: "Alert routing",   value: "Webhook / email",       icon: "🚨" },
]

const HIGHLIGHTS = [
  "Live satellite orbit tracks and coverage footprints for LEO, MEO, and GEO",
  "Ground station locations with real-time uplink/downlink status indicators",
  "Per-beam footprint visualization computed from orbital geometry and elevation masks",
  "Signal strength and latency heatmaps overlaid on the globe surface",
  "Multi-constellation support — LEO phased arrays, MEO broadband, GEO fixed",
  "NOC alert integration via webhook and email for outage and degradation events",
]

export default function UC1DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/demo/uc1/index.html"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}
          >
            ← Live Demo
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 01</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🛰️</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Satellite NTN + Ground Stations</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          Visualize full non-terrestrial network operations in real-time 3D — satellite orbits, ground station
          locations, beam footprints, and signal health metrics on a live globe, purpose-built for telecom NOC teams.
        </p>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
        {STATS.map(f => (
          <div key={f.label} className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="text-2xl block mb-1">{f.icon}</span>
            <p className="text-xl font-bold mb-0.5" style={{ color: "var(--accent)" }}>{f.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{f.label}</p>
          </div>
        ))}
      </div>

      {/* ── Data pipeline ───────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          From orbital mechanics data to live NOC-ready globe visualization in six steps.
        </p>
        <div className="relative">
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #33ccdd44, #44ff8844)" }} />
          <div className="flex flex-col gap-4">
            {PIPELINE_STEPS.map((step) => (
              <div key={step.n} className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl z-10"
                  style={{ background: step.color + "20", border: `1px solid ${step.color}44` }}>
                  {step.icon}
                </div>
                <div className="flex-1 rounded-xl p-4"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold" style={{ color: step.color }}>{step.n}</span>
                    <h3 className="font-semibold" style={{ color: "var(--text)" }}>{step.title}</h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{step.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {step.tech.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded text-xs font-mono"
                        style={{ background: "var(--surface-2)", color: "var(--muted)" }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tech stack ──────────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Tech Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TECH_STACK.map(t => (
            <div key={t.label} className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-xl block mb-2">{t.icon}</span>
              <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--text)" }}>{t.value}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Highlights ──────────────────────────────────────────────────── */}
      <div className="mb-16 rounded-2xl p-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
          🛰️ Key Capabilities
        </h2>
        <ul className="space-y-3">
          {HIGHLIGHTS.map(h => (
            <li key={h} className="flex items-start gap-3">
              <span style={{ color: "var(--accent)" }} className="mt-0.5 flex-shrink-0">✓</span>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{h}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-8 text-center"
        style={{ background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)" }}>
        <p className="text-2xl font-bold mb-3" style={{ color: "var(--text)" }}>
          Ready to visualize your NTN infrastructure?
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          See your satellite network, ground stations, and beam footprints on a live 3D globe — purpose-built for NOC operations teams.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          Request a Demo
        </Link>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Plate Boundaries, Earthquakes & Volcanoes — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Earthquakes & Volcanoes use case: USGS earthquake feed, magnitude filtering, tectonic plate GeoJSON, volcano catalogue, seismic risk zone computation, and globe rendering.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "USGS Earthquake Feed",
    icon: "📡",
    color: "#ff4444",
    desc: "The USGS Earthquake Hazards Program provides a real-time GeoJSON feed updated every minute for earthquakes worldwide M1.0 and above. The feed includes event ID, magnitude, depth, location description, time, and significance score.",
    tech: ["USGS Earthquake API", "GeoJSON feed (1-min)", "M1.0+ global coverage", "Significance score"],
  },
  {
    n: "02",
    title: "Magnitude Filtering",
    icon: "🔬",
    color: "#ff6600",
    desc: "Earthquake events are filtered by magnitude threshold, time window (past 24h / 7 days / 30 days), and depth (shallow < 70 km, intermediate 70–300 km, deep > 300 km). Filtered events are assigned color and size scales for globe rendering.",
    tech: ["Magnitude threshold filter", "24h / 7d / 30d windows", "Depth classification", "Color-size encoding"],
  },
  {
    n: "03",
    title: "Tectonic Plate GeoJSON",
    icon: "🌍",
    color: "#ff8844",
    desc: "The 15 major tectonic plates are rendered from a GeoJSON boundary dataset (Bird 2003 model). Plate boundaries are classified by type — convergent (subduction), divergent (mid-ocean ridge), and transform — and styled accordingly on the globe.",
    tech: ["Bird 2003 plate model", "15 major plates", "Convergent / divergent / transform", "Styled boundary lines"],
  },
  {
    n: "04",
    title: "Volcano Catalogue",
    icon: "🌋",
    color: "#cc44ff",
    desc: "The Smithsonian Global Volcanism Program (GVP) catalogue provides 1,500+ volcano locations with eruption status, elevation, volcano type, and last eruption date. Active and dormant volcano markers are styled by current alert level from GVP weekly reports.",
    tech: ["GVP catalogue", "1,500+ volcanoes", "Alert level styling", "Eruption history"],
  },
  {
    n: "05",
    title: "Seismic Risk Zone Computation",
    icon: "⚠️",
    color: "#44ff88",
    desc: "USGS National Seismic Hazard Model and GSHAP global seismic hazard GeoJSON are used to render probabilistic ground motion zones. Tsunami risk zones from the NOAA DART system are overlaid for coastal event correlation.",
    tech: ["USGS NSHM hazard model", "GSHAP risk GeoJSON", "NOAA DART tsunami zones", "PGA probability contours"],
  },
  {
    n: "06",
    title: "Globe Rendering",
    icon: "🌐",
    color: "#ffcc00",
    desc: "Earthquake events, tectonic plate boundaries, volcano markers, and seismic hazard zones are composited on a globe.gl WebGL globe. Earthquakes pulse with animated rings scaled to magnitude. Click any event for depth, time, magnitude, and regional context.",
    tech: ["globe.gl + Three.js", "WebGL polygon layer", "Magnitude pulse animation", "Click-through event detail"],
  },
]

const STATS = [
  { val: "M1.0+",     label: "Earthquakes tracked",  icon: "📡" },
  { val: "15",        label: "Tectonic plates",       icon: "🌍" },
  { val: "1,500+",    label: "Volcanoes",             icon: "🌋" },
  { val: "Live",      label: "USGS feed",             icon: "⏱" },
  { val: "Seismic",   label: "Risk zones",            icon: "⚠️" },
  { val: "Tsunami",   label: "Alert zones",           icon: "🌊" },
  { val: "Depth",     label: "Classification bands",  icon: "📐" },
  { val: "GVP",       label: "Volcano authority",     icon: "🏛" },
]

const TECH_STACK = [
  { label: "Earthquake data",  value: "USGS GeoJSON API",      icon: "📡" },
  { label: "Globe renderer",   value: "globe.gl + Three.js",   icon: "🌐" },
  { label: "GPU rendering",    value: "WebGL",                 icon: "🖥" },
  { label: "Plate boundaries", value: "Bird 2003 GeoJSON",     icon: "🌍" },
  { label: "Volcanoes",        value: "GVP catalogue",         icon: "🌋" },
  { label: "Seismic hazard",   value: "USGS NSHM / GSHAP",    icon: "⚠️" },
  { label: "Tsunami zones",    value: "NOAA DART system",      icon: "🌊" },
  { label: "Framework",        value: "Next.js App Router",    icon: "⚡" },
]

const HIGHLIGHTS = [
  "Live USGS earthquake feed (M1.0+) with 1-minute update cadence worldwide",
  "Tectonic plate boundary visualization for all 15 major plates, classified by boundary type",
  "Active and dormant volcano locations from the Smithsonian GVP catalogue",
  "Seismic hazard risk zones from USGS NSHM probabilistic ground motion models",
  "Historical earthquake magnitude heatmap with configurable time window",
  "Tsunami alert zone overlays correlated with coastal seismic events",
]

export default function UC8DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/demo/uc8/index.html"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}
          >
            ← Live Demo
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 08</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🌋</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Plate Boundaries, Earthquakes &amp; Volcanoes</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          Monitor the Earth&apos;s geological pulse in real-time — tectonic plate boundaries, live USGS earthquake
          feeds, active volcano status, and seismic risk zones on a high-fidelity globe.
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
          From USGS earthquake feeds and GVP volcano catalogue to animated seismic globe in six steps.
        </p>
        <div className="relative">
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #ff444444, #44ff8844)" }} />
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
          🌋 Key Capabilities
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
          Monitor geological hazards in real time
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          Live USGS earthquakes, 1,500+ volcanoes, and seismic hazard zones on a single 3D globe — built for risk analysis and geoscience teams.
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

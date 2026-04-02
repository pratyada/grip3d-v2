import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Air Quality Index, Pollen & Stations — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Air Quality Index use case: OpenAQ data ingestion, AQI calculation (US EPA formula), PM2.5/PM10/NO2/O3 layer split, pollen index overlay, WHO threshold alerting, and globe rendering.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "OpenAQ Data Ingestion",
    icon: "📡",
    color: "#44bb88",
    desc: "Real-time air quality measurements are ingested from OpenAQ's 30,000+ monitoring stations across 100+ countries. The OpenAQ v3 API provides station metadata, sensor locations, and the latest measurements for PM2.5, PM10, NO2, O3, CO, and SO2 pollutants.",
    tech: ["OpenAQ v3 API", "30,000+ stations", "100+ countries", "6 pollutant parameters"],
  },
  {
    n: "02",
    title: "AQI Calculation (US EPA Formula)",
    icon: "🧮",
    color: "#88cc44",
    desc: "Raw pollutant concentrations (µg/m³) are converted to AQI using the US EPA NowCast algorithm. Breakpoint tables for PM2.5, PM10, O3, NO2, CO, and SO2 are applied to compute sub-index values. The overall AQI is the maximum sub-index across all measured pollutants.",
    tech: ["US EPA NowCast AQI", "Breakpoint table lookup", "Sub-index computation", "Max sub-index aggregation"],
  },
  {
    n: "03",
    title: "PM2.5 / PM10 / NO2 / O3 Layer Split",
    icon: "🔬",
    color: "#ccaa44",
    desc: "Four primary pollutant layers are computed independently as interpolated surface grids using inverse-distance weighting (IDW) from station measurements. Each layer is normalized to its WHO guideline value for comparability across pollutants.",
    tech: ["IDW spatial interpolation", "WHO guideline normalization", "4 independent layers", "Station measurement grid"],
  },
  {
    n: "04",
    title: "Pollen Index Overlay",
    icon: "🌸",
    color: "#ff8844",
    desc: "Pollen concentration data from SILAM/CAMS pollen forecast model output is processed for tree, grass, and weed pollen types by season. Daily pollen index values are mapped to a 0–5 scale (Low to Very High) for overlay on the globe.",
    tech: ["SILAM / CAMS pollen model", "Tree / grass / weed types", "Seasonal filtering", "0–5 index scale"],
  },
  {
    n: "05",
    title: "WHO Threshold Alerting",
    icon: "⚠️",
    color: "#ff4466",
    desc: "Stations where AQI or individual pollutant concentrations exceed WHO Air Quality Guidelines (2021 revision) are flagged for visual alerting on the globe. Exceedance severity is classified into WHO bands (Good / Moderate / Unhealthy for Sensitive / Unhealthy / Very Unhealthy / Hazardous).",
    tech: ["WHO AQI 2021 guidelines", "6 severity bands", "Per-pollutant exceedance", "Visual alert flagging"],
  },
  {
    n: "06",
    title: "Globe Rendering",
    icon: "🌐",
    color: "#33ccdd",
    desc: "Station dots, AQI heatmap tiles, individual pollutant layers, and pollen index overlay are composited on a globe.gl WebGL globe. Layer switching, AQI color scale legend, and click-through for station trend charts are all handled in real time.",
    tech: ["globe.gl + Three.js", "WebGL heatmap layer", "Layer toggle controls", "Station trend charts"],
  },
]

const STATS = [
  { val: "30,000+",  label: "Monitoring stations",  icon: "📡" },
  { val: "100+",     label: "Countries",             icon: "🌍" },
  { val: "AQI",      label: "Heatmap layer",         icon: "🗺" },
  { val: "4",        label: "Pollutant layers",      icon: "🔬" },
  { val: "Pollen",   label: "Index overlay",         icon: "🌸" },
  { val: "WHO",      label: "Threshold alerts",      icon: "⚠️" },
  { val: "EPA",      label: "AQI standard",          icon: "🏛" },
  { val: "Real-time","label": "Station updates",      icon: "⏱" },
]

const TECH_STACK = [
  { label: "AQ data",        value: "OpenAQ v3 API",         icon: "📡" },
  { label: "Globe renderer", value: "globe.gl + Three.js",   icon: "🌐" },
  { label: "GPU rendering",  value: "WebGL",                 icon: "🖥" },
  { label: "AQI formula",    value: "US EPA NowCast",        icon: "🧮" },
  { label: "AQI standard",   value: "WHO AQI 2021",          icon: "🏛" },
  { label: "Pollen model",   value: "SILAM / CAMS",          icon: "🌸" },
  { label: "Interpolation",  value: "IDW spatial grid",      icon: "📐" },
  { label: "Framework",      value: "Next.js App Router",    icon: "⚡" },
]

const HIGHLIGHTS = [
  "Live AQI data from 30,000+ OpenAQ monitoring stations across 100+ countries",
  "PM2.5, PM10, NO2, and O3 layer toggles with independent IDW-interpolated surface grids",
  "Pollen index overlay by season and region from SILAM/CAMS forecast model",
  "WHO threshold alert visualization with 6-band severity classification",
  "City-level trend charts on station click with historical comparison",
  "Historical comparison by date range for seasonal and trend analysis",
]

export default function UC13DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/demo/uc13/index.html"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}
          >
            ← Live Demo
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 13</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🌿</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Air Quality Index, Pollen &amp; Stations</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          A real-time public health layer for the globe — live AQI heatmaps from OpenAQ&apos;s 30,000+
          monitoring stations, four pollutant layers, pollen index, and WHO threshold alerts.
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
          From OpenAQ station measurements to AQI heatmap globe in six steps.
        </p>
        <div className="relative">
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #44bb8844, #33ccdd44)" }} />
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
          🌿 Key Capabilities
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
          Monitor air quality across the globe in real time
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          Live AQI heatmaps, 4 pollutant layers, and pollen index on a single 3D globe — built for public health, environmental, and urban planning teams.
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

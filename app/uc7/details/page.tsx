import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Demographics & Population — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Demographics & Population use case: World Bank/UN data ingestion, country polygon mapping, layer normalization, H3 density binning, migration arc computation, and globe rendering.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "World Bank / UN Data Ingestion",
    icon: "🏛",
    color: "#33ccdd",
    desc: "46 demographic indicators are fetched from the World Bank Indicators API and UN Population Division datasets. Series include population totals, growth rates, fertility rates, life expectancy, migration net flows, age structure distributions, and urbanization metrics.",
    tech: ["World Bank Indicators API", "UN Population Division", "46 indicator series", "Multi-year time series"],
  },
  {
    n: "02",
    title: "Country Polygon Mapping",
    icon: "🗺",
    color: "#5588ff",
    desc: "ISO-3166 country codes from the data APIs are joined to Natural Earth GeoJSON country polygons at 50 m and 110 m resolution. Each polygon feature is enriched with the full demographic attribute set for the selected indicator and year.",
    tech: ["Natural Earth GeoJSON", "ISO-3166 code join", "50 m / 110 m resolution", "Feature attribute merge"],
  },
  {
    n: "03",
    title: "Layer Normalization",
    icon: "📐",
    color: "#ff8844",
    desc: "Each demographic indicator is normalized using min-max scaling across all 195 countries for the current reference year. Log-scale normalization is applied for highly skewed distributions (e.g., population totals) to prevent large countries from dominating the color range.",
    tech: ["Min-max normalization", "Log-scale for skewed data", "195-country range", "Per-layer scaling"],
  },
  {
    n: "04",
    title: "H3 Density Binning",
    icon: "⬡",
    color: "#cc44ff",
    desc: "For population density layers, gridded population data (GPW v4 / WorldPop) is binned into H3 hexagonal cells at resolution 3–5. H3 density provides sub-country granularity, revealing within-country population concentration patterns invisible at the country level.",
    tech: ["GPW v4 / WorldPop grids", "H3-js resolution 3–5", "Sub-country granularity", "Density normalization"],
  },
  {
    n: "05",
    title: "Migration Arc Computation",
    icon: "✈️",
    color: "#44ff88",
    desc: "UN bilateral migration stock data (origin/destination pairs) is converted to great-circle arcs with stroke width and color scaled to migration volume. Arcs are culled to the top N flows per selected region to maintain visual clarity on the globe.",
    tech: ["UN bilateral migration", "Great-circle arcs", "Volume-scaled stroke", "Top-N culling"],
  },
  {
    n: "06",
    title: "Globe Rendering",
    icon: "🌐",
    color: "#ffcc00",
    desc: "Country polygons color-coded by the active demographic layer, H3 density hexagons, and migration arcs are composited on a globe.gl WebGL globe. Layer switching, year scrubbing, and country click-through for full indicator profiles are all handled in real time.",
    tech: ["globe.gl + Three.js", "WebGL polygon layer", "H3 hex overlay", "Arc animation"],
  },
]

const STATS = [
  { val: "46",      label: "Data layers",          icon: "📊" },
  { val: "195",     label: "Countries",             icon: "🌍" },
  { val: "Live",    label: "Migration arcs",        icon: "✈️" },
  { val: "H3",      label: "Population density",   icon: "⬡" },
  { val: "60+ yrs", label: "Historical trends",    icon: "📅" },
  { val: "Age",     label: "Structure pyramids",   icon: "👥" },
  { val: "UN",      label: "Data authority",       icon: "🏛" },
  { val: "GPW v4",  label: "Population grid",      icon: "🗺" },
]

const TECH_STACK = [
  { label: "Primary data",   value: "World Bank API",       icon: "🏛" },
  { label: "UN data",        value: "UN Population Division",icon: "🌍" },
  { label: "Globe renderer", value: "globe.gl + Three.js",  icon: "🌐" },
  { label: "Hex binning",    value: "H3-js",                icon: "⬡" },
  { label: "GPU rendering",  value: "Three.js / WebGL",     icon: "🖥" },
  { label: "Country shapes", value: "Natural Earth GeoJSON",icon: "📐" },
  { label: "Population grid","value": "GPW v4 / WorldPop",  icon: "🗺" },
  { label: "Framework",      value: "Next.js App Router",   icon: "⚡" },
]

const HIGHLIGHTS = [
  "46 configurable demographic data layers from World Bank and UN datasets",
  "Population density and growth overlays with sub-country H3 hex resolution",
  "Migration flow arcs by origin/destination scaled to bilateral migration volume",
  "Age structure pyramids by country for fertility, mortality, and dependency analysis",
  "Fertility and mortality rate heatmaps across 60+ years of historical data",
  "Urban vs. rural distribution layers with country-level click-through profiles",
]

export default function UC7DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/demo/uc7/index.html"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}
          >
            ← Live Demo
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 07</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">📊</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Demographics &amp; Population</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          Explore 46 demographic and population datasets rendered on a single interactive globe —
          migration arcs, density hexagons, age structures, and 60+ years of historical trends.
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
          From World Bank and UN demographic datasets to animated globe visualization in six steps.
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
          📊 Key Capabilities
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
          Explore global population data in 3D
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          46 demographic layers, migration arcs, and population density hexagons on a single interactive globe — built for research and planning teams.
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

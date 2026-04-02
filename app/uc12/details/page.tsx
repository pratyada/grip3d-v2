import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Country Energy Profile & Power Plants — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Country Energy Profile use case: Global Power Plant Database ingestion, fuel type classification, installed capacity aggregation, country energy profile computation, renewable vs fossil split, and globe rendering.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "Global Power Plant Database Ingestion",
    icon: "⚡",
    color: "#ffcc00",
    desc: "The World Resources Institute Global Power Plant Database (GPPD) provides 35,000+ power plant records with location, installed capacity (MW), primary and secondary fuel type, commissioning year, and annual generation estimates. The dataset covers 167 countries.",
    tech: ["WRI GPPD dataset", "35,000+ power plants", "167 countries", "MW capacity + coordinates"],
  },
  {
    n: "02",
    title: "Fuel Type Classification",
    icon: "🏭",
    color: "#ff8844",
    desc: "Power plants are classified into 10 fuel type categories: Coal, Gas, Oil, Nuclear, Hydro, Wind, Solar, Biomass, Geothermal, and Other. A color palette is assigned per fuel type for consistent visual encoding across globe markers and country profile charts.",
    tech: ["10 fuel categories", "WRI fuel type mapping", "Color palette encoding", "Primary + secondary fuel"],
  },
  {
    n: "03",
    title: "Installed Capacity Aggregation",
    icon: "📊",
    color: "#44ff88",
    desc: "Per-country installed capacity is aggregated by fuel type from individual plant records. Total GW by country and per-fuel breakdown are computed for the country profile panel. Capacity density (MW per km²) is computed for comparative overlay.",
    tech: ["Country-level aggregation", "GW total per fuel type", "MW/km² density", "Capacity ranking"],
  },
  {
    n: "04",
    title: "Country Energy Profile Computation",
    icon: "🌍",
    color: "#5588ff",
    desc: "Each country's energy profile — total installed capacity, generation mix, per-capita capacity, and net import/export balance — is computed from aggregated plant data and supplemented with IEA generation statistics for countries with data gaps.",
    tech: ["IEA statistics supplement", "Per-capita capacity", "Net import/export balance", "Generation mix %"],
  },
  {
    n: "05",
    title: "Renewable vs Fossil Split",
    icon: "♻️",
    color: "#33ccdd",
    desc: "Renewable share (Wind + Solar + Hydro + Geothermal + Biomass as % of total installed capacity) is computed per country and used to color-code country polygons on the globe — from deep green (high renewable share) to red (fossil-heavy mix).",
    tech: ["Renewable share %", "Fossil dependency index", "Green-to-red color scale", "Country polygon coloring"],
  },
  {
    n: "06",
    title: "Globe Rendering",
    icon: "🌐",
    color: "#cc44ff",
    desc: "35,000+ power plant dots color-coded by fuel type and country polygons shaded by renewable share are rendered on a globe.gl WebGL globe. Click any plant for name, capacity, fuel, and commissioning year. Click any country for full energy profile.",
    tech: ["globe.gl + Three.js", "WebGL point + polygon layer", "Click-through plant detail", "Country profile panel"],
  },
]

const STATS = [
  { val: "35,000+",  label: "Power plants",         icon: "⚡" },
  { val: "167",      label: "Countries",             icon: "🌍" },
  { val: "10",       label: "Fuel types",            icon: "🏭" },
  { val: "GW",       label: "Installed capacity",   icon: "📊" },
  { val: "Renewable","label": "Share indicator",     icon: "♻️" },
  { val: "Grid",     label: "Connectivity data",    icon: "🔌" },
  { val: "IEA",      label: "Generation stats",     icon: "🏛" },
  { val: "WRI GPPD", label: "Primary data source",  icon: "📐" },
]

const TECH_STACK = [
  { label: "Plant data",     value: "WRI Global Power Plant DB", icon: "⚡" },
  { label: "Globe renderer", value: "globe.gl + Three.js",       icon: "🌐" },
  { label: "GPU rendering",  value: "WebGL",                     icon: "🖥" },
  { label: "Zone data",      value: "GeoJSON country polygons",  icon: "📐" },
  { label: "Gen stats",      value: "IEA generation data",       icon: "🏛" },
  { label: "Capacity",       value: "MW / GW aggregation",       icon: "📊" },
  { label: "Framework",      value: "Next.js App Router",        icon: "⚙️" },
  { label: "Fuel colors",    value: "10-type color palette",     icon: "🎨" },
]

const HIGHLIGHTS = [
  "35,000+ power plants with location, installed capacity, and fuel type from WRI GPPD",
  "Color-coded by energy source type across 10 fuel categories for instant visual identification",
  "National installed capacity by country with per-fuel GW breakdown panels",
  "Renewable vs. fossil fuel energy share per country on a green-to-red color scale",
  "Grid connectivity and transmission line overlay for infrastructure analysis",
  "Energy production vs. consumption comparison with IEA generation statistics",
]

export default function UC12DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/demo/uc12/index.html"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}
          >
            ← Live Demo
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 12</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">⚡</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Country Energy Profile &amp; Power Plants</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          A comprehensive globe of global energy infrastructure — 35,000+ power plants geolocated and
          color-coded by fuel type, with country-level renewable vs. fossil capacity profiles.
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
          From the WRI Global Power Plant Database to animated energy globe in six steps.
        </p>
        <div className="relative">
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #ffcc0044, #33ccdd44)" }} />
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
          ⚡ Key Capabilities
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
          Visualize global energy infrastructure
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          35,000+ power plants and 167-country energy profiles on a live 3D globe — built for energy analysts, policy teams, and ESG researchers.
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

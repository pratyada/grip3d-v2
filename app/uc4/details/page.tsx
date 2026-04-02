import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Weather & Meteorological Layers — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Weather & Meteorological Layers use case: weather API ingestion, raster tile processing, storm track modelling, wind/altitude layers, forecast blending, and globe rendering.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "Weather API Ingestion",
    icon: "🌩",
    color: "#33ccdd",
    desc: "Live and forecast meteorological data is ingested from OpenWeatherMap, NOAA, and Copernicus APIs. Observations, model output, and radar returns are fetched on configurable schedules with edge-side caching to respect API rate limits and latency budgets.",
    tech: ["OpenWeatherMap API", "NOAA NWS feeds", "Copernicus ERA5", "Edge caching"],
  },
  {
    n: "02",
    title: "Raster Tile Processing",
    icon: "🗂",
    color: "#5588ff",
    desc: "Global weather grids (precipitation, temperature, cloud cover, pressure) are delivered as GeoTIFF rasters or GRIB2 model outputs, reprojected to Web Mercator, tiled at multiple zoom levels, and served as PNG/WebP tiles for efficient progressive loading.",
    tech: ["GeoTIFF / GRIB2 parsing", "Web Mercator reprojection", "XYZ tile pyramid", "PNG / WebP output"],
  },
  {
    n: "03",
    title: "Storm Track Modelling",
    icon: "🌀",
    color: "#ff8844",
    desc: "Tropical cyclone and severe storm tracks are derived from NHC and JTWC advisories. Forecast cone polygons and intensity estimates are parsed from official advisories, converted to GeoJSON, and rendered as animated arcs with confidence radius bands.",
    tech: ["NHC / JTWC advisories", "Forecast cone GeoJSON", "Intensity classification", "Confidence bands"],
  },
  {
    n: "04",
    title: "Wind / Altitude Layers",
    icon: "💨",
    color: "#cc44ff",
    desc: "Wind speed and direction at multiple pressure levels (850 hPa, 500 hPa, 250 hPa jet stream) are sampled from GFS model output. Wind shear between altitude bands is computed and used to generate flight-safety advisory overlays on the globe.",
    tech: ["GFS pressure-level winds", "Wind shear computation", "850 / 500 / 250 hPa layers", "Jet stream path"],
  },
  {
    n: "05",
    title: "Forecast Blending",
    icon: "🔭",
    color: "#44ff88",
    desc: "Nowcast radar observations and NWP model forecasts are temporally blended using a linear weighting scheme. The 0–2 hour window prioritizes radar, with model forecast weight increasing beyond that horizon out to the 72-hour forecast limit.",
    tech: ["Nowcast / NWP blending", "Temporal weighting", "0–72 hour horizon", "Ensemble mean"],
  },
  {
    n: "06",
    title: "Globe Rendering",
    icon: "🌐",
    color: "#ffcc00",
    desc: "Precipitation radar, storm tracks, wind shear zones, lightning strikes, and temperature overlays are composited on a globe.gl WebGL globe. Layers are toggled in real time with smooth opacity transitions and configurable forecast time scrubbing.",
    tech: ["globe.gl + Three.js", "WebGL tile layer", "Opacity transitions", "Forecast time scrubber"],
  },
]

const STATS = [
  { val: "72-hour",    label: "Forecast horizon",    icon: "🔭" },
  { val: "Global",     label: "Radar coverage",      icon: "🌍" },
  { val: "Live",       label: "Storm tracks",         icon: "🌀" },
  { val: "Wind shear", label: "Altitude layers",      icon: "💨" },
  { val: "Live",       label: "Lightning strikes",    icon: "⚡" },
  { val: "Multi-param","label": "Overlay parameters", icon: "📊" },
  { val: "GFS/ERA5",   label: "Model sources",        icon: "🌩" },
  { val: "Tile-based", label: "Raster delivery",      icon: "🗂" },
]

const TECH_STACK = [
  { label: "Weather data",   value: "OpenWeatherMap API", icon: "🌩" },
  { label: "Globe renderer", value: "globe.gl + Three.js",icon: "🌐" },
  { label: "GPU rendering",  value: "WebGL",              icon: "🖥" },
  { label: "Raster format",  value: "GeoTIFF / GRIB2",   icon: "🗂" },
  { label: "NWP model",      value: "GFS / ERA5",         icon: "🔭" },
  { label: "Storm tracks",   value: "NHC / JTWC advisories",icon: "🌀" },
  { label: "Framework",      value: "Next.js App Router", icon: "⚡" },
  { label: "Tile service",   value: "XYZ tile pyramid",   icon: "📐" },
]

const HIGHLIGHTS = [
  "Live precipitation and radar loops updated from NOAA and Copernicus sources",
  "Storm track forecasts with confidence cone polygons and severity classifications",
  "Wind speed and direction at 850 hPa, 500 hPa, and 250 hPa jet stream altitude",
  "Temperature and visibility surface layers for operational planning",
  "Lightning strike real-time overlay with strike density accumulation",
  "72-hour forecast mode with temporal scrubbing between nowcast and model output",
]

export default function UC4DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/demo/uc4/index.html"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}
          >
            ← Live Demo
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 04</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🌦️</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Weather &amp; Meteorological Layers</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          Overlay live and forecast meteorological data onto global operations — radar loops, storm tracks,
          wind shear, visibility zones, and disruption probability layers for proactive weather-sensitive planning.
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
          From raw meteorological model and radar data to animated weather globe in six steps.
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
          🌦️ Key Capabilities
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
          Integrate weather intelligence into your operations
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          See live radar, storm tracks, and 72-hour forecasts on a single interactive globe — built for weather-sensitive operations.
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

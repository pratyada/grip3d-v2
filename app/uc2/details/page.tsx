import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Ships & Fleets on Water — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Ships & Fleets use case: AIS data ingestion, vessel state parsing, route reconstruction, port/zone geofencing, ETA computation, and 3D globe rendering for maritime operations.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "AIS Data Ingestion",
    icon: "📡",
    color: "#33ccdd",
    desc: "Automatic Identification System (AIS) messages are ingested from terrestrial and satellite AIS receivers covering global ocean areas. Class A and Class B transponder messages are decoded from NMEA 0183 format, providing vessel identity, position, speed, and heading.",
    tech: ["AIS Class A / Class B", "NMEA 0183 decoding", "Satellite AIS (S-AIS)", "Global ocean coverage"],
  },
  {
    n: "02",
    title: "Vessel State Parsing",
    icon: "🚢",
    color: "#5588ff",
    desc: "Raw AIS messages are parsed into structured vessel state objects. MMSI, IMO number, vessel name, flag state, vessel type, cargo type, draught, and navigational status are extracted and merged with static vessel registry data for enriched vessel profiles.",
    tech: ["MMSI / IMO lookup", "Vessel type classification", "Flag state registry", "Static + dynamic merge"],
  },
  {
    n: "03",
    title: "Route Reconstruction",
    icon: "🗺",
    color: "#ff8844",
    desc: "Historical position sequences are assembled into route tracks using temporal interpolation. Dead-reckoning fills gaps where AIS coverage is sparse, using last-known heading, speed, and time delta to project intermediate positions along the track.",
    tech: ["Temporal interpolation", "Dead-reckoning fill", "Speed / heading projection", "Track smoothing"],
  },
  {
    n: "04",
    title: "Port / Zone Geofencing",
    icon: "🏗",
    color: "#cc44ff",
    desc: "GeoJSON polygon definitions for major world ports, traffic separation schemes, exclusive economic zones (EEZ), and risk areas are matched against vessel positions in real time. Zone entry/exit events trigger status updates and alert flags.",
    tech: ["GeoJSON port polygons", "EEZ boundaries", "Risk zone definitions", "Point-in-polygon matching"],
  },
  {
    n: "05",
    title: "ETA Computation",
    icon: "⏱",
    color: "#44ff88",
    desc: "Estimated time of arrival is computed from current position, speed over ground, and great-circle distance to the declared destination port. Ocean current and wind correction factors are applied using HYCOM and GFS model data where available.",
    tech: ["Great-circle distance", "SOG-based ETA", "HYCOM ocean currents", "GFS wind correction"],
  },
  {
    n: "06",
    title: "3D Globe Rendering",
    icon: "🌐",
    color: "#ffcc00",
    desc: "100,000+ vessel positions, route arcs, port markers, geofence zones, and ETA labels are rendered on a globe.gl WebGL globe. Vessels are color-coded by type, status, and risk flag, with click-through for full vessel profile and voyage details.",
    tech: ["globe.gl + Three.js", "WebGL particle layer", "GeoJSON polygon overlay", "Click-through profiles"],
  },
]

const STATS = [
  { val: "100,000+",    label: "Vessels tracked",      icon: "🚢" },
  { val: "Global",      label: "AIS coverage",          icon: "🌐" },
  { val: "Live",        label: "Port status",           icon: "🏗" },
  { val: "ETA calc",    label: "Voyage estimation",     icon: "⏱" },
  { val: "Risk zones",  label: "Geofenced areas",       icon: "⚠️" },
  { val: "Real-time",   label: "Position updates",      icon: "📡" },
  { val: "Cargo types", label: "Vessel classification", icon: "📦" },
  { val: "Track replay","label": "Historical routes",   icon: "🗺" },
]

const TECH_STACK = [
  { label: "Vessel data",    value: "AIS protocol",         icon: "📡" },
  { label: "Globe renderer", value: "globe.gl + Three.js",  icon: "🌐" },
  { label: "GPU rendering",  value: "WebGL",                icon: "🖥" },
  { label: "Zone data",      value: "GeoJSON zones",        icon: "📐" },
  { label: "ETA engine",     value: "Great-circle + HYCOM", icon: "⏱" },
  { label: "Ocean currents", value: "HYCOM / GFS models",   icon: "🌊" },
  { label: "Framework",      value: "Next.js App Router",   icon: "⚡" },
  { label: "Registry",       value: "IMO / MMSI lookup",    icon: "🏷" },
]

const HIGHLIGHTS = [
  "Live AIS vessel positions and route tracks for 100,000+ vessels worldwide",
  "Port status and congestion zones for major global shipping hubs",
  "ETA estimation with ocean current and wind correction overlay",
  "Risk zone geofencing and real-time alerts for zone entry/exit events",
  "Cargo type, flag state, and vessel type filtering",
  "Historical route replay with temporal playback controls",
]

export default function UC2DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/demo/uc2/index.html"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}
          >
            ← Live Demo
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 02</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🚢</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Ships &amp; Fleets on Water</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          Track global maritime operations from a single live globe view — AIS-powered vessel tracking,
          port congestion indicators, ETA calculations, and geofenced risk zones for complete situational awareness.
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
          From raw AIS transponder messages to animated maritime globe in six steps.
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
          🚢 Key Capabilities
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
          Ready to track your fleet on the globe?
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          See every vessel, route, and port status on a live 3D globe — built for maritime operations and fleet intelligence teams.
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

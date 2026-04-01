import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Starlinks Spacemap — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Starlinks Spacemap: CelesTrak TLE ingestion, SGP4/SDP4 orbital propagation via satellite.js, globe.gl WebGL rendering, and the Starlink mega-constellation structure.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "CelesTrak TLE Feed",
    icon: "📡",
    color: "#33ccdd",
    desc: "General Perturbation (GP) element sets for all active Starlink satellites fetched from CelesTrak (sponsored by AMSAT). Data conforms to CCSDS OMM v2.0 standard with NORAD-assigned IDs.",
    tech: ["CelesTrak GP API", "CCSDS OMM v2.0", "JSON format", "NORAD catalogue"],
  },
  {
    n: "02",
    title: "Next.js API Proxy",
    icon: "🔁",
    color: "#5588ff",
    desc: "A server-side Next.js Route Handler proxies requests to CelesTrak, adds 10-minute edge caching, and handles CORS — keeping the client payload clean and the external API rate-limit safe.",
    tech: ["Next.js Route Handler", "Edge caching (10 min)", "Cache-Control headers", "Stale-while-revalidate"],
  },
  {
    n: "03",
    title: "TLE Parsing",
    icon: "🔬",
    color: "#ff8844",
    desc: "Two-Line Element sets are parsed by satellite.js using the `twoline2satrec()` function, converting the compact TLE encoding into the numerical state vector required by the SGP4 propagator.",
    tech: ["satellite.js v7", "twoline2satrec()", "SatRec state vector", "Error code validation"],
  },
  {
    n: "04",
    title: "SGP4 Orbital Propagation",
    icon: "🧮",
    color: "#cc44ff",
    desc: "The SGP4/SDP4 algorithm propagates each satellite's state vector forward to the current UTC time, accounting for atmospheric drag, Earth's oblateness (J2 perturbation), and solar radiation pressure.",
    tech: ["SGP4 algorithm", "J2 perturbation model", "ECI coordinate frame", "GMST sidereal time"],
  },
  {
    n: "05",
    title: "Coordinate Transformation",
    icon: "🌐",
    color: "#44ff88",
    desc: "ECI (Earth-Centred Inertial) cartesian coordinates are converted to geodetic latitude, longitude, and altitude using Greenwich Mean Sidereal Time (GMST), giving real-world geographic positions.",
    tech: ["ECI → ECEF → Geodetic", "degreesLat / degreesLong", "Height above WGS-84 ellipsoid", "Real-time GMST"],
  },
  {
    n: "06",
    title: "WebGL Globe Rendering",
    icon: "🖥",
    color: "#ffcc00",
    desc: "6,000+ satellite positions and 90-minute ground tracks are rendered every 5 seconds on a globe.gl WebGL globe with NASA Earth-Night texture, topology bump map, and animated orbital path dashes.",
    tech: ["globe.gl 2.45", "Three.js WebGL", "NASA Blue Marble (night)", "Animated path dashes"],
  },
]

const SHELLS = [
  { name: "Shell 1", inc: "53.0°", alt: "550 km",  planes: 72,  sats: 22,  color: "#33ccdd", desc: "Original operational LEO shell. Provides global coverage between ±53° latitude." },
  { name: "Shell 2", inc: "53.2°", alt: "540 km",  planes: 72,  sats: 22,  color: "#5588ff", desc: "Second 53° shell deployed to increase capacity density." },
  { name: "Shell 3", inc: "70.0°", alt: "570 km",  planes: 36,  sats: 20,  color: "#ff8844", desc: "High-inclination shell extending coverage to ±70° latitude for polar regions." },
  { name: "Shell 4", inc: "97.6°", alt: "560 km",  planes: 6,   sats: 58,  color: "#cc44ff", desc: "Sun-synchronous retrograde orbit. Provides near-polar coverage and consistent solar geometry." },
  { name: "Shell 5", inc: "43.0°", alt: "535 km",  planes: 72,  sats: 22,  color: "#44ff88", desc: "Gen 2 mid-inclination shell targeting high-density population corridors." },
]

const TECH_STACK = [
  { label: "Orbital data",     value: "CelesTrak GP/TLE",    icon: "📡" },
  { label: "Propagator",       value: "satellite.js (SGP4)",  icon: "🧮" },
  { label: "Globe renderer",   value: "globe.gl + Three.js",  icon: "🌐" },
  { label: "Earth texture",    value: "NASA Blue Marble Night",icon: "🌑" },
  { label: "Update rate",      value: "5 s position refresh", icon: "⏱" },
  { label: "TLE cache",        value: "10 min edge cache",    icon: "🔁" },
  { label: "Framework",        value: "Next.js 16 App Router", icon: "⚡" },
  { label: "Satellites",       value: "6,000+ Starlinks",     icon: "🛰" },
]

const CONSTELLATION_FACTS = [
  { label: "Approved satellites", value: "~42,000", icon: "📋" },
  { label: "Currently deployed",  value: "~6,500",  icon: "🛰" },
  { label: "Orbital shells",      value: "5 primary",icon: "🔵" },
  { label: "Orbital period",      value: "~90 min",  icon: "🔁" },
  { label: "Service altitude",    value: "340–570 km",icon: "⬆" },
  { label: "Velocity",            value: "~7.6 km/s", icon: "⚡" },
  { label: "Coverage latitude",   value: "±90°",      icon: "🌐" },
  { label: "Laser ISLs (v1.5+)",  value: "Yes",       icon: "🔦" },
]

export default function UC15DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/uc15"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}>
            ← Live Globe
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 15</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🛰️</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Starlinks Spacemap</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          Real-time tracking of the complete Starlink mega-constellation using live TLE orbital data,
          SGP4 propagation, and WebGL globe rendering — 6,000+ satellites updated every 5 seconds.
        </p>
      </div>

      {/* ── Constellation facts ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
        {CONSTELLATION_FACTS.map(f => (
          <div key={f.label} className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="text-2xl block mb-1">{f.icon}</span>
            <p className="text-xl font-bold mb-0.5" style={{ color: "var(--accent)" }}>{f.value}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{f.label}</p>
          </div>
        ))}
      </div>

      {/* ── Data pipeline ───────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          From raw orbital mechanics data to animated WebGL positions in six steps.
        </p>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #33ccdd44, #44ff8844)" }} />

          <div className="flex flex-col gap-4">
            {PIPELINE_STEPS.map((step, i) => (
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

      {/* ── Orbital shells ──────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Orbital Shells</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          Starlink deploys satellites across five primary orbital shells, each with distinct inclination, altitude, and coverage zone. The globe colours each satellite by its shell.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Shell", "Inclination", "Altitude", "Planes", "Sats/Plane", "Coverage"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHELLS.map((sh, i) => (
                <tr key={sh.name}
                  style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--surface)" : "transparent" }}>
                  <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: sh.color }} />
                    <span style={{ color: "var(--text)" }}>{sh.name}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono" style={{ color: sh.color }}>{sh.inc}</td>
                  <td className="py-2.5 px-3 font-mono" style={{ color: "var(--text)" }}>{sh.alt}</td>
                  <td className="py-2.5 px-3" style={{ color: "var(--muted)" }}>{sh.planes}</td>
                  <td className="py-2.5 px-3" style={{ color: "var(--muted)" }}>{sh.sats}</td>
                  <td className="py-2.5 px-3 text-xs" style={{ color: "var(--muted)" }}>{sh.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* ── SGP4 explainer ──────────────────────────────────────────────── */}
      <div className="mb-16 rounded-2xl p-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
          📐 What is SGP4 Propagation?
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              Simplified General Perturbations 4 (SGP4) is the standard algorithm used by NORAD and
              space agencies worldwide to predict satellite positions from Two-Line Element (TLE) sets.
              It models the effects of atmospheric drag, Earth's oblateness (J2–J6 harmonics), and
              solar/lunar gravity to propagate an orbital state forward in time.
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Each TLE is valid for approximately 1–2 weeks before atmospheric drag introduces
              significant position errors. CelesTrak distributes fresh TLEs daily from Space-Track.org.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { term: "TLE",   def: "Two-Line Element set — compact orbital parameter encoding used by NORAD" },
              { term: "SGP4",  def: "Simplified General Perturbations 4 — orbit propagation algorithm" },
              { term: "ECI",   def: "Earth-Centred Inertial frame — fixed reference frame used during propagation" },
              { term: "GMST",  def: "Greenwich Mean Sidereal Time — rotates ECI to Earth-fixed ECEF frame" },
              { term: "BSTAR", def: "Drag coefficient in TLE encoding representing atmospheric drag decay" },
            ].map(({ term, def }) => (
              <div key={term} className="flex gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0 self-start mt-0.5"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{term}</span>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{def}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Data sources ────────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Data Sources</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              name: "CelesTrak",
              icon: "📡",
              role: "TLE data provider",
              desc: "Distributes NORAD/Space-Track GP element sets. Free public API with GP JSON endpoint for active satellites.",
              color: "#33ccdd",
            },
            {
              name: "Space-Track.org",
              icon: "🏛",
              role: "Authoritative source",
              desc: "US Space Force 18th Space Control Squadron — the authoritative source of all NORAD catalog TLE data.",
              color: "#5588ff",
            },
            {
              name: "NASA Blue Marble",
              icon: "🌍",
              role: "Earth imagery",
              desc: "NASA's Earth at Night composite satellite imagery used for the globe texture in globe.gl.",
              color: "#44ff88",
            },
          ].map(s => (
            <div key={s.name} className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: `1px solid ${s.color}33` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: s.color }}>{s.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{s.role}</p>
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-8 text-center"
        style={{ background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)" }}>
        <p className="text-2xl font-bold mb-3" style={{ color: "var(--text)" }}>
          See it live — 6,000+ satellites right now
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          Open the interactive globe to explore the full Starlink constellation in real time, filter by orbital shell, and track individual satellites.
        </p>
        <Link href="/uc15"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--accent)", color: "#000" }}>
          🛰️ Launch Spacemap
        </Link>
      </div>
    </div>
  )
}

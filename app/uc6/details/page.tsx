import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Cell Tower Density & Coverage — Technical Details — GRIP 3D",
  description:
    "Technical deep-dive into the Cell Tower Density & Coverage globe: OpenCelliD dataset ingestion, radio type classification (2G/3G/LTE/5G), MCC/MNC operator mapping, coverage radius estimation, and WebGL point-cloud rendering on a globe.gl globe.",
}

// ── Data ───────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Towers in dataset",  value: "40M+",        icon: "📡" },
  { label: "Radio types",        value: "4",           icon: "📶" },
  { label: "Countries covered",  value: "180+",        icon: "🌍" },
  { label: "Frequency bands",    value: "700–3500 MHz", icon: "📻" },
  { label: "MCC codes tracked",  value: "800+",        icon: "🗂" },
  { label: "Data update freq.",  value: "Weekly",      icon: "🔁" },
  { label: "Primary data source", value: "OpenCelliD", icon: "🏛" },
  { label: "Avg. LTE range",     value: "~1–15 km",   icon: "📏" },
]

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "OpenCelliD Dataset",
    icon: "🏛",
    color: "#44aaff",
    desc: "OpenCelliD is the world's largest open database of cell tower locations, crowdsourced via the OPENCELLID project and supported by Unwired Labs. The dataset contains 40M+ geolocated towers contributed by mobile devices worldwide.",
    tech: ["OpenCelliD API", "Crowdsourced GPS", "AGPL licence", "CSV / JSON format"],
  },
  {
    n: "02",
    title: "Next.js API Route",
    icon: "🔁",
    color: "#44ff88",
    desc: "A server-side Next.js Route Handler fetches towers for multiple bounding boxes (Americas, Europe, Asia-Pacific) from the OpenCelliD getInArea endpoint. Results are cached at the edge for 1 hour. When no API key is present, a curated static dataset of representative towers is returned.",
    tech: ["Next.js Route Handler", "1 hr edge cache", "Bounding-box sampling", "Static fallback dataset"],
  },
  {
    n: "03",
    title: "Radio Type Classification",
    icon: "📶",
    color: "#ffcc44",
    desc: "Each tower record carries a radio field identifying its generation: GSM (2G), UMTS (3G), LTE (4G), or NR (5G). This field drives colour-coding on the globe and enables per-generation filtering in the UI.",
    tech: ["GSM (850–1900 MHz)", "UMTS (900/2100 MHz)", "LTE (700–2600 MHz)", "NR (sub-6 GHz / mmWave)"],
  },
  {
    n: "04",
    title: "Operator Mapping (MCC/MNC)",
    icon: "🗂",
    color: "#ff44aa",
    desc: "Mobile Country Code (MCC) and Mobile Network Code (MNC) pairs uniquely identify each network operator globally. The globe sidebar decodes MCC to a human-readable country name using a built-in lookup table covering the most common operator codes.",
    tech: ["ITU MCC registry", "MCC → country lookup", "MNC operator decode", "3GPP TS 23.003"],
  },
  {
    n: "05",
    title: "Coverage Radius Estimation",
    icon: "📏",
    color: "#cc44ff",
    desc: "OpenCelliD provides a range estimate (in metres) for many towers, derived from the spread of GPS measurements contributing to that tower. Where range is unavailable, typical defaults are applied: GSM ~35 km, UMTS ~10 km, LTE ~15 km, NR ~5 km — reflecting real-world propagation characteristics.",
    tech: ["GPS-derived range", "Propagation defaults", "Terrain-agnostic estimate", "RSSI correlation"],
  },
  {
    n: "06",
    title: "WebGL Globe Rendering",
    icon: "🖥",
    color: "#33ccdd",
    desc: "Towers are rendered as a Three.js PointsMaterial point cloud on a globe.gl WebGL globe. Spherical coordinates (lat/lng) are converted to Cartesian XYZ via the standard φ/θ formula and stored in a Float32Array BufferGeometry for GPU-efficient rendering. Colour is encoded per-vertex by radio type.",
    tech: ["globe.gl + Three.js", "BufferGeometry point cloud", "Per-vertex colour", "Raycaster click detection"],
  },
]

const RADIO_TYPES = [
  {
    name: "2G GSM",
    color: "#44ff88",
    bands: "850 / 900 / 1800 / 1900 MHz",
    range: "1–35 km",
    latency: "~300 ms",
    speed: "~114 kbps",
    desc: "First digital cellular generation. Widely used for voice and SMS; coverage in remote regions often relies on GSM infrastructure where newer generations are uneconomical.",
  },
  {
    name: "3G UMTS",
    color: "#ffcc44",
    bands: "900 / 2100 MHz",
    range: "0.5–10 km",
    latency: "~50–100 ms",
    speed: "~7.2 Mbps",
    desc: "UMTS/HSPA provides mobile broadband. Smaller cells than GSM but much higher data throughput. Many operators still maintain 3G for voice fallback as VoLTE rolls out.",
  },
  {
    name: "4G LTE",
    color: "#44aaff",
    bands: "700 / 800 / 1800 / 2100 / 2600 MHz",
    range: "0.5–15 km",
    latency: "~20–50 ms",
    speed: "~100–300 Mbps",
    desc: "All-IP packet network. LTE (and LTE-Advanced / LTE-A Pro) is the dominant 4G standard globally, supporting voice via VoLTE. Forms the backbone of mobile broadband in most markets.",
  },
  {
    name: "5G NR",
    color: "#ff44aa",
    bands: "Sub-6 GHz (FR1) / mmWave (FR2)",
    range: "0.1–5 km",
    latency: "<10 ms",
    speed: "~1–10 Gbps",
    desc: "New Radio (NR) is the 5G standard from 3GPP Release 15+. Sub-6 GHz deployments reuse existing tower infrastructure; mmWave delivers extreme throughput at very short range. Primarily urban deployments as of 2025.",
  },
]

const TECH_STACK = [
  { label: "Tower dataset",    value: "OpenCelliD (40M+)",   icon: "📡" },
  { label: "API auth",         value: "OPENCELLID_API_KEY",  icon: "🔑" },
  { label: "Globe renderer",   value: "globe.gl + Three.js", icon: "🌐" },
  { label: "Point rendering",  value: "BufferGeometry cloud", icon: "✦" },
  { label: "Cache TTL",        value: "1 hr edge cache",     icon: "🔁" },
  { label: "Click detection",  value: "Three.js Raycaster",  icon: "🎯" },
  { label: "Framework",        value: "Next.js App Router",  icon: "⚡" },
  { label: "Coord system",     value: "WGS-84 / EPSG:4326",  icon: "📍" },
]

const HIGHLIGHTS = [
  {
    title: "Colour-coded by generation",
    icon: "🎨",
    color: "#44aaff",
    desc: "Each tower dot is coloured by radio type: green (GSM), amber (UMTS), blue (LTE), pink (NR) — instantly revealing the generational coverage landscape of any region.",
  },
  {
    title: "MCC/MNC operator decoding",
    icon: "🗂",
    color: "#44ff88",
    desc: "Click any tower to see the MCC and MNC decoded to a country and operator pair, surfacing the competitive landscape of mobile network operators globally.",
  },
  {
    title: "Coverage radius from GPS data",
    icon: "📏",
    color: "#ffcc44",
    desc: "OpenCelliD derives per-tower range estimates from the spread of contributing GPS fixes — providing a data-driven coverage radius rather than theoretical propagation models.",
  },
  {
    title: "GPU point cloud performance",
    icon: "⚡",
    color: "#ff44aa",
    desc: "Towers are rendered as a single Three.js BufferGeometry with per-vertex colour. The entire dataset renders in a single draw call, enabling smooth interaction even with hundreds of towers.",
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function UC06DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/uc6"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(68,170,255,0.3)" }}>
            ← Live Globe
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 06</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">📡</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>
            Cell Tower Density &amp; Coverage
          </h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          Global cell tower density and coverage map powered by the OpenCelliD dataset — 40M+ geolocated
          towers filtered by 2G GSM, 3G UMTS, 4G LTE, and 5G NR, with MCC/MNC operator decoding and
          GPS-derived coverage radius estimates on a WebGL globe.
        </p>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
        {STATS.map(s => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className="text-xl font-bold mb-0.5" style={{ color: "var(--accent)" }}>{s.value}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Data pipeline ───────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          From crowdsourced GPS measurements to a colour-coded WebGL point cloud in six steps.
        </p>
        <div className="relative">
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #44aaff44, #44ff8844)" }} />

          <div className="flex flex-col gap-4">
            {PIPELINE_STEPS.map(step => (
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

      {/* ── Radio type comparison ────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Radio Generations</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          Each cellular generation operates on different frequency bands, cell sizes, and throughput
          characteristics. The globe colour-codes towers by generation to reveal coverage patterns.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Generation", "Freq. Bands", "Typical Range", "Latency", "Peak Speed", "Notes"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RADIO_TYPES.map((r, i) => (
                <tr key={r.name}
                  style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--surface)" : "transparent" }}>
                  <td className="py-2.5 px-3 font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                        style={{ background: r.color }} />
                      <span style={{ color: r.color }}>{r.name}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{r.bands}</td>
                  <td className="py-2.5 px-3 font-mono" style={{ color: r.color }}>{r.range}</td>
                  <td className="py-2.5 px-3 font-mono" style={{ color: "var(--muted)" }}>{r.latency}</td>
                  <td className="py-2.5 px-3 font-mono" style={{ color: "var(--text)" }}>{r.speed}</td>
                  <td className="py-2.5 px-3 text-xs max-w-xs" style={{ color: "var(--muted)" }}>{r.desc}</td>
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

      {/* ── Highlights ──────────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Key Features</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {HIGHLIGHTS.map(h => (
            <div key={h.title} className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: `1px solid ${h.color}33` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{h.icon}</span>
                <p className="font-bold text-sm" style={{ color: h.color }}>{h.title}</p>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── About OpenCelliD ────────────────────────────────────────────── */}
      <div className="mb-16 rounded-2xl p-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
          About OpenCelliD
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              OpenCelliD is the world&apos;s largest open database of cell tower locations, containing over
              40 million entries. Data is crowdsourced from mobile devices running the OPENCELLID app
              and compatible applications — each device contributes GPS fixes alongside the serving
              tower&apos;s identity (MCC, MNC, LAC, Cell ID), gradually building a global map.
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              The project is maintained by Unwired Labs and released under the Creative Commons
              Attribution-ShareAlike 4.0 (CC BY-SA 4.0) licence. An API key (free for non-commercial
              use) enables programmatic access to the getInArea and getInAreaCSV endpoints.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { term: "MCC",   def: "Mobile Country Code — 3-digit ITU code identifying the country of the operator" },
              { term: "MNC",   def: "Mobile Network Code — 2–3 digit code identifying the specific operator within a country" },
              { term: "LAC",   def: "Location Area Code — groups cells within a UMTS/GSM network for paging efficiency" },
              { term: "eNB",   def: "Evolved NodeB — the LTE base station; eNB ID plus Cell ID form the global LTE cell identifier" },
              { term: "gNB",   def: "Next-Generation NodeB — the 5G NR base station replacing the eNB architecture" },
              { term: "Range", def: "Estimated coverage radius in metres, derived from the spread of contributing GPS observations" },
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
              name:  "OpenCelliD",
              icon:  "📡",
              role:  "Primary tower dataset",
              desc:  "Crowdsourced global cell tower database: 40M+ records with lat/lng, radio type, MCC/MNC, and range. Free API for non-commercial use (CC BY-SA 4.0).",
              color: "#44aaff",
            },
            {
              name:  "ITU / 3GPP",
              icon:  "🏛",
              role:  "MCC/MNC registry",
              desc:  "The ITU maintains the official MCC registry; 3GPP TS 23.003 defines the MNC allocation procedures used to decode operator identity from tower records.",
              color: "#44ff88",
            },
            {
              name:  "NASA / three-globe",
              icon:  "🌍",
              role:  "Earth dark texture",
              desc:  "The dark Earth texture (`earth-dark.jpg`) bundled with three-globe provides a night-time satellite composite ideal for visualising lit cell tower density.",
              color: "#ffcc44",
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

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-8 text-center"
        style={{ background: "var(--accent-dim)", border: "1px solid rgba(68,170,255,0.3)" }}>
        <p className="text-2xl font-bold mb-3" style={{ color: "var(--text)" }}>
          Explore the live tower map
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          Open the interactive globe to filter towers by radio generation, click any tower to decode
          its operator and coverage radius, and compare 2G, 3G, LTE, and 5G density worldwide.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/uc6"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--accent)", color: "#000" }}>
            📡 Launch Tower Map
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: "transparent", color: "var(--accent)", border: "1px solid rgba(68,170,255,0.4)" }}>
            Get in touch →
          </Link>
        </div>
      </div>

    </div>
  )
}

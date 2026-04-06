import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Global Natural Hazards Monitor — Architecture | GRIP 3D",
  description: "Technical deep-dive: NASA EONET + GDACS data fusion, multi-hazard classification, severity encoding, and globe.gl WebGL rendering for real-time natural disaster monitoring.",
}

const PIPELINE = [
  {
    n: "01", icon: "\u{1F6F0}\uFE0F", color: "#ff4444",
    title: "NASA EONET v3 API",
    desc: "NASA's Earth Observatory Natural Event Tracker aggregates natural hazard events from 5 satellite agencies including InciWeb, USGS, NOAA, ESA Copernicus, and the Australian Bureau of Meteorology. Returns wildfires, severe storms, volcanoes, and sea ice events as structured JSON with geographic coordinates and source links.",
    tech: ["NASA EONET v3", "300 open events", "No API key", "InciWeb / USGS / NOAA / ESA"],
  },
  {
    n: "02", icon: "\u{1F30D}", color: "#4488ff",
    title: "GDACS REST API",
    desc: "The Global Disaster Alerting Coordination System (GDACS) is a joint initiative of UN OCHA and the European Commission JRC. It provides real-time alerts for earthquakes, tropical cyclones, floods, volcanoes, droughts, and wildfires globally with severity classification (Red/Orange/Green alert levels).",
    tech: ["GDACS GeoJSON", "UN OCHA + EC JRC", "EQ / TC / FL / VO / DR / WF", "Alert level classification"],
  },
  {
    n: "03", icon: "\u{1F500}", color: "#ff6600",
    title: "Next.js API Proxy",
    desc: "A server-side Route Handler fetches both EONET and GDACS in parallel using Promise.allSettled for fault tolerance. Events are merged, deduplicated by proximity (0.5\u00B0 threshold), and normalized into a unified HazardEvent schema with consistent category and severity fields. 15-minute cache with stale-while-revalidate.",
    tech: ["Promise.allSettled", "Deduplication", "Unified HazardEvent schema", "15 min cache"],
  },
  {
    n: "04", icon: "\u{1F6A8}", color: "#ffcc00",
    title: "Severity Classification",
    desc: "GDACS alert levels (Red \u2192 critical, Orange \u2192 high, Green \u2192 moderate) and EONET magnitude values are mapped to a unified 4-tier severity system. Severity controls point altitude (critical events tower higher) and radius (larger = more severe), creating an intuitive visual hierarchy.",
    tech: ["4-tier severity", "GDACS Red/Orange/Green", "EONET magnitude mapping", "Visual encoding"],
  },
  {
    n: "05", icon: "\u{1F310}", color: "#00aaff",
    title: "Globe Rendering",
    desc: "globe.gl renders hazard events as WebGL points on a 3D globe with NASA day texture. Each hazard category has a distinct color, and severity is encoded via point altitude and radius. A pulse animation cycles point altitude for a dynamic, living-map effect. Click any event for full details.",
    tech: ["globe.gl WebGL", "Category-coded colors", "Severity altitude + radius", "Pulse animation"],
  },
  {
    n: "06", icon: "\u{1F5FA}\uFE0F", color: "#88ddff",
    title: "Country Border Overlay",
    desc: "177 countries from Natural Earth 110m are rendered as transparent polygons with white stroke borders. Hover highlights a country, click flies to it and shows per-country hazard breakdown: total events, breakdown by category, and the top 3 most severe events within the country bounding box.",
    tech: ["Natural Earth 110m", "177 countries", "Hover + click interaction", "Per-country hazard stats"],
  },
]

const HAZARD_TABLE = [
  { category: "Wildfires",          icon: "\u{1F525}", color: "#ff4422", source: "NASA EONET + GDACS", example: "California wildfires, Amazon fires" },
  { category: "Severe Storms",      icon: "\u{1F300}", color: "#4488ff", source: "NASA EONET + GDACS", example: "Tropical cyclones, hurricanes, typhoons" },
  { category: "Volcanic Activity",  icon: "\u{1F30B}", color: "#ff6600", source: "NASA EONET + GDACS", example: "Eruptions, volcanic ash plumes" },
  { category: "Earthquakes",        icon: "\u26A1",    color: "#ffcc00", source: "GDACS",              example: "Richter 4.0+ seismic events" },
  { category: "Floods",             icon: "\u{1F30A}", color: "#00aaff", source: "GDACS",              example: "River flooding, flash floods" },
  { category: "Icebergs & Sea Ice", icon: "\u{1F9CA}", color: "#88ddff", source: "NASA EONET",         example: "Antarctic icebergs, sea ice extent" },
]

const DESIGN_HIGHLIGHTS = [
  {
    title: "Multi-source data fusion",
    desc: "Combining NASA EONET and GDACS for comprehensive global coverage across 6 hazard categories, with proximity-based deduplication to avoid double-counting.",
    color: "#ff4422",
  },
  {
    title: "Severity-based visualization",
    desc: "Point altitude and radius encode event severity \u2014 critical events tower above the globe surface while low-severity events sit close, creating an intuitive visual hierarchy.",
    color: "#ffcc00",
  },
  {
    title: "Category-coded colors",
    desc: "Each hazard type has a distinct color: red for wildfires, blue for storms, orange for volcanoes, yellow for earthquakes, cyan for floods, light blue for icebergs.",
    color: "#4488ff",
  },
  {
    title: "Country interaction",
    desc: "Click any of 177 countries for a localized hazard breakdown showing total events, category distribution, and the most severe events within that country.",
    color: "#00aaff",
  },
]

const TECH = [
  { icon: "\u{1F6F0}\uFE0F", label: "Data sources",   value: "NASA EONET v3 + GDACS" },
  { icon: "\u{1F504}",       label: "Update rate",     value: "15 min auto-refresh" },
  { icon: "\u{1F30D}",       label: "Categories",      value: "6 hazard types" },
  { icon: "\u{1F310}",       label: "Globe",           value: "globe.gl + WebGL" },
  { icon: "\u{1F5FA}\uFE0F", label: "Countries",       value: "177 Natural Earth borders" },
  { icon: "\u{1F4CD}",       label: "Interaction",     value: "Click event / country for details" },
]

export default function UC18DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/uc18" className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity" style={{ color: "var(--muted)" }}>{"\u2190"} Back to live globe</Link>

      <div className="mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: "rgba(255,80,0,0.12)", color: "#ff6600", border: "1px solid rgba(255,80,0,0.3)" }}>UC18 {"\u00B7"} Natural Hazards</span>
      </div>

      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>Global Natural Hazards Monitor</h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>
        Real-time tracking of natural disasters from NASA EONET and GDACS, visualized on a WebGL globe. 6 hazard categories, 4 severity tiers, 177 country borders with per-country hazard breakdown, updated every 15 minutes.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-14">
        {[
          { val: "NASA EONET + GDACS", label: "Data sources" },
          { val: "15 min",             label: "Refresh cycle" },
          { val: "6",                  label: "Hazard categories" },
          { val: "177+",               label: "Countries monitored" },
          { val: "500+",               label: "Active events tracked" },
          { val: "Free",               label: "No API key required" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xl font-bold mb-1" style={{ color: "#ff6600" }}>{s.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Data Pipeline */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <div className="flex flex-col gap-4">
          {PIPELINE.map((step, idx) => (
            <div key={step.n} className="flex gap-5 rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: step.color + "18", border: `1px solid ${step.color}40` }}>{step.icon}</div>
                {idx < PIPELINE.length - 1 && <div className="w-px flex-1 min-h-4" style={{ background: "var(--border)" }} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono opacity-50" style={{ color: step.color }}>{step.n}</span>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{step.title}</h3>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>{step.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {step.tech.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: step.color + "12", border: `1px solid ${step.color}28`, color: step.color }}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hazard Categories */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Hazard Categories</h2>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>Category</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>Color</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>Source</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>Examples</th>
              </tr>
            </thead>
            <tbody>
              {HAZARD_TABLE.map(h => (
                <tr key={h.category} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                    <span className="mr-2">{h.icon}</span>{h.category}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block w-4 h-4 rounded-full align-middle mr-2" style={{ background: h.color }} />
                    <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{h.color}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{h.source}</td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{h.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* About Data Sources */}
      <section className="mb-14 flex flex-col gap-4">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>About the Data Sources</h2>

        <div className="rounded-xl p-6" style={{ background: "rgba(255,68,34,0.05)", border: "1px solid rgba(255,68,34,0.2)" }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#ff4422" }}>NASA EONET</h3>
          <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--muted)" }}>
            The Earth Observatory Natural Event Tracker (EONET) is maintained by NASA{"'"}s Earth Observatory team. It curates natural hazard events confirmed by human analysts from partner agencies including InciWeb (wildfire incident reporting), USGS (geological hazards), NOAA (weather and climate), and ESA Copernicus Emergency Management Service.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            EONET covers wildfires, severe storms, volcanic activity, and sea ice events. Events are satellite-confirmed and remain in the feed until officially closed by the reporting agency.
          </p>
        </div>

        <div className="rounded-xl p-6" style={{ background: "rgba(68,136,255,0.05)", border: "1px solid rgba(68,136,255,0.2)" }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#4488ff" }}>GDACS</h3>
          <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--muted)" }}>
            The Global Disaster Alerting Coordination System (GDACS) is a joint initiative of the United Nations Office for the Coordination of Humanitarian Affairs (UN OCHA) and the European Commission Joint Research Centre (JRC).
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            GDACS provides real-time alerts for earthquakes, tropical cyclones, floods, volcanoes, droughts, and wildfires globally. Events are classified into Red (critical), Orange (high), and Green (moderate) alert levels based on expected humanitarian impact.
          </p>
        </div>
      </section>

      {/* Design Highlights */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Design Highlights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DESIGN_HIGHLIGHTS.map(h => (
            <div key={h.title} className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-2 h-2 rounded-full mb-3" style={{ background: h.color }} />
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>{h.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH.map(t => (
            <div key={t.label} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{t.label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Link href="/uc18" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#ff4444", color: "#fff" }}>{"\u2190"} Back to live globe</Link>
        <Link href="/use-cases" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>All use cases</Link>
      </div>
    </div>
  )
}

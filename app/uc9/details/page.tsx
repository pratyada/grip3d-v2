import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "EV Charging & Gas Stations — Architecture · GRIP 3D",
  description:
    "Technical deep-dive: Open Charge Map API, NREL Alt-Fuel Stations, global static fallback dataset, connector-type colour coding, and Three.js WebGL particle rendering for the energy-transition globe.",
}

const STATS = [
  { val: "400+",      label: "EV stations in dataset" },
  { val: "200+",      label: "Gas stations in dataset" },
  { val: "60+",       label: "Countries covered" },
  { val: "5",         label: "Connector types tracked" },
  { val: "350 kW",    label: "Max DC fast charge (IONITY)" },
  { val: "~120 kW",   label: "Avg DC fast charger" },
  { val: "3",         label: "Primary data sources" },
  { val: "Apr 2026",  label: "Dataset last updated" },
]

const PIPELINE = [
  {
    n: "01", icon: "🔌", color: "#44ff88",
    title: "Open Charge Map API",
    desc: "Open Charge Map (OCM) is the world's largest open dataset of EV charging locations, with over 500,000 POIs globally. The v3 API returns compact JSON including coordinates, connection types (CCS, CHAdeMO, Type 2, Tesla), power level in kW, and operator name. Env var OPEN_CHARGE_MAP_KEY unlocks full access; the route gracefully degrades to static data when the key is absent.",
    tech: ["Open Charge Map v3", "500k+ global POIs", "Connector type IDs", "Power kW per connection"],
  },
  {
    n: "02", icon: "⚡", color: "#88ff44",
    title: "NREL Alt-Fuel Stations (US)",
    desc: "The US National Renewable Energy Laboratory maintains the Alternative Fueling Station Locator, updated daily with electric, hydrogen, LPG, and CNG stations. The REST API supports filtering by fuel_type=ELEC and connector_type, returning station name, address, Level 1/2/DC counts, and exact coordinates for the continental US, Hawaii, and Canada.",
    tech: ["NREL AFDC API v1", "DEMO_KEY fallback", "J1772 / CCS / CHAdeMO / Tesla", "DC fast count → kW estimate"],
  },
  {
    n: "03", icon: "⛽", color: "#ff8844",
    title: "Static Gas Station Dataset",
    desc: "No single free global API covers petrol and diesel stations with reliable uptime and broad geographic coverage. GRIP 3D ships a curated static dataset of ~200 gas stations across 40+ countries, covering major brands (Shell, BP, ExxonMobil, Sinopec, PetroChina, TotalEnergies, Saudi Aramco, Petrobras, ENEOS, ADNOC) with fuel type flags for petrol, diesel, LPG, and CNG.",
    tech: ["200+ curated entries", "40+ countries", "LPG / CNG flagging", "Major oil brands"],
  },
  {
    n: "04", icon: "🌐", color: "#44ffcc",
    title: "Next.js API Route with Fallback",
    desc: "The /api/ev-stations route attempts OCM first (if OPEN_CHARGE_MAP_KEY is set), falls back to NREL (DEMO_KEY works at low rate limits), then falls back to the full static EV dataset. Gas stations are always appended from the static set. Responses are cached for 1 hour with stale-while-revalidate to ensure fast TTFBs.",
    tech: ["Next.js Route Handler", "1 hr edge cache", "Three-tier fallback", "Stale-while-revalidate=2 hr"],
  },
  {
    n: "05", icon: "🎨", color: "#cc44ff",
    title: "Colour Coding by Connector & Fuel",
    desc: "Each station dot is coloured by its primary connector or fuel type: CCS (#44ff88 green), CHAdeMO (#44ffcc teal), Type 2 (#88ff44 lime), Tesla (#cc44ff purple), LPG/CNG (#ff8844 orange), and petrol/diesel (#ff4444 red). This makes the global energy transition instantly legible — green clusters appear around dense EV markets like Norway, Netherlands, and China.",
    tech: ["6 distinct colours", "Connector-first priority", "BufferGeometry vertex colours", "Three.Color per point"],
  },
  {
    n: "06", icon: "🖥", color: "#88ffcc",
    title: "WebGL Particle Rendering",
    desc: "Stations are rendered as a Three.js PointsMaterial particle system with a radial-gradient canvas sprite texture. A gentle opacity pulse gives life to the globe. Click raycasting (Three.Raycaster with threshold=3) maps pixel coordinates back to station index, revealing the sidebar panel with name, connector types, max power kW, operator, and address.",
    tech: ["Three.js PointsMaterial", "Canvas glow sprite", "Pulsing opacity", "Raycaster click → station panel"],
  },
]

const TECH = [
  { icon: "🔌", label: "EV data source",     value: "Open Charge Map v3 (global)" },
  { icon: "⚡", label: "US EV fallback",     value: "NREL Alt-Fuel Stations API" },
  { icon: "⛽", label: "Gas stations",       value: "Curated static dataset" },
  { icon: "🌐", label: "Globe engine",       value: "globe.gl + Three.js WebGL" },
  { icon: "🎨", label: "Point colours",      value: "Per-connector / fuel-type vertex colour" },
  { icon: "📍", label: "Click interaction",  value: "Raycaster → station info panel" },
  { icon: "🔄", label: "Cache strategy",     value: "1 hr + stale-while-revalidate 2 hr" },
  { icon: "📊", label: "Transition index",   value: "% EV in current filtered view" },
]

export default function UC09DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/uc9"
        className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "var(--muted)" }}>
        ← Back to live globe
      </Link>

      <div className="mb-4">
        <span
          className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ background: "rgba(68,255,136,0.12)", color: "#44ff88", border: "1px solid rgba(68,255,136,0.3)" }}>
          UC09 · EV Charging &amp; Gas Stations
        </span>
      </div>

      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
        EV Charging &amp; Gas Stations
      </h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>
        Global EV charging infrastructure vs legacy petrol stations on an interactive WebGL globe. Colour-coded by
        connector type (CCS, CHAdeMO, Type 2, Tesla) and fuel type, with real-time filtering and an Energy Transition
        Index that tracks EV market penetration in any geographic view.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-2xl font-bold mb-1" style={{ color: "#44ff88" }}>{s.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <div className="flex flex-col gap-4">
          {PIPELINE.map((step, idx) => (
            <div
              key={step.n}
              className="flex gap-5 rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: step.color + "18", border: `1px solid ${step.color}40` }}>
                  {step.icon}
                </div>
                {idx < PIPELINE.length - 1 && (
                  <div className="w-px flex-1 min-h-4" style={{ background: "var(--border)" }} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono opacity-50" style={{ color: step.color }}>{step.n}</span>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{step.title}</h3>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>{step.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {step.tech.map(t => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: step.color + "12", border: `1px solid ${step.color}28`, color: step.color }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Energy Transition Narrative */}
      <section className="mb-14">
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(68,255,136,0.05)", border: "1px solid rgba(68,255,136,0.2)" }}>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#44ff88" }}>
            The Energy Transition in Real Geometry
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            Norway and the Netherlands display dense clusters of green (EV) dots, reflecting EV market shares above 80%.
            China shows the world&apos;s largest absolute EV charging network — hundreds of CCS and CHAdeMO points
            concentrated in coastal megacities. By contrast, Sub-Saharan Africa and Central Asia remain predominantly red,
            illustrating the uneven pace of the global energy transition.
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            The Energy Transition Index — displayed as a live percentage in the sidebar — calculates the EV share of
            whichever stations are currently visible after filtering. Toggling between &ldquo;All&rdquo;, &ldquo;EV
            Charging&rdquo;, and &ldquo;Gas Stations&rdquo; tabs, or drilling into a specific connector type (e.g.
            Tesla-only), immediately updates the index and repopulates the globe with only matching points.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            CCS (Combined Charging System) is rapidly becoming the dominant standard globally, backed by every major
            Western automaker and IONITY. CHAdeMO, once the leading DC standard, is declining outside Japan and Korea.
            Tesla&apos;s proprietary connector (now opening up via NACS in North America) dominates premium fast-charging
            in the US and Europe. Type 2 remains the standard AC connector in Europe for Level 2 home and workplace
            charging.
          </p>
        </div>
      </section>

      {/* Connector colour guide */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Station Colour Reference</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { color: "#44ff88", label: "CCS (Combined Charging System)",  desc: "Dominant global DC fast standard — up to 350 kW (IONITY)" },
            { color: "#44ffcc", label: "CHAdeMO",                          desc: "Japanese DC standard — Nissan, Mitsubishi; declining in West" },
            { color: "#88ff44", label: "Type 2 (IEC 62196)",              desc: "Universal AC standard in Europe — Level 2, up to 22 kW" },
            { color: "#cc44ff", label: "Tesla Supercharger",              desc: "Proprietary Tesla network — V3 up to 250 kW; V4 up to 350 kW" },
            { color: "#ff4444", label: "Petrol / Diesel Station",         desc: "Conventional fossil-fuel retail station" },
            { color: "#ff8844", label: "LPG / CNG Station",              desc: "Liquefied petroleum gas or compressed natural gas" },
          ].map(item => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: item.color }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH.map(t => (
            <div
              key={t.label}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{t.label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-xl p-6 mb-10" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>
          Want a custom energy-transition dashboard?
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          GRIP 3D can build bespoke WebGL globe visualisations combining EV infrastructure, grid capacity, renewable
          generation, and emissions data — tailored to your fleet, geography, or ESG reporting requirements.
        </p>
        <Link
          href="/contact"
          className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#44ff88", color: "#000" }}>
          Get in touch →
        </Link>
      </div>

      <div className="flex gap-3">
        <Link
          href="/uc9"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#44ff88", color: "#000" }}>
          ← Back to live globe
        </Link>
        <Link
          href="/use-cases"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>
          All use cases
        </Link>
      </div>
    </div>
  )
}

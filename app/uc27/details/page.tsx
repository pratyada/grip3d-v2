import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "UC27 Architecture — Global Conflict Monitor — GRIP 3D",
  description:
    "Technical deep-dive into UC27 Global Conflict Monitor: deck.gl GlobeView, ScatterplotLayer conflict zones, ArcLayer great-circle displacement flows, GeoJsonLayer crisis polygons, and hardcoded ACLED/UNHCR/OCHA 2024-2025 data.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "Conflict Data Model",
    color: "#ff4444",
    desc: "Each of the 24 tracked conflicts is represented as a typed record with geolocation, intensity classification (high / medium / low), conflict type, casualty estimates, displacement counts, principal parties, and operational status (active / ceasefire / escalating). Data is sourced and reconciled from ACLED, UNHCR, and OCHA situation reports covering 2024-2025.",
    tech: ["ACLED 2024", "UNHCR 2024", "OCHA Situation Reports", "Typed TypeScript interface"],
  },
  {
    n: "02",
    title: "deck.gl Globe Rendering",
    color: "#ff8c00",
    desc: "The globe is rendered using deck.gl's _GlobeView (experimental globe projection) via the @deck.gl/react DeckGL component. A SolidPolygonLayer provides the dark earth background. The controller is enabled for pan, zoom, and tilt interactions. View state is managed via React state with onViewStateChange callbacks.",
    tech: ["@deck.gl/react DeckGL", "_GlobeView (globe projection)", "SolidPolygonLayer (earth)", "controller: true"],
  },
  {
    n: "03",
    title: "Conflict Zones — ScatterplotLayer",
    color: "#ffaa00",
    desc: "Active conflicts are rendered as filled circles via ScatterplotLayer. Radius is proportional to the displaced population count (power-scaled) and animates via a requestAnimationFrame pulse loop. Fill colour encodes intensity (red / orange / yellow). Selected conflicts are highlighted with a white border. Hover and click interactions surface the details panel.",
    tech: ["ScatterplotLayer", "requestAnimationFrame pulse", "Intensity colour encoding", "pickable: true, onClick / onHover"],
  },
  {
    n: "04",
    title: "Displacement Arcs — ArcLayer",
    color: "#c084fc",
    desc: "The 25 major refugee and displacement flow corridors are visualised as great-circle arcs using ArcLayer with greatCircle: true. Arc width is proportional to flow volume. Source colour (orange) transitions to target colour (red) along the arc, conveying directionality of displacement. Arcs remain visible across all filter states to maintain geographic context.",
    tech: ["ArcLayer", "greatCircle: true", "Width by displaced volume", "Orange → red colour gradient"],
  },
  {
    n: "05",
    title: "Filtering & Interaction",
    color: "#22c55e",
    desc: "Conflicts can be filtered by type (war, civil-war, insurgency, territorial, humanitarian-crisis) and by intensity level. Filters are applied via useMemo on the conflicts array and re-derive the ScatterplotLayer data prop. Clicking a conflict dot or a leaderboard entry opens a details panel showing parties, status, displacement, and estimated casualties.",
    tech: ["useMemo filtering", "Type + intensity filter state", "Leaderboard top-5 by displaced", "Click-to-select detail panel"],
  },
  {
    n: "06",
    title: "Data Attribution",
    color: "#33ccdd",
    desc: "All conflict data is hardcoded based on publicly available 2024-2025 reporting from ACLED (Armed Conflict Location & Event Data Project), UNHCR Global Trends, and OCHA situation reports. Casualty and displacement figures are estimates and subject to ongoing revision. The 117 million forcibly displaced figure is UNHCR's 2024 mid-year update.",
    tech: ["ACLED 2024-2025", "UNHCR Global Trends 2024", "OCHA Humanitarian Reports", "All data hardcoded — no live API calls"],
  },
]

const STATS = [
  { val: "24+",    label: "Active conflicts tracked" },
  { val: "25",     label: "Displacement flow arcs" },
  { val: "117M",   label: "People forcibly displaced (UNHCR 2024)" },
  { val: "6",      label: "Conflict type categories" },
  { val: "3",      label: "Intensity levels" },
  { val: "2",      label: "Interactive filter dimensions" },
]

const TECH_STACK = [
  { label: "Globe renderer",     value: "deck.gl _GlobeView" },
  { label: "React integration",  value: "@deck.gl/react DeckGL" },
  { label: "Conflict zones",     value: "ScatterplotLayer" },
  { label: "Displacement flows", value: "ArcLayer (greatCircle)" },
  { label: "Crisis polygons",    value: "GeoJsonLayer" },
  { label: "Earth background",   value: "SolidPolygonLayer" },
  { label: "Animation",          value: "requestAnimationFrame" },
  { label: "Framework",          value: "Next.js 16 App Router" },
]

const CONFLICT_TYPES = [
  { type: "war",                  color: "rgb(220,20,60)",    count: 2,  desc: "Conventional inter-state or large-scale military operations" },
  { type: "civil-war",           color: "rgb(255,80,0)",     count: 8,  desc: "Armed conflict between internal factions for state control" },
  { type: "insurgency",          color: "rgb(255,160,0)",    count: 7,  desc: "Non-state armed group operating against a government" },
  { type: "territorial",         color: "rgb(100,180,255)",  count: 5,  desc: "Disputes over contested borders, islands, or regions" },
  { type: "humanitarian-crisis", color: "rgb(200,100,255)",  count: 2,  desc: "Acute breakdown of governance with mass civilian harm" },
]

const DATA_NOTES = [
  "Casualty figures are minimum estimates; actual totals are likely higher due to under-reporting.",
  "Displacement figures represent cumulative displaced persons as of 2024-2025 reporting, not new displacements in 2024 alone.",
  "The UNHCR 117 million figure covers refugees, asylum seekers, and internally displaced persons (IDPs) globally.",
  "Conflict locations use a representative point (city or region capital) — actual conflict zones are geographically dispersed.",
  "Ceasefire status does not indicate resolution; ceasefires can break down and are noted as of early 2025.",
  "Territorial disputes marked as 'low intensity' reflect current non-kinetic posturing but carry significant escalation risk.",
]

export default function UC27DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Header */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/uc27"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "rgba(180,20,20,0.2)", color: "#ff6666", border: "1px solid rgba(220,50,50,0.3)" }}
          >
            ← Live Globe
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 27</span>
        </div>
        <div className="flex items-start gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--text)" }}>
              Global Conflict Monitor
            </h1>
            <p className="text-sm font-semibold" style={{ color: "#ff6666" }}>
              2025 · Active Armed Conflicts &amp; Displacement
            </p>
          </div>
        </div>
        <div
          className="rounded-xl px-5 py-3 mb-6"
          style={{ background: "rgba(180,20,20,0.12)", border: "1px solid rgba(220,50,50,0.25)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#ff8888" }}>
            UNHCR 2024: 117 million people forcibly displaced globally — a record high.
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            This visualization presents factual data from ACLED, UNHCR, and OCHA for situational awareness and research purposes.
          </p>
        </div>
        <p className="text-base max-w-3xl" style={{ color: "var(--muted)" }}>
          A deck.gl WebGL globe showing 24+ active armed conflicts (2024-2025), 25 major refugee and
          displacement flow corridors, and humanitarian crisis zones. All data is hardcoded from
          publicly available ACLED, UNHCR, and OCHA reporting.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-16">
        {STATS.map(s => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-2xl font-bold mb-0.5" style={{ color: "#ff6666" }}>{s.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Conflict types */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Conflict Type Classification</h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Each conflict is assigned one of five categories, encoded by dot colour on the globe.
        </p>
        <div className="flex flex-col gap-3">
          {CONFLICT_TYPES.map(ct => (
            <div key={ct.type} className="flex items-start gap-4 rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ background: `${ct.color}18`, border: `1px solid ${ct.color}44` }}>
                <div className="w-4 h-4 rounded-full" style={{ background: ct.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs font-bold" style={{ color: ct.color }}>
                    {ct.type.toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                    {ct.count} conflicts
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--muted)" }}>{ct.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data pipeline */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Technical Pipeline</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          From hardcoded conflict data to interactive WebGL globe in six stages.
        </p>
        <div className="relative">
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #ff444444, #33ccdd44)" }} />
          <div className="flex flex-col gap-4">
            {PIPELINE_STEPS.map((step) => (
              <div key={step.n} className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold z-10"
                  style={{ background: step.color + "18", border: `1px solid ${step.color}44`, color: step.color }}>
                  {step.n}
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

      {/* Tech stack */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Tech Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TECH_STACK.map(t => (
            <div key={t.label} className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--text)" }}>{t.value}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data notes */}
      <div className="mb-16 rounded-2xl p-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
          Data Notes &amp; Methodology
        </h2>
        <ul className="space-y-3">
          {DATA_NOTES.map(note => (
            <li key={note} className="flex items-start gap-3">
              <span style={{ color: "#ff6666" }} className="mt-0.5 flex-shrink-0">—</span>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{note}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            <span className="font-semibold" style={{ color: "var(--text)" }}>Sources:</span>{" "}
            Armed Conflict Location &amp; Event Data Project (ACLED) · UNHCR Global Trends 2024 ·
            OCHA Humanitarian Situation Reports · UN Human Rights Council · Various news wire services
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl p-8 text-center"
        style={{ background: "rgba(180,20,20,0.1)", border: "1px solid rgba(220,50,50,0.25)" }}>
        <p className="text-2xl font-bold mb-3" style={{ color: "var(--text)" }}>
          Explore the live conflict globe
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          Pan, zoom, and filter 24+ active conflicts by type and intensity. Click any conflict
          zone to view parties, displacement figures, and operational status.
        </p>
        <Link
          href="/uc27"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "#dc143c", color: "#fff" }}
        >
          Open Globe
        </Link>
      </div>
    </div>
  )
}

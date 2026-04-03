import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "World Rail Networks — Technical Details — GRIP 3D",
  description:
    "Technical deep-dive into UC24: deck.gl GlobeView with PathLayer, ArcLayer, ScatterplotLayer for 25+ railway corridors, 30 major station hubs, and 20 passenger flow arcs across global rail infrastructure.",
}

// ── Static data ────────────────────────────────────────────────────────────────

const STATS = [
  { val: "25+",    label: "Rail corridors"       },
  { val: "53k km", label: "Total tracked length" },
  { val: "30",     label: "Major hubs"           },
  { val: "20",     label: "Passenger flow arcs"  },
  { val: "5",      label: "Line type categories" },
  { val: "4",      label: "deck.gl layers"       },
  { val: "2033",   label: "Latest planned route" },
  { val: "1916",   label: "Oldest corridor"      },
]

const PIPELINE = [
  {
    n: "01", icon: "🗺", color: "#ff3c3c",
    title: "deck.gl _GlobeView",
    desc: "The visualisation uses deck.gl's experimental _GlobeView, which projects all layer coordinates onto a 3D globe using an equirectangular-to-sphere mapping. This allows PathLayer paths specified in [longitude, latitude] pairs to follow the curvature of the Earth naturally, and ArcLayer arcs to trace great-circle routes. The globe is initialised centred over Europe and Asia (longitude 60°, latitude 30°, zoom 1.5) to provide an immediately informative view of the densest rail regions.",
    tech: ["deck.gl _GlobeView", "[lng, lat] coordinates", "greatCircle arc projection", "Initial view: lng 60 / lat 30 / zoom 1.5"],
  },
  {
    n: "02", icon: "🚄", color: "#ff3c3c",
    title: "PathLayer — Rail Corridors",
    desc: "Each rail corridor is rendered as a PathLayer path with colour-coded type: high-speed (red, 4px), conventional (blue, 2px), freight (brown, 2px), metro (green, 2px), and planned (purple, 2px, reduced opacity). Path coordinates are manually placed waypoints following actual geographic routes. Width is set in pixel units so lines remain readable at all zoom levels, with widthMinPixels=1 and widthMaxPixels=8. Planned lines use 160/255 opacity to visually distinguish them from operational corridors.",
    tech: ["PathLayer", "5 type colours", "4px HSR / 2px others", "Pixel-unit width", "Planned opacity: 160/255"],
  },
  {
    n: "03", icon: "✈", color: "#9650dc",
    title: "ArcLayer — Passenger Flow Arcs",
    desc: "The 20 most trafficked inter-city rail corridors are rendered as great-circle arcs using ArcLayer with greatCircle: true. Arc width scales logarithmically with weekly passenger volume so the busiest routes (Tokyo↔Osaka at 875k/week, Beijing↔Shanghai at 560k/week) are visually dominant. A sine-wave animation tick pulses arc width ±30% on an 80ms interval for a lively data-flow effect. Arc colour fades from full opacity at the source to near-transparent at the target.",
    tech: ["ArcLayer greatCircle: true", "Log-scaled width", "Animated pulse ±30%", "Top 20 city-pair flows"],
  },
  {
    n: "04", icon: "📍", color: "#64b4ff",
    title: "ScatterplotLayer — Major Hubs",
    desc: "The 30 largest railway stations and interchanges are shown as ScatterplotLayer circles. Radius scales with the square root of annual passenger volume (millions), clamped between 30km and 200km in world meters so all stations remain visible. Colour interpolates from the project accent cyan for low-traffic stations to red-tinted for the very busiest (Shinjuku at 770M/year, Tokyo at 462M/year). A white stroke ring aids readability on the dark globe background.",
    tech: ["ScatterplotLayer", "Radius ∝ √(annual pax)", "30km–200km radius range", "Cyan→red colour gradient", "White 1px stroke"],
  },
  {
    n: "05", icon: "🌍", color: "#33ccdd",
    title: "SolidPolygonLayer — Earth Background",
    desc: "A full-sphere SolidPolygonLayer covering [-180,-90] to [180,90] is placed as the bottom-most layer to fill the globe with a dark navy (#081428) colour that contrasts with rail overlays. This avoids dependence on external map tile services or texture images, keeping the visualisation fully offline-capable. The deck.gl clearColor parameter is set to pure black (0,0,0,1) for the inter-globe void.",
    tech: ["SolidPolygonLayer", "Full-sphere coverage", "Dark navy fill #081428", "No external tile dependency"],
  },
  {
    n: "06", icon: "🎛", color: "#64dc64",
    title: "Filter, Selection & Detail Panel",
    desc: "Bottom-left filter buttons toggle the active rail type (All / High-Speed / Conventional / Planned / Freight / Metro), re-rendering the PathLayer data subset immediately. Clicking a rail line or station hub on the globe populates the bottom-right detail panel with metadata: name, operator, length, top speed, opening year for lines; or station name, city, country, annual passengers for hubs. A top-right leaderboard ranks countries by total HSR kilometres with animated percentage bars.",
    tech: ["Client-side type filter", "PathLayer onClick", "ScatterplotLayer onClick", "HSR km leaderboard"],
  },
]

const TECH = [
  { icon: "🌐", label: "Visualisation",  value: "deck.gl 9.x — _GlobeView"              },
  { icon: "🚄", label: "Rail lines",     value: "PathLayer — 25 corridors, 5 types"       },
  { icon: "✈",  label: "Flow arcs",     value: "ArcLayer — 20 city-pair great circles"    },
  { icon: "📍", label: "Stations",       value: "ScatterplotLayer — 30 major hubs"         },
  { icon: "🌍", label: "Globe bg",       value: "SolidPolygonLayer — full-sphere coverage" },
  { icon: "🎨", label: "Colour scheme",  value: "HSR red · Conventional blue · Planned purple" },
  { icon: "⚡",  label: "Animation",     value: "Arc pulse — 80ms tick, sin(tick×0.15)"    },
  { icon: "📦", label: "Data",           value: "Hardcoded static arrays — no API calls"   },
]

const HIGHLIGHTS = [
  {
    title: "True great-circle arcs",
    body: "ArcLayer with greatCircle: true renders each passenger flow arc as a geodesic curve that follows Earth's surface, accurately representing the shortest path between city pairs. This is especially visible on long routes like Moscow↔St. Petersburg or Tokyo↔Osaka which curve noticeably on the 3D globe projection.",
    color: "#ff3c3c",
  },
  {
    title: "Logarithmic traffic scaling",
    body: "Arc widths and hub radii use logarithmic and square-root scaling respectively, compressing the enormous range of passenger volumes (18M–770M annual for hubs; 45k–875k weekly for arcs) into a visually readable range. Without this, the busiest routes would completely dominate smaller but still significant corridors.",
    color: "#9650dc",
  },
  {
    title: "Planned vs operational",
    body: "Planned lines (HS2, California HSR, Mumbai–Ahmedabad, Pakistan ML-1, Brazil SP–RJ, Egypt Cairo–Alexandria) are shown in purple at reduced opacity, making them visually distinct from operational corridors. The top-right leaderboard counts only completed HSR km, reflecting the current state rather than aspirational totals.",
    color: "#64b4ff",
  },
]

// ── Component ──────────────────────────────────────────────────────────────────

export default function UC24DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Back link */}
      <Link
        href="/uc24"
        className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "var(--muted)" }}
      >
        ← Back to live globe
      </Link>

      {/* Badge + heading */}
      <div className="mb-4">
        <span
          className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ background: "rgba(255,60,60,0.12)", color: "#ff3c3c", border: "1px solid rgba(255,60,60,0.3)" }}
        >
          UC24 · World Rail Networks
        </span>
      </div>
      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
        World Rail Networks
      </h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>
        25+ global railway corridors — high-speed, conventional, freight, and planned —
        visualised on a deck.gl 3D globe with PathLayer rail lines, ArcLayer great-circle
        passenger flow arcs, and ScatterplotLayer station hubs. Click any element for details.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl font-bold mb-1" style={{ color: "#ff3c3c" }}>{s.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Implementation Pipeline</h2>
        <div className="flex flex-col gap-4">
          {PIPELINE.map((step, idx) => (
            <div
              key={step.n}
              className="flex gap-5 rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: step.color + "18", border: `1px solid ${step.color}40` }}
                >
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
                      style={{ background: step.color + "12", border: `1px solid ${step.color}28`, color: step.color }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Design Highlights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HIGHLIGHTS.map(h => (
            <div
              key={h.title}
              className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: `1px solid ${h.color}30` }}
            >
              <h3 className="text-sm font-bold mb-2" style={{ color: h.color }}>{h.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Colour scheme reference */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Colour Scheme</h2>
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(255,60,60,0.04)", border: "1px solid rgba(255,60,60,0.15)" }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { type: "High-Speed",    color: "#ff3c3c", desc: "Operational HSR corridors (300–360 km/h)" },
              { type: "Conventional",  color: "#64b4ff", desc: "Intercity and regional rail (100–240 km/h)" },
              { type: "Planned",       color: "#9650dc", desc: "Future corridors, reduced opacity" },
              { type: "Freight",       color: "#b48c50", desc: "Dedicated freight lines" },
              { type: "Metro",         color: "#64dc64", desc: "Urban rapid transit" },
              { type: "Flow Arc",      color: "rgba(255,80,80,0.8)", desc: "Passenger demand (great-circle)" },
            ].map(c => (
              <div key={c.type} className="flex items-start gap-3">
                <div style={{ width: 28, height: 4, borderRadius: 2, background: c.color, marginTop: 6, flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{c.type}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
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
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
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
      <div className="flex gap-3">
        <Link
          href="/uc24"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#ff3c3c", color: "#fff" }}
        >
          ← Back to live globe
        </Link>
        <Link
          href="/use-cases"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          All use cases
        </Link>
      </div>
    </div>
  )
}

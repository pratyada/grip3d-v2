import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "World Rail Networks — Technical Details — GRIP 3D",
  description:
    "Technical deep-dive into UC24: globe.gl with arcsData, pointsData, and polygonsData for 25+ railway corridors, 30 major station hubs, 20 passenger flow arcs, and interactive country borders.",
}

// ── Static data ────────────────────────────────────────────────────────────────

const STATS = [
  { val: "25+",    label: "Rail corridors",       color: "#ff3c3c" },
  { val: "53k km", label: "Total tracked length",  color: "#ff3c3c" },
  { val: "30",     label: "Major hubs",             color: "#33ccdd" },
  { val: "20",     label: "Passenger flow arcs",    color: "#9650dc" },
  { val: "5",      label: "Line type categories",   color: "#64dc64" },
  { val: "195+",   label: "Country borders",        color: "#fde725" },
  { val: "2033",   label: "Latest planned route",   color: "#b48c50" },
  { val: "1916",   label: "Oldest corridor",        color: "#64b4ff" },
]

const PIPELINE = [
  {
    n: "01", icon: "🌍", color: "#33ccdd",
    title: "globe.gl — Earth Renderer",
    desc: "The visualisation uses globe.gl, a Three.js-based globe library. The globe is textured with a NASA night Earth image and topology bump map, set against a star-field background. Auto-rotation starts at 0.15 rpm, centred over Europe and Asia (lat 30°, lng 60°, altitude 2.0). The atmosphere is rendered in blue (#1a3fff) at 14% altitude. Damped OrbitControls allow smooth user interaction — spinning pauses automatically when a country is clicked.",
    tech: ["globe.gl Three.js", "earth-night.jpg texture", "earth-topology.png bump", "night-sky.png background", "atmosphereColor #1a3fff"],
  },
  {
    n: "02", icon: "🚄", color: "#ff3c3c",
    title: "arcsData — Rail Corridors",
    desc: "Each railway corridor is rendered as a globe.gl arc drawn from the first to the last waypoint of its path. Arc colour is type-coded: HSR red (#ff3c3c, stroke 0.5), conventional blue (#64b4ff, stroke 0.35), freight brown, metro green, and planned purple (stroke 0.25). Planned lines use arcDashLength/arcDashGap with a 2500ms animate time to produce a travelling-dash effect. arcAltitudeAutoScale 0.3 gives every arc a gentle geodesic bulge proportional to its distance.",
    tech: ["arcsData", "5 type colours", "arcStroke 0.25–0.5", "arcAltitudeAutoScale 0.3", "Planned dash animation 2500ms"],
  },
  {
    n: "03", icon: "📍", color: "#64b4ff",
    title: "pointsData — Station Hubs",
    desc: "The 30 largest railway stations are rendered as globe.gl points. pointRadius scales with √(annual passengers in millions) × 0.02, so Shinjuku (770M/year) and Tokyo Station (462M/year) appear much larger than smaller hubs. Colour interpolates from cyan for lower-traffic stations to red-tinted for the busiest, using the same gradient as the original deck.gl ScatterplotLayer. Hovering a hub shows a tooltip; clicking populates the bottom-right detail panel.",
    tech: ["pointsData", "pointRadius ∝ √pax × 0.02", "Cyan→red colour gradient", "pointsMerge: false", "onClick detail panel"],
  },
  {
    n: "04", icon: "🗺", color: "#fde725",
    title: "polygonsData — Country Borders",
    desc: "Country borders are loaded from /countries-110m.geojson and applied via polygonsData at altitude 0.005. Border stroke colour transitions from faint white (rgba 18%) on hover to 60% white, and to vivid yellow (#fde725) when a country is selected. The polygon cap is fully transparent by default with a subtle yellow or white fill for hovered/selected states. Clicking a country triggers a smooth fly-to animation (pointOfView transition over 800ms) and opens a country stats panel.",
    tech: ["polygonsData", "countries-110m.geojson", "Hover/select stroke colours", "polygonAltitude 0.005", "800ms fly-to animation"],
  },
  {
    n: "05", icon: "📊", color: "#64dc64",
    title: "Country Stats Panel",
    desc: "When a country is selected, a panel in the bottom-right corner lists all rail lines whose country field matches the selected country. Each line shows its type colour dot, name, and length. A summary row shows total tracked kilometres and hub count for the country. The panel dismisses on the close button or by re-clicking the same country polygon on the globe.",
    tech: ["Country name matching", "Line / hub count", "Total km per country", "Close button + re-click dismiss"],
  },
  {
    n: "06", icon: "🎛", color: "#ff3c3c",
    title: "Filter, Selection & Detail Panel",
    desc: "Bottom-left filter buttons toggle the active rail type (All / High-Speed / Conventional / Planned / Freight / Metro), immediately updating the arcsData subset. Clicking a rail arc or hub point opens the bottom-right detail panel with metadata: name, operator, length, top speed, opening year for lines; or station name, city, annual passengers for hubs. A top-right leaderboard ranks countries by total HSR kilometres with animated percentage bars. The Pause/Spin button toggles globe auto-rotation.",
    tech: ["Client-side type filter", "arcsData onClick", "pointsData onClick", "HSR km leaderboard", "Spin toggle"],
  },
]

const TECH = [
  { icon: "🌐", label: "Visualisation",    value: "globe.gl (Three.js-based 3D globe)"             },
  { icon: "🚄", label: "Rail lines",       value: "arcsData — 25 corridors, 5 types"                },
  { icon: "📍", label: "Station hubs",     value: "pointsData — 30 major hubs"                      },
  { icon: "🗺", label: "Country borders",  value: "polygonsData — 195+ countries (110m GeoJSON)"    },
  { icon: "🎨", label: "Colour scheme",    value: "HSR red · Conventional blue · Planned purple"    },
  { icon: "💫", label: "Arc animation",    value: "Planned lines: arcDashAnimateTime 2500ms"         },
  { icon: "🖱", label: "Interaction",      value: "Hover + click arcs, points, polygons"            },
  { icon: "📦", label: "Data",             value: "Hardcoded static arrays + /countries-110m.geojson" },
]

const HIGHLIGHTS = [
  {
    title: "Geodesic arc curvature",
    body: "globe.gl arcs follow great-circle paths on the sphere surface. With arcAltitudeAutoScale set to 0.3, longer corridors like the Trans-Siberian (9,289 km) and Beijing–Guangzhou HSR (2,298 km) show a pronounced curvature, accurately reflecting the geodesic distance. Short corridors like Morocco TGV (186 km) are rendered nearly flat.",
    color: "#ff3c3c",
  },
  {
    title: "Planned lines dash animation",
    body: "Future corridors (HS2, California HSR, Mumbai–Ahmedabad, Pakistan ML-1, Brazil SP–RJ, Egypt Cairo–Alexandria) use arcDashLength 0.4, arcDashGap 0.3, and arcDashAnimateTime 2500ms to produce a moving-dash effect in purple, immediately distinguishing them from operational corridors without relying solely on colour.",
    color: "#9650dc",
  },
  {
    title: "Country border interaction",
    body: "Clicking any country polygon on the globe triggers an 800ms animated pointOfView fly-to centred on the country's bounding-box centroid at altitude 2.0, then opens a stats panel listing all tracked rail lines in that country with their lengths. Auto-rotation pauses so the user can explore at leisure.",
    color: "#fde725",
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
        visualised on a globe.gl 3D globe with arc rail lines, point station hubs, and
        interactive country borders with stats. Click any element for details.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.val}</p>
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
              { type: "Planned",       color: "#9650dc", desc: "Future corridors — animated dash" },
              { type: "Freight",       color: "#b48c50", desc: "Dedicated freight lines" },
              { type: "Metro",         color: "#64dc64", desc: "Urban rapid transit" },
              { type: "Country border",color: "#fde725", desc: "Selected country highlight" },
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

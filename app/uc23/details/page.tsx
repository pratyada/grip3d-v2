import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Global Skyscraper Race — Technical Details — GRIP 3D",
  description:
    "Deep-dive into UC23: deck.gl GlobeView, ColumnLayer height exaggeration, 60+ hardcoded buildings from Jeddah Tower (1008m) to Carlton Centre, status filtering, and the race to 1000m.",
}

// ── Static data ────────────────────────────────────────────────────────────────

const STATS = [
  { val: "60+",   label: "Buildings mapped"      },
  { val: "1008m", label: "Tallest (Jeddah Tower)" },
  { val: "3",     label: "Status categories"     },
  { val: "1931",  label: "Oldest (Empire State)"  },
  { val: "2030",  label: "Latest (proposed)"      },
  { val: "20+",   label: "Countries covered"      },
  { val: "deck.gl", label: "Visualisation engine" },
  { val: "GlobeView", label: "Projection"         },
]

const PIPELINE = [
  {
    n: "01",
    icon: "🏗",
    color: "#fde725",
    title: "Hardcoded Building Dataset",
    desc: "All 60+ buildings are stored as a static TypeScript array — no external API calls, no loading states, instant availability. Each entry carries id, name, city, country, lat/lng, height in metres, floor count, completion year, construction status, primary use type, and lead architect. The data was assembled from the Council on Tall Buildings and Urban Habitat (CTBUH) Skyscraper Center, cross-referenced with Wikipedia and official developer announcements for accuracy. Status values reflect April 2026 information.",
    tech: ["Static TypeScript array", "CTBUH Skyscraper Center", "60+ entries", "8 fields per building"],
  },
  {
    n: "02",
    icon: "🌐",
    color: "#ff8c00",
    title: "deck.gl GlobeView (Experimental)",
    desc: "The visualisation uses deck.gl's experimental _GlobeView projection, which renders the entire planet as a sphere using WebGL. Unlike the default MapView (Mercator), GlobeView supports free orbital rotation and provides a physically accurate representation of great-circle distances — critical for a dataset spanning every inhabited continent. The initial view state centres on the Arabian Peninsula (longitude 45°, latitude 25°) to highlight the Burj Khalifa, Jeddah Tower, and Makkah Clock Tower cluster.",
    tech: ["_GlobeView (experimental)", "WebGL sphere rendering", "Orbital rotation controller", "No tile server required"],
  },
  {
    n: "03",
    icon: "📐",
    color: "#6495ed",
    title: "ColumnLayer Height Exaggeration",
    desc: "Buildings are extruded as 3D columns using deck.gl's ColumnLayer. Because real building heights (160m – 1008m) are negligible at globe scale (Earth radius 6,371km), elevations are exaggerated by a factor of roughly 6,400x: the tallest building in the current filter group is mapped to 6.5 million virtual metres, and all others scale proportionally. Column radius is 35km — wide enough to be visible at zoom level 1.6 but not so wide as to overlap neighbouring buildings in dense clusters like Dubai Marina or Manhattan.",
    tech: ["ColumnLayer", "diskResolution: 12", "radius: 35 000m", "Elevation ∝ (heightM / max) × 6.5M"],
  },
  {
    n: "04",
    icon: "🎨",
    color: "#fde725",
    title: "Status Colour Encoding",
    desc: "Three RGBA colours encode construction status at a glance: yellow (#fde725 — Viridis endpoint) for completed buildings, orange (#ff8c00) for those under active construction, and cornflower blue (#6495ed) for proposed towers. The yellow colour is intentionally borrowed from the Viridis perceptual colour scale to signal 'complete and valid'. Each column also has a matching semi-transparent ScatterplotLayer glow dot at its base, amplifying the signal for small-radius columns at low zoom.",
    tech: ["Yellow #fde725 — complete", "Orange #ff8c00 — under construction", "Blue #6495ed — proposed", "ScatterplotLayer base glow"],
  },
  {
    n: "05",
    icon: "🏆",
    color: "#ff8c00",
    title: "Top-10 Leaderboard & Click Interaction",
    desc: "A top-10 leaderboard panel (sortable by height or completion year) occupies the top-right corner. Clicking any row or any extruded column animates the view state to centre and zoom on that building, then opens a detail panel showing height, floor count, year, status, use type, and architect. A mini progress bar compares the selected building's height against both the Burj Khalifa (828m, current tallest) and the Jeddah Tower (1008m, first building to break 1000m upon completion). The status filter chips (All / Complete / Under Construction / Proposed) update the layers and leaderboard in real time via React useMemo.",
    tech: ["Click → fly to building", "Detail panel with 6 metrics", "Height bar vs Burj Khalifa", "Real-time status filtering"],
  },
]

const HIGHLIGHTS = [
  {
    title: "The Race to 1000m",
    body:  "The Jeddah Tower (Kingdom Tower) in Saudi Arabia will be the first human structure to exceed 1000m when completed around 2028, reaching 1008m. Designed by Adrian Smith + Gordon Gill Architecture — the same team behind the Burj Khalifa — it eclipses Dubai's current record holder by 180m. The Nakheel Harbour Tower (1000m, proposed for Dubai) and Burj Azizi (725m, under construction) signal that the Gulf's supertall ambitions show no signs of slowing.",
    color: "#fde725",
  },
  {
    title: "China's Supertall Surge",
    body:  "Of the world's 20 tallest completed buildings, 11 are in China. The cluster of Pudong skyscrapers in Shanghai — Burj Khalifa's nearest competitors — represents a 30-year programme of record-setting construction. Four buildings in the 500–635m range (Shanghai Tower, Ping An Finance Centre, Guangzhou CTF, CITIC Tower) were all completed between 2015 and 2018, an unprecedented concentration of supertall completions. Goldin Finance 117 in Tianjin, long stalled, finally topped out at 597m in 2024.",
    color: "#ff8c00",
  },
  {
    title: "deck.gl on a Globe",
    body:  "Rendering 3D columns on a WebGL globe requires significant height exaggeration — real building heights range from 160m to 1008m, a factor of roughly 1.4 million times smaller than Earth's radius. The ColumnLayer elevation is mapped to 6.5 million virtual metres for the tallest building, creating a visually dramatic spike effect while preserving relative height ratios. The SolidPolygonLayer earth background uses a simple flat polygon at [−180, +180] longitude to paint the globe surface a deep navy without needing any tile or GeoJSON ocean data.",
    color: "#6495ed",
  },
]

const NOTABLE = [
  {
    name:    "Jeddah Tower",
    height:  "1008m",
    year:    "Est. 2028",
    status:  "under-construction",
    note:    "First building to break 1000m. Foundation work restarted 2021 after a 5-year suspension.",
    color:   "#ff8c00",
  },
  {
    name:    "Burj Khalifa",
    height:  "828m",
    year:    "2010",
    status:  "complete",
    note:    "World's tallest completed building for 15+ years. 163 floors, 3 residential, hotel, office & observation.",
    color:   "#fde725",
  },
  {
    name:    "Merdeka 118",
    height:  "679m",
    year:    "2023",
    status:  "complete",
    note:    "Second tallest completed building, completed 2023. Kuala Lumpur's new skyline anchor.",
    color:   "#fde725",
  },
  {
    name:    "Shanghai Tower",
    height:  "632m",
    year:    "2015",
    status:  "complete",
    note:    "Twisting glass spiral by Gensler. World's second tallest building at completion.",
    color:   "#fde725",
  },
  {
    name:    "Burj Azizi",
    height:  "725m",
    year:    "Est. 2028",
    status:  "under-construction",
    note:    "Under construction in Dubai since 2023. Will become world's second tallest upon completion.",
    color:   "#ff8c00",
  },
  {
    name:    "Nakheel Harbour Tower",
    height:  "1000m",
    year:    "Est. 2030",
    status:  "proposed",
    note:    "Proposed for Dubai Harbour. Would rival Jeddah Tower if built as planned.",
    color:   "#6495ed",
  },
]

const TECH = [
  { icon: "🌐", label: "Globe projection",   value: "deck.gl _GlobeView (experimental WebGL sphere)" },
  { icon: "🏗",  label: "3D buildings",       value: "deck.gl ColumnLayer — extruded, pickable"        },
  { icon: "✨", label: "Base glow",           value: "deck.gl ScatterplotLayer — semi-transparent dots" },
  { icon: "🌍", label: "Earth background",   value: "deck.gl SolidPolygonLayer — deep-navy fill"      },
  { icon: "📊", label: "Data",               value: "Static TypeScript array, 60+ buildings"          },
  { icon: "🎨", label: "Status colours",     value: "Yellow / Orange / Blue — complete / building / proposed" },
  { icon: "⚛️", label: "Framework",          value: "Next.js 16 — 'use client', React 19, useMemo layers" },
  { icon: "🔍", label: "Interaction",        value: "Click column → fly to + detail panel; leaderboard rows" },
]

// ── Component ──────────────────────────────────────────────────────────────────

export default function UC23DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Back link */}
      <Link
        href="/uc23"
        className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "var(--muted)" }}
      >
        &larr; Back to live globe
      </Link>

      {/* Badge + heading */}
      <div className="mb-4">
        <span
          className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{
            background: "rgba(253,231,37,0.1)",
            color:      "#fde725",
            border:     "1px solid rgba(253,231,37,0.3)",
          }}
        >
          UC23 · Global Skyscraper Race
        </span>
      </div>

      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
        Global Skyscraper Race
      </h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>
        Sixty-plus of the world's tallest and most notable buildings rendered as extruded 3D columns on a
        deck.gl GlobeView WebGL sphere. Filter by construction status, sort the leaderboard by height or
        completion year, and track the race to 1000m.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl font-bold mb-1" style={{ color: "#fde725" }}>{s.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Notable buildings */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Notable Buildings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NOTABLE.map(b => (
            <div
              key={b.name}
              className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: `1px solid ${b.color}30` }}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-bold" style={{ color: b.color }}>{b.name}</p>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                  style={{ background: `${b.color}18`, color: b.color, border: `1px solid ${b.color}40` }}
                >
                  {b.height}
                </span>
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>{b.year}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{b.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Architecture & Pipeline</h2>
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

      {/* Jeddah Tower spotlight */}
      <section className="mb-14">
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(253,231,37,0.04)", border: "1px solid rgba(253,231,37,0.2)" }}
        >
          <h2 className="text-xl font-bold mb-3" style={{ color: "#fde725" }}>
            The Jeddah Tower — First Building to Break 1000m
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            The Jeddah Tower (formerly Kingdom Tower) in Jeddah, Saudi Arabia, was conceived in 2008
            by Prince Al-Waleed bin Talal to be the world's first kilometre-tall building. Designed by
            Adrian Smith + Gordon Gill Architecture — the same firm responsible for the Burj Khalifa
            — the 167-floor mixed-use tower will house offices, luxury apartments, a Four Seasons hotel,
            and the world's highest observatory at approximately 664m.
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            Construction began in 2013 but was suspended in 2017 due to a combination of contractor
            disputes and broader Saudi economic pressures tied to the oil price cycle. Work resumed in
            2021 under the Vision 2030 programme, with the foundation and lower cores already in place.
            As of early 2026, the tower is estimated to reach its 1008m pinnacle by approximately 2028,
            though supertall projects of this scale routinely slip by 1–3 years.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            The tower's aerodynamic profile — three tapered wings radiating from a triangular core —
            was engineered to minimise wind loads. Its structural system combines a reinforced-concrete
            core with outrigger trusses and a perimeter moment frame, achieving stiffness ratios
            comparable to the Burj Khalifa despite being 180m taller. Once complete it will hold the
            record as the world's tallest building, overtaking Burj Khalifa after more than 18 years
            of uncontested dominance.
          </p>
        </div>
      </section>

      {/* Highlights */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Key Insights</h2>
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
          href="/uc23"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#fde725", color: "#000" }}
        >
          &larr; Back to live globe
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

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "UNESCO World Heritage Atlas — Technical Details — GRIP 3D",
  description:
    "Technical deep-dive into the UNESCO World Heritage Atlas: 200+ sites, category classification, choropleth country shading, endangered site tracking, and WebGL globe rendering with globe.gl.",
}

// ── Data ───────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Heritage sites",       value: "200+",  icon: "🏛️" },
  { label: "Countries represented", value: "80+",   icon: "🌍" },
  { label: "Categories",           value: "3",      icon: "🏷️" },
  { label: "Regions covered",      value: "6",      icon: "🗺️" },
  { label: "Endangered sites",     value: "40+",    icon: "🔴" },
  { label: "Earliest inscription", value: "1978",   icon: "📅" },
  { label: "Data source",          value: "UNESCO", icon: "📋" },
  { label: "Oldest site age",      value: "11,600 yr", icon: "🕰️" },
]

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "UNESCO World Heritage List",
    icon: "📋",
    color: "#06b6d4",
    desc: "The UNESCO World Heritage Committee has inscribed 1,199 properties across 168 countries since 1972. Our dataset includes 200+ of the most famous and geographically diverse sites, each with verified coordinates, inscription year, category, and UNESCO criteria.",
    tech: ["UNESCO WHC database", "Manual verification", "WGS-84 coordinates", "Inscription metadata"],
  },
  {
    n: "02",
    title: "Category Classification",
    icon: "🏷️",
    color: "#f59e0b",
    desc: "Each site is classified as Cultural (human-made heritage), Natural (geological or biological significance), or Mixed (both cultural and natural values). This three-way classification drives the colour scheme on the globe and enables category-based filtering.",
    tech: ["Cultural (criteria i-vi)", "Natural (criteria vii-x)", "Mixed (both sets)", "UNESCO criteria codes"],
  },
  {
    n: "03",
    title: "Endangered Status Tracking",
    icon: "🔴",
    color: "#ef4444",
    desc: "UNESCO maintains a List of World Heritage in Danger for sites threatened by conflict, development, natural disasters, or neglect. Our dataset flags 40+ endangered sites — including Aleppo, Palmyra, Virunga, and the Everglades — with special visual treatment on the globe.",
    tech: ["UNESCO Danger List", "Conflict zone monitoring", "Environmental threats", "Conservation status"],
  },
  {
    n: "04",
    title: "Regional Organisation",
    icon: "🗺️",
    color: "#22c55e",
    desc: "Sites are organised into six UNESCO regions: Europe, Asia, Americas, Africa, Oceania, and Arab States. This enables regional filtering and analysis of the geographic distribution of World Heritage sites.",
    tech: ["6 UNESCO regions", "Country-to-region mapping", "Geographic distribution", "Regional statistics"],
  },
  {
    n: "05",
    title: "Country Choropleth",
    icon: "🌐",
    color: "#a78bfa",
    desc: "Country polygons from Natural Earth / TopoJSON are shaded proportionally to the number of UNESCO sites each country holds. Italy leads with 59 sites, followed by China (57), Germany (52), and France (52). This choropleth layer provides immediate geographic context.",
    tech: ["TopoJSON 110m boundaries", "Country-level aggregation", "Opacity-scaled fill", "Click for country detail"],
  },
  {
    n: "06",
    title: "WebGL Globe Rendering",
    icon: "🖥️",
    color: "#06b6d4",
    desc: "Sites are rendered as colour-coded points on a globe.gl WebGL globe with a day-texture Earth image, bump mapping for terrain, and a cyan/teal atmosphere for a tourism aesthetic. Tooltips provide rich HTML with site details, and click events zoom to selected sites.",
    tech: ["globe.gl + Three.js", "Day Earth texture", "pointsData layer", "HTML tooltip labels"],
  },
]

const CATEGORIES = [
  {
    name: "Cultural",
    color: "#f59e0b",
    criteria: "i, ii, iii, iv, v, vi",
    count: "130+",
    examples: "Taj Mahal, Acropolis, Machu Picchu",
    desc: "Sites of outstanding universal value from a historical, artistic, or scientific point of view. Includes monuments, groups of buildings, and sites created by human effort or the combined works of nature and humanity.",
  },
  {
    name: "Natural",
    color: "#22c55e",
    criteria: "vii, viii, ix, x",
    count: "55+",
    examples: "Great Barrier Reef, Grand Canyon, Serengeti",
    desc: "Natural features of outstanding universal value from an aesthetic, scientific, or conservation perspective. Includes geological formations, habitats of threatened species, and areas of exceptional natural beauty.",
  },
  {
    name: "Mixed",
    color: "#a78bfa",
    criteria: "i-vi + vii-x",
    count: "15+",
    examples: "Machu Picchu, Meteora, Tongariro",
    desc: "Sites that satisfy criteria from both cultural and natural categories. These rare properties combine human heritage with exceptional natural features — only about 3% of all World Heritage Sites hold this designation.",
  },
]

const TECH_STACK = [
  { label: "Heritage dataset",  value: "200+ UNESCO sites",     icon: "🏛️" },
  { label: "Globe renderer",    value: "globe.gl + Three.js",   icon: "🌐" },
  { label: "Earth texture",     value: "Day satellite imagery",  icon: "🛰️" },
  { label: "Country borders",   value: "TopoJSON 110m",         icon: "🗺️" },
  { label: "Point rendering",   value: "pointsData layer",      icon: "📍" },
  { label: "Tooltip engine",    value: "HTML label overlays",   icon: "💬" },
  { label: "Framework",         value: "Next.js App Router",    icon: "⚡" },
  { label: "Coord system",      value: "WGS-84 / EPSG:4326",   icon: "📐" },
]

const HIGHLIGHTS = [
  {
    title: "Category colour coding",
    icon: "🎨",
    color: "#f59e0b",
    desc: "Each site point is coloured by category: amber (cultural), green (natural), purple (mixed). Endangered sites are highlighted in red with larger radius for immediate visibility.",
  },
  {
    title: "Country choropleth shading",
    icon: "🗺️",
    color: "#06b6d4",
    desc: "Country polygons are shaded by heritage site density — darker teal indicates more UNESCO sites. Click any country to see its sites listed in a detail panel.",
  },
  {
    title: "Multi-dimensional filtering",
    icon: "🔍",
    color: "#22c55e",
    desc: "Filter by category (cultural/natural/mixed), region (6 UNESCO regions), endangered status, and free-text search across site names and countries — all applied simultaneously.",
  },
  {
    title: "Rich site tooltips",
    icon: "💬",
    color: "#a78bfa",
    desc: "Hover over any site point for an HTML tooltip showing name, country, inscription year, category badge, endangered status, description, and UNESCO criteria codes.",
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function UC30DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/uc30"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
            &larr; Live Globe
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 30</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🏛️</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>
            UNESCO World Heritage Atlas
          </h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          200+ UNESCO World Heritage Sites on an interactive 3D globe &mdash; cultural landmarks,
          natural wonders, and endangered sites across 168 countries, categorised by Cultural, Natural,
          and Mixed with country-level choropleth shading and multi-dimensional filtering.
        </p>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
        {STATS.map(s => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className="text-xl font-bold mb-0.5" style={{ color: "#06b6d4" }}>{s.value}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Data pipeline ───────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          From the UNESCO World Heritage List to an interactive WebGL globe in six steps.
        </p>
        <div className="relative">
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #06b6d444, #22c55e44)" }} />

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

      {/* ── Category comparison ─────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Heritage Categories</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          UNESCO classifies World Heritage Sites into three categories based on the criteria they satisfy.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Category", "UNESCO Criteria", "Sites in Dataset", "Examples", "Description"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((r, i) => (
                <tr key={r.name}
                  style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--surface)" : "transparent" }}>
                  <td className="py-2.5 px-3 font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                        style={{ background: r.color }} />
                      <span style={{ color: r.color }}>{r.name}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{r.criteria}</td>
                  <td className="py-2.5 px-3 font-mono" style={{ color: r.color }}>{r.count}</td>
                  <td className="py-2.5 px-3 text-xs" style={{ color: "var(--text)" }}>{r.examples}</td>
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

      {/* ── About UNESCO WHC ──────────────────────────────────────────── */}
      <div className="mb-16 rounded-2xl p-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
          About UNESCO World Heritage
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              The UNESCO World Heritage Convention (1972) identifies cultural and natural heritage of
              outstanding universal value. As of 2024, the World Heritage List includes 1,199 properties
              across 168 countries &mdash; 933 cultural, 227 natural, and 39 mixed sites.
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Sites are nominated by member states and evaluated by ICOMOS (cultural) or IUCN (natural)
              advisory bodies. Inscription requires meeting at least one of ten selection criteria and
              demonstrating an adequate protection and management plan.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { term: "OUV", def: "Outstanding Universal Value -- cultural or natural significance that transcends national boundaries" },
              { term: "ICOMOS", def: "International Council on Monuments and Sites -- evaluates cultural nominations" },
              { term: "IUCN", def: "International Union for Conservation of Nature -- evaluates natural nominations" },
              { term: "Criteria", def: "Ten selection criteria (i-vi cultural, vii-x natural) that a site must satisfy for inscription" },
              { term: "Danger List", def: "Sites facing serious threats from conflict, development, natural disasters, or neglect" },
              { term: "Buffer Zone", def: "Protected area surrounding a site that provides additional layer of protection" },
            ].map(({ term, def }) => (
              <div key={term} className="flex gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0 self-start mt-0.5"
                  style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}>{term}</span>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{def}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Data sources ──────────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Data Sources</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              name: "UNESCO WHC",
              icon: "🏛️",
              role: "Primary heritage data",
              desc: "The official UNESCO World Heritage Centre maintains the definitive list of inscribed properties, including coordinates, criteria, description, and endangerment status.",
              color: "#06b6d4",
            },
            {
              name: "Natural Earth / TopoJSON",
              icon: "🗺️",
              role: "Country boundaries",
              desc: "110m-resolution country polygons from Natural Earth, converted to TopoJSON for efficient loading. Used for border rendering and choropleth shading.",
              color: "#22c55e",
            },
            {
              name: "Three Globe Textures",
              icon: "🌐",
              role: "Earth imagery",
              desc: "Day satellite imagery, bump topology, and night sky background from the three-globe example texture library for realistic globe rendering.",
              color: "#a78bfa",
            },
          ].map(src => (
            <div key={src.name} className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: `1px solid ${src.color}33` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{src.icon}</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: src.color }}>{src.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>{src.role}</p>
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{src.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="text-center pt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <Link href="/uc30"
          className="inline-block px-6 py-2.5 rounded-full text-sm font-medium"
          style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
          &larr; Back to Live Globe
        </Link>
      </div>
    </div>
  )
}

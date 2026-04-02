import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Global Crops & Agriculture — Technical Details — GRIP 3D",
  description:
    "Technical deep-dive into UC22: FAO STAT 2022 crop production dataset, 8 crop types across 80+ countries, green choropleth globe rendering with Three.js particle system, and production/yield/arable-land view modes.",
}

// ── Static data ────────────────────────────────────────────────────────────────

const STATS = [
  { val: "85+",      label: "Countries covered"      },
  { val: "8",        label: "Crops tracked"           },
  { val: "3",        label: "FAO indicators"          },
  { val: "2022",     label: "Year of data"            },
  { val: "80+",      label: "Arable land records"     },
  { val: "24 hrs",   label: "Cache TTL"               },
  { val: "FAO STAT", label: "Data source"             },
  { val: "Annual",   label: "Update frequency"        },
]

const PIPELINE = [
  {
    n: "01", icon: "🌱", color: "#4caf50",
    title: "FAO STAT 2022 Crop Dataset",
    desc: "The UN Food and Agriculture Organization (FAO) STAT database is the authoritative global source for agricultural production statistics. The QCL domain covers crop production in tonnes, yield in tonnes per hectare, and area harvested in hectares. This implementation uses a curated static extract of 2022 data for 8 major crops — wheat, rice, maize, soybeans, coffee, cocoa, sugarcane, and cotton — spanning 80+ producing countries, ensuring reliable offline availability without dependency on FAO's legacy HTTP API.",
    tech: ["FAO STAT QCL domain", "8 crop types", "80+ countries", "Production · Yield · Area harvested"],
  },
  {
    n: "02", icon: "📐", color: "#8bc34a",
    title: "Normalisation & Projection",
    desc: "Each crop dataset is normalised independently: the maximum production value for the selected crop becomes 1.0, and all other countries are scaled proportionally. This per-crop normalisation means the colour gradient always spans the full range regardless of absolute production scale — allowing meaningful comparison between high-volume crops like sugarcane (>700M t/yr) and low-volume crops like cocoa (~4M t/yr). Country centroids provide approximate lat/lng for point placement on the globe surface.",
    tech: ["Per-crop max normalisation", "Country centroid lat/lng", "0.0 – 0.8 altitude mapping", "Three view modes: production / yield / arable"],
  },
  {
    n: "03", icon: "🌍", color: "#cddc39",
    title: "Three.js BufferGeometry Point Cloud",
    desc: "Each country is rendered as a glowing sprite particle in a Three.js BufferGeometry point cloud attached directly to the globe.gl scene graph. Point altitude above the globe surface is proportional to the normalised production value, creating a visual 3D bar-chart effect on the sphere. The sprite texture is a radial canvas gradient from bright yellow-green at the centre to transparent at the edges, softened to avoid harsh edges at all viewing distances.",
    tech: ["Three.js BufferGeometry", "32×32 canvas sprite texture", "Altitude ∝ production", "Vertex colour array — green gradient"],
  },
  {
    n: "04", icon: "🎨", color: "#7ec850",
    title: "Green Choropleth Colour Scale",
    desc: "The five-stop green gradient — dark navy (#1a1a2e) for no data, dark forest (#1a5f2a) for low, mid-green (#3d9142), bright green (#7ec850), to yellow-green (#c8f070) for very high — echoes vegetation mapping conventions and distinguishes agricultural intensity at a glance. The gradient is computed client-side by linear interpolation between stop colours, with the normalised value clamped to [0, 1] and mapped through the colour ramp.",
    tech: ["5-stop green gradient", "Linear colour interpolation", "Low → High: #1a5f2a → #c8f070", "Vertex colours updated on crop/view change"],
  },
  {
    n: "05", icon: "🖱", color: "#4caf50",
    title: "Raycaster Hover & Click Interaction",
    desc: "Mouse hover and click events are handled by a Three.js Raycaster with a 4-unit point threshold. On hover, a floating tooltip shows the country name and its value for the selected crop/view. On click, the globe animates to centre on the selected country and the sidebar detail panel opens with full statistics: production in thousand tonnes, yield in t/ha, harvested area in thousand ha, and percentage of world total. The top-10 producers leaderboard updates instantly when the crop or view mode changes.",
    tech: ["Three.js Raycaster", "4-unit point threshold", "Hover tooltip", "Click → fly to country + stats panel"],
  },
]

const TECH = [
  { icon: "🌾", label: "Data source",      value: "FAO STAT 2022 (static extract)"    },
  { icon: "🌍", label: "Globe",            value: "globe.gl + Three.js WebGL"         },
  { icon: "🎨", label: "Visualisation",    value: "BufferGeometry point cloud"        },
  { icon: "📊", label: "Crops",            value: "Wheat, Rice, Maize, Soy, Coffee, Cocoa, Sugarcane, Cotton" },
  { icon: "📍", label: "Interaction",      value: "Hover tooltip + click detail panel" },
  { icon: "🌈", label: "Colour scale",     value: "5-stop green gradient (#1a5f2a → #c8f070)" },
  { icon: "📐", label: "Normalisation",    value: "Per-crop max-value scaling"        },
  { icon: "⚡",  label: "Cache",           value: "24-hour edge cache"                },
]

const HIGHLIGHTS = [
  {
    title: "Three view modes",
    body:  "Switch between production volume (thousand tonnes), yield (tonnes/hectare), and arable land percentage to reveal different aspects of agricultural geography — a country can be a top producer by volume but mid-range on yield efficiency.",
    color: "#4caf50",
  },
  {
    title: "Altitude = magnitude",
    body:  "Point altitude above the globe surface scales with the normalised production value, creating an intuitive 3D bar-chart-on-a-sphere effect. High-producing countries (China and India for rice; USA and Brazil for maize) visibly tower above others.",
    color: "#7ec850",
  },
  {
    title: "Crop diversity",
    body:  "The eight crops span five commodity categories: cereals (wheat, rice, maize), oilseeds (soybeans), beverages (coffee, cocoa), energy/fibre (sugarcane, cotton). Together they account for the majority of global calorie supply and traded agricultural commodity value.",
    color: "#c8f070",
  },
]

// ── Component ──────────────────────────────────────────────────────────────────

export default function UC22DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Back link */}
      <Link
        href="/uc22"
        className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "var(--muted)" }}
      >
        ← Back to live globe
      </Link>

      {/* Badge + heading */}
      <div className="mb-4">
        <span
          className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ background: "rgba(76,175,80,0.12)", color: "#7ec850", border: "1px solid rgba(76,175,80,0.3)" }}
        >
          UC22 · Crops & Agriculture
        </span>
      </div>
      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
        Global Crops & Agriculture
      </h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>
        FAO STAT 2022 production data for eight major crops across 85+ countries, rendered as a
        colour-scaled point cloud on a WebGL globe. Switch between production volume, yield
        efficiency, and arable land percentage — click any country for detailed statistics.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl font-bold mb-1" style={{ color: "#7ec850" }}>{s.val}</p>
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

      {/* About FAO */}
      <section className="mb-14">
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(76,175,80,0.05)", border: "1px solid rgba(76,175,80,0.2)" }}
        >
          <h2 className="text-xl font-bold mb-3" style={{ color: "#7ec850" }}>About FAO STAT</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            The Food and Agriculture Organization of the United Nations (FAO) maintains FAOSTAT, the
            world's largest freely accessible database of food and agriculture statistics. The QCL
            domain (Crops and Livestock Products) covers production quantity, yield, and area
            harvested for over 200 crop items across 200+ countries and territories, with annual
            data going back to 1961.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Production figures are reported by national statistical offices and validated by FAO
            regional experts. Values are expressed in tonnes for production and tonnes per hectare
            for yield. Arable land percentages are sourced from the World Bank World Development
            Indicators (AG.LND.AGRI.ZS), which draws from FAO land-use surveys.
          </p>
        </div>
      </section>

      {/* Highlights */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Highlights</h2>
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
          href="/uc22"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#4caf50", color: "#fff" }}
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

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Ocean Crisis Atlas — Technical Details — GRIP 3D",
  description:
    "Technical deep-dive: 5 ocean garbage patches (GeoJSON polygons), 80+ plastic concentration hotspots, 40 coral bleaching events from NOAA's 4th global mass bleaching (2024), 5 ocean gyre arcs, 60 SST anomaly points, and interactive country borders — rendered on a WebGL globe using globe.gl.",
}

// ── Stats ──────────────────────────────────────────────────────────────────────

const STATS = [
  { val: "5",      label: "Ocean garbage patches" },
  { val: "80+",    label: "Plastic hotspot points" },
  { val: "40",     label: "Bleaching events (2024)" },
  { val: "5",      label: "Ocean current gyres" },
  { val: "60",     label: "SST anomaly points" },
  { val: "177",    label: "Country borders rendered" },
  { val: "150M+",  label: "Tonnes plastic in ocean" },
  { val: "54%",    label: "Coral reefs bleached globally" },
  { val: "+3.2°C", label: "Peak N. Atlantic anomaly 2024" },
]

// ── Pipeline ───────────────────────────────────────────────────────────────────

const PIPELINE = [
  {
    n: "01", icon: "♻", color: "#ff7020",
    title: "Ocean Garbage Patches — GeoJSON Polygons",
    desc: "The five major ocean garbage patches — Great Pacific (1.6M km²), North Atlantic, South Pacific, South Atlantic, and Indian Ocean — are represented as GeoJSON Polygon features with hand-traced approximate boundary coordinates. Each polygon stores the patch name, estimated area in km², approximate plastic mass in tonnes, and year of discovery. They are rendered as semi-transparent orange polygons using globe.gl's polygonsData() API at a slight altitude above the ocean surface, giving a clear aerial silhouette of accumulation zones.",
    tech: ["GeoJSON Polygon features", "globe.gl polygonsData()", "0.8% altitude above surface", "Semi-transparent orange fill (rgba 18% opacity)", "Hover labels with area, mass, discovered year"],
  },
  {
    n: "02", icon: "🔴", color: "#ff3030",
    title: "Plastic Concentration Hotspots — ScatterplotLayer equivalent",
    desc: "80+ point features mark plastic concentration hotspots across all five garbage patches and major coastal river outflows. Points are sourced from oceanographic survey literature and The Ocean Cleanup project data. Each point carries a concentration tier (critical / high / moderate / low) and a plastic density figure in kg/km². Point radius scales with severity; colour uses a red–orange–amber–yellow gradient. Coastal river outflows (Yangtze, Mekong, Ganges, Nile, Niger, and 8 more) are tagged with their source name and typically carry the highest densities, reflecting the fact that ~80% of ocean plastic originates from river systems.",
    tech: ["80+ hardcoded points", "globe.gl pointsData()", "4-tier severity scale", "Radius: critical 0.7 → low 0.3", "Coastal river attribution"],
  },
  {
    n: "03", icon: "🪸", color: "#ff0080",
    title: "2024 Coral Bleaching Events — NOAA Coral Reef Watch",
    desc: "The 2024 4th Global Mass Coral Bleaching Event was declared by NOAA and the International Coral Reef Initiative in March 2024. It is the largest and most severe bleaching event on record, affecting reefs in every major ocean basin. 40 individual reef events are mapped using NOAA Coral Reef Watch alert levels: Watch (yellow) → Warning (amber) → Alert Level 1 (red-orange) → Alert Level 2 (hot pink). Notable events include the Great Barrier Reef at 91% bleached, Florida Keys at 97%, Hawaii at 100% of surveyed reefs, and Flower Garden Banks (Gulf of Mexico) at 96%. A pulse animation (altitude oscillation) visually communicates the urgency. An CRISIS ALERT banner is pinned to the top of the viewport.",
    tech: ["40 bleaching events", "NOAA Coral Reef Watch alert levels (Watch/Warning/Alert1/Alert2)", "Pulse animation via altitude oscillation", "globe.gl pointsData()", "Color: hot-pink gradient by severity"],
  },
  {
    n: "04", icon: "🌊", color: "#00aaff",
    title: "Ocean Current Gyres — Animated Arc Paths",
    desc: "The five major ocean gyres that concentrate plastic are visualised as animated dashed great-circle arcs: North Pacific (clockwise), South Pacific (counterclockwise), North Atlantic (clockwise), South Atlantic (counterclockwise), and the Indian Ocean Gyre. Each gyre is decomposed into four directional arc segments (north, east, south, west legs) to trace the rough circular current path. Arcs are rendered using globe.gl's arcsData() API with a 5-second dash animation, colour-coded by ocean basin, and arced to 18% altitude to avoid clipping through the globe surface.",
    tech: ["5 gyres × 4 arc segments = 20 arcs", "globe.gl arcsData()", "arcDashAnimateTime: 5000ms", "0.18 altitude arcing", "Basin-coded colours (cyan, blue, teal)"],
  },
  {
    n: "05", icon: "🌡", color: "#ff9930",
    title: "Sea Surface Temperature Anomalies — 2024 Records",
    desc: "60 points mark ocean areas with record-breaking positive SST anomalies in 2024, based on NOAA's Optimum Interpolation SST v2 and Copernicus Marine Service data. The 2024 anomalies are historically unprecedented: the North Atlantic averaged +3°C above the 1991–2020 baseline for months; the Arctic Ocean reached +4.2°C in some areas; the Gulf of Mexico and Mediterranean both exceeded +2.5°C. Point colour uses a continuous blue → cyan → amber → red thermal ramp keyed to the anomaly magnitude. Point radius also scales with anomaly so the most extreme spots are visually dominant.",
    tech: ["60 anomaly points", "globe.gl pointsData()", "Thermal colour ramp (blue → red)", "Radius scales with anomaly magnitude (0.35–1.0)", "NOAA/Copernicus 1991–2020 baseline"],
  },
  {
    n: "06", icon: "🔀", color: "#aa55ff",
    title: "3-Mode Globe View Switching",
    desc: "Three view modes are available via the left panel: Plastic (garbage patches + hotspot points + gyre arcs), Bleaching (bleaching event points with pulse animation), and Temp Anomaly (SST anomaly heat map). On mode switch, globe.gl's layer data is swapped live — pointsData(), polygonsData(), and arcsData() are all updated simultaneously without remounting the globe. The camera smoothly repositions to the most relevant region for each mode: Pacific-centred for Plastic (the most dramatic garbage patch view), Indo-Pacific for Bleaching (GBR focus), and North Atlantic for Temperature (where the 2024 record anomalies are most pronounced).",
    tech: ["globe.gl hot-swap layer data", "pointsData + polygonsData + arcsData updated per mode", "Smooth pointOfView() camera transitions", "3 accent colour themes (orange / pink / amber)", "View-specific default camera positions"],
  },
  {
    n: "07", icon: "🗺", color: "#fde725",
    title: "Interactive Country Borders",
    desc: "All 177 country polygons from the Natural Earth 110m dataset are rendered as a persistent border overlay that stays active across all three view modes. Country borders use a subtle white stroke (18% opacity) by default, brightening on hover (60%) and turning gold on click (90%). Clicking a country flies the camera to the country's centroid, selects it, and opens a stats panel showing the number of plastic pollution zones, coral bleaching events, and SST anomaly readings within the country's bounding region. The country polygon layer is merged with garbage patches in plastic mode — both datasets are combined into a single polygonsData() call with type-discriminated colour/altitude callbacks, since globe.gl exposes a single polygon slot.",
    tech: ["Natural Earth 110m GeoJSON (countries-110m.geojson)", "globe.gl polygonsData() merged with garbage patches", "Type-discriminated per-polygon colour callbacks", "featureCentroid() bounding-box centroid for camera fly-to", "featureBbox() for regional data filtering", "Country stats: plastic zones · bleaching events · SST anomalies"],
  },
]

// ── Tech stack ─────────────────────────────────────────────────────────────────

const TECH = [
  { icon: "🌐", label: "Globe renderer",      value: "globe.gl + Three.js WebGL" },
  { icon: "🌍", label: "Earth texture",       value: "NASA Blue Marble Night (unpkg CDN)" },
  { icon: "♻",  label: "Patch geometry",      value: "Hardcoded GeoJSON Polygon features" },
  { icon: "🔴", label: "Plastic data",        value: "80+ hardcoded points — survey literature + Ocean Cleanup" },
  { icon: "🪸", label: "Bleaching data",      value: "40 events — NOAA Coral Reef Watch 2024" },
  { icon: "🌊", label: "Gyre arcs",           value: "5 gyres × 4 arc segments, globe.gl arcsData()" },
  { icon: "🌡", label: "SST anomalies",       value: "60 points — NOAA OISST / Copernicus 2024" },
  { icon: "🗺", label: "Country borders",     value: "Natural Earth 110m — 177 countries, hover/click interactive" },
  { icon: "📐", label: "Framework",           value: "Next.js App Router — dynamic import (no SSR)" },
  { icon: "🎨", label: "Colour scheme",       value: "Deep red / orange / pink / thermal ramp on #000 background" },
  { icon: "⚡", label: "Animation",           value: "Gyre arc dash (5s), bleaching altitude pulse (800ms)" },
]

// ── Highlights ─────────────────────────────────────────────────────────────────

const HIGHLIGHTS = [
  {
    title: "Why is 2024 the 4th global bleaching event?",
    body: "NOAA and ICRI define a 'global' bleaching event as one where bleaching alert levels are triggered in each major ocean basin simultaneously — Atlantic, Pacific, and Indian Ocean. Only four such events have occurred: 1998, 2010, 2015–2017, and the ongoing 2024 event. The 2024 event was declared in March 2024 and is driven by a combination of background global warming and a strong El Niño episode that elevated sea surface temperatures across most tropical reef zones simultaneously.",
  },
  {
    title: "Why do garbage patches form where they do?",
    body: "Ocean gyres — the large-scale circular current systems — act as centripetal convergence zones. Buoyant plastic debris enters the ocean (mostly via rivers and coastal communities) and is swept into these gyres. Because gyres rotate, debris gradually migrates toward the centre where convergence is greatest. The Great Pacific Garbage Patch sits in the North Pacific Subtropical Gyre and covers an estimated 1.6 million km². Importantly, 'patch' is misleading: the plastic is not a solid island but a diffuse soup of mostly microplastics, with only ~80,000 tonnes of macro debris.",
  },
  {
    title: "What drove the 2024 North Atlantic temperature record?",
    body: "In 2023–2024, the North Atlantic measured +3°C or more above the 1991–2020 baseline for several months running — a truly unprecedented anomaly. Contributing factors include a reduction in Saharan dust (which normally cools the Atlantic by blocking sunlight), a decrease in aerosol pollution from shipping (the 2020 IMO low-sulphur fuel rules reduced ship trail clouds that had been cooling the ocean), and the baseline El Niño-driven global warming trend. The anomaly contributed directly to the 2024 Atlantic hurricane season and widespread Caribbean coral bleaching.",
  },
  {
    title: "Data sourcing and hardcoding rationale",
    body: "Unlike live-data UCs (GDP, FX), ocean plastic and bleaching data does not have a free real-time API. NOAA Coral Reef Watch provides point-in-time alerts but behind an authenticated query interface. The plastic density data comes from oceanographic surveys with multi-year lag times. Hardcoding the 2024 dataset provides a stable, accurate snapshot that tells the crisis story clearly without API latency or rate-limit issues. All data is clearly attributed and sourced from peer-reviewed literature and NOAA reports.",
  },
  {
    title: "Why merge country borders with garbage patches in one polygonsData() call?",
    body: "globe.gl exposes a single polygon layer via polygonsData() — there is no secondary polygon slot. To show both country borders and garbage patch outlines simultaneously, both feature sets are combined into one array and passed to a single polygonsData() call. Per-polygon colour, stroke, altitude, and label callbacks use a type guard (checking for the plasticTonnes property on GarbagePatch features) to apply distinct styles to each type. This merge-and-discriminate pattern avoids mounting additional Three.js geometries and keeps the globe's render loop single-pass.",
  },
]

// ── Page component ─────────────────────────────────────────────────────────────

export default function UC25DetailsPage() {
  const accentColor = "#ff7020"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/uc25"
        className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "var(--muted)" }}>
        ← Back to live globe
      </Link>

      <div className="mb-4">
        <span
          className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ background: "rgba(255,112,32,0.1)", color: accentColor, border: "1px solid rgba(255,112,32,0.3)" }}>
          UC25 · Ocean Crisis Atlas
        </span>
      </div>

      {/* Crisis alert banner */}
      <div className="mb-6 px-5 py-3 rounded-xl text-sm font-semibold text-center"
           style={{ background: "rgba(255,0,60,0.1)", border: "1px solid rgba(255,0,60,0.35)", color: "#ff2244" }}>
        CRISIS ALERT — 2024 — 4th Global Mass Coral Bleaching Event Declared by NOAA/ICRI
      </div>

      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
        Ocean Plastic &amp; Climate Crisis
      </h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>
        A globe visualisation of the five major ocean garbage patches, 80+ plastic concentration hotspots, 40 coral bleaching events from the historic 2024 4th Global Mass Bleaching Event, five ocean current gyres, and 60 sea surface temperature anomaly points — all on a WebGL globe powered by globe.gl.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-14">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xl font-bold mb-1 break-all" style={{ color: accentColor }}>{s.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Data & Visualisation Pipeline</h2>
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

      {/* Highlights */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Science & Design Notes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HIGHLIGHTS.map(h => (
            <div
              key={h.title}
              className="rounded-xl p-5"
              style={{ background: "rgba(255,112,32,0.04)", border: "1px solid rgba(255,112,32,0.15)" }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: accentColor }}>{h.title}</h3>
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

      {/* Garbage patches table */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>The Five Ocean Garbage Patches</h2>
        <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Patch", "Ocean", "Area (km²)", "Est. Plastic", "Discovered"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wider"
                      style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Great Pacific", ocean: "North Pacific", area: "1,600,000", plastic: "80,000 t", disc: 1997 },
                { name: "North Atlantic", ocean: "North Atlantic", area: "700,000", plastic: "30,000 t", disc: 2010 },
                { name: "South Pacific", ocean: "South Pacific", area: "500,000", plastic: "25,000 t", disc: 2011 },
                { name: "Indian Ocean", ocean: "Indian Ocean", area: "500,000", plastic: "20,000 t", disc: 2010 },
                { name: "South Atlantic", ocean: "South Atlantic", area: "400,000", plastic: "18,000 t", disc: 2015 },
              ].map((row, i) => (
                <tr key={row.name}
                    style={{ borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: accentColor }}>{row.name}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>{row.ocean}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: "var(--muted)" }}>{row.area}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: "var(--muted)" }}>{row.plastic}</td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{row.disc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bleaching events highlight table */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Key 2024 Bleaching Events</h2>
        <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Reef / Location", "Ocean", "% Bleached", "Alert Level"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wider"
                      style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { reef: "Great Barrier Reef — Northern", ocean: "Coral Sea", pct: 95, level: "Alert 2" },
                { reef: "Flower Garden Banks", ocean: "Gulf of Mexico", pct: 96, level: "Alert 2" },
                { reef: "Florida Keys — Upper", ocean: "Atlantic", pct: 97, level: "Alert 2" },
                { reef: "Hawaii — West Maui", ocean: "Pacific", pct: 100, level: "Alert 2" },
                { reef: "Maldives — North Atoll", ocean: "Indian Ocean", pct: 94, level: "Alert 2" },
                { reef: "Red Sea — Saudi Arabia N.", ocean: "Red Sea", pct: 92, level: "Alert 2" },
                { reef: "Micronesia — Pohnpei", ocean: "Pacific", pct: 90, level: "Alert 2" },
                { reef: "Thailand — Surin Islands", ocean: "Andaman Sea", pct: 90, level: "Alert 2" },
              ].map((row, i) => (
                <tr key={row.reef}
                    style={{ borderBottom: i < 7 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: "#ff0080" }}>{row.reef}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>{row.ocean}</td>
                  <td className="px-4 py-3 font-mono font-bold" style={{ color: "#ff2244" }}>{row.pct}%</td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{row.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Attribution */}
      <section className="mb-14">
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(255,112,32,0.04)", border: "1px solid rgba(255,112,32,0.2)" }}>
          <h2 className="text-xl font-bold mb-3" style={{ color: accentColor }}>Data Attribution</h2>
          <ul className="space-y-2">
            {[
              { src: "NOAA Coral Reef Watch", note: "Coral bleaching alert levels (Watch / Warning / Alert 1 / Alert 2), 2024 global mass bleaching declaration. Free public dataset." },
              { src: "International Coral Reef Initiative (ICRI)", note: "Co-declaration of the 4th Global Mass Bleaching Event, March 2024. Reef-level bleaching percentage estimates." },
              { src: "The Ocean Cleanup / GESAMP", note: "Plastic density estimates per garbage patch zone and river outflow hotspot rankings. Published 2021–2023." },
              { src: "NOAA OISST v2 / Copernicus Marine Service", note: "2024 sea surface temperature anomaly data vs. 1991–2020 baseline. North Atlantic +3°C anomaly confirmed records." },
              { src: "Oceanographic literature", note: "Garbage patch polygon outlines approximate boundaries from published coordinates (Law et al. 2010, Lebreton et al. 2018). Not exact legal or regulatory boundaries." },
            ].map(item => (
              <li key={item.src} className="text-sm" style={{ color: "var(--muted)" }}>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{item.src}:</span>{" "}
                {item.note}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/uc25"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: accentColor, color: "#fff" }}>
          ← Back to live globe
        </Link>
        <Link
          href="/use-cases"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>
          All use cases
        </Link>
        <Link
          href="/contact"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(255,112,32,0.1)", color: accentColor, border: "1px solid rgba(255,112,32,0.3)" }}>
          Get in touch →
        </Link>
      </div>
    </div>
  )
}

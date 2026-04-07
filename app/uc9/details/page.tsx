import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "World History & Civilization Atlas — Architecture \u00b7 GRIP 3D",
  description:
    "Technical deep-dive: 13 historical eras, 60+ empires, 80+ events, 40+ migration flows, and 8 world religions rendered on a globe.gl WebGL globe with animated arc layers.",
}

const STATS = [
  { val: "13",     label: "Historical eras covered" },
  { val: "60+",    label: "Empires mapped on globe" },
  { val: "80+",    label: "Key events with details" },
  { val: "40+",    label: "Migration flows animated" },
  { val: "8+",     label: "World religions tracked" },
  { val: "2,500",  label: "Years of history (500 BC\u20132025)" },
  { val: "4",      label: "Toggleable visualization layers" },
  { val: "Apr 2026", label: "Dataset last updated" },
]

const PIPELINE = [
  {
    n: "01", icon: "\u{1F4DC}", color: "#c084fc",
    title: "Historical Era Data Model",
    desc: "13 eras from Classical Antiquity (500 BC) to the Modern Era (2025). Each era includes a unique color, date range, and contextual description. Era transitions update all globe layers, atmosphere color, and the timeline indicator simultaneously.",
    tech: ["13 curated eras", "500 BC \u2013 2025 AD", "Color-coded timeline", "Smooth transitions"],
  },
  {
    n: "02", icon: "\u{1F3F0}", color: "#a78bfa",
    title: "Empire Visualization Layer",
    desc: "60+ empires rendered as globe.gl point clouds with radii proportional to territorial extent. From the Achaemenid Persian Empire to modern superpowers, each includes capital city, peak population, and precise date range. Points use per-empire colors with semi-transparency for overlap visibility.",
    tech: ["pointsData with variable radius", "Empire-specific hex colors", "Low altitude (0.01) for territory feel", "Click for capital & population"],
  },
  {
    n: "03", icon: "\u{1F54C}", color: "#34d399",
    title: "Religion Spread Layer",
    desc: "8+ world religions tracked across all 13 eras with regional percentage data. Each religion\u2013region pair is a separate point, sized by adherent percentage. Colors follow consistent religion-specific palettes (e.g., Christianity=blue, Islam=emerald, Hinduism=amber, Buddhism=violet).",
    tech: ["Religion-specific color palette", "Regional percentage sizing", "Semi-transparent overlap", "Percentage bar in detail panel"],
  },
  {
    n: "04", icon: "\u26A1", color: "#ef4444",
    title: "Historical Events Layer",
    desc: "80+ pivotal events categorized by type (war, revolution, treaty, formation, collapse, discovery, partition) and significance (major, significant, notable). Point size scales with significance; color encodes event type. Click any event for year, description, and historical context.",
    tech: ["7 event type categories", "3 significance levels", "Type-specific color coding", "Detailed description on click"],
  },
  {
    n: "05", icon: "\u{1F6A2}", color: "#06b6d4",
    title: "Migration Flows (Arcs)",
    desc: "40+ migration flows rendered as animated dashed arcs on the globe. Each arc connects origin and destination coordinates with animated dash movement indicating direction. Includes people count, reason for migration, and era-specific coloring. From the Bantu Expansion to the Syrian Refugee Crisis.",
    tech: ["globe.gl arcsData", "Animated dash arcs", "Direction-indicating animation", "People count & reason on click"],
  },
  {
    n: "06", icon: "\u{1F30D}", color: "#fbbf24",
    title: "Country Borders & Interaction",
    desc: "GeoJSON country polygons (110m resolution) provide modern political boundaries as context. Borders appear as subtle white outlines, highlight yellow on hover, and support click-to-fly-to interaction. The same proven pattern used across all GRIP 3D globe use cases.",
    tech: ["countries-110m.geojson", "White borders, yellow on select", "Click to fly-to centroid", "Hover name tooltip"],
  },
]

const ERA_OVERVIEW = [
  { era: "Classical Antiquity", period: "500 BC \u2013 0 AD", empires: "Roman Republic, Achaemenid Persia, Maurya, Han, Greek city-states, Carthage", events: "Thermopylae, Alexander, Ashoka, Caesar" },
  { era: "Rise of Christianity", period: "0 \u2013 500 AD", empires: "Roman Empire, Gupta, Sassanid Persia, Aksum, Kushan", events: "Crucifixion, Fall of Rome, Constantine, Nicaea" },
  { era: "Islamic Golden Age", period: "500 \u2013 1000 AD", empires: "Umayyad/Abbasid, Tang, Byzantine, Carolingian, Ghana", events: "Birth of Islam, Tours, Vikings, Baghdad founded" },
  { era: "Mongol Empire & Crusades", period: "1000 \u2013 1300", empires: "Mongol Empire, Song, Holy Roman Empire, Delhi Sultanate, Khmer", events: "First Crusade, Genghis Khan, Magna Carta, Fall of Baghdad" },
  { era: "Renaissance & Ottoman Rise", period: "1300 \u2013 1500", empires: "Ottoman, Ming, Aztec, Inca, Vijayanagara, Majapahit, Mali", events: "Black Death, Constantinople falls, Gutenberg, Columbus" },
  { era: "Age of Exploration", period: "1500 \u2013 1700", empires: "Spanish, Portuguese, Mughal, Qing, Ottoman, Safavid", events: "Luther, Cortez, Mughal founded, Galileo, Westphalia" },
  { era: "Enlightenment & Colonies", period: "1700 \u2013 1800", empires: "British, French, Qing (peak), Russian, Ottoman, Maratha", events: "American Rev., French Rev., Industrial Rev., Cook" },
  { era: "Industrial Revolution", period: "1800 \u2013 1900", empires: "British (peak), French, Russian, German, Meiji Japan, Qing (decline)", events: "Napoleon, US Civil War, Scramble for Africa, Meiji" },
  { era: "World Wars", period: "1900 \u2013 1945", empires: "British, French, Nazi Germany, Japanese, Soviet Union", events: "WWI, Russian Rev., Versailles, WWII, Holocaust, Hiroshima" },
  { era: "Cold War & Decolonization", period: "1945 \u2013 1970", empires: "USA, USSR, PRC, British (end), French Union", events: "Partition, Israel, Korea, Cuba, African independence" },
  { era: "Late Cold War", period: "1970 \u2013 1991", empires: "USSR, USA, PRC (Deng), European Community", events: "Iran Rev., Afghan War, Berlin Wall, USSR dissolves" },
  { era: "Post-Cold War", period: "1991 \u2013 2010", empires: "USA, EU, PRC (rising), Russia, India", events: "Yugoslavia, 9/11, Iraq, Rwanda, Mandela, EU expansion" },
  { era: "Modern Era", period: "2010 \u2013 2025", empires: "USA, PRC, EU, India, Russia", events: "Arab Spring, Syria, Crimea, Brexit, COVID-19, Ukraine" },
]

const DESIGN_HIGHLIGHTS = [
  {
    title: "Interactive Era Timeline",
    desc: "Full-width timeline bar at bottom with clickable era segments. Each era is color-coded and shows its period. The bar visually represents the proportional duration of each era across 2,525 years.",
  },
  {
    title: "4 Independent Layer Toggles",
    desc: "Empires, religions, events, and migrations can each be toggled independently. Combine layers to see how religious spread correlated with empire expansion, or how wars triggered migration flows.",
  },
  {
    title: "Context-Rich Detail Panels",
    desc: "Click any point or arc for a rich detail panel: empires show capital and population, religions show regional percentages with a visual bar, events show type badges and descriptions, migrations show people counts and reasons.",
  },
  {
    title: "Atmospheric Era Transitions",
    desc: "The globe\u2019s atmosphere color shifts to match the current era\u2019s palette \u2014 purple for classical, red for world wars, cyan for post-cold war \u2014 providing an immediate visual cue for the time period.",
  },
]

export default function UC09DetailsPage() {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <Link href="/uc9"
          className="inline-flex items-center gap-1 text-sm mb-6"
          style={{ color: "#c084fc" }}>
          {"\u2190"} Back to Globe
        </Link>

        <h1 className="text-3xl font-bold mb-2">World History & Civilization Atlas</h1>
        <p className="text-lg mb-8" style={{ color: "var(--muted)" }}>
          2,500 years of human history on a 3D WebGL globe \u2014 empires, religions, migrations, and pivotal events from 500 BC to 2025, organized across 13 historical eras with animated visualization layers.
        </p>

        {/* ── Stats grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {STATS.map(s => (
            <div key={s.label} className="rounded-xl p-4"
              style={{ background: "rgba(192,132,252,0.06)", border: "1px solid rgba(192,132,252,0.15)" }}>
              <p className="text-2xl font-bold font-mono" style={{ color: "#c084fc" }}>{s.val}</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Pipeline ────────────────────────────────────────────────────────── */}
        <h2 className="text-xl font-bold mb-6">Data Pipeline & Visualization Layers</h2>
        <div className="space-y-6 mb-12">
          {PIPELINE.map(step => (
            <div key={step.n} className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono font-bold px-2 py-1 rounded"
                  style={{ background: step.color + "22", color: step.color }}>{step.n}</span>
                <span className="text-lg">{step.icon}</span>
                <h3 className="font-semibold">{step.title}</h3>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>{step.desc}</p>
              <div className="flex flex-wrap gap-2">
                {step.tech.map(t => (
                  <span key={t} className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Era overview ────────────────────────────────────────────────────── */}
        <h2 className="text-xl font-bold mb-6">13 Historical Eras</h2>
        <div className="space-y-3 mb-12">
          {ERA_OVERVIEW.map((e, i) => (
            <div key={i} className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold">{e.era}</h3>
                <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{e.period}</span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                <span className="opacity-60">Empires:</span> {e.empires}
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                <span className="opacity-60">Key Events:</span> {e.events}
              </p>
            </div>
          ))}
        </div>

        {/* ── Design highlights ────────────────────────────────────────────────── */}
        <h2 className="text-xl font-bold mb-6">Design Highlights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {DESIGN_HIGHLIGHTS.map(d => (
            <div key={d.title} className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-semibold mb-2">{d.title}</h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{d.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Tech stack ──────────────────────────────────────────────────────── */}
        <h2 className="text-xl font-bold mb-4">Tech Stack</h2>
        <div className="flex flex-wrap gap-2 mb-12">
          {["Next.js 15 (App Router)", "React 19", "globe.gl", "Three.js (via globe.gl)", "TypeScript", "Tailwind CSS", "GeoJSON 110m boundaries", "Static curated dataset"].map(t => (
            <span key={t} className="text-sm px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.2)", color: "#c084fc" }}>
              {t}
            </span>
          ))}
        </div>

        {/* ── Methodology note ────────────────────────────────────────────────── */}
        <div className="rounded-xl p-5 mb-8"
          style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <h3 className="font-semibold mb-2" style={{ color: "#fbbf24" }}>Historical Methodology Note</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            This visualization presents mainstream historical consensus as documented in peer-reviewed academic sources and established reference works. All dates, territorial extents, and population figures are approximate. Empire boundaries are represented as influence zones (point radii), not precise political borders, which changed frequently throughout history. Religious percentage data reflects scholarly estimates and varies by source. The dataset aims for balanced, factual presentation without political bias. Feedback and corrections are welcome.
          </p>
        </div>

        <div className="text-center">
          <Link href="/uc9"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "#c084fc", color: "#000" }}>
            Launch Globe {"\u2192"}
          </Link>
        </div>
      </div>
    </div>
  )
}

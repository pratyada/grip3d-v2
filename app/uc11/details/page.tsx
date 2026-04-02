import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Live Radio Stations on the Globe — Architecture · GRIP 3D",
  description:
    "Technical deep-dive into the Live Radio Stations use case: Radio-Browser API ingestion, geolocation resolution, genre/language tagging, audio stream validation, cluster density computation, and globe rendering.",
}

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "Radio-Browser API Ingestion",
    icon: "📻",
    color: "#ff6644",
    desc: "All active radio stations are fetched from the Radio-Browser community API, which aggregates 26,000+ internet radio stations from 246 countries. Station records include stream URL, name, country, language, tags, codec, bitrate, and vote count.",
    tech: ["Radio-Browser REST API", "26,000+ stations", "246 countries", "Stream metadata"],
  },
  {
    n: "02",
    title: "Geolocation Resolution",
    icon: "📍",
    color: "#ff8844",
    desc: "Station coordinates from the API are validated and enriched. Stations with missing or imprecise coordinates are resolved using country centroid fallback, then jittered slightly to prevent exact coordinate stacking for dense countries like Germany and USA.",
    tech: ["Coordinate validation", "Country centroid fallback", "Coordinate jitter", "Dense-country deduplication"],
  },
  {
    n: "03",
    title: "Genre / Language Tagging",
    icon: "🏷",
    color: "#cc44ff",
    desc: "Free-text genre tags from Radio-Browser are normalized into canonical genre buckets (Pop, Rock, Jazz, Classical, News, Talk, Electronic, World) using a keyword matching dictionary. Language codes are mapped to ISO 639-1 for consistent filtering.",
    tech: ["Tag normalization", "Keyword genre mapping", "ISO 639-1 languages", "8 canonical genre buckets"],
  },
  {
    n: "04",
    title: "Audio Stream Validation",
    icon: "🔊",
    color: "#44ff88",
    desc: "A periodic server-side health checker performs HEAD requests on stream URLs to detect dead or redirected streams. Stations with failed health checks are flagged with reduced confidence scores and visually de-emphasized on the globe.",
    tech: ["HEAD request health check", "Redirect resolution", "Confidence scoring", "Dead stream flagging"],
  },
  {
    n: "05",
    title: "Cluster Density Computation",
    icon: "🔵",
    color: "#33ccdd",
    desc: "Station density per country is computed and used to generate heatmap overlay data at the country level. High-density clusters (Germany: 3,000+, USA: 8,000+) are progressively disclosed at zoom levels to avoid overplotting on the globe.",
    tech: ["Country density counts", "Progressive zoom disclosure", "Cluster heatmap", "Anti-overplot strategy"],
  },
  {
    n: "06",
    title: "Globe Rendering",
    icon: "🌐",
    color: "#ffcc00",
    desc: "Station dots are rendered on a globe.gl WebGL globe with color coding by genre and size scaling by vote count / listener popularity. Click any station to load the live audio stream via HTML5 Audio API with instant one-click playback.",
    tech: ["globe.gl + Three.js", "WebGL point layer", "HTML5 Audio API", "One-click stream playback"],
  },
]

const STATS = [
  { val: "26,000+",   label: "Radio stations",       icon: "📻" },
  { val: "246",       label: "Countries",             icon: "🌍" },
  { val: "Live",      label: "Streaming audio",       icon: "🔊" },
  { val: "Genre",     label: "Filter options",        icon: "🏷" },
  { val: "Language",  label: "Filter options",        icon: "💬" },
  { val: "1-click",   label: "Play any station",      icon: "▶️" },
  { val: "HTML5",     label: "Audio engine",          icon: "🎵" },
  { val: "Real-time", label: "Health monitoring",     icon: "⏱" },
]

const TECH_STACK = [
  { label: "Station data",   value: "Radio-Browser API",    icon: "📻" },
  { label: "Globe renderer", value: "globe.gl + Three.js",  icon: "🌐" },
  { label: "Audio engine",   value: "HTML5 Audio API",      icon: "🔊" },
  { label: "GPU rendering",  value: "Three.js / WebGL",     icon: "🖥" },
  { label: "Zone data",      value: "GeoJSON country shapes",icon: "📐" },
  { label: "Language codes", value: "ISO 639-1 mapping",    icon: "💬" },
  { label: "Framework",      value: "Next.js App Router",   icon: "⚡" },
  { label: "Stream check",   value: "HEAD request validator",icon: "🔁" },
]

const HIGHLIGHTS = [
  "26,000+ geolocated radio stations from 246 countries on a single globe",
  "One-click live audio streaming via HTML5 Audio API with instant playback",
  "Genre filtering across 8 canonical categories: Pop, Rock, Jazz, News, and more",
  "Language filtering with ISO 639-1 standard language code mapping",
  "Station density heatmap by country for regional radio landscape overview",
  "Favorites and recently played history stored in local session state",
]

export default function UC11DetailsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/demo/uc11/index.html"
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(51,204,221,0.3)" }}
          >
            ← Live Demo
          </Link>
          <span className="text-xs" style={{ color: "var(--muted)" }}>Use Case 11</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">📻</span>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Live Radio Stations on the Globe</h1>
        </div>
        <p className="text-lg max-w-3xl" style={{ color: "var(--muted)" }}>
          The world&apos;s radio stations — all 26,000+ of them — geolocated and playable from a single globe.
          Filter by genre or language, click any station, and start listening instantly.
        </p>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
        {STATS.map(f => (
          <div key={f.label} className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="text-2xl block mb-1">{f.icon}</span>
            <p className="text-xl font-bold mb-0.5" style={{ color: "var(--accent)" }}>{f.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{f.label}</p>
          </div>
        ))}
      </div>

      {/* ── Data pipeline ───────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          From Radio-Browser API metadata to live-streaming globe in six steps.
        </p>
        <div className="relative">
          <div className="absolute left-7 top-10 bottom-10 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, #ff664444, #44ff8844)" }} />
          <div className="flex flex-col gap-4">
            {PIPELINE_STEPS.map((step) => (
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
      <div className="mb-16 rounded-2xl p-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
          📻 Key Capabilities
        </h2>
        <ul className="space-y-3">
          {HIGHLIGHTS.map(h => (
            <li key={h} className="flex items-start gap-3">
              <span style={{ color: "var(--accent)" }} className="mt-0.5 flex-shrink-0">✓</span>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{h}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-8 text-center"
        style={{ background: "var(--accent-dim)", border: "1px solid rgba(51,204,221,0.3)" }}>
        <p className="text-2xl font-bold mb-3" style={{ color: "var(--text)" }}>
          Explore 26,000+ radio stations on the globe
        </p>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          Every internet radio station in the world, geolocated and playable in one click from a live 3D globe.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          Request a Demo
        </Link>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Live Space Launches & Rocket Tracker — Architecture | GRIP 3D",
  description: "Technical deep-dive: Launch Library 2 API integration, agency classification, orbit trajectory visualization, and globe.gl WebGL rendering for real-time rocket launch tracking.",
}

const PIPELINE = [
  {
    n: "01", icon: "\uD83D\uDE80", color: "#6366f1",
    title: "Launch Library 2 API",
    desc: "The Space Devs' Launch Library 2 is the most comprehensive open API for spaceflight data. It aggregates launch schedules, rocket configurations, mission details, and launch pad coordinates from every active space agency and commercial launch provider worldwide. Returns up to 50 upcoming launches with detailed metadata.",
    tech: ["Launch Library 2 v2.2.0", "50 upcoming launches", "Free tier (15 req/hr)", "Detailed mode"],
  },
  {
    n: "02", icon: "\uD83D\uDD04", color: "#3b82f6",
    title: "Next.js API Proxy",
    desc: "A server-side Route Handler proxies the Launch Library 2 API, normalizing each launch into a flat LaunchEvent schema with agency name, rocket configuration, mission type, orbit classification, and launch pad coordinates. 15-minute cache with stale-while-revalidate for optimal freshness without rate-limit issues.",
    tech: ["Route Handler", "LaunchEvent schema", "15 min cache", "Error fallback"],
  },
  {
    n: "03", icon: "\uD83C\uDF10", color: "#22c55e",
    title: "Agency Classification",
    desc: "Each launch is color-coded by agency: SpaceX (blue), CASC (red), ISRO (amber), Roscosmos (green), Arianespace (purple), Rocket Lab (cyan), ULA (slate), JAXA (pink), NASA (light blue). The classification enables instant visual identification of which agencies dominate the launch cadence.",
    tech: ["15+ agencies", "Color-coded markers", "Short name mapping", "Launch count per agency"],
  },
  {
    n: "04", icon: "\uD83D\uDCCD", color: "#f59e0b",
    title: "Launch Pad Deduplication",
    desc: "Multiple launches from the same pad are grouped into a single point with radius scaled by launch count. Cape Canaveral, Vandenberg, Baikonur, Jiuquan, and Sriharikota show as larger markers when they have more scheduled launches. Click any pad to see launch details.",
    tech: ["Pad grouping", "Radius by count", "Click-to-detail", "Hover tooltip"],
  },
  {
    n: "05", icon: "\uD83C\uDF0D", color: "#ef4444",
    title: "Globe Rendering",
    desc: "globe.gl renders launch pads as WebGL points on a night-sky earth with indigo atmosphere. Animated arc trajectories show approximate orbit paths: GEO/GTO arcs reach high altitude, SSO arcs angle poleward, LEO/ISS arcs stay low. Country borders from Natural Earth 110m provide geographic context.",
    tech: ["globe.gl WebGL", "Night earth texture", "Animated arc dashes", "177 country borders"],
  },
  {
    n: "06", icon: "\u23F1\uFE0F", color: "#a78bfa",
    title: "Live Countdown",
    desc: "A real-time countdown timer shows time remaining until the next scheduled launch, updating every second. The countdown displays days, hours, minutes, and seconds in a compact format. When a launch window arrives, the timer switches to 'LAUNCHED!' status.",
    tech: ["1-second updates", "Days/hours/min/sec", "Auto-detect next launch", "Status transitions"],
  },
]

const AGENCY_TABLE = [
  { agency: "SpaceX",       color: "#3b82f6", country: "USA",    rockets: "Falcon 9, Falcon Heavy, Starship" },
  { agency: "CASC",         color: "#ef4444", country: "China",  rockets: "Long March 2/3/5/7/8, Kuaizhou" },
  { agency: "ISRO",         color: "#f59e0b", country: "India",  rockets: "PSLV, GSLV Mk III (LVM3)" },
  { agency: "Roscosmos",    color: "#22c55e", country: "Russia", rockets: "Soyuz-2, Proton-M, Angara" },
  { agency: "Arianespace",  color: "#a78bfa", country: "Europe", rockets: "Ariane 6, Vega-C" },
  { agency: "Rocket Lab",   color: "#06b6d4", country: "USA/NZ", rockets: "Electron, Neutron" },
  { agency: "ULA",          color: "#64748b", country: "USA",    rockets: "Atlas V, Vulcan Centaur" },
  { agency: "JAXA",         color: "#f472b6", country: "Japan",  rockets: "H3, Epsilon S" },
  { agency: "NASA",         color: "#60a5fa", country: "USA",    rockets: "SLS (Artemis)" },
]

const DESIGN_HIGHLIGHTS = [
  {
    title: "Agency color-coding",
    desc: "15+ agencies each mapped to a distinct color, enabling instant visual identification of global launch cadence patterns and regional dominance.",
    color: "#3b82f6",
  },
  {
    title: "Orbit trajectory arcs",
    desc: "Animated dashed arcs from each pad represent approximate orbit paths. GEO arcs soar high, LEO arcs stay low, SSO arcs angle toward the poles.",
    color: "#6366f1",
  },
  {
    title: "Live countdown timer",
    desc: "Real-time T-minus countdown to the next scheduled launch, updating every second with days, hours, minutes, and seconds display.",
    color: "#22c55e",
  },
  {
    title: "Launch pad clustering",
    desc: "Multiple launches from the same pad are grouped into a single point with radius proportional to upcoming launch count, avoiding visual clutter.",
    color: "#f59e0b",
  },
]

const TECH = [
  { icon: "\uD83D\uDE80", label: "Data source",    value: "Launch Library 2 (The Space Devs)" },
  { icon: "\uD83D\uDD04", label: "Update rate",    value: "15 min auto-refresh" },
  { icon: "\uD83C\uDF10", label: "Agencies",       value: "15+ space agencies tracked" },
  { icon: "\uD83C\uDF0D", label: "Globe",          value: "globe.gl + WebGL" },
  { icon: "\uD83D\uDDFA\uFE0F", label: "Countries", value: "177 Natural Earth borders" },
  { icon: "\u23F1\uFE0F", label: "Countdown",      value: "Live T-minus timer (1s updates)" },
]

export default function UC28DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/uc28" className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity" style={{ color: "var(--muted)" }}>{"\u2190"} Back to live globe</Link>

      <div className="mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}>UC28 {"\u00B7"} Space Launches</span>
      </div>

      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>Live Space Launches & Rocket Tracker</h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>
        Real-time tracking of 50+ upcoming rocket launches from 15+ agencies worldwide, visualized on a WebGL globe with animated orbit trajectories, agency color-coding, live countdown timers, and 177 country borders. Powered by Launch Library 2, updated every 15 minutes.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-14">
        {[
          { val: "Launch Library 2",   label: "Data source" },
          { val: "15 min",             label: "Refresh cycle" },
          { val: "15+",                label: "Space agencies" },
          { val: "177+",               label: "Countries mapped" },
          { val: "50+",                label: "Upcoming launches" },
          { val: "Free",               label: "No API key required" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xl font-bold mb-1" style={{ color: "#6366f1" }}>{s.val}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Data Pipeline */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Data Pipeline</h2>
        <div className="flex flex-col gap-4">
          {PIPELINE.map((step, idx) => (
            <div key={step.n} className="flex gap-5 rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: step.color + "18", border: `1px solid ${step.color}40` }}>{step.icon}</div>
                {idx < PIPELINE.length - 1 && <div className="w-px flex-1 min-h-4" style={{ background: "var(--border)" }} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono opacity-50" style={{ color: step.color }}>{step.n}</span>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{step.title}</h3>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>{step.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {step.tech.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: step.color + "12", border: `1px solid ${step.color}28`, color: step.color }}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agency Breakdown */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Agency Breakdown</h2>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>Agency</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>Color</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>Country</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>Rockets</th>
              </tr>
            </thead>
            <tbody>
              {AGENCY_TABLE.map(a => (
                <tr key={a.agency} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>{a.agency}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block w-4 h-4 rounded-full align-middle mr-2" style={{ background: a.color }} />
                    <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{a.color}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{a.country}</td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{a.rockets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* About the Data Source */}
      <section className="mb-14 flex flex-col gap-4">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>About the Data Source</h2>

        <div className="rounded-xl p-6" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#6366f1" }}>Launch Library 2 (The Space Devs)</h3>
          <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--muted)" }}>
            Launch Library 2 is maintained by The Space Devs community and is the most comprehensive open API for spaceflight data. It aggregates launch schedules from every active space agency and commercial provider including SpaceX, NASA, ISRO, CNSA, Roscosmos, ESA, JAXA, Rocket Lab, ULA, and Blue Origin.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Each launch record includes rocket configuration, mission details, orbit classification (LEO, GEO, SSO, ISS), launch pad coordinates, agency metadata, and status tracking (Go, TBD, TBC, Success, Failure). The free tier allows 15 requests per hour, which is sufficient for 15-minute polling.
          </p>
        </div>
      </section>

      {/* Design Highlights */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Design Highlights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DESIGN_HIGHLIGHTS.map(h => (
            <div key={h.title} className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-2 h-2 rounded-full mb-3" style={{ background: h.color }} />
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>{h.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH.map(t => (
            <div key={t.label} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{t.label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Link href="/uc28" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#6366f1", color: "#fff" }}>{"\u2190"} Back to live globe</Link>
        <Link href="/use-cases" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>All use cases</Link>
      </div>
    </div>
  )
}

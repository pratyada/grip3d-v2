import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 Globe — Technical Details — GRIP 3D",
  description:
    "Technical deep-dive into the FIFA World Cup 2026 Globe: 16 stadiums, 48 teams, fan travel corridors, match schedule, and WebGL globe rendering with globe.gl.",
}

// ── Data ───────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total matches", value: "104", icon: "\u26BD" },
  { label: "Host venues", value: "16", icon: "\u{1F3DF}\uFE0F" },
  { label: "Qualified teams", value: "48", icon: "\u{1F30D}" },
  { label: "Host nations", value: "3", icon: "\u{1F3F3}\uFE0F" },
  { label: "Tournament days", value: "39", icon: "\u{1F4C5}" },
  { label: "Expected tickets", value: "~5.5M", icon: "\u{1F3AB}" },
  { label: "Fan corridors mapped", value: "21", icon: "\u2708\uFE0F" },
  { label: "Total seat capacity", value: "1.1M+", icon: "\u{1F4BA}" },
]

const PIPELINE_STEPS = [
  {
    n: "01",
    title: "FIFA Match Calendar API",
    icon: "\u26BD",
    color: "#22c55e",
    desc: "The FIFA API provides real-time match data for all 104 World Cup fixtures — schedules, scores, team info, venue assignments, and match status (scheduled/live/finished). Our API route fetches and caches this data with 5-minute revalidation.",
    tech: ["FIFA v3 Calendar API", "300s revalidation", "104 match fixtures", "Real-time scores"],
  },
  {
    n: "02",
    title: "Stadium Geolocation",
    icon: "\u{1F3DF}\uFE0F",
    color: "#3b82f6",
    desc: "All 16 host stadiums are precisely geolocated with WGS-84 coordinates, capacity data, match counts, and country assignment. Stadiums render as glowing points proportional to seating capacity, colour-coded by host nation (blue=USA, green=Mexico, red=Canada).",
    tech: ["16 verified coordinates", "WGS-84 datum", "Capacity-scaled radius", "Country colour coding"],
  },
  {
    n: "03",
    title: "Fan Travel Corridors",
    icon: "\u2708\uFE0F",
    color: "#f59e0b",
    desc: "21 major fan travel corridors are modelled as animated great-circle arcs connecting supporter origin countries to destination host cities. Arc width reflects expected travel volume (high/medium/low) based on team popularity and geographic proximity.",
    tech: ["21 corridor arcs", "Great-circle paths", "Volume-weighted stroke", "Animated dash pattern"],
  },
  {
    n: "04",
    title: "48-Team Qualified Nations",
    icon: "\u{1F30D}",
    color: "#a78bfa",
    desc: "All 48 qualified nations are mapped at their capital cities with team colours and group assignments. The choropleth layer highlights qualified countries on the globe with team-coloured borders and translucent fills, while non-qualified nations remain dark.",
    tech: ["48 team markers", "Group assignments A-L", "6 confederation regions", "Choropleth fill"],
  },
  {
    n: "05",
    title: "Country Borders (TopoJSON)",
    icon: "\u{1F5FA}\uFE0F",
    color: "#06b6d4",
    desc: "Country polygons from Natural Earth / TopoJSON 110m provide interactive borders with hover and click events. Host nations and qualified teams are visually distinguished through colour-coded strokes and fills. Clicking reveals country-level stats.",
    tech: ["TopoJSON 110m boundaries", "Interactive hover/click", "Host nation highlights", "Country drill-down"],
  },
  {
    n: "06",
    title: "WebGL Globe Rendering",
    icon: "\u{1F5A5}\uFE0F",
    color: "#22c55e",
    desc: "The globe uses a night-sky Earth texture with green football-pitch atmosphere, bump-mapped terrain, and smooth orbital controls. Four view modes — Stadiums, Fan Travel, Teams, and Matches — dynamically switch between points, arcs, and choropleth layers.",
    tech: ["globe.gl + Three.js", "Night Earth texture", "Green atmosphere", "4 view modes"],
  },
]

const STADIUMS_TABLE = [
  { name: "Estadio Azteca", city: "Mexico City", country: "MEX", capacity: 87523, matches: 7 },
  { name: "MetLife Stadium", city: "East Rutherford, NJ", country: "USA", capacity: 82500, matches: 8 },
  { name: "AT&T Stadium", city: "Arlington, TX", country: "USA", capacity: 80000, matches: 8 },
  { name: "Arrowhead Stadium", city: "Kansas City, MO", country: "USA", capacity: 76416, matches: 6 },
  { name: "NRG Stadium", city: "Houston, TX", country: "USA", capacity: 72220, matches: 7 },
  { name: "Mercedes-Benz Stadium", city: "Atlanta, GA", country: "USA", capacity: 71000, matches: 6 },
  { name: "SoFi Stadium", city: "Los Angeles, CA", country: "USA", capacity: 70240, matches: 7 },
  { name: "Lincoln Financial Field", city: "Philadelphia, PA", country: "USA", capacity: 69176, matches: 6 },
  { name: "Lumen Field", city: "Seattle, WA", country: "USA", capacity: 68740, matches: 6 },
  { name: "Levi's Stadium", city: "Santa Clara, CA", country: "USA", capacity: 68500, matches: 6 },
  { name: "Gillette Stadium", city: "Foxborough, MA", country: "USA", capacity: 65878, matches: 6 },
  { name: "Hard Rock Stadium", city: "Miami Gardens, FL", country: "USA", capacity: 64767, matches: 7 },
  { name: "BC Place", city: "Vancouver", country: "CAN", capacity: 54500, matches: 6 },
  { name: "Estadio BBVA", city: "Monterrey", country: "MEX", capacity: 53500, matches: 6 },
  { name: "Estadio Akron", city: "Guadalajara", country: "MEX", capacity: 49850, matches: 6 },
  { name: "BMO Field", city: "Toronto", country: "CAN", capacity: 30000, matches: 6 },
]

const DESIGN_HIGHLIGHTS = [
  "Green football-pitch atmosphere on a night-sky globe for immersive sports visualization",
  "Capacity-scaled stadium points — larger venues appear as bigger glowing markers",
  "Animated great-circle fan travel arcs with volume-weighted stroke width",
  "Country choropleth highlighting 48 qualified nations in their team colours",
  "Real-time countdown timer to the June 11, 2026 kickoff",
  "ESRI satellite imagery tiles for stadium aerial views on selection",
  "Four distinct view modes: Stadiums, Fan Travel, Teams, Matches",
  "Scrolling ticker tape with tournament statistics",
]

const TECH_STACK = [
  { name: "globe.gl", role: "WebGL globe engine with Three.js" },
  { name: "Next.js 15", role: "App Router, API routes, SSR metadata" },
  { name: "TypeScript", role: "Full type safety across data layers" },
  { name: "TopoJSON", role: "Country border polygons (110m resolution)" },
  { name: "FIFA API", role: "Real-time match calendar and scores" },
  { name: "ESRI World Imagery", role: "Satellite tiles for stadium views" },
  { name: "Tailwind CSS", role: "Utility-first responsive styling" },
]

// ── Component ──────────────────────────────────────────────────────────────────

export default function UC31DetailsPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <Link href="/uc31" className="inline-flex items-center gap-1.5 text-sm text-green-400/70 hover:text-green-400 mb-6 transition-colors">&larr; Back to Globe</Link>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="mr-3">{"\u26BD"}</span>
            FIFA World Cup 2026
          </h1>
          <p className="mt-4 text-lg text-white/50 max-w-3xl">
            Interactive 3D globe tracking the biggest sporting event in history — 104 matches across 16 stadiums in 3 countries, with fan travel corridors, 48 qualified nations, and real-time match data.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["globe.gl", "FIFA API", "TopoJSON", "ESRI Imagery", "WebGL", "Real-Time"].map((t) => (
              <span key={t} className="px-2.5 py-1 text-xs rounded-full bg-green-500/10 text-green-400/80 border border-green-500/20">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">Key Numbers</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-green-400">{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-8">Data Pipeline</h2>
        <div className="space-y-6">
          {PIPELINE_STEPS.map((step) => (
            <div key={step.n} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: step.color + "20", color: step.color }}>{step.n}</span>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {step.tech.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: step.color + "15", color: step.color + "cc", border: `1px solid ${step.color}30` }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stadiums table ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-8">{"\u{1F3DF}\uFE0F"} 16 Host Stadiums</h2>
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.03)" }}>
                <th className="px-4 py-3">Stadium</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3 text-right">Capacity</th>
                <th className="px-4 py-3 text-right">Matches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {STADIUMS_TABLE.map((s) => (
                <tr key={s.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 font-medium text-white/90">{s.name}</td>
                  <td className="px-4 py-2.5 text-white/50">{s.city}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-1.5 py-0.5 text-[10px] rounded font-bold" style={{
                      background: s.country === "USA" ? "#3b82f620" : s.country === "MEX" ? "#22c55e20" : "#dc262620",
                      color: s.country === "USA" ? "#3b82f6" : s.country === "MEX" ? "#22c55e" : "#dc2626",
                    }}>{s.country}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-white/70 font-mono">{s.capacity.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-white/50">{s.matches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Design highlights ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-8">Design Highlights</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {DESIGN_HIGHLIGHTS.map((h, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-green-400/60 mt-0.5">{"\u2713"}</span>
              <span className="text-sm text-white/60">{h}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-8">Tech Stack</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TECH_STACK.map((t) => (
            <div key={t.name} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-sm font-bold text-green-400">{t.name}</div>
              <div className="text-xs text-white/40 mt-1">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center">
        <Link href="/uc31" className="text-sm text-green-400/70 hover:text-green-400 transition-colors">&larr; Back to FIFA World Cup 2026 Globe</Link>
      </footer>
    </main>
  )
}

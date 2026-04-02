import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Submarine Internet Cables — Architecture · GRIP 3D",
  description: "Technical deep-dive: TeleGeography public GeoJSON, MultiLineString segment flattening, globe.gl pathsData cable rendering, and landing station point visualisation.",
}

const PIPELINE = [
  { n:"01", icon:"📡", color:"#33ccdd", title:"TeleGeography Public GeoJSON",
    desc:"TeleGeography maintains the authoritative public database of submarine cable infrastructure. Their GitHub-hosted GeoJSON files contain cable geometry (MultiLineString), ownership, length, ready-for-service (RFS) year, and landing point coordinates. The data is freely available with no API key.",
    tech:["TeleGeography cable-geo.json","landing-point-geo.json","No API key required","Refreshed periodically"] },
  { n:"02", icon:"🔁", color:"#5588ff", title:"Server-Side Proxy & Flattening",
    desc:"A Next.js Route Handler fetches both GeoJSON files in parallel, decomposes MultiLineString cables into individual LineString segments, thins coordinate arrays by keeping every 3rd point (preserving cable route shape while reducing payload), and extracts key metadata per segment.",
    tech:["Parallel fetch","MultiLineString → segments","Coordinate thinning (3×)","24 h edge cache"] },
  { n:"03", icon:"🔬", color:"#44ff88", title:"Ocean Region Classification",
    desc:"Each segment is classified into a named ocean region (Pacific, Atlantic, Indian, Arctic, Other) based on the average longitude of its coordinates. Pacific cables that cross the anti-meridian are detected by their large longitude spread (> 90°).",
    tech:["Average-coordinate heuristic","Anti-meridian spread detection","5 ocean regions","Client-side filter"] },
  { n:"04", icon:"🖥", color:"#ffcc44", title:"Globe.gl Path + Point Rendering",
    desc:"Cable segments are rendered using globe.gl's built-in `pathsData` API which draws geodesic paths on the globe surface — no Three.js particle system needed. Each path's colour comes from TeleGeography's own cable colour palette. Landing stations use globe.gl's `pointsData` as flat white dots. Click handlers are provided by globe.gl natively.",
    tech:["globe.gl pathsData","globe.gl pointsData","TeleGeography cable colours","onPathClick / onPointClick callbacks"] },
]

const FACTS = [
  { val:"500+",      label:"Active submarine cables worldwide" },
  { val:"1.3M km",   label:"Total combined cable length" },
  { val:"~95%",      label:"Of international internet traffic" },
  { val:"1,200+",    label:"Cable landing stations" },
  { val:"25 years",  label:"Average cable design life" },
  { val:"$500M+",    label:"Typical transoceanic cable cost" },
]

export default function UC19DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/uc19" className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100" style={{ color:"var(--muted)" }}>← Back to cable map</Link>
      <div className="mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background:"rgba(51,204,221,0.12)", color:"var(--accent)", border:"1px solid rgba(51,204,221,0.3)" }}>UC19 · Submarine Cables</span>
      </div>
      <h1 className="text-4xl font-bold mb-4" style={{ color:"var(--text)" }}>Submarine Internet Cables</h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color:"var(--muted)" }}>The hidden backbone of the internet — 500+ submarine cables carrying 95% of international data traffic, visualised on a 3D globe using TeleGeography's public GeoJSON dataset and globe.gl's native geodesic path rendering.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-14">
        {FACTS.map(s=>(
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
            <p className="text-xl font-bold mb-1" style={{ color:"var(--accent)" }}>{s.val}</p>
            <p className="text-xs" style={{ color:"var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color:"var(--text)" }}>Data Pipeline</h2>
        <div className="flex flex-col gap-4">
          {PIPELINE.map((step, idx) => (
            <div key={step.n} className="flex gap-5 rounded-xl p-5" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background:step.color+"18", border:`1px solid ${step.color}40` }}>{step.icon}</div>
                {idx < PIPELINE.length-1 && <div className="w-px flex-1 min-h-4" style={{ background:"var(--border)" }} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono opacity-50" style={{ color:step.color }}>{step.n}</span>
                  <h3 className="text-sm font-semibold" style={{ color:"var(--text)" }}>{step.title}</h3>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color:"var(--muted)" }}>{step.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {step.tech.map(t=><span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background:step.color+"12", border:`1px solid ${step.color}28`, color:step.color }}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <div className="rounded-xl p-6" style={{ background:"rgba(255,200,0,0.04)", border:"1px solid rgba(255,200,0,0.2)" }}>
          <h2 className="text-xl font-bold mb-3" style={{ color:"#ffcc44" }}>⚠️ Cable Vulnerability</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color:"var(--muted)" }}>Despite their critical importance, submarine cables are surprisingly fragile. The most common causes of damage are ship anchors and fishing trawls in shallow coastal zones, followed by submarine landslides and earthquakes in deeper water. Notable incidents include the 2022 Hunga Tonga volcanic eruption severing Tonga's only internet cable, and the 2006 Taiwan earthquake damaging multiple cables across Southeast Asia.</p>
          <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>Cable repair ships — of which there are fewer than 60 worldwide — can take weeks to locate a fault at depths of up to 8,000 metres and complete repairs, leaving affected regions with severely degraded internet access.</p>
        </div>
      </section>

      <div className="flex gap-3">
        <Link href="/uc19" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--accent)", color:"#000" }}>← Back to cable map</Link>
        <Link href="/use-cases" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--surface)", color:"var(--text)", border:"1px solid var(--border)" }}>All use cases</Link>
      </div>
    </div>
  )
}

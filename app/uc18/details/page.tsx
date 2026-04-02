import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Active Wildfires — Architecture · GRIP 3D",
  description: "Technical deep-dive: NASA EONET v3 API, GeoJSON wildfire event parsing, geographic region classification, and Three.js fire-sprite WebGL rendering.",
}

const PIPELINE = [
  { n:"01", icon:"🛰", color:"#ff4444", title:"NASA EONET v3 API",
    desc:"NASA's Earth Observatory Natural Event Tracker (EONET) aggregates natural hazard events from authoritative sources including InciWeb, USGS, NOAA, and ESA. The GeoJSON endpoint for wildfires returns active, open events with geographic coordinates and source links — no API key required.",
    tech:["NASA EONET v3","GeoJSON FeatureCollection","No API key","InciWeb · USGS · NOAA sources"] },
  { n:"02", icon:"🔁", color:"#ff6600", title:"Next.js API Proxy",
    desc:"A server-side Route Handler proxies the EONET request with 15-minute caching — wildfires are updated by NASA as events are confirmed and resolved, so 15-minute refresh is appropriate to capture new detections without overloading the upstream API.",
    tech:["Next.js Route Handler","15 min edge cache","Graceful error fallback","Stale-while-revalidate"] },
  { n:"03", icon:"🔬", color:"#ff8800", title:"GeoJSON Parsing & Classification",
    desc:"Each GeoJSON feature's geometry is parsed (Point or Polygon centroid). Geographic region is derived from lat/lng bounding-box rules covering North America, South America, Europe, Africa, Asia, and Oceania. Each fire gets a region-specific colour.",
    tech:["GeoJSON Point / Polygon","Centroid extraction","Bounding-box region detection","Source URL extraction"] },
  { n:"04", icon:"🖥", color:"#ffcc44", title:"WebGL Fire-Sprite Rendering",
    desc:"Each fire is rendered as a large (10px) canvas-drawn fire-glow sprite in a Three.js BufferGeometry particle system. A pulsing opacity animation gives the impression of flickering flames. Fire sprites are deliberately large to ensure visibility on the globe.",
    tech:["Three.js BufferGeometry","48×48 fire-glow canvas sprite","Pulsing opacity animation","Raycaster click detection"] },
]

const TECH = [
  { icon:"🛰", label:"Data source",  value:"NASA EONET v3 (open events)" },
  { icon:"🔄", label:"Update rate",  value:"15 min cache refresh" },
  { icon:"🔥", label:"Coverage",     value:"Global active wildfire events" },
  { icon:"🌐", label:"Globe",        value:"globe.gl + Three.js WebGL" },
  { icon:"🌍", label:"Earth texture",value:"NASA Blue Marble Day" },
  { icon:"📍", label:"Click",        value:"Fire name, region, date, source link" },
]

export default function UC18DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/uc18" className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity" style={{ color:"var(--muted)" }}>← Back to live globe</Link>
      <div className="mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background:"rgba(255,80,0,0.12)", color:"#ff6600", border:"1px solid rgba(255,80,0,0.3)" }}>UC18 · Active Wildfires</span>
      </div>
      <h1 className="text-4xl font-bold mb-4" style={{ color:"var(--text)" }}>Active Wildfires</h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color:"var(--muted)" }}>Real-time satellite-confirmed wildfire events from NASA EONET, visualised as glowing fire sprites on a WebGL globe. Filter by geographic region and click any fire for event details and source agency links.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {[{val:"NASA",label:"EONET data source"},{val:"15 min",label:"Refresh interval"},{val:"7",label:"Geographic regions"},{val:"Free",label:"No API key required"}].map(s=>(
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
            <p className="text-2xl font-bold mb-1" style={{ color:"#ff6600" }}>{s.val}</p>
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
        <div className="rounded-xl p-6" style={{ background:"rgba(255,80,0,0.05)", border:"1px solid rgba(255,80,0,0.2)" }}>
          <h2 className="text-xl font-bold mb-3" style={{ color:"#ff6600" }}>About NASA EONET</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color:"var(--muted)" }}>The Earth Observatory Natural Event Tracker (EONET) is maintained by NASA's Earth Observatory team. It aggregates natural hazard event data from partner agencies including InciWeb (wildfire incident reporting), USGS, NOAA, and ESA Copernicus Emergency Management Service.</p>
          <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>Events are confirmed by human analysts before being added to the EONET catalogue, which means the dataset reflects significant, satellite-detectable fires rather than every small fire. Active events remain in the feed until officially closed by the reporting agency.</p>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color:"var(--text)" }}>Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH.map(t=>(
            <div key={t.label} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
              <span className="text-xl">{t.icon}</span>
              <div><p className="text-xs" style={{ color:"var(--muted)" }}>{t.label}</p><p className="text-sm font-semibold" style={{ color:"var(--text)" }}>{t.value}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Link href="/uc18" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"#ff4444", color:"#fff" }}>← Back to live globe</Link>
        <Link href="/use-cases" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--surface)", color:"var(--text)", border:"1px solid var(--border)" }}>All use cases</Link>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Live Aircraft Traffic — Architecture · GRIP 3D",
  description: "Technical deep-dive: OpenSky Network REST API, real-time state vector parsing, altitude-band classification, and Three.js WebGL particle rendering for global flight tracking.",
}

const PIPELINE = [
  { n:"01", icon:"📡", color:"#4488ff", title:"OpenSky Network API",
    desc:"The OpenSky Network is a community-driven receiver network that aggregates ADS-B, MLAT, and FLARM transponder signals from thousands of ground stations worldwide. The REST endpoint `states/all` returns all currently tracked aircraft state vectors — latitude, longitude, altitude, speed, heading, and vertical rate.",
    tech:["OpenSky REST API","ADS-B / MLAT / FLARM","Anonymous access","State vectors"] },
  { n:"02", icon:"🔁", color:"#33ccdd", title:"Next.js API Proxy",
    desc:"A server-side Route Handler proxies OpenSky requests with 60-second edge caching, preventing client-side CORS issues and aggregating concurrent user requests into a single upstream call that respects OpenSky's anonymous rate limits.",
    tech:["Next.js Route Handler","60 s edge cache","Rate-limit protection","Stale-while-revalidate"] },
  { n:"03", icon:"🔬", color:"#ff8844", title:"State Vector Parsing",
    desc:"Each state vector is a fixed-index array of 17 fields. Null values (common for anonymous access) are handled gracefully. Aircraft without valid lat/lng are skipped. Altitude band is derived from baro_altitude and the on_ground flag.",
    tech:["Fixed-index array parsing","Null-safe field access","Altitude band assignment","On-ground detection"] },
  { n:"04", icon:"🖥", color:"#44ff88", title:"WebGL Globe Rendering",
    desc:"Valid positions are loaded into a Three.js BufferGeometry particle system as a single draw call. Vertex colours encode altitude band. Particles pulse via a requestAnimationFrame opacity loop. A Three.js Raycaster handles click-to-select interactions.",
    tech:["Three.js BufferGeometry","Vertex colour coding","Raycaster click detection","60 s position refresh"] },
]

const TECH = [
  { icon:"📡", label:"Data source",    value:"OpenSky Network (community ADS-B)" },
  { icon:"🔄", label:"Update rate",    value:"60 s (cached at edge)" },
  { icon:"✈️", label:"Aircraft",       value:"~10,000+ global state vectors" },
  { icon:"🌐", label:"Globe",          value:"globe.gl + Three.js WebGL" },
  { icon:"⚡", label:"Framework",      value:"Next.js 16 App Router" },
  { icon:"📍", label:"Click",          value:"Raycaster → callsign, speed, altitude, heading" },
]

export default function UC17DetailsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/uc17" className="inline-flex items-center gap-1.5 text-xs mb-6 opacity-60 hover:opacity-100 transition-opacity" style={{ color: "var(--muted)" }}>← Back to live globe</Link>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: "rgba(68,136,255,0.12)", color: "#4488ff", border: "1px solid rgba(68,136,255,0.3)" }}>UC17 · Aircraft Traffic</span>
      </div>
      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>Live Aircraft Traffic</h1>
      <p className="text-lg max-w-3xl mb-10" style={{ color: "var(--muted)" }}>Real-time global flight tracking powered by the OpenSky Network community ADS-B receiver network. Every airborne aircraft rendered on a WebGL globe, colour-coded by altitude band.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {[{val:"10,000+",label:"State vectors/request"},{val:"60 s",label:"Update interval"},{val:"4",label:"Altitude bands"},{val:"Free",label:"No API key required"}].map(s=>(
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
            <p className="text-2xl font-bold mb-1" style={{ color:"#4488ff" }}>{s.val}</p>
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
        <h2 className="text-2xl font-bold mb-4" style={{ color:"var(--text)" }}>About OpenSky Network</h2>
        <div className="rounded-xl p-5" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
          <p className="text-sm leading-relaxed mb-3" style={{ color:"var(--muted)" }}>The OpenSky Network is a non-profit community initiative to provide open access to flight surveillance data. It operates thousands of ground-based ADS-B receivers contributed by volunteers worldwide, supplemented by MLAT (multilateration) and FLARM (general aviation) signals.</p>
          <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>Anonymous access provides approximately 100 API credits per day. Each `states/all` call returns the current snapshot of all tracked aircraft with a slight delay. For production use, registered users receive higher rate limits and historical data access.</p>
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
        <Link href="/uc17" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"#4488ff", color:"#fff" }}>← Back to live globe</Link>
        <Link href="/use-cases" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--surface)", color:"var(--text)", border:"1px solid var(--border)" }}>All use cases</Link>
      </div>
    </div>
  )
}
